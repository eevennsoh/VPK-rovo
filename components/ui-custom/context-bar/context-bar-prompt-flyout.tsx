"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

import { ContextBarPill } from "./context-bar";
import {
	ContextBarPromptFlyoutHoverPad,
	ContextBarPromptFlyoutStackItem,
	HOVER_LEAVE_MS,
} from "./context-bar-prompt-flyout-arc";

/**
 * Suggested-prompt flyout for a composer: one context-bar pill in the dock, with
 * the rest stacking straight up as the same pills, left-aligned with the trigger.
 * Hover or click opens the extra prompts. The longest label docks as the
 * trigger; extras stack shortest-at-top. Clicking the base pill while it is
 * open asks that docked question; clicking a stacked pill asks that one.
 * Escape, blur, a press outside, and a delayed pointer leave close it.
 */

export interface ContextBarPromptFlyoutItem {
	id: string;
	label: string;
	icon?: ReactNode;
	onSelect: () => void;
}

export interface ContextBarPromptFlyoutProps {
	items: ReadonlyArray<ContextBarPromptFlyoutItem>;
	icon?: ReactNode;
	className?: string;
	ariaLabel?: string;
	/** Start expanded. Remount with a `key` to reset. */
	defaultOpen?: boolean;
}

/** Longest label docks at the bottom; shortest stacks to the top. Ties keep source order. */
export function sortFlyoutItemsByLabelLength(
	items: ReadonlyArray<ContextBarPromptFlyoutItem>,
): ReadonlyArray<ContextBarPromptFlyoutItem> {
	return items
		.map((item, index) => ({ item, index }))
		.sort((left, right) => {
			const byLength = right.item.label.length - left.item.label.length;
			return byLength !== 0 ? byLength : left.index - right.index;
		})
		.map((entry) => entry.item);
}

export function ContextBarPromptFlyout({
	items,
	icon,
	className,
	ariaLabel = "Suggested questions",
	defaultOpen = false,
}: Readonly<ContextBarPromptFlyoutProps>): React.ReactElement | null {
	const shouldReduceMotion = useReducedMotion();
	const rootRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const closeTimerRef = useRef<number | null>(null);
	const [open, setOpen] = useState(defaultOpen);
	const [primary, ...rest] = sortFlyoutItemsByLabelLength(items);
	const canExpand = rest.length > 0;
	const isOpen = canExpand ? open : false;
	const reduceMotion = shouldReduceMotion === true;

	const cancelScheduledClose = useCallback(() => {
		if (closeTimerRef.current === null) return;
		window.clearTimeout(closeTimerRef.current);
		closeTimerRef.current = null;
	}, []);

	const openFlyout = useCallback(() => {
		cancelScheduledClose();
		if (canExpand) setOpen(true);
	}, [canExpand, cancelScheduledClose]);

	const closeFlyout = useCallback(() => {
		cancelScheduledClose();
		setOpen(false);
	}, [cancelScheduledClose]);

	const scheduleClose = useCallback(() => {
		cancelScheduledClose();
		closeTimerRef.current = window.setTimeout(() => {
			closeTimerRef.current = null;
			setOpen(false);
		}, HOVER_LEAVE_MS);
	}, [cancelScheduledClose]);

	useEffect(() => () => cancelScheduledClose(), [cancelScheduledClose]);

	useEffect(() => {
		if (!isOpen) return;
		function onPointerDown(event: PointerEvent) {
			if (!rootRef.current?.contains(event.target as Node)) {
				closeFlyout();
			}
		}
		function onKeyDown(event: KeyboardEvent) {
			if (event.key !== "Escape") return;
			closeFlyout();
			triggerRef.current?.focus();
		}
		document.addEventListener("pointerdown", onPointerDown);
		document.addEventListener("keydown", onKeyDown);
		return () => {
			document.removeEventListener("pointerdown", onPointerDown);
			document.removeEventListener("keydown", onKeyDown);
		};
	}, [closeFlyout, isOpen]);

	if (primary === undefined) {
		return null;
	}

	function handlePrimaryClick() {
		if (!canExpand) {
			primary.onSelect();
			return;
		}
		if (!isOpen) {
			openFlyout();
			return;
		}
		primary.onSelect();
	}

	return (
		<div
			aria-label={ariaLabel}
			className={cn("relative w-fit max-w-full", className)}
			data-context-bar-prompt-flyout=""
			onBlur={(event) => {
				const next = event.relatedTarget;
				if (next instanceof Node && !event.currentTarget.contains(next)) {
					closeFlyout();
				}
			}}
			onMouseEnter={openFlyout}
			onPointerEnter={openFlyout}
			onMouseLeave={scheduleClose}
			ref={rootRef}
			role="group"
		>
			<ContextBarPill
				aria-expanded={canExpand ? isOpen : undefined}
				className="relative z-50 max-w-full min-w-0"
				icon={icon ?? primary.icon}
				onClick={handlePrimaryClick}
				onPointerEnter={openFlyout}
				ref={triggerRef}
				title={primary.label}
			>
				<span className="min-w-0 truncate">{primary.label}</span>
			</ContextBarPill>
			{canExpand ? (
				<div
					aria-hidden={!isOpen}
					className={cn(
						"absolute bottom-full left-0 z-20 flex w-max flex-col-reverse items-start gap-2 pb-2",
						isOpen ? "pointer-events-auto" : "pointer-events-none [&_*]:pointer-events-none",
					)}
					inert={!isOpen}
					onPointerEnter={openFlyout}
				>
					{isOpen ? <ContextBarPromptFlyoutHoverPad /> : null}
					<AnimatePresence>
						{isOpen
							? rest.map((item, index) => (
								<ContextBarPromptFlyoutStackItem
									index={index}
									key={item.id}
									reduceMotion={reduceMotion}
								>
									<ContextBarPill
										className="max-w-xs min-w-0"
										icon={item.icon ?? icon}
										onClick={item.onSelect}
										title={item.label}
									>
										<span className="min-w-0 truncate">{item.label}</span>
									</ContextBarPill>
								</ContextBarPromptFlyoutStackItem>
							))
							: null}
					</AnimatePresence>
				</div>
			) : null}
		</div>
	);
}
