"use client"

import { memo, type ComponentProps } from "react"
import { Streamdown } from "streamdown"

import {
	streamdownComponents,
	streamdownPlugins,
} from "@/components/ui-custom/message-markdown"
import { cn } from "@/lib/utils"

type ResponseProps = ComponentProps<typeof Streamdown>

export const Response = memo(
	({ className, ...props }: ResponseProps) => (
		<Streamdown
			className={cn(
				"typeset typeset-chat size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
				className
			)}
			components={streamdownComponents}
			plugins={streamdownPlugins}
			{...props}
		/>
	),
	(prevProps, nextProps) => prevProps.children === nextProps.children
)

Response.displayName = "Response"