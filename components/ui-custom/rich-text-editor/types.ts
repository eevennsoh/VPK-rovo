"use client";

import type { ReactElement } from "react";
import type { Editor } from "@tiptap/core";

import type { AtlassianLogoName } from "@/components/ui/logo";

/**
 * "@" mention surface: people, teams, and subagents. Each opens a nested list
 * and is inserted as a mention token.
 */
export type RichTextMentionTarget = "human" | "team" | "subagent";

/**
 * Reference categories used by the "Add content" toolbar menu. Still includes
 * "subagent" so it can be inserted from the toolbar, even though the "@" surface
 * (not "/") owns the subagent mention picker.
 */
export type RichTextReferenceCategory = "subagent" | "skill" | "tool" | "knowledge";

/**
 * "/" command categories. Each opens a nested list of reference items and is
 * inserted as a mention token. Subagents live on the "@" mention surface, so the
 * "/" surface only carries skills, tools, and knowledge.
 */
export type RichTextCommandCategory = "skill" | "tool" | "knowledge";

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

/**
 * Layout for the live "@" / "/" suggestion menus.
 *
 * - `"flat"` (default): every section is merged into one scrollable list,
 *   separated by non-interactive section headings (mirroring
 *   `DropdownMenuLabel`). On the empty query each section is capped at five
 *   items with a "Browse all" / "View more" footer; once the user starts
 *   typing, the menu filters across every section at once and shows all matches.
 * - `"nested"`: the original drill-in behavior where the top level lists
 *   categories you click into to reveal each category's items.
 */
export type RichTextSuggestionVariant = "nested" | "flat";

export interface RichTextEditorExtensionOptions {
	getMentionSources?: () => RichTextMentionSources | undefined;
	onAskRovo?: (editor: Editor) => void;
	/**
	 * Layout for the live "@" / "/" suggestion menus. Defaults to `"flat"`.
	 */
	suggestionVariant?: RichTextSuggestionVariant;
	/**
	 * Whether the "/" command menu includes the "Format" parent category (and its
	 * block/mark formatting commands). Defaults to `true` for the full document
	 * editor; the mentions-only chat composer passes `false` so the slash menu
	 * surfaces references only.
	 */
	includeFormat?: boolean;
	/**
	 * When `true`, the `@`/`/` palette anchors to the prompt-input box (the
	 * `.chat-composer-form`) instead of the caret: it spans the box's full width,
	 * sits 8px away, and flips above/below by available viewport space. The chat
	 * composer sets this; the document editor leaves it `false` (caret-anchored).
	 */
	anchorToInput?: boolean;
}
