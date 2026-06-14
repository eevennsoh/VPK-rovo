"use client";

// oxlint-disable react-doctor/jsx-no-jsx-as-prop -- These components intentionally use slot/render-node props for icons, triggers, and adornments.

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import PageIcon from "@atlaskit/icon/core/page";
import type { ReactNode } from "react";

import { DEFAULT_SKILLS, getSkillCollectionId, getSkillIcon } from "@/app/data/directory/skills";
import { getDirectoryMentionItemOrFallback } from "@/components/blocks/editor-palette/data/mention-sources";
import { HoverCard, HoverCardTrigger } from "@/components/ui/hover-card";
import { Tag } from "@/components/ui/tag";
import { SkillTag, type SkillTagColor } from "@/components/ui-custom/skill-tag";
import { getMentionCategory } from "./extensions";
import {
	RichTextMentionVisualMark,
	getRichTextMentionTagColor,
	getRichTextMentionTagType,
	getRichTextMentionVisualFromAttrs,
} from "./mention-visual";
import {
	getRichTextReferencePreview,
	RichTextReferencePreviewContent,
} from "./reference-preview";
import type {
	RichTextMentionCategory,
	RichTextMentionVisual,
	RichTextReferenceCategory,
} from "./types";

const REFERENCE_CATEGORIES: ReadonlySet<RichTextReferenceCategory> = new Set([
	"app",
	"subagent",
	"skill",
	"tool",
	"knowledge",
]);

function isReferenceCategory(
	category: string,
): category is RichTextReferenceCategory {
	return REFERENCE_CATEGORIES.has(category as RichTextReferenceCategory);
}

// Mirrors the agent config panel reference chip: prefer the visual stored on the
// node, then fall back to the directory entry for the category so a token shows
// the same icon/logo as its config-panel chip even when attrs predate visuals.
function resolveMentionVisual(
	category: string,
	label: string,
	attrs: Record<string, unknown>,
): RichTextMentionVisual | undefined {
	const attrVisual = getRichTextMentionVisualFromAttrs(attrs);
	if (attrVisual) {
		return attrVisual;
	}

	if (isReferenceCategory(category)) {
		return getDirectoryMentionItemOrFallback(category, label).visual;
	}

	return undefined;
}

function getSkillMentionTagProps(label: string): { color: SkillTagColor; icon: ReactNode } {
	const skill = DEFAULT_SKILLS.find((entry) => entry.name === label);
	return {
		color: skill ? getSkillCollectionId(skill) : "default",
		icon: getSkillIcon(skill?.icon ?? "page"),
	};
}

export function RichTextMentionNodeView({ node }: Readonly<ReactNodeViewProps>) {
	const attrs = node.attrs;
	const category = getMentionCategory(attrs.id, attrs.category);
	const label = String(attrs.label ?? attrs.id ?? "");
	const visual = resolveMentionVisual(category, label, attrs);
	const preview = isReferenceCategory(category) ? getRichTextReferencePreview(category, label) : undefined;
	const skillTagProps = category === "skill" ? getSkillMentionTagProps(label) : undefined;
	const tag = skillTagProps ? (
		<SkillTag className="rich-text-mention-chip mx-0.5" color={skillTagProps.color} icon={skillTagProps.icon}>
			{label}
		</SkillTag>
	) : (
		<Tag
			className="rich-text-mention-chip"
			color={getRichTextMentionTagColor(visual)}
			elemBefore={visual ? (
				<RichTextMentionVisualMark
					category={category as RichTextMentionCategory}
					label={label}
					visual={visual}
				/>
			) : (
				<PageIcon label="" size="small" />
			)}
			type={getRichTextMentionTagType(visual)}
		>
			{label}
		</Tag>
	);

	return (
		<NodeViewWrapper
			as="span"
			className="rich-text-mention-node inline-flex"
			data-mention-category={category}
			data-mention-has-visual={visual ? "true" : undefined}
			>
				{preview ? (
					<HoverCard>
						<HoverCardTrigger closeDelay={80} delay={120} render={<span className="rich-text-mention-trigger-wrapper inline-flex max-w-full" />}>
							{tag}
						</HoverCardTrigger>
						<RichTextReferencePreviewContent preview={preview} />
				</HoverCard>
			) : tag}
		</NodeViewWrapper>
	);
}
