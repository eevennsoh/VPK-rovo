"use client";

import SkillIcon from "@atlaskit/icon-lab/core/skill";
import { useMemo, type ReactElement } from "react";

import {
	DEFAULT_SKILLS,
	getSkillDirectoryVisual,
	resolveDirectoryVisual,
	type SkillsDirectorySkill,
} from "@/app/data/directory";
import {
	AgentSelector,
	type AgentSelectorAction,
	type AgentSelectorAgent,
} from "@/components/blocks/agent-selector";
import { Icon } from "@/components/ui/icon";
import { RichTextMentionVisualMark } from "@/components/ui-custom/rich-text-editor";

export type SkillSelectorAction = AgentSelectorAction;

const CREATE_SKILL_DIRECTORY_ID = "create-skill";

export interface SkillSelectorProps {
	skills?: readonly SkillsDirectorySkill[];
	browseSkillsLabel?: string;
	className?: string;
	createSkillLabel?: string;
	defaultQuery?: string;
	defaultPinnedSkillIds?: readonly string[];
	disabledSkillIds?: readonly string[];
	emptyMessage?: string;
	heading?: string;
	onBrowseSkills?: () => void;
	onCreateSkill?: () => void;
	onPinnedSkillIdsChange?: (skillIds: readonly string[]) => void;
	onQueryChange?: (query: string) => void;
	onSkillToggle?: (skillId: string) => void;
	query?: string;
	searchPlaceholder?: string;
	pinnedSkillIds?: readonly string[];
	pinnedItemsLabel?: string;
	pinningEnabled?: boolean;
	selectedSkillActions?: readonly SkillSelectorAction[];
	selectedSkillIds?: readonly string[];
	selectionMode?: "multiple" | "single";
}

function SkillSelectorVisual({ skill }: Readonly<{ skill: SkillsDirectorySkill }>): ReactElement {
	const visual = resolveDirectoryVisual(getSkillDirectoryVisual(skill));
	return visual ? (
		<RichTextMentionVisualMark category="skill" label={skill.name} size="menu-compact" visual={visual} />
	) : (
		<span aria-hidden className="size-6 shrink-0" />
	);
}

/** Directory-backed skill picker with the same shell and interaction design as Agent Selector. */
export function SkillSelector({
	skills = DEFAULT_SKILLS,
	browseSkillsLabel = "Browse skills",
	className,
	createSkillLabel = "Create skill",
	defaultQuery,
	defaultPinnedSkillIds,
	disabledSkillIds,
	emptyMessage = "No skills found.",
	heading = "Select a skill",
	onBrowseSkills,
	onCreateSkill,
	onPinnedSkillIdsChange,
	onQueryChange,
	onSkillToggle,
	query,
	searchPlaceholder = "Search skills",
	pinnedSkillIds,
	pinnedItemsLabel,
	pinningEnabled,
	selectedSkillActions,
	selectedSkillIds,
	selectionMode,
}: Readonly<SkillSelectorProps>): ReactElement {
	const hasCreateSkillFooter = Boolean(onCreateSkill);
	const selectorItems = useMemo<readonly AgentSelectorAgent[]>(
		() => skills
			.filter((skill) => !hasCreateSkillFooter || skill.id !== CREATE_SKILL_DIRECTORY_ID)
			.map((skill) => ({
				id: skill.id,
				name: skill.name,
				byline: skill.description,
				visual: <SkillSelectorVisual skill={skill} />,
			})),
		[hasCreateSkillFooter, skills],
	);

	return (
		<AgentSelector
			agents={selectorItems}
			availableLabel="skills"
			browseAgentsLabel={browseSkillsLabel}
			browseIcon={<Icon aria-hidden className="size-4" render={<SkillIcon label="" />} />}
			className={className}
			createAgentLabel={createSkillLabel}
			defaultQuery={defaultQuery}
			defaultPinnedAgentIds={defaultPinnedSkillIds}
			disabledAgentIds={disabledSkillIds}
			emptyMessage={emptyMessage}
			heading={heading}
			listLabel="Skills"
			moreItemsLabel="More skills"
			onAgentToggle={onSkillToggle}
			onBrowseAgents={onBrowseSkills}
			onCreateAgent={onCreateSkill}
			onPinnedAgentIdsChange={onPinnedSkillIdsChange}
			onQueryChange={onQueryChange}
			query={query}
			searchPlaceholder={searchPlaceholder}
			pinnedAgentIds={pinnedSkillIds}
			pinnedItemsLabel={pinnedItemsLabel}
			pinningEnabled={pinningEnabled}
			selectedActionsLabel="Selected skill actions"
			selectedAgentActions={selectedSkillActions}
			selectedAgentIds={selectedSkillIds}
			selectionMode={selectionMode}
		/>
	);
}
