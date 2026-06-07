import { createElement, type ReactElement } from "react";

import { RichTextMentionVisualMark } from "@/components/ui-custom/rich-text-editor/mention-visual";

import knowledgeData from "./knowledge.json";
import type { DirectoryVisual } from "./types";
import { resolveDirectoryVisual } from "./visual";

export type KnowledgeDirectoryMode = "all" | "custom";

export interface KnowledgeDirectoryContent {
	id: string;
	name: string;
	description: string;
}

/**
 * Data-shape mirror of the Knowledge Directory's runtime app. The original
 * component carried a live `icon: ReactNode`, which is not JSON-serializable; the
 * data layer drops it and keeps the already-serializable `visual` descriptor.
 * Directory consumers that previously read `app.icon` rebuild the element on
 * demand via {@link getKnowledgeAppIcon}.
 */
export interface KnowledgeDirectoryApp {
	id: string;
	name: string;
	description: string;
	providerName: string;
	visual: DirectoryVisual;
	contents: readonly KnowledgeDirectoryContent[];
}

/**
 * The complete knowledge directory catalog, sourced from `knowledge.json` as the
 * single source of truth. The JSON is structurally a `KnowledgeDirectoryApp[]`;
 * we assert the type here so callers get full typing without the loader having to
 * re-declare the data inline.
 */
export const DEFAULT_KNOWLEDGE_APPS: readonly KnowledgeDirectoryApp[] =
	knowledgeData as readonly KnowledgeDirectoryApp[];

/**
 * Rebuilds the leading icon element for a knowledge app from its serializable
 * `visual` descriptor — the replacement for the old `app.icon` field. The
 * descriptor is rehydrated via {@link resolveDirectoryVisual} and rendered with
 * the shared `RichTextMentionVisualMark` so every directory surface produces the
 * same logo/image/icon markup the data used to carry inline. `createElement`
 * keeps this loader JSX-free so it can stay a `.ts` data module.
 */
export function getKnowledgeAppIcon(app: KnowledgeDirectoryApp): ReactElement | null {
	const visual = resolveDirectoryVisual(app.visual);
	if (!visual) {
		return null;
	}

	return createElement(RichTextMentionVisualMark, {
		label: app.name,
		size: "menu",
		visual,
	});
}

/** Convenience lookup for sidebar and detail references. */
export function getKnowledgeAppById(
	apps: readonly KnowledgeDirectoryApp[],
	id: string,
): KnowledgeDirectoryApp | undefined {
	return apps.find((app) => app.id === id);
}
