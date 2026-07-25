"use client";

// oxlint-disable react-doctor/no-multi-comp -- This module intentionally colocates coupled component parts as a compound component or demo surface API.

import * as React from "react";
import CrossIcon from "@atlaskit/icon/core/cross";

import {
	getSkillCollectionMetadata,
	type SkillCollectionId,
} from "@/app/data/directory/skill-collections";
import type { TagOverlayAction } from "@/components/ui/tag";
import { withTooltip } from "@/components/ui/tooltip-utils";
import { cn } from "@/lib/utils";

type SkillTagColor = SkillCollectionId | "2p3p";

function normalizeSkillTagColor(color: SkillTagColor): SkillCollectionId {
	return color === "2p3p" ? "marketplace" : color;
}

/**
 * Skill tags display the skill's canonical handle — lowercase, kebab-cased — to
 * match how skills are named (e.g. `create-skill`, `design-landing-page`). Plain
 * string children are normalized to that form; non-string children pass through.
 */
function toKebabSkillLabel(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/gu, "-")
		.replace(/^-+|-+$/gu, "");
}

interface SkillTagProps extends Omit<React.ComponentProps<"span">, "color"> {
	icon?: React.ReactNode;
	color?: SkillTagColor;
	focused?: boolean;
	focusable?: boolean;
	onRemove?: () => void;
	removeVariant?: "inline" | "overlay";
	removeButtonLabel?: string;
	/**
	 * A non-remove control occupying the same hover-reveal overlay slot as the
	 * remove "×" (mutually exclusive with `onRemove` overlay). Use for actions
	 * that aren't a removal — e.g. a swap icon that reverts an auto-tagged token
	 * back to text. Kept distinct from `onRemove` so "remove" selectors never
	 * match this action.
	 */
	overlayAction?: TagOverlayAction;
}

function SkillTag({
	children,
	icon,
	color = "default",
	focused = false,
	focusable = false,
	onClick,
	onRemove,
	removeVariant = "inline",
	removeButtonLabel = "Remove",
	overlayAction,
	className,
	tabIndex,
	...props
}: Readonly<SkillTagProps>) {
	const isInteractive = Boolean(onClick);
	const isOverlayRemove = Boolean(onRemove) && removeVariant === "overlay";
	const collection = getSkillCollectionMetadata(normalizeSkillTagColor(color));
	// Resolve the single hover-reveal overlay control: a custom action takes
	// precedence over the remove "×". `isOverlay` drives the floating reveal +
	// label-fade scrim; a plain inline remove stays laid out after the label.
	const overlayControl: {
		icon: React.ReactElement;
		label: string;
		tooltip?: string;
		slot: string;
		isOverlay: boolean;
		onClick: () => void;
	} | null = overlayAction
		? {
			icon: overlayAction.icon,
			label: overlayAction.label,
			tooltip: overlayAction.tooltip,
			slot: "skill-tag-overlay-action",
			isOverlay: true,
			onClick: overlayAction.onClick,
		}
		: onRemove
			? {
				icon: <CrossIcon label="" size="small" />,
				label: removeButtonLabel,
				slot: "skill-tag-remove",
				isOverlay: isOverlayRemove,
				onClick: onRemove,
			}
			: null;
	const hasOverlayReveal = Boolean(overlayControl?.isOverlay);
	const shouldShowOverlayScrim = hasOverlayReveal;

	return (
		<span
			{...props}
			onClick={onClick}
			tabIndex={focusable ? (tabIndex ?? 0) : tabIndex}
			className={cn(
				"group/skill-tag relative inline-flex h-5 -skew-x-12 items-center gap-1 rounded-sm border border-transparent bg-bg-neutral bg-clip-padding py-1 pl-2.5 align-middle text-xs leading-4 font-normal text-text outline-none transition-[background-color,border-color,box-shadow,color]",
				onRemove && !isOverlayRemove ? "pr-1" : "pr-1.5",
				"focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
				focused && "border-ring ring-3 ring-ring/50",
				isInteractive ? "cursor-pointer hover:bg-bg-neutral-hovered active:bg-bg-neutral-pressed" : "cursor-default",
				className,
			)}
			data-focused={focused ? "true" : undefined}
			data-slot="skill-tag"
		>
			{/* Colored slash bar */}
			<span className={cn("absolute top-0 bottom-0 left-0 z-[1] w-0.5 rounded-l-sm", collection.slashClassName)} />

			{/* Icon */}
			{icon ? (
				<span className={cn("relative z-[1] flex size-3 shrink-0 skew-x-12 items-center justify-center [&>span]:size-3! [&_svg]:size-3!", collection.iconClassName)} data-slot="skill-tag-icon">
					{icon}
				</span>
			) : null}

			{/* Label */}
			<span
				className={cn(
					"relative z-[1] min-w-0 skew-x-12 truncate whitespace-nowrap",
					shouldShowOverlayScrim && "group-hover/skill-tag:[mask-image:linear-gradient(to_right,#000_calc(100%-3rem),transparent)] group-focus-within/skill-tag:[mask-image:linear-gradient(to_right,#000_calc(100%-3rem),transparent)] group-hover/skill-tag:[-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-3rem),transparent)] group-focus-within/skill-tag:[-webkit-mask-image:linear-gradient(to_right,#000_calc(100%-3rem),transparent)]"
				)}
				data-slot="skill-tag-label"
			>
				{typeof children === "string" ? toKebabSkillLabel(children) : children}
			</span>

			{shouldShowOverlayScrim ? (
				<span
					aria-hidden
					className="pointer-events-none absolute inset-y-0 end-0 z-[2] w-12 rounded-r-sm bg-linear-to-l from-bg-neutral from-55% to-transparent opacity-0 transition-opacity duration-fast ease-out group-hover/skill-tag:opacity-100 group-focus-within/skill-tag:opacity-100"
					data-slot="skill-tag-overlay-scrim"
				/>
			) : null}

			{overlayControl ? (
				withTooltip(
					<button
						type="button"
						aria-label={overlayControl.label}
						onClick={(event) => {
							event.stopPropagation();
							overlayControl.onClick();
						}}
						className={cn(
							"inline-flex size-3.5 shrink-0 skew-x-12 items-center justify-center rounded-xs text-icon-subtle transition-[opacity,background-color,color] duration-fast ease-out hover:bg-bg-neutral-hovered hover:text-icon active:bg-bg-neutral-pressed",
							overlayControl.isOverlay
								? "pointer-events-none absolute end-1 top-1/2 z-[3] -translate-y-1/2 opacity-0 group-hover/skill-tag:pointer-events-auto group-hover/skill-tag:opacity-100 group-focus-within/skill-tag:pointer-events-auto group-focus-within/skill-tag:opacity-100"
								: "opacity-100",
						)}
						data-slot={overlayControl.slot}
					>
						{overlayControl.icon}
					</button>,
					overlayControl.tooltip,
				)
			) : null}
		</span>
	);
}

interface SkillTagCountProps extends Omit<React.ComponentProps<"span">, "color"> {
	count: number;
}

/**
 * Compact overflow variant of SkillTag. Follows the same skewed parallelogram
 * shape but drops the icon and colored slash bar, rendering only a "+N" count.
 * Use when there are more skills than horizontal space allows.
 */
function SkillTagCount({ count, onClick, className, ...props }: Readonly<SkillTagCountProps>) {
	const isInteractive = Boolean(onClick);

	return (
		<span
			{...props}
			onClick={onClick}
			className={cn(
				"inline-flex h-5 -skew-x-12 items-center justify-center rounded-sm bg-bg-neutral px-1.5 align-middle text-xs leading-4 font-normal text-text-subtle tabular-nums transition-colors",
				isInteractive ? "cursor-pointer hover:bg-bg-neutral-hovered hover:text-text active:bg-bg-neutral-pressed" : "cursor-default",
				className,
			)}
			data-slot="skill-tag-count"
		>
			{/* Counter-skew so the digits stay upright inside the slanted pill */}
			<span className="skew-x-12 whitespace-nowrap">+{count}</span>
		</span>
	);
}

interface SkillTagGroupProps extends React.ComponentProps<"div"> {
	/**
	 * Maximum rendered rows before remaining tags collapse into a SkillTagCount.
	 * Omit to render every child.
	 */
	maxRows?: number;
}

function getFlexColumnGap(element: HTMLElement): number {
	const { columnGap, gap } = window.getComputedStyle(element);
	const parsedGap = Number.parseFloat(columnGap === "normal" ? gap : columnGap);

	return Number.isFinite(parsedGap) ? parsedGap : 0;
}

function getWrappedRowCount(widths: readonly number[], containerWidth: number, columnGap: number): number {
	if (widths.length === 0) {
		return 0;
	}

	let rows = 1;
	let rowWidth = 0;

	for (const width of widths) {
		const nextWidth = rowWidth === 0 ? width : rowWidth + columnGap + width;

		if (nextWidth <= containerWidth + 0.5) {
			rowWidth = nextWidth;
		} else {
			rows += 1;
			rowWidth = width;
		}
	}

	return rows;
}

function calculateVisibleSkillTagCount({
	childWidths,
	containerWidth,
	columnGap,
	maxRows,
	overflowWidth,
}: {
	childWidths: readonly number[];
	containerWidth: number;
	columnGap: number;
	maxRows: number;
	overflowWidth: number;
}): number {
	if (containerWidth <= 0 || childWidths.length === 0) {
		return childWidths.length;
	}

	if (getWrappedRowCount(childWidths, containerWidth, columnGap) <= maxRows) {
		return childWidths.length;
	}

	for (let visibleCount = childWidths.length - 1; visibleCount >= 0; visibleCount -= 1) {
		const candidateWidths = [...childWidths.slice(0, visibleCount), overflowWidth];

		if (getWrappedRowCount(candidateWidths, containerWidth, columnGap) <= maxRows) {
			return visibleCount;
		}
	}

	return 0;
}

function SkillTagGroup({ children, className, maxRows, ...props }: Readonly<SkillTagGroupProps>) {
	const groupRef = React.useRef<HTMLDivElement>(null);
	const measurementRef = React.useRef<HTMLDivElement>(null);
	const childrenArray = React.useMemo(() => React.Children.toArray(children), [children]);
	const shouldCollapse = typeof maxRows === "number" && Number.isFinite(maxRows) && maxRows > 0;
	const [visibleCount, setVisibleCount] = React.useState(childrenArray.length);
	const constrainedVisibleCount = shouldCollapse ? Math.min(visibleCount, childrenArray.length) : childrenArray.length;
	const hiddenCount = shouldCollapse ? Math.max(childrenArray.length - constrainedVisibleCount, 0) : 0;

	React.useLayoutEffect(() => {
		if (!shouldCollapse) {
			setVisibleCount(childrenArray.length);
			return undefined;
		}

		const updateVisibleCount = () => {
			const groupElement = groupRef.current;
			const measurementElement = measurementRef.current;

			if (!groupElement || !measurementElement) {
				return;
			}

			const childElements = Array.from(
				measurementElement.querySelectorAll<HTMLElement>('[data-slot="skill-tag-group-measure-item"]'),
			);
			const overflowElement = measurementElement.querySelector<HTMLElement>('[data-slot="skill-tag-group-measure-overflow"]');

			if (!overflowElement) {
				return;
			}

			const childWidths = childElements.map((element) => element.getBoundingClientRect().width);
			const nextVisibleCount = calculateVisibleSkillTagCount({
				childWidths,
				containerWidth: groupElement.getBoundingClientRect().width,
				columnGap: getFlexColumnGap(measurementElement),
				maxRows,
				overflowWidth: overflowElement.getBoundingClientRect().width,
			});

			setVisibleCount((currentVisibleCount) => (
				currentVisibleCount === nextVisibleCount ? currentVisibleCount : nextVisibleCount
			));
		};

		updateVisibleCount();

		const resizeObserver = new ResizeObserver(updateVisibleCount);
		const groupElement = groupRef.current;

		if (groupElement) {
			resizeObserver.observe(groupElement);
		}

		return () => {
			resizeObserver.disconnect();
		};
	}, [childrenArray, maxRows, shouldCollapse]);

	return (
		<div ref={groupRef} data-slot="skill-tag-group" className={cn("relative flex flex-wrap gap-1", className)} {...props}>
			{shouldCollapse ? childrenArray.slice(0, constrainedVisibleCount) : children}
			{hiddenCount > 0 ? <SkillTagCount count={hiddenCount} /> : null}
			{shouldCollapse ? (
				<div
					aria-hidden
					className="invisible pointer-events-none absolute inset-x-0 top-0 flex flex-wrap gap-1"
					data-slot="skill-tag-group-measure"
					ref={measurementRef}
				>
					{childrenArray.map((child, index) => (
						<span className="inline-flex" data-slot="skill-tag-group-measure-item" key={index}>
							{child}
						</span>
					))}
					<span className="inline-flex" data-slot="skill-tag-group-measure-overflow">
						<SkillTagCount count={childrenArray.length} />
					</span>
				</div>
			) : null}
		</div>
	);
}

export { SkillTag, SkillTagCount, SkillTagGroup, type SkillTagProps, type SkillTagCountProps, type SkillTagGroupProps, type SkillTagColor };
