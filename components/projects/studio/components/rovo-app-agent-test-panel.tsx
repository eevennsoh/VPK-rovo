"use client";

// oxlint-disable react-doctor/no-event-handler -- Effects in this file bridge external systems, animation/media state, timers, or parent-controlled state rather than user event handlers.
// oxlint-disable react-doctor/no-multi-comp -- The test panel colocates tightly coupled tab and payload subviews so ChatPanel custom tabs share one local contract.

import Image from "next/image";
import { Fragment, useEffect, useMemo, useState, type ReactElement } from "react";

import { RovoChatProvider, useRovoChat, type StudioSessionAgentEntry } from "@/app/contexts/context-rovo-chat";
import {
	DEFAULT_STARTER_ICON,
	getStarterIcon,
	type StarterIconKey,
} from "@/components/blocks/conversation-starters";
import { AgentAutomationFlowCover } from "@/components/blocks/triggers/components/agent-automation-flow-cover";
import { getAutomationRuleSecondary } from "@/components/blocks/triggers/components/manage-triggers-dialog";
import { renderAgentTriggerProviderTileIcon, TriggerConfigAutomationDialog } from "@/components/blocks/triggers/page";
import {
	getAgentAutomationRuleLabel,
	getAgentTriggerReadableLabel,
	getTriggerProvider,
	type AgentAutomationRule,
	type AgentTriggerValue,
} from "@/components/blocks/triggers/data/trigger-catalog";
import ChatPanel, { type ChatPanelAgentVersionOption } from "@/components/projects/sidebar-chat/page";
import type { RovoAgentProfile } from "@/app/data/directory/agents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lozenge } from "@/components/ui/lozenge";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import type { RovoDataParts } from "@/lib/rovo-ui-messages";
import { resolveConversationStarterVisualIdentity, type RovoSuggestion } from "@/lib/rovo-suggestions";
import ArrowLeftIcon from "@atlaskit/icon/core/arrow-left";
import AutomationIcon from "@atlaskit/icon/core/automation";
import CheckMarkIcon from "@atlaskit/icon/core/check-mark";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import RefreshIcon from "@atlaskit/icon/core/refresh";

const AGENT_TEST_MAX_CONVERSATION_STARTERS = 3;
const AGENT_TEST_CALLBACK_DELAY_MS = 1600;
const AGENT_TEST_CHAT_ILLUSTRATION_LIGHT_SRC = "/illustration-spot/general/chat-6/light.svg";
const AGENT_TEST_CHAT_ILLUSTRATION_DARK_SRC = "/illustration-spot/general/chat-6/dark.svg";
const AGENT_TEST_AUTOMATION_ILLUSTRATION_LIGHT_SRC = "/illustration-spot/general/automation-2/light.svg";
const AGENT_TEST_AUTOMATION_ILLUSTRATION_DARK_SRC = "/illustration-spot/general/automation-2/dark.svg";

export interface AgentTestPanelProps {
	entry: StudioSessionAgentEntry;
	className?: string;
}

type AgentResultPayload = RovoDataParts["agent-result"] & Record<string, unknown>;

interface AgentTestVersionOption extends ChatPanelAgentVersionOption {
	result: RovoDataParts["agent-result"];
}

function getNonEmptyString(value: unknown): string | null {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : null;
}

function getPayloadString(
	payload: Record<string, unknown>,
	keys: ReadonlyArray<string>
): string | null {
	for (const key of keys) {
		const value = getNonEmptyString(payload[key]);
		if (value) {
			return value;
		}
	}

	return null;
}

function getPayloadStringArray(
	payload: Record<string, unknown>,
	keys: ReadonlyArray<string>
): readonly string[] {
	for (const key of keys) {
		const value = payload[key];
		if (!Array.isArray(value)) {
			continue;
		}

		return value
			.map(getNonEmptyString)
			.filter((item): item is string => item !== null);
	}

	return [];
}

function getConversationStarterLabel(value: unknown): string | null {
	const directLabel = getNonEmptyString(value);
	if (directLabel) {
		return directLabel;
	}

	if (!value || typeof value !== "object" || Array.isArray(value)) {
		return null;
	}

	return getPayloadString(value as Record<string, unknown>, ["label", "prompt", "text", "title"]);
}

function getConversationStarterLabels(payload: AgentResultPayload): string[] {
	const rawStarters = payload.conversationStarters ?? payload.starters ?? payload.suggestions;
	if (!Array.isArray(rawStarters)) {
		return [];
	}

	const seenLabels = new Set<string>();
	const labels: string[] = [];
	for (const rawStarter of rawStarters) {
		const label = getConversationStarterLabel(rawStarter);
		if (!label) {
			continue;
		}

		const normalizedLabel = label.toLowerCase();
		if (seenLabels.has(normalizedLabel)) {
			continue;
		}

		seenLabels.add(normalizedLabel);
		labels.push(label);
		if (labels.length >= AGENT_TEST_MAX_CONVERSATION_STARTERS) {
			break;
		}
	}

	return labels;
}

function createAgentTestStarter(
	agentId: string,
	label: string,
	index: number,
	context: { agentName: string; byline: string; description?: string | null },
	iconKey?: string,
): RovoSuggestion {
	return {
		id: `${agentId}-starter-${index + 1}`,
		icon: getStarterIcon((iconKey as StarterIconKey | undefined) ?? DEFAULT_STARTER_ICON),
		label,
		prompt: label,
		type: "skill",
		visualIdentity: resolveConversationStarterVisualIdentity({
			agentId,
			agentName: context.agentName,
			byline: context.byline,
			description: context.description ?? undefined,
			label,
		}),
	};
}

function createAgentTestContextDescription(input: {
	description?: string;
	instructions?: string;
	payload: AgentResultPayload;
	profile: Pick<RovoAgentProfile, "byline" | "name" | "starters">;
	versionLabel: string;
}): string {
	const tools = getPayloadStringArray(input.payload, ["tools", "skills"]);
	const trigger = getPayloadString(input.payload, ["trigger"]);
	const guardrail = getPayloadString(input.payload, ["guardrail", "constraints"]);
	const starterLabels = input.profile.starters.map((starter) => starter.prompt ?? starter.label);

	return [
		"[Selected agent test]",
		`Agent: ${input.profile.name}`,
		`Version: ${input.versionLabel}`,
		`Byline: ${input.profile.byline}`,
		input.description ? `Description: ${input.description}` : null,
		input.instructions ? `Instructions: ${input.instructions}` : null,
		trigger ? `Trigger: ${trigger}` : null,
		tools.length > 0 ? `Tools: ${tools.join(", ")}` : null,
		guardrail ? `Guardrail: ${guardrail}` : null,
		starterLabels.length > 0 ? "Conversation starters:" : null,
		...starterLabels.map((starter) => `- ${starter}`),
		"Answer as this selected session-created agent while using the existing Rovo chat capabilities and available context.",
		"[End selected agent test]",
	]
		.filter((line): line is string => Boolean(line))
		.join("\n");
}

function buildAgentTestProfile(
	entry: StudioSessionAgentEntry,
	result: RovoDataParts["agent-result"],
	versionLabel: string,
): RovoAgentProfile {
	const payload = result as AgentResultPayload;
	const id = `agent-test-${entry.profile.id}`;
	const name = getPayloadString(payload, ["name", "agentName", "title"]) ?? entry.profile.name ?? "Agent test";
	const byline = getPayloadString(payload, ["byline", "sourceLabel", "generatedBy", "source"]) ?? "Custom agent test";
	const avatarSrc = getPayloadString(payload, ["avatarSrc", "avatarUrl", "iconSrc"]) ?? entry.profile.avatarSrc;
	const description =
		getPayloadString(payload, ["description", "summary", "shortDescription"]) ??
		entry.profile.description;
	const instructions =
		getPayloadString(payload, ["instructions", "contextDescription", "context", "systemPrompt", "prompt"]) ??
		entry.profile.contextDescription;
	const starterIcons = getPayloadStringArray(payload, ["conversationStarterIcons", "starterIcons", "suggestionIcons"]);
	const starters = getConversationStarterLabels(payload).map((starter, index) =>
		createAgentTestStarter(id, starter, index, {
			agentName: name,
			byline,
			description,
		}, starterIcons[index])
	);

	return {
		id,
		name,
		byline,
		avatarSrc,
		description,
		starters,
		contextDescription: createAgentTestContextDescription({
			description,
			instructions,
			payload,
			profile: {
				byline,
				name,
				starters,
			},
			versionLabel,
		}),
	};
}

function getAgentTestVersionOptions(entry: StudioSessionAgentEntry): readonly AgentTestVersionOption[] {
	// Draft is always neutral gray; it is never the "current" published version.
	const options: AgentTestVersionOption[] = [{
		id: "latest",
		label: "Draft",
		variant: "neutral",
		result: entry.draftResult,
	}];

	// Each published/updated entry is a real version. Label it just "V{n}"
	// (no duplicate "Published V1" summary, no "- Agent published" suffix) and
	// flag the live published version as current so the dropdown can mark it.
	const publishedVersions = entry.versionHistory.filter((version) => version.kind === "publish" || version.kind === "update");
	for (const [versionIndex, version] of publishedVersions.entries()) {
		options.push({
			id: `history:${version.id}`,
			label: `V${version.version}`,
			variant: "success",
			sectionBreakBefore: versionIndex === 0,
			isCurrent: version.version === entry.publishedVersion,
			result: version.snapshot,
		});
	}

	return options;
}

type AgentTestSurface =
	| { kind: "start" }
	| { kind: "chat" }
	| { kind: "automation"; ruleId: string };

function AgentTestVersionSelect({
	onSelectVersion,
	selectedVersionId,
	versionOptions,
}: Readonly<{
	onSelectVersion: (versionId: string) => void;
	selectedVersionId: string;
	versionOptions: readonly ChatPanelAgentVersionOption[];
}>): ReactElement {
	const selectedVersion =
		versionOptions.find((version) => version.id === selectedVersionId) ??
		versionOptions[0];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				render={
					<Button
						aria-label="Switch test version"
						className="h-8 shrink-0 gap-1.5 px-2 text-sm font-medium text-text"
						type="button"
						variant="ghost"
					/>
				}
			>
				<Badge variant={selectedVersion?.variant ?? "neutral"}>
					{selectedVersion?.label ?? "Draft"}
				</Badge>
				<ChevronDownIcon label="" size="small" spacing="none" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" sideOffset={8}>
				<DropdownMenuGroup>
					{versionOptions.map((version) => (
						<Fragment key={version.id}>
							{version.sectionBreakBefore ? <DropdownMenuSeparator /> : null}
							<DropdownMenuItem
								onSelect={() => onSelectVersion(version.id)}
								className={cn((version.variant ?? "success") === "neutral" && "bg-popover sticky top-0 z-10")}
								elemAfter={version.id === selectedVersion?.id ? <CheckMarkIcon label="Selected" /> : undefined}
							>
								<span className="flex min-w-0 items-center gap-2">
									<Badge variant={version.variant ?? "success"}>{version.label}</Badge>
									{version.isCurrent ? (
										<span className="text-xs text-text-subtle">Current</span>
									) : null}
								</span>
							</DropdownMenuItem>
						</Fragment>
					))}
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function AgentTestSelectedHeader({
	onBack,
	onReset,
	onSelectVersion,
	selectedVersionId,
	title,
	versionOptions,
}: Readonly<{
	onBack: () => void;
	onReset: () => void;
	onSelectVersion: (versionId: string) => void;
	selectedVersionId: string;
	title: string;
	versionOptions: readonly ChatPanelAgentVersionOption[];
}>): ReactElement {
	return (
		<div className="flex shrink-0 items-center justify-between gap-3 py-3">
			<div className="flex min-w-0 items-center gap-2">
				<Button
					type="button"
					variant="ghost"
					size="default"
					className="shrink-0 gap-1.5"
					onClick={onBack}
				>
					<ArrowLeftIcon label="" size="small" spacing="none" />
					Back to testing options
				</Button>
				<div className="hidden h-4 w-px shrink-0 bg-border md:block" />
				<AgentTestVersionSelect
					onSelectVersion={onSelectVersion}
					selectedVersionId={selectedVersionId}
					versionOptions={versionOptions}
				/>
				<div className="hidden min-w-0 md:block">
					<h2 className="truncate text-sm font-semibold leading-5 text-text">
						{title}
					</h2>
				</div>
			</div>
			<Button
				type="button"
				variant="ghost"
				size="default"
				className="shrink-0 gap-1.5"
				onClick={onReset}
			>
				<RefreshIcon label="" size="small" spacing="none" />
				Reset
			</Button>
		</div>
	);
}

function AgentTestStartView({
	automationRules,
	onSelectAutomation,
	onSelectChat,
}: Readonly<{
	automationRules: readonly AgentAutomationRule[];
	onSelectAutomation: (ruleId: string) => void;
	onSelectChat: () => void;
}>): ReactElement {
	return (
		<div
			className="flex h-full min-h-0 items-center justify-center overflow-y-auto bg-surface px-4 py-10"
			data-testid="agent-test-start"
		>
			<div className="flex w-full max-w-xl flex-col gap-2">
				<span className="px-1 text-xs font-semibold text-text-subtle">Pick your testing options</span>
				<div className="w-full overflow-hidden rounded-3xl border border-border bg-surface">
					<AgentTestOptionRow
						onSelect={onSelectChat}
						testId="agent-test-chat-option"
						thumbnail={<AgentTestChatThumbnail />}
						title="Chat"
					/>
					{automationRules.length > 0 ? (
						automationRules.map((rule, ruleIndex) => (
							<AgentTestOptionRow
								key={rule.id}
								metadata={<AgentTestAutomationFlow rule={rule} />}
								onSelect={() => onSelectAutomation(rule.id)}
								testId={`agent-test-automation-option-${rule.id}`}
								thumbnail={<AgentTestAutomationThumbnail />}
								title={getAgentAutomationRuleLabel(rule, ruleIndex)}
							/>
						))
					) : (
						<AgentTestNoAutomationRow />
					)}
				</div>
			</div>
		</div>
	);
}

function AgentTestOptionRow({
	metadata,
	onSelect,
	testId,
	thumbnail,
	title,
}: Readonly<{
	metadata?: ReactElement;
	onSelect: () => void;
	testId: string;
	thumbnail: ReactElement;
	title: string;
}>): ReactElement {
	return (
		<Button
			aria-label={`Test ${title}`}
			className="h-auto w-full justify-start gap-4 rounded-none border-x-0 border-t-0 border-b border-border p-2 pr-4 text-left shadow-none last:border-b-0"
			data-testid={testId}
			onClick={onSelect}
			type="button"
			variant="ghost"
		>
			{thumbnail}
			<span className="flex min-w-0 flex-1 flex-col items-start justify-center gap-1">
				<span className="max-w-full truncate text-sm font-semibold leading-5 text-text">{title}</span>
				{metadata}
			</span>
			<span className="ml-auto flex size-6 shrink-0 items-center justify-center text-icon-subtle opacity-0 transition-opacity duration-normal ease-out group-hover/button:opacity-100 group-focus-visible/button:opacity-100">
				<ChevronRightIcon label="" color={token("color.icon.subtle")} size="small" spacing="none" />
			</span>
		</Button>
	);
}

function AgentTestChatThumbnail(): ReactElement {
	return (
		<span className="flex h-14 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface">
			<AgentTestThemeImage
				alt=""
				className="size-20 object-contain"
				darkSrc={AGENT_TEST_CHAT_ILLUSTRATION_DARK_SRC}
				height={80}
				lightSrc={AGENT_TEST_CHAT_ILLUSTRATION_LIGHT_SRC}
				width={80}
			/>
		</span>
	);
}

function AgentTestAutomationThumbnail({
	disabled = false,
	imageClassName,
}: Readonly<{
	disabled?: boolean;
	imageClassName?: string;
}> = {}): ReactElement {
	return (
		<span
			className={cn(
				"flex h-14 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-surface",
				disabled && "border-dashed",
			)}
		>
			<AgentTestThemeImage
				alt=""
				className={cn("size-10 object-contain", imageClassName)}
				darkSrc={AGENT_TEST_AUTOMATION_ILLUSTRATION_DARK_SRC}
				height={40}
				lightSrc={AGENT_TEST_AUTOMATION_ILLUSTRATION_LIGHT_SRC}
				width={40}
			/>
		</span>
	);
}

function AgentTestNoAutomationRow(): ReactElement {
	return (
		<div className="flex min-w-0 items-center gap-4 p-2 pr-4" data-testid="agent-test-no-automation-empty">
			<AgentTestAutomationThumbnail disabled imageClassName="grayscale opacity-(--opacity-disabled)" />
			<div className="min-w-0 flex-1">
				<div className="truncate text-sm font-semibold leading-5 text-text-disabled">No automations yet</div>
			</div>
		</div>
	);
}

function AgentTestAutomationFlow({
	rule,
}: Readonly<{
	rule: AgentAutomationRule;
}>): ReactElement {
	return (
		<AgentAutomationFlowCover
			aria-hidden={false}
			aria-label={getAutomationOptionMetadata(rule)}
			rootElement="span"
			triggers={rule.triggers}
		/>
	);
}

function getAutomationOptionMetadata(rule: AgentAutomationRule): string {
	const triggerLabels = rule.triggers
		.map((trigger) => getAgentTriggerReadableLabel(trigger).trim())
		.filter(Boolean);

	if (triggerLabels.length === 0) {
		return "No event triggers to agent instructions";
	}

	return `${triggerLabels.join(" and ")} to agent instructions`;
}

function AgentTestThemeImage({
	alt,
	className,
	darkSrc,
	height,
	lightSrc,
	width,
}: Readonly<{
	alt: string;
	className: string;
	darkSrc: string;
	height: number;
	lightSrc: string;
	width: number;
}>): ReactElement {
	return (
		<>
			<Image
				alt={alt}
				className={cn(className, "dark:hidden [[data-color-mode=dark]_&]:hidden")}
				height={height}
				src={lightSrc}
				width={width}
			/>
			<Image
				alt={alt}
				className={cn(className, "hidden dark:block [[data-color-mode=dark]_&]:block")}
				height={height}
				src={darkSrc}
				width={width}
			/>
		</>
	);
}

export function AgentTestAutomationDetailView({
	rule,
	ruleIndex,
}: Readonly<{
	rule: AgentAutomationRule;
	ruleIndex: number;
}>): ReactElement {
	const [testSelection, setTestSelection] = useState<AutomationTestSelection | null>(null);
	const [pendingSelection, setPendingSelection] = useState<AutomationTestSelection | null>(null);
	const [isEditOpen, setIsEditOpen] = useState(false);
	// Edits made in the in-situ "Edit automation" modal are reflected locally so
	// the test card updates without leaving the Test view (the test snapshot is
	// ephemeral, so a local override is the source of truth here).
	const [editedRule, setEditedRule] = useState<AgentAutomationRule | null>(null);
	const effectiveRule = editedRule ?? rule;
	const testResult = useMemo(() => {
		if (!testSelection) {
			return null;
		}

		if (effectiveRule.id !== testSelection.ruleId) {
			return null;
		}

		const trigger = effectiveRule.triggers.find((item) => item.id === testSelection.triggerId);
		return trigger ? createAutomationTestResult(effectiveRule, ruleIndex, trigger) : null;
	}, [effectiveRule, ruleIndex, testSelection]);

	useEffect(() => {
		if (!pendingSelection) {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			setTestSelection(pendingSelection);
			setPendingSelection(null);
		}, AGENT_TEST_CALLBACK_DELAY_MS);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [pendingSelection]);

	return (
		<div className="scroll-mask-top flex min-h-0 flex-1 items-start justify-center overflow-y-auto pb-6 pt-6">
			<div className="grid w-full max-w-[56rem] gap-4">
				<div className="grid">
					<AutomationTestCard
						attached={Boolean(testResult)}
						onEdit={() => setIsEditOpen(true)}
						onTest={(trigger) => {
							setTestSelection(null);
							setPendingSelection({ ruleId: effectiveRule.id, triggerId: trigger.id });
						}}
						pendingTriggerId={
							pendingSelection?.ruleId === effectiveRule.id ? pendingSelection.triggerId : null
						}
						rule={effectiveRule}
						ruleIndex={ruleIndex}
						testedTriggerId={testResult ? testSelection?.triggerId ?? null : null}
					/>
					{testResult ? (
						<div className="grid gap-4 rounded-b-xl border border-border bg-surface p-4">
							<TestJsonBlock title="Sample event payload" value={testResult.payload} />
							<TestJsonBlock title="Callback result" value={testResult.callback} />
						</div>
					) : null}
				</div>
				<TriggerConfigAutomationDialog
					automationRule={effectiveRule}
					onOpenChange={setIsEditOpen}
					onSave={(savedRule) => setEditedRule(savedRule)}
					open={isEditOpen}
				/>
			</div>
		</div>
	);
}

interface AutomationTestSelection {
	ruleId: string;
	triggerId: string;
}

interface AutomationTestResult {
	payload: Record<string, unknown>;
	callback: Record<string, unknown>;
}

function AutomationTestCard({
	attached = false,
	onEdit,
	onTest,
	pendingTriggerId,
	rule,
	ruleIndex,
	testedTriggerId,
}: Readonly<{
	attached?: boolean;
	onEdit?: () => void;
	onTest: (trigger: AgentTriggerValue) => void;
	pendingTriggerId: string | null;
	rule: AgentAutomationRule;
	ruleIndex: number;
	testedTriggerId: string | null;
}>): ReactElement {
	const title = getAgentAutomationRuleLabel(rule, ruleIndex);
	const secondary = getAutomationRuleSecondary(rule);
	const activeLabel = rule.enabled === false ? "Inactive" : "Active";
	const firstTriggerLabel = rule.triggers[0]
		? getAgentTriggerReadableLabel(rule.triggers[0])
		: "No event triggers";

	return (
		<div
			className={cn(
				"grid gap-4 rounded-xl border border-border bg-surface p-4",
				rule.triggers.length > 0 && "pb-0",
				attached && "rounded-b-none border-b-0",
			)}
		>
			<div className="grid gap-2">
				<div className="flex items-center justify-between gap-3">
					<AgentTestAutomationFlow rule={rule} />
					{onEdit ? (
						<Button
							className="shrink-0"
							onClick={onEdit}
							size="compact"
							type="button"
							variant="outline"
						>
							Edit
						</Button>
					) : null}
				</div>
				<div className="min-w-0">
					<div className="flex min-w-0 items-center gap-2">
						<h3 className="truncate text-sm font-medium leading-5 text-text">{title}</h3>
						<Lozenge className="shrink-0" variant={rule.enabled === false ? "neutral" : "success"}>
							{activeLabel}
						</Lozenge>
					</div>
					<p className="truncate text-xs leading-4 text-text-subtle">{secondary}</p>
					<p className="mt-2 truncate text-xs leading-4 text-text">
						Starts with {firstTriggerLabel}
					</p>
				</div>
			</div>
			{rule.triggers.length > 0 ? (
				<div className="grid">
					{rule.triggers.map((trigger) => (
						<AutomationTestEventRow
							key={trigger.id}
							isPending={pendingTriggerId === trigger.id}
							isTested={testedTriggerId === trigger.id}
							onTest={() => onTest(trigger)}
							trigger={trigger}
						/>
					))}
				</div>
			) : (
				<div className="rounded-lg border border-dashed border-border bg-bg-input p-3 text-sm text-text-subtle">
					No event triggers configured.
				</div>
			)}
		</div>
	);
}

function AutomationTestEventRow({
	isPending,
	isTested,
	onTest,
	trigger,
}: Readonly<{
	isPending: boolean;
	isTested: boolean;
	onTest: () => void;
	trigger: AgentTriggerValue;
}>): ReactElement {
	const provider = getTriggerProvider(trigger.providerId);
	const tileIcon = renderAgentTriggerProviderTileIcon(trigger);
	const label = getAgentTriggerReadableLabel(trigger);
	const connectionLabel = getConnectionTestLabel(trigger);
	const testButtonLabel = isPending
		? "Testing"
		: isTested
			? `Test (${getFakeTestDurationLabel(trigger.id)})`
			: "Test";

	return (
		<div className="flex w-full items-center gap-3 border-t border-border py-3">
			<span className="rich-text-command-menu-avatar inline-flex size-8 shrink-0 items-center justify-center">
				{tileIcon ?? <AutomationIcon label="" size="small" />}
			</span>
			<div className="min-w-0 flex-1">
				<div className="truncate text-sm font-medium leading-5 text-text">{label}</div>
				<div className="truncate text-xs leading-4 text-text-subtle">
					{provider?.label ?? "Event trigger"}{connectionLabel ? ` · ${connectionLabel}` : ""}
				</div>
			</div>
			<Button
				className="shrink-0"
				disabled={isPending}
				isLoading={isPending}
				onClick={onTest}
				size="compact"
				type="button"
				variant="outline"
			>
				{testButtonLabel}
			</Button>
		</div>
	);
}

function TestJsonBlock({
	title,
	value,
}: Readonly<{
	title: string;
	value: Record<string, unknown>;
}>): ReactElement {
	return (
		<div className="grid min-w-0 gap-2">
			<div className="text-xs font-semibold leading-4 text-text-subtlest">{title}</div>
			<pre className="max-h-80 overflow-auto rounded-lg bg-surface-sunken p-3 text-xs leading-5 text-text">
				{JSON.stringify(value, null, "\t")}
			</pre>
		</div>
	);
}

// Fabricates a stable "X min Y seconds" run time for a completed test. The
// real callback is near-instant, so we derive a deterministic, believably
// longer duration from the trigger id (same trigger → same reported time).
function getFakeTestDurationLabel(seed: string): string {
	let hash = 0;
	for (let index = 0; index < seed.length; index += 1) {
		hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
	}
	const totalSeconds = 68 + (hash % 112); // ~1–3 minutes
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;
	const secondsLabel = `${seconds} second${seconds === 1 ? "" : "s"}`;
	return minutes > 0 ? `${minutes} min ${secondsLabel}` : secondsLabel;
}

function getConnectionTestLabel(trigger: AgentTriggerValue): string | null {
	switch (trigger.connectionState) {
		case "needs-connection":
			return "Connection required, sample test available";
		case "connecting":
			return "Connecting, sample test available";
		case "connection-error":
			return "Connection failed, sample test available";
		case "connected":
		default:
			return null;
	}
}

function createAutomationTestResult(
	rule: AgentAutomationRule,
	ruleIndex: number,
	trigger: AgentTriggerValue,
): AutomationTestResult {
	const provider = getTriggerProvider(trigger.providerId);
	const automationName = getAgentAutomationRuleLabel(rule, ruleIndex);
	const eventLabel = getAgentTriggerReadableLabel(trigger);
	const receivedAt = "2026-06-12T00:00:00.000Z";
	const payload = {
		automationId: rule.id,
		automationName,
		eventTriggerId: trigger.id,
		receivedAt,
		source: provider?.label ?? trigger.providerId,
		event: {
			providerId: trigger.providerId,
			eventId: trigger.eventId,
			label: eventLabel,
			params: trigger.params ?? {},
		},
		data: getProviderSampleData(trigger),
	};
	const callback = {
		status: "ok",
		callbackId: `callback-${rule.id}-${trigger.id}`,
		processedAt: receivedAt,
		automationId: rule.id,
		eventTriggerId: trigger.id,
		result: {
			message: `Sample ${eventLabel} callback received for ${automationName}.`,
			nextAction: "Agent instructions would run with this event payload.",
		},
	};

	return {
		payload,
		callback,
	};
}

function getProviderSampleData(trigger: AgentTriggerValue): Record<string, unknown> {
	switch (trigger.providerId) {
		case "jira":
			return {
				issueKey: "PROJ-248",
				summary: "Refresh quarterly planning goals",
				project: trigger.params?.project ?? "any-project",
				actor: trigger.params?.actor ?? "anyone",
				changeType: trigger.eventId,
			};
		case "confluence":
			return {
				pageId: "983421",
				title: "Quarterly planning notes",
				space: trigger.params?.space ?? "any-space",
				actor: trigger.params?.actor ?? "anyone",
				changeType: trigger.eventId,
			};
		case "github-gitlab":
			return {
				repository: trigger.params?.repository ?? "select-repos",
				pullRequest: 128,
				branch: "feature/automation-rule-test",
				action: trigger.eventId,
			};
		case "slack":
		case "microsoft-teams":
			return {
				channel: trigger.params?.channel ?? "triage",
				messageTs: "1781200000.000100",
				text: "Can this automation draft a summary?",
				action: trigger.eventId,
			};
		case "sentry":
			return {
				issueId: "SENTRY-42",
				service: trigger.params?.service ?? "any-service",
				level: "error",
				action: trigger.eventId,
			};
		case "linear":
			return {
				issueId: "LIN-321",
				team: trigger.params?.team ?? "any-team",
				status: "In review",
				action: trigger.eventId,
			};
		case "webhook":
			return {
				method: "POST",
				path: "/automations/sample-callback",
				body: { ok: true, event: trigger.eventId },
			};
		case "pagerduty":
			return {
				incidentId: "P12345",
				service: trigger.params?.service ?? "any-service",
				urgency: "high",
				action: trigger.eventId,
			};
		case "scheduled":
		default:
			return {
				schedule: trigger.eventId,
				timezone: "Australia/Sydney",
				firedAt: "2026-06-12T09:00:00.000+10:00",
			};
	}
}

function AgentTestChatPanel({
	testAgentProfile,
}: Readonly<{
	testAgentProfile: RovoAgentProfile;
}>): ReactElement {
	const { selectedAgentId, selectAgent } = useRovoChat();

	useEffect(() => {
		if (selectedAgentId !== testAgentProfile.id) {
			selectAgent(testAgentProfile.id, { preserveCurrentThread: true });
		}
	}, [selectAgent, selectedAgentId, testAgentProfile.id]);

	return (
		<ChatPanel
			onClose={() => {}}
			abortOnUnmount={false}
			containerClassName="h-full min-h-0 w-full overflow-visible"
			containerStyle={{ borderRadius: 0, borderWidth: 0, overflow: "visible" }}
			composerContainerClassName="px-0"
			composerReservesContextBarSpace
			conversationContentClassName="px-0"
			showAgentTestControls
			suppressCustomAgentTabs
			greeting={{
				heading: testAgentProfile.name,
				suggestions: testAgentProfile.starters,
			}}
			greetingSelectedAgent={testAgentProfile}
			hideAiCursor
			hideComposerSourceAndModelControls
			hideHeader
		/>
	);
}

export function AgentTestPanel({
	className,
	entry,
}: Readonly<AgentTestPanelProps>): ReactElement {
	const versionOptions = useMemo(() => getAgentTestVersionOptions(entry), [entry]);
	const [selectedVersionId, setSelectedVersionId] = useState("latest");
	const [selectedSurface, setSelectedSurface] = useState<AgentTestSurface>({ kind: "start" });
	const [resetKey, setResetKey] = useState(0);
	if (!versionOptions.some((option) => option.id === selectedVersionId)) {
		setSelectedVersionId("latest");
	}
	const selectedOption = versionOptions.find((option) => option.id === selectedVersionId) ?? versionOptions[0];
	const selectedResult = selectedOption.result;
	const automationRules = useMemo<readonly AgentAutomationRule[]>(
		() => selectedResult.automationRules ?? [],
		[selectedResult.automationRules],
	);
	const selectedAutomationIndex = selectedSurface.kind === "automation"
		? automationRules.findIndex((rule) => rule.id === selectedSurface.ruleId)
		: -1;
	const selectedAutomation = selectedAutomationIndex >= 0
		? automationRules[selectedAutomationIndex]
		: null;
	const snapshotKey = `${entry.profile.id}:${selectedOption.id}:${JSON.stringify(selectedResult)}`;
	const testAgentProfile = useMemo(
		() => buildAgentTestProfile(entry, selectedResult, selectedOption.label),
		[entry, selectedOption.label, selectedResult],
	);

	useEffect(() => {
		if (selectedSurface.kind === "automation" && !selectedAutomation) {
			setSelectedSurface({ kind: "start" });
		}
	}, [selectedAutomation, selectedSurface]);

	return (
		<section
			aria-label="Agent test"
			data-testid="agent-test-panel"
			// Match the agent header / Configure tab inset (px-4) so the test
			// chat tab strip and composer align with the header above.
			className={cn("h-full min-h-0 px-4", className)}
		>
			{selectedSurface.kind === "start" ? (
				<AgentTestStartView
					automationRules={automationRules}
					onSelectAutomation={(ruleId) => setSelectedSurface({ kind: "automation", ruleId })}
					onSelectChat={() => setSelectedSurface({ kind: "chat" })}
				/>
			) : (
				<div className="flex h-full min-h-0 flex-col bg-surface">
					<AgentTestSelectedHeader
						onBack={() => setSelectedSurface({ kind: "start" })}
						onReset={() => setResetKey((currentKey) => currentKey + 1)}
						onSelectVersion={setSelectedVersionId}
						selectedVersionId={selectedVersionId}
						title={
							selectedSurface.kind === "chat"
								? "Chat"
								: selectedAutomation
									? getAgentAutomationRuleLabel(selectedAutomation, selectedAutomationIndex)
									: "Automation"
						}
						versionOptions={versionOptions}
					/>
					{selectedSurface.kind === "chat" ? (
						<RovoChatProvider
							key={`${snapshotKey}:${resetKey}`}
							agentProfiles={[testAgentProfile]}
							autoSelectAgentId={testAgentProfile.id}
						>
							<AgentTestChatPanel testAgentProfile={testAgentProfile} />
						</RovoChatProvider>
					) : selectedAutomation ? (
						<AgentTestAutomationDetailView
							key={`${snapshotKey}:${selectedAutomation.id}:${resetKey}`}
							rule={selectedAutomation}
							ruleIndex={selectedAutomationIndex}
						/>
					) : null}
				</div>
			)}
		</section>
	);
}
