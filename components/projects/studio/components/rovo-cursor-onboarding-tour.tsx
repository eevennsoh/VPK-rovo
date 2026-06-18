"use client";

import CrossIcon from "@atlaskit/icon/core/cross";
import { AnimatePresence, arc, motion, useReducedMotion, type Transition } from "motion/react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { RovoCursor } from "@/components/ui-custom/rovo-cursor";
import { Button } from "@/components/ui/button";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import type { AgentOnboardingTourStep } from "../data/agent-onboarding-tour";

const CURSOR_SIZE = 22;
const CURSOR_TIP_OFFSET_X = 7;
const CURSOR_TIP_OFFSET_Y = 3;
const TARGET_OUTSET = 8;
const PANEL_WIDTH = 320;
const PANEL_MARGIN = 16;
const PANEL_GAP = 14;
const TYPEWRITER_INTERVAL_MS = 22;
const CURSOR_TOUR_TRANSITION_MS = 540;
const CURSOR_RETURN_TRANSITION_MS = 680;
const PANEL_REVEAL_BUFFER_MS = 80;
const TOUR_PANEL_REVEAL_DELAY_MS = CURSOR_TOUR_TRANSITION_MS + PANEL_REVEAL_BUFFER_MS;
const FINAL_MESSAGE_DELAY_MS = CURSOR_RETURN_TRANSITION_MS + PANEL_REVEAL_BUFFER_MS;
const FINAL_DISMISS_MS = 3200;
const FINAL_MESSAGE = "If you need help, you can always find me here.";
const CURSOR_ARC_TRANSITION_EASE = [0.2, 0.72, 0.18, 1] as const;
const FOCUSABLE_SELECTOR = [
	"a[href]",
	"button:not([disabled])",
	"input:not([disabled])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	"[tabindex]:not([tabindex='-1'])",
].join(",");

type ViewportRect = Pick<DOMRect, "bottom" | "height" | "left" | "right" | "top" | "width">;
type ViewportPoint = { x: number; y: number };
type TourPhase = "tour" | "returning";

export interface RovoCursorOnboardingTourProps {
	isActive: boolean;
	step: AgentOnboardingTourStep;
	stepIndex: number;
	total: number;
	isFirst: boolean;
	isLast: boolean;
	anchorElement: HTMLElement | null;
	liveChatAnchorElement: HTMLElement | null;
	finishRequestKey?: number;
	onBack: () => void;
	onNext: () => void;
	onDismiss: () => void;
}

function readViewportRect(element: HTMLElement | null): ViewportRect | null {
	if (!element || element.getClientRects().length === 0) {
		return null;
	}

	const rect = element.getBoundingClientRect();
	return {
		bottom: rect.bottom,
		height: rect.height,
		left: rect.left,
		right: rect.right,
		top: rect.top,
		width: rect.width,
	};
}

function getAnchorPoint(rect: ViewportRect): ViewportPoint {
	return {
		x: rect.left + rect.width / 2,
		y: rect.top + rect.height / 2,
	};
}

function getCursorPosition(point: ViewportPoint): ViewportPoint {
	return {
		x: point.x - CURSOR_TIP_OFFSET_X,
		y: point.y - CURSOR_TIP_OFFSET_Y,
	};
}

function getFallbackPoint(): ViewportPoint {
	if (typeof window === "undefined") {
		return { x: 24, y: 24 };
	}

	return {
		x: Math.max(PANEL_MARGIN, window.innerWidth - 64),
		y: Math.max(PANEL_MARGIN, window.innerHeight - 64),
	};
}

function clampToViewport(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function doRectsOverlap(a: ViewportRect, b: ViewportRect): boolean {
	return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function expandRect(rect: ViewportRect, amount: number): ViewportRect {
	return {
		bottom: rect.bottom + amount,
		height: rect.height + amount * 2,
		left: rect.left - amount,
		right: rect.right + amount,
		top: rect.top - amount,
		width: rect.width + amount * 2,
	};
}

function areRectsEqual(a: ViewportRect | null, b: ViewportRect | null): boolean {
	if (a === b) {
		return true;
	}
	if (!a || !b) {
		return false;
	}

	return (
		Math.abs(a.bottom - b.bottom) < 0.5 &&
		Math.abs(a.height - b.height) < 0.5 &&
		Math.abs(a.left - b.left) < 0.5 &&
		Math.abs(a.right - b.right) < 0.5 &&
		Math.abs(a.top - b.top) < 0.5 &&
		Math.abs(a.width - b.width) < 0.5
	);
}

function getPanelPosition({
	anchorRect,
	avoidRect,
	finalMode,
	point,
}: {
	anchorRect: ViewportRect | null;
	avoidRect?: ViewportRect | null;
	finalMode: boolean;
	point: ViewportPoint;
}): ViewportPoint {
	if (typeof window === "undefined") {
		return { x: PANEL_MARGIN, y: PANEL_MARGIN };
	}

	const maxLeft = Math.max(PANEL_MARGIN, window.innerWidth - PANEL_WIDTH - PANEL_MARGIN);
	const naturalLeft = finalMode
		? point.x - PANEL_WIDTH / 2
		: point.x + 28;
	const left = clampToViewport(naturalLeft, PANEL_MARGIN, maxLeft);
	const panelHeightEstimate = finalMode ? 96 : 172;
	const belowTop = (anchorRect?.bottom ?? point.y) + PANEL_GAP;
	const aboveTop = (anchorRect?.top ?? point.y) - panelHeightEstimate - PANEL_GAP;
	const hasRoomBelow = belowTop + panelHeightEstimate <= window.innerHeight - PANEL_MARGIN;
	const top = finalMode
		? clampToViewport(aboveTop, PANEL_MARGIN, Math.max(PANEL_MARGIN, window.innerHeight - panelHeightEstimate - PANEL_MARGIN))
		: hasRoomBelow
			? belowTop
			: clampToViewport(aboveTop, PANEL_MARGIN, Math.max(PANEL_MARGIN, window.innerHeight - panelHeightEstimate - PANEL_MARGIN));

	if (!finalMode && anchorRect && avoidRect) {
		const panelRect = {
			bottom: top + panelHeightEstimate,
			height: panelHeightEstimate,
			left,
			right: left + PANEL_WIDTH,
			top,
			width: PANEL_WIDTH,
		};
		if (doRectsOverlap(panelRect, expandRect(avoidRect, PANEL_GAP))) {
			const maxTop = Math.max(PANEL_MARGIN, window.innerHeight - panelHeightEstimate - PANEL_MARGIN);
			const leftOfAnchor = anchorRect.left - PANEL_WIDTH - PANEL_GAP;
			if (leftOfAnchor >= PANEL_MARGIN) {
				return {
					x: clampToViewport(leftOfAnchor, PANEL_MARGIN, maxLeft),
					y: clampToViewport(anchorRect.top, PANEL_MARGIN, maxTop),
				};
			}

			return {
				x: left,
				y: clampToViewport(avoidRect.top - panelHeightEstimate - PANEL_GAP, PANEL_MARGIN, maxTop),
			};
		}
	}

	return { x: left, y: top };
}

function useViewportMeasurement({
	active,
	anchorElement,
	liveChatAnchorElement,
}: {
	active: boolean;
	anchorElement: HTMLElement | null;
	liveChatAnchorElement: HTMLElement | null;
}) {
	const [rects, setRects] = useState<{ anchorRect: ViewportRect | null; liveChatRect: ViewportRect | null }>({
		anchorRect: null,
		liveChatRect: null,
	});

	useEffect(() => {
		if (!active) {
			setRects({ anchorRect: null, liveChatRect: null });
			return;
		}

		let frame = 0;
		let cancelled = false;
		const update = () => {
			if (cancelled) {
				return;
			}

			const nextRects = {
				anchorRect: readViewportRect(anchorElement),
				liveChatRect: readViewportRect(liveChatAnchorElement),
			};
			setRects((previousRects) => {
				if (
					areRectsEqual(previousRects.anchorRect, nextRects.anchorRect) &&
					areRectsEqual(previousRects.liveChatRect, nextRects.liveChatRect)
				) {
					return previousRects;
				}

				return nextRects;
			});
			frame = requestAnimationFrame(update);
		};

		update();
		window.addEventListener("resize", update);
		window.addEventListener("scroll", update, true);
		return () => {
			cancelled = true;
			cancelAnimationFrame(frame);
			window.removeEventListener("resize", update);
			window.removeEventListener("scroll", update, true);
		};
	}, [active, anchorElement, liveChatAnchorElement]);

	return rects;
}

function useTypewriterText(text: string, key: string, active: boolean) {
	const reducedMotion = useReducedMotion();
	const [displayedText, setDisplayedText] = useState(reducedMotion ? text : "");

	useEffect(() => {
		if (!active || reducedMotion) {
			setDisplayedText(active ? text : "");
			return;
		}

		setDisplayedText("");
		let index = 0;
		const interval = window.setInterval(() => {
			index += 1;
			setDisplayedText(text.slice(0, index));
			if (index >= text.length) {
				window.clearInterval(interval);
			}
		}, TYPEWRITER_INTERVAL_MS);

		return () => window.clearInterval(interval);
	}, [active, key, reducedMotion, text]);

	return displayedText;
}

export function RovoCursorOnboardingTour({
	isActive,
	step,
	stepIndex,
	total,
	isFirst,
	isLast,
	anchorElement,
	liveChatAnchorElement,
	finishRequestKey = 0,
	onBack,
	onNext,
	onDismiss,
}: Readonly<RovoCursorOnboardingTourProps>) {
	const reducedMotion = useReducedMotion();
	const titleId = useId();
	const bodyId = useId();
	const panelRef = useRef<HTMLElement | null>(null);
	const restoreFocusRef = useRef<HTMLElement | null>(null);
	const lastFinishRequestKeyRef = useRef(finishRequestKey);
	const [mounted, setMounted] = useState(false);
	const [phase, setPhase] = useState<TourPhase>("tour");
	const [showTourPanel, setShowTourPanel] = useState(false);
	const [showFinalMessage, setShowFinalMessage] = useState(false);
	const active = isActive || phase === "returning";
	const { anchorRect, liveChatRect } = useViewportMeasurement({
		active,
		anchorElement,
		liveChatAnchorElement,
	});
	const cursorPath = useMemo(() => arc({ strength: 0.28, peak: 0.42, direction: "cw", rotate: 0.12 }), []);
	const finalPath = useMemo(() => arc({ strength: 0.44, peak: 0.48, direction: "ccw", rotate: 0.18 }), []);
	const panelKey = phase === "returning" ? "final" : step.key;
	const message = phase === "returning" ? FINAL_MESSAGE : step.body;
	const showPanel = (phase === "tour" && showTourPanel) || (phase === "returning" && showFinalMessage);
	const typedMessage = useTypewriterText(message, panelKey, showPanel);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!isActive) {
			return;
		}

		setPhase("tour");
		setShowTourPanel(false);
		setShowFinalMessage(false);
	}, [isActive, step.key]);

	useEffect(() => {
		if (!isActive || phase !== "tour") {
			setShowTourPanel(false);
			return;
		}

		setShowTourPanel(false);
		const revealTimer = window.setTimeout(() => setShowTourPanel(true), reducedMotion ? 0 : TOUR_PANEL_REVEAL_DELAY_MS);
		return () => window.clearTimeout(revealTimer);
	}, [isActive, phase, reducedMotion, step.key]);

	useEffect(() => {
		if (!active) {
			return;
		}

		if (!restoreFocusRef.current && document.activeElement instanceof HTMLElement) {
			restoreFocusRef.current = document.activeElement;
		}

		return () => {
			const restoreElement = restoreFocusRef.current;
			restoreFocusRef.current = null;
			if (restoreElement && document.contains(restoreElement)) {
				restoreElement.focus({ preventScroll: true });
			}
		};
	}, [active]);

	useEffect(() => {
		if (!active || !showPanel) {
			return;
		}

		const frame = requestAnimationFrame(() => {
			panelRef.current?.focus({ preventScroll: true });
		});
		return () => cancelAnimationFrame(frame);
	}, [active, panelKey, showPanel]);

	useEffect(() => {
		if (!active) {
			return;
		}

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onDismiss();
				return;
			}

			if (event.key !== "Tab" || !showPanel || !panelRef.current) {
				return;
			}

			const focusableElements = Array.from(
				panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
			).filter((element) => element.getClientRects().length > 0);
			if (focusableElements.length === 0) {
				event.preventDefault();
				panelRef.current.focus({ preventScroll: true });
				return;
			}

			const firstElement = focusableElements[0];
			const lastElement = focusableElements[focusableElements.length - 1];
			const activeElement = document.activeElement;
			if (event.shiftKey && activeElement === firstElement) {
				event.preventDefault();
				lastElement.focus({ preventScroll: true });
				return;
			}
			if (!event.shiftKey && activeElement === lastElement) {
				event.preventDefault();
				firstElement.focus({ preventScroll: true });
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [active, onDismiss, showPanel]);

	useEffect(() => {
		if (phase !== "returning") {
			return;
		}

		const revealTimer = window.setTimeout(() => setShowFinalMessage(true), reducedMotion ? 0 : FINAL_MESSAGE_DELAY_MS);
		const dismissTimer = window.setTimeout(onDismiss, (reducedMotion ? 0 : FINAL_MESSAGE_DELAY_MS) + FINAL_DISMISS_MS);
		return () => {
			window.clearTimeout(revealTimer);
			window.clearTimeout(dismissTimer);
		};
	}, [onDismiss, phase, reducedMotion]);

	const startReturningPhase = useCallback(() => {
		setPhase("returning");
		setShowTourPanel(false);
		setShowFinalMessage(false);
	}, []);

	useEffect(() => {
		if (finishRequestKey <= 0 || lastFinishRequestKeyRef.current === finishRequestKey) {
			return;
		}

		lastFinishRequestKeyRef.current = finishRequestKey;
		if (!isActive || phase !== "tour") {
			return;
		}

		startReturningPhase();
	}, [finishRequestKey, isActive, phase, startReturningPhase]);

	const handlePrimaryAction = useCallback(() => {
		if (!isLast) {
			onNext();
			return;
		}

		startReturningPhase();
	}, [isLast, onNext, startReturningPhase]);

	if (!mounted || !active) {
		return null;
	}

	const anchorPoint = anchorRect ? getAnchorPoint(anchorRect) : getFallbackPoint();
	const liveChatPoint = liveChatRect ? getAnchorPoint(liveChatRect) : anchorPoint;
	const targetPoint = phase === "returning" ? liveChatPoint : anchorPoint;
	const cursorPosition = getCursorPosition(targetPoint);
	const panelPosition = getPanelPosition({
		anchorRect: phase === "returning" ? liveChatRect : anchorRect,
		avoidRect: phase === "tour" ? liveChatRect : null,
		finalMode: phase === "returning",
		point: targetPoint,
	});
	const initialPoint = liveChatRect ? getCursorPosition(getAnchorPoint(liveChatRect)) : getCursorPosition(getFallbackPoint());
	const motionTransition: Transition = reducedMotion
		? { duration: 0 }
		: {
				duration: phase === "returning" ? CURSOR_RETURN_TRANSITION_MS / 1000 : CURSOR_TOUR_TRANSITION_MS / 1000,
				ease: CURSOR_ARC_TRANSITION_EASE,
				path: phase === "returning" ? finalPath : cursorPath,
			};

	return createPortal(
		<div
			aria-live="polite"
			className="pointer-events-none fixed inset-0 z-[10020]"
			data-rovo-cursor-onboarding-tour
			data-rovo-cursor-onboarding-phase={phase}
		>
			<AnimatePresence>
				{phase === "tour" && anchorRect ? (
					<motion.div
						aria-hidden
						className="fixed rounded-lg border-2 border-border-accent-blue bg-blanket-selected shadow-[0_0_0_6px_var(--ds-blanket-selected)]"
						data-rovo-cursor-onboarding-highlight
						initial={reducedMotion ? false : { opacity: 0, scale: 0.96 }}
						animate={{
							opacity: 1,
							scale: 1,
							x: anchorRect.left - TARGET_OUTSET,
							y: anchorRect.top - TARGET_OUTSET,
							width: anchorRect.width + TARGET_OUTSET * 2,
							height: anchorRect.height + TARGET_OUTSET * 2,
						}}
						exit={{ opacity: 0, scale: 0.98 }}
						transition={reducedMotion ? { duration: 0 } : { duration: 0.22 }}
						style={{ boxShadow: `0 0 0 6px ${token("color.blanket.selected")}` }}
					/>
				) : null}
			</AnimatePresence>
			<motion.div
				aria-hidden
				className="fixed left-0 top-0"
				data-rovo-cursor-onboarding-cursor
				initial={reducedMotion ? false : { opacity: 0, scale: 0.72, x: initialPoint.x, y: initialPoint.y }}
				animate={{ opacity: 1, scale: phase === "returning" ? 0.82 : 1, x: cursorPosition.x, y: cursorPosition.y }}
				exit={{ opacity: 0, scale: 0.7 }}
				transition={motionTransition}
				style={{ willChange: reducedMotion ? undefined : "transform, opacity" }}
			>
				<RovoCursor state="cursor" size={CURSOR_SIZE} />
			</motion.div>
			<AnimatePresence mode="wait">
				{showPanel ? (
					<motion.section
						key={panelKey}
						aria-describedby={bodyId}
						aria-labelledby={titleId}
						className={cn(
							"pointer-events-auto fixed flex w-80 flex-col gap-3 rounded-lg bg-bg-neutral-bold p-4 text-text-inverse",
							phase === "returning" ? "items-start" : null,
						)}
						data-rovo-cursor-onboarding-panel
						ref={panelRef}
						role="dialog"
						tabIndex={-1}
						initial={reducedMotion ? false : { opacity: 0, scale: 0.92 }}
						animate={{ opacity: 1, scale: 1 }}
						exit={{ opacity: 0, scale: 0.94 }}
						transition={reducedMotion ? { duration: 0 } : { type: "spring", bounce: 0.18, visualDuration: 0.28 }}
						style={{
							boxShadow: token("elevation.shadow.overlay"),
							left: panelPosition.x,
							top: panelPosition.y,
							width: PANEL_WIDTH,
						}}
					>
						<div className="flex w-full items-start justify-between gap-2">
							<div className="min-w-0 flex-1">
								<h2 id={titleId} className="text-text-inverse" style={{ font: token("font.heading.xsmall") }}>
									{phase === "returning" ? "Rovo" : step.headline}
								</h2>
							</div>
							<Button
								aria-label="Dismiss onboarding"
								className="-mr-1 -mt-1 text-text-inverse hover:bg-text-inverse/10 [&_svg]:text-current"
								data-rovo-cursor-onboarding-dismiss
								onClick={onDismiss}
								size="icon-compact"
								type="button"
								variant="ghost"
							>
								<CrossIcon label="" size="small" />
							</Button>
						</div>
						<div
							id={bodyId}
							className="min-h-10 text-sm leading-5 text-text-inverse opacity-90"
							data-rovo-cursor-onboarding-stream
						>
							{typedMessage}
						</div>
						{phase === "tour" ? (
							<div className="mt-1 flex items-center justify-between gap-3">
								<div className="flex min-w-0 items-center gap-2 text-xs leading-4 font-medium text-text-inverse opacity-75">
									<RovoCursor state="speaking" size={16} />
									<span>
										{stepIndex + 1} of {total}
									</span>
								</div>
								<div className="flex items-center justify-end gap-1">
									{isFirst ? null : (
										<Button
											className="text-text-inverse hover:bg-text-inverse/10 active:bg-text-inverse/15 [&_svg]:text-current"
											data-rovo-cursor-onboarding-back
											onClick={onBack}
											size="compact"
											type="button"
											variant="ghost"
										>
											Back
										</Button>
									)}
									<Button
										className="bg-text-inverse text-text hover:bg-text-inverse/90 active:bg-text-inverse/80"
										data-rovo-cursor-onboarding-next
										onClick={handlePrimaryAction}
										size="compact"
										type="button"
									>
										{isLast ? "Finish" : "Next"}
									</Button>
								</div>
							</div>
						) : null}
					</motion.section>
				) : null}
			</AnimatePresence>
		</div>,
		document.body,
	);
}
