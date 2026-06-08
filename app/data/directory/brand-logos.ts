/**
 * Border + variant resolution for external (2P/3P) brand logos rendered in the
 * editor-palette suggestion menus and inline mention chips.
 *
 * The discriminator is a fact about the asset on disk:
 *
 * - 3P logos that ship a `/public/3p/<id>/16-borderless.svg` sibling are
 *   "white-tile" marks — the standard `<size>.svg` paints a white background and
 *   a baked 1px hairline border. We render these inside a VPK-drawn bordered tile
 *   using the *borderless* variant so the two borders don't double up.
 * - 3P logos with no borderless sibling are full-bleed, solid-fill marks (their
 *   own colored superellipse fills the tile). They need no border — same as the
 *   solid-background 1P product logos.
 * - 2P partner logos are bare `/public/2p/<vendor>.png` marks with no background,
 *   so they always need a bordered containing tile.
 *
 * `THIRD_PARTY_BORDERLESS_LOGO_IDS` MUST stay in sync with `/public/3p` — the
 * folders that contain a `16-borderless.svg`. `brand-logos.test.js` reads the
 * directory and fails if this set drifts, so new 3P assets can't silently bypass
 * the border treatment.
 */
export const THIRD_PARTY_BORDERLESS_LOGO_IDS: ReadonlySet<string> = new Set([
	"airtable",
	"clickup",
	"coupa",
	"datadog",
	"docusign",
	"egnyte",
	"gitlab",
	"gmail",
	"google-calendar",
	"google-chrome",
	"google-cloud-platform",
	"google-drive",
	"jenkins",
	"lucidchart",
	"microsoft-onedrive",
	"microsoft-outlook",
	"microsoft-sharepoint",
	"microsoft-teams",
	"monday",
	"mural",
	"notion",
	"powerbi",
	"salesforce",
	"slack",
	"spinnaker",
	"stack-overflow",
	"tableau",
	"webex",
	"zeplin",
]);

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
		return { src, hasBorder: true };
	}

	if (src.startsWith("/3p/")) {
		const id = src.split("/")[2] ?? "";
		// White-tile 3P logos: use the borderless glyph inside our bordered tile.
		if (THIRD_PARTY_BORDERLESS_LOGO_IDS.has(id)) {
			return { src: `/3p/${id}/16-borderless.svg`, hasBorder: true };
		}
		// Solid-fill 3P logos paint their own background — no border needed.
		return { src, hasBorder: false };
	}

	return { src, hasBorder: false };
}
