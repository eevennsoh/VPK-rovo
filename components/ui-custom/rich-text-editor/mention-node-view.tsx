"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import PageIcon from "@atlaskit/icon/core/page";

import { getDirectoryMentionItemOrFallback } from "@/components/blocks/editor-palette/data/mention-sources";
import { Tag } from "@/components/ui/tag";
import {
	RichTextMentionVisualMark,
	getRichTextMentionTagColor,
	getRichTextMentionTagType,
	getRichTextMentionVisualFromAttrs,
} from "./mention-visual";
import type {
	RichTextMentionCategory,
	RichTextMentionVisual,
	RichTextReferenceCategory,
} from "./types";

const REFERENCE_CATEGORIES: ReadonlySet<RichTextReferenceCategory> = new Set([
	"subagent",
	"skill",
	"tool",
	"knowledge",
]);

function getMentionCategory(id: unknown, category: unknown): string {
	if (typeof category === "string" && category.trim()) {
		return category;
	}

	if (typeof id !== "string") {
		return "context";
	}

	return id.split(":")[0] || "context";
}

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

export function RichTextMentionNodeView({ node }: Readonly<ReactNodeViewProps>) {
	const attrs = node.attrs;
	const category = getMentionCategory(attrs.id, attrs.category);
	const label = String(attrs.label ?? attrs.id ?? "");
	const visual = resolveMentionVisual(category, label, attrs);

	return (
		<NodeViewWrapper
			as={Tag}
			className="rich-text-mention-node"
			color={getRichTextMentionTagColor(visual)}
			data-mention-category={category}
			data-mention-has-visual={visual ? "true" : undefined}
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
		</NodeViewWrapper>
	);
}
