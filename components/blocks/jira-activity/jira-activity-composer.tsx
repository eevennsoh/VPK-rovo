"use client";

import { useState, type KeyboardEvent } from "react";

import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";
import AttachmentIcon from "@atlaskit/icon/core/attachment";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import type { JiraActivityActor } from "./jira-activity-types";

export interface JiraActivityComposerProps {
	author: JiraActivityActor;
	placeholder: string;
	/** `reply` is an inline row inside a comment card; `comment` is a bordered box. */
	variant?: "reply" | "comment";
	onSubmit: (body: string) => void;
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
	className,
}: Readonly<JiraActivityComposerProps>) {
	const [value, setValue] = useState("");
	const trimmed = value.trim();
	const canSubmit = trimmed.length > 0;

	function submit() {
		if (!canSubmit) return;
		onSubmit(trimmed);
		setValue("");
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
					onChange={(event) => setValue(event.target.value)}
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
		<div className={cn("rounded-lg border border-border bg-surface", className)}>
			<Textarea
				aria-label={placeholder}
				className="min-h-24"
				onChange={(event) => setValue(event.target.value)}
				onKeyDown={handleKeyDown}
				placeholder={placeholder}
				value={value}
				variant="none"
			/>
			<div className="flex items-center justify-end px-3 pb-3">{actions}</div>
		</div>
	);
}
