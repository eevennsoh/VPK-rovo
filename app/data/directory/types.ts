import type { AtlassianLogoName } from "@/components/ui/logo";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";

/**
 * Closed set of icon keys used by skill directory items. Kept as a pure type
 * here so JSON data and loaders can reference it without pulling in the JSX
 * resolver in `visual.tsx` (which would create an import cycle).
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
 * Closed set of icon keys used by every directory item whose visual is a raw
 * Atlaskit icon. Skills keep their narrower {@link SkillIconKey}; knowledge
 * content can use the broader set without embedding JSX in JSON.
 */
export type DirectoryIconKey =
	| SkillIconKey
	| "assets"
	| "board"
	| "book-with-bookmark"
	| "briefcase"
	| "chart-bar"
	| "database"
	| "files"
	| "focus-area"
	| "folder-closed"
	| "goal"
	| "lightbulb"
	| "people-group"
	| "project"
	| "roadmap"
	| "table"
	| "teams"
	| "whiteboard"
	| "work-item";

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
			kind: "third-party";
			name: ThirdPartyLogoName;
	  }
	| {
			kind: "icon";
			iconKey: DirectoryIconKey;
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
