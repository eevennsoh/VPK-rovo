"use client";

import type { DOMOutputSpec } from "@tiptap/pm/model";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { AtlassianLogo, type AtlassianLogoName } from "@/components/ui/logo";
import type { TagColor } from "@/components/ui/tag";
import { getSkillIcon } from "@/app/data/directory/visual";
import type { SkillIconKey } from "@/app/data/directory/types";
import { cn } from "@/lib/utils";

import type {
	RichTextMentionCategory,
	RichTextMentionVisual,
} from "./types";

// Maps an icon's ADS color token to the closest `Tag` color so that mention
// tokens in the TipTap editor and reference chips in the agent config panel
// render with the same accent. Keep this the single source of truth — both
// surfaces resolve their tag color through `getRichTextMentionTagColor`.
const ICON_COLOR_TO_TAG_COLOR: Readonly<Record<string, TagColor>> = {
	"text-icon-brand": "blue",
	"text-icon-information": "blue",
	"text-icon-success": "green",
	"text-icon-discovery": "discovery",
	"text-icon-warning": "yellow",
	"text-icon-danger": "red",
	"text-icon-accent-red": "red",
	"text-icon-accent-orange": "orange",
	"text-icon-accent-yellow": "yellow",
	"text-icon-accent-lime": "lime",
	"text-icon-accent-green": "green",
	"text-icon-accent-teal": "teal",
	"text-icon-accent-blue": "blue",
	"text-icon-accent-purple": "purple",
	"text-icon-accent-magenta": "magenta",
	"text-icon-accent-gray": "gray",
	"text-yellow-400": "yellow",
};

/**
 * Resolves the `Tag` color for a mention visual. Returns the visual-derived
 * accent when available (icon color token), falling back to `"blue"` so the
 * mention reads as an interactive reference rather than a neutral gray chip —
 * matching the agent config panel reference chips.
 */
export function getRichTextMentionTagColor(
	visual: RichTextMentionVisual | undefined,
): TagColor {
	if (visual?.kind === "icon" && visual.iconColor) {
		return ICON_COLOR_TO_TAG_COLOR[visual.iconColor] ?? "blue";
	}

	return "blue";
}

export interface RichTextMentionVisualAttrs {
	visualIconColor?: string | null;
	visualIconKey?: string | null;
	visualKind?: RichTextMentionVisual["kind"] | null;
	visualLogoName?: string | null;
	visualShape?: "circle" | "square" | "hexagon" | null;
	visualSrc?: string | null;
}

export function getRichTextMentionVisualAttrs(
	visual: RichTextMentionVisual | undefined,
): RichTextMentionVisualAttrs {
	if (!visual) {
		return {};
	}

	if (visual.kind === "logo") {
		return {
			visualKind: visual.kind,
			visualLogoName: visual.logoName,
		};
	}

	if (visual.kind === "icon") {
		return {
			visualIconColor: visual.iconColor,
			visualIconKey: visual.iconKey,
			visualKind: visual.kind,
		};
	}

	return {
		visualKind: visual.kind,
		visualShape: visual.shape,
		visualSrc: visual.src,
	};
}

export function getRichTextMentionVisualFromAttrs(
	attrs: RichTextMentionVisualAttrs,
): RichTextMentionVisual | undefined {
	if (attrs.visualKind === "avatar" || attrs.visualKind === "image") {
		return attrs.visualSrc
			? {
					kind: attrs.visualKind,
					shape: attrs.visualShape ?? undefined,
					src: attrs.visualSrc,
				}
			: undefined;
	}

	if (attrs.visualKind === "logo" && attrs.visualLogoName) {
		return {
			kind: "logo",
			logoName: attrs.visualLogoName as AtlassianLogoName,
		};
	}

	if (attrs.visualKind === "icon" && attrs.visualIconKey) {
		return {
			kind: "icon",
			icon: getSkillIcon(attrs.visualIconKey as SkillIconKey),
			iconColor: attrs.visualIconColor ?? undefined,
			iconKey: attrs.visualIconKey,
		};
	}

	return undefined;
}

export function getRichTextMentionTagType(
	visual: RichTextMentionVisual | undefined,
): "agent" | "default" | "other" | "user" {
	if (!visual) {
		return "default";
	}

	if (visual.kind === "avatar" && visual.shape === "circle") {
		return "user";
	}

	if (visual.kind === "avatar" && visual.shape === "hexagon") {
		return "agent";
	}

	return visual.kind === "icon" ? "default" : "other";
}

export function RichTextMentionVisualMark({
	category,
	className,
	label,
	size = "tag",
	visual,
}: Readonly<{
	category?: RichTextMentionCategory;
	className?: string;
	label: string;
	size?: "menu" | "pill" | "tag";
	visual: RichTextMentionVisual;
}>) {
	// Inside a "tag" (mention token) every visual kind must occupy the SAME 16px
	// box so avatars, images, logos, and icons line up — previously avatar=24px,
	// image=20px, icon=12px, which misaligned the chips. "pill" already matches at
	// 16px; "menu" (dropdown rows) stays larger.
	const avatarSize = size === "menu" ? "sm" : "xs";
	const imageSizeClassName = size === "menu" ? "size-5" : "size-4";
	const logoSize = size === "menu" ? "small" : "xxsmall";
	const iconSizeClassName =
		size === "menu" ? "size-3" : size === "pill" ? "size-3.5" : "size-4";
	const iconClassName = cn(
		iconSizeClassName,
		size === "menu"
			? "[&>span]:size-3! [&_svg]:size-3!"
			: "[&>span]:size-3.5! [&_svg]:size-3.5!",
	);

	if (visual.kind === "avatar") {
		return (
			<Avatar
				aria-hidden={true}
				className={cn("after:border-0", className)}
				shape={visual.shape ?? (category === "subagent" ? "hexagon" : "circle")}
				size={avatarSize}
			>
				<AvatarImage alt="" aria-hidden={true} src={visual.src} />
			</Avatar>
		);
	}

	if (visual.kind === "image") {
		return (
			<span
				aria-hidden="true"
				className={cn(
					"inline-flex shrink-0 items-center justify-center overflow-hidden",
					visual.shape === "circle" ? "rounded-full" : "rounded-xs",
					imageSizeClassName,
					className,
				)}
			>
				<img alt="" aria-hidden="true" className="size-full object-contain" src={visual.src} />
			</span>
		);
	}

	if (visual.kind === "logo") {
		// In menu rows the logo gets the same tile treatment as `IconTile`
		// (bordered surface tile) so logos and icons read consistently; the
		// inner logo is inset so it doesn't touch the tile border.
		return (
			<span
				aria-hidden="true"
				className={cn(
					"inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xs",
					size === "menu"
						? "size-6 border border-border bg-surface p-0.5 [&>span]:size-full! [&_svg]:size-full!"
						: cn(imageSizeClassName, "[&>span]:size-full! [&_svg]:size-full!"),
					className,
				)}
			>
				<AtlassianLogo name={visual.logoName} size={logoSize} themeAware label={label} />
			</span>
		);
	}

	if (visual.kind === "icon") {
		if (size === "menu") {
			return (
				<IconTile
					aria-hidden={true}
					className={cn("border border-border bg-surface", visual.iconColor ?? "text-icon-subtle", className)}
					icon={visual.icon}
					label={label}
					size="small"
				/>
			);
		}

		return (
			<span
				aria-hidden="true"
				className={cn(
					"inline-flex shrink-0 items-center justify-center",
					iconSizeClassName,
					visual.iconColor ?? "text-icon-subtle",
					className,
				)}
			>
				<Icon
					aria-hidden
					className={iconClassName}
					render={visual.icon}
				/>
			</span>
		);
	}

	return null;
}

export function getRichTextMentionVisualDOMSpec(
	visual: RichTextMentionVisual | undefined,
): DOMOutputSpec | null {
	if (!visual) {
		return null;
	}

	if (visual.kind === "avatar" || visual.kind === "image") {
		return [
			"span",
			{
				"aria-hidden": "true",
				class: "rich-text-mention-visual",
				"data-visual-kind": visual.kind,
				"data-visual-shape": visual.shape ?? undefined,
			},
			["img", { alt: "", src: visual.src }],
		];
	}

	if (visual.kind === "logo") {
		return [
			"span",
			{
				"aria-hidden": "true",
				class: "rich-text-mention-visual rich-text-mention-logo-fallback",
				"data-visual-kind": visual.kind,
			},
			visual.logoName.slice(0, 1).toUpperCase(),
		];
	}

	return [
		"span",
		{
			"aria-hidden": "true",
			class: "rich-text-mention-visual rich-text-mention-icon-fallback",
			"data-visual-kind": visual.kind,
		},
		"",
	];
}
