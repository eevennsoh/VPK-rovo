// Single source of truth for the special multi-color Rovo brand mark
// (yellow / blue / purple / green). Previously shipped as the public asset
// `public/1p/rovo.svg`; now inlined into the logo component so the artwork
// travels with the component instead of as a loose static file.
//
// This module is intentionally dependency-free (no React / Next / @atlaskit
// imports) so it can be shared by:
//   - `RovoColorIcon` in `components/ui/logo.tsx` (renders the paths as JSX)
//   - data files needing a URL string (`avatarSrc`), via `ROVO_LOGO_DATA_URI`
//   - node `--test` files, which bundle TS via esbuild and must not pull in
//     the heavy React logo module.

export interface RovoLogoPath {
	d: string;
	fill: string;
	/** Present only on the overlap paths that use even-odd winding. */
	evenOdd?: boolean;
}

export const ROVO_LOGO_VIEWBOX = "0 0 16 16";

export const ROVO_LOGO_PATHS: readonly RovoLogoPath[] = [
	{
		fill: "#FCA700",
		d: "M7.17342 0.225632C7.72885 -0.0807374 8.40677 -0.0751091 8.9577 0.242517L13.2901 2.74211L14.3175 3.33486C14.8785 3.65826 15.2257 4.25827 15.2257 4.90464V11.0894C15.2257 11.7383 14.8806 12.3357 14.318 12.6589L10.2889 14.9835C10.2978 14.9587 10.3062 14.9338 10.3142 14.9087C10.389 14.6769 10.4286 14.4321 10.4286 14.1818V7.99702C10.4286 7.14738 9.97638 6.36386 9.23877 5.94L8.49458 5.51083L6.23539 4.20798V1.81225C6.23539 1.62347 6.26459 1.43906 6.31986 1.26449C6.45573 0.841996 6.74471 0.476236 7.14004 0.247911L7.14124 0.24722C7.15258 0.240681 7.16336 0.233429 7.17342 0.225632Z",
	},
	{
		fill: "#FCA700",
		d: "M5.80947 1.01655L1.78046 3.34108C1.21785 3.66432 0.872742 4.26167 0.872742 4.91061V11.0954C0.872742 11.7418 1.21988 12.3417 1.78083 12.6651L2.7361 13.2163L7.14073 15.7575C7.69164 16.0751 8.3696 16.0807 8.925 15.7744C8.93506 15.7666 8.94577 15.7594 8.9571 15.7528C9.35287 15.5247 9.64229 15.1588 9.77837 14.7361C9.83376 14.5614 9.86303 14.3768 9.86303 14.1878V11.792L7.53164 10.4475L6.85983 10.0601C6.12236 9.63624 5.66981 8.85256 5.66981 8.00299V1.81822C5.66981 1.56828 5.70934 1.32375 5.78393 1.09231C5.79202 1.0669 5.80054 1.04164 5.80947 1.01655Z",
	},
	{
		fill: "#1868DB",
		evenOdd: true,
		d: "M7.53164 10.4475L2.7361 13.2163L1.78083 12.6651C1.21988 12.3417 0.872742 11.7418 0.872742 11.0954V4.91061C0.872742 4.26167 1.21785 3.66432 1.78046 3.34108L5.80947 1.01655C5.80054 1.04164 5.79202 1.0669 5.78393 1.09231C5.70934 1.32375 5.66981 1.56828 5.66981 1.81822V8.00299C5.66981 8.85256 6.12236 9.63624 6.85983 10.0601L7.53164 10.4475Z",
	},
	{
		fill: "#FCA700",
		evenOdd: true,
		d: "M8.49458 5.51083L6.23539 4.20798V1.81225C6.23539 1.62347 6.26459 1.43906 6.31986 1.26449C6.45573 0.841996 6.74471 0.476236 7.14004 0.247911L7.14124 0.24722C7.15258 0.240681 7.16336 0.233429 7.17342 0.225632C7.72885 -0.0807374 8.40677 -0.0751091 8.9577 0.242517L13.2901 2.74211L8.49458 5.51083Z",
	},
	{
		fill: "#AF59E1",
		evenOdd: true,
		d: "M14.3175 3.33486L13.2901 2.74211L8.49458 5.51083L9.23877 5.94C9.97638 6.36386 10.4286 7.14738 10.4286 7.99702V14.1818C10.4286 14.4321 10.389 14.6769 10.3142 14.9087C10.3062 14.9338 10.2978 14.9587 10.2889 14.9835L14.318 12.6589C14.8806 12.3357 15.2257 11.7383 15.2257 11.0894V4.90464C15.2257 4.25827 14.8785 3.65826 14.3175 3.33486Z",
	},
	{
		fill: "#6A9A23",
		evenOdd: true,
		d: "M7.53164 10.4475L2.7361 13.2163L7.14073 15.7575C7.69164 16.0751 8.3696 16.0807 8.925 15.7744C8.93506 15.7666 8.94577 15.7594 8.9571 15.7528C9.35287 15.5247 9.64229 15.1588 9.77837 14.7361C9.83376 14.5614 9.86303 14.3768 9.86303 14.1878V11.792L7.53164 10.4475Z",
	},
];

function buildRovoLogoSvgMarkup(): string {
	const paths = ROVO_LOGO_PATHS.map((p) => {
		const winding = p.evenOdd ? ' fill-rule="evenodd" clip-rule="evenodd"' : "";
		return `<path${winding} d="${p.d}" fill="${p.fill}"/>`;
	}).join("");

	return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="${ROVO_LOGO_VIEWBOX}" fill="none">${paths}</svg>`;
}

/**
 * The Rovo mark encoded as an inline `data:` URI. Use this for data-driven
 * fields that must hold a URL string (e.g. agent `avatarSrc`). `next/image`
 * renders `data:` URLs as-is, so no `unoptimized` flag is required.
 */
export const ROVO_LOGO_DATA_URI = `data:image/svg+xml,${encodeURIComponent(buildRovoLogoSvgMarkup())}`;
