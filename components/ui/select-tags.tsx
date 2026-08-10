"use client"

import type { ComponentProps, SyntheticEvent } from "react"

import { Tag, type TagProps } from "@/components/ui/tag"
import { cn } from "@/lib/utils"

/** Keep Tag remove from toggling the surrounding SelectTrigger. */
function stopSelectToggle(event: SyntheticEvent): void {
	const target = event.target
	if (!(target instanceof Element) || !target.closest("button")) {
		return
	}
	event.preventDefault()
	event.stopPropagation()
}

type SelectTagsProps = ComponentProps<"span">

/**
 * Flex row for labels + removable tags inside a SelectTrigger with `tags`.
 * Use with single- or multi-select `SelectValue` render props.
 */
function SelectTags({ className, ...props }: Readonly<SelectTagsProps>) {
	return (
		<span
			data-slot="select-tags"
			className={cn("inline-flex min-w-0 flex-wrap items-center gap-1.5", className)}
			{...props}
		/>
	)
}

type SelectTagProps = Omit<TagProps, "onMouseDown" | "onPointerDown"> & {
	/**
	 * When false, renders a non-removable Tag (still stops pointer events from
	 * bubbling into the trigger when interactive descendants are present).
	 * Defaults to true; requires `onRemove`.
	 */
	showRemove?: boolean
}

/**
 * Removable Tag for Select triggers. Pairs with `SelectTrigger tags` so the
 * host is not a native `<button>` and remove does not toggle the popup.
 */
function SelectTag({
	showRemove = true,
	onRemove,
	...props
}: Readonly<SelectTagProps>) {
	return (
		<Tag
			{...props}
			onMouseDown={stopSelectToggle}
			onPointerDown={stopSelectToggle}
			onRemove={showRemove ? onRemove : undefined}
		/>
	)
}

export {
	SelectTag,
	SelectTags,
	type SelectTagProps,
	type SelectTagsProps,
}
