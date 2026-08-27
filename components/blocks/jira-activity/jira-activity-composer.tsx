"use client";

import { useState, type KeyboardEvent, type ReactNode, type Ref } from "react";

import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";
import AddIcon from "@atlaskit/icon/core/add";
import AttachmentIcon from "@atlaskit/icon/core/attachment";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FloatingComposer } from "@/components/projects/shared/components/floating-composer";
import { RovoComposerActionButton } from "@/components/projects/shared/components/rovo-composer-send-controls";
import { floatingComposerTextareaClassName } from "@/components/projects/shared/components/rovo-composer-styles";
import { PromptInputTextarea } from "@/components/ui-custom/prompt-input";
import type {
	RichTextMentionItem,
	RichTextMentionSources,
	RichTextMentionSectionLabels,
	RichTextSuggestionVariantConfig,
} from "@/components/ui-custom/rich-text-editor";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { JiraActivityActor } from "./jira-activity-types";
import { useJiraActivityComposerDictation } from "./use-jira-activity-composer-dictation";

/**
 * The two floating surfaces this composer serves. They share the prompt editor
 * and submit behaviour but nothing else, so every difference between them lives
 * here rather than as a className blob at each callsite.
 *
 * - `comment` — the standalone/sticky comment bar. Bordered floating box with
 *   the full-size 32px prompt controls and PromptInput's floating backdrop shadow.
 * - `flush` — the reply row nested inside an activity card. Same bordered
 *   floating chrome (rounded border, input fill) with controls tightened to
 *   24px, but `shadow-none` so the soft backdrop never clips in the activity rail.
 *
 * Both surfaces keep FloatingComposer's floating border/fill and the shared
 * compact `p-2` (space.100) inset. Flush also drops the backdrop shadow.
 */
const COMPOSER_SURFACES = {
	comment: {
		// Same compact inset as FloatingComposer (`p-2` / space.100).
		chrome: "p-2",
		// 32px controls at the shared `Button` default, with the default ADS glyph.
		controlClassName: "",
		iconSize: "medium",
	},
	flush: {
		// Keep bordered input chrome; drop the floating backdrop shadow so nested
		// replies are not clipped by scroll ancestors. Only control size differs
		// from `comment` below.
		chrome: "p-2 shadow-none",
		// 24px controls. Shrinking the box on `size="icon"` keeps `rounded-md`;
		// `size="icon-compact"` would also force the glyph to a fixed 12px.
		controlClassName: "size-6",
		// ADS ships a purpose-drawn small glyph; in a 24px box it reads correctly
		// where the default one is optically heavy.
		iconSize: "small",
	},
} as const;

export interface JiraActivityComposerProps {
	author: JiraActivityActor;
	placeholder: string;
	/**
	 * `reply` is a plain inline row with an avatar; `comment` is the bordered
	 * floating box with backdrop shadow; `flush` is the same bordered chrome
	 * without shadow and with compact 24px controls for in-card replies.
	 */
	variant?: "reply" | "comment" | "flush";
	onSubmit: (body: string) => void;
	/** Controlled draft value. Omit to let the composer own its draft. */
	value?: string;
	/** Initial draft for an uncontrolled composer. */
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	/** Ref to the shared prompt editor used by the comment variant. */
	textareaRef?: Ref<HTMLTextAreaElement>;
	/**
	 * Focus the editor on mount. The comment variant is a contentEditable tiptap
	 * editor that initialises asynchronously, so its own `autofocus` config is the
	 * only reliable way in — focusing a ref from a parent effect races the editor.
	 */
	autoFocus?: boolean;
	prefillMentionRequest?: { mention: RichTextMentionItem; requestKey: number };
	mentionSources?: RichTextMentionSources;
	mentionSectionLabels?: RichTextMentionSectionLabels;
	suggestionVariant?: RichTextSuggestionVariantConfig;
	/** Optional cue rendered immediately before the submit CTA. */
	submitAccessory?: ReactNode;
	/**
	 * One-turn composer context pill(s) rendered inside the floating prompt
	 * (Activity "Add to chat" / Code Review-style comment chips).
	 */
	inputContext?: ReactNode;
	/**
	 * Body used when the user submits with only `inputContext` and an empty
	 * draft — same pattern as ChatComposer's `composerInputContext.submitText`.
	 */
	inputContextSubmitText?: string;
	className?: string;
}

/**
 * A submit-on-Enter composer shared by the in-card reply row and the bottom
 * comment box. Shift+Enter inserts a newline; empty drafts can't be submitted.
 */
export function JiraActivityComposer({
	author,
	placeholder,
	variant = "comment",
	onSubmit,
	value: controlledValue,
	defaultValue = "",
	onValueChange,
	textareaRef,
	autoFocus = false,
	prefillMentionRequest,
	mentionSources,
	mentionSectionLabels,
	suggestionVariant,
	submitAccessory,
	inputContext,
	inputContextSubmitText,
	className,
}: Readonly<JiraActivityComposerProps>) {
	const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
	const value = controlledValue ?? uncontrolledValue;
	const trimmed = value.trim();
	const hasInputContext = inputContext != null;
	const canSubmit = trimmed.length > 0 || hasInputContext;

	function updateValue(nextValue: string) {
		if (controlledValue === undefined) {
			setUncontrolledValue(nextValue);
		}
		onValueChange?.(nextValue);
	}

	const {
		dictationState,
		dictationTranscriptPreview,
		micStream,
		onStartDictation,
		onStopDictation,
	} = useJiraActivityComposerDictation({
		onValueChange: updateValue,
		value,
	});

	function submit() {
		if (!canSubmit) return;
		const body = trimmed || (hasInputContext ? (inputContextSubmitText ?? "").trim() : "");
		if (!body) return;
		onStopDictation();
		onSubmit(body);
		updateValue("");
	}

	function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
		if (event.key === "Enter" && !event.shiftKey) {
			event.preventDefault();
			submit();
		}
	}

	const actions = (
		<div className="flex shrink-0 items-center gap-1">
			<Button aria-label="Attach file" size="icon-compact" type="button" variant="ghost">
				<AttachmentIcon label="" />
			</Button>
			<Button
				aria-label="Send"
				disabled={!canSubmit}
				onClick={submit}
				size="icon-compact"
				type="button"
				variant="ghost"
			>
				<ArrowUpIcon label="" />
			</Button>
		</div>
	);

	if (variant === "reply") {
		return (
			<div className={cn("flex items-center gap-2 p-3", className)}>
				<Avatar className="shrink-0" label={author.name} size="sm">
					{author.avatarSrc ? <AvatarImage alt="" src={author.avatarSrc} /> : null}
					<AvatarFallback>{author.name.slice(0, 1).toUpperCase()}</AvatarFallback>
				</Avatar>
				<Textarea
					aria-label={placeholder}
					autoFocus={autoFocus}
					className="min-h-8 flex-1 py-1.5"
					onChange={(event) => updateValue(event.target.value)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					rows={1}
					value={value}
					variant="none"
				/>
				{actions}
			</div>
		);
	}

	const surface = COMPOSER_SURFACES[variant];

	return (
		<FloatingComposer
			actions={
				<>
					{submitAccessory}
					<RovoComposerActionButton
						canSubmit={canSubmit}
						composerStatus="ready"
						dictationState={dictationState}
						dictationTranscriptPreview={dictationTranscriptPreview}
						experimentalDarkCta
						micStream={micStream}
						onStartDictation={onStartDictation}
						onStop={onStopDictation}
						onStopDictation={onStopDictation}
						showSubmitWhenEmpty
						submitButtonClassName={surface.controlClassName}
					/>
				</>
			}
			addButton={
				<Button
					aria-label="Add"
					className={surface.controlClassName}
					size="icon"
					type="button"
					variant="ghost"
				>
					<AddIcon label="" size={surface.iconSize} />
				</Button>
			}
			allowOverflow
			aria-label={placeholder}
			className={cn("w-full", surface.chrome, className)}
			inputContext={inputContext}
			onSubmit={submit}
		>
			<PromptInputTextarea
				aria-label={placeholder}
				autoFocus={autoFocus}
				autoResize
				className={cn(floatingComposerTextareaClassName, "text-sm leading-5")}
				enableDirectoryAutocomplete={false}
				mentionSources={mentionSources}
				mentionSectionLabels={mentionSectionLabels}
				onChange={(event) => updateValue(event.currentTarget.value)}
				placeholder={placeholder}
				prefillMentionRequest={prefillMentionRequest}
				ref={textareaRef}
				rows={1}
				suggestionVariant={suggestionVariant}
				value={value}
			/>
		</FloatingComposer>
	);
}
