// oxlint-disable react-doctor/no-multi-comp -- This module intentionally colocates coupled component parts as a compound component or demo surface API.

import { Tile, type TileProps } from "@/components/ui/tile";
import { AtlassianLogo, type AtlassianLogoName } from "@/components/ui/logo";
import {
	resolveAtlassianLogoBorder,
	resolveBrandLogoPresentation,
} from "@/components/ui/data/logo-usage";
import { cn } from "@/lib/utils";

/**
 * Shared renderers for brand logo marks — the single source of truth for how a
 * brand asset is drawn inside a `Tile` (picker / suggestion-menu rows, e.g. the
 * editor-palette) or a `Tag` / inline chip (e.g. the agent config panel
 * reference chips).
 *
 * Border treatment + the borderless-variant swap are resolved from
 * `logo-usage.json` via {@link resolveBrandLogoPresentation} — never wire borders
 * per call site. Both consumers (the production `mention-visual` marks and the
 * `Logo` component doc demos) render through this component so they can never
 * drift.
 *
 * Two frames:
 *
 * - `frame="tile"` — renders a `Tile` at the given size. Solid-fill 3P marks
 *   already include their own tile/background, so they fill the full Tile box.
 *   Bordered marks (bare 2P PNGs, white-tile 3P) sit on a surface tile and
 *   follow `Tile`'s inset child scale.
 * - `frame="chip"` — renders a fixed 16px box for inline chips. Solid-fill 3P
 *   marks fill the box; bordered marks render as a centered 10px glyph with no
 *   tile/border so they read as a bare mark mid-sentence.
 */

export interface BrandLogoMarkProps {
	/** The 2P/3P asset path (e.g. `/3p/airtable/24.svg` or `/2p/appfire.png`). */
	src: string;
	/** Accessible label forwarded to the underlying `Tile` (chips ignore it). */
	label: string;
	/**
	 * `"tile"` for picker / menu rows (default), `"chip"` for inline tag/pill
	 * chips.
	 */
	frame?: "tile" | "chip";
	/** `Tile` size when `frame="tile"`. Ignored for `"chip"`. */
	size?: NonNullable<TileProps["size"]>;
	className?: string;
}

export interface AtlassianLogoMarkProps {
	/** Atlassian 1P product or company logo name. */
	name: AtlassianLogoName;
	/** Accessible label forwarded to the logo/tile wrapper. */
	label: string;
	/** `Tile`/logo size. */
	size?: NonNullable<TileProps["size"]>;
	className?: string;
}

export interface AtlassianLogoGlyphProps {
	/** Atlassian 1P product or company logo name. */
	name: AtlassianLogoName;
	/** Logo glyph size forwarded to `AtlassianLogo`. */
	size?: NonNullable<TileProps["size"]>;
	className?: string;
}

export function AtlassianLogoGlyph({
	name,
	size = "xlarge",
	className,
}: Readonly<AtlassianLogoGlyphProps>) {
	return (
		<span
			aria-hidden="true"
			className={cn(
				"inline-flex shrink-0 items-center justify-center [&>span]:!size-full [&_svg]:!size-full",
				className,
			)}
		>
			<AtlassianLogo label="" name={name} size={size} themeAware />
		</span>
	);
}

export function AtlassianLogoMark({
	name,
	label,
	size = "medium",
	className,
}: Readonly<AtlassianLogoMarkProps>) {
	const hasBorder = resolveAtlassianLogoBorder(name);

	if (!hasBorder) {
		const logo = (
			<AtlassianLogo
				label={label}
				name={name}
				size={size}
				themeAware
			/>
		);

		return className ? <span className={cn("inline-flex", className)}>{logo}</span> : logo;
	}

	return (
		<Tile
			aria-hidden
			className={cn("bg-surface", className)}
			hasBorder
			label={label}
			size={size}
			variant="transparent"
		>
			<AtlassianLogo label="" name={name} size={size} themeAware />
		</Tile>
	);
}

export function BrandLogoMark({
	src,
	label,
	frame = "tile",
	size = "medium",
	className,
}: Readonly<BrandLogoMarkProps>) {
	const presentation = resolveBrandLogoPresentation(src);

	if (frame === "chip") {
		return (
			<span
				aria-hidden="true"
				className={cn(
					"inline-flex size-4 shrink-0 items-center justify-center align-middle",
					className,
				)}
			>
				{/* eslint-disable-next-line @next/next/no-img-element -- brand asset; alignment-critical sizing handled here */}
				<img
					alt=""
					aria-hidden
					src={presentation.src}
					className={cn("block object-contain", presentation.hasBorder ? "size-2.5" : "size-4")}
				/>
			</span>
		);
	}

	return (
		<Tile
			aria-hidden
			label={label}
			size={size}
			variant="transparent"
			isInset={presentation.hasBorder}
			hasBorder={presentation.hasBorder}
			className={cn(
				presentation.hasBorder && "bg-surface",
				className,
			)}
		>
			{/* eslint-disable-next-line @next/next/no-img-element -- Tile child-sizing CSS targets [&_img]; mirrors mention-visual.tsx */}
			<img alt="" aria-hidden className="object-contain" src={presentation.src} />
		</Tile>
	);
}
