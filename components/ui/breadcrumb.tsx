import * as React from "react"
import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"

import { Icon } from "@/components/ui/icon"
import { IconTile } from "@/components/ui/icon-tile"
import { cn } from "@/lib/utils"
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal"

interface BreadcrumbLabelSlots {
	before?: React.ReactNode
	after?: React.ReactNode
}

interface BreadcrumbLabelProps
	extends React.ComponentProps<"span">,
		BreadcrumbLabelSlots {}

type BreadcrumbLinkProps = useRender.ComponentProps<"a"> & BreadcrumbLabelSlots

interface BreadcrumbPageProps
	extends React.ComponentProps<"span">,
		BreadcrumbLabelSlots {}

type BreadcrumbSize = "medium" | "small"

interface BreadcrumbProps extends React.ComponentProps<"nav"> {
	size?: BreadcrumbSize
}

const BreadcrumbSizeContext = React.createContext<BreadcrumbSize>("medium")

const breadcrumbSizeClassNames = {
	list: {
		medium: "text-sm leading-5",
		small: "text-xs leading-4",
	},
	control: {
		medium: "h-6 text-sm leading-5",
		small: "h-5 text-xs leading-4",
	},
	label: {
		medium: "gap-1",
		small: "gap-1",
	},
	slot: {
		medium:
			"size-4 [&_[data-slot=icon-tile]]:size-4! [&_[data-slot=icon]]:size-4! [&_[data-slot=icon]>span]:size-4! [&_[data-slot=icon]_svg]:size-4! [&_[data-slot=tile]]:size-4!",
		small:
			"size-3 [&_[data-slot=icon-tile]]:size-3! [&_[data-slot=icon]]:size-3! [&_[data-slot=icon]>span]:size-3! [&_[data-slot=icon]_svg]:size-3! [&_[data-slot=tile]]:size-3!",
	},
	separator: {
		medium: "px-2 py-0.5",
		small: "px-1.5 py-0.5",
	},
	ellipsis: {
		medium: "size-6",
		small: "size-6",
	},
} satisfies Record<string, Record<BreadcrumbSize, string>>

function useBreadcrumbSize() {
	return React.use(BreadcrumbSizeContext)
}

function getBreadcrumbLabelSlotClassName(size: BreadcrumbSize) {
	return cn(
		"inline-flex shrink-0 items-center justify-center leading-none [&_[data-slot=icon]>span]:inline-flex! [&_[data-slot=icon]>span]:items-center! [&_[data-slot=icon]>span]:justify-center!",
		breadcrumbSizeClassNames.slot[size]
	)
}

function hasLabelSlots({ before, after }: BreadcrumbLabelSlots) {
	return before !== undefined || after !== undefined
}

function getLabelChildren(
	render: BreadcrumbLinkProps["render"],
	children: React.ReactNode
) {
	if (children !== undefined) {
		return children
	}

	if (React.isValidElement<{ children?: React.ReactNode }>(render)) {
		return render.props.children
	}

	return children
}

function Breadcrumb({
	className,
	size = "medium",
	...props
}: Readonly<BreadcrumbProps>) {
	return (
		<BreadcrumbSizeContext value={size}>
			<nav
				aria-label="breadcrumb"
				data-slot="breadcrumb"
				data-size={size}
				className={cn("min-w-0 overflow-hidden", className)}
				{...props}
			/>
		</BreadcrumbSizeContext>
	)
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<"ol">) {
	const size = useBreadcrumbSize()

	return (
		<ol
			data-slot="breadcrumb-list"
			className={cn(
				"text-text-subtlest flex min-w-0 list-none flex-nowrap items-center overflow-hidden p-0 font-normal",
				breadcrumbSizeClassNames.list[size],
				className
			)}
			{...props}
		/>
	)
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<"li">) {
	return (
		<li
			data-slot="breadcrumb-item"
			className={cn("inline-flex min-w-0 max-w-full items-center", className)}
			{...props}
		/>
	)
}

function BreadcrumbLabel({
	before,
	after,
	className,
	children,
	...props
}: Readonly<BreadcrumbLabelProps>) {
	const size = useBreadcrumbSize()

	return (
		<span
			data-slot="breadcrumb-label"
			className={cn(
				"inline-flex min-w-0 items-center",
				breadcrumbSizeClassNames.label[size],
				className
			)}
			{...props}
		>
			{before ? (
				<span
					data-slot="breadcrumb-label-before"
					className={getBreadcrumbLabelSlotClassName(size)}
				>
					{before}
				</span>
			) : null}
			<span data-slot="breadcrumb-label-text" className="min-w-0">
				{children}
			</span>
			{after ? (
				<span
					data-slot="breadcrumb-label-after"
					className={getBreadcrumbLabelSlotClassName(size)}
				>
					{after}
				</span>
			) : null}
		</span>
	)
}

function BreadcrumbLink({
	before,
	after,
	children,
	className,
	render,
	...props
}: Readonly<BreadcrumbLinkProps>) {
	const size = useBreadcrumbSize()
	const content = hasLabelSlots({ before, after }) ? (
		<BreadcrumbLabel before={before} after={after}>
			{getLabelChildren(render, children)}
		</BreadcrumbLabel>
	) : (
		children
	)

	return useRender({
		defaultTagName: "a",
		props: mergeProps<"a">(
			{
				className: cn(
					"inline-flex min-w-0 max-w-full items-center rounded-sm bg-transparent px-0 font-normal text-text-subtlest no-underline transition-colors hover:text-text-subtlest hover:underline active:text-text",
					breadcrumbSizeClassNames.control[size],
					className
				),
				...(content !== undefined ? { children: content } : {}),
			},
			props
		),
		render,
		state: {
			slot: "breadcrumb-link",
		},
	})
}

function BreadcrumbPage({
	before,
	after,
	className,
	children,
	...props
}: Readonly<BreadcrumbPageProps>) {
	const size = useBreadcrumbSize()
	const content = hasLabelSlots({ before, after }) ? (
		<BreadcrumbLabel before={before} after={after}>
			{children}
		</BreadcrumbLabel>
	) : (
		children
	)

	return (
		<span
			data-slot="breadcrumb-page"
			aria-disabled="true"
			aria-current="page"
			className={cn(
				"inline-flex min-w-0 max-w-full items-center text-text font-normal",
				breadcrumbSizeClassNames.control[size],
				className
			)}
			{...props}
		>
			{content}
		</span>
	)
}

function BreadcrumbSeparator({
	children,
	className,
	...props
}: React.ComponentProps<"li">) {
	const size = useBreadcrumbSize()

	return (
		<li
			data-slot="breadcrumb-separator"
			role="presentation"
			aria-hidden="true"
			className={cn(
				"flex shrink-0 items-center text-text-subtlest select-none [&>svg]:size-3",
				breadcrumbSizeClassNames.separator[size],
				className
			)}
			{...props}
		>
			{children ?? "/"}
		</li>
	)
}

function BreadcrumbEllipsis({
	className,
	...props
}: React.ComponentProps<"span">) {
	const size = useBreadcrumbSize()

	return (
		<span
			data-slot="breadcrumb-ellipsis"
			role="presentation"
			aria-hidden="true"
			className={cn(
				"flex shrink-0 items-center justify-center",
				breadcrumbSizeClassNames.ellipsis[size],
				className
			)}
			{...props}
		>
			<IconTile
				aria-hidden
				as="span"
				className="text-icon-subtlest"
				icon={
					<Icon
						aria-hidden
						render={<ShowMoreHorizontalIcon label="" size="small" />}
					/>
				}
				iconSize="small"
				label="More"
				size="small"
				variant="transparent"
			/>
			<span className="sr-only">More</span>
		</span>
	)
}

export {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbLabel,
	BreadcrumbLink,
	BreadcrumbPage,
	BreadcrumbSeparator,
	BreadcrumbEllipsis,
}
