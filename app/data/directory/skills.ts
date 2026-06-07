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
	/** Decorative Tailwind text-color class applied to the leading icon. */
	iconColor?: string;
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

/** Convenience lookup for sidebar references. */
export function getSkillById(
	skills: readonly SkillsDirectorySkill[],
	id: string,
): SkillsDirectorySkill | undefined {
	return skills.find((skill) => skill.id === id);
}

/**
 * Derives the JSON-serializable mention-token visual for a skill. The directory
 * item keeps its own `icon`/`iconColor` fields; this projects them into the
 * shared {@link DirectoryVisual} `icon` shape so composer/editor surfaces can
 * rehydrate them via `resolveDirectoryVisual`.
 */
export function getSkillDirectoryVisual(skill: SkillsDirectorySkill): DirectoryVisual {
	return {
		kind: "icon",
		iconKey: skill.icon ?? "page",
		iconColor: skill.iconColor,
	};
}
