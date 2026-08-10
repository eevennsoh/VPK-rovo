"use client"

import * as React from "react"
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

function Tooltip({
	actionsRef,
	defaultOpen = false,
	onOpenChange,
	open,
	...props
}: Readonly<TooltipProps>) {
	const internalActionsRef = React.useRef<TooltipPrimitive.Root.Actions | null>(null)
	const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
	const isOpen = open ?? uncontrolledOpen

	React.useImperativeHandle(actionsRef, () => ({
		close: () => internalActionsRef.current?.close(),
		unmount: () => internalActionsRef.current?.unmount(),
	}))

	const handleOpenChange = React.useCallback<
		NonNullable<TooltipPrimitive.Root.Props["onOpenChange"]>
	>((nextOpen, eventDetails) => {
		if (open === undefined) {
			setUncontrolledOpen(nextOpen)
		}
		onOpenChange?.(nextOpen, eventDetails)
	}, [onOpenChange, open])

	React.useEffect(() => {
		if (!isOpen) {
			return undefined
		}

		const handleScroll = () => internalActionsRef.current?.close()
		window.addEventListener("scroll", handleScroll, {
			capture: true,
			passive: true,
		})

		return () => window.removeEventListener("scroll", handleScroll, true)
	}, [isOpen])

	return (
		<TooltipPrimitive.Root
			actionsRef={internalActionsRef}
			data-slot="tooltip"
			defaultOpen={defaultOpen}
			onOpenChange={handleOpenChange}
			open={open}
			{...props}
		/>
	)
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
			"align" | "alignOffset" | "anchor" | "side" | "sideOffset"
		> {
	positionerClassName?: string
}

function TooltipContent({
	className,
	side = "top",
	sideOffset = 4,
	align = "center",
	alignOffset = 0,
	anchor,
	positionerClassName,
	children,
	...props
}: Readonly<TooltipContentProps>) {
	return (
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Positioner
				align={align}
				alignOffset={alignOffset}
				anchor={anchor}
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
