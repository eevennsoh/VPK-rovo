"use client";

import { Children, type ComponentProps, type ReactNode } from "react";

import { InputGroupButton } from "@/components/ui/input-group";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type PromptInputButtonTooltip =
	| string
	| {
			content: ReactNode;
			shortcut?: string;
			side?: ComponentProps<typeof TooltipContent>["side"];
			delay?: number;
		};

export type PromptInputButtonProps = ComponentProps<typeof InputGroupButton> & {
	tooltip?: PromptInputButtonTooltip;
};

export const PromptInputButton = ({
	variant = "ghost",
	className,
	size,
	tooltip,
	...props
}: Readonly<PromptInputButtonProps>) => {
	const resolvedSize =
		size ?? (Children.count(props.children) > 1 ? "sm" : "icon-sm");

	const button = (
		<InputGroupButton
			className={cn(className)}
			size={resolvedSize}
			type="button"
			variant={variant}
			{...props}
		/>
	);

	if (!tooltip) {
		return button;
	}

	const tooltipContent =
		typeof tooltip === "string" ? tooltip : tooltip.content;
	const shortcut = typeof tooltip === "string" ? undefined : tooltip.shortcut;
	const side = typeof tooltip === "string" ? "top" : (tooltip.side ?? "top");
	const delay = typeof tooltip === "string" ? undefined : tooltip.delay;

	const tooltipElement = (
		<Tooltip>
			<TooltipTrigger render={button} />
			<TooltipContent side={side}>
				{tooltipContent}
				{shortcut ? (
					<span className="ml-2 text-muted-foreground">{shortcut}</span>
				) : null}
			</TooltipContent>
		</Tooltip>
	);

	return delay != null ? (
		<TooltipProvider delay={delay}>{tooltipElement}</TooltipProvider>
	) : (
		tooltipElement
	);
};
