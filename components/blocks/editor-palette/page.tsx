"use client";

import type { ReactNode } from "react";

import "@/components/ui-custom/rich-text-editor/rich-text-editor.css";
import {
	RichTextEditor,
	RichTextSuggestionMenu,
	SLASH_COMMANDS,
	getMentionContextMenuItems,
	type RichTextMentionSources,
} from "@/components/ui-custom/rich-text-editor";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import { EDITOR_PALETTE_MENTION_SOURCES } from "./data/mention-sources";

export interface EditorPaletteProps {
	/** Mention categories that drive the "@" Add context menu counts. */
	mentionSources?: RichTextMentionSources;
	/** Render a live editor where typing "@" or "/" opens the real menus. */
	showLiveEditor?: boolean;
	className?: string;
}

function noop(): void {}

export default function EditorPalette({
	mentionSources = EDITOR_PALETTE_MENTION_SOURCES,
	showLiveEditor = true,
	className,
}: Readonly<EditorPaletteProps>) {
	const contextItems = getMentionContextMenuItems(mentionSources);

	return (
		<div
			className={cn("flex w-full max-w-[720px] flex-col", className)}
			style={{ gap: token("space.400") }}
		>
			<div
				className="flex flex-wrap items-start justify-center"
				style={{ gap: token("space.300") }}
			>
				<PalettePanel trigger="@" caption="Add context">
					<RichTextSuggestionMenu
						title="Add context"
						emptyLabel="No mention categories found"
						items={contextItems}
						selectedIndex={0}
						onSelect={noop}
					/>
				</PalettePanel>

				<PalettePanel trigger="/" caption="Basic blocks">
					<RichTextSuggestionMenu
						title="Basic blocks"
						emptyLabel="No commands found"
						items={SLASH_COMMANDS}
						selectedIndex={0}
						onSelect={noop}
					/>
				</PalettePanel>
			</div>

			{showLiveEditor ? (
				<div
					className="rounded-lg border border-border bg-surface"
					style={{ padding: token("space.200") }}
				>
					<RichTextEditor
						mentionSources={mentionSources}
						placeholder="Type @ to add context, or / for basic blocks…"
						showToolbar={false}
						showBubbleMenu={false}
						aria-label="Editor palette demo"
						editorClassName="agent-instructions-tiptap-editor"
					/>
				</div>
			) : null}
		</div>
	);
}

interface PalettePanelProps {
	trigger: string;
	caption: string;
	children: ReactNode;
}

function PalettePanel({ trigger, caption, children }: Readonly<PalettePanelProps>) {
	return (
		<figure className="m-0 flex flex-col" style={{ gap: token("space.100") }}>
			<figcaption className="flex items-center" style={{ gap: token("space.100") }}>
				<span
					className="inline-flex items-center justify-center rounded-sm bg-surface-sunken font-mono text-text-subtle"
					style={{ width: 24, height: 24, fontSize: 13 }}
				>
					{trigger}
				</span>
				<span className="text-sm font-medium text-text">{caption}</span>
			</figcaption>
			{children}
		</figure>
	);
}
