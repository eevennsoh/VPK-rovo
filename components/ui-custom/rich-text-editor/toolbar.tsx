"use client";

import type { ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";

import {
	EditorToolbar,
	type EditorToolbarProps,
} from "@/components/blocks/editor-toolbar";

export type RichTextEditorToolbarProps = EditorToolbarProps;

interface RichTextEditorBubbleMenuProps {
	editor: Editor;
	leadingSlot?: ReactNode;
}

interface RichTextEditorFloatingMenuProps {
	editor: Editor;
	leadingSlot?: ReactNode;
}

export function RichTextEditorToolbar(
	props: Readonly<RichTextEditorToolbarProps>,
) {
	return <EditorToolbar {...props} />;
}

export function RichTextEditorBubbleMenu({
	editor,
	leadingSlot,
}: Readonly<RichTextEditorBubbleMenuProps>) {
	return (
		<BubbleMenu
			editor={editor}
			className="z-[1000] flex items-stretch rounded-lg bg-popover text-popover-foreground shadow-2xl"
			shouldShow={({ editor: activeEditor, from, to }) =>
				activeEditor.isEditable && from !== to
			}
		>
			<EditorToolbar
				editor={editor}
				leadingSlot={leadingSlot}
				className="gap-0"
				controlsClassName="px-2 py-1"
			/>
		</BubbleMenu>
	);
}

export function RichTextEditorFloatingMenu({
	editor,
	leadingSlot,
}: Readonly<RichTextEditorFloatingMenuProps>) {
	return (
		<FloatingMenu
			editor={editor}
			className="z-[1000] flex items-stretch rounded-lg bg-popover text-popover-foreground shadow-2xl"
		>
			<EditorToolbar
				editor={editor}
				leadingSlot={leadingSlot}
				className="gap-0"
				controlsClassName="px-2 py-1"
			/>
		</FloatingMenu>
	);
}
