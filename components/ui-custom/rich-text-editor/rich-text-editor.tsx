"use client";

import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";

import { cn } from "@/lib/utils";

import { createRichTextEditorExtensions } from "./extensions";
import {
	applyMarkdownFormat,
	type MarkdownFormatKind,
} from "./markdown-format";
import { MarkdownSourceEditor } from "./markdown-source-editor";
import "./rich-text-editor.css";
import {
	RichTextEditorBubbleMenu,
	RichTextEditorFloatingMenu,
	RichTextEditorToolbar,
} from "./toolbar";
import type { EditorToolbarInsertReferenceCategory } from "@/components/blocks/editor-toolbar";
import { isRichTextReferenceCategory } from "./reference-categories";
import type {
	RichTextMentionItem,
	RichTextMentionRemovalRequest,
	RichTextMentionSources,
} from "./types";

interface RichTextEditorProps
	extends Omit<ComponentProps<"div">, "onChange"> {
	value?: string;
	placeholder?: string;
	placeholderSlot?: ReactNode;
	editorClassName?: string;
	contentClassName?: string;
	toolbarEndSlot?: ReactNode;
	toolbarBelowSlot?: ReactNode;
	mentionSources?: RichTextMentionSources;
	mentionRemovalRequest?: RichTextMentionRemovalRequest | null;
	onMarkdownChange?: (value: string) => void;
	onPlainTextChange?: (value: string) => void;
	onMentionInventoryChange?: (mentions: readonly RichTextMentionItem[]) => void;
	onMentionRemovalRequestHandled?: (key: string) => void;
	onInsertReferenceOption?: (category: EditorToolbarInsertReferenceCategory, label: string) => boolean | void;
	onAskRovo?: (editor: Editor) => void;
	showToolbar?: boolean;
	showBubbleMenu?: boolean;
	showFloatingMenu?: boolean;
	"aria-label"?: string;
}

function toCssString(value: string): string {
	return JSON.stringify(value);
}

function getMentionCategory(id: unknown): string {
	if (typeof id !== "string") {
		return "";
	}

	return id.split(":")[0] ?? "";
}

function getEditorMentionInventory(editor: Editor): readonly RichTextMentionItem[] {
	const mentions: RichTextMentionItem[] = [];

	editor.state.doc.descendants((node) => {
		if (node.type.name !== "mention") {
			return true;
		}

		const category = getMentionCategory(node.attrs.id);
		if (!isRichTextReferenceCategory(category)) {
			return false;
		}

		const label = typeof node.attrs.label === "string" ? node.attrs.label.trim() : "";
		const id = typeof node.attrs.id === "string" ? node.attrs.id : "";
		if (!label || !id) {
			return false;
		}

		mentions.push({
			category,
			id,
			label,
		});
		return false;
	});

	return mentions;
}

function normalizeMentionText(value: string | undefined): string {
	return value?.trim().toLowerCase() ?? "";
}

function mentionMatchesRemovalRequest(
	attrs: Record<string, unknown>,
	request: RichTextMentionRemovalRequest,
): boolean {
	const category = getMentionCategory(attrs.id);
	if (category !== request.category) {
		return false;
	}

	const id = typeof attrs.id === "string" ? attrs.id : undefined;
	const label = typeof attrs.label === "string" ? attrs.label : undefined;

	return Boolean(
		(request.id && id === request.id) ||
		(request.label && normalizeMentionText(label) === normalizeMentionText(request.label)),
	);
}

function removeMentionsFromEditor(
	editor: Editor,
	request: RichTextMentionRemovalRequest,
): boolean {
	const ranges: Array<{ from: number; to: number }> = [];

	editor.state.doc.descendants((node, pos) => {
		if (node.type.name !== "mention") {
			return true;
		}

		if (mentionMatchesRemovalRequest(node.attrs, request)) {
			ranges.push({ from: pos, to: pos + node.nodeSize });
		}
		return false;
	});

	if (ranges.length === 0) {
		return false;
	}

	let transaction = editor.state.tr;
	for (const range of ranges.reverse()) {
		transaction = transaction.delete(range.from, range.to);
	}
	editor.view.dispatch(transaction);
	return true;
}

export function RichTextEditor({
	value,
	placeholder,
	placeholderSlot,
	className,
	editorClassName,
	contentClassName,
	toolbarEndSlot,
	toolbarBelowSlot,
	mentionSources,
	mentionRemovalRequest,
	onMarkdownChange,
	onPlainTextChange,
	onMentionInventoryChange,
	onMentionRemovalRequestHandled,
	onInsertReferenceOption,
	onAskRovo,
	showToolbar = true,
	showBubbleMenu = true,
	showFloatingMenu = false,
	"aria-label": ariaLabel,
	...props
}: Readonly<RichTextEditorProps>) {
	const mentionSourcesRef = useRef(mentionSources);
	const onMarkdownChangeRef = useRef(onMarkdownChange);
	const onPlainTextChangeRef = useRef(onPlainTextChange);
	const onMentionInventoryChangeRef = useRef(onMentionInventoryChange);
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
		onCreate: ({ editor: activeEditor }) => {
			onMentionInventoryChangeRef.current?.(getEditorMentionInventory(activeEditor));
		},
		onUpdate: ({ editor: activeEditor }) => {
			setIsEmpty(activeEditor.isEmpty);
			const markdown = activeEditor.getMarkdown();
			onMarkdownChangeRef.current?.(markdown);
			onPlainTextChangeRef.current?.(markdown);
			onMentionInventoryChangeRef.current?.(getEditorMentionInventory(activeEditor));
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
		onMentionInventoryChangeRef.current = onMentionInventoryChange;
	}, [onMentionInventoryChange]);

	useEffect(() => {
		if (!editor || !mentionRemovalRequest) {
			return;
		}

		removeMentionsFromEditor(editor, mentionRemovalRequest);
		onMentionRemovalRequestHandled?.(mentionRemovalRequest.key);
	}, [editor, mentionRemovalRequest, onMentionRemovalRequestHandled]);

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
		onMentionInventoryChangeRef.current?.(getEditorMentionInventory(editor));
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
			onMentionInventoryChangeRef.current?.(getEditorMentionInventory(editor));
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
					isMarkdownMode={isMarkdownMode}
					onToggleMarkdownMode={handleToggleMarkdownMode}
					onMarkdownFormat={handleMarkdownFormat}
					onInsertReferenceOption={onInsertReferenceOption}
				/>
			) : null}
			{toolbarBelowSlot ? (
				<div data-slot="rich-text-editor-toolbar-below">
					{toolbarBelowSlot}
				</div>
			) : null}
			<div
				className={cn("rich-text-editor-content relative", contentClassName)}
				data-empty={isEmpty ? "true" : undefined}
				style={
					placeholder && !placeholderSlot
						? ({
								"--rich-text-placeholder": toCssString(placeholder),
							} as CSSProperties)
						: undefined
					}
				>
				{isMarkdownMode ? (
					<MarkdownSourceEditor
						ref={textareaRef}
						aria-label={`${ariaLabel ?? "Rich text editor"} Markdown source`}
						data-rich-text-markdown-source
						placeholder={placeholder}
						textareaClassName="min-h-24"
						value={markdownSource}
						onValueChange={handleMarkdownSourceChange}
					/>
				) : (
					<EditorContent editor={editor} />
				)}
				{placeholderSlot && isEmpty && !isMarkdownMode ? (
					<div
						aria-hidden="true"
						data-slot="rich-text-editor-placeholder"
						className={cn("pointer-events-none absolute inset-0", contentClassName)}
					>
						{placeholderSlot}
					</div>
				) : null}
				{showBubbleMenu && editor && !isMarkdownMode ? (
					<RichTextEditorBubbleMenu
						editor={editor}
						onAskRovo={onAskRovo}
					/>
				) : null}
				{showFloatingMenu && editor && !isMarkdownMode ? (
					<RichTextEditorFloatingMenu
						editor={editor}
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
