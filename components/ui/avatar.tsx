"use client"

// oxlint-disable react-doctor/prefer-module-scope-pure-function -- These helpers are intentionally local to the component/demo because they depend on the surrounding interaction contract.

// oxlint-disable react-doctor/prefer-tag-over-role -- This file uses ARIA roles for custom generated visuals or composite widgets where the suggested native tag would change semantics or behavior.

import * as React from "react"
import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import { motion, useReducedMotion, type MotionProps, type Transition } from "motion/react"
import type { NewCoreIconProps } from "@atlaskit/icon/base-new"
import AiAgentIcon from "@atlaskit/icon/core/ai-agent"
import CrossCircleIcon from "@atlaskit/icon/core/cross-circle"
import LockLockedIcon from "@atlaskit/icon/core/lock-locked"
import PersonIcon from "@atlaskit/icon/core/person"
import StatusVerifiedIcon from "@atlaskit/icon/core/status-verified"
import { cva, type VariantProps } from "class-variance-authority"

import { Icon } from "@/components/ui/icon"
import { cn } from "@/lib/utils"

const HEXAGON_CLIP =
	"[clip-path:polygon(45%_1.34%,46.58%_0.6%,48.26%_0.15%,50%_0%,51.74%_0.15%,53.42%_0.6%,55%_1.34%,89.64%_21.34%,91.07%_22.34%,92.3%_23.57%,93.3%_25%,94.04%_26.58%,94.49%_28.26%,94.64%_30%,94.64%_70%,94.49%_71.74%,94.04%_73.42%,93.3%_75%,92.3%_76.43%,91.07%_77.66%,89.64%_78.66%,55%_98.66%,53.42%_99.4%,51.74%_99.85%,50%_100%,48.26%_99.85%,46.58%_99.4%,45%_98.66%,10.36%_78.66%,8.93%_77.66%,7.7%_76.43%,6.7%_75%,5.96%_73.42%,5.51%_71.74%,5.36%_70%,5.36%_30%,5.51%_28.26%,5.96%_26.58%,6.7%_25%,7.7%_23.57%,8.93%_22.34%,10.36%_21.34%)]"

const HEXAGON_POINTS =
	"45,1.34 46.58,0.6 48.26,0.15 50,0 51.74,0.15 53.42,0.6 55,1.34 89.64,21.34 91.07,22.34 92.3,23.57 93.3,25 94.04,26.58 94.49,28.26 94.64,30 94.64,70 94.49,71.74 94.04,73.42 93.3,75 92.3,76.43 91.07,77.66 89.64,78.66 55,98.66 53.42,99.4 51.74,99.85 50,100 48.26,99.85 46.58,99.4 45,98.66 10.36,78.66 8.93,77.66 7.7,76.43 6.7,75 5.96,73.42 5.51,71.74 5.36,70 5.36,30 5.51,28.26 5.96,26.58 6.7,25 7.7,23.57 8.93,22.34 10.36,21.34"

// motion.avatar.* recipe expressed in vpk tokens (Motion for React can't read var(), so use the resolved values — see motion-decisions.md).
const AVATAR_ENTER_TRANSITION: Transition = { duration: 0.15, ease: [0.4, 1, 0.6, 1] } // duration-normal + ease-out-practical
const AVATAR_EXIT_TRANSITION: Transition = { duration: 0.1, ease: [0.6, 0, 0.8, 0.6] } // duration-fast + ease-in
const AVATAR_HOVER_SPRING: Transition = { type: "spring", stiffness: 300, damping: 18 } // mirrors ease-spring / motion.avatar.hovered

const avatarVariants = cva(
	"group/avatar relative flex shrink-0 select-none after:absolute after:inset-0 after:border after:mix-blend-darken dark:after:mix-blend-lighten after:border-border",
	{
		variants: {
			size: {
				xs: "size-4",
				sm: "size-6",
				default: "size-8",
				lg: "size-10",
				xl: "size-12",
				"2xl": "size-24",
			},
			shape: {
				circle: "rounded-full after:rounded-full",
				square: "rounded-[6px] after:rounded-[6px]",
				hexagon: "isolate after:border-0",
			},
		},
		defaultVariants: {
			size: "default",
			shape: "circle",
		},
	}
)

type AvatarPresence = "online" | "busy" | "offline" | "focus"
type AvatarUnassignedKind = "person" | "agent"
type AvatarSize = NonNullable<VariantProps<typeof avatarVariants>["size"]>

const AvatarGroupContext = React.createContext(false)

interface AvatarProps
	extends AvatarPrimitive.Root.Props,
		VariantProps<typeof avatarVariants> {
	disabled?: boolean
	label?: string
}

function AvatarHexagonBorder() {
	return (
		<svg
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 z-[1] size-full overflow-visible p-px text-border! mix-blend-darken dark:mix-blend-lighten"
			focusable="false"
			viewBox="0 0 100 100"
		>
			<polygon
				fill="none"
				points={HEXAGON_POINTS}
				stroke="currentColor"
				strokeWidth="1"
				vectorEffect="non-scaling-stroke"
			/>
		</svg>
	)
}

function Avatar({
	children,
	className,
	size = "default",
	shape = "circle",
	disabled = false,
	label,
	...props
}: Readonly<AvatarProps>) {
	const isInAvatarGroup = React.use(AvatarGroupContext)
	const rootClassName = cn(
		avatarVariants({ size, shape }),
		disabled && "opacity-(--opacity-disabled) pointer-events-none grayscale",
		className
	)

	// avatar.enter (scale 80→100 + fade), avatar.exit (100→80 + fade), avatar.hovered (spring 100→112%).
	// Exit only plays when a consumer wraps keyed avatars in their own <AnimatePresence>; enter + hover
	// work everywhere. Pass `initial={false}` at a call site to skip mount-enter.
	// Disabled avatars opt out entirely: animating opacity would write inline `opacity: 1` and override
	// the `opacity-(--opacity-disabled)` dim class, and a disabled avatar should not react to hover.
	const reduce = useReducedMotion()
	const motionProps: MotionProps =
		reduce || disabled
			? { initial: false }
			: {
					initial: { scale: 0.8, opacity: 0 },
					animate: { scale: 1, opacity: 1, transition: AVATAR_ENTER_TRANSITION },
					exit: { scale: 0.8, opacity: 0, transition: AVATAR_EXIT_TRANSITION },
					whileHover: { scale: 1.12, zIndex: 10, transition: AVATAR_HOVER_SPRING },
					style: { willChange: "transform, opacity" },
				}

	// Hexagon avatars shape their content with a clip-path. A clip-path also clips
	// every descendant, so corner overlays (badges, presence/status dots) would be
	// sliced along the hexagon edge. Apply the clip to an inner frame that holds the
	// content, and render overlays as unclipped siblings on the root.
	if (shape === "hexagon") {
		const childArray = React.Children.toArray(children)
		const isOverlay = (child: React.ReactNode) =>
			React.isValidElement(child) && AVATAR_OVERLAY_TYPES.has(child.type)

		return (
			<AvatarPrimitive.Root
				data-slot="avatar"
				data-size={size}
				data-shape={shape}
				aria-label={label}
				role={label ? "img" : undefined}
				aria-disabled={disabled || undefined}
				className={rootClassName}
				render={<motion.span {...motionProps} />}
				{...props}
			>
				{isInAvatarGroup ? (
					<span
						aria-hidden="true"
						className={cn("pointer-events-none absolute -inset-0.5 -z-10 bg-background", HEXAGON_CLIP)}
						data-slot="avatar-hexagon-group-border"
					/>
				) : null}
				<span className={cn("relative flex size-full items-center justify-center", HEXAGON_CLIP)}>
					{childArray.filter((child) => !isOverlay(child))}
				</span>
				<AvatarHexagonBorder />
				{childArray.filter(isOverlay)}
			</AvatarPrimitive.Root>
		)
	}

	return (
		<AvatarPrimitive.Root
			data-slot="avatar"
			data-size={size}
			data-shape={shape}
			aria-label={label}
			role={label ? "img" : undefined}
			aria-disabled={disabled || undefined}
			className={rootClassName}
			render={<motion.span {...motionProps} />}
			{...props}
		>
			{children}
		</AvatarPrimitive.Root>
	)
}

type AvatarImageProps = AvatarPrimitive.Image.Props

function AvatarImage({ className, ...props }: Readonly<AvatarImageProps>) {
	return (
		<AvatarPrimitive.Image
			data-slot="avatar-image"
			className={cn(
				"rounded-full aspect-square size-full object-cover group-data-[shape=square]/avatar:rounded-[6px]",
				`group-data-[shape=hexagon]/avatar:rounded-none group-data-[shape=hexagon]/avatar:${HEXAGON_CLIP}`,
				className
			)}
			{...props}
		/>
	)
}

type AvatarFallbackProps = AvatarPrimitive.Fallback.Props

function AvatarFallback({
	className,
	...props
}: Readonly<AvatarFallbackProps>) {
	return (
		<AvatarPrimitive.Fallback
			data-slot="avatar-fallback"
			className={cn(
				"bg-muted text-foreground rounded-full flex size-full items-center justify-center text-sm group-data-[size=xs]/avatar:text-[8px] group-data-[size=sm]/avatar:text-xs group-data-[size=xl]/avatar:text-lg group-data-[size=2xl]/avatar:text-3xl group-data-[shape=square]/avatar:rounded-[6px]",
				`group-data-[shape=hexagon]/avatar:rounded-none group-data-[shape=hexagon]/avatar:${HEXAGON_CLIP}`,
				className
			)}
			{...props}
		/>
	)
}

const avatarUnassignedIconSizeMap: Record<AvatarSize, NewCoreIconProps["size"]> = {
	xs: "small",
	sm: "small",
	default: "medium",
	lg: "medium",
	xl: "medium",
	"2xl": "medium",
}

interface AvatarUnassignedProps extends Omit<AvatarProps, "shape"> {
	kind?: AvatarUnassignedKind
}

function AvatarUnassigned({
	children,
	className,
	kind = "person",
	label,
	size = "default",
	...props
}: Readonly<AvatarUnassignedProps>) {
	const isAgent = kind === "agent"
	const IconComponent = isAgent ? AiAgentIcon : PersonIcon
	const resolvedLabel = label ?? (isAgent ? "Unassigned agent" : "Unassigned person")
	const resolvedSize = size ?? "default"

	return (
		<Avatar
			data-unassigned={kind}
			className={cn(
				"items-center justify-center text-icon-subtle after:border-border",
				!isAgent && "bg-muted",
				className
			)}
			label={resolvedLabel}
			shape={isAgent ? "hexagon" : "circle"}
			size={resolvedSize}
			{...props}
		>
			<span className={cn(
				"flex items-center justify-center text-icon-subtle",
				isAgent && "size-full bg-muted"
			)}>
				<Icon
					aria-hidden
					className="text-icon-subtle"
					render={
						<IconComponent
							color="currentColor"
							label=""
							size={avatarUnassignedIconSizeMap[resolvedSize]}
						/>
					}
				/>
			</span>
			{children}
		</Avatar>
	)
}

const presenceColorMap: Record<AvatarPresence, string> = {
	online: "bg-success",
	busy: "bg-destructive",
	offline: "bg-bg-neutral-bold",
	focus: "bg-discovery",
}

interface AvatarPresenceIndicatorProps extends React.ComponentProps<"span"> {
	presence: AvatarPresence
}

function AvatarPresenceIndicator({
	className,
	presence,
	...props
}: Readonly<AvatarPresenceIndicatorProps>) {
	return (
		<span
			data-slot="avatar-presence"
			role="img"
			aria-label={presence}
			className={cn(
				"ring-background absolute right-0 bottom-0 z-10 rounded-full ring-2",
				"group-data-[size=xs]/avatar:size-1.5",
				"group-data-[size=sm]/avatar:size-2",
				"group-data-[size=default]/avatar:size-2.5",
				"group-data-[size=lg]/avatar:size-3",
				"group-data-[size=xl]/avatar:size-3.5",
				"group-data-[size=2xl]/avatar:size-6",
				presenceColorMap[presence],
				className
			)}
			{...props}
		/>
	)
}

type AvatarBadgeProps = React.ComponentProps<"span">

function AvatarBadge({ className, ...props }: Readonly<AvatarBadgeProps>) {
	return (
		<span
			data-slot="avatar-badge"
			className={cn(
				"bg-primary text-primary-foreground ring-background absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full bg-blend-color ring-2 select-none",
				"group-data-[size=xs]/avatar:size-1.5 group-data-[size=xs]/avatar:[&>svg]:hidden group-data-[size=xs]/avatar:[&>[data-slot=icon]]:scale-[0.375]",
				"group-data-[size=sm]/avatar:size-2 group-data-[size=sm]/avatar:[&>svg]:hidden group-data-[size=sm]/avatar:[&>[data-slot=icon]]:scale-50",
				"group-data-[size=default]/avatar:size-2.5 group-data-[size=default]/avatar:[&>svg]:size-2 group-data-[size=default]/avatar:[&>[data-slot=icon]]:scale-75",
				"group-data-[size=lg]/avatar:size-3 group-data-[size=lg]/avatar:[&>svg]:size-2 group-data-[size=lg]/avatar:[&>[data-slot=icon]]:scale-75",
				"group-data-[size=xl]/avatar:size-3.5 group-data-[size=xl]/avatar:[&>svg]:size-2.5 group-data-[size=xl]/avatar:[&>[data-slot=icon]]:scale-100",
				"group-data-[size=2xl]/avatar:size-6 group-data-[size=2xl]/avatar:[&>svg]:size-4 group-data-[size=2xl]/avatar:[&>[data-slot=icon]]:scale-125",
				className
			)}
			{...props}
		/>
	)
}

type AvatarCompanyBadgeProps = React.ComponentProps<"span">

function AvatarCompanyBadge({
	className,
	children,
	...props
}: Readonly<AvatarCompanyBadgeProps>) {
	return (
		<span
			data-slot="avatar-company-badge"
			className={cn(
				"absolute right-0 bottom-0 z-10 inline-flex items-center justify-center overflow-hidden rounded-lg ring-2 select-none",
				"bg-[#0C66E4] text-white ring-white",
				"group-data-[size=xs]/avatar:size-2 group-data-[size=xs]/avatar:[&_svg]:hidden",
				"group-data-[size=sm]/avatar:size-3 group-data-[size=sm]/avatar:[&_svg]:size-2",
				"group-data-[size=default]/avatar:size-3.5 group-data-[size=default]/avatar:[&_svg]:size-2",
				"group-data-[size=lg]/avatar:size-4 group-data-[size=lg]/avatar:[&_svg]:size-2.5",
				"group-data-[size=xl]/avatar:size-4 group-data-[size=xl]/avatar:[&_svg]:size-2.5",
				"group-data-[size=2xl]/avatar:size-6 group-data-[size=2xl]/avatar:[&_svg]:size-4",
				className,
				"bg-[#0C66E4] text-white"
			)}
			{...props}
		>
			{children}
		</span>
	)
}

type AvatarProjectBadgeProps = React.ComponentProps<"span">

function AvatarProjectBadge({
	className,
	children,
	...props
}: Readonly<AvatarProjectBadgeProps>) {
	return (
		<span
			data-slot="avatar-project-badge"
			className={cn(
				"bg-muted ring-background absolute right-0 bottom-0 z-10 inline-flex items-center justify-center overflow-hidden rounded-xs ring-2 select-none [&_img]:size-full [&_img]:object-cover",
				"group-data-[size=xs]/avatar:size-2 group-data-[size=xs]/avatar:[&_svg]:hidden",
				"group-data-[size=sm]/avatar:size-3 group-data-[size=sm]/avatar:[&_svg]:size-2",
				"group-data-[size=default]/avatar:size-3.5 group-data-[size=default]/avatar:[&_svg]:size-2",
				"group-data-[size=lg]/avatar:size-4 group-data-[size=lg]/avatar:[&_svg]:size-2.5",
				"group-data-[size=xl]/avatar:size-4 group-data-[size=xl]/avatar:[&_svg]:size-2.5",
				"group-data-[size=2xl]/avatar:size-6 group-data-[size=2xl]/avatar:[&_svg]:size-4",
				className
			)}
			{...props}
		>
			{children}
		</span>
	)
}

type AvatarStatus = "approved" | "declined" | "locked"

const STATUS_ICON_CLASS_NAME =
	"group-data-[size=xs]/avatar:hidden group-data-[size=sm]/avatar:hidden group-data-[size=default]/avatar:[&>span>svg]:size-2 group-data-[size=lg]/avatar:[&>span>svg]:size-2 group-data-[size=xl]/avatar:[&>span>svg]:size-2.5 group-data-[size=2xl]/avatar:[&>span>svg]:size-4"
const LOCKED_STATUS_ICON_CLASS_NAME =
	"group-data-[size=xs]/avatar:hidden group-data-[size=sm]/avatar:hidden group-data-[size=default]/avatar:scale-75 group-data-[size=lg]/avatar:scale-75 group-data-[size=xl]/avatar:scale-100 group-data-[size=2xl]/avatar:scale-125"

const statusConfig: Record<AvatarStatus, { icon: typeof StatusVerifiedIcon; className: string; iconClassName: string; label: string }> = {
	approved: { icon: StatusVerifiedIcon, className: "bg-success text-success-foreground", iconClassName: STATUS_ICON_CLASS_NAME, label: "Approved" },
	declined: { icon: CrossCircleIcon, className: "bg-destructive text-destructive-foreground", iconClassName: STATUS_ICON_CLASS_NAME, label: "Declined" },
	locked: { icon: LockLockedIcon, className: "bg-background text-icon-subtle", iconClassName: LOCKED_STATUS_ICON_CLASS_NAME, label: "Locked" },
}

interface AvatarStatusIndicatorProps extends React.ComponentProps<"span"> {
	status: AvatarStatus
}

function AvatarStatusIndicator({
	className,
	status,
	...props
}: Readonly<AvatarStatusIndicatorProps>) {
	const config = statusConfig[status]
	const StatusIcon = config.icon

	return (
		<span
			data-slot="avatar-status"
			role="img"
			aria-label={config.label}
			className={cn(
				"ring-background absolute right-0 bottom-0 z-10 inline-flex items-center justify-center rounded-full ring-2",
				config.className,
				"group-data-[size=xs]/avatar:size-1.5",
				"group-data-[size=sm]/avatar:size-2",
				"group-data-[size=default]/avatar:size-2.5",
				"group-data-[size=lg]/avatar:size-3",
				"group-data-[size=xl]/avatar:size-3.5",
				"group-data-[size=2xl]/avatar:size-6",
				className
			)}
			{...props}
		>
			<Icon
				aria-hidden
				className={config.iconClassName}
				render={<StatusIcon label="" size="small" color="currentColor" />}
			/>
		</span>
	)
}

interface AvatarGroupProps extends React.ComponentProps<"div"> {
	label?: string
}

function AvatarGroup({ children, className, label, ...props }: Readonly<AvatarGroupProps>) {
	return (
		<AvatarGroupContext value>
			<div
				data-slot="avatar-group"
				role="group"
				aria-label={label}
				className={cn(
					"*:data-[slot=avatar]:ring-background group/avatar-group flex -space-x-2 has-data-[size=xs]:-space-x-1 *:data-[slot=avatar]:ring-2 [&>[data-slot=avatar][data-shape=hexagon]]:ring-0",
					className
				)}
				{...props}
			>
				{children}
			</div>
		</AvatarGroupContext>
	)
}

type AvatarGroupCountProps = React.ComponentProps<"div">

function AvatarGroupCount({
	className,
	...props
}: Readonly<AvatarGroupCountProps>) {
	return (
		<div
			data-slot="avatar-group-count"
			className={cn("bg-muted text-muted-foreground size-8 rounded-full text-xs group-has-data-[size=lg]/avatar-group:size-10 group-has-data-[size=lg]/avatar-group:text-sm group-has-data-[size=sm]/avatar-group:size-6 group-has-data-[size=xs]/avatar-group:size-4 group-has-data-[size=xs]/avatar-group:text-[8px] [&_[data-slot=icon]]:size-4 [&_svg]:size-4 group-has-data-[size=lg]/avatar-group:[&_[data-slot=icon]]:size-5 group-has-data-[size=lg]/avatar-group:[&_svg]:size-5 group-has-data-[size=sm]/avatar-group:[&_[data-slot=icon]]:size-3 group-has-data-[size=sm]/avatar-group:[&_svg]:size-3 group-has-data-[size=xs]/avatar-group:[&_[data-slot=icon]]:size-2 group-has-data-[size=xs]/avatar-group:[&_svg]:size-2 ring-background relative flex shrink-0 items-center justify-center ring-2", className)}
			{...props}
		/>
	)
}

const AVATAR_OVERLAY_TYPES: ReadonlySet<unknown> = new Set([
	AvatarBadge,
	AvatarCompanyBadge,
	AvatarProjectBadge,
	AvatarPresenceIndicator,
	AvatarStatusIndicator,
])

export {
	Avatar,
	AvatarImage,
	AvatarFallback,
	AvatarUnassigned,
	AvatarGroup,
	AvatarGroupCount,
	AvatarBadge,
	AvatarCompanyBadge,
	AvatarProjectBadge,
	AvatarPresenceIndicator,
	AvatarStatusIndicator,
	type AvatarProps,
	type AvatarImageProps,
	type AvatarFallbackProps,
	type AvatarUnassignedProps,
	type AvatarUnassignedKind,
	type AvatarBadgeProps,
	type AvatarCompanyBadgeProps,
	type AvatarProjectBadgeProps,
	type AvatarGroupProps,
	type AvatarGroupCountProps,
	type AvatarPresenceIndicatorProps,
	type AvatarPresence,
	type AvatarStatusIndicatorProps,
	type AvatarStatus,
}
