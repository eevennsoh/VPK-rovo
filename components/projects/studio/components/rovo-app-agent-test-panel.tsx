"use client";

// oxlint-disable react-doctor/no-event-handler -- Effects in this file bridge external systems, animation/media state, timers, or parent-controlled state rather than user event handlers.
// oxlint-disable react-doctor/no-multi-comp -- The test panel colocates tightly coupled tab and payload subviews so ChatPanel custom tabs share one local contract.

import { useEffect, useMemo, useState, type ReactElement } from "react";

import { RovoChatProvider, useRovoChat, type StudioSessionAgentEntry } from "@/app/contexts/context-rovo-chat";
import {
	DEFAULT_STARTER_ICON,
	getStarterIcon,
	type StarterIconKey,
} from "@/components/blocks/conversation-starters";
import { renderAgentTriggerProviderIcon } from "@/components/blocks/triggers/page";
import {
	getAgentAutomationRuleLabel,
	getAgentTriggerReadableLabel,
	getTriggerProvider,
	type AgentAutomationRule,
	type AgentTriggerValue,
} from "@/components/blocks/triggers/data/trigger-catalog";
import ChatPanel, { type ChatPanelAgentVersionOption } from "@/components/projects/sidebar-chat/page";
import type { RovoAgentProfile } from "@/app/data/directory/agents";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RovoDataParts } from "@/lib/rovo-ui-messages";
import { resolveConversationStarterVisualIdentity, type RovoSuggestion } from "@/lib/rovo-suggestions";

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

export function AgentTestTriggerView({
	result,
}: Readonly<{
	result: RovoDataParts["agent-result"];
}>): ReactElement {
	const automationRules = useMemo<readonly AgentAutomationRule[]>(
		() => result.automationRules ?? [],
		[result.automationRules],
	);
	const [testSelection, setTestSelection] = useState<AutomationTestSelection | null>(null);
	const testResult = useMemo(() => {
		if (!testSelection) {
			return null;
		}

		const ruleIndex = automationRules.findIndex((rule) => rule.id === testSelection.ruleId);
		if (ruleIndex === -1) {
			return null;
		}

		const rule = automationRules[ruleIndex];
		const trigger = rule.triggers.find((item) => item.id === testSelection.triggerId);
		return trigger ? createAutomationTestResult(rule, ruleIndex, trigger) : null;
	}, [automationRules, testSelection]);

	return (
		<div className="flex min-h-[220px] items-start justify-center p-6">
			<div className="grid w-full max-w-[56rem] gap-4">
				{automationRules.length > 0 ? (
					automationRules.map((rule, ruleIndex) => (
						<AutomationTestCard
							key={rule.id}
							onTest={(trigger) => setTestSelection({ ruleId: rule.id, triggerId: trigger.id })}
							rule={rule}
							ruleIndex={ruleIndex}
						/>
					))
				) : (
					<div className="rounded-xl border border-dashed border-border bg-surface p-6 text-center text-sm text-text-subtle">
						No automations configured.
					</div>
				)}
				{testResult ? (
					<div className="grid gap-3 rounded-xl border border-border bg-surface p-4">
						<div>
							<h3 className="text-sm font-semibold leading-5 text-text">Test callback</h3>
							<p className="text-sm leading-5 text-text-subtle">
								{testResult.summary}
							</p>
						</div>
						<div className="grid gap-3 md:grid-cols-2">
							<TestJsonBlock title="Sample event payload" value={testResult.payload} />
							<TestJsonBlock title="Callback result" value={testResult.callback} />
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}

interface AutomationTestSelection {
	ruleId: string;
	triggerId: string;
}

interface AutomationTestResult {
	summary: string;
	payload: Record<string, unknown>;
	callback: Record<string, unknown>;
}

function AutomationTestCard({
	onTest,
	rule,
	ruleIndex,
}: Readonly<{
	onTest: (trigger: AgentTriggerValue) => void;
	rule: AgentAutomationRule;
	ruleIndex: number;
}>): ReactElement {
	const title = getAgentAutomationRuleLabel(rule, ruleIndex);
	const prompt = rule.prompt?.trim() || "No instructions added yet.";
	const activeLabel = rule.enabled === false ? "Inactive" : "Active";

	return (
		<div className="grid gap-3 rounded-xl border border-border bg-surface p-4">
			<div className="flex min-w-0 items-start justify-between gap-3">
				<div className="min-w-0">
					<div className="flex min-w-0 items-center gap-2">
						<h3 className="truncate text-sm font-semibold leading-5 text-text">{title}</h3>
						<span className="shrink-0 rounded bg-bg-neutral px-1.5 py-0.5 text-xs font-medium leading-4 text-text-subtle">
							{activeLabel}
						</span>
					</div>
					<p className="mt-1 line-clamp-2 text-sm leading-5 text-text-subtle">{prompt}</p>
				</div>
				<div className="shrink-0 text-xs font-medium leading-4 text-text-subtle">
					{rule.triggers.length} event{rule.triggers.length === 1 ? "" : "s"}
				</div>
			</div>
			<div className="grid gap-2">
				{rule.triggers.length > 0 ? (
					rule.triggers.map((trigger) => (
						<AutomationTestEventRow
							key={trigger.id}
							onTest={() => onTest(trigger)}
							trigger={trigger}
						/>
					))
				) : (
					<div className="rounded-lg border border-dashed border-border bg-bg-input p-3 text-sm text-text-subtle">
						No event triggers configured.
					</div>
				)}
			</div>
		</div>
	);
}

function AutomationTestEventRow({
	onTest,
	trigger,
}: Readonly<{
	onTest: () => void;
	trigger: AgentTriggerValue;
}>): ReactElement {
	const provider = getTriggerProvider(trigger.providerId);
	const icon = renderAgentTriggerProviderIcon(trigger);
	const label = getAgentTriggerReadableLabel(trigger);
	const connectionLabel = getConnectionTestLabel(trigger);

	return (
		<div className="flex min-w-0 items-center gap-3 rounded-lg border border-border bg-bg-input px-3 py-2">
			<span className="flex size-6 shrink-0 items-center justify-center text-icon-subtle">
				{icon}
			</span>
			<div className="min-w-0 flex-1">
				<div className="truncate text-sm font-medium leading-5 text-text">{label}</div>
				<div className="truncate text-xs leading-4 text-text-subtle">
					{provider?.label ?? "Event trigger"}{connectionLabel ? ` · ${connectionLabel}` : ""}
				</div>
			</div>
			<Button onClick={onTest} size="compact" type="button" variant="outline">
				Test
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
			<div className="text-xs font-semibold uppercase leading-4 text-text-subtle">{title}</div>
			<pre className="max-h-80 overflow-auto rounded-lg bg-surface-sunken p-3 text-xs leading-5 text-text">
				{JSON.stringify(value, null, "\t")}
			</pre>
		</div>
	);
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
		summary: `${automationName} tested with ${eventLabel}.`,
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

export function AgentTestActivityView({
	result,
}: Readonly<{
	result: RovoDataParts["agent-result"];
}>): ReactElement {
	const tools = result.tools ?? [];

	return (
		<div className="flex min-h-[220px] items-center justify-center p-6 text-center">
			<div className="max-w-[320px] space-y-2">
				<h3 className="text-sm font-semibold text-text">Activity</h3>
				<p className="text-sm leading-6 text-text-subtle">
					{tools.length > 0 ? `Tools: ${tools.join(", ")}` : "No activity yet"}
				</p>
			</div>
		</div>
	);
}

function AgentTestChatPanel({
	result,
	testAgentProfile,
	versionOptions,
	selectedVersionId,
	onSelectVersion,
}: Readonly<{
	result: RovoDataParts["agent-result"];
	testAgentProfile: RovoAgentProfile;
	versionOptions: readonly ChatPanelAgentVersionOption[];
	selectedVersionId: string;
	onSelectVersion: (versionId: string) => void;
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
			customAgentTabs={{
				trigger: <AgentTestTriggerView result={result} />,
				activity: <AgentTestActivityView result={result} />,
			}}
			agentVersionOptions={versionOptions}
			selectedAgentVersionId={selectedVersionId}
			onAgentVersionChange={onSelectVersion}
			showAgentTestControls
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
	if (!versionOptions.some((option) => option.id === selectedVersionId)) {
		setSelectedVersionId("latest");
	}
	const selectedOption = versionOptions.find((option) => option.id === selectedVersionId) ?? versionOptions[0];
	const selectedResult = selectedOption.result;
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
			<RovoChatProvider
				key={snapshotKey}
				agentProfiles={[testAgentProfile]}
				autoSelectAgentId={testAgentProfile.id}
			>
				<AgentTestChatPanel
					result={selectedResult}
					testAgentProfile={testAgentProfile}
					versionOptions={versionOptions}
					selectedVersionId={selectedVersionId}
					onSelectVersion={setSelectedVersionId}
				/>
			</RovoChatProvider>
		</section>
	);
}
