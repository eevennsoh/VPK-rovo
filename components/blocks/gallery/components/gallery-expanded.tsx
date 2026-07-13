"use client";

import CrossIcon from "@atlaskit/icon/core/cross";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import Squircle from "@/components/website/demos/visual/shaders/squircle";
import { token } from "@/lib/tokens";

import type { GalleryItem } from "../data/gallery-items";

// ── vpk motion tokens as resolved cubic-bezier arrays (Motion cannot read var()) ──
// Source: .agents/rules/motion-decisions.md "Consuming tokens" map. Durations in SECONDS.
const EASE_OUT = [0, 0.4, 0, 1] as const; // --ease-out (BOLD; prominent-surface ENTER)
const EASE_IN_OUT = [0.4, 0, 0, 1] as const; // --ease-in-out (BOLD; in-place scale/reposition)
const EASE_IN = [0.6, 0, 0.8, 0.6] as const; // --ease-in (practical EXIT — every exit)

const DUR_SLOW = 0.25; // --duration-slow
const DUR_MEDIUM = 0.2; // --duration-medium

// ── Blanket / scrim recipe (opacity only) ──
// enter: slow + ease-out ; exit: medium + ease-in (asymmetric, faster exit).
const BLANKET = {
	initial: { opacity: 0 },
	animate: { opacity: 1, transition: { duration: DUR_SLOW, ease: EASE_OUT } },
	exit: { opacity: 0, transition: { duration: DUR_MEDIUM, ease: EASE_IN } },
} as const;

// Layout-morph timing for the dialog. Enter uses the bold in-place curve
// (ease-in-out); the faster exit curve lives on the exit variant, per the
// asymmetric-exit gotcha, so closing never runs at the enter timing.
const DIALOG_ENTER_LAYOUT = { duration: DUR_SLOW, ease: EASE_IN_OUT } as const;
const DIALOG_EXIT = { opacity: 0, transition: { duration: DUR_MEDIUM, ease: EASE_IN } } as const;

// The expanded view is a larger light-grey squircle — the same surface as the strip
// cards — so the shared-element morph stays grey→grey. A square keeps the superellipse
// reading as a squircle (rather than the near-stadium the Squircle produces at
// strongly non-square sizes). Squircle renders from explicit pixel dimensions.
const DIALOG_SIZE = 320;

export interface GalleryExpandedProps {
	item: GalleryItem;
	/** Matching morph id from the strip card; undefined → plain fade (reduced motion). */
	layoutId: string | undefined;
	onClose: () => void;
}

export function GalleryExpanded({ item, layoutId, onClose }: Readonly<GalleryExpandedProps>) {
	const shouldReduceMotion = useReducedMotion();
	const titleId = useId();
	const closeRef = useRef<HTMLButtonElement | null>(null);
	const dialogRef = useRef<HTMLDivElement | null>(null);

	// Move focus into the dialog on open. Focus is restored to the originating
	// card by the orchestrator when this component unmounts.
	useEffect(() => {
		closeRef.current?.focus();
	}, []);

	// Lock body scroll while the dialog is open so wheel/trackpad over the scrim
	// can't scroll the page (and the live dock) behind it.
	useEffect(() => {
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previous;
		};
	}, []);

	// Dismiss on Escape while open.
	useEffect(() => {
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);

	// Focus trap: aria-modal alone does not stop Tab, so keep focus inside the
	// dialog while it is open (the strip cards, toggle pill, and page content stay
	// mounted behind the scrim). Cycles between the first/last focusable elements.
	useEffect(() => {
		const dialog = dialogRef.current;
		if (!dialog) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Tab") return;
			const focusables = dialog.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])',
			);
			if (focusables.length === 0) return;
			const first = focusables[0];
			const last = focusables[focusables.length - 1];
			if (event.shiftKey && document.activeElement === first) {
				event.preventDefault();
				last.focus();
			} else if (!event.shiftKey && document.activeElement === last) {
				event.preventDefault();
				first.focus();
			}
		};
		dialog.addEventListener("keydown", onKeyDown);
		return () => dialog.removeEventListener("keydown", onKeyDown);
	}, []);

	return (
		<motion.div
			className="fixed inset-0 z-50 grid place-items-center p-4"
			initial={BLANKET.initial}
			animate={BLANKET.animate}
			exit={BLANKET.exit}
			onClick={onClose}
			style={{ willChange: "opacity" }}
		>
			{/* Scrim — fades with the wrapper opacity above. */}
			<div aria-hidden="true" className="absolute inset-0 bg-blanket" />

			<motion.div
				layoutId={layoutId}
				ref={dialogRef}
				role="dialog"
				aria-modal="true"
				aria-labelledby={titleId}
				onClick={(event) => event.stopPropagation()}
				className="relative z-10"
				// Under reduced motion there is no layoutId, so the dialog simply
				// appears with the wrapper fade; otherwise the layout engine morphs it
				// from the card using the bold in-place curve.
				transition={shouldReduceMotion ? undefined : { layout: DIALOG_ENTER_LAYOUT }}
				exit={DIALOG_EXIT}
				style={{ willChange: "transform, opacity" }}
			>
				{/* Light-grey squircle surface (default fill = color.background.neutral),
				    matching the strip cards so the morph stays coherent. */}
				<Squircle
					width={DIALOG_SIZE}
					height={DIALOG_SIZE}
					strokeWidth={0}
					fillColor={token("elevation.surface.sunken")}
					contentClassName="flex flex-col justify-center gap-2 p-8"
					style={{ boxShadow: token("elevation.shadow.overlay") }}
				>
					<h2
						id={titleId}
						className="text-text tracking-tight"
						style={{ font: token("font.heading.large") }}
					>
						{item.title}
					</h2>
					<p className="text-sm text-text-subtle">{item.description}</p>
				</Squircle>

				<Button
					ref={closeRef}
					type="button"
					size="icon"
					shape="circle"
					variant="ghost"
					aria-label="Close"
					onClick={onClose}
					className="absolute top-4 right-4 bg-surface-overlay"
					style={{ boxShadow: token("elevation.shadow.overlay") }}
				>
					<Icon render={<CrossIcon label="" color="currentColor" />} />
				</Button>
			</motion.div>
		</motion.div>
	);
}
