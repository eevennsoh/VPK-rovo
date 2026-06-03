"use client";

import type { ReactNode } from "react";

import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import ToolsIcon from "@atlaskit/icon/core/tools";
import BookOpenIcon from "@atlaskit/icon-lab/core/book-open";
import SkillIcon from "@atlaskit/icon-lab/core/skill";

import type { RichTextReferenceCategory } from "./types";

export interface RichTextReferenceCategoryOption {
	category: RichTextReferenceCategory;
	icon: ReactNode;
	label: string;
}

export const RICH_TEXT_REFERENCE_CATEGORY_OPTIONS = [
	{
		category: "subagent",
		label: "Subagents",
		icon: <AiAgentIcon label="" size="small" />,
	},
	{
		category: "skill",
		label: "Skills",
		icon: <SkillIcon label="" size="small" />,
	},
	{
		category: "tool",
		label: "Tools",
		icon: <ToolsIcon label="" size="small" />,
	},
	{
		category: "knowledge",
		label: "Knowledge",
		icon: <BookOpenIcon label="" size="small" />,
	},
] as const satisfies readonly RichTextReferenceCategoryOption[];

export function isRichTextReferenceCategory(value: string): value is RichTextReferenceCategory {
	return RICH_TEXT_REFERENCE_CATEGORY_OPTIONS.some((option) => option.category === value);
}

export function getRichTextReferenceCategoryIcon(
	category: RichTextReferenceCategory,
): ReactNode {
	return RICH_TEXT_REFERENCE_CATEGORY_OPTIONS.find((option) => option.category === category)?.icon;
}

export function getRichTextReferenceCategoryLabel(
	category: RichTextReferenceCategory,
): string {
	return RICH_TEXT_REFERENCE_CATEGORY_OPTIONS.find((option) => option.category === category)?.label ?? category;
}
