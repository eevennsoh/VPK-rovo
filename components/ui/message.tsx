import * as React from "react"

import { cn } from "@/lib/utils"

export type MessageGroupProps = React.ComponentProps<"div">

function MessageGroup({ className, ...props }: Readonly<MessageGroupProps>) {
	return (
		<div
			data-slot="message-group"
			className={cn("flex min-w-0 flex-col gap-2", className)}
			{...props}
		/>
	)
}

export interface MessageProps extends React.ComponentProps<"div"> {
	align?: "start" | "end"
}

function Message({
	className,
	align = "start",
	...props
}: Readonly<MessageProps>) {
	return (
		<div
			data-slot="message"
			data-align={align}
			className={cn(
				"group/message relative flex w-full min-w-0 gap-2 text-sm data-[align=end]:flex-row-reverse",
				className
			)}
			{...props}
		/>
	)
}

export type MessageAvatarProps = React.ComponentProps<"div">

function MessageAvatar({ className, ...props }: Readonly<MessageAvatarProps>) {
	return (
		<div
			data-slot="message-avatar"
			className={cn(
				"flex w-fit min-w-8 shrink-0 items-center justify-center self-end overflow-hidden rounded-full bg-bg-neutral text-text-subtle group-has-data-[slot=message-footer]/message:-translate-y-8",
				className
			)}
			{...props}
		/>
	)
}

export type MessageContentProps = React.ComponentProps<"div">

function MessageContent({ className, ...props }: Readonly<MessageContentProps>) {
	return (
		<div
			data-slot="message-content"
			className={cn(
				"flex w-full min-w-0 flex-col gap-2.5 wrap-break-word group-data-[align=end]/message:*:data-slot:self-end",
				className
			)}
			{...props}
		/>
	)
}

export type MessageHeaderProps = React.ComponentProps<"div">

function MessageHeader({ className, ...props }: Readonly<MessageHeaderProps>) {
	return (
		<div
			data-slot="message-header"
			className={cn(
				"flex max-w-full min-w-0 items-center px-3 text-xs font-medium text-text-subtlest group-has-data-[variant=ghost]/message:px-0",
				className
			)}
			{...props}
		/>
	)
}

export type MessageFooterProps = React.ComponentProps<"div">

function MessageFooter({ className, ...props }: Readonly<MessageFooterProps>) {
	return (
		<div
			data-slot="message-footer"
			className={cn(
				"flex max-w-full min-w-0 items-center px-3 text-xs font-medium text-text-subtlest group-has-data-[variant=ghost]/message:px-0 group-data-[align=end]/message:justify-end",
				className
			)}
			{...props}
		/>
	)
}

export {
	MessageGroup,
	Message,
	MessageAvatar,
	MessageContent,
	MessageFooter,
	MessageHeader,
}
