"use client"

import * as React from "react"

import { Button, type ButtonProps } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down"
import CheckMarkIcon from "@atlaskit/icon/core/check-mark"

export interface SplitButtonItem {
	label: React.ReactNode
	/**
	 * Stable React key for the menu item. Required when `label` is not a
	 * plain string (e.g. a `Lozenge` element); defaults to `label` for the
	 * common string-label case.
	 */
	key?: string
	/** Render a separator immediately before this item. */
	separatorBefore?: boolean
	/**
	 * Pin this item to the top of the (scrollable) menu so it stays visible
	 * while the remaining items scroll beneath it.
	 */
	sticky?: boolean
	/**
	 * Marks this item as the currently-selected option. Renders a trailing
	 * check-mark icon, matching the standard dropdown selected-item visual.
	 */
	selected?: boolean
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
					<DropdownMenuGroup>
						{items.map((item, index) => {
							const itemKey = item.key ?? (typeof item.label === "string" ? item.label : index)

							return (
								<React.Fragment key={itemKey}>
									{item.separatorBefore && index > 0 ? <DropdownMenuSeparator /> : null}
									<DropdownMenuItem
										onSelect={item.onSelect}
										disabled={item.disabled}
										className={cn(item.sticky && "bg-popover sticky top-0 z-10")}
										elemAfter={item.selected ? <CheckMarkIcon label="Selected" /> : undefined}
									>
										{item.label}
									</DropdownMenuItem>
								</React.Fragment>
							)
						})}
					</DropdownMenuGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		</ButtonGroup>
	)
}

export { SplitButton }
