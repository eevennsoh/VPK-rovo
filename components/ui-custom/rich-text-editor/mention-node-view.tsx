"use client";

import { NodeViewWrapper, type ReactNodeViewProps } from "@tiptap/react";
import PageIcon from "@atlaskit/icon/core/page";

import { Tag } from "@/components/ui/tag";
import {
	RichTextMentionVisualMark,
	getRichTextMentionTagType,
	getRichTextMentionVisualFromAttrs,
} from "./mention-visual";
import type { RichTextMentionCategory } from "./types";

function getMentionCategory(id: unknown, category: unknown): string {
	if (typeof category === "string" && category.trim()) {
		return category;
	}

	if (typeof id !== "string") {
		return "context";
	}

	return id.split(":")[0] || "context";
}

export function RichTextMentionNodeView({ node }: Readonly<ReactNodeViewProps>) {
	const attrs = node.attrs;
	const category = getMentionCategory(attrs.id, attrs.category);
	const label = String(attrs.label ?? attrs.id ?? "");
	const visual = getRichTextMentionVisualFromAttrs(attrs);

	return (
		<NodeViewWrapper
			as={Tag}
			color="gray"
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
