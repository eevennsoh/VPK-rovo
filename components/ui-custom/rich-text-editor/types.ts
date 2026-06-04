"use client";

import type { ReactElement } from "react";
import type { Editor } from "@tiptap/core";

import type { AtlassianLogoName } from "@/components/ui/logo";

/**
 * "@" mentions people and agents only.
 */
export type RichTextMentionTarget = "subagent" | "human" | "team";

export type RichTextReferenceCategory = "subagent" | "skill" | "tool" | "knowledge";

/**
 * "/" command categories. Each opens a nested list of reference items and is
 * inserted as a mention token. "knowledge" is the former "link" category;
 * "memory" folded into "knowledge" and "trigger" was retired.
 */
export type RichTextCommandCategory = RichTextReferenceCategory;

/**
 * "/" parent categories. Format is a command-only category whose children run
 * editor formatting commands instead of inserting mention/reference tokens.
 */
export type RichTextSlashCategory = RichTextCommandCategory | "format";

/**
 * Every inserted mention/reference token belongs to one of these categories,
 * spanning both the "@" mention surface and the "/" command surface.
 */
export type RichTextMentionCategory = RichTextMentionTarget | RichTextCommandCategory;

export interface RichTextMentionItem {
	category: RichTextMentionCategory;
	id: string;
	label: string;
	description?: string;
	visual?: RichTextMentionVisual;
}

export type RichTextMentionVisual =
	| {
			kind: "avatar" | "image";
			shape?: "circle" | "square" | "hexagon";
			src: string;
		}
	| {
			kind: "logo";
			logoName: AtlassianLogoName;
		}
	| {
			kind: "icon";
			icon: ReactElement;
			iconColor?: string;
			iconKey?: string;
	};

export interface RichTextMentionRemovalRequest {
	category: RichTextReferenceCategory;
	id?: string;
	key: string;
	label?: string;
}

export type RichTextMentionSources = Partial<
	Record<RichTextMentionCategory, readonly RichTextMentionItem[]>
>;

export interface RichTextEditorExtensionOptions {
	getMentionSources?: () => RichTextMentionSources | undefined;
	onAskRovo?: (editor: Editor) => void;
}
