"use client";

import * as React from "react";
import CrossIcon from "@atlaskit/icon/core/cross";

import { cn } from "@/lib/utils";

type SkillTagColor = "default" | "2p3p" | "platform" | "teamwork" | "software" | "strategy" | "service" | "product";

const collectionStyles: Record<SkillTagColor, { slash: string; icon: string }> = {
	default: { slash: "bg-border", icon: "text-icon-subtlest" },
	"2p3p": { slash: "bg-border", icon: "text-icon-subtlest" },
	platform: { slash: "bg-border", icon: "text-icon-subtlest" },
	teamwork: { slash: "bg-border-brand", icon: "text-icon-brand" },
	software: { slash: "bg-border-success", icon: "text-icon-success" },
	strategy: { slash: "bg-border-warning", icon: "text-icon-warning" },
	service: { slash: "bg-yellow-400", icon: "text-yellow-400" },
	product: { slash: "bg-border-discovery", icon: "text-icon-discovery" },
};

interface SkillTagProps extends Omit<React.ComponentProps<"span">, "color"> {
	icon?: React.ReactNode;
	color?: SkillTagColor;
	onRemove?: () => void;
	removeButtonLabel?: string;
}

function SkillTag({ children, icon, color = "default", onClick, onRemove, removeButtonLabel = "Remove", className, ...props }: Readonly<SkillTagProps>) {
	const isInteractive = Boolean(onClick);

	return (
		<span
			{...props}
			onClick={onClick}
			className={cn(
				"relative inline-flex h-5 -skew-x-12 items-center gap-1 rounded-sm bg-bg-neutral py-1 pl-2.5 align-middle text-xs leading-4 font-normal text-text transition-colors",
				onRemove ? "pr-1" : "pr-1.5",
				isInteractive ? "cursor-pointer hover:bg-bg-neutral-hovered active:bg-bg-neutral-pressed" : "cursor-default",
				className,
			)}
			data-slot="skill-tag"
		>
			{/* Colored slash bar */}
			<span className={cn("absolute top-0 bottom-0 left-0 z-[1] w-0.5 rounded-l-sm", collectionStyles[color].slash)} />

			{/* Icon */}
			{icon ? (
				<span className={cn("flex size-3 shrink-0 skew-x-12 items-center justify-center [&>svg]:size-3", collectionStyles[color].icon)} data-slot="skill-tag-icon">
					{icon}
				</span>
			) : null}

			{/* Label */}
			<span className="skew-x-12 truncate whitespace-nowrap" data-slot="skill-tag-label">
				{children}
			</span>

			{/* Remove button */}
			{onRemove ? (
				<button
					type="button"
					aria-label={removeButtonLabel}
					onClick={(event) => {
						event.stopPropagation();
						onRemove();
					}}
					className="inline-flex size-3.5 shrink-0 skew-x-12 items-center justify-center rounded-xs text-icon-subtle transition-colors hover:bg-bg-neutral-hovered hover:text-icon active:bg-bg-neutral-pressed"
					data-slot="skill-tag-remove"
				>
					<CrossIcon label="" size="small" />
				</button>
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
