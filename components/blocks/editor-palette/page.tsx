"use client";

import type { ReactNode } from "react";

import "@/components/ui-custom/rich-text-editor/rich-text-editor.css";
import {
	RichTextEditor,
	RichTextSuggestionMenu,
	getMentionTargetItems,
	getSlashCommandCategoryItems,
	getSlashCommandFormatItems,
	type RichTextMentionSources,
} from "@/components/ui-custom/rich-text-editor";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import { EDITOR_PALETTE_MENTION_SOURCES } from "./data/mention-sources";

export interface EditorPaletteProps {
	/** Skill catalog that drives the live editor's "/" Skills submenu counts. */
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
	const mentionItems = getMentionTargetItems(mentionSources);
	const commandItems = getSlashCommandCategoryItems(mentionSources);
	const formatItems = getSlashCommandFormatItems();

	return (
		<div
			className={cn("flex w-full min-w-[1008px] max-w-[1120px] flex-col", className)}
			style={{ gap: token("space.400") }}
		>
			<div
				className="flex w-full flex-nowrap items-start justify-start overflow-x-auto lg:justify-center"
				style={{ gap: token("space.300") }}
			>
				<PalettePanel trigger="@" caption="Mention">
					<RichTextSuggestionMenu
						className="rich-text-command-menu-borderless rich-text-command-menu-showcase"
						title="Mention"
						emptyLabel="No people or agents found"
						items={mentionItems}
						selectedIndex={0}
						onSelect={noop}
					/>
				</PalettePanel>

				<PalettePanel trigger="/" caption="Commands">
					<RichTextSuggestionMenu
						className="rich-text-command-menu-borderless rich-text-command-menu-showcase"
						title="Commands"
						emptyLabel="No commands found"
						items={commandItems}
						selectedIndex={0}
						onSelect={noop}
					/>
				</PalettePanel>

				<PalettePanel trigger="/" caption="Format nested">
					<RichTextSuggestionMenu
						className="rich-text-command-menu-borderless rich-text-command-menu-showcase"
						title="Format"
						emptyLabel="No matching items"
						items={formatItems}
						selectedIndex={0}
						onBack={noop}
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
						placeholder="Type @ to mention people and agents, or / for commands…"
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
