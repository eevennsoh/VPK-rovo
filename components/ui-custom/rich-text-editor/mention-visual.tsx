"use client";

import type { DOMOutputSpec } from "@tiptap/pm/model";

import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { AtlassianLogo, type AtlassianLogoName } from "@/components/ui/logo";
import { BrandLogoMark } from "@/components/ui/logo-mark";
import type { TagColor } from "@/components/ui/tag";
import { resolveBrandLogoPresentation } from "@/app/data/directory/brand-logos";
import { getSkillIcon } from "@/app/data/directory/visual";
import type { SkillIconKey } from "@/app/data/directory/types";
import { cn } from "@/lib/utils";

import type {
	RichTextMentionCategory,
	RichTextMentionVisual,
} from "./types";

/**
 * Single source of truth for the front-slot visual tile size in suggestion-menu
 * rows (both the `RichTextMentionVisualMark` paths here and the fallback
 * `IconTile` in `suggestion-menu.tsx`). Change this one value to resize every
 * menu-row avatar, image, logo tile, and icon tile together.
 */
export const MENU_VISUAL_TILE_SIZE = "medium" as const;

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
	const avatarSize = size === "menu" ? "default" : "xs";
	const imageSizeClassName = size === "menu" ? "size-8" : "size-4";
	const logoSize = "xxsmall";
	const menuTileSize = MENU_VISUAL_TILE_SIZE;
	const iconSizeClassName =
		size === "menu" ? "size-3" : size === "pill" ? "size-3.5" : "size-4";
	const iconClassName = cn(
		iconSizeClassName,
		size === "menu"
			? "[&>span]:size-3! [&_svg]:size-3!"
			: "[&>span]:size-3.5! [&_svg]:size-3.5!",
	);

	if (visual.kind === "avatar") {
		// Menu rows keep the avatar's semi-opaque border (matching the avatar demo);
		// inline tag/pill chips strip it so the border doesn't clutter mid-sentence.
		return (
			<Avatar
				aria-hidden={true}
				className={cn(size !== "menu" && "after:border-0", className)}
				shape={visual.shape ?? (category === "subagent" ? "hexagon" : "circle")}
				size={avatarSize}
			>
				<AvatarImage alt="" aria-hidden={true} src={visual.src} />
			</Avatar>
		);
	}

	if (visual.kind === "image") {
		// 2P/3P brand logos — rendered through the shared `BrandLogoMark` so border
		// treatment, the borderless-variant swap (resolved from `logo-usage.json`),
		// and the size-scaled glyph fill stay identical to the `Logo` doc demos and
		// can never drift. Menu rows use the `Tile` frame (32px tile, glyph tracks
		// the tile size); inline chips (tag/pill) use the 16px `chip` frame where
		// bordered 2P/3P marks read as a bare centered glyph.
		return size === "menu" ? (
			<BrandLogoMark
				className={className}
				frame="tile"
				label={label}
				size={menuTileSize}
				src={visual.src}
			/>
		) : (
			<BrandLogoMark className={className} frame="chip" label={label} src={visual.src} />
		);
	}

	if (visual.kind === "logo") {
		// Most 1p product logos ship their own colored background, so in menu rows
		// they render as the bare 32px lockup with no surface tile. The plain
		// "atlassian" mark has no background fill, so it keeps the bordered
		// `IconTile` (16px glyph in a 32px tile) so the stroked container stays
		// while the content matches the 16px glyph of every other menu tile.
		// Tags/pills keep the bare inline 16px logo.
		if (size === "menu") {
			if (visual.logoName === "atlassian") {
				return (
					<IconTile
						aria-hidden={true}
						// IconTile's `medium` variant clamps inner spans/svgs to 16px; the
						// Atlassian logo wraps its svg in spans, so this keeps the glyph at
						// 16px inside the stroked tile, matching the other menu tiles.
						className={cn("border border-border bg-surface", className)}
						icon={
							<AtlassianLogo
								name={visual.logoName}
								// `@atlaskit/logo` sizes the glyph from this prop; the runtime
								// accepts a numeric px string even though the type lists named sizes.
								size={"16" as React.ComponentProps<typeof AtlassianLogo>["size"]}
								themeAware
								label={label}
							/>
						}
						label={label}
						size={menuTileSize}
					/>
				);
			}

			return (
				<span
					aria-hidden="true"
					className={cn(
						"inline-flex size-8 shrink-0 items-center justify-center [&>span]:size-full! [&_svg]:size-full!",
						className,
					)}
				>
					<AtlassianLogo name={visual.logoName} size="medium" themeAware label={label} />
				</span>
			);
		}

		return (
			<span
				aria-hidden="true"
				className={cn(
					"inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xs [&>span]:size-full! [&_svg]:size-full!",
					imageSizeClassName,
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
					size={menuTileSize}
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
		// Image (2P/3P brand) logos use the borderless variant in the fallback too,
		// so the non-React serialization matches the React mark. Avatars are not
		// brand logos, so their src is passed through unchanged.
		const src =
			visual.kind === "image"
				? resolveBrandLogoPresentation(visual.src).src
				: visual.src;
		return [
			"span",
			{
				"aria-hidden": "true",
				class: "rich-text-mention-visual",
				"data-visual-kind": visual.kind,
				"data-visual-shape": visual.shape ?? undefined,
			},
			["img", { alt: "", src }],
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
