import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { token } from "@/lib/tokens"
import { cn } from "@/lib/utils"

const emptyVariants = cva("flex min-w-0 flex-1", {
	variants: {
		width: {
			wide: "max-w-[464px]",
			narrow: "max-w-[304px]",
		},
		orientation: {
			// Stacked: media on top, centered text and actions (default).
			vertical: "flex-col items-center justify-center text-center text-balance",
			// Side-by-side: media on the leading edge, left-aligned text/actions.
			// Collapses back to the vertical stack below the sm breakpoint.
			horizontal:
				"flex-col items-center text-center text-balance sm:flex-row sm:items-center sm:justify-start sm:text-left",
		},
	},
	defaultVariants: {
		width: "wide",
		orientation: "vertical",
	},
})

type EmptyOrientation = NonNullable<VariantProps<typeof emptyVariants>["orientation"]>

// Surfaces the chosen orientation to sub-components so EmptyHeader/EmptyContent
// can left-align in the horizontal layout without consumers prop-drilling.
const EmptyOrientationContext = React.createContext<EmptyOrientation>("vertical")

interface EmptyProps
	extends React.ComponentProps<"div">,
		VariantProps<typeof emptyVariants> {}

function Empty({
	className,
	width = "wide",
	orientation,
	...props
}: Readonly<EmptyProps>) {
	const resolvedOrientation: EmptyOrientation = orientation ?? "vertical"
	const isHorizontal = resolvedOrientation === "horizontal"
	// Horizontal empties are about content, not max-width centering, so let them
	// fill the available row width instead of clamping to the narrow/wide token.
	const widthClass = isHorizontal ? undefined : emptyVariants({ width })
	return (
		<EmptyOrientationContext value={resolvedOrientation}>
			<div
				data-slot="empty"
				data-orientation={resolvedOrientation}
				className={cn(
					emptyVariants({ orientation: resolvedOrientation }),
					widthClass,
					"mx-auto gap-6 py-12",
					isHorizontal && "w-full sm:gap-5 sm:py-8",
					className
				)}
				{...props}
			/>
		</EmptyOrientationContext>
	)
}

function EmptyHeader({ className, ...props }: React.ComponentProps<"div">) {
	const orientation = React.use(EmptyOrientationContext)
	return (
		<div
			data-slot="empty-header"
			className={cn(
				"flex flex-col items-center gap-2",
				orientation === "horizontal" && "sm:items-start sm:text-left",
				className
			)}
			{...props}
		/>
	)
}

const emptyMediaVariants = cva(
	"mb-1 flex shrink-0 items-center justify-center [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default:
					"bg-transparent [&_img]:max-h-40 [&_img]:max-w-40 [&_img]:object-contain",
				icon: "bg-bg-neutral text-text flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg:not([class*='size-'])]:size-5",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
)

function EmptyMedia({
	className,
	variant = "default",
	...props
}: React.ComponentProps<"div"> & VariantProps<typeof emptyMediaVariants>) {
	return (
		<div
			data-slot="empty-icon"
			data-variant={variant}
			className={cn(emptyMediaVariants({ variant }), className)}
			{...props}
		/>
	)
}

const emptyTitleVariants = cva("text-text", {
	variants: {
		headingSize: {
			medium: "",
			xsmall: "text-sm font-semibold",
		},
	},
	defaultVariants: {
		headingSize: "medium",
	},
})

function EmptyTitle({
	className,
	headingSize = "medium",
	style,
	...props
}: React.ComponentProps<"h4"> &
	VariantProps<typeof emptyTitleVariants>) {
	return (
		<h4
			data-slot="empty-title"
			className={cn(emptyTitleVariants({ headingSize }), className)}
			style={
				headingSize === "medium"
					? { font: token("font.heading.medium"), ...style }
					: style
			}
			{...props}
		/>
	)
}

function EmptyDescription({
	className,
	...props
}: React.ComponentProps<"p">) {
	return (
		<p
			data-slot="empty-description"
			className={cn(
				"text-sm/relaxed text-text-subtle [&>a:hover]:text-link-pressed [&>a]:text-link [&>a]:underline [&>a]:underline-offset-4",
				className
			)}
			{...props}
		/>
	)
}

function EmptyContent({ className, ...props }: React.ComponentProps<"div">) {
	const orientation = React.use(EmptyOrientationContext)
	return (
		<div
			data-slot="empty-content"
			className={cn(
				"flex w-full min-w-0 flex-col items-center gap-2 text-sm",
				orientation === "horizontal" && "sm:items-start",
				className
			)}
			{...props}
		/>
	)
}

export {
	Empty,
	EmptyHeader,
	EmptyTitle,
	EmptyDescription,
	EmptyContent,
	EmptyMedia,
	emptyVariants,
	emptyMediaVariants,
	emptyTitleVariants,
	type EmptyProps,
}
