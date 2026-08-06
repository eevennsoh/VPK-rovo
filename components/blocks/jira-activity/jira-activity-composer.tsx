"use client";

import { useState, type KeyboardEvent, type ReactNode, type Ref } from "react";

import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";
import AddIcon from "@atlaskit/icon/core/add";
import AttachmentIcon from "@atlaskit/icon/core/attachment";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FloatingComposer } from "@/components/projects/shared/components/floating-composer";
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

/**
 * The two floating surfaces this composer serves. They share the prompt editor
 * and submit behaviour but nothing else, so every difference between them lives
 * here rather than as a className blob at each callsite.
 *
 * - `comment` — the standalone/sticky comment bar. Bordered floating box with
 *   the full-size 32px prompt controls.
 * - `flush` — the reply row nested inside an activity card. The card already
 *   owns the border and padding, so this drops its own chrome and tightens the
 *   controls to 24px.
 */
const COMPOSER_SURFACES = {
	comment: {
		chrome: "",
		// 32px controls at the shared `Button` default, with the default ADS glyph.
		controlClassName: "",
		iconSize: "medium",
	},
	flush: {
		chrome: "border-0 rounded-none bg-transparent px-4 py-1.5 shadow-none",
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
	 * floating box; `flush` is the chrome-less compact row inside a card.
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
	className,
}: Readonly<JiraActivityComposerProps>) {
	const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
	const value = controlledValue ?? uncontrolledValue;
	const trimmed = value.trim();
	const canSubmit = trimmed.length > 0;

	function updateValue(nextValue: string) {
		if (controlledValue === undefined) {
			setUncontrolledValue(nextValue);
		}
		onValueChange?.(nextValue);
	}

	function submit() {
		if (!canSubmit) return;
		onSubmit(trimmed);
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
					<Button
						aria-label="Send"
						className={cn(
							"bg-bg-neutral-bold text-text-inverse hover:bg-bg-neutral-bold-hovered active:bg-bg-neutral-bold-pressed",
							surface.controlClassName,
						)}
						disabled={!canSubmit}
						size="icon"
						type="submit"
					>
						<ArrowUpIcon label="" size={surface.iconSize} />
					</Button>
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
