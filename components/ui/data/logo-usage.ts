/**
 * Typed loader + resolver for logo usage metadata. The canonical source of truth
 * is `logo-usage.json` — this module just reads it and exposes typed helpers.
 *
 * The usage decisions are facts about each asset's visual:
 *
 * - 1P product logos (Jira, Confluence, …) ship a solid superellipse background,
 *   so they render bare. The Atlassian master logo has no solid background and
 *   gets a bordered tile (see `oneP.borderById`).
 * - 2P partner logos are bare `/public/2p/<vendor>.png` marks with no background,
 *   so they always need a bordered containing tile.
 * - 3P logos that ship a `/public/3p/<id>/16-borderless.svg` sibling are
 *   "white-tile" marks — the standard `<size>.svg` paints a white background and
 *   a baked 1px hairline. We render these inside a VPK-drawn bordered tile using
 *   the *borderless* variant so the two borders don't double up. Also used for
 *   tight estate (tags) or oversized logos where we build our own border.
 * - 3P logos with no borderless sibling are full-bleed, solid-fill marks (their
 *   own colored superellipse fills the tile). They need no border — same as the
 *   solid-background 1P product logos.
 *
 * `THIRD_PARTY_BORDERLESS_LOGO_IDS` MUST stay in sync with `/public/3p` — the
 * folders that contain a `16-borderless.svg`. `logo-usage.test.js` reads the
 * directory and fails if the JSON drifts, so new 3P assets can't silently bypass
 * the border treatment.
 */
import type { AtlassianLogoName } from "./logo-data";
import logoUsage from "./logo-usage.json" with { type: "json" };

const ONE_P = logoUsage.tiers.oneP;
const TWO_P = logoUsage.tiers.twoP;
const THREE_P = logoUsage.tiers.threeP;

const ONE_P_BORDER_BY_ID: Readonly<Record<string, boolean>> = ONE_P.borderById;

/** The 3P logo ids that ship a borderless variant (mirror of `/public/3p`). */
export const THIRD_PARTY_BORDERLESS_LOGO_IDS: ReadonlySet<string> = new Set(
	THREE_P.borderlessIds,
);

export interface BrandLogoPresentation {
	/** The src to render — swapped to the borderless variant for white-tile 3P logos. */
	src: string;
	/** Whether the logo needs a 1px bordered containing tile. */
	hasBorder: boolean;
}

/**
 * Resolves the rendered src and whether a bordered tile is needed for a 2P/3P
 * logo path. Falls back to "no border, src unchanged" for any path that is not a
 * recognized `/2p/` or `/3p/` asset.
 */
export function resolveBrandLogoPresentation(src: string): BrandLogoPresentation {
	// 2P partner marks are bare PNGs with no background — always need a border.
	if (src.startsWith("/2p/")) {
		return { src, hasBorder: TWO_P.defaultHasBorder };
	}

	if (src.startsWith("/3p/")) {
		const id = src.split("/")[2] ?? "";
		// White-tile 3P logos: use the borderless glyph inside our bordered tile.
		if (THIRD_PARTY_BORDERLESS_LOGO_IDS.has(id)) {
			return { src: `/3p/${id}/${THREE_P.borderlessVariantFile}`, hasBorder: true };
		}
		// Solid-fill 3P logos paint their own background — no border needed.
		return { src, hasBorder: THREE_P.defaultHasBorder };
	}

	return { src, hasBorder: false };
}

/**
 * Whether a 1P Atlassian product/master logo should render inside a bordered
 * tile. Solid-background product marks render bare; the Atlassian master logo
 * (no solid background) gets a border. Driven by `logo-usage.json`.
 */
export function resolveAtlassianLogoBorder(name: AtlassianLogoName): boolean {
	return ONE_P_BORDER_BY_ID[name] ?? ONE_P.defaultHasBorder;
}
