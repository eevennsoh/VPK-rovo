"use client";

import { useEffect, useMemo, useState, type ReactElement } from "react";

import { RovoChatProvider, useRovoChat, type StudioSessionAgentEntry } from "@/app/contexts/context-rovo-chat";
import {
	DEFAULT_STARTER_ICON,
	getStarterIcon,
	type StarterIconKey,
} from "@/components/blocks/conversation-starters";
import Triggers from "@/components/blocks/triggers/page";
import type { AgentTriggerValue } from "@/components/blocks/triggers/data/trigger-catalog";
import ChatPanel from "@/components/projects/sidebar-chat/page";
import type { RovoAgentProfile } from "@/app/data/directory/agents";
import { AgentTriggersDialog } from "@/components/ui-custom/agent-triggers-dialog";
import { cn } from "@/lib/utils";
import type { RovoDataParts } from "@/lib/rovo-ui-messages";
import { resolveConversationStarterVisualIdentity, type RovoSuggestion } from "@/lib/rovo-suggestions";

const AGENT_TEST_MAX_CONVERSATION_STARTERS = 3;

export interface AgentTestPanelProps {
	entry: StudioSessionAgentEntry;
	className?: string;
}

type AgentResultPayload = RovoDataParts["agent-result"] & Record<string, unknown>;

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
}): string {
	const tools = getPayloadStringArray(input.payload, ["tools", "skills"]);
	const trigger = getPayloadString(input.payload, ["trigger"]);
	const guardrail = getPayloadString(input.payload, ["guardrail", "constraints"]);
	const starterLabels = input.profile.starters.map((starter) => starter.prompt ?? starter.label);

	return [
		"[Selected agent test]",
		`Agent: ${input.profile.name}`,
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

function buildAgentTestProfile(entry: StudioSessionAgentEntry): RovoAgentProfile {
	const payload = entry.publishReadyResult as AgentResultPayload;
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
		}),
	};
}

export function AgentTestTriggerView({
	entry,
}: Readonly<{
	entry: StudioSessionAgentEntry;
}>): ReactElement {
	const triggerDefinitions = useMemo<readonly AgentTriggerValue[]>(
		() => entry.publishReadyResult.triggerDefinitions ?? [],
		[entry.publishReadyResult.triggerDefinitions],
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	return (
		<div className="flex min-h-[220px] items-start justify-center p-6">
			<div className="w-full max-w-[48rem]">
				{/*
				 * Test mode mirrors the publish-ready snapshot, so the trigger
				 * card is a read-only preview: clicking anywhere on it opens the
				 * trigger modal. A transparent overlay button captures the click
				 * while the configured `<Triggers>` card renders underneath.
				 */}
				<div className="relative">
					<Triggers triggers={triggerDefinitions} />
					<button
						type="button"
						aria-label="View triggers"
						className="absolute inset-0 size-full cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-focused"
						onClick={() => setIsDialogOpen(true)}
					/>
				</div>
			</div>
			<AgentTriggersDialog
				open={isDialogOpen}
				onOpenChange={setIsDialogOpen}
				triggerDefinitions={triggerDefinitions}
				// Read-only preview: discard edits so the published snapshot stays
				// the source of truth.
				onSave={() => setIsDialogOpen(false)}
			/>
		</div>
	);
}

export function AgentTestActivityView({
	entry,
}: Readonly<{
	entry: StudioSessionAgentEntry;
}>): ReactElement {
	const tools = entry.publishReadyResult.tools ?? [];

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
	entry,
	testAgentProfile,
}: Readonly<{
	entry: StudioSessionAgentEntry;
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
			customAgentTabs={{
				trigger: <AgentTestTriggerView entry={entry} />,
				activity: <AgentTestActivityView entry={entry} />,
			}}
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
	const publishReadySnapshotKey = JSON.stringify(entry.publishReadyResult);
	const snapshotKey = `${entry.profile.id}:${publishReadySnapshotKey}`;
	const testAgentProfile = useMemo(() => buildAgentTestProfile(entry), [entry]);

	return (
		<section
			aria-label="Agent test"
			data-testid="agent-test-panel"
			// Match the agent header / Configure tab inset (px-6) so the test
			// chat tab strip and composer align with the header above.
			className={cn("h-full min-h-0 px-6", className)}
		>
			<RovoChatProvider
				key={snapshotKey}
				agentProfiles={[testAgentProfile]}
				autoSelectAgentId={testAgentProfile.id}
			>
				<AgentTestChatPanel entry={entry} testAgentProfile={testAgentProfile} />
			</RovoChatProvider>
		</section>
	);
}
