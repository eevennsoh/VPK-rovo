"use client";

// oxlint-disable react-doctor/no-event-handler -- Effects in this file bridge external systems, animation/media state, timers, or parent-controlled state rather than user event handlers.
// oxlint-disable react-doctor/no-multi-comp -- The test panel colocates the chat surface, header, and automation greeting subviews so they share one local contract.

import Image from "next/image";
import { Fragment, useEffect, useMemo, useState, type ReactElement } from "react";

import { RovoChatProvider, useRovoChat, type StudioSessionAgentEntry } from "@/app/contexts/context-rovo-chat";
import {
	DEFAULT_STARTER_ICON,
	getStarterIcon,
	type StarterIconKey,
} from "@/components/blocks/conversation-starters";
import { AgentAutomationFlowCover } from "@/components/blocks/triggers/components/agent-automation-flow-cover";
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
import { IconTile } from "@/components/ui/icon-tile";
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
import { createAssistantTextMessage, type RovoDataParts, type RovoUIMessage } from "@/lib/rovo-ui-messages";
import { resolveConversationStarterVisualIdentity, type RovoSuggestion } from "@/lib/rovo-suggestions";
import AutomationIcon from "@atlaskit/icon/core/automation";
import CheckMarkIcon from "@atlaskit/icon/core/check-mark";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import RefreshIcon from "@atlaskit/icon/core/refresh";

const AGENT_TEST_MAX_CONVERSATION_STARTERS = 3;

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

function AgentTestHeader({
	onReset,
	onSelectVersion,
	selectedVersionId,
	versionOptions,
}: Readonly<{
	onReset: () => void;
	onSelectVersion: (versionId: string) => void;
	selectedVersionId: string;
	versionOptions: readonly ChatPanelAgentVersionOption[];
}>): ReactElement {
	return (
		<div className="flex shrink-0 items-center justify-between gap-3 py-3">
			<div className="flex min-w-0 items-center gap-2">
				<AgentTestVersionSelect
					onSelectVersion={onSelectVersion}
					selectedVersionId={selectedVersionId}
					versionOptions={versionOptions}
				/>
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
			size="compact"
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

interface AutomationTestResult {
	payload: Record<string, unknown>;
	callback: Record<string, unknown>;
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

// Builds the scripted user + assistant turn injected into the chat when an
// automation is run inline. The assistant turn renders the sample event payload
// and callback result as JSON code blocks. No backend is involved — the messages
// are written directly into the conversation via `replaceMessages`.
function buildAutomationRunMessages(
	rule: AgentAutomationRule,
	ruleIndex: number,
): RovoUIMessage[] {
	const trigger = rule.triggers[0];
	if (!trigger) {
		return [];
	}

	const label = getAgentAutomationRuleLabel(rule, ruleIndex);
	const result = createAutomationTestResult(rule, ruleIndex, trigger);
	const userMessage: RovoUIMessage = {
		id: crypto.randomUUID(),
		role: "user",
		parts: [{ type: "text", text: `Test "${label}"`, state: "done" }],
	};
	const assistantMessage = createAssistantTextMessage(
		crypto.randomUUID(),
		[
			"**Sample event payload**",
			"",
			"```json",
			JSON.stringify(result.payload, null, 2),
			"```",
			"",
			"**Callback result**",
			"",
			"```json",
			JSON.stringify(result.callback, null, 2),
			"```",
		].join("\n"),
	);

	return [userMessage, assistantMessage];
}

// The "Automation" group rendered below the conversation starters in the chat
// greeting. One row per automation rule; clicking a row runs its sample inline.
function AgentTestAutomationGreetingSection({
	automationRules,
	onRunAutomation,
}: Readonly<{
	automationRules: readonly AgentAutomationRule[];
	onRunAutomation: (rule: AgentAutomationRule, ruleIndex: number) => void;
}>): ReactElement | null {
	if (automationRules.length === 0) {
		return null;
	}

	return (
		<div className="flex flex-col gap-1">
			{/* Group label mirrors the "Chat" label treatment in chat-greeting.tsx:
			    a 32px spot illustration aligned to the row tile column (gap-3). */}
			<div className="flex items-center gap-3 px-1.5 text-xs font-semibold leading-4 text-text-subtle">
				<span className="block size-8 shrink-0">
					<Image
						alt=""
						className="size-8 object-contain dark:hidden [[data-color-mode=dark]_&]:hidden"
						height={32}
						src="/illustration-spot/general/automation-2/light.svg"
						width={32}
					/>
					<Image
						alt=""
						className="hidden size-8 object-contain dark:block [[data-color-mode=dark]_&]:block"
						height={32}
						src="/illustration-spot/general/automation-2/dark.svg"
						width={32}
					/>
				</span>
				Flows
			</div>
			{automationRules.map((rule, ruleIndex) => (
				<AgentTestAutomationGreetingRow
					key={rule.id}
					onRun={() => onRunAutomation(rule, ruleIndex)}
					rule={rule}
					ruleIndex={ruleIndex}
				/>
			))}
		</div>
	);
}

function AgentTestAutomationGreetingRow({
	onRun,
	rule,
	ruleIndex,
}: Readonly<{
	onRun: () => void;
	rule: AgentAutomationRule;
	ruleIndex: number;
}>): ReactElement {
	const label = getAgentAutomationRuleLabel(rule, ruleIndex);
	const hasTrigger = rule.triggers.length > 0;

	return (
		<button
			aria-label={`Test ${label}`}
			className="grid w-full grid-cols-[32px_minmax(0,1fr)] items-center gap-3 rounded-[12px] px-1.5 py-2 text-left transition-colors hover:bg-bg-neutral-subtle-hovered disabled:pointer-events-none disabled:opacity-(--opacity-disabled)"
			disabled={!hasTrigger}
			onClick={onRun}
			type="button"
		>
			<IconTile
				aria-hidden
				className="border border-border bg-surface"
				icon={<AutomationIcon color={token("color.icon.subtle")} label={label} />}
				label={label}
				size="medium"
			/>
			<span className="flex min-w-0 flex-col gap-1">
				<span className="menu-row-title text-left">{label}</span>
				<AgentTestAutomationFlow rule={rule} />
			</span>
		</button>
	);
}

function AgentTestChatPanel({
	automationRules,
	testAgentProfile,
}: Readonly<{
	automationRules: readonly AgentAutomationRule[];
	testAgentProfile: RovoAgentProfile;
}>): ReactElement {
	const { selectedAgentId, selectAgent, replaceMessages } = useRovoChat();

	useEffect(() => {
		if (selectedAgentId !== testAgentProfile.id) {
			selectAgent(testAgentProfile.id, { preserveCurrentThread: true });
		}
	}, [selectAgent, selectedAgentId, testAgentProfile.id]);

	function handleRunAutomation(rule: AgentAutomationRule, ruleIndex: number): void {
		const messages = buildAutomationRunMessages(rule, ruleIndex);
		if (messages.length > 0) {
			replaceMessages(messages);
		}
	}

	// Only label the starter list with a "Chat" header when both groups are
	// present, so a chat-only agent keeps its plain starter list.
	const showStarterGroupLabel =
		testAgentProfile.starters.length > 0 && automationRules.length > 0;

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
				showStarterGroupLabel,
				agentTestSection: (
					<AgentTestAutomationGreetingSection
						automationRules={automationRules}
						onRunAutomation={handleRunAutomation}
					/>
				),
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
	const snapshotKey = `${entry.profile.id}:${selectedOption.id}:${JSON.stringify(selectedResult)}`;
	const testAgentProfile = useMemo(
		() => buildAgentTestProfile(entry, selectedResult, selectedOption.label),
		[entry, selectedOption.label, selectedResult],
	);

	return (
		<section
			aria-label="Agent test"
			data-testid="agent-test-panel"
			// Match the agent header / Configure tab inset (px-4) so the test
			// chat tab strip and composer align with the header above.
			className={cn("h-full min-h-0 px-4", className)}
		>
			<div className="flex h-full min-h-0 flex-col bg-surface">
				<AgentTestHeader
					onReset={() => setResetKey((currentKey) => currentKey + 1)}
					onSelectVersion={setSelectedVersionId}
					selectedVersionId={selectedVersionId}
					versionOptions={versionOptions}
				/>
				<RovoChatProvider
					key={`${snapshotKey}:${resetKey}`}
					agentProfiles={[testAgentProfile]}
					autoSelectAgentId={testAgentProfile.id}
				>
					<AgentTestChatPanel
						automationRules={automationRules}
						testAgentProfile={testAgentProfile}
					/>
				</RovoChatProvider>
			</div>
		</section>
	);
}
