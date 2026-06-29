"use client";

// oxlint-disable react-doctor/exhaustive-deps -- Effects in this file intentionally coordinate refs, external animation loops, timers, subscriptions, or measured DOM state; dependencies are constrained to avoid restarting those bridges.
// oxlint-disable react-doctor/no-derived-state -- These components maintain local derived display state for controlled animations, measurements, or draft editing that cannot be represented as render-only values without changing UX.
// oxlint-disable react-doctor/no-event-handler -- Effects in this file bridge external systems, animation/media state, timers, or parent-controlled state rather than user event handlers.

/* eslint-disable react-hooks/exhaustive-deps -- These callbacks/effects intentionally read stable refs that bridge external animation, drag, preview, and editor state. */

import { useLazyRef } from "@/lib/use-lazy-ref";
import {
	type MouseEvent as ReactMouseEvent,
	type PointerEvent as ReactPointerEvent,
	type ReactNode,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import Image from "next/image";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import CrossIcon from "@atlaskit/icon/core/cross";
import {
	AnimatePresence,
	animate,
	motion,
	useMotionValue,
	useReducedMotion,
	type MotionStyle,
} from "motion/react";
import { useRovoChat } from "@/app/contexts";
import { AnimatedRovo } from "@/components/ui-custom/animated-rovo";
import { RovoColorIcon } from "@/components/ui/logo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import {
	armClickSuppression,
	createInitialClickSuppressionState,
	handleClickWithSuppression,
	type FloatingRovoButtonClickSuppressionState,
} from "./floating-rovo-button-click-suppression";

type Product = "admin" | "agents" | "home" | "jira" | "confluence" | "rovo" | "search" | "studio";
export type FloatingRovoButtonOnboardingStatus = "idle" | "creating" | "created";

export interface FloatingRovoButtonSuggestion {
	id: string;
	label: string;
	ariaLabel?: string;
	onSelect: () => void;
	onDismiss?: () => void;
}

export interface FloatingRovoButtonPersistentBarItem {
	id: string;
	icon: ReactNode;
	ariaLabel: string;
	tooltipLabel?: string;
	onClick?: () => void;
	indicator?: boolean;
}

export type FloatingRovoButtonPersistentBarSide = "auto" | "top" | "bottom";

export interface FloatingRovoButtonPersistentBar {
	items: FloatingRovoButtonPersistentBarItem[];
	/**
	 * Which edge of the button the bar attaches to. `"auto"` (default) places it
	 * above the button when the button sits in the lower half of its space and
	 * below it otherwise, so the bar always opens toward open space.
	 */
	side?: FloatingRovoButtonPersistentBarSide;
	ariaLabel?: string;
}

export interface FloatingRovoButtonOnboardingConfig {
	id: string;
	title: string;
	agentName: string;
	byline: string;
	description: string;
	prompt: string;
	primaryActionLabel: string;
	secondaryActionLabel: string;
	avatarSrc?: string;
	avatarAlt?: string;
	coverSrc?: string;
	coverBackgroundColor?: string;
	closeLabel?: string;
	status?: FloatingRovoButtonOnboardingStatus;
	statusLabel?: string;
	primaryActionDisabled?: boolean;
	open?: boolean;
	defaultOpen?: boolean;
	openOnButtonClick?: boolean;
	onOpenChange?: (open: boolean) => void;
	onPrimaryAction?: () => void;
	onSecondaryAction?: () => void;
}

export interface FloatingRovoButtonPlacement {
	right?: string;
	bottom?: string;
}

export type FloatingRovoButtonPositioning = "viewport" | "container";

interface FloatingRovoButtonProps {
	product: Product;
	embedded?: boolean;
	forceVisible?: boolean;
	ariaLabel?: string;
	placement?: FloatingRovoButtonPlacement;
	positioning?: FloatingRovoButtonPositioning;
	onButtonClick?: () => void;
	suggestion?: FloatingRovoButtonSuggestion | null;
	onboarding?: FloatingRovoButtonOnboardingConfig | null;
	persistentBar?: FloatingRovoButtonPersistentBar | null;
}

const DEFAULT_BUTTON_RIGHT = "24px";
const DEFAULT_BUTTON_BOTTOM = "24px";
const FLOATING_ROVO_BUTTON_EDGE_GAP = 24;
const FLOATING_ROVO_BUTTON_SNAP_GRID_SIZE = 4;
const FLOATING_ROVO_BUTTON_DRAG_CLICK_THRESHOLD = 6;
const FLOATING_ROVO_BUTTON_CLICK_SUPPRESSION_MS = 1000;
const FLOATING_ROVO_BUTTON_LOGO_CYCLE_S = 2.5;
const FLOATING_ROVO_BUTTON_LOGO_CYCLE_MS = FLOATING_ROVO_BUTTON_LOGO_CYCLE_S * 1000;
const AGENT_AVATAR_HEXAGON_PATH = "M19.01 0.922148C20.24 0.212148 21.76 0.212148 23 0.922148L40 10.6921C41.24 11.4021 42.01 12.7321 42.01 14.1621V33.6721C42.01 35.1021 41.24 36.4221 40 37.1421L23 46.9121C21.77 47.6221 20.25 47.6221 19.01 46.9121L2.01 37.1321C0.77 36.4221 0 35.0921 0 33.6621V14.1621C0 12.7321 0.77 11.4121 2.01 10.6921L19.01 0.922148Z";

interface FloatingRovoButtonSnapTarget {
	left: number;
	top: number;
}

interface FloatingRovoButtonDragConstraints {
	bottom: number;
	left: number;
	right: number;
	top: number;
}

interface FloatingRovoButtonDragStart {
	offsetX: number;
	offsetY: number;
	pointerId: number | null;
	x: number;
	y: number;
}

interface FloatingRovoButtonCoordinateSpace {
	height: number;
	left: number;
	top: number;
	width: number;
}

interface FloatingRovoButtonLocalMeasurement {
	rect: Pick<DOMRect, "height" | "left" | "top" | "width">;
	space: FloatingRovoButtonCoordinateSpace;
}

function resolveFloatingRovoButtonPlacement(placement?: FloatingRovoButtonPlacement): Required<FloatingRovoButtonPlacement> {
	return {
		right: placement?.right ?? DEFAULT_BUTTON_RIGHT,
		bottom: placement?.bottom ?? DEFAULT_BUTTON_BOTTOM,
	};
}

function clampFloatingRovoButtonValue(value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
}

function getFloatingRovoButtonCoordinateSpace(
	surface: HTMLElement,
	positioning: FloatingRovoButtonPositioning,
): FloatingRovoButtonCoordinateSpace {
	if (positioning === "container" && surface.offsetParent instanceof HTMLElement) {
		const parentRect = surface.offsetParent.getBoundingClientRect();

		return {
			left: parentRect.left,
			top: parentRect.top,
			width: surface.offsetParent.clientWidth,
			height: surface.offsetParent.clientHeight,
		};
	}

	return {
		left: 0,
		top: 0,
		width: window.innerWidth,
		height: window.innerHeight,
	};
}

function getFloatingRovoButtonLocalMeasurement(
	surface: HTMLElement,
	positioning: FloatingRovoButtonPositioning,
): FloatingRovoButtonLocalMeasurement {
	const rect = surface.getBoundingClientRect();
	const space = getFloatingRovoButtonCoordinateSpace(surface, positioning);

	return {
		rect: {
			left: rect.left - space.left,
			top: rect.top - space.top,
			width: rect.width,
			height: rect.height,
		},
		space,
	};
}

function getFloatingRovoButtonSafeBounds(rect: Pick<DOMRect, "width" | "height">, viewportWidth: number, viewportHeight: number) {
	const minLeft = FLOATING_ROVO_BUTTON_EDGE_GAP;
	const minTop = FLOATING_ROVO_BUTTON_EDGE_GAP;
	const maxLeft = Math.max(minLeft, viewportWidth - rect.width - FLOATING_ROVO_BUTTON_EDGE_GAP);
	const maxTop = Math.max(minTop, viewportHeight - rect.height - FLOATING_ROVO_BUTTON_EDGE_GAP);

	return { minLeft, minTop, maxLeft, maxTop };
}

function getFloatingRovoButtonSnapTargets(
	rect: Pick<DOMRect, "width" | "height">,
	viewportWidth: number,
	viewportHeight: number,
): FloatingRovoButtonSnapTarget[] {
	const { minLeft, minTop, maxLeft, maxTop } = getFloatingRovoButtonSafeBounds(rect, viewportWidth, viewportHeight);
	const snapTargets: FloatingRovoButtonSnapTarget[] = [];

	for (let rowIndex = 0; rowIndex < FLOATING_ROVO_BUTTON_SNAP_GRID_SIZE; rowIndex += 1) {
		for (let columnIndex = 0; columnIndex < FLOATING_ROVO_BUTTON_SNAP_GRID_SIZE; columnIndex += 1) {
			const left = minLeft + ((maxLeft - minLeft) * columnIndex) / (FLOATING_ROVO_BUTTON_SNAP_GRID_SIZE - 1);
			const top = minTop + ((maxTop - minTop) * rowIndex) / (FLOATING_ROVO_BUTTON_SNAP_GRID_SIZE - 1);

			snapTargets.push({ left, top });
		}
	}

	return snapTargets;
}

function getDefaultFloatingRovoButtonSnapTarget(
	rect: Pick<DOMRect, "width" | "height">,
	viewportWidth: number,
	viewportHeight: number,
): FloatingRovoButtonSnapTarget {
	const snapTargets = getFloatingRovoButtonSnapTargets(rect, viewportWidth, viewportHeight);

	return snapTargets[snapTargets.length - 1];
}

function getNearestFloatingRovoButtonSnapTarget(
	rect: Pick<DOMRect, "height" | "left" | "top" | "width">,
	viewportWidth: number,
	viewportHeight: number,
) {
	const snapTargets = getFloatingRovoButtonSnapTargets(rect, viewportWidth, viewportHeight);
	const centerX = rect.left + rect.width / 2;
	const centerY = rect.top + rect.height / 2;
	let closestTarget = snapTargets[0];
	let closestDistance = Infinity;

	for (let snapIndex = 0; snapIndex < snapTargets.length; snapIndex += 1) {
		const target = snapTargets[snapIndex];
		const targetCenterX = target.left + rect.width / 2;
		const targetCenterY = target.top + rect.height / 2;
		const distance = Math.hypot(centerX - targetCenterX, centerY - targetCenterY);

		if (distance < closestDistance) {
			closestDistance = distance;
			closestTarget = target;
		}
	}

	return closestTarget;
}

function getFloatingRovoButtonDragConstraints(
	origin: FloatingRovoButtonSnapTarget,
	rect: Pick<DOMRect, "width" | "height">,
	viewportWidth: number,
	viewportHeight: number,
): FloatingRovoButtonDragConstraints {
	const { minLeft, minTop, maxLeft, maxTop } = getFloatingRovoButtonSafeBounds(rect, viewportWidth, viewportHeight);

	return {
		left: minLeft - origin.left,
		top: minTop - origin.top,
		right: maxLeft - origin.left,
		bottom: maxTop - origin.top,
	};
}

function getClampedFloatingRovoButtonTarget(
	rect: Pick<DOMRect, "height" | "left" | "top" | "width">,
	viewportWidth: number,
	viewportHeight: number,
): FloatingRovoButtonSnapTarget {
	const { minLeft, minTop, maxLeft, maxTop } = getFloatingRovoButtonSafeBounds(rect, viewportWidth, viewportHeight);
	const clampedLeft = clampFloatingRovoButtonValue(rect.left, minLeft, maxLeft);
	const clampedTop = clampFloatingRovoButtonValue(rect.top, minTop, maxTop);

	return { left: clampedLeft, top: clampedTop };
}

function resolveFloatingRovoButtonBarSide(
	configuredSide: FloatingRovoButtonPersistentBarSide,
	targetTop: number,
	rectHeight: number,
	spaceHeight: number,
): "top" | "bottom" {
	if (configuredSide !== "auto") {
		return configuredSide;
	}

	// Button in the lower half of its space → open the bar upward, and vice versa.
	const center = targetTop + rectHeight / 2;
	return center >= spaceHeight / 2 ? "top" : "bottom";
}

function FloatingRovoButtonPersistentBarRail({
	bar,
	side,
	shouldReduceMotion,
}: Readonly<{
	bar: FloatingRovoButtonPersistentBar;
	side: "top" | "bottom";
	shouldReduceMotion: boolean;
}>) {
	// Tuck the bar slightly toward the button as it leaves/enters so the motion
	// reads as "snapping out of / back into" the button rather than a flat fade.
	const tuckOffset = side === "top" ? 10 : -10;
	// Centering rides on `x: "-50%"`; it must stay constant across every variant
	// so Motion never animates the horizontal offset (it owns the transform).
	const railVariants = shouldReduceMotion
		? {
			hidden: { opacity: 0, x: "-50%" as const },
			visible: { opacity: 1, x: "-50%" as const, transition: { duration: 0 } },
			exit: { opacity: 0, x: "-50%" as const, transition: { duration: 0 } },
		}
		: {
			hidden: { opacity: 0, scale: 0.9, x: "-50%" as const, y: tuckOffset },
			visible: {
				opacity: 1,
				scale: 1,
				x: "-50%" as const,
				y: 0,
				transition: {
					type: "spring" as const,
					bounce: 0,
					visualDuration: 0.26,
					delayChildren: 0.06,
					staggerChildren: 0.05,
				},
			},
			exit: {
				opacity: 0,
				scale: 0.88,
				x: "-50%" as const,
				y: tuckOffset,
				transition: { duration: 0.12, ease: [0.6, 0, 0.8, 0.6] as const },
			},
		};
	const itemVariants = shouldReduceMotion
		? {
			hidden: { opacity: 0 },
			visible: { opacity: 1, transition: { duration: 0 } },
		}
		: {
			hidden: { opacity: 0, scale: 0.5 },
			visible: {
				opacity: 1,
				scale: 1,
				transition: { type: "spring" as const, bounce: 0.3, visualDuration: 0.3 },
			},
		};

	return (
		<motion.div
			key="floating-rovo-button-persistent-bar"
			role="toolbar"
			aria-orientation="vertical"
			aria-label={bar.ariaLabel ?? "Rovo quick actions"}
			className={cn(
				"pointer-events-auto absolute left-1/2 z-[505] flex cursor-default flex-col items-center gap-1 rounded-2xl bg-surface-raised p-2",
				side === "top" ? "bottom-full mb-3" : "top-full mt-3",
			)}
			variants={railVariants}
			initial="hidden"
			animate="visible"
			exit="exit"
			style={{
				boxShadow: token("elevation.shadow.overlay"),
				transformOrigin: side === "top" ? "center bottom" : "center top",
				willChange: "transform, opacity",
			}}
		>
			<TooltipProvider delay={0}>
				{bar.items.map((item) => {
					const actionButton = (
						<motion.button
							key={item.id}
							aria-label={item.ariaLabel}
							className="relative flex size-8 items-center justify-center rounded-xl text-icon transition-colors duration-normal ease-out enabled:hover:bg-bg-neutral-subtle-hovered focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none enabled:active:bg-bg-neutral-subtle-pressed disabled:cursor-default disabled:text-icon-disabled"
							variants={itemVariants}
							onClick={item.onClick}
							disabled={!item.onClick}
							type="button"
							style={{ willChange: "transform, opacity" }}
						>
							{item.icon}
							{item.indicator ? (
								<span
									aria-hidden="true"
									className="absolute top-1.5 right-1.5 size-2 rounded-full bg-bg-information ring-2 ring-surface-raised"
								/>
							) : null}
						</motion.button>
					);

					return item.tooltipLabel ? (
						<Tooltip key={item.id}>
							<TooltipTrigger render={actionButton} />
							{/* Anchor vertically along the bar's own direction (away from the
							    button) so the label centers on the button and never overflows a
							    narrow preview card's left/right edge the way a fixed
							    `side="left"` tooltip did. Base UI auto-flips if that side lacks
							    room. */}
							<TooltipContent side={side}>{item.tooltipLabel}</TooltipContent>
						</Tooltip>
					) : actionButton;
				})}
			</TooltipProvider>
		</motion.div>
	);
}

function FloatingRovoButtonNudge({
	suggestion,
	placement,
	positioning = "viewport",
}: Readonly<{
	suggestion: FloatingRovoButtonSuggestion;
	placement?: FloatingRovoButtonPlacement;
	positioning?: FloatingRovoButtonPositioning;
}>) {
	const resolvedPlacement = resolveFloatingRovoButtonPlacement(placement);

	return (
		<motion.div
			key={suggestion.id}
			className={cn(
				"z-[510] flex w-fit max-w-[calc(100vw-112px)] origin-right items-center gap-1 overflow-hidden rounded-lg p-1 text-text-inverse",
				positioning === "container" ? "absolute" : "fixed",
				placement ? null : "right-[84px] bottom-7",
			)}
			initial={{ opacity: 0, scaleX: 0.24, x: 52 }}
			animate={{ opacity: 1, scaleX: 1, x: 0 }}
			exit={{ opacity: 0, scaleX: 0.24, x: 52 }}
			transition={{
				opacity: { duration: 0.12, ease: [0, 0, 0.2, 1] },
				scaleX: { type: "spring", bounce: 0, visualDuration: 0.28 },
				x: { type: "spring", bounce: 0, visualDuration: 0.28 },
			}}
			style={{
				...(placement
					? {
							right: `calc(${resolvedPlacement.right} + 60px)`,
							bottom: `calc(${resolvedPlacement.bottom} + 4px)`,
						}
					: {}),
				backgroundColor: token("color.background.neutral.bold"),
				boxShadow: token("elevation.shadow.overlay"),
				transformOrigin: "right center",
				willChange: "transform, opacity",
				backfaceVisibility: "hidden",
			}}
		>
			<button
				aria-label={suggestion.ariaLabel ?? suggestion.label}
				className="flex min-h-8 min-w-0 items-center gap-1.5 rounded-md px-2 text-left text-sm leading-5 font-medium text-text-inverse transition-colors duration-normal ease-out hover:bg-white/10 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none active:bg-white/15"
				onClick={suggestion.onSelect}
				type="button"
			>
				<AiAgentIcon color={token("color.icon.inverse")} label="" size="small" />
				<span className="min-w-0 truncate">{suggestion.label}</span>
			</button>
			{suggestion.onDismiss ? (
				<button
					aria-label={`Dismiss ${suggestion.label}`}
					className="flex size-8 shrink-0 items-center justify-center rounded-md text-icon-inverse transition-colors duration-normal ease-out hover:bg-white/10 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none active:bg-white/15"
					onClick={(event) => {
						event.stopPropagation();
						suggestion.onDismiss?.();
					}}
					type="button"
				>
					<CrossIcon color={token("color.icon.inverse")} label="" size="small" />
				</button>
			) : null}
		</motion.div>
	);
}

function FloatingRovoButtonOnboardingPanelInner({
	onboarding,
	onOpenChange,
	shouldReduceMotion,
}: Readonly<{
	onboarding: FloatingRovoButtonOnboardingConfig;
	onOpenChange: (open: boolean) => void;
	shouldReduceMotion: boolean;
}>) {
	const titleId = `${onboarding.id}-title`;
	const descriptionId = `${onboarding.id}-description`;
	const avatarSrc = onboarding.avatarSrc ?? "/avatar-agent/teamwork-agents/blocker-checker.svg";
	const coverSrc = onboarding.coverSrc ?? avatarSrc;
	const closeLabel = onboarding.closeLabel ?? "Dismiss onboarding";
	const phaseOneTransition = shouldReduceMotion
		? { duration: 0 }
		: { type: "spring" as const, bounce: 0.18, visualDuration: 0.26, delay: 0.22 };
	const phaseTwoContainer = shouldReduceMotion
		? { duration: 0 }
		: { delayChildren: 0.36, staggerChildren: 0.05 };
	const phaseTwoChild = shouldReduceMotion
		? { duration: 0 }
		: { duration: 0.22, ease: [0, 0.4, 0, 1] as const };
	const phaseTwoHeaderTransition = shouldReduceMotion
		? { duration: 0 }
		: { duration: 0.22, delay: 0.32, ease: [0, 0.4, 0, 1] as const };
	const phaseTwoVariants = shouldReduceMotion
		? ({
			hidden: { opacity: 1, y: 0, filter: "blur(0px)" },
			visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: phaseTwoChild },
		} as const)
		: ({
			hidden: { opacity: 0, y: 14, filter: "blur(6px)" },
			visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: phaseTwoChild },
		} as const);
	const statusLabel = onboarding.statusLabel
		?? (onboarding.status === "creating" ? "Creating..." : onboarding.status === "created" ? "Created" : "");

	const handleClose = useCallback(() => {
		onOpenChange(false);
	}, [onOpenChange]);
	const handleSecondaryAction = useCallback(() => {
		onboarding.onSecondaryAction?.();
		onOpenChange(false);
	}, [onboarding, onOpenChange]);

	return (
		<motion.section
			key="floating-rovo-button-panel"
			aria-describedby={descriptionId}
			aria-labelledby={titleId}
			className="flex w-full flex-col text-text-inverse"
			data-testid="floating-rovo-button-onboarding"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			exit={{ opacity: 0, transition: { duration: 0 } }}
			transition={shouldReduceMotion
				? { duration: 0 }
				: { duration: 0.14, delay: 0.18, ease: [0, 0.4, 0, 1] as const }}
			onKeyDown={(event) => {
				if (event.key === "Escape") {
					event.stopPropagation();
					handleClose();
				}
			}}
			role="dialog"
			tabIndex={-1}
		>
			<motion.header
				className="flex h-12 shrink-0 items-center justify-between gap-3 py-3 pr-2 pl-4"
				variants={phaseTwoVariants}
				initial="hidden"
				animate="visible"
				transition={phaseTwoHeaderTransition}
				style={{ willChange: "transform, opacity, filter" }}
			>
				<h2 id={titleId} className="min-w-0 truncate text-text-inverse" style={{ font: token("font.heading.xsmall") }}>
					{onboarding.title}
				</h2>
				<button
					aria-label={closeLabel}
					autoFocus
					className="flex size-8 shrink-0 items-center justify-center rounded-md text-icon-inverse transition-colors duration-normal ease-out hover:bg-white/10 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none active:bg-white/15"
					onClick={handleClose}
					type="button"
				>
					<CrossIcon color={token("color.icon.inverse")} label="" size="small" />
				</button>
			</motion.header>
			<div className="flex flex-col">
				<div className="relative overflow-hidden bg-surface text-text">
					<motion.div
						aria-hidden="true"
						className="relative h-12 overflow-hidden"
						initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={phaseOneTransition}
						style={{
							backgroundColor: onboarding.coverBackgroundColor ?? token("color.icon.accent.blue"),
							willChange: "transform, opacity",
						}}
					>
						<Image
							alt=""
							aria-hidden
							className="absolute top-1/2 left-[72%] h-48 w-[168px] -translate-x-1/2 -translate-y-1/2 opacity-95"
							height={192}
							src={coverSrc}
							width={168}
						/>
					</motion.div>
					<motion.div
						className="flex flex-col gap-2 bg-surface-raised pt-8"
						initial="hidden"
						animate="visible"
						variants={{
							hidden: {},
							visible: { transition: phaseTwoContainer },
						}}
					>
						<motion.div
							className="flex flex-col gap-1 px-4 pt-2"
							variants={phaseTwoVariants}
							style={{ willChange: "transform, opacity, filter" }}
						>
							<h3 className="truncate text-text" style={{ font: token("font.heading.medium") }}>
								{onboarding.agentName}
							</h3>
							<p className="text-xs leading-4 text-text-subtle">{onboarding.byline}</p>
						</motion.div>
						<motion.p
							id={descriptionId}
							className="px-4 pb-4 text-sm leading-5 text-text"
							variants={phaseTwoVariants}
							style={{ willChange: "transform, opacity, filter" }}
						>
							{onboarding.description}
						</motion.p>
					</motion.div>
					<motion.div
						className="absolute top-6 left-4 size-12"
						initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.7 }}
						animate={{ opacity: 1, scale: 1 }}
						transition={phaseOneTransition}
						style={{ willChange: "transform, opacity" }}
					>
						<Image
							alt={onboarding.avatarAlt ?? ""}
							className="h-12 w-[42px]"
							height={48}
							src={avatarSrc}
							width={42}
						/>
						<svg
							aria-hidden="true"
							className="pointer-events-none absolute top-0 left-0 h-12 w-[42px] overflow-visible"
							focusable="false"
							viewBox="0 0 43 48"
						>
							<path d={AGENT_AVATAR_HEXAGON_PATH} fill="none" stroke="white" strokeWidth={2} vectorEffect="non-scaling-stroke" />
						</svg>
					</motion.div>
				</div>
				<motion.div
					className="flex flex-col"
					initial="hidden"
					animate="visible"
					variants={{
						hidden: {},
						visible: { transition: { ...phaseTwoContainer, delayChildren: 0.46 } },
					}}
				>
					<motion.p
						className="px-4 pt-3 pb-2 text-sm leading-5 text-text-inverse"
						variants={phaseTwoVariants}
						style={{ willChange: "transform, opacity, filter" }}
					>
						{onboarding.prompt}
					</motion.p>
					<motion.footer
						className="flex items-center justify-between gap-3 px-4 pt-2 pb-4"
						variants={phaseTwoVariants}
						style={{ willChange: "transform, opacity, filter" }}
					>
						<p
							aria-live="polite"
							className={cn(
								"min-w-0 text-xs leading-4 text-text-inverse",
								statusLabel ? "opacity-80" : "opacity-0",
							)}
						>
							{statusLabel || "Idle"}
						</p>
						<div className="flex shrink-0 items-center justify-end gap-2">
							<button
								className="flex h-6 items-center justify-center rounded px-2 text-sm leading-5 font-medium text-text-inverse transition-colors duration-normal ease-out hover:bg-white/10 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none active:bg-white/15"
								onClick={handleSecondaryAction}
								type="button"
							>
								{onboarding.secondaryActionLabel}
							</button>
							<button
								className="flex h-6 items-center justify-center rounded border border-border-inverse/40 bg-bg-neutral-bold px-2 text-sm leading-5 font-medium text-text-inverse transition-colors duration-normal ease-out hover:bg-bg-neutral-bold-hovered focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none active:bg-bg-neutral-bold-pressed disabled:cursor-default disabled:opacity-60"
								disabled={onboarding.primaryActionDisabled}
								onClick={onboarding.onPrimaryAction}
								type="button"
							>
								{onboarding.primaryActionLabel}
							</button>
						</div>
					</motion.footer>
				</motion.div>
			</div>
		</motion.section>
	);
}

function FloatingRovoButtonInner({
	onClick,
	onDragMouseDown,
	onDragPointerDown,
	onLogoPointerEnter,
	ariaLabel,
	logoAnimating,
	shouldReduceMotion,
}: Readonly<{
	onClick: () => void;
	onDragMouseDown: (event: ReactMouseEvent<HTMLButtonElement>) => void;
	onDragPointerDown: (event: ReactPointerEvent<HTMLButtonElement>) => void;
	onLogoPointerEnter: (event: ReactPointerEvent<HTMLButtonElement>) => void;
	ariaLabel: string;
	logoAnimating: boolean;
	shouldReduceMotion: boolean;
}>) {
	return (
		<motion.button
			key="floating-rovo-button-icon"
			aria-label={ariaLabel}
			className="flex h-full w-full items-center justify-center bg-bg-neutral-bold"
			onClick={onClick}
			onMouseDownCapture={onDragMouseDown}
			onPointerEnter={onLogoPointerEnter}
			onPointerDownCapture={onDragPointerDown}
			type="button"
			initial={shouldReduceMotion
				? { opacity: 0 }
				: { opacity: 0, filter: "blur(6px)" }}
			animate={shouldReduceMotion
				? { opacity: 1 }
				: { opacity: 1, filter: "blur(0px)" }}
			exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, transition: { duration: 0.08 } }}
			transition={shouldReduceMotion
				? { duration: 0 }
				: { duration: 0.2, delay: 0.24, ease: [0, 0.4, 0, 1] as const }}
			style={{
				borderRadius: "inherit",
				boxShadow: token("elevation.shadow.overlay"),
				willChange: "opacity, filter",
			}}
		>
			{logoAnimating ? (
				<AnimatedRovo.Root
					key="animated-rovo-logo"
					size={24}
					preset="full-cycle"
					cycleDurationS={FLOATING_ROVO_BUTTON_LOGO_CYCLE_S}
				/>
			) : (
				<RovoColorIcon key="static-rovo-logo" size="small" />
			)}
		</motion.button>
	);
}

function FloatingRovoButtonSurface({
	onboardingOpen,
	onboarding,
	onOpenChange,
	placement,
	positioning = "viewport",
	ariaLabel,
	onButtonClick,
	persistentBar,
	shouldReduceMotion,
}: Readonly<{
	onboardingOpen: boolean;
	onboarding: FloatingRovoButtonOnboardingConfig | null | undefined;
	onOpenChange: (open: boolean) => void;
	placement?: FloatingRovoButtonPlacement;
	positioning?: FloatingRovoButtonPositioning;
	ariaLabel: string;
	onButtonClick: () => void;
	persistentBar: FloatingRovoButtonPersistentBar | null | undefined;
	shouldReduceMotion: boolean;
}>) {
	const resolvedPlacement = resolveFloatingRovoButtonPlacement(placement);
	const configuredBarSide = persistentBar?.side ?? "auto";
	const [barSide, setBarSide] = useState<"top" | "bottom">(
		configuredBarSide === "bottom" ? "bottom" : "top",
	);
	// Drives the persistent bar's exit/enter: it tucks away once a drag actually
	// moves the button and springs back when the drag is released.
	const [isDragging, setIsDragging] = useState(false);
	const surfaceRef = useRef<HTMLDivElement | null>(null);
	const buttonX = useMotionValue(0);
	const buttonY = useMotionValue(0);
	const [dragOrigin, setDragOrigin] = useState<FloatingRovoButtonSnapTarget | null>(null);
	const [dragConstraints, setDragConstraints] = useState<FloatingRovoButtonDragConstraints>({
		bottom: 0,
		left: 0,
		right: 0,
		top: 0,
	});
	const initializedPositionKeyRef = useRef<string | null>(null);
	const skipNextSnapToGridRef = useRef(false);
	// The button only leaves the bottom-right corner once the user has actually
	// dragged it. Until then every re-measure (mount, onboarding expand/collapse,
	// viewport/container resize) re-anchors to the default corner instead of
	// snapping to the nearest grid cell, so it never drifts on its own.
	const hasUserDraggedRef = useRef(false);
	const dragPointerStartRef = useRef<FloatingRovoButtonDragStart | null>(null);
	const suppressDragClickStateRef = useLazyRef<FloatingRovoButtonClickSuppressionState>(() =>
		createInitialClickSuppressionState(),
	);
	const suppressDragClickTimeoutRef = useRef<number | null>(null);
	const logoAnimationPlayedRef = useRef(false);
	const logoAnimationTimeoutRef = useRef<number | null>(null);
	const [logoAnimating, setLogoAnimating] = useState(false);
	const surfaceTransition = shouldReduceMotion
		? { duration: 0 }
		: { type: "spring" as const, bounce: 0, visualDuration: 0.28 };
	const radiusTransition = shouldReduceMotion
		? { duration: 0 }
		: { duration: 0.28, ease: "linear" as const };
	const surfaceStyle: MotionStyle = {
		...(dragOrigin
			? {
					left: dragOrigin.left,
					top: dragOrigin.top,
				}
			: {
					right: resolvedPlacement.right,
					bottom: resolvedPlacement.bottom,
				}),
		x: buttonX,
		y: buttonY,
		boxShadow: onboardingOpen ? token("elevation.shadow.overlay") : undefined,
		transformOrigin: "center",
		willChange: "transform, opacity",
		backfaceVisibility: "hidden",
		touchAction: onboardingOpen ? undefined : "none",
		visibility: dragOrigin ? undefined : "hidden",
	};
	const hoverScale = !onboardingOpen && !shouldReduceMotion ? { scale: 1.1 } : undefined;
	const tapScale = !onboardingOpen && !shouldReduceMotion ? { scale: 0.98 } : undefined;
	const dragSnapTransition = useMemo(() => (
		shouldReduceMotion
			? { duration: 0 }
			: { type: "spring" as const, bounce: 0, stiffness: 540, damping: 42, mass: 0.7 }
	), [shouldReduceMotion]);
	const clearDragClickSuppressionTimeout = useCallback(() => {
		if (suppressDragClickTimeoutRef.current !== null) {
			window.clearTimeout(suppressDragClickTimeoutRef.current);
			suppressDragClickTimeoutRef.current = null;
		}
	}, []);
	const clearLogoAnimationTimeout = useCallback(() => {
		if (logoAnimationTimeoutRef.current !== null) {
			window.clearTimeout(logoAnimationTimeoutRef.current);
			logoAnimationTimeoutRef.current = null;
		}
	}, []);
	const handleLogoPointerEnter = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
		if (event.pointerType !== "mouse" || shouldReduceMotion || logoAnimationPlayedRef.current) {
			return;
		}

		logoAnimationPlayedRef.current = true;
		setLogoAnimating(true);
		clearLogoAnimationTimeout();
		logoAnimationTimeoutRef.current = window.setTimeout(() => {
			logoAnimationTimeoutRef.current = null;
			setLogoAnimating(false);
		}, FLOATING_ROVO_BUTTON_LOGO_CYCLE_MS);
	}, [clearLogoAnimationTimeout, shouldReduceMotion]);
	// Arm suppression when a drag actually moves the button.
	const armDragClickSuppression = useCallback(() => {
		suppressDragClickStateRef.current = armClickSuppression();
	}, []);
	// Safety net armed at drag end: if no trailing click ever arrives (e.g. the
	// drag ends away from the button), the suppression state still clears on its
	// own. It is intentionally NOT re-armed by clicks — see handleSuppressibleClick.
	const scheduleDragClickSuppressionReset = useCallback(() => {
		clearDragClickSuppressionTimeout();

		suppressDragClickTimeoutRef.current = window.setTimeout(() => {
			suppressDragClickStateRef.current = createInitialClickSuppressionState();
			suppressDragClickTimeoutRef.current = null;
		}, FLOATING_ROVO_BUTTON_CLICK_SUPPRESSION_MS);
	}, [clearDragClickSuppressionTimeout]);
	// Run a click through the one-shot suppression state machine. The browser
	// fires exactly one synthetic click at the end of a drag gesture; that single
	// click is swallowed and suppression is immediately cleared so the very next
	// click works normally. Re-arming the timer here would let rapid repeated
	// clicks keep suppression alive forever, which made the dragged button
	// impossible to open.
	const handleSuppressibleClick = useCallback(() => {
		const decision = handleClickWithSuppression(suppressDragClickStateRef.current);
		suppressDragClickStateRef.current = decision.next;

		if (decision.suppress) {
			clearDragClickSuppressionTimeout();
		}

		return decision.suppress;
	}, [clearDragClickSuppressionTimeout]);

	// Re-measures and parks the button at its default home — the bottom-right
	// corner (or the clamped `placement` when a consumer pins one). Clears any
	// live drag offset so the button sits exactly on the origin.
	const anchorToDefaultTarget = useCallback(() => {
		const surface = surfaceRef.current;

		if (!surface) {
			return;
		}

		const { rect, space } = getFloatingRovoButtonLocalMeasurement(surface, positioning);
		const target = placement
			? getClampedFloatingRovoButtonTarget(rect, space.width, space.height)
			: getDefaultFloatingRovoButtonSnapTarget(rect, space.width, space.height);

		buttonX.set(0);
		buttonY.set(0);
		setDragOrigin(target);
		setDragConstraints(getFloatingRovoButtonDragConstraints(target, rect, space.width, space.height));
		setBarSide(resolveFloatingRovoButtonBarSide(configuredBarSide, target.top, rect.height, space.height));
		skipNextSnapToGridRef.current = true;
	}, [buttonX, buttonY, configuredBarSide, placement, positioning]);

	useEffect(() => {
		const positionKey = `${positioning}:${resolvedPlacement.right}:${resolvedPlacement.bottom}`;

		if (initializedPositionKeyRef.current === positionKey) {
			return;
		}

		if (!surfaceRef.current) {
			return;
		}

		anchorToDefaultTarget();
		initializedPositionKeyRef.current = positionKey;
	}, [anchorToDefaultTarget, positioning, resolvedPlacement.bottom, resolvedPlacement.right]);

	useEffect(() => {
		return () => {
			if (suppressDragClickTimeoutRef.current !== null) {
				window.clearTimeout(suppressDragClickTimeoutRef.current);
			}

			if (logoAnimationTimeoutRef.current !== null) {
				window.clearTimeout(logoAnimationTimeoutRef.current);
			}
		};
	}, []);

	useEffect(() => {
		const handleDocumentClick = (event: MouseEvent) => {
			if (handleSuppressibleClick()) {
				event.preventDefault();
				event.stopPropagation();
			}
		};

		document.addEventListener("click", handleDocumentClick, true);

		return () => {
			document.removeEventListener("click", handleDocumentClick, true);
		};
	}, [handleSuppressibleClick]);

	useEffect(() => {
		if (onboardingOpen) {
			dragPointerStartRef.current = null;
			setIsDragging(false);
			suppressDragClickStateRef.current = createInitialClickSuppressionState();
			clearDragClickSuppressionTimeout();
		}
	}, [clearDragClickSuppressionTimeout, onboardingOpen]);

	const snapToNearestGridTarget = useCallback(() => {
		if (!dragOrigin) {
			return;
		}

		const surface = surfaceRef.current;

		if (!surface) {
			return;
		}

		const { rect, space } = getFloatingRovoButtonLocalMeasurement(surface, positioning);
		const target = getNearestFloatingRovoButtonSnapTarget(rect, space.width, space.height);

		setDragConstraints(getFloatingRovoButtonDragConstraints(dragOrigin, rect, space.width, space.height));
		setBarSide(resolveFloatingRovoButtonBarSide(configuredBarSide, target.top, rect.height, space.height));
		buttonX.jump(buttonX.get());
		buttonY.jump(buttonY.get());
		animate(buttonX, target.left - dragOrigin.left, dragSnapTransition);
		animate(buttonY, target.top - dragOrigin.top, dragSnapTransition);
	}, [buttonX, buttonY, configuredBarSide, dragOrigin, dragSnapTransition, positioning]);

	useEffect(() => {
		if (!dragOrigin) {
			return;
		}

		if (skipNextSnapToGridRef.current) {
			skipNextSnapToGridRef.current = false;
			return;
		}

		// Onboarding expand/collapse changes the surface size. Re-fit to the
		// nearest grid cell only if the user has positioned the button; otherwise
		// keep it pinned to the default corner.
		if (hasUserDraggedRef.current) {
			snapToNearestGridTarget();
		} else {
			anchorToDefaultTarget();
		}
	}, [anchorToDefaultTarget, dragOrigin, onboardingOpen, snapToNearestGridTarget]);

	useEffect(() => {
		if (!dragOrigin) {
			return undefined;
		}

		const handleResize = () => {
			// A resize never moves the button off the default corner unless the
			// user has dragged it — then we keep it on the nearest grid cell.
			if (hasUserDraggedRef.current) {
				snapToNearestGridTarget();
			} else {
				anchorToDefaultTarget();
			}
		};

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, [anchorToDefaultTarget, dragOrigin, snapToNearestGridTarget]);

	const handleDragPointerDown = useCallback((event: ReactPointerEvent<HTMLElement>) => {
		if (onboardingOpen || !dragOrigin) {
			return;
		}

		event.currentTarget.setPointerCapture(event.pointerId);
		buttonX.stop();
		buttonY.stop();

		dragPointerStartRef.current = {
			offsetX: buttonX.get(),
			offsetY: buttonY.get(),
			pointerId: event.pointerId,
			x: event.clientX,
			y: event.clientY,
		};
	}, [buttonX, buttonY, dragOrigin, onboardingOpen]);
	const handleDragMouseDown = useCallback((event: ReactMouseEvent<HTMLElement>) => {
		if (event.button !== 0 || onboardingOpen || !dragOrigin || dragPointerStartRef.current) {
			return;
		}

		buttonX.stop();
		buttonY.stop();

		dragPointerStartRef.current = {
			offsetX: buttonX.get(),
			offsetY: buttonY.get(),
			pointerId: null,
			x: event.clientX,
			y: event.clientY,
		};
	}, [buttonX, buttonY, dragOrigin, onboardingOpen]);
	const updateDragPosition = useCallback((clientX: number, clientY: number, pointerId?: number) => {
		const start = dragPointerStartRef.current;

		if (!start || (pointerId !== undefined && start.pointerId !== null && pointerId !== start.pointerId)) {
			return;
		}

		const deltaX = clientX - start.x;
		const deltaY = clientY - start.y;
		const dragDistance = Math.hypot(deltaX, deltaY);

		if (dragDistance <= FLOATING_ROVO_BUTTON_DRAG_CLICK_THRESHOLD) {
			return;
		}

		// The user has intentionally moved the button; from now on resizes and
		// onboarding toggles snap to the nearest grid cell instead of re-homing.
		hasUserDraggedRef.current = true;
		armDragClickSuppression();
		setIsDragging(true);
		buttonX.set(clampFloatingRovoButtonValue(start.offsetX + deltaX, dragConstraints.left, dragConstraints.right));
		buttonY.set(clampFloatingRovoButtonValue(start.offsetY + deltaY, dragConstraints.top, dragConstraints.bottom));
	}, [armDragClickSuppression, buttonX, buttonY, dragConstraints]);
	const endDrag = useCallback((pointerId?: number) => {
		const start = dragPointerStartRef.current;

		if (!start || (pointerId !== undefined && start.pointerId !== null && pointerId !== start.pointerId)) {
			return;
		}

		dragPointerStartRef.current = null;
		setIsDragging(false);

		if (!suppressDragClickStateRef.current.active) {
			return;
		}

		scheduleDragClickSuppressionReset();
		snapToNearestGridTarget();
	}, [scheduleDragClickSuppressionReset, snapToNearestGridTarget]);

	useEffect(() => {
		const handleDocumentPointerMove = (event: PointerEvent) => {
			updateDragPosition(event.clientX, event.clientY, event.pointerId);
		};
		const handleDocumentPointerEnd = (event: PointerEvent) => {
			updateDragPosition(event.clientX, event.clientY, event.pointerId);
			endDrag(event.pointerId);
		};
		const handleDocumentMouseMove = (event: MouseEvent) => {
			updateDragPosition(event.clientX, event.clientY);
		};
		const handleDocumentMouseEnd = (event: MouseEvent) => {
			updateDragPosition(event.clientX, event.clientY);
			endDrag();
		};

		document.addEventListener("pointermove", handleDocumentPointerMove, true);
		document.addEventListener("pointerup", handleDocumentPointerEnd, true);
		document.addEventListener("pointercancel", handleDocumentPointerEnd, true);
		document.addEventListener("mousemove", handleDocumentMouseMove, true);
		document.addEventListener("mouseup", handleDocumentMouseEnd, true);

		return () => {
			document.removeEventListener("pointermove", handleDocumentPointerMove, true);
			document.removeEventListener("pointerup", handleDocumentPointerEnd, true);
			document.removeEventListener("pointercancel", handleDocumentPointerEnd, true);
			document.removeEventListener("mousemove", handleDocumentMouseMove, true);
			document.removeEventListener("mouseup", handleDocumentMouseEnd, true);
		};
	}, [endDrag, updateDragPosition]);
	const handleClickCapture = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
		if (handleSuppressibleClick()) {
			event.preventDefault();
			event.stopPropagation();
		}
	}, [handleSuppressibleClick]);
	const handleButtonClick = useCallback(() => {
		if (handleSuppressibleClick()) {
			return;
		}

		onButtonClick();
	}, [handleSuppressibleClick, onButtonClick]);

	return (
		<motion.div
			ref={surfaceRef}
			key="floating-rovo-button-surface"
			layout
			className={cn(
				"z-[510] bg-bg-neutral-bold",
				positioning === "container" ? "absolute" : "fixed",
				!onboardingOpen ? "cursor-grab active:cursor-grabbing" : null,
				onboardingOpen
					? "w-[295px] max-w-[calc(100vw-32px)] overflow-hidden"
					: "size-12",
			)}
			initial={{ opacity: 0, borderRadius: onboardingOpen ? 8 : 16 }}
			animate={{
				opacity: 1,
				borderRadius: onboardingOpen ? 8 : 16,
			}}
			exit={{ opacity: 0 }}
			transition={{
				default: surfaceTransition,
				borderRadius: radiusTransition,
			}}
			style={surfaceStyle}
			onClickCapture={handleClickCapture}
		>
			{/* Hover/tap scale lives on this inner wrapper, not the surface, so the
			    persistent bar (a sibling below) is not dragged around by the
			    button's hover animation. */}
			<motion.div
				className="h-full w-full"
				style={{ borderRadius: "inherit", transformOrigin: "center", willChange: "transform" }}
				whileHover={hoverScale}
				whileTap={tapScale}
			>
				<AnimatePresence mode="popLayout" initial={false}>
					{onboardingOpen && onboarding ? (
						<FloatingRovoButtonOnboardingPanelInner
							key="panel"
							onboarding={onboarding}
							onOpenChange={onOpenChange}
							shouldReduceMotion={shouldReduceMotion}
						/>
					) : (
						<FloatingRovoButtonInner
							key="button"
							onClick={handleButtonClick}
							onDragMouseDown={handleDragMouseDown}
							onDragPointerDown={handleDragPointerDown}
							onLogoPointerEnter={handleLogoPointerEnter}
							ariaLabel={ariaLabel}
							logoAnimating={logoAnimating}
							shouldReduceMotion={shouldReduceMotion}
						/>
					)}
				</AnimatePresence>
			</motion.div>
			<AnimatePresence>
				{persistentBar && persistentBar.items.length > 0 && dragOrigin && !onboardingOpen && !isDragging ? (
					<FloatingRovoButtonPersistentBarRail
						key="persistent-bar"
						bar={persistentBar}
						side={barSide}
						shouldReduceMotion={shouldReduceMotion}
					/>
				) : null}
			</AnimatePresence>
		</motion.div>
	);
}

export default function FloatingRovoButton({
	product,
	embedded = false,
	forceVisible = false,
	ariaLabel,
	placement,
	positioning = "viewport",
	onButtonClick,
	suggestion,
	onboarding,
	persistentBar,
}: Readonly<FloatingRovoButtonProps>) {
	const { isOpen, openChat } = useRovoChat();
	const shouldReduceMotion = Boolean(useReducedMotion());
	const [internalOnboardingOpen, setInternalOnboardingOpen] = useState(onboarding?.defaultOpen ?? false);
	const shouldShowButton = forceVisible || !isOpen;
	const onboardingDefaultOpen = onboarding?.defaultOpen ?? false;
	const onboardingId = onboarding?.id;
	const onboardingOpen = Boolean(onboarding && (onboarding.open ?? internalOnboardingOpen));
	const shouldOpenOnboardingFromButton = Boolean(onboarding && (onboarding.openOnButtonClick ?? true));
	const resolvedAriaLabel = ariaLabel ?? (shouldOpenOnboardingFromButton ? "Open onboarding" : "Open Rovo");
	const shouldSuppressSurface = embedded || product === "rovo" || product === "studio";
	const shouldRenderSurface = (shouldShowButton || onboardingOpen) && (forceVisible || !shouldSuppressSurface);

	useEffect(() => {
		if (onboardingId) {
			setInternalOnboardingOpen(onboardingDefaultOpen);
		}
	}, [onboardingDefaultOpen, onboardingId]);

	const setOnboardingOpen = useCallback((open: boolean) => {
		if (onboarding?.open === undefined) {
			setInternalOnboardingOpen(open);
		}
		onboarding?.onOpenChange?.(open);
	}, [onboarding]);

	if (!forceVisible && (embedded || product === "rovo" || product === "studio")) {
		return null;
	}

	const handleButtonClick = () => {
		if (onButtonClick) {
			onButtonClick();
			return;
		}

		if (shouldOpenOnboardingFromButton) {
			setOnboardingOpen(true);
			return;
		}

		openChat("floating");
	};

	return (
		<>
			<AnimatePresence>
				{suggestion && shouldShowButton && !onboardingOpen ? (
					<FloatingRovoButtonNudge
						key={suggestion.id}
						placement={placement}
						positioning={positioning}
						suggestion={suggestion}
					/>
				) : null}
			</AnimatePresence>
			<AnimatePresence>
				{shouldRenderSurface ? (
					<FloatingRovoButtonSurface
						key="surface"
						onboardingOpen={onboardingOpen}
						onboarding={onboarding}
						onOpenChange={setOnboardingOpen}
						placement={placement}
						positioning={positioning}
						ariaLabel={resolvedAriaLabel}
						onButtonClick={handleButtonClick}
						persistentBar={persistentBar}
						shouldReduceMotion={shouldReduceMotion}
					/>
				) : null}
			</AnimatePresence>
		</>
	);
}
