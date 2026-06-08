import type { AtlassianLogoName } from "@/components/ui/logo";

import skillsData from "./skills.json";
import type { DirectoryVisual, SkillIconKey } from "./types";
import { getSkillIcon } from "./visual";

/**
 * `SkillIconKey` is the closed set of Atlaskit icon keys directory items can
 * use. It is owned by `./types` (so JSON data can reference it without pulling
 * in the JSX resolver) and re-exported here for existing Skills Directory
 * callers that imported it from the data module.
 */
export type { SkillIconKey };

/** `getSkillIcon` resolves an icon key to a live element — re-exported for back-compat. */
export { getSkillIcon };

/** Stable category ids, mirrored by the `Category` sidebar group. */
export type SkillCategory =
	| "project-management"
	| "administrative-tools"
	| "content-and-communication"
	| "data-and-analytics"
	| "software-development"
	| "it-support-and-service"
	| "design-and-diagramming"
	| "security-and-compliance"
	| "hr-and-team-building"
	| "sales-and-customer-relations";

/**
 * A skill's provenance — where it comes from. ORTHOGONAL to {@link SkillCategory}
 * (which is *what the skill does*); `source` drives the leading visual:
 *
 * - `2p` / `3p` — Marketplace / third-party app skills → render the publisher's
 *   company brand mark (`publisherAvatarSrc`) instead of a monochrome glyph.
 * - `default` / `custom` / `platform` — non-collection, user-authored, or core
 *   platform skills → greyscale glyph.
 * - `teamwork` / `software` / `strategy` / `service` / `product` — the Atlassian
 *   System-of-Work app families → glyph tinted with that family's accent hue
 *   (teamwork=blue, software=green, strategy=orange, service=yellow,
 *   product=purple).
 */
export type SkillSource =
	| "2p"
	| "3p"
	| "default"
	| "custom"
	| "platform"
	| "teamwork"
	| "software"
	| "strategy"
	| "service"
	| "product";

/**
 * Maps a {@link SkillSource} to the ADS accent icon-color class for its glyph.
 * App-family sources get their System-of-Work hue; default/custom/platform read
 * neutral grey. `2p`/`3p` render a company logo (not a tinted glyph), so they
 * map to grey only as a fallback when no publisher logo is available.
 */
export const SKILL_SOURCE_ICON_COLOR: Record<SkillSource, string> = {
	"2p": "text-icon-accent-gray",
	"3p": "text-icon-accent-gray",
	default: "text-icon-accent-gray",
	custom: "text-icon-accent-gray",
	platform: "text-icon-accent-gray",
	teamwork: "text-icon-accent-blue",
	software: "text-icon-accent-green",
	strategy: "text-icon-accent-orange",
	service: "text-icon-accent-yellow",
	product: "text-icon-accent-purple",
};

export interface SkillsDirectoryToolTag {
	id: string;
	name: string;
	icon?: SkillIconKey;
}

export interface SkillsDirectoryFileTreeItem {
	id: string;
	label: string;
	kind: "folder" | "file";
	depth?: number;
	expanded?: boolean;
	selected?: boolean;
}

export interface SkillsDirectorySkill {
	id: string;
	name: string;
	description: string;
	icon?: SkillIconKey;
	/**
	 * Decorative Tailwind text-color class applied to the leading glyph. Usually
	 * derived from {@link source} via {@link getSkillIconColor}; this explicit
	 * field is the fallback for skills that declare no `source`.
	 */
	iconColor?: string;
	/** Provenance — drives the leading visual. See {@link SkillSource}. */
	source?: SkillSource;
	publisherName?: string;
	publisherAvatarSrc?: string;
	companyId?: string;
	categoryId?: SkillCategory;
	starCount?: number;
	viewCount?: number;
	tools?: readonly SkillsDirectoryToolTag[];
	instructions?: string;
	fileTreeItems?: readonly SkillsDirectoryFileTreeItem[];
	favorite?: boolean;
	/** Legacy aliases kept for existing Skills Directory callers. */
	publisher?: string;
	publisherLogoSrc?: string;
	category?: SkillCategory;
}

/**
 * The complete skills directory catalog, sourced from `skills.json` as the
 * single source of truth. The JSON is structurally a `SkillsDirectorySkill[]`;
 * we assert the type here so callers get full typing without the loader having
 * to re-declare the data inline.
 */
export const DEFAULT_SKILLS: readonly SkillsDirectorySkill[] =
	skillsData as readonly SkillsDirectorySkill[];

export function getSkillPublisherName(skill: SkillsDirectorySkill): string {
	return skill.publisherName ?? skill.publisher ?? "Atlassian";
}

export function getSkillPublisherAvatarSrc(skill: SkillsDirectorySkill): string | undefined {
	return skill.publisherAvatarSrc ?? skill.publisherLogoSrc;
}

/**
 * Whether the publisher is a person (human avatar) rather than a company.
 * Human avatars render as rounded circles; company logos render square.
 */
export function isSkillPublisherPerson(skill: SkillsDirectorySkill): boolean {
	return skill.companyId === "you";
}

/**
 * Publishers default to the Atlassian brand mark when no custom avatar image is
 * set, rendered via the ADS logo component rather than a static asset.
 */
export function getSkillPublisherLogoName(skill: SkillsDirectorySkill): AtlassianLogoName | undefined {
	return getSkillPublisherAvatarSrc(skill) ? undefined : "atlassian";
}

export function getSkillCategoryId(skill: SkillsDirectorySkill): SkillCategory | undefined {
	return skill.categoryId ?? skill.category;
}

/**
 * Resolves the leading-glyph color class for a skill. When the skill declares a
 * {@link SkillSource}, the color is derived from that family's accent (the
 * single source of truth — see {@link SKILL_SOURCE_ICON_COLOR}); otherwise it
 * falls back to the skill's explicit `iconColor`.
 */
export function getSkillIconColor(skill: SkillsDirectorySkill): string | undefined {
	return skill.source ? SKILL_SOURCE_ICON_COLOR[skill.source] : skill.iconColor;
}

/** Convenience lookup for sidebar references. */
export function getSkillById(
	skills: readonly SkillsDirectorySkill[],
	id: string,
): SkillsDirectorySkill | undefined {
	return skills.find((skill) => skill.id === id);
}

/**
 * Derives the JSON-serializable mention-token visual for a skill.
 *
 * - `2p`/`3p` app skills render the publisher's company brand mark (their
 *   `publisherAvatarSrc` logo) as a square image, so a Slack skill reads as a
 *   Slack tag rather than a generic glyph.
 * - Every other source renders the skill's `icon` glyph, tinted by its source
 *   family via {@link getSkillIconColor}, projected into the shared
 *   {@link DirectoryVisual} `icon` shape for rehydration via
 *   `resolveDirectoryVisual`.
 */
export function getSkillDirectoryVisual(skill: SkillsDirectorySkill): DirectoryVisual {
	const brandSrc = getSkillPublisherAvatarSrc(skill);
	if ((skill.source === "2p" || skill.source === "3p") && brandSrc) {
		return { kind: "image", shape: "square", src: brandSrc };
	}
	return {
		kind: "icon",
		iconKey: skill.icon ?? "page",
		iconColor: getSkillIconColor(skill),
	};
}
