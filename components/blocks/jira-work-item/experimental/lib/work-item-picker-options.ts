import type { SkillsDirectorySkill } from "@/app/data/directory";

export const WORK_ITEM_SKILLS: readonly SkillsDirectorySkill[] = [
	{
		id: "summarize-work-item",
		name: "Summarize work item",
		description: "Summarize the work item's scope, status, and key details.",
		icon: "page",
		source: "platform",
	},
	{
		id: "summarize-comments",
		name: "Summarize comments",
		description: "Summarize the discussion and its decisions or open questions.",
		icon: "comment",
		source: "platform",
	},
	{
		id: "improve-description",
		name: "Improve description",
		description: "Rewrite the work item description for clarity and completeness.",
		icon: "edit",
		source: "platform",
	},
	{
		id: "suggest-child-work-items",
		name: "Suggest child work items",
		description: "Break the work into a practical set of child work items.",
		icon: "branch",
		source: "platform",
	},
	{
		id: "link-similar-work-items",
		name: "Link similar work items",
		description: "Find related work items that should be linked.",
		icon: "link",
		source: "platform",
	},
];

export const DEFAULT_PINNED_SPACE_AGENT_IDS = [
	"rfp-drafting-agent",
	"readiness-checker",
] as const;

export const DEFAULT_PINNED_WORK_ITEM_SKILL_IDS = [
	"summarize-comments",
	"improve-description",
] as const;

export const WORK_ITEM_PINNED_ITEMS_LABEL = "Pinned by space";
