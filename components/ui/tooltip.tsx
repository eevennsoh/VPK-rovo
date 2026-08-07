"use client"

import type * as React from "react"
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

type TooltipProviderProps = TooltipPrimitive.Provider.Props & {
	delay?: number
}

function TooltipProvider({
	delay = 0,
	...props
}: Readonly<TooltipProviderProps>) {
	return (
		<TooltipPrimitive.Provider
			data-slot="tooltip-provider"
			delay={delay}
			{...props}
		/>
	)
}

type TooltipProps = TooltipPrimitive.Root.Props

function Tooltip(props: Readonly<TooltipProps>) {
	return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

type TooltipTriggerProps = TooltipPrimitive.Trigger.Props

function TooltipTrigger(props: Readonly<TooltipTriggerProps>) {
	return (
		<TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
	)
}

interface TooltipContentProps
	extends TooltipPrimitive.Popup.Props,
		Pick<
			TooltipPrimitive.Positioner.Props,
			"align" | "alignOffset" | "side" | "sideOffset"
		> {
	positionerClassName?: string
}

function TooltipContent({
	className,
	side = "top",
	sideOffset = 4,
	align = "center",
	alignOffset = 0,
	positionerClassName,
	children,
	...props
}: Readonly<TooltipContentProps>) {
	return (
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Positioner
				align={align}
				alignOffset={alignOffset}
				side={side}
				sideOffset={sideOffset}
				className={cn("isolate z-[200]", positionerClassName)}
			>
				<TooltipPrimitive.Popup
					data-slot="tooltip-content"
					className={cn(
						// Opacity-only enter/exit. Side-axis translate compounds with Floating UI
						// Positioner updates (and resizing triggers like WorkItemKeyCopy) into
						// diagonal motion; scale from --transform-origin did the same.
						"w-fit max-w-xs rounded-md bg-bg-neutral-bold px-3 py-1.5 text-xs text-text-inverse outline-hidden transition-opacity duration-fast ease-out motion-reduce:transition-none data-starting-style:opacity-0 data-ending-style:opacity-0",
						className
					)}
					{...props}
				>
					{children}
				</TooltipPrimitive.Popup>
			</TooltipPrimitive.Positioner>
		</TooltipPrimitive.Portal>
	)
}

export {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
	TooltipProvider,
	type TooltipProps,
	type TooltipTriggerProps,
	type TooltipContentProps,
	type TooltipProviderProps,
}
