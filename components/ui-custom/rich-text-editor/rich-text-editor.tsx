"use client";

import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";

import { cn } from "@/lib/utils";

import { createRichTextEditorExtensions } from "./extensions";
import {
	applyMarkdownFormat,
	type MarkdownFormatKind,
} from "./markdown-format";
import "./rich-text-editor.css";
import {
	RichTextEditorBubbleMenu,
	RichTextEditorFloatingMenu,
	RichTextEditorToolbar,
} from "./toolbar";
import type { RichTextMentionSources } from "./types";

interface RichTextEditorProps
	extends Omit<ComponentProps<"div">, "onChange"> {
	value?: string;
	placeholder?: string;
	editorClassName?: string;
	contentClassName?: string;
	toolbarEndSlot?: ReactNode;
	mentionSources?: RichTextMentionSources;
	onMarkdownChange?: (value: string) => void;
	onPlainTextChange?: (value: string) => void;
	showToolbar?: boolean;
	showBubbleMenu?: boolean;
	showFloatingMenu?: boolean;
	showCommentControl?: boolean;
	showMoreControl?: boolean;
	"aria-label"?: string;
}

function toCssString(value: string): string {
	return JSON.stringify(value);
}

export function RichTextEditor({
	value,
	placeholder,
	className,
	editorClassName,
	contentClassName,
	toolbarEndSlot,
	mentionSources,
	onMarkdownChange,
	onPlainTextChange,
	showToolbar = true,
	showBubbleMenu = true,
	showFloatingMenu = false,
	showCommentControl = true,
	showMoreControl = true,
	"aria-label": ariaLabel,
	...props
}: Readonly<RichTextEditorProps>) {
	const mentionSourcesRef = useRef(mentionSources);
	const onMarkdownChangeRef = useRef(onMarkdownChange);
	const onPlainTextChangeRef = useRef(onPlainTextChange);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [isEmpty, setIsEmpty] = useState(() => !value?.trim());
	const [isMarkdownMode, setIsMarkdownMode] = useState(false);
	const [markdownSource, setMarkdownSource] = useState("");
	const extensions = useMemo(
		() => createRichTextEditorExtensions({
			getMentionSources: () => mentionSourcesRef.current,
		}),
		[],
	);
	const editor = useEditor({
		extensions,
		content: value ?? "",
		contentType: "markdown",
		immediatelyRender: false,
		editorProps: {
			attributes: {
				"aria-label": ariaLabel ?? "Rich text editor",
				class: cn("tiptap-editor", editorClassName),
			},
		},
		onUpdate: ({ editor: activeEditor }) => {
			setIsEmpty(activeEditor.isEmpty);
			const markdown = activeEditor.getMarkdown();
			onMarkdownChangeRef.current?.(markdown);
			onPlainTextChangeRef.current?.(markdown);
		},
	});

	useEffect(() => {
		mentionSourcesRef.current = mentionSources;
	}, [mentionSources]);

	useEffect(() => {
		onMarkdownChangeRef.current = onMarkdownChange;
	}, [onMarkdownChange]);

	useEffect(() => {
		onPlainTextChangeRef.current = onPlainTextChange;
	}, [onPlainTextChange]);

	useEffect(() => {
		if (!editor) {
			return;
		}

		const nextValue = value ?? "";

		if (editor.getMarkdown() === nextValue) {
			return;
		}

		editor.commands.setContent(nextValue, {
			contentType: "markdown",
			emitUpdate: false,
		});
		setIsEmpty(!nextValue.trim());
	}, [editor, value]);

	function handleToggleMarkdownMode(): void {
		if (!editor) {
			return;
		}

		if (isMarkdownMode) {
			editor.commands.setContent(markdownSource, {
				contentType: "markdown",
				emitUpdate: false,
			});
			setIsEmpty(!markdownSource.trim());
			setIsMarkdownMode(false);
			return;
		}

		setMarkdownSource(editor.getMarkdown());
		setIsMarkdownMode(true);
	}

	function handleMarkdownSourceChange(next: string): void {
		setMarkdownSource(next);
		setIsEmpty(!next.trim());
		onMarkdownChangeRef.current?.(next);
		onPlainTextChangeRef.current?.(next);
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

		// Restore focus + selection after React re-renders the controlled textarea.
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
		<div className={cn("space-y-2", className)} {...props}>
			{showToolbar && editor ? (
				<RichTextEditorToolbar
					editor={editor}
					endSlot={toolbarEndSlot}
					showCommentControl={showCommentControl}
					showMoreControl={showMoreControl}
					isMarkdownMode={isMarkdownMode}
					onToggleMarkdownMode={handleToggleMarkdownMode}
					onMarkdownFormat={handleMarkdownFormat}
				/>
			) : null}
			<div
				className={cn("rich-text-editor-content relative", contentClassName)}
				data-empty={isEmpty ? "true" : undefined}
				style={
					placeholder
						? ({
								"--rich-text-placeholder": toCssString(placeholder),
							} as CSSProperties)
						: undefined
					}
				>
				{isMarkdownMode ? (
					<textarea
						ref={textareaRef}
						className={cn(
							"min-h-24 w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-text outline-none field-sizing-content",
							editorClassName,
						)}
						aria-label={`${ariaLabel ?? "Rich text editor"} Markdown source`}
						data-rich-text-markdown-source
						placeholder={placeholder}
						value={markdownSource}
						onChange={(event) => handleMarkdownSourceChange(event.target.value)}
					/>
				) : (
					<EditorContent editor={editor} />
				)}
				{showBubbleMenu && editor && !isMarkdownMode ? (
					<RichTextEditorBubbleMenu
						editor={editor}
						showCommentControl={showCommentControl}
						showMoreControl={showMoreControl}
					/>
				) : null}
				{showFloatingMenu && editor && !isMarkdownMode ? (
					<RichTextEditorFloatingMenu
						editor={editor}
						showCommentControl={showCommentControl}
						showMoreControl={showMoreControl}
					/>
				) : null}
			</div>
		</div>
	);
}

export {
	RichTextEditorBubbleMenu,
	RichTextEditorFloatingMenu,
	RichTextEditorToolbar,
};
export type { RichTextMentionSources };
