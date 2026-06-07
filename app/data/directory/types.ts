import type { AtlassianLogoName } from "@/components/ui/logo";

/**
 * Closed set of icon keys used by directory items whose visual is a raw
 * Atlaskit icon (currently skills). Kept as a pure type here so JSON data and
 * loaders can reference it without pulling in the JSX resolver in `visual.tsx`
 * (which would create an import cycle).
 */
export type SkillIconKey =
	| "page"
	| "comment"
	| "curly-brackets"
	| "device-mobile"
	| "video"
	| "edit"
	| "chart-trend-up"
	| "angle-brackets"
	| "link"
	| "calendar"
	| "megaphone"
	| "paint-palette"
	| "branch"
	| "search";

/**
 * JSON-serializable mirror of the rich-text editor's `RichTextMentionVisual`.
 *
 * The editor's union stores a live `ReactElement` for the `icon` kind, which
 * cannot live in JSON. Here the `icon` kind stores an `iconKey` (+ optional
 * Tailwind color class) instead; `resolveDirectoryVisual` in `visual.tsx`
 * rehydrates it into the editor's runtime shape. The `avatar`/`image`/`logo`
 * kinds are already serializable and pass through unchanged.
 */
export type DirectoryVisual =
	| {
			kind: "avatar" | "image";
			shape?: "circle" | "square" | "hexagon";
			src: string;
	  }
	| {
			kind: "logo";
			logoName: AtlassianLogoName;
	  }
	| {
			kind: "icon";
			iconKey: SkillIconKey;
			/** Decorative Tailwind text-color class applied to the icon. */
			iconColor?: string;
	  };

/**
 * The reference categories that directory items can be inserted as in the
 * composer/editor mention surfaces. Mirrors the editor's
 * `RichTextMentionCategory` so the catalog builder can map 1:1.
 */
export type DirectoryCategory =
	| "skill"
	| "tool"
	| "subagent"
	| "knowledge"
	| "human"
	| "team";
