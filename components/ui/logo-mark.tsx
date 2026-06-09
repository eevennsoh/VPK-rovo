import { Tile, type TileProps } from "@/components/ui/tile";
import { resolveBrandLogoPresentation } from "@/components/ui/data/logo-usage";
import { cn } from "@/lib/utils";

/**
 * Shared renderer for an external (2P/3P) brand logo mark — the single source of
 * truth for how a brand asset is drawn inside a `Tile` (picker / suggestion-menu
 * rows, e.g. the editor-palette) or a `Tag` / inline chip (e.g. the agent config
 * panel reference chips).
 *
 * Border treatment + the borderless-variant swap are resolved from
 * `logo-usage.json` via {@link resolveBrandLogoPresentation} — never wire borders
 * per call site. Both consumers (the production `mention-visual` marks and the
 * `Logo` component doc demos) render through this component so they can never
 * drift.
 *
 * Two frames:
 *
 * - `frame="tile"` — renders a `Tile` at the given size. Every mark uses the
 *   non-inset path so the glyph fills the box and tracks the tile size 1:1.
 *   Solid-fill 3P marks paint their own background and fill the box bare;
 *   bordered marks (bare 2P PNGs, white-tile 3P) sit on a surface tile with a
 *   1px border and a size-scaled padding so the glyph keeps a consistent inset
 *   as the tile grows (instead of being clamped to a fixed `INSET_CHILD_SIZE`).
 * - `frame="chip"` — renders a fixed 16px box for inline chips. Solid-fill 3P
 *   marks fill the box; bordered marks render as a centered 12px glyph with no
 *   tile/border so they read as a bare mark mid-sentence.
 */

/** Per-`Tile`-size padding for bordered marks in the `"tile"` frame. */
const BRAND_TILE_BORDER_PADDING = {
	xxsmall: "p-px",
	xsmall: "p-[3px]",
	small: "p-[3px]",
	medium: "p-1",
	large: "p-1.5",
	xlarge: "p-2",
} as const satisfies Record<NonNullable<TileProps["size"]>, string>;

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
					className={cn("block object-contain", presentation.hasBorder ? "size-3" : "size-4")}
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
			isInset={false}
			hasBorder={presentation.hasBorder}
			className={cn(
				presentation.hasBorder && "bg-surface",
				presentation.hasBorder && BRAND_TILE_BORDER_PADDING[size],
				className,
			)}
		>
			{/* eslint-disable-next-line @next/next/no-img-element -- Tile child-sizing CSS targets [&_img]; mirrors mention-visual.tsx */}
			<img alt="" aria-hidden className="object-contain" src={presentation.src} />
		</Tile>
	);
}
