"use client";

import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Editor } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import { mermaid } from "@streamdown/mermaid";
import { Streamdown } from "streamdown";

import {
	buildAgentDataFlowMermaid,
	isValidAgentDataFlowMermaid,
	type StudioAgentDataFlowConfig,
} from "@/lib/studio-agent-data-flow";
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
import type { EditorToolbarInsertReferenceCategory, EditorToolbarViewMode } from "@/components/blocks/editor-toolbar";
import type { RichTextMentionSources } from "./types";

const dataFlowStreamdownPlugins = { mermaid };

interface RichTextEditorProps
	extends Omit<ComponentProps<"div">, "onChange"> {
	value?: string;
	placeholder?: string;
	placeholderSlot?: ReactNode;
	dataFlowConfig?: StudioAgentDataFlowConfig;
	editorClassName?: string;
	contentClassName?: string;
	toolbarEndSlot?: ReactNode;
	toolbarBelowSlot?: ReactNode;
	mentionSources?: RichTextMentionSources;
	onMarkdownChange?: (value: string) => void;
	onPlainTextChange?: (value: string) => void;
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

function DataFlowDiagramView({
	isRefining,
	mermaidCode,
}: Readonly<{
	isRefining: boolean;
	mermaidCode: string;
}>) {
	const mermaidMarkdown = ["```mermaid", mermaidCode.trim(), "```"].join("\n");

	return (
		<div
			className="rounded-lg border border-border bg-surface-overlay p-3 text-sm text-text"
			data-rich-text-data-flow-diagram
		>
			<div className="mb-2 flex min-h-5 items-center justify-between gap-3 text-xs text-text-subtle">
				<span>Agent data flow</span>
				{isRefining ? (
					<span aria-live="polite">Refining diagram...</span>
				) : null}
			</div>
			<Streamdown
				className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_[data-streamdown=mermaid-block]]:overflow-hidden [&_[data-streamdown=mermaid-block]]:rounded-md [&_[data-streamdown=mermaid-block]]:border [&_[data-streamdown=mermaid-block]]:border-border"
				controls
				mode="static"
				plugins={dataFlowStreamdownPlugins}
			>
				{mermaidMarkdown}
			</Streamdown>
		</div>
	);
}

export function RichTextEditor({
	value,
	placeholder,
	placeholderSlot,
	dataFlowConfig,
	className,
	editorClassName,
	contentClassName,
	toolbarEndSlot,
	toolbarBelowSlot,
	mentionSources,
	onMarkdownChange,
	onPlainTextChange,
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
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [isEmpty, setIsEmpty] = useState(() => !value?.trim());
	const [viewMode, setViewMode] = useState<EditorToolbarViewMode>("rendered");
	const [markdownSource, setMarkdownSource] = useState("");
	const baselineDataFlowMermaid = useMemo(
		() => dataFlowConfig ? buildAgentDataFlowMermaid(dataFlowConfig) : "",
		[dataFlowConfig],
	);
	const [dataFlowMermaid, setDataFlowMermaid] = useState(baselineDataFlowMermaid);
	const [isRefiningDataFlow, setIsRefiningDataFlow] = useState(false);
	const isMarkdownMode = viewMode === "markdown";
	const isDataFlowMode = viewMode === "data-flow";
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

	useEffect(() => {
		setDataFlowMermaid(baselineDataFlowMermaid);
	}, [baselineDataFlowMermaid]);

	useEffect(() => {
		if (!isDataFlowMode || !dataFlowConfig || !baselineDataFlowMermaid) {
			setIsRefiningDataFlow(false);
			return;
		}

		const abortController = new AbortController();
		const timeoutId = window.setTimeout(() => {
			setIsRefiningDataFlow(true);
			void fetch("/api/studio/agent-data-flow", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					config: dataFlowConfig,
					baselineMermaid: baselineDataFlowMermaid,
				}),
				signal: abortController.signal,
			})
				.then(async (response) => {
					if (!response.ok) {
						return null;
					}
					return await response.json() as { mermaid?: unknown };
				})
				.then((payload) => {
					const refinedMermaid = typeof payload?.mermaid === "string"
						? payload.mermaid
						: "";
					if (isValidAgentDataFlowMermaid(refinedMermaid)) {
						setDataFlowMermaid(refinedMermaid.trim());
					}
				})
				.catch((error) => {
					if (error instanceof DOMException && error.name === "AbortError") {
						return;
					}
				})
				.finally(() => {
					if (!abortController.signal.aborted) {
						setIsRefiningDataFlow(false);
					}
				});
		}, 500);

		return () => {
			window.clearTimeout(timeoutId);
			abortController.abort();
			setIsRefiningDataFlow(false);
		};
	}, [baselineDataFlowMermaid, dataFlowConfig, isDataFlowMode]);

	function handleModeChange(nextMode: EditorToolbarViewMode): void {
		if (!editor) {
			return;
		}

		if (viewMode === nextMode) {
			return;
		}

		if (isMarkdownMode && nextMode !== "markdown") {
			editor.commands.setContent(markdownSource, {
				contentType: "markdown",
				emitUpdate: false,
			});
			setIsEmpty(!markdownSource.trim());
			setViewMode(nextMode);
			return;
		}

		if (nextMode === "markdown") {
			setMarkdownSource(editor.getMarkdown());
		}

		setViewMode(nextMode);
	}

	function handleToggleMarkdownMode(): void {
		handleModeChange(isMarkdownMode ? "rendered" : "markdown");
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
					mode={viewMode}
					showDataFlowMode={Boolean(dataFlowConfig)}
					onModeChange={handleModeChange}
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
				{isDataFlowMode && dataFlowMermaid ? (
					<DataFlowDiagramView
						isRefining={isRefiningDataFlow}
						mermaidCode={dataFlowMermaid}
					/>
				) : isMarkdownMode ? (
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
				{placeholderSlot && isEmpty && viewMode === "rendered" ? (
					<div
						aria-hidden="true"
						data-slot="rich-text-editor-placeholder"
						className={cn("pointer-events-none absolute inset-0", contentClassName)}
					>
						{placeholderSlot}
					</div>
				) : null}
				{showBubbleMenu && editor && viewMode === "rendered" ? (
					<RichTextEditorBubbleMenu
						editor={editor}
						onAskRovo={onAskRovo}
					/>
				) : null}
				{showFloatingMenu && editor && viewMode === "rendered" ? (
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
