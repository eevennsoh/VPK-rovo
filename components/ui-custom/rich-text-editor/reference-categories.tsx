"use client";

import type { ReactNode } from "react";

import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import AppsIcon from "@atlaskit/icon/core/apps";
import ToolsIcon from "@atlaskit/icon/core/tools";
import BookOpenIcon from "@atlaskit/icon-lab/core/book-open";
import SkillIcon from "@atlaskit/icon-lab/core/skill";

import type { RichTextReferenceCategory } from "./types";

export interface RichTextReferenceCategoryOption {
	category: RichTextReferenceCategory;
	icon: ReactNode;
	label: string;
}

/**
 * The reference categories shown as palette groups (toolbar "Add content" and the
 * "/" command menu, which derives its order from this list). Tools + knowledge
 * are unified under "Apps"; their standalone groups are intentionally hidden.
 */
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
		category: "app",
		label: "Apps",
		icon: <AppsIcon label="" size="small" />,
	},
] as const satisfies readonly RichTextReferenceCategoryOption[];

/**
 * Legacy categories kept only so existing `@[tool:…]` / `@[knowledge:…]` lozenges
 * still resolve an icon/label. They are no longer surfaced as their own palette
 * groups — both now live under the unified "Apps" group.
 */
const LEGACY_REFERENCE_CATEGORY_OPTIONS = [
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

const ALL_REFERENCE_CATEGORY_OPTIONS: readonly RichTextReferenceCategoryOption[] = [
	...RICH_TEXT_REFERENCE_CATEGORY_OPTIONS,
	...LEGACY_REFERENCE_CATEGORY_OPTIONS,
];

export function isRichTextReferenceCategory(value: string): value is RichTextReferenceCategory {
	return ALL_REFERENCE_CATEGORY_OPTIONS.some((option) => option.category === value);
}

export function getRichTextReferenceCategoryIcon(
	category: RichTextReferenceCategory,
): ReactNode {
	return ALL_REFERENCE_CATEGORY_OPTIONS.find((option) => option.category === category)?.icon;
}

export function getRichTextReferenceCategoryLabel(
	category: RichTextReferenceCategory,
): string {
	return ALL_REFERENCE_CATEGORY_OPTIONS.find((option) => option.category === category)?.label ?? category;
}
