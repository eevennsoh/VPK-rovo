"use client";

import { useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";

import "@/components/ui-custom/rich-text-editor/rich-text-editor.css";
import { EditorToolbar } from "@/components/blocks/editor-toolbar";
import { createRichTextEditorExtensions } from "@/components/ui-custom/rich-text-editor";
import {
	applyMarkdownFormat,
	type MarkdownFormatKind,
} from "@/components/ui-custom/rich-text-editor/markdown-format";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export interface EditorToolbarPageProps {
	className?: string;
}

export default function EditorToolbarPage({
	className,
}: Readonly<EditorToolbarPageProps>) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [isMarkdownMode, setIsMarkdownMode] = useState(false);
	const [markdownSource, setMarkdownSource] = useState("");
	const editor = useEditor({
		extensions: createRichTextEditorExtensions(),
		content: "Use the toolbar to format this editor content.",
		contentType: "markdown",
		immediatelyRender: false,
		editorProps: {
			attributes: {
				"aria-label": "Editor toolbar demo editor",
				class: "tiptap-editor min-h-24",
			},
		},
	});

	function handleToggleMarkdownMode(): void {
		if (!editor) {
			return;
		}

		if (isMarkdownMode) {
			editor.commands.setContent(markdownSource, {
				contentType: "markdown",
				emitUpdate: false,
			});
			setIsMarkdownMode(false);
			return;
		}

		setMarkdownSource(editor.getMarkdown());
		setIsMarkdownMode(true);
	}

	function handleMarkdownSourceChange(next: string): void {
		setMarkdownSource(next);
	}

	function handleMarkdownFormat(kind: MarkdownFormatKind): void {
		const textarea = textareaRef.current;

		if (!textarea) {
			return;
		}

		let linkUrl: string | undefined;

		if (kind === "link") {
			linkUrl = window.prompt("Enter URL") ?? undefined;

			if (!linkUrl) {
				return;
			}
		}

		const result = applyMarkdownFormat(
			kind,
			{
				value: textarea.value,
				selectionStart: textarea.selectionStart,
				selectionEnd: textarea.selectionEnd,
			},
			{ linkUrl },
		);

		handleMarkdownSourceChange(result.value);

		requestAnimationFrame(() => {
			const node = textareaRef.current;

			if (!node) {
				return;
			}

			node.focus();
			node.setSelectionRange(result.selectionStart, result.selectionEnd);
		});
	}

	return (
		<div
			className={cn("mx-auto flex w-full max-w-[720px] flex-col rounded-lg border border-border bg-surface", className)}
			style={{ padding: token("space.200"), gap: token("space.200") }}
		>
			{editor ? (
				<EditorToolbar
					editor={editor}
					isMarkdownMode={isMarkdownMode}
					onToggleMarkdownMode={handleToggleMarkdownMode}
					onMarkdownFormat={handleMarkdownFormat}
				/>
			) : null}
			<div className="rich-text-editor-content rounded-md bg-surface-sunken p-3">
				{isMarkdownMode ? (
					<textarea
						ref={textareaRef}
						aria-label="Editor toolbar demo Markdown source"
						className="min-h-24 w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-text outline-none field-sizing-content"
						value={markdownSource}
						onChange={(event) => handleMarkdownSourceChange(event.target.value)}
					/>
				) : editor ? (
					<EditorContent editor={editor} />
				) : null}
			</div>
		</div>
	);
}

export { EditorToolbar };
export type { EditorToolbarProps } from "@/components/blocks/editor-toolbar";
