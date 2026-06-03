"use client"

import * as React from "react"

import { Button, type ButtonProps } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down"

export interface SplitButtonItem {
	label: React.ReactNode
	/**
	 * Stable React key for the menu item. Required when `label` is not a
	 * plain string (e.g. a `Lozenge` element); defaults to `label` for the
	 * common string-label case.
	 */
	key?: string
	onSelect?: () => void
	disabled?: boolean
}

export interface SplitButtonProps extends Omit<ButtonProps, "children"> {
	label: React.ReactNode
	items: ReadonlyArray<SplitButtonItem>
	menuLabel?: string
}

/**
 * ADS split button visual specs:
 * - Border radius: 6px (rounded-md)
 * - Primary padding: 6px 12px (py-1.5 px-3)
 * - Trigger width: 32px (size-8)
 * - Height: 32px (h-8)
 * - Outline appearance: gray container outline + gray separator (border-right on primary button)
 * - Solid variants: no container outline + white separator at 64% opacity
 */
function SplitButton({
	label,
	items,
	menuLabel = "More actions",
	className,
	...props
}: Readonly<SplitButtonProps>) {
	const isOutlineVariant = props.variant === "outline"

	return (
		<ButtonGroup
			data-slot="split-button"
			className={cn(
				"rounded-md",
				// Override ButtonGroup's rounded-r-lg! on last child with 6px
				"[&>[data-slot]:not(:has(~[data-slot]))]:rounded-r-md!",
				// ADS default appearance has unified outline on container
				isOutlineVariant && "outline outline-1 outline-border",
				className
			)}
		>
			<Button
				{...props}
				className={cn(
					// ADS uses 6px border radius
					"rounded-md rounded-r-none",
					// ADS primary padding: 6px 12px
					"px-3 py-1.5",
					// Separator: 1px border-right
						// Outline variant: remove all borders (container has outline), add gray separator
						// Solid variants: add white separator at 64% opacity
						isOutlineVariant
							? "border-0 border-r border-r-border"
							: "border-r border-r-border-inverse/65"
					)}
				>
				{label}
			</Button>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							variant={props.variant}
							aria-label={menuLabel}
							disabled={props.disabled}
							className={cn(
								// ADS trigger: 32x32, remove left radius
								"size-8 rounded-l-none px-0",
								// Remove individual border for outline variant
								isOutlineVariant && "border-0"
							)}
						>
							<ChevronDownIcon label="" />
						</Button>
					}
				/>
				<DropdownMenuContent>
					{items.map((item, index) => (
						<DropdownMenuItem
							key={item.key ?? (typeof item.label === "string" ? item.label : index)}
							onSelect={item.onSelect}
							disabled={item.disabled}
						>
							{item.label}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>
		</ButtonGroup>
	)
}

export { SplitButton }
