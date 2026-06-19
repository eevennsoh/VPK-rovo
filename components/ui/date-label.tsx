"use client"

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down"
import { cva, type VariantProps } from "class-variance-authority"

import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"

type DateInput = Date | number | string
type DateLabelStyle = "full" | "long" | "medium" | "short"

// Module-cached Intl.DateTimeFormat — one instance per dateStyle. Constructing
// a formatter is the expensive part, so caching avoids rebuilding it on every
// render. The "en-US" locale is pinned to keep SSR and client output identical
// (avoids React hydration mismatches).
const formatterCache = new Map<DateLabelStyle, Intl.DateTimeFormat>()

function getFormatter(dateStyle: DateLabelStyle): Intl.DateTimeFormat {
	let formatter = formatterCache.get(dateStyle)
	if (!formatter) {
		formatter = new Intl.DateTimeFormat("en-US", { dateStyle })
		formatterCache.set(dateStyle, formatter)
	}
	return formatter
}

function formatDate(date: DateInput, dateStyle: DateLabelStyle): string {
	try {
		const parsed = date instanceof Date ? date : new Date(date)
		if (Number.isNaN(parsed.getTime())) {
			return String(date)
		}
		return getFormatter(dateStyle).format(parsed)
	} catch {
		return String(date)
	}
}

// Shared shell for both DateLabel and DateLabelTrigger. Mirrors the ADS
// date-label: a transparent pill with a 1px status-colored border and matching
// status-colored text (status is conveyed by border + text, not a fill).
const dateLabelVariants = cva(
	"inline-flex w-fit items-center overflow-hidden border align-middle text-sm leading-5 font-normal text-ellipsis whitespace-nowrap",
	{
		variants: {
			// Status appearance. Mirrors the @atlaskit/date-label `color` API
			// (neutral | warning | danger).
			variant: {
				neutral: "border-border text-text",
				warning: "border-border-warning text-text-warning",
				danger: "border-border-danger text-text-danger",
			},
			// Density. Mirrors the ADS `spacing` API (default | spacious).
			size: {
				default: "gap-1 rounded-sm px-1 py-0.5",
				spacious: "gap-1.5 rounded-md px-3 py-1",
			},
		},
		defaultVariants: {
			variant: "neutral",
			size: "default",
		},
	}
)

interface DateLabelProps
	extends Omit<React.ComponentProps<"span">, "children">,
		VariantProps<typeof dateLabelVariants> {
	/** Date to display. Accepts a Date, epoch ms, or parseable date string. */
	date: DateInput
	/** Intl date format style. Defaults to "medium" (e.g. "Jul 29, 2026"). */
	dateStyle?: DateLabelStyle
	/** Optional leading icon (wrap atlaskit icons in the VPK `Icon` component). */
	icon?: React.ReactNode
	/** Caps the label width and truncates with an ellipsis. */
	maxWidth?: number | string
}

function DateLabel({
	className,
	variant = "neutral",
	size = "default",
	date,
	dateStyle = "medium",
	icon,
	maxWidth,
	style,
	...props
}: Readonly<DateLabelProps>) {
	return (
		<span
			data-slot="date-label"
			className={cn(dateLabelVariants({ variant, size }), className)}
			style={maxWidth == null ? style : { maxWidth, ...style }}
			{...props}
		>
			{icon}
			{formatDate(date, dateStyle)}
		</span>
	)
}

interface DateLabelTriggerProps
	extends Omit<React.ComponentProps<"button">, "children">,
		VariantProps<typeof dateLabelVariants> {
	/** Date to display. Accepts a Date, epoch ms, or parseable date string. */
	date: DateInput
	/** Intl date format style. Defaults to "medium" (e.g. "Jul 29, 2026"). */
	dateStyle?: DateLabelStyle
	/** Optional leading icon (wrap atlaskit icons in the VPK `Icon` component). */
	icon?: React.ReactNode
	/** Caps the label width and truncates with an ellipsis. */
	maxWidth?: number | string
}

// Interactive date label intended as a dropdown trigger. Designed to be passed
// to Base UI's `render` prop, e.g.
// `<DropdownMenuTrigger render={<DateLabelTrigger date={…} />} />`, so the menu
// primitive can inject onClick / aria-expanded / aria-haspopup.
function DateLabelTrigger({
	className,
	variant = "neutral",
	size = "default",
	date,
	dateStyle = "medium",
	icon,
	maxWidth,
	style,
	type = "button",
	...props
}: Readonly<DateLabelTriggerProps>) {
	return (
		<button
			type={type}
			data-slot="date-label-trigger"
			className={cn(
				dateLabelVariants({ variant, size }),
				"cursor-pointer outline-none duration-fast ease-out transition-colors",
				"hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed",
				"focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
				"aria-expanded:border-border-selected aria-expanded:bg-bg-selected aria-expanded:text-text-selected",
				className
			)}
			style={maxWidth == null ? style : { maxWidth, ...style }}
			{...props}
		>
			{icon}
			<span className="overflow-hidden text-ellipsis whitespace-nowrap">
				{formatDate(date, dateStyle)}
			</span>
			<Icon
				render={<ChevronDownIcon label="" size="small" />}
				label=""
				className="shrink-0 text-current"
			/>
		</button>
	)
}

// react-doctor-disable-next-line react-doctor/only-export-components -- Colocated CVA helper is intentionally exported alongside the components.
export {
	DateLabel,
	DateLabelTrigger,
	dateLabelVariants,
	type DateLabelProps,
	type DateLabelTriggerProps,
}
