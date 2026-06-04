"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";

import { KnowledgeDirectoryDialog, type KnowledgeDirectoryAddPayload } from "@/components/blocks/knowledge-directory";
import { DEFAULT_KNOWLEDGE_APPS } from "@/components/blocks/knowledge-directory/data/apps";
import { SkillsDirectoryDialog, type SkillsDirectorySkill } from "@/components/blocks/skills-directory";
import { DEFAULT_SKILLS } from "@/components/blocks/skills-directory/data/skills";
import { ToolsDirectoryDialog } from "@/components/blocks/tools-directory";
import { DEMO_SESSION_TOOLS, DEMO_TOOLS } from "@/components/blocks/tools-directory/data/demo-tools";
import {
	ConversationStartersDialog,
	DEFAULT_STARTER_ICON,
	type ConversationStarter,
	type StarterIconKey,
} from "@/components/blocks/conversation-starters";
import {
	serializeAgentTriggerLabels,
	type AgentTriggerValue,
} from "@/components/blocks/triggers/data/trigger-catalog";
import { SubagentPromptFields } from "@/components/blocks/subagents/components/subagent-prompt-fields";
import { SubagentsNavigator } from "@/components/blocks/subagents/subagents-navigator";
import type { SubagentsBaseAgent } from "@/components/blocks/subagents/data/demo-agents";
import { getListItems, updateConfigListItem } from "@/components/blocks/subagents/lib/subagent-prompts";
import { AgentInsightsPanel } from "@/components/projects/studio/components/agent-insights-panel";
import { useAgentConfigSubagents } from "@/components/projects/studio/hooks/use-agent-config-subagents";
import {
	Agent,
	AgentCompactHeaderNav,
	type AgentCompactHeaderSection,
	AgentCompactSurfacesPanel,
	AgentConfigFields,
	type AgentDirectoryKind,
	AgentHeader,
	AgentMoreOptionsMenu,
	type AgentConfigListFieldName,
	type AgentConfigTextFieldName,
	type AgentHideableConfigField,
} from "@/components/ui-custom/agent";
import FloatingRovoButton from "@/components/projects/shared/components/floating-rovo-button";
import RovoFloatingChat from "@/components/projects/rovo-floating-chat/components/rovo-floating-chat";
import type { ChatPanelGreetingProps } from "@/components/projects/sidebar-chat/page";
import type { ChatContextBarDescriptor } from "@/components/projects/sidebar-chat/lib/chat-context-bar";
import { getStudioSessionAgentDisplayName, useRovoChat } from "@/app/contexts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type {
	StudioSessionAgentEntry,
} from "@/app/contexts/context-rovo-chat";
import type { RovoDataParts } from "@/lib/rovo-ui-messages";
import { cn } from "@/lib/utils";

type AgentResult = RovoDataParts["agent-result"];
export type AgentConfigView = "configure" | "insights" | "test";

// Capabilities a subagent can't own. Hidden from the config rows while a
// subagent prompt is selected/created (these aren't configurable per-subagent).
const SUBAGENT_HIDDEN_CONFIG_FIELDS: ReadonlySet<AgentHideableConfigField> = new Set([
	"trigger",
	"subagents",
	"conversationStarters",
]);

interface RovoAppAgentConfigPanelProps {
	activeView: AgentConfigView;
	entry: StudioSessionAgentEntry;
	onClose?: () => void;
	onCommitPublishReady: (profileId: string) => void;
	onPublish: (profileId: string) => void;
	onTest: (profileId: string) => void;
	onViewChange: (view: AgentConfigView) => void;
	testPanel: ReactNode;
	chatContextBar?: ChatContextBarDescriptor | null;
	chatGreeting?: ChatPanelGreetingProps;
	onUpdateDraft: (
		profileId: string,
		patch: Partial<AgentResult>,
	) => void;
	className?: string;
}

function stringifyForComparison(value: unknown): string {
	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

export function RovoAppAgentConfigPanel({
	activeView,
	entry,
	onClose,
	onCommitPublishReady,
	onPublish,
	onTest,
	onViewChange,
	testPanel,
	chatContextBar,
	chatGreeting,
	onUpdateDraft,
	className,
}: Readonly<RovoAppAgentConfigPanelProps>) {
	const draft = entry.draftResult;
	const shouldReduceMotion = useReducedMotion();
	const profileId = entry.profile.id;
	const [activeDirectory, setActiveDirectory] = useState<AgentDirectoryKind | null>(null);
	const [activeCompactSection, setActiveCompactSection] = useState<AgentCompactHeaderSection | null>(null);
	const [directoryToolIds, setDirectoryToolIds] = useState<readonly string[]>([]);
	const [directorySkillIds, setDirectorySkillIds] = useState<readonly string[]>([]);

	// Floating Rovo chat launcher for the agent config screen. studio surfaces
	// suppress the floating button by default (the shell owns chat), so we render
	// it with product="home" — product only gates visibility, it has no visual
	// effect — and pair it with the RovoFloatingChat surface the button opens,
	// mirroring the components/projects/rovo-button demo.
	const { chatSurface, openChat, resetAgentToRovo } = useRovoChat();

	const updateDraft = useCallback(
		(patch: Partial<AgentResult>) => {
			onUpdateDraft(profileId, patch);
		},
		[onUpdateDraft, profileId],
	);

	// Base agent + subagent prompts. `activeConfig` is the base draft or the
	// selected subagent's config; field edits route through `updateActiveConfig`.
	const {
		activeConfig,
		activeConfigId,
		activePrompt,
		activeSubagentId,
		baseConfig,
		createSubagent,
		handleConditionChange,
		handleTriggerNameChange,
		isSubagentActive,
		removeSubagentByDerivedIndex,
		selectBaseAgent,
		selectSubagent,
		selectSubagentByDerivedIndex,
		selectedSubagentIndex,
		subagentPrompts,
		updateActiveConfig,
	} = useAgentConfigSubagents({ draft, updateDraft });

	// Profile name/description always edit the base agent, even while a subagent
	// is selected (wired to AgentConfigFields' `onProfileTextChange`).
	const handleBaseTextChange = useCallback(
		(field: AgentConfigTextFieldName, value: string) => {
			if (field === "description") {
				updateDraft({ description: value, summary: value });
				return;
			}
			updateDraft({ [field]: value } as Partial<AgentResult>);
		},
		[updateDraft],
	);

	// Instructions and other config text edit whichever config is active.
	const handleConfigTextChange = useCallback(
		(field: AgentConfigTextFieldName, value: string) => {
			updateActiveConfig((config) => ({
				...config,
				[field]: value,
				...(field === "description" ? { summary: value } : {}),
			}));
		},
		[updateActiveConfig],
	);

	const updateListItem = useCallback(
		(field: AgentConfigListFieldName, index: number, value: string) => {
			// Subagent chips derive from prompt trigger names; they aren't free-text
			// editable from the list row.
			if (field === "subagents") {
				return;
			}
			updateActiveConfig((config) => updateConfigListItem(config, field, index, value));
		},
		[updateActiveConfig],
	);

	const removeListItem = useCallback(
		(field: AgentConfigListFieldName, index: number) => {
			if (field === "subagents") {
				if (!isSubagentActive) {
					removeSubagentByDerivedIndex(index);
				}
				return;
			}
			updateActiveConfig((config) => ({
				...config,
				[field]: getListItems(config, field).filter((_, itemIndex) => itemIndex !== index),
				...(field === "conversationStarters"
					? {
							conversationStarterIcons: Array.isArray(config.conversationStarterIcons)
								? config.conversationStarterIcons.filter((_, itemIndex) => itemIndex !== index)
								: undefined,
						}
					: {}),
			}));
		},
		[isSubagentActive, removeSubagentByDerivedIndex, updateActiveConfig],
	);

	const appendListItem = useCallback(
		(field: AgentConfigListFieldName) => {
			if (field === "subagents") {
				createSubagent();
				return;
			}
			updateActiveConfig((config) => ({
				...config,
				[field]: [...getListItems(config, field), ""],
			}));
		},
		[createSubagent, updateActiveConfig],
	);

	const appendListValues = useCallback(
		(field: AgentConfigListFieldName, values: readonly string[]) => {
			const nextValues = values.map((value) => value.trim()).filter(Boolean);

			if (nextValues.length === 0) {
				return;
			}

			const current = getListItems(activeConfig, field);
			const existing = new Set(current.map((value) => value.trim().toLowerCase()));
			const additions = nextValues.filter((value) => !existing.has(value.toLowerCase()));

			if (additions.length === 0) {
				return;
			}

			updateActiveConfig((config) => ({
				...config,
				[field]: [...getListItems(config, field), ...additions],
			}));
		},
		[activeConfig, updateActiveConfig],
	);

	const handleSelectListItem = useCallback(
		(field: AgentConfigListFieldName, index: number) => {
			if (field === "subagents") {
				selectSubagentByDerivedIndex(index);
			}
		},
		[selectSubagentByDerivedIndex],
	);
	const handleTriggerDefinitionsChange = useCallback(
		(triggerDefinitions: readonly AgentTriggerValue[]) => {
			const triggerLabels = serializeAgentTriggerLabels(triggerDefinitions);

			updateActiveConfig((config) => ({
				...config,
				triggerDefinitions,
				trigger: triggerLabels[0] ?? "",
				triggers: triggerLabels,
			}));
		},
		[updateActiveConfig],
	);
	const handleConnectTrigger = useCallback(
		(targetTrigger: AgentTriggerValue) => {
			updateActiveConfig((config) => {
				const triggerDefinitions = (config.triggerDefinitions ?? []).map((trigger) =>
					trigger.id === targetTrigger.id
						? { ...trigger, connectionState: "connecting" as const }
						: trigger,
				);
				const triggerLabels = serializeAgentTriggerLabels(triggerDefinitions);

				return {
					...config,
					triggerDefinitions,
					trigger: triggerLabels[0] ?? "",
					triggers: triggerLabels,
				};
			});
		},
		[updateActiveConfig],
	);
	const handleOpenDirectory = useCallback((directory: AgentDirectoryKind) => {
		setActiveDirectory(directory);
	}, []);
	const handleAddKnowledge = useCallback(
		(payload: KnowledgeDirectoryAddPayload) => {
			const app = DEFAULT_KNOWLEDGE_APPS.find((candidate) => candidate.id === payload.appId);

			if (!app) {
				return;
			}

			if (payload.contentIds === "all") {
				appendListValues("knowledge", [`${app.name} - all content`]);
			} else {
				const contentById = new Map(app.contents.map((content) => [content.id, content.name]));
				appendListValues(
					"knowledge",
					payload.contentIds.map((contentId) => contentById.get(contentId) ?? contentId),
				);
			}

			setActiveDirectory(null);
		},
		[appendListValues],
	);
	const handleDirectoryToolIdsChange = useCallback(
		(nextIds: readonly string[]) => {
			const previousIds = new Set(directoryToolIds);
			const addedIds = nextIds.filter((id) => !previousIds.has(id));
			const toolsById = new Map([...DEMO_TOOLS, ...DEMO_SESSION_TOOLS].map((tool) => [tool.id, tool]));

			setDirectoryToolIds(nextIds);
			appendListValues(
				"tools",
				addedIds.map((toolId) => toolsById.get(toolId)?.name ?? toolId),
			);

			if (addedIds.length > 0) {
				setActiveDirectory(null);
			}
		},
		[appendListValues, directoryToolIds],
	);
	const handleAddSkills = useCallback(
		(_skillIds: readonly string[], skills: readonly SkillsDirectorySkill[]) => {
			appendListValues("skills", skills.map((skill) => skill.name));
			setActiveDirectory(null);
		},
		[appendListValues],
	);

	// Conversation starters are edited as a whole set in a dedicated dialog
	// (reorder / icon / generate), unlike the append-only directories. Seed the
	// dialog from the active config's text + parallel icon array, defaulting the icon.
	const conversationStarterDialogValue = useMemo<readonly ConversationStarter[]>(() => {
		const texts = getListItems(activeConfig, "conversationStarters");
		const icons = Array.isArray(activeConfig.conversationStarterIcons)
			? activeConfig.conversationStarterIcons
			: [];
		return texts.map((text, index) => ({
			id: `starter-${index}`,
			text,
			icon: (icons[index] as StarterIconKey | undefined) ?? DEFAULT_STARTER_ICON,
		}));
	}, [activeConfig]);
	const handleSaveConversationStarters = useCallback(
		(starters: readonly ConversationStarter[]) => {
			updateActiveConfig((config) => ({
				...config,
				conversationStarters: starters.map((starter) => starter.text),
				conversationStarterIcons: starters.map((starter) => starter.icon),
			}));
			setActiveDirectory(null);
		},
		[updateActiveConfig],
	);

	const hasUpdateChanges = useMemo(() => {
		return (
			stringifyForComparison(entry.draftResult) !==
			stringifyForComparison(entry.publishReadyResult)
		);
	}, [entry.draftResult, entry.publishReadyResult]);

	const hasPublishChanges = useMemo(() => {
		if (!entry.publishedResult) {
			return true;
		}
		return (
			stringifyForComparison(entry.publishReadyResult) !==
			stringifyForComparison(entry.publishedResult)
		);
	}, [entry.publishReadyResult, entry.publishedResult]);

	const handlePublish = useCallback(() => {
		// Ensure publish-ready snapshot reflects current draft before publishing.
		if (hasUpdateChanges) {
			onCommitPublishReady(profileId);
		}
		onPublish(profileId);
	}, [hasUpdateChanges, onCommitPublishReady, onPublish, profileId]);

	const handleTest = useCallback(() => {
		if (hasUpdateChanges) {
			onCommitPublishReady(profileId);
		}
		onTest(profileId);
	}, [hasUpdateChanges, onCommitPublishReady, onTest, profileId]);
	const handleOpenFloatingRovoChat = useCallback(() => {
		resetAgentToRovo();
		openChat("floating");
	}, [openChat, resetAgentToRovo]);

	const handleViewChange = useCallback(
		(value: string | null) => {
			if (value !== "configure" && value !== "insights" && value !== "test") {
				return;
			}
			setActiveCompactSection(null);
			if (value === "test") {
				handleTest();
				return;
			}
			onViewChange(value);
		},
		[handleTest, onViewChange],
	);

	const handleCompactSectionChange = useCallback(
		(section: AgentCompactHeaderSection) => {
			if (section === "insights") {
				setActiveCompactSection(null);
				onViewChange("insights");
				return;
			}
			onViewChange("configure");
			setActiveCompactSection(section === "surfaces" ? "surfaces" : null);
		},
		[onViewChange],
	);

	// Mirror the avatar the sidebar nav renders for this agent (entry.profile.avatarSrc)
	// so the header + profile cover match instead of falling back to the static default.
	const agentAvatarSrc = entry.profile.avatarSrc;
	// `name` is still required by AgentHeader (accessibility/fallback); the compact
	// nav supplied via `leadingContent` is what actually renders on the left.
	const agentName = getStudioSessionAgentDisplayName(entry);

	// Base agent shape the floating SubagentsNavigator expects. The navigator only
	// reads `config.name` + `avatarSrc`, so derive both from the live draft.
	const navigatorBaseAgent = useMemo<SubagentsBaseAgent>(
		() => ({ id: profileId, avatarSrc: agentAvatarSrc, config: baseConfig }),
		[agentAvatarSrc, baseConfig, profileId],
	);

	return (
		<>
			<motion.div
				className={cn("flex h-full w-full flex-col overflow-hidden bg-surface", className)}
				data-screen-assistant-target="studio-agent-config-panel"
				initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.24, ease: [0, 0.4, 0, 1] }}
			>
			<Agent className="flex min-h-0 flex-1 flex-col">
				<Tabs
					className="min-h-0 flex-1"
					onValueChange={handleViewChange}
					value={activeView}
				>
					<AgentHeader
						name={agentName}
						leadingContent={
							<AgentCompactHeaderNav
								activeSection={activeView === "insights" ? "insights" : activeCompactSection}
								avatarSrc={agentAvatarSrc}
								onSectionChange={handleCompactSectionChange}
							/>
						}
						actions={
							<>
								<AgentMoreOptionsMenu />
								<ToggleGroup
									aria-label="Agent config views"
									variant="outline"
									value={[activeView]}
									onValueChange={(value) =>
										handleViewChange((value[0] as AgentConfigView | undefined) ?? null)
									}
								>
									<ToggleGroupItem
										value="test"
										data-testid="agent-config-test"
										data-screen-assistant-target="studio-agent-config-test"
									>
										Test
									</ToggleGroupItem>
									<ToggleGroupItem
										value="configure"
										data-testid="agent-config-configure"
										data-screen-assistant-target="studio-agent-config-configure"
									>
										Configure
									</ToggleGroupItem>
								</ToggleGroup>
								<Button
									type="button"
									size="default"
									variant="default"
									onClick={handlePublish}
									disabled={!hasPublishChanges}
									data-testid="agent-config-publish"
									data-screen-assistant-target="studio-agent-config-publish"
								>
									Publish
								</Button>
								{onClose ? (
									<Button
										type="button"
										size="icon"
										variant="ghost"
										onClick={onClose}
										aria-label="Close agent config"
									>
										<CrossIcon label="" spacing="none" />
									</Button>
								) : null}
							</>
						}
					/>
					<TabsContent value="configure" className="relative min-h-0 flex-1 overflow-hidden data-[hidden]:hidden">
						{/* Floating switcher to jump between the base agent and its
						    subagents. Self-hides until at least one subagent exists. */}
						<SubagentsNavigator
							activeSubagentId={activeSubagentId}
							baseAgent={navigatorBaseAgent}
							className="absolute right-4 top-[42%] z-20 hidden md:block"
							onCreateSubagent={createSubagent}
							onSelectBaseAgent={selectBaseAgent}
							onSelectSubagent={selectSubagent}
							subagents={subagentPrompts}
						/>
						<div className="mx-auto flex h-full min-h-0 w-full max-w-7xl flex-col px-6 py-5">
							{activeCompactSection === "surfaces" ? (
								<AgentCompactSurfacesPanel className="-mr-6 pr-6" />
							) : (
								<AgentConfigFields
									config={activeConfig}
									avatarSrc={agentAvatarSrc}
									profileAvatarSrc={agentAvatarSrc}
									profileConfig={baseConfig}
									// Subagents can't own triggers, their own subagents, or
									// conversation starters, so suppress those rows while editing one.
									hiddenConfigFields={isSubagentActive ? SUBAGENT_HIDDEN_CONFIG_FIELDS : undefined}
									compactScrollAreaClassName="-mr-6 pr-6"
									compactFooterBefore={activePrompt ? (
										<SubagentPromptFields
											condition={activePrompt.condition}
											idPrefix={`agent-${profileId}-${activeConfigId}`}
											onConditionChange={handleConditionChange}
											onTriggerNameChange={handleTriggerNameChange}
											triggerName={activePrompt.triggerName}
										/>
									) : null}
									idPrefix={`agent-${profileId}-${activeConfigId}`}
									layout="compact"
									onTextChange={handleConfigTextChange}
									onProfileTextChange={handleBaseTextChange}
									onListItemChange={updateListItem}
									onRemoveListItem={removeListItem}
									onAddListValues={appendListValues}
									onAppendListItem={appendListItem}
									onConnectTrigger={handleConnectTrigger}
									onManageSubagents={createSubagent}
									onSelectListItem={handleSelectListItem}
									onTriggerDefinitionsChange={handleTriggerDefinitionsChange}
									onOpenDirectory={handleOpenDirectory}
									selectedListItemIndexByField={{ subagents: selectedSubagentIndex }}
									screenAssistantTargetPrefix="studio-agent-config"
								/>
							)}
						</div>
					</TabsContent>
					<TabsContent value="test" keepMounted={false} className="min-h-0 flex-1 data-[hidden]:hidden">
						{testPanel}
					</TabsContent>
					<TabsContent value="insights" keepMounted={false} className="min-h-0 flex-1 data-[hidden]:hidden">
						<AgentInsightsPanel />
					</TabsContent>
				</Tabs>
			</Agent>
		</motion.div>
			{chatSurface === null ? (
				<FloatingRovoButton ariaLabel="Open Rovo chat" product="home" onButtonClick={handleOpenFloatingRovoChat} />
			) : null}
			<AnimatePresence>
				{chatSurface === "floating" ? (
					<RovoFloatingChat
						key="floating-chat"
						chatContextBar={chatContextBar}
						greeting={chatGreeting}
						hideComposerSourceAndModelControls={Boolean(chatContextBar)}
					/>
				) : null}
			</AnimatePresence>
			<KnowledgeDirectoryDialog
				open={activeDirectory === "knowledge"}
				onOpenChange={(open) => setActiveDirectory(open ? "knowledge" : null)}
				onAddKnowledge={handleAddKnowledge}
			/>
			<ToolsDirectoryDialog
				addedToolIds={directoryToolIds}
				open={activeDirectory === "tools"}
				onAddedToolIdsChange={handleDirectoryToolIdsChange}
				onOpenChange={(open) => setActiveDirectory(open ? "tools" : null)}
				sessionTools={DEMO_SESSION_TOOLS}
				tools={DEMO_TOOLS}
			/>
			<SkillsDirectoryDialog
				onAddSkills={handleAddSkills}
				onOpenChange={(open) => setActiveDirectory(open ? "skills" : null)}
				onSelectedSkillIdsChange={setDirectorySkillIds}
				open={activeDirectory === "skills"}
				selectedSkillIds={directorySkillIds}
				skills={DEFAULT_SKILLS}
			/>
			<ConversationStartersDialog
				open={activeDirectory === "conversationStarters"}
				onOpenChange={(open) => setActiveDirectory(open ? "conversationStarters" : null)}
				starters={conversationStarterDialogValue}
				maxStarters={3}
				saveLabel={conversationStarterDialogValue.length > 0 ? "Save" : "Add"}
				onSave={handleSaveConversationStarters}
			/>
		</>
	);
}
