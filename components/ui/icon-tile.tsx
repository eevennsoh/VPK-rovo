import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

export type IconTileVariant =
	| "transparent"
	| "gray"
	| "blue"
	| "teal"
	| "green"
	| "lime"
	| "yellow"
	| "orange"
	| "red"
	| "magenta"
	| "purple"
	| "grayBold"
	| "blueBold"
	| "tealBold"
	| "greenBold"
	| "limeBold"
	| "yellowBold"
	| "orangeBold"
	| "redBold"
	| "magentaBold"
	| "purpleBold"

const ICON_TILE_VARIANTS: Record<IconTileVariant, string> = {
	transparent:
		"bg-transparent text-icon data-[size=xxsmall]:[font-size:12px] data-[size=xxsmall]:[&_img]:size-3! data-[size=xxsmall]:[&_span]:size-3! data-[size=xxsmall]:[&_svg]:size-3! data-[size=small]:[font-size:16px] data-[size=small]:[&_img]:size-4! data-[size=small]:[&_span]:size-4! data-[size=small]:[&_svg]:size-4! data-[size=medium]:[font-size:16px] data-[size=medium]:[&_img]:size-4! data-[size=medium]:[&_span]:size-4! data-[size=medium]:[&_svg]:size-4!",
	// Subtle
	gray: "bg-neutral-50 text-neutral-600",
	blue: "bg-blue-50 text-blue-600",
	teal: "bg-teal-50 text-teal-600",
	green: "bg-green-50 text-green-600",
	lime: "bg-lime-50 text-lime-600",
	yellow: "bg-yellow-50 text-yellow-600",
	orange: "bg-orange-50 text-orange-600",
	red: "bg-red-50 text-red-600",
	magenta: "bg-pink-50 text-pink-600",
	purple: "bg-purple-50 text-purple-600",
	// Bold
	grayBold: "bg-neutral-600 text-text-inverse",
	blueBold: "bg-blue-600 text-text-inverse",
	tealBold: "bg-teal-600 text-text-inverse",
	greenBold: "bg-green-600 text-text-inverse",
	limeBold: "bg-lime-600 text-text-inverse",
	yellowBold: "bg-yellow-600 text-text-inverse",
	orangeBold: "bg-orange-600 text-text-inverse",
	redBold: "bg-red-600 text-text-inverse",
	magentaBold: "bg-pink-600 text-text-inverse",
	purpleBold: "bg-purple-600 text-text-inverse",
}

const iconTileVariants = cva(
	"inline-flex items-center justify-center overflow-hidden shrink-0",
	{
		variants: {
			size: {
				xxsmall: "size-4 [font-size:10px] [&_img]:size-2.5! [&_span]:size-2.5! [&_svg]:size-2.5!",
				xsmall: "size-5 [font-size:12px] [&_img]:size-3! [&_span]:size-3! [&_svg]:size-3!",
				small: "size-6 [font-size:14px] [&_img]:size-3.5! [&_span]:size-3.5! [&_svg]:size-3.5!",
				medium: "size-8 [font-size:16px] [&_img]:size-4! [&_span]:size-4! [&_svg]:size-4!",
				large: "size-10 [font-size:20px] [&_img]:size-5! [&_span]:size-5! [&_svg]:size-5!",
				xlarge: "size-12 [font-size:24px] [&_img]:size-6! [&_span]:size-6! [&_svg]:size-6!",
			},
			shape: {
				square: "rounded-tile",
				circle: "rounded-full!",
			},
		},
		defaultVariants: {
			size: "medium",
			shape: "square",
		},
	}
)

export interface IconTileProps
	extends Omit<React.ComponentProps<"div">, "children">,
		VariantProps<typeof iconTileVariants> {
	icon: React.ReactNode
	variant?: IconTileVariant
	label: string
}

function IconTile({
	icon,
	variant = "gray",
	label,
	size = "medium",
	shape = "square",
	className,
	...props
}: Readonly<IconTileProps>) {
	const isDecorative = props["aria-hidden"] === true;

	return (
		<div
			data-slot="icon-tile"
			data-size={size}
			data-variant={variant}
			aria-label={isDecorative ? undefined : label}
			className={cn(
				iconTileVariants({ size, shape }),
				ICON_TILE_VARIANTS[variant],
				className
			)}
			{...props}
		>
			{icon}
		</div>
	)
}

// react-doctor-disable-next-line react-doctor/only-export-components -- This component module intentionally exports colocated non-component API used by consumers.
export { IconTile, iconTileVariants }
