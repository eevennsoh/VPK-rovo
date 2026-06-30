import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Disabled treatment for opaque-background variants (use bg-bg-disabled swatch).
const boldDisabled =
	"disabled:pointer-events-none disabled:bg-bg-disabled disabled:text-text-disabled"

const badgeVariants = cva(
	"inline-flex h-4 min-w-6 w-fit shrink-0 items-center justify-center gap-1 whitespace-nowrap overflow-hidden rounded-xs px-1 text-xs leading-4 font-normal has-data-[icon=inline-end]:pr-0.5 has-data-[icon=inline-start]:pl-0.5 [&>svg]:size-3! [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 group/badge",
	{
		variants: {
			variant: {
				// ===============================================================
				// Variants mirror the @atlaskit/badge appearance API (new naming
				// convention). Legacy appearances removed (default/primary/
				// primaryInverted/important/added/removed). ADS migration:
				// neutral←default, information←primary, inverse←primaryInverted,
				// danger←important/removed, success←added.
				// ===============================================================

				// "neutral" — gray (color.background.accent.gray.subtler). Default appearance.
				neutral:
					`bg-bg-accent-gray-subtler text-text hover:bg-bg-accent-gray-subtler active:bg-bg-accent-gray-subtler ${boldDisabled}`,

				// "danger" — red (color.background.danger.subtler)
				danger:
					`bg-bg-danger-subtler text-text-danger-bolder hover:bg-bg-danger-subtler-hovered active:bg-bg-danger-subtler-pressed ${boldDisabled}`,

				// "success" — green (color.background.success.subtler)
				success:
					`bg-bg-success-subtler text-text-success-bolder hover:bg-bg-success-subtler-hovered active:bg-bg-success-subtler-pressed ${boldDisabled}`,

				// "warning" — yellow (color.background.warning.subtler)
				warning:
					`bg-bg-warning-subtler text-text-warning-bolder hover:bg-bg-warning-subtler-hovered active:bg-bg-warning-subtler-pressed ${boldDisabled}`,

				// "information" — blue (color.background.information.subtler)
				information:
					`bg-bg-information-subtler text-text-information-bolder hover:bg-bg-information-subtler-hovered active:bg-bg-information-subtler-pressed ${boldDisabled}`,

				// "discovery" — purple (color.background.discovery.subtler)
				discovery:
					`bg-bg-discovery-subtler text-text-discovery-bolder hover:bg-bg-discovery-subtler-hovered active:bg-bg-discovery-subtler-pressed ${boldDisabled}`,

				// "inverse" — surface fill + default text (per ADS Beta Badge:
				// color.elevation.surface + color.text). Context-adaptive: white +
				// dark text on light surfaces, dark + light text on dark surfaces.
				inverse:
					`bg-surface text-foreground hover:bg-surface-overlay-hovered active:bg-surface-overlay-pressed ${boldDisabled}`,

				// ---------------------------------------------------------------
				// Bold appearances — stronger label fills from the ADS visual uplift.
				// ---------------------------------------------------------------

				// "informationBold" — color.background.information.subtle
				informationBold:
					`bg-bg-information-subtle text-text-information-bolder hover:bg-bg-information-subtle active:bg-bg-information-subtle ${boldDisabled}`,

				// "successBold" — color.background.success.subtle
				successBold:
					`bg-bg-success-subtle text-text-success-bolder hover:bg-bg-success-subtle active:bg-bg-success-subtle ${boldDisabled}`,

				// "dangerBold" — color.background.danger.subtle
				dangerBold:
					`bg-bg-danger-subtle text-text-danger-bolder hover:bg-bg-danger-subtle active:bg-bg-danger-subtle ${boldDisabled}`,

				// "warningBold" — color.background.warning.bold
				warningBold:
					`bg-warning text-text-warning-bolder hover:bg-warning-hovered active:bg-warning-pressed ${boldDisabled}`,

				// "discoveryBold" — color.background.discovery.subtle
				discoveryBold:
					`bg-bg-discovery-subtle text-text-discovery-bolder hover:bg-bg-discovery-subtle active:bg-bg-discovery-subtle ${boldDisabled}`,
			},
		},
		defaultVariants: {
			variant: "neutral",
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
	variant = "neutral",
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
