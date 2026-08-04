"use client";

import { useState, type KeyboardEvent, type ReactNode, type Ref } from "react";

import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";
import AddIcon from "@atlaskit/icon/core/add";
import AttachmentIcon from "@atlaskit/icon/core/attachment";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FloatingComposer } from "@/components/projects/shared/components/floating-composer";
import { floatingComposerTextareaClassName } from "@/components/projects/shared/components/rovo-composer-styles";
import {
	PromptInputButton,
	PromptInputSubmit,
	PromptInputTextarea,
} from "@/components/ui-custom/prompt-input";
import type {
	RichTextMentionSectionLabels,
	RichTextSuggestionVariantConfig,
} from "@/components/ui-custom/rich-text-editor";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { JiraActivityActor } from "./jira-activity-types";

export interface JiraActivityComposerProps {
	author: JiraActivityActor;
	placeholder: string;
	/** `reply` is an inline row inside a comment card; `comment` is a bordered box. */
	variant?: "reply" | "comment";
	onSubmit: (body: string) => void;
	/** Controlled draft value. Omit to let the composer own its draft. */
	value?: string;
	/** Initial draft for an uncontrolled composer. */
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	/** Ref to the shared prompt editor used by the comment variant. */
	textareaRef?: Ref<HTMLTextAreaElement>;
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

	return (
		<FloatingComposer
			actions={
				<>
					{submitAccessory}
					<PromptInputSubmit
						aria-label="Send"
						className="bg-bg-neutral-bold text-text-inverse hover:bg-bg-neutral-bold-hovered active:bg-bg-neutral-bold-pressed"
						disabled={!canSubmit}
						size="icon-sm"
					>
						<ArrowUpIcon label="" />
					</PromptInputSubmit>
				</>
			}
			addButton={
				<PromptInputButton aria-label="Add" size="icon-sm" variant="ghost">
					<AddIcon label="" />
				</PromptInputButton>
			}
			allowOverflow
			aria-label={placeholder}
			className={cn("w-full", className)}
			onSubmit={submit}
		>
			<PromptInputTextarea
				aria-label={placeholder}
				autoResize
				className={cn(floatingComposerTextareaClassName, "text-sm leading-5")}
				enableDirectoryAutocomplete={false}
				mentionSectionLabels={mentionSectionLabels}
				onChange={(event) => updateValue(event.currentTarget.value)}
				placeholder={placeholder}
				ref={textareaRef}
				rows={1}
				suggestionVariant={suggestionVariant}
				value={value}
			/>
		</FloatingComposer>
	);
}
