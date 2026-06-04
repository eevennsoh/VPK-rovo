"use client";

import type { DOMOutputSpec } from "@tiptap/pm/model";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { AtlassianLogo, type AtlassianLogoName } from "@/components/ui/logo";
import { getSkillIcon, type SkillIconKey } from "@/components/blocks/skills-directory/data/skills";
import { cn } from "@/lib/utils";

import type {
	RichTextMentionCategory,
	RichTextMentionVisual,
} from "./types";

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
	const avatarSize = size === "pill" ? "xs" : "sm";
	const imageSizeClassName = size === "pill" ? "size-4" : "size-5";
	const logoSize = size === "menu" ? "small" : "xxsmall";
	const iconSizeClassName = size === "pill" ? "size-3.5" : "size-3";
	const iconClassName = cn(
		iconSizeClassName,
		size === "pill"
			? "[&>span]:size-3.5! [&_svg]:size-3.5!"
			: "[&>span]:size-3! [&_svg]:size-3!",
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
		return (
			<span
				aria-hidden="true"
				className={cn(
					"inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xs [&>span]:size-full! [&_svg]:size-full!",
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
