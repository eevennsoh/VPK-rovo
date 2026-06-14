import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Disabled class groups:
//   boldDisabled   — for opaque-background variants (use bg-bg-disabled swatch)
//   subtleDisabled — for transparent/outline/ghost variants (use opacity pattern)
const boldDisabled =
	"disabled:pointer-events-none disabled:bg-bg-disabled disabled:text-text-disabled"
const subtleDisabled =
	"disabled:pointer-events-none disabled:opacity-(--opacity-disabled)"

const badgeVariants = cva(
	"inline-flex h-4 min-w-6 w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap overflow-hidden rounded-xs px-1 text-xs leading-4 font-normal has-data-[icon=inline-end]:pr-0.5 has-data-[icon=inline-start]:pl-0.5 [&>svg]:size-3! [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 group/badge",
	{
		variants: {
			variant: {
				// ---------------------------------------------------------------
				// ADS semantic appearances — surface-pressed neutral base
				// ADS: "default" — neutral grey pill (color.surface.pressed)
				// ---------------------------------------------------------------
				default:
					`bg-surface-pressed text-foreground hover:bg-surface-overlay-hovered active:bg-surface-overlay-pressed ${boldDisabled}`,

				// VPK-only subtle grey (color.background.neutral / bg-bg-neutral)
				secondary:
					`bg-bg-neutral text-text-subtle hover:bg-bg-neutral-hovered active:bg-bg-neutral-pressed ${boldDisabled}`,

				// ---------------------------------------------------------------
				// ADS: "important" — bold neutral (opaque dark badge)
				// Used in ADS for high-urgency numeric counts (e.g. notification dot)
				// color.background.neutral.bold
				// ---------------------------------------------------------------
				important:
					`bg-bg-neutral-bold text-text-inverse hover:bg-bg-neutral-bold-hovered active:bg-bg-neutral-bold-pressed ${boldDisabled}`,

				// ---------------------------------------------------------------
				// Semantic status — subtler palette
				// ---------------------------------------------------------------
				destructive:
					`bg-bg-danger-subtler text-text-danger-bolder hover:bg-bg-danger-subtler-hovered active:bg-bg-danger-subtler-pressed ${boldDisabled}`,

				// color.background.success.subtler
				success:
					`bg-bg-success-subtler text-text-success-bolder hover:bg-bg-success-subtler-hovered active:bg-bg-success-subtler-pressed ${boldDisabled}`,

				// color.background.warning.subtler
				warning:
					`bg-bg-warning-subtler text-text-warning-bolder hover:bg-bg-warning-subtler-hovered active:bg-bg-warning-subtler-pressed ${boldDisabled}`,

				// color.background.information.subtler
				info:
					`bg-bg-information-subtler text-text-information-bolder hover:bg-bg-information-subtler-hovered active:bg-bg-information-subtler-pressed ${boldDisabled}`,

				// color.background.discovery.subtler
				discovery:
					`bg-bg-discovery-subtler text-text-discovery-bolder hover:bg-bg-discovery-subtler-hovered active:bg-bg-discovery-subtler-pressed ${boldDisabled}`,

				// ---------------------------------------------------------------
				// VPK-only structural variants — not part of ADS Badge API
				// These use opacity-based disabled since they have no fill.
				// ---------------------------------------------------------------
				outline:
					`border border-border text-foreground hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed ${subtleDisabled}`,
				ghost:
					`text-foreground hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed ${subtleDisabled}`,
				link:
					`text-link underline-offset-4 hover:underline active:text-link-pressed ${subtleDisabled}`,
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
)

function getCappedValue(
	children: BadgeProps["children"],
	max: BadgeProps["max"]
): BadgeProps["children"] {
	if (typeof max !== "number" || !Number.isFinite(max)) {
		return children
	}

	if (typeof children === "number") {
		return children > max ? `${max}+` : children
	}

	if (typeof children === "string") {
		const trimmedChildren = children.trim()

		if (!/^\d+$/.test(trimmedChildren)) {
			return children
		}

		const numericValue = Number.parseInt(trimmedChildren, 10)
		return numericValue > max ? `${max}+` : children
	}

	return children
}

export interface BadgeProps
	extends useRender.ComponentProps<"span">,
		VariantProps<typeof badgeVariants> {
	max?: number | false
}

function Badge({
	className,
	variant = "default",
	max = 99,
	children,
	render,
	...props
}: Readonly<BadgeProps>) {
	return useRender({
		defaultTagName: "span",
		props: mergeProps<"span">(
			{
				className: cn(badgeVariants({ className, variant })),
				children: getCappedValue(children, max),
			},
			props
		),
		render,
		state: {
			slot: "badge",
			variant,
		},
	})
}

// react-doctor-disable-next-line react-doctor/only-export-components -- This component module intentionally exports colocated non-component API used by consumers.
export { Badge, badgeVariants }
