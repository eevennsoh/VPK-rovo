"use client"

import * as React from "react"

import {
	Table,
	TableBody,
	type TableProps,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export interface ListColumn {
	/** Optional width/utility class applied to this column's `<col>`. */
	className?: string
}

export type ListRootProps = React.ComponentProps<"section">

function ListRoot({ className, ...props }: Readonly<ListRootProps>) {
	return (
		<section
			data-slot="list"
			className={cn("flex w-full flex-col gap-2", className)}
			{...props}
		/>
	)
}

export type ListHeadingProps = React.ComponentProps<"h2">

function ListHeading({ className, ...props }: Readonly<ListHeadingProps>) {
	return (
		<h2
			data-slot="list-heading"
			className={cn(
				"px-1.5 text-xs font-semibold leading-4 text-text-subtlest",
				className,
			)}
			{...props}
		/>
	)
}

export interface ListTableProps extends Omit<TableProps, "children"> {
	columns: readonly ListColumn[]
	children: React.ReactNode
}

function ListTable({
	columns,
	className,
	children,
	...props
}: Readonly<ListTableProps>) {
	return (
		<Table
			data-slot="list-table"
			className={cn("min-w-full table-fixed", className)}
			{...props}
		>
			<colgroup>
				{columns.map((column, columnIndex) => (
					<col key={columnIndex} className={column.className} />
				))}
			</colgroup>
			<TableBody>{children}</TableBody>
		</Table>
	)
}

export const List = {
	Root: ListRoot,
	Heading: ListHeading,
	Table: ListTable,
} as const

export { ListRoot, ListHeading, ListTable }
