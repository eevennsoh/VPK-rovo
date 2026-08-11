"use client";

import { useState } from "react";

import CrossIcon from "@atlaskit/icon/core/cross";

import { FloatingComposer } from "@/components/projects/shared/components/floating-composer";
import { floatingComposerTextareaClassName } from "@/components/projects/shared/components/rovo-composer-styles";
import {
	PromptInputSubmit,
	PromptInputTextarea,
} from "@/components/ui-custom/prompt-input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import type {
	PullRequestReviewProps,
	PullRequestReviewVariant,
	PullRequestReviewVerdict,
} from "./pull-request-review-types";
import { PullRequestReviewVerdictControl } from "./pull-request-review-verdict";

/**
 * `comment` is the only verdict that needs prose — an approval or a
 * change request is itself the signal, and every SCM lets a reviewer submit
 * one with an empty body.
 */
function canSubmitReview(body: string, verdict: PullRequestReviewVerdict): boolean {
	return verdict === "comment" ? body.trim().length > 0 : true;
}

/**
 * Pull request review composer.
 *
 * One composer with two presentations, not two components: the compact prompt
 * bar a reviewer sees at rest, and the review card it grows into once they
 * engage. Both render the same `FloatingComposer` + `PromptInputTextarea`
 * subtree, so expanding preserves the caret, the draft, and any active mention
 * menu — remounting a second composer for the expanded state would drop all
 * three the moment the user clicks in.
 *
 * The expanded state pins `layout="stacked"` so the editor always owns a
 * full-width row above the controls, instead of only stacking once the draft
 * wraps (the compact default).
 */
export function PullRequestReview({
	className,
	defaultValue = "",
	defaultVariant = "compact",
	defaultVerdict = "comment",
	expandOnFocus = true,
	inputContext,
	onAddClick,
	onClose,
	onSubmit,
	onValueChange,
	onVariantChange,
	onVerdictChange,
	placeholder = "Leave a comment...",
	reviewedCount,
	reviewedTotal,
	title = "Review",
	value: controlledValue,
	variant: controlledVariant,
	verdict: controlledVerdict,
}: Readonly<PullRequestReviewProps>) {
	const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
	const [uncontrolledVariant, setUncontrolledVariant] =
		useState<PullRequestReviewVariant>(defaultVariant);
	const [uncontrolledVerdict, setUncontrolledVerdict] =
		useState<PullRequestReviewVerdict>(defaultVerdict);

	const value = controlledValue ?? uncontrolledValue;
	const variant = controlledVariant ?? uncontrolledVariant;
	const verdict = controlledVerdict ?? uncontrolledVerdict;
	const isExpanded = variant === "expanded";
	const canSubmit = canSubmitReview(value, verdict);
	const hasReviewedProgress =
		reviewedCount !== undefined && reviewedTotal !== undefined;

	function updateValue(nextValue: string) {
		if (controlledValue === undefined) {
			setUncontrolledValue(nextValue);
		}
		onValueChange?.(nextValue);
	}

	function updateVariant(nextVariant: PullRequestReviewVariant) {
		if (nextVariant === variant) return;
		if (controlledVariant === undefined) {
			setUncontrolledVariant(nextVariant);
		}
		onVariantChange?.(nextVariant);
	}

	function updateVerdict(nextVerdict: PullRequestReviewVerdict) {
		if (controlledVerdict === undefined) {
			setUncontrolledVerdict(nextVerdict);
		}
		onVerdictChange?.(nextVerdict);
	}

	function submit() {
		if (!canSubmit) return;
		onSubmit?.({ body: value.trim(), verdict });
		updateValue("");
	}

	function close() {
		// The verdict control only exists in the expanded card, so a verdict left
		// selected here would survive as invisible state that silently changes what
		// the compact bar's Send does. The draft stays — it is still on screen.
		updateVerdict(defaultVerdict);
		updateVariant("compact");
		onClose?.();
	}

	const reviewHeader = isExpanded ? (
		<div className="flex w-full items-center gap-2">
			<h2 className="text-text" style={{ font: token("font.heading.medium") }}>
				{title}
			</h2>
			{hasReviewedProgress ? (
				<Badge variant="neutral">{`${reviewedCount}/${reviewedTotal} Reviewed`}</Badge>
			) : null}
			<Button
				aria-label="Close review"
				className="ml-auto"
				onClick={close}
				size="icon"
				type="button"
				variant="ghost"
			>
				<CrossIcon label="" />
			</Button>
		</div>
	) : null;

	const composerContext =
		reviewHeader || inputContext ? (
			<>
				{reviewHeader}
				{inputContext}
			</>
		) : null;

	return (
		<FloatingComposer
			actions={
				<>
					{isExpanded ? (
						<PullRequestReviewVerdictControl
							onValueChange={updateVerdict}
							value={verdict}
						/>
					) : null}
					<PromptInputSubmit disabled={!canSubmit} status="ready" />
				</>
			}
			addButtonProps={{ onClick: onAddClick }}
			aria-label={title}
			className={cn(
				"w-full",
				// Expanded reads as a card rather than a bar: a wider gutter, a
				// standing-row gap that matches the header's, and overlay elevation.
				isExpanded &&
					"gap-y-4 p-4 [&_[data-slot=floating-composer-row]]:gap-y-4",
				isExpanded &&
					// Enter-only. The card grows around a composer the reviewer is
					// already focused in, so a bold `ease-out` entrance reads as the
					// surface asserting itself; collapsing is user-initiated and
					// snaps back without competing for attention.
					"animate-in fade-in-0 duration-medium ease-out motion-reduce:animate-none",
				className,
			)}
			inputContext={composerContext}
			layout={isExpanded ? "stacked" : "auto"}
			onSubmit={submit}
		>
			<PromptInputTextarea
				aria-label={placeholder}
				autoResize
				className={cn(floatingComposerTextareaClassName, "text-sm leading-5")}
				enableDirectoryAutocomplete={false}
				onChange={(event) => updateValue(event.currentTarget.value)}
				onFocus={
					expandOnFocus && controlledVariant === undefined
						? () => updateVariant("expanded")
						: undefined
				}
				placeholder={placeholder}
				rows={1}
				value={value}
			/>
		</FloatingComposer>
	);
}
