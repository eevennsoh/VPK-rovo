"use client";

import type { ComponentProps } from "react";
import CrossIcon from "@atlaskit/icon/core/cross";
import { Button } from "@/components/ui/button";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SpotlightCardProps = ComponentProps<"section">;
export type SpotlightMediaProps = ComponentProps<"div">;
export type SpotlightHeaderProps = ComponentProps<"div">;
export type SpotlightHeadlineProps = ComponentProps<"h2">;
export type SpotlightBodyProps = ComponentProps<"div">;
export type SpotlightFooterProps = ComponentProps<"div">;
export type SpotlightActionsProps = ComponentProps<"div">;
export type SpotlightControlsProps = ComponentProps<"div">;

export interface SpotlightStepCountProps extends Omit<ComponentProps<"span">, "children"> {
	/** 1-based index of the current step. */
	current: number;
	/** Total number of steps in the sequence. */
	total: number;
}

type ActionProps = ComponentProps<typeof Button>;

export interface SpotlightDismissControlProps extends Omit<ActionProps, "children"> {
	/** Accessible label for the dismiss button. @default "Dismiss" */
	label?: string;
}

// ---------------------------------------------------------------------------
// Root — dark inverse surface (neutral.bold flips per theme; text stays inverse)
// ---------------------------------------------------------------------------

function SpotlightCard({ className, style, ...props }: Readonly<SpotlightCardProps>) {
	return (
		<section
			data-slot="spotlight-card"
			className={cn(
				"flex w-80 flex-col gap-3 overflow-hidden rounded-lg bg-bg-neutral-bold p-4 text-text-inverse",
				className,
			)}
			style={{ boxShadow: token("elevation.shadow.overlay"), ...style }}
			{...props}
		/>
	);
}

function SpotlightMedia({ className, ...props }: Readonly<SpotlightMediaProps>) {
	return (
		<div
			data-slot="spotlight-media"
			className={cn(
				"-mx-4 flex items-center justify-center overflow-hidden bg-surface-sunken",
				className,
			)}
			{...props}
		/>
	);
}

function SpotlightHeader({ className, ...props }: Readonly<SpotlightHeaderProps>) {
	return (
		<div
			data-slot="spotlight-header"
			className={cn("flex items-start justify-between gap-2", className)}
			{...props}
		/>
	);
}

function SpotlightHeadline({ className, style, ...props }: Readonly<SpotlightHeadlineProps>) {
	return (
		<h2
			data-slot="spotlight-headline"
			className={cn("min-w-0 flex-1 text-text-inverse", className)}
			style={{ font: token("font.heading.xsmall"), ...style }}
			{...props}
		/>
	);
}

function SpotlightBody({ className, ...props }: Readonly<SpotlightBodyProps>) {
	return (
		<div
			data-slot="spotlight-body"
			className={cn("text-sm leading-5 text-text-inverse opacity-90", className)}
			{...props}
		/>
	);
}

function SpotlightFooter({ className, ...props }: Readonly<SpotlightFooterProps>) {
	return (
		<div
			data-slot="spotlight-footer"
			className={cn("mt-1 flex items-center justify-between gap-3", className)}
			{...props}
		/>
	);
}

function SpotlightStepCount({ current, total, className, ...props }: Readonly<SpotlightStepCountProps>) {
	return (
		<span
			data-slot="spotlight-step-count"
			className={cn("text-xs leading-4 font-medium text-text-inverse opacity-75", className)}
			{...props}
		>
			{current} of {total}
		</span>
	);
}

function SpotlightActions({ className, ...props }: Readonly<SpotlightActionsProps>) {
	return (
		<div
			data-slot="spotlight-actions"
			className={cn("flex items-center justify-end gap-1", className)}
			{...props}
		/>
	);
}

// Primary fills with the inverse-text color and labels with base text, so it is
// always the readable inverse of the card surface in both themes.
function SpotlightPrimaryAction({ className, ...props }: Readonly<ActionProps>) {
	return (
		<Button
			data-slot="spotlight-primary-action"
			size="compact"
			className={cn("bg-text-inverse text-text hover:bg-text-inverse/90 active:bg-text-inverse/80", className)}
			{...props}
		/>
	);
}

function SpotlightSecondaryAction({ className, ...props }: Readonly<ActionProps>) {
	return (
		<Button
			data-slot="spotlight-secondary-action"
			variant="ghost"
			size="compact"
			className={cn(
				"text-text-inverse hover:bg-text-inverse/10 active:bg-text-inverse/15 [&_svg]:text-current",
				className,
			)}
			{...props}
		/>
	);
}

function SpotlightControls({ className, ...props }: Readonly<SpotlightControlsProps>) {
	return (
		<div
			data-slot="spotlight-controls"
			className={cn("flex shrink-0 items-center gap-0.5", className)}
			{...props}
		/>
	);
}

function SpotlightDismissControl({ label = "Dismiss", className, ...props }: Readonly<SpotlightDismissControlProps>) {
	return (
		<Button
			data-slot="spotlight-dismiss-control"
			variant="ghost"
			size="icon-compact"
			aria-label={label}
			className={cn("-mr-1 -mt-1 text-text-inverse hover:bg-text-inverse/10 [&_svg]:text-current", className)}
			{...props}
		>
			<CrossIcon label="" size="small" />
		</Button>
	);
}

export {
	SpotlightCard,
	SpotlightMedia,
	SpotlightHeader,
	SpotlightHeadline,
	SpotlightBody,
	SpotlightFooter,
	SpotlightStepCount,
	SpotlightActions,
	SpotlightPrimaryAction,
	SpotlightSecondaryAction,
	SpotlightControls,
	SpotlightDismissControl,
};
