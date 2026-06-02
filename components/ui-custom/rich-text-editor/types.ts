"use client";

/**
 * "@" mentions people and agents only.
 */
export type RichTextMentionTarget = "subagent" | "human" | "team";

/**
 * "/" command categories. Each opens a nested list of reference items and is
 * inserted as a mention token. "knowledge" is the former "link" category;
 * "memory" folded into "knowledge" and "trigger" was retired.
 */
export type RichTextCommandCategory = "skill" | "tool" | "knowledge";

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
}

export type RichTextMentionSources = Partial<
	Record<RichTextMentionCategory, readonly RichTextMentionItem[]>
>;

export interface RichTextEditorExtensionOptions {
	getMentionSources?: () => RichTextMentionSources | undefined;
}
