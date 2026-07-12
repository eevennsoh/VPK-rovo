"use client";

import { memo } from "react";

import {
	AgentConfigFieldsCore,
	type AgentConfigFieldsCoreProps,
} from "@/components/blocks/agent-config-core/components/agent-config-fields-core";
import {
	AgentCompactConfigToolbarBelow,
} from "@/components/blocks/agent-config-core/components/agent-compact-config-toolbar-below";
import {
	AgentInstructionsComposer,
} from "@/components/blocks/agent-config-core/components/agent-instructions-composer";
import type {
	AgentConfigToolbarFieldName,
} from "@/components/blocks/agent-config-core/components/agent-compact-config-nav";
import { cn } from "@/lib/utils";

export {
	AGENT_COMPACT_HEADER_DEFAULT_NAV_ITEMS,
	AGENT_COMPACT_HEADER_DETAILS_NAV_ITEM,
	Agent,
	AgentCompactAccessPanel,
	AgentCompactEvaluationPanel,
	AgentCompactHeaderNav,
	AgentCompactInsightsPanel,
	AgentCompactSurfacesPanel,
	AgentCompactUsersPanel,
	AgentContent,
	AgentHeader,
	AgentInstructions,
	AgentMoreOptionsMenu,
	AgentOutput,
	AgentTool,
	AgentTools,
	AGENT_KNOWLEDGE_UPLOAD_TARGET,
	toggleAgentConfigDisabledItem,
	type AgentCompactAccessPanelProps,
	type AgentCompactEvaluationPanelProps,
	type AgentCompactHeaderNavItem,
	type AgentCompactHeaderNavProps,
	type AgentCompactHeaderSection,
	type AgentCompactInsightsPanelProps,
	type AgentCompactSurfacesPanelProps,
	type AgentCompactUsersPanelProps,
	type AgentConfigFormValue,
	type AgentConfigListFieldName,
	type AgentConfigReferenceListFieldName,
	type AgentConfigTextFieldName,
	type AgentDirectoryKind,
	type AgentHideableConfigField,
	type AgentContentProps,
	type AgentHeaderProps,
	type AgentInstructionsProps,
	type AgentMoreOptionsMenuProps,
	type AgentOutputProps,
	type AgentProps,
	type AgentToolProps,
	type AgentToolsProps,
} from "@/components/blocks/agent-config-core";

const SKILL_CONFIG_PROFILE_LABELS = {
	untitledName: "Untitled skill",
	editName: "Edit skill name",
	editDescription: "Edit skill description",
} as const;

const SKILL_CONFIG_VISIBLE_TOOLBAR_FIELD_NAMES: ReadonlySet<AgentConfigToolbarFieldName> =
	new Set<AgentConfigToolbarFieldName>(["apps"]);

export interface AgentConfigFieldsProps extends Omit<
	AgentConfigFieldsCoreProps,
	"profileLabels" | "renderInstructions" | "renderFooter" | "suppressBottomScrollMask"
> {
	instructionsToolbarClassName?: string;
	showConfigToolbar?: boolean;
	frontmatter?: { enabled?: boolean };
	footerCollapsible?: boolean;
}

export const AgentConfigFields = memo(
	({
		avatarSrc,
		compactFooterBefore,
		compactScrollAreaClassName,
		config,
		footerCollapsible,
		frontmatter,
		hiddenConfigFields,
		instructionsToolbarClassName,
		onAddListValues,
		onAppendListItem,
		onAutomationRulesChange,
		onConnectTrigger,
		onInstructionsViewModeChange,
		onListItemChange,
		onManageSubagents,
		onManageTriggers,
		onOpenDirectory,
		onProfileTextChange,
		onRemoveListItem,
		onSelectListItem,
		onTextChange,
		onToggleListItem,
		profileAvatarSrc,
		screenAssistantTargetPrefix,
		selectedListItemIndexByField,
		showConfigToolbar = true,
		...props
	}: Readonly<AgentConfigFieldsProps>) => (
		<AgentConfigFieldsCore
			avatarSrc={avatarSrc}
			compactFooterBefore={compactFooterBefore}
			compactScrollAreaClassName={compactScrollAreaClassName}
			config={config}
			hiddenConfigFields={hiddenConfigFields}
			onAddListValues={onAddListValues}
			onAppendListItem={onAppendListItem}
			onAutomationRulesChange={onAutomationRulesChange}
			onConnectTrigger={onConnectTrigger}
			onInstructionsViewModeChange={onInstructionsViewModeChange}
			onListItemChange={onListItemChange}
			onManageSubagents={onManageSubagents}
			onManageTriggers={onManageTriggers}
			onOpenDirectory={onOpenDirectory}
			onProfileTextChange={onProfileTextChange}
			onRemoveListItem={onRemoveListItem}
			onSelectListItem={onSelectListItem}
			onTextChange={onTextChange}
			onToggleListItem={onToggleListItem}
			profileAvatarSrc={profileAvatarSrc}
			profileLabels={SKILL_CONFIG_PROFILE_LABELS}
			renderInstructions={(context) => (
				<AgentInstructionsComposer
					className="relative flex min-h-0 flex-1 flex-col"
					config={config}
					frontmatter={frontmatter}
					contentClassName={cn("pt-0", context.isFilledConfig ? "min-h-[240px]" : "min-h-[2rem]")}
					editorClassName={context.isFilledConfig ? undefined : "agent-instructions-tiptap-editor-compact-empty"}
					instructions={config.instructions}
					mentionRemovalRequest={context.mentionRemovalRequest}
					onAddListValues={context.handleAddListValues}
					onInstructionsChange={(value) => context.handleTextChange("instructions", value)}
					onMentionRemovalRequestHandled={context.handleMentionRemovalRequestHandled}
					onOpenDirectory={context.handleOpenDirectory}
					onRemoveReferenceValue={context.handleRemoveReferenceValue}
					onViewModeChange={onInstructionsViewModeChange}
					padStuckToolbar
					placeholder="Press / to help me create the skill"
					placeholderSlot={(
						<p className="tiptap-editor text-sm leading-[1.55] text-text-subtlest">
							Press <code>/</code> to help me create the skill
						</p>
					)}
					screenAssistantTargetId={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:instructions` : undefined}
					showSectionLabel={false}
					toolbarClassName={instructionsToolbarClassName}
				/>
			)}
			renderFooter={showConfigToolbar ? (context) => (
				<AgentCompactConfigToolbarBelow
					config={config}
					avatarSrc={profileAvatarSrc ?? avatarSrc}
					collapsible={footerCollapsible}
					hiddenConfigFields={hiddenConfigFields}
					visibleFieldNames={SKILL_CONFIG_VISIBLE_TOOLBAR_FIELD_NAMES}
					onAddListValues={context.handleAddListValues}
					onAppendListItem={context.handleAppendListItem}
					onConnectTrigger={onConnectTrigger}
					onEditTriggers={context.handleEditTriggers}
					onManageTriggers={context.handleManageTriggers}
					onListItemChange={context.handleListItemChange}
					onManageSubagents={context.handleManageSubagents}
					onOpenDirectory={context.handleOpenDirectory}
					onRemoveListItem={context.handleRemoveListItem}
					onSelectListItem={context.handleSelectListItem}
					onTextChange={context.handleTextChange}
					onToggleListItem={onToggleListItem}
					onAutomationRulesChange={onAutomationRulesChange}
					screenAssistantTargetPrefix={screenAssistantTargetPrefix}
					selectedListItemIndexByField={selectedListItemIndexByField}
				/>
			) : undefined}
			screenAssistantTargetPrefix={screenAssistantTargetPrefix}
			suppressBottomScrollMask={frontmatter?.enabled}
			{...props}
		/>
	),
);

AgentConfigFields.displayName = "AgentConfigFields";
