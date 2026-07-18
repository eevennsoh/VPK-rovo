"use client";

import { type ReactNode } from "react";

import type { NewCoreIconProps } from "@atlaskit/icon/base-new";
import CrossIcon from "@atlaskit/icon/core/cross";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Floating-label Details field (video-matched). Collapses to a single
 * `icon + label` line when empty and idle, and expands — floating the label up
 * and shrinking it while the value/editor reveals below — when the field has a
 * value or is being edited.
 *
 * "Expanded" is derived purely from CSS so it always tracks live DOM state with
 * no focus/blur races: the row expands when it is filled (`data-filled`), while
 * it holds focus (`:focus-within`), or while a descendant trigger's popover is
 * open (`:has([data-popup-open])`). The editor trigger (`children`) is always
 * full-width and clickable; when collapsed it fades to transparent so only the
 * overlaid label + icon show, so a click anywhere on the row still opens it.
 */

// Applied to a child so it takes its expanded form whenever the field is filled,
// focused, or has an open popover. Kept as one shared string per element so the
// three OR-conditions stay in lockstep.
const EXPANDED_ICON = cn(
	"group-data-[filled=true]/ff:-translate-x-1 group-data-[filled=true]/ff:opacity-0",
	"group-focus-within/ff:-translate-x-1 group-focus-within/ff:opacity-0",
	"group-has-[[data-popup-open]]/ff:-translate-x-1 group-has-[[data-popup-open]]/ff:opacity-0",
);

const EXPANDED_LABEL = cn(
	"group-data-[filled=true]/ff:top-1.5 group-data-[filled=true]/ff:translate-x-0 group-data-[filled=true]/ff:text-xs",
	"group-focus-within/ff:top-1.5 group-focus-within/ff:translate-x-0 group-focus-within/ff:text-xs",
	"group-has-[[data-popup-open]]/ff:top-1.5 group-has-[[data-popup-open]]/ff:translate-x-0 group-has-[[data-popup-open]]/ff:text-xs",
);

const EXPANDED_VALUE = cn(
	"group-data-[filled=true]/ff:pt-6 group-data-[filled=true]/ff:opacity-100",
	"group-focus-within/ff:pt-6 group-focus-within/ff:opacity-100",
	"group-has-[[data-popup-open]]/ff:pt-6 group-has-[[data-popup-open]]/ff:opacity-100",
);

export function FloatingField({
	label,
	icon: IconComponent,
	filled,
	actions,
	onClear,
	children,
}: Readonly<{
	label: string;
	icon: React.ComponentType<NewCoreIconProps>;
	filled: boolean;
	/** Trailing controls revealed on hover while expanded (e.g. assign-to-me). */
	actions?: ReactNode;
	/** When set and the field is filled, shows a hover ✕ that clears the value (collapsing the row). */
	onClear?: () => void;
	/** The editor: a full-width popover/menu trigger that renders the value. */
	children: ReactNode;
}>) {
	return (
		<div
			className="group/ff relative -mx-2 rounded-md px-2 transition-colors duration-normal ease-out-practical hover:bg-bg-neutral-subtle-hovered motion-reduce:transition-none"
			data-filled={filled ? "true" : "false"}
			data-slot="floating-field"
		>
			{/* Leading icon — visible only when collapsed. */}
			<span
				aria-hidden
				className={cn(
					"pointer-events-none absolute left-2 top-1/2 flex -translate-y-1/2 text-icon-subtle",
					"transition-[opacity,transform] duration-medium ease-in-out motion-reduce:transition-none",
					EXPANDED_ICON,
				)}
			>
				<IconComponent label="" size="small" />
			</span>

			{/* Floating label — one element that rises + shrinks on expand. */}
			<span
				className={cn(
					"pointer-events-none absolute left-2 top-2.5 origin-top-left translate-x-6 text-sm leading-4 text-text-subtle",
					"transition-[transform,font-size,top] duration-medium ease-in-out motion-reduce:transition-none",
					EXPANDED_LABEL,
				)}
			>
				{label}
			</span>

			{/* Value / editor — full-width + clickable; fades + slides down into place. */}
			<div
				className={cn(
					"pt-1.5 pb-1.5 opacity-0",
					"transition-[padding,opacity] duration-medium ease-in-out motion-reduce:transition-none",
					EXPANDED_VALUE,
				)}
			>
				{children}
			</div>

			{actions || (onClear && filled) ? (
				<div className="absolute right-2 bottom-1.5 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-normal ease-out-practical group-hover/ff:opacity-100 group-focus-within/ff:opacity-100 motion-reduce:transition-none">
					{actions}
					{onClear && filled ? (
						<Button aria-label={`Clear ${label}`} onClick={onClear} size="icon-compact" variant="ghost">
							<CrossIcon label="" size="small" />
						</Button>
					) : null}
				</div>
			) : null}
		</div>
	);
}
