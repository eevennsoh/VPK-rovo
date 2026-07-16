"use client";

import CrossIcon from "@atlaskit/icon/core/cross";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import { AnimatePresence, MotionConfig, motion, useReducedMotion, type Variants } from "motion/react";
import { isValidElement, useId, useLayoutEffect, useRef, useState } from "react";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";
import { computeContextBarOverflow } from "./overflow";

const DISMISS_BUTTON_CLASS =
	"flex size-6 shrink-0 items-center justify-center rounded-full border-0 bg-transparent text-icon-subtle transition-colors duration-normal ease-out hover:bg-bg-neutral-hovered hover:text-icon active:bg-bg-neutral-pressed focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none";

const LEAD_ICON_CLASS = "flex size-4 shrink-0 items-center justify-center text-icon-subtle";

/**
 * Shared visual recipe for the filled neutral context-bar pill: `ContextBarTrigger`,
 * `ContextBarPill`, and the trailing overflow button all build on this so they stay
 * in sync. `leading-6` matches the text line box to the 24px `h-6` icon span, so
 * pills with and without a leading icon keep an identical 40px height in a row.
 * Layout-only concerns (`mb-3`, `shrink-0`, `disabled:*`) are composed per call site.
 */
const CONTEXT_BAR_PILL_CLASS =
	"flex w-fit items-center gap-1.5 rounded-xl bg-bg-neutral px-3 py-2 text-sm font-medium leading-6 text-text-subtle transition-colors duration-normal ease-out hover:bg-bg-neutral-hovered hover:text-text active:bg-bg-neutral-pressed focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none";

interface ContextBarProps extends React.ComponentProps<"div"> {
	onDismiss?: () => void;
	dismissLabel?: string;
	showDismissPlaceholder?: boolean;
}

interface ContextBarLeadProps {
	icon?: React.ReactNode;
	children: React.ReactNode;
	className?: string;
}

interface ContextBarTagProps extends Pick<
	React.ComponentProps<typeof Tag>,
	"color" | "onRemove" | "removeButtonLabel" | "removeVariant" | "type"
> {
	children: React.ReactNode;
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
	onOpenChange?: (open: boolean) => void;
}

/**
 * The expanded contextual bar that sits above a composer input. Content (lead +
 * tag) is passed as children; the dismiss affordance is rendered on the right.
 * When `onDismiss` is omitted, a non-interactive placeholder keeps the layout
 * stable by default. Set `showDismissPlaceholder` to false when the context has
 * no dismiss affordance at all.
 */
export function ContextBar({
	onDismiss,
	dismissLabel = "Close",
	showDismissPlaceholder = true,
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
			) : showDismissPlaceholder ? (
				<span aria-hidden className={DISMISS_BUTTON_CLASS}>
					<CrossIcon color="currentColor" label="" size="small" />
				</span>
			) : null}
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
	color = "standard",
	elemBefore,
	onRemove,
	removeButtonLabel,
	removeVariant,
	type,
	title,
	className,
}: Readonly<ContextBarTagProps>): React.ReactElement {
	const elemBeforeElement = isValidElement(elemBefore) ? elemBefore : null;
	const usesAvatarSlot = type !== undefined && type !== "default";
	const resolvedElemBefore = elemBeforeElement && !usesAvatarSlot && elemBeforeElement.type !== IconTile
		? (
			<IconTile
				aria-hidden
				as="span"
				icon={elemBeforeElement.type === Icon
					? elemBeforeElement
					: <Icon aria-hidden render={elemBeforeElement} />}
				label=""
				size="xxsmall"
				variant="transparent"
			/>
		)
		: elemBefore;

	return (
		<Tag
			className={cn("min-w-0 max-w-full shrink overflow-hidden", className)}
			color={color}
			elemBefore={resolvedElemBefore}
			maxWidth="100%"
			onRemove={onRemove}
			removeButtonLabel={removeButtonLabel}
			removeVariant={removeVariant}
			title={title}
			type={type}
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
			className={cn("mb-3", CONTEXT_BAR_PILL_CLASS, className)}
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
	onOpenChange,
}: Readonly<CollapsibleContextBarProps>): React.ReactElement {
	const [open, setOpen] = useState(defaultOpen);
	const updateOpen = (next: boolean) => {
		setOpen(next);
		onOpenChange?.(next);
	};

	return open ? (
		<ContextBar dismissLabel={dismissLabel} onDismiss={() => updateOpen(false)}>
			<ContextBarLead icon={lead}>{leadLabel}</ContextBarLead>
			{children}
		</ContextBar>
	) : (
		<ContextBarTrigger
			aria-label={triggerAriaLabel}
			icon={collapsedIcon}
			onClick={() => updateOpen(true)}
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
 * `rounded-xl` resolves to `--ds-radius-xlarge` (12px). The morphing container
 * sets this radius through the `style` prop as a raw number so Motion's layout
 * projection can read and inverse-correct it every frame — a Tailwind class or a
 * `var()` string is opaque to that correction and the corners distort while the
 * box resizes.
 */
const CONTEXT_BAR_RADIUS = 12;

/**
 * Content cross-fade timing. `filter` blur is non-numeric so it can't run on
 * spring physics; a short duration-based tween keeps the blur-in/out snappy and
 * predictable for a productivity surface, composed with the AnimatePresence
 * opacity cross-fade.
 */
const CONTENT_TRANSITION = {
	duration: 0.18,
	ease: "easeOut",
} as const;

/**
 * Blur-in / blur-out applied to the swapping content: it blurs out as it leaves
 * and blurs in as it enters. Paired with `layout="position"` on the content so
 * the parent's size morph never scales (stretches) the text.
 */
const CONTENT_VARIANTS: Variants = {
	initial: { opacity: 0, filter: "blur(4px)" },
	animate: { opacity: 1, filter: "blur(0px)" },
	exit: { opacity: 0, filter: "blur(4px)" },
};

/**
 * Reduced-motion fallback: drop the blur filter (and rely on AnimatePresence's
 * plain opacity cross-fade) so visitors who prefer reduced motion never see the
 * blur transition. `MotionConfig reducedMotion="user"` already neutralises the
 * layout/transform morph, but filter animations are not transform-based and must
 * be opted out explicitly.
 */
const CONTENT_VARIANTS_REDUCED: Variants = {
	initial: { opacity: 0 },
	animate: { opacity: 1 },
	exit: { opacity: 0 },
};

/**
 * Animated sibling of `CollapsibleContextBar`. Instead of hard-swapping between
 * the pill trigger and the expanded bar, the shared container morphs its size
 * via a Motion `layout` spring while the inner content cross-fades through
 * `AnimatePresence` (`mode="popLayout"` so the exiting state never disturbs the
 * incoming layout).
 *
 * Two distortions intrinsic to layout-driven size morphs are corrected:
 * - Corner radius: the container sets `borderRadius` via the `style` prop as a
 *   raw number so Motion's layout projection inverse-corrects it (a Tailwind
 *   class is opaque to that correction and the corners warp while resizing).
 * - Text/content stretch: the swapping content uses `layout="position"`, so it
 *   translates into place and is inverse-scaled rather than stretched by the
 *   parent's size animation.
 *
 * Content also blurs out as it leaves and blurs in as it enters. `MotionConfig
 * reducedMotion="user"` disables the transform/layout morph for visitors who
 * prefer reduced motion, and the blur variants are dropped via
 * `useReducedMotion` (filter is not transform-based, so it isn't covered by
 * `MotionConfig` alone).
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
	onOpenChange,
}: Readonly<CollapsibleContextBarProps>): React.ReactElement {
	const [open, setOpen] = useState(defaultOpen);
	const updateOpen = (next: boolean) => {
		setOpen(next);
		onOpenChange?.(next);
	};
	const shouldReduceMotion = useReducedMotion();
	const contentVariants = shouldReduceMotion ? CONTENT_VARIANTS_REDUCED : CONTENT_VARIANTS;

	return (
		<MotionConfig reducedMotion="user">
			<motion.div
				className={cn(
					// Hover + color transition live on the single persistent container
					// (not just the collapsed branch) so the hovered background survives
					// the open/collapse morph while the pointer stays over the bar, then
					// eases back to the resting `bg-bg-neutral` on mouseleave instead of
					// flashing. Pressed/cursor affordances stay collapsed-only since the
					// container itself is only clickable in the pill state.
					"mb-3 flex min-w-0 items-center overflow-hidden bg-bg-neutral transition-colors duration-normal ease-out hover:bg-bg-neutral-hovered",
					open
						? "w-full justify-between"
						: "w-fit cursor-pointer active:bg-bg-neutral-pressed",
				)}
				data-context-bar={open ? "" : undefined}
				data-context-bar-trigger={open ? undefined : ""}
				layout
				style={{ borderRadius: CONTEXT_BAR_RADIUS }}
				transition={CONTEXT_BAR_SPRING}
			>
				<AnimatePresence initial={false} mode="popLayout">
					{open ? (
						<motion.div
							animate="animate"
							className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 py-2"
							exit="exit"
							initial="initial"
							key="expanded"
							layout="position"
							transition={CONTENT_TRANSITION}
							variants={contentVariants}
						>
							<div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
								<ContextBarLead icon={lead}>{leadLabel}</ContextBarLead>
								{children}
							</div>
							<button
								aria-label={dismissLabel}
								className={DISMISS_BUTTON_CLASS}
								onClick={() => updateOpen(false)}
								type="button"
							>
								<CrossIcon color="currentColor" label="" size="small" />
							</button>
						</motion.div>
					) : (
						<motion.button
							animate="animate"
							aria-label={triggerAriaLabel}
							className="flex w-fit items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-subtle transition-colors duration-normal ease-out hover:text-text focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:ring-inset focus-visible:outline-none"
							exit="exit"
							initial="initial"
							key="collapsed"
							layout="position"
							onClick={() => updateOpen(true)}
							transition={CONTENT_TRANSITION}
							type="button"
							variants={contentVariants}
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

const PILL_CLASS = cn(
	CONTEXT_BAR_PILL_CLASS,
	"shrink-0 disabled:pointer-events-none disabled:opacity-(--opacity-disabled)",
);

/**
 * Trailing "…" overflow button: same filled neutral pill family, sized to a
 * 40×40 square (`size-10`, matching the 40px pill height) with the ellipsis icon
 * centered, and switched to icon-subtle coloring while keeping the shared radius,
 * transition, and focus ring. The invisible measurement copy reuses this exact
 * class so `computeContextBarOverflow` reserves the correct square width.
 */
const OVERFLOW_BUTTON_CLASS =
	"flex size-10 shrink-0 items-center justify-center rounded-xl bg-bg-neutral text-icon-subtle transition-colors duration-normal ease-out hover:bg-bg-neutral-hovered hover:text-icon active:bg-bg-neutral-pressed focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 focus-visible:outline-none";

type ContextBarPillProps = {
	icon?: React.ReactNode;
} & (
	| ({ interactive?: true } & React.ComponentProps<"button">)
	| ({ interactive: false } & React.ComponentProps<"div">)
);

/**
 * Filled neutral action pill used inside `ContextBarTagGroup` (e.g. "Review +6
 * -3", "Move to Local"). Shares the `ContextBarTrigger` aesthetic via
 * `CONTEXT_BAR_PILL_CLASS`. It defaults to a button, while `interactive={false}`
 * provides a neutral surface for compound pills whose inner control owns the
 * hit area. Both forms remain measurable by the overflow group.
 */
export function ContextBarPill({
	icon,
	children,
	className,
	interactive = true,
	...props
}: Readonly<ContextBarPillProps>): React.ReactElement {
	if (!interactive) {
		return (
			<div
				className={cn(
					PILL_CLASS,
					"cursor-default hover:bg-bg-neutral hover:text-text-subtle active:bg-bg-neutral",
					className,
				)}
				data-context-bar-pill
				{...props as React.ComponentProps<"div">}
			>
				{icon ? <span className={cn(LEAD_ICON_CLASS, "h-6")}>{icon}</span> : null}
				{children}
			</div>
		);
	}

	return (
		<button
			className={cn(PILL_CLASS, className)}
			data-context-bar-pill
			type="button"
			{...props as React.ComponentProps<"button">}
		>
			{icon ? <span className={cn(LEAD_ICON_CLASS, "h-6")}>{icon}</span> : null}
			{children}
		</button>
	);
}

interface ContextBarTagGroupItem {
	id: string;
	/** The visible pill rendered in the row (and measured for overflow). */
	content: React.ReactNode;
	/**
	 * Menu-friendly representation shown inside the overflow dropdown when this
	 * item is hidden. A plain string/node label — never a nested pill button — so
	 * the overflow affordance renders as a proper `DropdownMenuItem`.
	 */
	label: React.ReactNode;
	/** Optional leading icon for the dropdown menu item. */
	icon?: React.ReactNode;
	/** Invoked when the dropdown menu item is selected. */
	onSelect?: () => void;
}

interface ContextBarTagGroupProps {
	items: ReadonlyArray<ContextBarTagGroupItem>;
	className?: string;
	gap?: number;
	overflowAriaLabel?: string;
}

/**
 * Width-aware row of context pills. Renders as many leading pills as fit, then
 * collapses the remainder behind a trailing filled "…" overflow button that
 * reveals the hidden items in a dropdown menu (one menu item per hidden item).
 * Widths are measured from an invisible
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
			    representative overflow button so widths are known before layout. The
			    off-layout ruler is wrapped in a zero-size, clipped container so its
			    natural-width contents can never expand the group's scroll box (which
			    would otherwise spill a stray horizontal scrollbar). `offsetWidth` is
			    unaffected by ancestor clipping, so measurements stay correct. */}
			<div
				aria-hidden
				className="pointer-events-none absolute top-0 left-0 h-0 w-0 overflow-clip"
			>
				<div className="invisible flex items-center" ref={measureRef} style={{ gap }}>
					{items.map((item) => (
						<div className="shrink-0" key={`${reactId}-measure-${item.id}`}>
							{item.content}
						</div>
					))}
				</div>
				<button
					aria-hidden
					className={cn(OVERFLOW_BUTTON_CLASS, "invisible absolute top-0 left-0")}
					ref={overflowMeasureRef}
					tabIndex={-1}
					type="button"
				>
					<span className={cn(LEAD_ICON_CLASS, "h-6")}>
						<ShowMoreHorizontalIcon color="currentColor" label="" size="small" />
					</span>
				</button>
			</div>

			{visibleItems.map((item) => (
				<div className="flex shrink-0" key={item.id}>
					{item.content}
				</div>
			))}
			{hiddenItems.length > 0 ? (
				<DropdownMenu>
					<DropdownMenuTrigger aria-label={overflowAriaLabel} className={OVERFLOW_BUTTON_CLASS}>
						<span className={cn(LEAD_ICON_CLASS, "h-6")}>
							<ShowMoreHorizontalIcon color="currentColor" label="" size="small" />
						</span>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuGroup>
							{hiddenItems.map((item) => (
								<DropdownMenuItem
									elemBefore={item.icon}
									key={item.id}
									onSelect={item.onSelect}
								>
									{item.label}
								</DropdownMenuItem>
							))}
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			) : null}
		</div>
	);
}
