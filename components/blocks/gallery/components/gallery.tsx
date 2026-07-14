"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState, type JSX, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import type { GalleryItem } from "../data/gallery-items";
import {
	DEFAULT_GALLERY_SELECTION_ORIGIN,
	GALLERY_SELECTION_SHADER_EXIT_OVERLAP_MS,
	type GallerySelectionOrigin,
	type GallerySelectionVisual,
} from "../lib/gallery-selection";
import { GalleryBackdrop } from "./gallery-backdrop";
import { GallerySelectedStage } from "./gallery-selected-stage";
import { GalleryToggle } from "./gallery-toggle";
import { GalleryTrack } from "./gallery-track";

// ── vpk motion tokens as resolved cubic-bezier arrays (Motion cannot read var()) ──
// Source: .agents/rules/motion-decisions.md "Consuming tokens" map. Durations in SECONDS.
const EASE_OUT = [0, 0.4, 0, 1] as const; // --ease-out (BOLD; prominent-surface ENTER)
const EASE_IN = [0.6, 0, 0.8, 0.6] as const; // --ease-in (practical EXIT — every exit)
const DUR_SLOW = 0.25; // --duration-slow
const DUR_FAST = 0.1; // --duration-fast

// The pinned strip is a pure ORCHESTRATION node: it carries no visual style of its
// own, only the active variant LABEL ("hidden"/"visible"/"exit") which propagates
// through the track down to each card. Crucially it does NOT fade — a parent opacity
// fade multiplies its children, which previously MASKED the per-card reverse-stagger
// on close (the whole strip just dissolved as one block). With the fade moved to the
// backdrop layer below, the cards' staggered rise/sink is the sole focal motion, and
// AnimatePresence still keeps the strip mounted until every descendant's exit
// completes. A card re-mounting after an expand→collapse does NOT replay the entrance
// (the parent is already at rest in "visible"); only the layout morph runs.
const STRIP = { hidden: {}, visible: {}, exit: {} } as const;

// Backdrop veil fade lives on its OWN layer behind the cards (its variants inherit the
// strip's active label via context), so fading it out on close no longer dims the cards
// mid-exit. Bold ease-out wash IN (prominent surface); fast ease-in OUT so the veil
// clears ahead of the cards instead of lingering. Opacity-only → safe under reduced
// motion as-is.
const BACKDROP = {
	hidden: { opacity: 0 },
	visible: { opacity: 1, transition: { duration: DUR_SLOW, ease: EASE_OUT } },
	exit: { opacity: 0, transition: { duration: DUR_FAST, ease: EASE_IN } },
} as const;

const STAGE_SCROLL_OFFSET = 80;

interface GalleryVisualState {
	active: GallerySelectionVisual | null;
	exiting: GallerySelectionVisual | null;
}

function createInitialVisualState(selectedId: string | null): GalleryVisualState {
	if (!selectedId) {
		return { active: null, exiting: null };
	}

	return {
		active: {
			id: selectedId,
			key: 0,
			origin: DEFAULT_GALLERY_SELECTION_ORIGIN,
			phase: "settled",
		},
		exiting: null,
	};
}

function resolveSelectedId(
	items: readonly GalleryItem[],
	selectedId: string | null | undefined,
): string | null {
	if (selectedId && items.some((item) => item.id === selectedId)) return selectedId;
	return items[0]?.id ?? null;
}

function renderDefaultSelectedItem(item: GalleryItem): ReactNode {
	return (
		<h2 className="text-center font-semibold text-4xl tracking-tight text-text sm:text-6xl">
			{item.title}
		</h2>
	);
}

export interface GalleryProps {
	items: readonly GalleryItem[];
	/** Label displayed in the Gallery control bar. */
	title?: string;
	/** Controlled visibility of the pinned strip. */
	open?: boolean;
	/** Uncontrolled initial visibility (default true). */
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	selectedId?: string;
	defaultSelectedId?: string;
	onSelectedChange?: (selectedId: string) => void;
	renderSelectedItem?: (item: GalleryItem) => ReactNode;
	className?: string;
	/** Called after the selected prototype is reset to its initial mounted state. */
	onReset?: (item: GalleryItem) => void;
}

export function Gallery({
	items,
	title = "Gallery",
	open,
	defaultOpen = true,
	onOpenChange,
	selectedId,
	defaultSelectedId,
	onSelectedChange,
	renderSelectedItem = renderDefaultSelectedItem,
	className,
	onReset,
}: Readonly<GalleryProps>): JSX.Element {
	const shouldReduceMotion = useReducedMotion();
	const [internalOpen, setInternalOpen] = useState(defaultOpen);
	const [internalSelectedId, setInternalSelectedId] = useState<string | null>(() =>
		resolveSelectedId(items, defaultSelectedId),
	);
	const [visualState, setVisualState] = useState<GalleryVisualState>(() =>
		createInitialVisualState(resolveSelectedId(items, selectedId ?? defaultSelectedId)),
	);
	const [resetKey, setResetKey] = useState(0);
	const selectedStageRef = useRef<HTMLElement | null>(null);
	const isOpenRef = useRef(open ?? internalOpen);
	const previousSelectedIdRef = useRef<string | null>(resolveSelectedId(items, selectedId ?? defaultSelectedId));
	const selectionOriginsRef = useRef<Map<string, GallerySelectionOrigin>>(new Map());
	const visualKeyRef = useRef(1);

	const isOpen = open ?? internalOpen;
	isOpenRef.current = isOpen;
	const resolvedSelectedId = resolveSelectedId(items, selectedId ?? internalSelectedId);
	const selectedItem =
		resolvedSelectedId ? (items.find((item) => item.id === resolvedSelectedId) ?? null) : null;

	useEffect(() => {
		if (selectedId !== undefined) return;
		const nextSelectedId = resolveSelectedId(items, internalSelectedId);
		if (nextSelectedId !== internalSelectedId) {
			setInternalSelectedId(nextSelectedId);
		}
	}, [internalSelectedId, items, selectedId]);

	const handleToggle = useCallback(() => {
		const next = !isOpenRef.current;
		isOpenRef.current = next;
		if (open === undefined) setInternalOpen(next);
		onOpenChange?.(next);
	}, [open, onOpenChange]);

	const handleSelect = useCallback(
		(id: string, origin: GallerySelectionOrigin) => {
			if (id === resolvedSelectedId) return;
			selectionOriginsRef.current.set(id, origin);
			if (selectedId === undefined) setInternalSelectedId(id);
			onSelectedChange?.(id);
		},
		[onSelectedChange, resolvedSelectedId, selectedId],
	);

	const handleReset = useCallback(() => {
		if (!selectedItem) return;
		setResetKey((current) => current + 1);
		onReset?.(selectedItem);
	}, [onReset, selectedItem]);

	useEffect(() => {
		if (!resolvedSelectedId) {
			setVisualState({ active: null, exiting: null });
			return;
		}
		const origin =
			selectionOriginsRef.current.get(resolvedSelectedId) ?? DEFAULT_GALLERY_SELECTION_ORIGIN;
		setVisualState((current) => {
			if (current.active?.id === resolvedSelectedId) {
				return current.active.origin === origin
					? current
					: { ...current, active: { ...current.active, origin } };
			}
			const nextActive: GallerySelectionVisual = {
				id: resolvedSelectedId,
				key: visualKeyRef.current,
				origin,
				phase: current.active ? "enter" : "settled",
			};
			visualKeyRef.current += 1;
			return {
				active: nextActive,
				exiting:
					current.active && current.active.id !== resolvedSelectedId
						? { ...current.active, phase: "exit" }
						: null,
			};
		});
	}, [resolvedSelectedId]);

	useEffect(() => {
		if (!visualState.exiting) return;
		const exitingKey = visualState.exiting.key;
		const timeout = window.setTimeout(() => {
			setVisualState((current) =>
				current.exiting?.key === exitingKey ? { ...current, exiting: null } : current,
			);
		}, shouldReduceMotion ? 0 : GALLERY_SELECTION_SHADER_EXIT_OVERLAP_MS);
		return () => window.clearTimeout(timeout);
	}, [shouldReduceMotion, visualState.exiting]);

	useEffect(() => {
		if (!selectedItem) return;
		const previousSelectedId = previousSelectedIdRef.current;
		previousSelectedIdRef.current = selectedItem.id;
		if (!previousSelectedId || previousSelectedId === selectedItem.id || typeof window === "undefined") {
			return;
		}
		const stage = selectedStageRef.current;
		if (!stage) return;
		const { top, bottom } = stage.getBoundingClientRect();
		const isOffscreen =
			top < STAGE_SCROLL_OFFSET || bottom > window.innerHeight - STAGE_SCROLL_OFFSET;
		if (!isOffscreen) return;
		stage.scrollIntoView({
			behavior: shouldReduceMotion ? "auto" : "smooth",
			block: "center",
		});
	}, [selectedItem, shouldReduceMotion]);

	return (
		<div className={cn(className)}>
			<GalleryToggle title={title} open={isOpen} onToggle={handleToggle} onReset={handleReset} />

			{selectedItem ? (
				<GallerySelectedStage
					item={selectedItem}
					resetKey={resetKey}
					stageRef={selectedStageRef}
					renderSelectedItem={renderSelectedItem}
				/>
			) : null}
			<AnimatePresence>
				{isOpen ? (
					<motion.div
						key="gallery-strip"
						className="fixed inset-x-0 bottom-0 z-40"
						variants={STRIP}
						initial="hidden"
						animate="visible"
						exit="exit"
					>
						<motion.div variants={BACKDROP} style={{ willChange: "opacity" }}>
							<GalleryBackdrop />
						</motion.div>
						<GalleryTrack
							items={items}
							selectedId={resolvedSelectedId}
							activeVisual={visualState.active}
							exitingVisual={visualState.exiting}
							onSelect={handleSelect}
						/>
					</motion.div>
				) : null}
			</AnimatePresence>
		</div>
	);
}
