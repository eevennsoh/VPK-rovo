"use client";

import { useRef, type KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

import type { PullRequestReviewVerdict } from "./pull-request-review-types";

export const PULL_REQUEST_REVIEW_VERDICTS: ReadonlyArray<{
	value: PullRequestReviewVerdict;
	label: string;
}> = [
	{ value: "comment", label: "Comment" },
	{ value: "approve", label: "Approve" },
	{ value: "request-changes", label: "Request changes" },
];

/**
 * A verdict picker is a single-select choice that decides what Submit does — it
 * is not navigation, and it owns no panels. So this is a `radiogroup` with
 * roving tabindex rather than the `Tabs` primitive, even though the design
 * borrows the ADS segmented-tab skin (grey track, white raised pill).
 *
 * Kept local to this block: `ToggleGroup` at `spacing={0}` hard-forces
 * `rounded-none` plus `rounded-l-md!` end caps through arbitrary child
 * selectors, which outrank any per-item radius we could pass in.
 */
export function PullRequestReviewVerdictControl({
	className,
	disabled = false,
	label = "Review verdict",
	onValueChange,
	value,
}: Readonly<{
	className?: string;
	disabled?: boolean;
	label?: string;
	onValueChange: (verdict: PullRequestReviewVerdict) => void;
	value: PullRequestReviewVerdict;
}>) {
	const trackRef = useRef<HTMLDivElement>(null);

	function moveSelection(event: KeyboardEvent<HTMLDivElement>, step: number) {
		event.preventDefault();
		const currentIndex = PULL_REQUEST_REVIEW_VERDICTS.findIndex(
			(option) => option.value === value,
		);
		const nextIndex =
			(currentIndex + step + PULL_REQUEST_REVIEW_VERDICTS.length) %
			PULL_REQUEST_REVIEW_VERDICTS.length;
		const next = PULL_REQUEST_REVIEW_VERDICTS[nextIndex];
		onValueChange(next.value);
		trackRef.current
			?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
			[nextIndex]?.focus();
	}

	function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (disabled) return;
		if (event.key === "ArrowRight" || event.key === "ArrowDown") {
			moveSelection(event, 1);
		} else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
			moveSelection(event, -1);
		}
	}

	return (
		<div
			aria-label={label}
			className={cn(
				"flex h-8 shrink-0 items-center rounded-md bg-bg-accent-gray-subtlest p-[3px]",
				disabled && "opacity-(--opacity-disabled)",
				className,
			)}
			onKeyDown={handleKeyDown}
			ref={trackRef}
			role="radiogroup"
		>
			{PULL_REQUEST_REVIEW_VERDICTS.map((option) => {
				const isSelected = option.value === value;
				return (
					<button
						aria-checked={isSelected}
						className={cn(
							"inline-flex h-full items-center justify-center whitespace-nowrap rounded-sm px-3 text-sm font-medium outline-none",
							// Interaction feedback only — 150ms is the ADS upper bound for a
							// control this small, and `ease-out-practical` keeps a segmented
							// control from feeling theatrical on every reviewer keystroke.
							"transition-[background-color,box-shadow,color] duration-normal ease-out-practical motion-reduce:transition-none",
							"focus-visible:ring-3 focus-visible:ring-ring/50",
							isSelected
								? "bg-surface text-text shadow-sm"
								: "text-text-subtle hover:text-text",
							disabled && "pointer-events-none",
						)}
						disabled={disabled}
						key={option.value}
						onClick={() => onValueChange(option.value)}
						role="radio"
						tabIndex={isSelected ? 0 : -1}
						type="button"
					>
						{option.label}
					</button>
				);
			})}
		</div>
	);
}
