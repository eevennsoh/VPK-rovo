/**
 * Border + variant resolution for external (2P/3P) brand logos rendered in the
 * editor-palette suggestion menus and inline mention chips.
 *
 * The single source of truth for logo usage now lives in
 * `components/ui/data/logo-usage.json` (read via `logo-usage.ts`). This module
 * re-exports the brand (2P/3P) helpers so existing import paths keep working.
 */
export {
	THIRD_PARTY_BORDERLESS_LOGO_IDS,
	resolveBrandLogoPresentation,
	type BrandLogoPresentation,
} from "@/components/ui/data/logo-usage";
