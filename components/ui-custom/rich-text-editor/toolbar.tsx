"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Editor } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";

import {
	EditorToolbar,
	type EditorToolbarProps,
} from "@/components/blocks/editor-toolbar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { RovoColorIcon } from "@/components/ui/logo";

export type RichTextEditorToolbarProps = EditorToolbarProps;

const SCROLLABLE_OVERFLOW_VALUES = new Set(["auto", "scroll"]);

function getRichTextEditorMenuAppendTarget(): HTMLElement {
	return document.body;
}

function resolveEditorScrollTarget(editor: Editor): HTMLElement | Window | undefined {
	const ownerWindow = editor.view.dom.ownerDocument.defaultView;
	if (!ownerWindow) {
		return undefined;
	}

	let ancestor = editor.view.dom.parentElement;

	while (ancestor) {
		const { overflowY } = ownerWindow.getComputedStyle(ancestor);
		if (SCROLLABLE_OVERFLOW_VALUES.has(overflowY)) {
			return ancestor;
		}

		ancestor = ancestor.parentElement;
	}

	return ownerWindow;
}

function useEditorMenuOptions(editor: Editor) {
	const [scrollTarget, setScrollTarget] = useState<HTMLElement | Window | undefined>(
		editor.view.dom.ownerDocument.defaultView ?? undefined,
	);

	useEffect(() => {
		setScrollTarget(resolveEditorScrollTarget(editor));
	}, [editor]);

	return useMemo(() => ({ scrollTarget }), [scrollTarget]);
}

interface RichTextEditorBubbleMenuProps {
	editor: Editor;
	leadingSlot?: ReactNode;
	onAskRovo?: (editor: Editor) => void;
}

/**
 * The full-color "Ask Rovo" entry point shown at the front of the bubble menu.
 * It hands the active editor back to the consumer so they can open Rovo with the
 * current selection as context.
 */
function AskRovoButton({
	editor,
	onAskRovo,
}: Readonly<{ editor: Editor; onAskRovo?: (editor: Editor) => void }>) {
	return (
		// The toolbar renders `leadingSlot` outside its padded controls row, so
		// inset the button so its grey fill clears the rounded container by the
		// same ~4px the controls row's `py-1` leaves top and bottom. The
		// separator only carries a left margin — the controls row's own `px-2`
		// supplies the gap on its right.
		<div className="flex items-center pl-1">
			<Button
				type="button"
				variant="ghost"
				onClick={() => onAskRovo?.(editor)}
			>
				<RovoColorIcon size="small" />
				Ask Rovo
			</Button>
			<Separator
				orientation="vertical"
				className="ml-1 h-4 self-center bg-border data-vertical:self-center"
			/>
		</div>
	);
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
	onAskRovo,
}: Readonly<RichTextEditorBubbleMenuProps>) {
	const menuOptions = useEditorMenuOptions(editor);

	return (
		<BubbleMenu
			appendTo={getRichTextEditorMenuAppendTarget}
			editor={editor}
			className="z-[1000] flex items-stretch rounded-lg bg-popover text-popover-foreground shadow-2xl"
			options={menuOptions}
			shouldShow={({ editor: activeEditor, from, to }) =>
				activeEditor.isEditable && from !== to
			}
		>
			<EditorToolbar
				editor={editor}
				leadingSlot={
					<>
						<AskRovoButton editor={editor} onAskRovo={onAskRovo} />
						{leadingSlot}
					</>
				}
				className="gap-0"
				controlsOverflow="fixed"
				// Left padding is tightened to `pl-1` (4px) so the gap between the
				// Ask Rovo separator and the first control matches the 4px the
				// button leaves on every other side; the right edge keeps `pr-2`.
				controlsClassName="pl-1 pr-2 py-1"
			/>
		</BubbleMenu>
	);
}

export function RichTextEditorFloatingMenu({
	editor,
	leadingSlot,
}: Readonly<RichTextEditorFloatingMenuProps>) {
	const menuOptions = useEditorMenuOptions(editor);

	return (
		<FloatingMenu
			appendTo={getRichTextEditorMenuAppendTarget}
			editor={editor}
			className="z-[1000] flex items-stretch rounded-lg bg-popover text-popover-foreground shadow-2xl"
			options={menuOptions}
		>
			<EditorToolbar
				editor={editor}
				leadingSlot={leadingSlot}
				className="gap-0"
				controlsOverflow="fixed"
				controlsClassName="px-2 py-1"
			/>
		</FloatingMenu>
	);
}
