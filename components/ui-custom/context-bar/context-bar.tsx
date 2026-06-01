"use client";

import CrossIcon from "@atlaskit/icon/core/cross";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useId, useLayoutEffect, useRef, useState } from "react";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";
import { computeContextBarOverflow } from "./overflow";

const DISMISS_BUTTON_CLASS =
	"flex size-6 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-icon-subtle transition-colors duration-normal ease-out hover:bg-bg-neutral-hovered hover:text-icon active:bg-bg-neutral-pressed focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none";

const LEAD_ICON_CLASS = "flex size-4 shrink-0 items-center justify-center text-icon-subtle";

interface ContextBarProps extends React.ComponentProps<"div"> {
	onDismiss?: () => void;
	dismissLabel?: string;
}

interface ContextBarLeadProps {
	icon?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}

interface ContextBarTagProps {
	children: React.ReactNode;
	color?: React.ComponentProps<typeof Tag>["color"];
	elemBefore?: React.ReactNode;
	title?: string;
	className?: string;
}

interface ContextBarTriggerProps extends React.ComponentProps<"button"> {
	icon?: React.ReactNode;
}

interface CollapsibleContextBarProps {
	children: React.ReactNode;
	defaultOpen?: boolean;
	lead?: React.ReactNode;
	leadLabel: string;
	dismissLabel?: string;
	collapsedIcon?: React.ReactNode;
	collapsedLabel: string;
	triggerAriaLabel?: string;
}

/**
 * The expanded contextual bar that sits above a composer input. Content (lead +
 * tag) is passed as children; the dismiss affordance is rendered on the right.
 * When `onDismiss` is omitted a non-interactive placeholder keeps the layout
 * stable, matching the original chat context bar behavior.
 */
export function ContextBar({
	onDismiss,
	dismissLabel = "Close",
	className,
	children,
	...props
}: Readonly<ContextBarProps>): React.ReactElement {
	return (
		<div
			className={cn(
				"mb-3 flex min-w-0 items-center justify-between gap-3 rounded-xl bg-bg-neutral px-3 py-2",
				className,
			)}
			data-context-bar
			{...props}
		>
			<div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">{children}</div>
			{onDismiss ? (
				<button
					aria-label={dismissLabel}
					className={DISMISS_BUTTON_CLASS}
					onClick={onDismiss}
					type="button"
				>
					<CrossIcon color="currentColor" label="" size="small" />
				</button>
			) : (
				<span aria-hidden className={DISMISS_BUTTON_CLASS}>
					<CrossIcon color="currentColor" label="" size="small" />
				</span>
			)}
		</div>
	);
}

/** Lead icon + label (e.g. "Edit:" / "Context:") rendered inside `ContextBar`. */
export function ContextBarLead({
	icon,
	children,
	className,
}: Readonly<ContextBarLeadProps>): React.ReactElement {
	return (
		<>
			<span className={LEAD_ICON_CLASS}>{icon}</span>
			<span className={cn("shrink-0 text-sm font-medium text-text-subtle", className)}>
				{children}
			</span>
		</>
	);
}

/** The truncating chip that names the active context (artifact, agent, etc). */
export function ContextBarTag({
	children,
	color = "blue",
	elemBefore,
	title,
	className,
}: Readonly<ContextBarTagProps>): React.ReactElement {
	return (
		<Tag
			className={cn("min-w-0 max-w-full shrink overflow-hidden", className)}
			color={color}
			elemBefore={elemBefore}
			maxWidth="100%"
			title={title}
		>
			{children}
		</Tag>
	);
}

/**
 * The collapsed pill that replaces the bar once dismissed, giving the user an
 * easy way back into the context (e.g. "Edit agent").
 */
export function ContextBarTrigger({
	icon,
	children,
	className,
	type = "button",
	...props
}: Readonly<ContextBarTriggerProps>): React.ReactElement {
	return (
		<button
			className={cn(
				"mb-3 flex w-fit items-center gap-1.5 rounded-xl bg-bg-neutral px-3 py-2 text-sm font-medium text-text-subtle transition-colors duration-normal ease-out hover:bg-bg-neutral-hovered hover:text-text active:bg-bg-neutral-pressed focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none",
				className,
			)}
			data-context-bar-trigger
			type={type}
			{...props}
		>
			<span className={cn(LEAD_ICON_CLASS, "h-6")}>{icon}</span>
			{children}
		</button>
	);
}

/**
 * Self-contained collapsible context bar: starts expanded, collapses to a pill
 * trigger on dismiss, and re-expands when the trigger is pressed. Owns its open
 * state so consumers (and their tests) stay stateless. Remount with a `key` to
 * reset the open state when the underlying context identity changes.
 */
export function CollapsibleContextBar({
	children,
	defaultOpen = true,
	lead,
	leadLabel,
	dismissLabel,
	collapsedIcon,
	collapsedLabel,
	triggerAriaLabel,
}: Readonly<CollapsibleContextBarProps>): React.ReactElement {
	const [open, setOpen] = useState(defaultOpen);

	return open ? (
		<ContextBar dismissLabel={dismissLabel} onDismiss={() => setOpen(false)}>
			<ContextBarLead icon={lead}>{leadLabel}</ContextBarLead>
			{children}
		</ContextBar>
	) : (
		<ContextBarTrigger
			aria-label={triggerAriaLabel}
			icon={collapsedIcon}
			onClick={() => setOpen(true)}
		>
			{collapsedLabel}
		</ContextBarTrigger>
	);
}

/**
 * Subtle productivity-grade spring shared by the animated context bar. Low
 * bounce keeps the morph calm; `visualDuration` makes the perceived speed
 * consistent regardless of the size delta. Used for the container `layout`
 * animation so collapse/expand stays interruptible.
 */
const CONTEXT_BAR_SPRING = {
	type: "spring",
	bounce: 0.2,
	visualDuration: 0.3,
} as const;

/**
 * Animated sibling of `CollapsibleContextBar`. Instead of hard-swapping between
 * the pill trigger and the expanded bar, the shared container morphs its size
 * via a Motion `layout` spring while the inner content cross-fades through
 * `AnimatePresence` (`mode="popLayout"` so the exiting state never disturbs the
 * incoming layout). `MotionConfig reducedMotion="user"` disables the transform
 * and layout animation for visitors who prefer reduced motion.
 */
export function AnimatedCollapsibleContextBar({
	children,
	defaultOpen = true,
	lead,
	leadLabel,
	dismissLabel = "Close",
	collapsedIcon,
	collapsedLabel,
	triggerAriaLabel,
}: Readonly<CollapsibleContextBarProps>): React.ReactElement {
	const [open, setOpen] = useState(defaultOpen);

	return (
		<MotionConfig reducedMotion="user">
			<motion.div
				className={cn(
					"mb-3 flex min-w-0 items-center overflow-hidden rounded-xl bg-bg-neutral",
					open
						? "w-full justify-between"
						: "w-fit cursor-pointer hover:bg-bg-neutral-hovered active:bg-bg-neutral-pressed",
				)}
				data-context-bar={open ? "" : undefined}
				data-context-bar-trigger={open ? undefined : ""}
				layout
				transition={CONTEXT_BAR_SPRING}
			>
				<AnimatePresence initial={false} mode="popLayout">
					{open ? (
						<motion.div
							animate={{ opacity: 1 }}
							className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-2"
							exit={{ opacity: 0 }}
							initial={{ opacity: 0 }}
							key="expanded"
							transition={{ duration: 0.15 }}
						>
							<div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
								<ContextBarLead icon={lead}>{leadLabel}</ContextBarLead>
								{children}
							</div>
							<button
								aria-label={dismissLabel}
								className={DISMISS_BUTTON_CLASS}
								onClick={() => setOpen(false)}
								type="button"
							>
								<CrossIcon color="currentColor" label="" size="small" />
							</button>
						</motion.div>
					) : (
						<motion.button
							animate={{ opacity: 1 }}
							aria-label={triggerAriaLabel}
							className="flex w-fit items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-subtle transition-colors duration-normal ease-out hover:text-text focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:ring-inset focus-visible:outline-none"
							exit={{ opacity: 0 }}
							initial={{ opacity: 0 }}
							key="collapsed"
							onClick={() => setOpen(true)}
							transition={{ duration: 0.15 }}
							type="button"
						>
							<span className={cn(LEAD_ICON_CLASS, "h-6")}>{collapsedIcon}</span>
							{collapsedLabel}
						</motion.button>
					)}
				</AnimatePresence>
			</motion.div>
		</MotionConfig>
	);
}

const PILL_CLASS =
	"flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border-bold bg-transparent px-3 text-sm font-medium text-text-subtle transition-colors duration-normal ease-out hover:bg-bg-neutral-subtle-hovered hover:text-text active:bg-bg-neutral-subtle-pressed focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-(--opacity-disabled)";

const OVERFLOW_BUTTON_CLASS =
	"flex size-8 shrink-0 items-center justify-center rounded-full border border-border-bold bg-transparent text-icon-subtle transition-colors duration-normal ease-out hover:bg-bg-neutral-subtle-hovered hover:text-icon active:bg-bg-neutral-subtle-pressed focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none";

interface ContextBarPillProps extends React.ComponentProps<"button"> {
	icon?: React.ReactNode;
}

/**
 * Outlined, rounded-full action pill used inside `ContextBarTagGroup` (e.g.
 * "Review +6 -3", "Move to Local"). A thin wrapper around a button so the group
 * can measure and overflow arbitrary pill content.
 */
export function ContextBarPill({
	icon,
	children,
	className,
	type = "button",
	...props
}: Readonly<ContextBarPillProps>): React.ReactElement {
	return (
		<button className={cn(PILL_CLASS, className)} data-context-bar-pill type={type} {...props}>
			{icon ? (
				<span className="flex size-4 shrink-0 items-center justify-center text-icon-subtle">
					{icon}
				</span>
			) : null}
			{children}
		</button>
	);
}

interface ContextBarTagGroupItem {
	id: string;
	content: React.ReactNode;
}

interface ContextBarTagGroupProps {
	items: ReadonlyArray<ContextBarTagGroupItem>;
	className?: string;
	gap?: number;
	overflowAriaLabel?: string;
}

/**
 * Width-aware row of context pills. Renders as many leading pills as fit, then
 * collapses the remainder behind a trailing circular "…" overflow button that
 * reveals the hidden pills in a popover. Widths are measured from an invisible
 * sibling layer so the visible row can be sized synchronously (via
 * `useLayoutEffect`) without a flash of overflowing content; a `ResizeObserver`
 * keeps it in sync as the container resizes.
 */
export function ContextBarTagGroup({
	items,
	className,
	gap = 8,
	overflowAriaLabel = "Show more context",
}: Readonly<ContextBarTagGroupProps>): React.ReactElement {
	const containerRef = useRef<HTMLDivElement>(null);
	const measureRef = useRef<HTMLDivElement>(null);
	const overflowMeasureRef = useRef<HTMLButtonElement>(null);
	const [visibleCount, setVisibleCount] = useState(items.length);
	const reactId = useId();

	useLayoutEffect(() => {
		const container = containerRef.current;
		const measure = measureRef.current;
		if (!container || !measure) {
			return;
		}

		function recompute(): void {
			const pillNodes = measure!.children;
			const widths: number[] = [];
			for (let i = 0; i < pillNodes.length; i++) {
				widths.push((pillNodes[i] as HTMLElement).offsetWidth);
			}
			const overflowWidth = overflowMeasureRef.current?.offsetWidth ?? 0;
			setVisibleCount(
				computeContextBarOverflow(widths, container!.clientWidth, overflowWidth, gap),
			);
		}

		recompute();
		const observer = new ResizeObserver(recompute);
		observer.observe(container);
		return () => observer.disconnect();
	}, [items, gap]);

	const visibleItems = items.slice(0, visibleCount);
	const hiddenItems = items.slice(visibleCount);

	return (
		<div
			className={cn("relative flex min-w-0 items-center", className)}
			data-context-bar-tag-group
			ref={containerRef}
			style={{ gap }}
		>
			{/* Invisible measurement layer: holds every pill at its natural width plus a
			    representative overflow button so widths are known before layout. */}
			<div
				aria-hidden
				className="pointer-events-none invisible absolute top-0 left-0 flex items-center"
				ref={measureRef}
				style={{ gap }}
			>
				{items.map((item) => (
					<div className="shrink-0" key={`${reactId}-measure-${item.id}`}>
						{item.content}
					</div>
				))}
			</div>
			<button
				aria-hidden
				className={cn(OVERFLOW_BUTTON_CLASS, "pointer-events-none invisible absolute top-0 left-0")}
				ref={overflowMeasureRef}
				tabIndex={-1}
				type="button"
			>
				<ShowMoreHorizontalIcon color="currentColor" label="" size="small" />
			</button>

			{visibleItems.map((item) => (
				<div className="flex shrink-0" key={item.id}>
					{item.content}
				</div>
			))}
			{hiddenItems.length > 0 ? (
				<Popover>
					<PopoverTrigger aria-label={overflowAriaLabel} className={OVERFLOW_BUTTON_CLASS}>
						<ShowMoreHorizontalIcon color="currentColor" label="" size="small" />
					</PopoverTrigger>
					<PopoverContent align="end" className="w-auto min-w-40 items-start gap-2">
						{hiddenItems.map((item) => (
							<div className="flex" key={item.id}>
								{item.content}
							</div>
						))}
					</PopoverContent>
				</Popover>
			) : null}
		</div>
	);
}
