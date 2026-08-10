// oxlint-disable react-doctor/only-export-components -- This module intentionally exports colocated component API, variant contracts, context contracts, or metadata used by consumers.

// oxlint-disable react-doctor/prefer-tag-over-role -- This file uses ARIA roles for custom generated visuals or composite widgets where the suggested native tag would change semantics or behavior.
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"

const buttonGroupVariants = cva(
	"flex w-fit items-stretch *:focus-visible:z-10 *:focus-visible:relative [&>[data-slot=select-trigger]:not([class*='w-'])]:w-fit [&>input]:flex-1",
	{
		variants: {
			variant: {
				connected:
					"has-[>[data-slot=button-group]]:gap-2 has-[select[aria-hidden=true]:last-child]:[&>[data-slot=select-trigger]:last-of-type]:rounded-r-md",
				split:
					"[&>button[data-variant=default]]:border-primary [&>button[data-variant=default]:first-child]:border-r-border-inverse has-[button[aria-expanded=true]]:[&>button[data-variant=outline]:first-child]:border-r-border-selected",
				separated: "gap-1",
			},
			orientation: {
				horizontal: "",
				vertical: "flex-col",
			},
		},
		compoundVariants: [
			{
				variant: ["connected", "split"],
				orientation: "horizontal",
				// Later segments suppress their physical left border to avoid a double
				// seam. Paint selected / focus-visible seams as an overlay so fixed and
				// auto-width buttons keep identical closed/open geometry — without the
				// overlay, focus-visible:border-ring is missing on the collapsed left edge.
				className:
					// Selected seam also matches `[data-selected]` for non-button
					// shells (e.g. MetadataRailPanelSegment) that keep pressed chrome
					// off nested label buttons.
					"[&>[data-slot]:not(:has(~[data-slot]))]:rounded-r-md! [&>[data-slot]~[data-slot]]:rounded-l-none [&>[data-slot]~[data-slot]]:border-l-0 [&>[data-slot]~[data-slot]:focus-visible]:relative [&>[data-slot]~[data-slot]:focus-visible]:before:pointer-events-none [&>[data-slot]~[data-slot]:focus-visible]:before:absolute [&>[data-slot]~[data-slot]:focus-visible]:before:inset-y-0 [&>[data-slot]~[data-slot]:focus-visible]:before:-left-px [&>[data-slot]~[data-slot]:focus-visible]:before:w-px [&>[data-slot]~[data-slot]:focus-visible]:before:bg-ring [&>[data-slot]~[data-slot]:focus-visible]:before:content-[''] [&>[data-slot]~[data-slot]:is([aria-expanded=true],[aria-pressed=true],[data-selected])]:relative [&>[data-slot]~[data-slot]:is([aria-expanded=true],[aria-pressed=true],[data-selected])]:before:pointer-events-none [&>[data-slot]~[data-slot]:is([aria-expanded=true],[aria-pressed=true],[data-selected])]:before:absolute [&>[data-slot]~[data-slot]:is([aria-expanded=true],[aria-pressed=true],[data-selected])]:before:inset-y-0 [&>[data-slot]~[data-slot]:is([aria-expanded=true],[aria-pressed=true],[data-selected])]:before:-left-px [&>[data-slot]~[data-slot]:is([aria-expanded=true],[aria-pressed=true],[data-selected])]:before:w-px [&>[data-slot]~[data-slot]:is([aria-expanded=true],[aria-pressed=true],[data-selected])]:before:bg-border-selected [&>[data-slot]~[data-slot]:is([aria-expanded=true],[aria-pressed=true],[data-selected])]:before:content-[''] *:data-slot:rounded-r-none",
			},
			{
				variant: "connected",
				orientation: "vertical",
				className:
					"[&>[data-slot]:not(:has(~[data-slot]))]:rounded-b-md! [&>[data-slot]~[data-slot]]:rounded-t-none [&>[data-slot]~[data-slot]]:border-t-0 *:data-slot:rounded-b-none",
			},
		],
		defaultVariants: {
			variant: "connected",
			orientation: "horizontal",
		},
	}
)

interface ButtonGroupProps
	extends React.ComponentProps<"div">,
		VariantProps<typeof buttonGroupVariants> {}

function ButtonGroup({
	className,
	variant = "connected",
	orientation,
	...props
}: Readonly<ButtonGroupProps>) {
	return (
		<div
			role="group"
			data-slot="button-group"
			data-orientation={orientation}
			className={cn(buttonGroupVariants({ variant, orientation }), className)}
			{...props}
		/>
	)
}

function ButtonGroupText({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  return useRender({
    defaultTagName: "div",
    props: mergeProps<"div">(
      {
        className: cn(
          "bg-muted gap-2 rounded-md border px-2.5 text-sm font-medium [&_svg:not([class*='size-'])]:size-4 flex items-center [&_svg]:pointer-events-none",
          className
        ),
      },
      props
    ),
    render,
    state: {
      slot: "button-group-text",
    },
  })
}

function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<typeof Separator>) {
  return (
    <Separator
      data-slot="button-group-separator"
      orientation={orientation}
      className={cn(
        "bg-input relative self-stretch data-horizontal:mx-px data-horizontal:w-auto data-vertical:my-px data-vertical:h-auto",
        className
      )}
      {...props}
    />
  )
}

export {
	ButtonGroup,
	ButtonGroupSeparator,
	ButtonGroupText,
	buttonGroupVariants,
	type ButtonGroupProps,
}
