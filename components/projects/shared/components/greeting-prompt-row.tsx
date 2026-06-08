"use client";

import { motion, type Variants } from "motion/react";
import Image from "next/image";
import type { ComponentType, ReactNode } from "react";

import { IconTile } from "@/components/ui/icon-tile";
import { cn } from "@/lib/utils";

/**
 * Shared prompt-greeting row used across every chat greeting surface (sidebar
 * chat, blocks chat demo, and the /rovo + /studio custom-agent empty states).
 *
 * Visual contract is the editor palette's command-menu option: a 44px grid row
 * (fixed 32px icon column, 12px gap, 6px horizontal padding), a `text-sm` /
 * default-weight / 20px label, and a byline that reveals on hover/selection
 * (label slides up, description fades + slides in). The layout, typography,
 * copy-column sizing, and reveal motion are kept in lockstep with the palette's
 * `rich-text-command-menu-*` rows so the two surfaces match.
 */

// Copy column reserves the revealed label + byline height so collapsed (label
// only) rows stay vertically balanced with revealed ones, and clips the byline
// until it slides into view. Mirrors `.rich-text-command-menu-copy`.
const GREETING_COPY_CLASS =
	"flex min-h-[34px] min-w-0 flex-col justify-center overflow-hidden";
// Label: 14px / 400 / 20px / text-subtle, truncated. Mirrors the palette label
// (`font: var(--ds-font-body)` → 14px/20px, default weight).
const GREETING_LABEL_CLASS =
	"truncate text-left text-sm leading-5 text-text-subtle";
// Byline: 12px / 16px / text-subtlest, truncated. Mirrors the palette description.
const GREETING_DESCRIPTION_CLASS =
	"truncate text-left text-xs leading-4 text-text-subtlest";

// Mirrors `nestedCommandLabelVariants` in the editor palette suggestion menu so
// the label lift on reveal matches exactly.
const greetingLabelVariants: Variants = {
	idle: {
		transform: "translateY(8px)",
		transition: { type: "spring", bounce: 0, visualDuration: 0.18 },
	},
	active: {
		transform: "translateY(0px)",
		transition: { type: "spring", bounce: 0.12, visualDuration: 0.24 },
	},
};

// Mirrors `nestedCommandDescriptionVariants` in the editor palette.
const greetingDescriptionVariants: Variants = {
	idle: {
		opacity: 0,
		transform: "translateY(4px)",
		transition: { duration: 0.1, ease: [0.4, 0, 1, 1] },
	},
	active: {
		opacity: 1,
		transform: "translateY(0px)",
		transition: { delay: 0.02, duration: 0.16, ease: [0, 0.4, 0, 1] },
	},
};

export interface GreetingPromptRowProps {
	label: string;
	/** Byline revealed on hover/selection. Omit for a label-only row. */
	description?: string;
	/** Image path for prompts with a rich brand glyph (takes precedence). */
	imageSrc?: string;
	/** Icon component used when there is no `imageSrc`. */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon?: ComponentType<any>;
	/** Colour passed to the icon component (ADS token value). */
	iconColor?: string;
	/** Fully-rendered leading visual; overrides `imageSrc` / `icon`. */
	visual?: ReactNode;
	shortcut?: ReactNode;
	active?: boolean;
	onClick?: () => void;
	className?: string;
	onFocus?: () => void;
	onMouseEnter?: () => void;
}

function GreetingPromptVisual({
	label,
	imageSrc,
	icon: IconComponent,
	iconColor,
	visual,
}: Readonly<Pick<GreetingPromptRowProps, "label" | "imageSrc" | "icon" | "iconColor" | "visual">>) {
	if (visual) {
		return <>{visual}</>;
	}

	return (
		<IconTile
			aria-hidden={true}
			className="border border-border bg-surface"
			icon={
				imageSrc ? (
					<Image
						alt={label}
						className="size-4 object-contain"
						height={16}
						src={imageSrc}
						width={16}
					/>
				) : IconComponent ? (
					<IconComponent color={iconColor} label={label} />
				) : null
			}
			label={label}
			size="medium"
		/>
	);
}

export function GreetingPromptRow({
	label,
	description,
	imageSrc,
	icon,
	iconColor,
	visual,
	shortcut,
	active = false,
	onClick,
	className,
	onFocus,
	onMouseEnter,
}: Readonly<GreetingPromptRowProps>) {
	// Mirrors `.rich-text-command-menu-item`: a CSS grid with a fixed 32px icon
	// column, 12px gap, 6px horizontal padding, and a fixed 44px row height (no
	// vertical padding — the 32px tile + `items-center` set the rhythm). The
	// container uses a 12px corner radius and the same hover token as the
	// palette row.
	const buttonClassName = cn(
		"grid h-11 w-full grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 rounded-[12px] px-1.5 text-left transition-colors hover:bg-bg-neutral-subtle-hovered",
		active && "bg-bg-neutral-subtle-hovered",
		className,
	);
	const leadingVisual = (
		<GreetingPromptVisual
			icon={icon}
			iconColor={iconColor}
			imageSrc={imageSrc}
			label={label}
			visual={visual}
		/>
	);

	// Label-only row: no byline to reveal, so render a plain (cheaper) button.
	if (!description) {
		return (
			<button className={buttonClassName} onClick={onClick} onFocus={onFocus} onMouseEnter={onMouseEnter} type="button">
				{leadingVisual}
				<span className={GREETING_COPY_CLASS}>
					<span className={GREETING_LABEL_CLASS}>{label}</span>
				</span>
				{shortcut ? (
					<span className="flex shrink-0 items-center justify-end text-text-subtlest">
						{shortcut}
					</span>
				) : null}
			</button>
		);
	}

	return (
		<motion.button
			animate={active ? "active" : "idle"}
			className={buttonClassName}
			initial={false}
			onClick={onClick}
			onFocus={onFocus}
			onMouseEnter={onMouseEnter}
			type="button"
			whileFocus="active"
			whileHover="active"
		>
			{leadingVisual}
			<span className={cn(GREETING_COPY_CLASS, "justify-start")}>
				<motion.span
					className={GREETING_LABEL_CLASS}
					style={{ willChange: "transform" }}
					variants={greetingLabelVariants}
				>
					{label}
				</motion.span>
				<motion.span
					className={GREETING_DESCRIPTION_CLASS}
					style={{ willChange: "transform, opacity" }}
					variants={greetingDescriptionVariants}
				>
					{description}
				</motion.span>
			</span>
			{shortcut ? (
				<span className="flex shrink-0 items-center justify-end text-text-subtlest">
					{shortcut}
				</span>
			) : null}
		</motion.button>
	);
}
