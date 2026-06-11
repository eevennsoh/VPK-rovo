import type { AtlassianLogoName } from "@/components/ui/logo";

import skillsData from "./skills.json";
import {
	getSkillCollectionMetadata,
	type SkillCollectionId,
	SKILL_COLLECTIONS,
	type SkillCollectionMetadata,
} from "./skill-collections";
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

export type { SkillCollectionId, SkillCollectionMetadata };
export {
	ATLASSIAN_SKILL_COLLECTION_IDS,
	getSkillCollectionMetadata,
	SKILL_COLLECTIONS,
} from "./skill-collections";

const SKILL_SOURCE_COLLECTION: Record<SkillSource, SkillCollectionId> = {
	"2p": "marketplace",
	"3p": "marketplace",
	default: "default",
	custom: "custom",
	platform: "platform",
	teamwork: "teamwork",
	software: "software",
	strategy: "strategy",
	service: "service",
	product: "product",
};

/**
 * Maps a {@link SkillSource} to the ADS accent icon-color class for its glyph.
 * App-family sources get their System-of-Work hue; default/custom/platform read
 * neutral grey. `2p`/`3p` render a company logo (not a tinted glyph), so they
 * map to grey only as a fallback when no publisher logo is available.
 */
export const SKILL_SOURCE_ICON_COLOR: Record<SkillSource, string> = {
	"2p": SKILL_COLLECTIONS.marketplace.iconClassName,
	"3p": SKILL_COLLECTIONS.marketplace.iconClassName,
	default: SKILL_COLLECTIONS.default.iconClassName,
	custom: SKILL_COLLECTIONS.custom.iconClassName,
	platform: SKILL_COLLECTIONS.platform.iconClassName,
	teamwork: SKILL_COLLECTIONS.teamwork.iconClassName,
	software: SKILL_COLLECTIONS.software.iconClassName,
	strategy: SKILL_COLLECTIONS.strategy.iconClassName,
	service: SKILL_COLLECTIONS.service.iconClassName,
	product: SKILL_COLLECTIONS.product.iconClassName,
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
	/** Collection taxonomy used by SkillTag and the Skills Directory sidebar. */
	collectionId?: SkillCollectionId;
	collectionDescription?: string;
	collectionProducts?: readonly string[];
	collectionDocsUrl?: string;
	publisherName?: string;
	publisherAvatarSrc?: string;
	companyId?: string;
	categoryId?: SkillCategory;
	starCount?: number;
	teammateCount?: number;
	viewCount?: number;
	verified?: boolean;
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

const PERSONAL_SKILL_PUBLISHERS = new Set(["you", "by you"]);

function normalizeSkillPublisherName(publisher: string): string {
	return PERSONAL_SKILL_PUBLISHERS.has(publisher.trim().toLowerCase()) ? "Venn" : publisher;
}

export function getSkillPublisherName(skill: SkillsDirectorySkill): string {
	return normalizeSkillPublisherName(skill.publisherName ?? skill.publisher ?? "Atlassian");
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

export function getSkillCollectionId(skill: Pick<SkillsDirectorySkill, "collectionId" | "source">): SkillCollectionId {
	if (skill.collectionId) return skill.collectionId;
	return skill.source ? SKILL_SOURCE_COLLECTION[skill.source] : "default";
}

export function getSkillCollection(skill: Pick<SkillsDirectorySkill, "collectionId" | "source">): SkillCollectionMetadata {
	return getSkillCollectionMetadata(getSkillCollectionId(skill));
}

/**
 * Resolves the leading-glyph color class for a skill. When the skill declares a
 * {@link SkillSource}, the color is derived from that family's accent (the
 * single source of truth — see {@link SKILL_SOURCE_ICON_COLOR}); otherwise it
 * falls back to the skill's explicit `iconColor`.
 */
export function getSkillIconColor(skill: SkillsDirectorySkill): string | undefined {
	return skill.source || skill.collectionId
		? getSkillCollection(skill).iconClassName
		: skill.iconColor;
}

export function getSkillIconTileVariant(skill: Pick<SkillsDirectorySkill, "collectionId" | "source">) {
	return getSkillCollection(skill).iconTileVariant;
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
