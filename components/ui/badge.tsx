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

				// ADS "neutral" — subtle grey (color.background.neutral)
				neutral:
					`bg-bg-neutral text-text-subtle hover:bg-bg-neutral-hovered active:bg-bg-neutral-pressed ${boldDisabled}`,

				// ---------------------------------------------------------------
				// ADS: "primary" — brand-bold blue pill with inverse text
				// color.background.brand.bold + color.text.inverse
				// ---------------------------------------------------------------
				primary:
					`bg-primary text-primary-foreground hover:bg-primary-hovered active:bg-primary-pressed ${boldDisabled}`,

				// ---------------------------------------------------------------
				// ADS: "primaryInverted" — white surface + brand text, for
				// placement on bold/brand backgrounds (inverse of primary).
				// Opacity-based disabled so the on-bold context is preserved.
				// color.elevation.surface + color.text.brand
				// ---------------------------------------------------------------
				primaryInverted:
					`bg-surface text-text-brand hover:bg-bg-neutral-subtle-hovered active:bg-bg-neutral-subtle-pressed ${subtleDisabled}`,

				// ---------------------------------------------------------------
				// ADS: "inverse" — translucent dark fill + inverse text, intended
				// for placement on bold/colored surfaces. Uses opacity-based
				// disabled so the on-bold context is preserved (no opaque swatch).
				// color.background.inverse.subtle + color.text.inverse
				// ---------------------------------------------------------------
				inverse:
					`bg-bg-inverse-subtle text-text-inverse hover:bg-bg-inverse-subtle-hovered active:bg-bg-inverse-subtle-pressed ${subtleDisabled}`,

				// ---------------------------------------------------------------
				// ADS: "important" — bold neutral (opaque dark badge)
				// Used in ADS for high-urgency numeric counts (e.g. notification dot)
				// color.background.neutral.bold
				// ---------------------------------------------------------------
				important:
					`bg-bg-neutral-bold text-text-inverse hover:bg-bg-neutral-bold-hovered active:bg-bg-neutral-bold-pressed ${boldDisabled}`,

				// ADS "added" — green badge (color.background.success)
				added:
					`bg-bg-success text-text-success-bolder hover:bg-bg-success-hovered active:bg-bg-success-pressed ${boldDisabled}`,

				// ADS "removed" — red badge (color.background.danger)
				removed:
					`bg-bg-danger text-text-danger-bolder hover:bg-bg-danger-hovered active:bg-bg-danger-pressed ${boldDisabled}`,

				// ---------------------------------------------------------------
				// Semantic status — subtler palette
				// (destructive = ADS "danger", info = ADS "information")
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
