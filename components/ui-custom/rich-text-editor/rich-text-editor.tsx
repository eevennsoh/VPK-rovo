"use client";

// oxlint-disable react-doctor/no-derived-state -- These components maintain local derived display state for controlled animations, measurements, or draft editing that cannot be represented as render-only values without changing UX.
// oxlint-disable react-doctor/no-pass-live-state-to-parent -- Callbacks in this file intentionally stream live interaction state to the parent owner.

import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import {
	getDirectoryAutocompleteState,
	type DirectoryAutocompleteState,
} from "@/lib/directory-autocomplete";
import { Spinner } from "@/components/ui/spinner";

import { createRichTextEditorExtensions, getMentionCategory, getMentionNodeAttrs } from "./extensions";
import {
	createComposerDirectoryAutocomplete,
	composerDirectoryAutocompletePluginKey,
	type ComposerDirectoryAutocompleteController,
} from "./composer-extensions";
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
import { isRichTextReferenceCategory } from "./reference-categories";
import type {
	RichTextMentionItem,
	RichTextMentionRemovalRequest,
	RichTextMentionSources,
	RichTextSlashCategory,
	RichTextSuggestionVariantConfig,
} from "./types";

const dataFlowStreamdownPlugins = { mermaid };

interface RichTextEditorProps
	extends Omit<ComponentProps<"div">, "onChange"> {
	value?: string;
	placeholder?: string;
	placeholderSlot?: ReactNode;
	dataFlowConfig?: StudioAgentDataFlowConfig;
	dataFlowDiagramLabel?: string;
	editorClassName?: string;
	contentClassName?: string;
	toolbarEndSlot?: ReactNode;
	toolbarBelowSlot?: ReactNode;
	mentionSources?: RichTextMentionSources;
	/**
	 * Enables inline "ghost text" autocomplete for skill/tool mentions, mirroring
	 * the chat composer: as the user types, the remainder of the best-matching
	 * skill/tool label is shown greyed inline and Tab / → inserts it as a mention
	 * chip. Off by default so document/showcase editors are unaffected; the
	 * suggestions are drawn from `mentionSources.skill` + `mentionSources.tool`.
	 */
	enableDirectoryAutocomplete?: boolean;
	/**
	 * Layout for the live "@" / "/" suggestion menus. `"flat"` (default) merges
	 * each surface's sections into one list separated by headings; `"nested"`
	 * keeps the original drill-in category lists. Pass an object to set each
	 * trigger independently, e.g. `{ mention: "flat", command: "nested" }`.
	 */
	suggestionVariant?: RichTextSuggestionVariantConfig;
	mentionRemovalRequest?: RichTextMentionRemovalRequest | null;
	onMarkdownChange?: (value: string) => void;
	onPlainTextChange?: (value: string) => void;
	onMentionInventoryChange?: (mentions: readonly RichTextMentionItem[]) => void;
	onMentionRemovalRequestHandled?: (key: string) => void;
	onInsertReferenceOption?: (category: EditorToolbarInsertReferenceCategory, label: string) => boolean | void;
	onAskRovo?: (editor: Editor) => void;
	/**
	 * Launches the directory for a nested "/" category from its empty-state
	 * "Browse all" button (e.g. drilling into Skills with no matches). Only
	 * directory-backed categories (everything but "format") invoke it; omit it to
	 * keep the plain empty title with no button.
	 */
	onOpenDirectory?: (category: RichTextSlashCategory) => void;
	onViewModeChange?: (mode: EditorToolbarViewMode) => void;
	/**
	 * When `{ enabled: true }`, a leading SKILL.md `---` YAML block renders as the
	 * editable frontmatter card and round-trips as a fence in the markdown view.
	 * Off by default.
	 */
	frontmatter?: { enabled?: boolean };
	showToolbar?: boolean;
	showBubbleMenu?: boolean;
	showFloatingMenu?: boolean;
	"aria-label"?: string;
}

function toCssString(value: string): string {
	return JSON.stringify(value);
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

function DataFlowDiagramView({
	isRefining,
	mermaidCode,
	diagramLabel,
}: Readonly<{
	isRefining: boolean;
	mermaidCode: string;
	diagramLabel?: string;
}>) {
	const mermaidMarkdown = ["```mermaid", mermaidCode.trim(), "```"].join("\n");
	const containerRef = useRef<HTMLDivElement>(null);

	// The diagram re-fits to its container automatically because the SVG is sized
	// in % (see the `size-full` overrides below). That covers untouched diagrams
	// when the surrounding layout changes (sidebar toggled, agent config
	// expanded/collapsed). However, once a user pans/zooms, streamdown stores a
	// pixel-based transform that no longer matches a resized container, so the
	// diagram looks off-centre/clipped after a layout change. Watch for width
	// changes and re-fit by resetting streamdown's pan/zoom in that case.
	// oxlint-disable react-doctor/no-adjust-state-on-prop-change -- data-flow refinement state is cancelled when editor mode/input becomes invalid.
	useEffect(() => {
		const container = containerRef.current;
		if (!container || typeof ResizeObserver === "undefined") {
			return;
		}

		let lastWidth = container.getBoundingClientRect().width;
		let timer: ReturnType<typeof setTimeout> | undefined;

		const refitIfTransformed = () => {
			const panZoom = container.querySelector<HTMLElement>(
				"[data-streamdown=mermaid] [role=application]",
			);
			const transform = panZoom?.style.transform ?? "";
			const isFitted =
				transform === "" ||
				(/translate\(0px,\s*0px\)/.test(transform) && /scale\(1\)/.test(transform));
			if (isFitted) {
				// An untouched diagram already re-fits via CSS — nothing to do.
				return;
			}
			const resetButton = container.querySelector<HTMLButtonElement>(
				'[data-streamdown=mermaid] button[title="Reset zoom and pan"]',
			);
			resetButton?.click();
		};

		const observer = new ResizeObserver((entries) => {
			const width = entries[0]?.contentRect.width ?? lastWidth;
			// Ignore height-only changes; the SVG handles those via aspect-fit.
			if (Math.abs(width - lastWidth) < 1) {
				return;
			}
			lastWidth = width;
			// Debounce so we re-fit once after the layout settles (e.g. after the
			// expand/collapse animation), not on every intermediate frame.
			if (timer) {
				clearTimeout(timer);
			}
			timer = setTimeout(refitIfTransformed, 180);
		});

		observer.observe(container);
		return () => {
			observer.disconnect();
			if (timer) {
				clearTimeout(timer);
			}
		};
	}, []);

	// Streamdown renders its own "mermaid" header <span>. When a custom label is
	// provided we hide that text and inject our own via a ::after pseudo-element,
	// driven by a CSS variable so the value stays dynamic.
	const labelOverrideClassName = diagramLabel
		? "[&_[data-streamdown=mermaid-block]>div:first-child>span]:text-[0px] [&_[data-streamdown=mermaid-block]>div:first-child>span]:after:text-xs [&_[data-streamdown=mermaid-block]>div:first-child>span]:after:normal-case [&_[data-streamdown=mermaid-block]>div:first-child>span]:after:content-[var(--rich-text-diagram-label)]"
		: undefined;

	return (
		<div
			className={cn("relative", labelOverrideClassName)}
			data-rich-text-data-flow-diagram
			ref={containerRef}
			style={
				diagramLabel
					? ({
							"--rich-text-diagram-label": JSON.stringify(diagramLabel),
						} as CSSProperties)
					: undefined
			}
		>
			<Streamdown
				className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_[data-streamdown=mermaid-block]]:flex [&_[data-streamdown=mermaid-block]]:min-h-[480px] [&_[data-streamdown=mermaid-block]]:flex-col [&_[data-streamdown=mermaid-block]]:overflow-hidden [&_[data-streamdown=mermaid-block]]:rounded-md [&_[data-streamdown=mermaid-block]]:border [&_[data-streamdown=mermaid-block]]:border-border [&_[data-streamdown=mermaid-block]>div:last-child]:flex [&_[data-streamdown=mermaid-block]>div:last-child]:flex-1 [&_[data-streamdown=mermaid-block]>div:last-child]:overflow-hidden [&_[data-streamdown=mermaid-block]>div:last-child]:p-4 [&_[data-streamdown=mermaid]]:size-full [&_[data-streamdown=mermaid]>div]:h-full [&_[data-streamdown=mermaid]_[aria-label='Mermaid_chart']]:size-full [&_[data-streamdown=mermaid]_[aria-label='Mermaid_chart']]:items-center [&_[data-streamdown=mermaid]_svg]:!size-full [&_[data-streamdown=mermaid]_svg]:!max-w-none [&_[data-streamdown=mermaid]_svg]:!max-h-none"
				controls
				mode="static"
				plugins={dataFlowStreamdownPlugins}
			>
				{mermaidMarkdown}
			</Streamdown>
			{isRefining ? (
				<div className="pointer-events-none absolute inset-x-0 top-2 z-20 flex justify-end">
					{/*
						top-2 (8px) matches the mermaid block's p-2 padding so the
						spinner + label line up with the "mermaid" header row. The
						32px-tall container vertically centers them with that row, and
						mr-28 (112px) clears the zoom/copy/download pill (~96px) and
						leaves a ~16px gap to its left.
					*/}
					<div className="mr-28 flex h-8 items-center gap-1.5 text-sm text-text-subtle">
						<Spinner size="sm" label="Updating diagram" />
						<span>Updating diagram</span>
					</div>
				</div>
			) : null}
		</div>
	);
}

export function RichTextEditor({
	value,
	placeholder,
	placeholderSlot,
	dataFlowConfig,
	dataFlowDiagramLabel,
	className,
	editorClassName,
	contentClassName,
	toolbarEndSlot,
	toolbarBelowSlot,
	mentionSources,
	enableDirectoryAutocomplete = false,
	suggestionVariant = "nested",
	mentionRemovalRequest,
	onMarkdownChange,
	onPlainTextChange,
	onMentionInventoryChange,
	onMentionRemovalRequestHandled,
	onInsertReferenceOption,
	onAskRovo,
	onOpenDirectory,
	onViewModeChange,
	frontmatter,
	showToolbar = true,
	showBubbleMenu = true,
	showFloatingMenu = false,
	"aria-label": ariaLabel,
	...props
}: Readonly<RichTextEditorProps>) {
	const mentionSourcesRef = useRef(mentionSources);
	const onAskRovoRef = useRef(onAskRovo);
	const onOpenDirectoryRef = useRef(onOpenDirectory);
	const onMarkdownChangeRef = useRef(onMarkdownChange);
	const onPlainTextChangeRef = useRef(onPlainTextChange);
	const onMentionInventoryChangeRef = useRef(onMentionInventoryChange);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const activeEditorRef = useRef<Editor | null>(null);
	const directoryAutocompleteStateRef = useRef<DirectoryAutocompleteState | null>(null);
	const enableDirectoryAutocompleteRef = useRef(enableDirectoryAutocomplete);
	// Mirror the ghost decoration into the editor: push the greyed remainder as a
	// widget at the cursor, or clear it when there is no suggestion.
	const applyDirectoryAutocompleteGhost = useCallback((state: DirectoryAutocompleteState | null) => {
		const activeEditor = activeEditorRef.current;
		if (!activeEditor) {
			return;
		}
		const meta = state?.ghostText
			? { from: state.queryTo, text: state.ghostText }
			: null;
		activeEditor.view.dispatch(
			activeEditor.state.tr.setMeta(composerDirectoryAutocompletePluginKey, meta),
		);
	}, []);
	const setDirectoryAutocompleteState = useCallback((nextState: DirectoryAutocompleteState | null) => {
		directoryAutocompleteStateRef.current = nextState;
		applyDirectoryAutocompleteGhost(nextState);
	}, [applyDirectoryAutocompleteGhost]);
	// A live "@"/"/" suggestion menu owns the keystrokes; suppress the ghost while
	// one is open (matches the chat composer).
	const isAnySuggestionMenuOpen = useCallback((activeEditor: Editor): boolean => {
		for (const plugin of activeEditor.view.state.plugins) {
			const pluginState = plugin.getState(activeEditor.view.state) as
				| { active?: boolean; query?: unknown; range?: unknown }
				| undefined;
			if (pluginState?.active === true && "query" in pluginState && "range" in pluginState) {
				return true;
			}
		}
		return false;
	}, []);
	const refreshDirectoryAutocomplete = useCallback((activeEditor: Editor) => {
		if (!enableDirectoryAutocompleteRef.current || !activeEditor.isEditable) {
			setDirectoryAutocompleteState(null);
			return;
		}
		const { selection } = activeEditor.state;
		if (activeEditor.view.composing || !selection.empty || isAnySuggestionMenuOpen(activeEditor)) {
			setDirectoryAutocompleteState(null);
			return;
		}
		const textBeforeCursor = selection.$from.parent.textBetween(
			0,
			selection.$from.parentOffset,
			"\n",
			"\uFFFC",
		);
		const nextState = getDirectoryAutocompleteState({
			cursorPosition: selection.from,
			sources: mentionSourcesRef.current,
			textBeforeCursor,
		});
		setDirectoryAutocompleteState(nextState);
	}, [isAnySuggestionMenuOpen, setDirectoryAutocompleteState]);
	// Accept the ghost (Tab / →): replace the typed query with the matched skill /
	// tool mention chip plus a trailing space, exactly like the chat composer.
	const acceptDirectoryAutocompleteGhost = useCallback((): boolean => {
		const activeEditor = activeEditorRef.current;
		const currentState = directoryAutocompleteStateRef.current;
		if (!activeEditor || !currentState || !currentState.ghostText) {
			return false;
		}
		const match = currentState.matches[0];
		if (!match) {
			return false;
		}
		activeEditor
			.chain()
			.focus()
			.insertContentAt(
				{ from: currentState.queryFrom, to: currentState.queryTo },
				[
					{ type: "mention", attrs: getMentionNodeAttrs(match.mention) },
					{ type: "text", text: " " },
				],
			)
			.run();
		setDirectoryAutocompleteState(null);
		return true;
	}, [setDirectoryAutocompleteState]);
	// Ghost-only controller: this editor has no external suggestion list, so the
	// list-navigation branches stay inert (hasVisibleList → false).
	const directoryAutocompleteController = useMemo<ComposerDirectoryAutocompleteController>(() => ({
		acceptActive: () => false,
		acceptGhost: () => acceptDirectoryAutocompleteGhost(),
		acceptIndex: () => false,
		hasVisibleList: () => false,
		moveActive: () => false,
		setActiveIndex: () => false,
	}), [acceptDirectoryAutocompleteGhost]);
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

	useEffect(() => {
		onViewModeChange?.(viewMode);
	}, [onViewModeChange, viewMode]);

	function updateViewMode(nextMode: EditorToolbarViewMode): void {
		setViewMode(nextMode);
		onViewModeChange?.(nextMode);
	}

	// Pass the directory launcher only when a host actually supplies one. The
	// renderer shows the empty state's "Browse all" button whenever this is
	// defined, so an always-present wrapper would render a dead button on
	// surfaces with no host directory (the showcase, the chat composer). Track
	// presence (not identity) in the deps so toggling it rebuilds the editor
	// while a changing handler is still read live through the ref.
	const hasOpenDirectory = Boolean(onOpenDirectory);
	const frontmatterEnabled = Boolean(frontmatter?.enabled);
	const extensions = useMemo(
		() => {
			const richTextExtensions = createRichTextEditorExtensions({
				getMentionSources: () => mentionSourcesRef.current,
				onAskRovo: (activeEditor) => onAskRovoRef.current?.(activeEditor),
				// Read through a ref so a changing handler doesn't rebuild the editor
				// (matches onAskRovo above); the slash menu calls this when the user
				// clicks "Browse all" in a nested category's empty state.
				onOpenDirectory: hasOpenDirectory
					? (category) => onOpenDirectoryRef.current?.(category)
					: undefined,
				suggestionVariant,
				frontmatter: frontmatterEnabled ? { enabled: true } : undefined,
			});
			if (enableDirectoryAutocomplete) {
				richTextExtensions.push(createComposerDirectoryAutocomplete(directoryAutocompleteController));
			}
			return richTextExtensions;
		},
		[directoryAutocompleteController, enableDirectoryAutocomplete, frontmatterEnabled, hasOpenDirectory, suggestionVariant],
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
			activeEditorRef.current = activeEditor;
			onMentionInventoryChangeRef.current?.(getEditorMentionInventory(activeEditor));
			refreshDirectoryAutocomplete(activeEditor);
		},
		onUpdate: ({ editor: activeEditor }) => {
			setIsEmpty(activeEditor.isEmpty);
			const markdown = activeEditor.getMarkdown();
			onMarkdownChangeRef.current?.(markdown);
			onPlainTextChangeRef.current?.(markdown);
			onMentionInventoryChangeRef.current?.(getEditorMentionInventory(activeEditor));
			refreshDirectoryAutocomplete(activeEditor);
		},
		onSelectionUpdate: ({ editor: activeEditor }) => {
			refreshDirectoryAutocomplete(activeEditor);
		},
	});

	useEffect(() => {
		mentionSourcesRef.current = mentionSources;
	}, [mentionSources]);

	useEffect(() => {
		enableDirectoryAutocompleteRef.current = enableDirectoryAutocomplete;
	}, [enableDirectoryAutocomplete]);

	useEffect(() => {
		onAskRovoRef.current = onAskRovo;
	}, [onAskRovo]);

	useEffect(() => {
		onOpenDirectoryRef.current = onOpenDirectory;
	}, [onOpenDirectory]);

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

		// setContent triggers TipTap's internal flushSync to keep React node views in
		// sync. Calling it inline can land inside React's render/commit phase (React 19
		// concurrent), where flushSync throws. Defer to a microtask so it runs after
		// the current commit drains but before paint (no visible flash).
		let cancelled = false;
		queueMicrotask(() => {
			if (cancelled || editor.isDestroyed) {
				return;
			}

			editor.commands.setContent(nextValue, {
				contentType: "markdown",
				emitUpdate: false,
			});
			setIsEmpty(!nextValue.trim());
			onMentionInventoryChangeRef.current?.(getEditorMentionInventory(editor));
			// setContent above bypasses onUpdate (emitUpdate: false), so any ghost from
			// the prior content is now stale — clear it.
			setDirectoryAutocompleteState(null);
		});

		return () => {
			cancelled = true;
		};
	}, [editor, value, setDirectoryAutocompleteState]);

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
	// oxlint-enable react-doctor/no-adjust-state-on-prop-change

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
			onMentionInventoryChangeRef.current?.(getEditorMentionInventory(editor));
			updateViewMode(nextMode);
			return;
		}

		if (nextMode === "markdown") {
			setMarkdownSource(editor.getMarkdown());
		}

		updateViewMode(nextMode);
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
						diagramLabel={dataFlowDiagramLabel}
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
