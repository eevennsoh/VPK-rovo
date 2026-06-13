"use client";

import { useMemo, useRef, useState } from "react";
import GlobeIcon from "@atlaskit/icon/core/globe";
import StatusVerifiedIcon from "@atlaskit/icon/core/status-verified";

import {
	frontmatterValueToString,
	getFrontmatterField,
	parseSkillMd,
	serializeSkillMd,
	setFrontmatterField,
} from "@/app/data/directory/skill-frontmatter";
import {
	getSkillCreatedBy,
	getSkillIconTileVariant,
	getSkillLastUpdatedLabel,
	getSkillMarkdown,
	slugifySkillName,
	type SkillsDirectorySkill,
} from "@/app/data/directory/skills";
import type { AgentConfigFormValue, AgentConfigTextFieldName } from "@/components/blocks/skill-config";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";

/** A SKILL.md edit-in-progress: the full markdown + an optional human description override. */
export interface SkillMdDraft {
	skillMd: string;
	/** Display-only override for the outside description field; null = mirror the frontmatter description. */
	descriptionOverride: string | null;
}

export interface SkillMdEditorState {
	config: AgentConfigFormValue;
	draft: SkillMdDraft;
	handleTextChange: (field: AgentConfigTextFieldName, value: string) => void;
	/**
	 * The latest draft, tracked in a ref and updated synchronously on every edit —
	 * read this at Save time so a value committed on blur by the same click that
	 * triggers Save isn't missed by a not-yet-flushed React state update.
	 */
	getDraft: () => SkillMdDraft;
}

/**
 * Shared state for the SKILL.md editing experience (skills-directory detail view
 * + the skill-config demo). Single source of truth = `skillMd` (the full file):
 *
 * - `name` is owned by the frontmatter (a slug); the outside name field reads it
 *   from the parsed frontmatter and writes it back re-slugged — no separate
 *   display-name state that could drift from a raw-markdown edit.
 * - the outside `description` mirrors the canonical frontmatter description until
 *   the user explicitly overrides it (then it's a persisted display-only value).
 */
export function useSkillMdDraft(skill: SkillsDirectorySkill, initial?: SkillMdDraft): SkillMdEditorState {
	const [skillMd, setSkillMd] = useState(() => initial?.skillMd ?? getSkillMarkdown(skill));
	const [descriptionOverride, setDescriptionOverride] = useState<string | null>(initial?.descriptionOverride ?? null);
	const draftRef = useRef<SkillMdDraft>({ skillMd, descriptionOverride });

	const parsed = useMemo(() => parseSkillMd(skillMd), [skillMd]);
	const frontmatterName = frontmatterValueToString(getFrontmatterField(parsed.frontmatter, "name"));
	const frontmatterDescription = frontmatterValueToString(getFrontmatterField(parsed.frontmatter, "description"));
	const description = descriptionOverride ?? frontmatterDescription;

	const config = useMemo<AgentConfigFormValue>(
		() => ({
			name: frontmatterName,
			description,
			summary: description,
			instructions: skillMd,
			agentId: skill.id,
			action: "draft",
		}),
		[frontmatterName, description, skillMd, skill.id],
	);

	function commitSkillMd(next: string) {
		draftRef.current = { ...draftRef.current, skillMd: next };
		setSkillMd(next);
	}

	function handleTextChange(field: AgentConfigTextFieldName, value: string) {
		if (field === "name") {
			// The frontmatter name is the single source; re-slug the outside input into it.
			commitSkillMd(serializeSkillMd(setFrontmatterField(parsed.frontmatter, "name", slugifySkillName(value)), parsed.body));
			return;
		}
		if (field === "description") {
			draftRef.current = { ...draftRef.current, descriptionOverride: value };
			setDescriptionOverride(value);
			return;
		}
		if (field === "instructions") {
			commitSkillMd(value);
		}
	}

	const draft = useMemo<SkillMdDraft>(() => ({ skillMd, descriptionOverride }), [skillMd, descriptionOverride]);

	return { config, draft, handleTextChange, getDraft: () => draftRef.current };
}

/** The globe cover tile for the skill profile (shared by the detail view + demo). */
export function SkillProfileCover({ skill }: Readonly<{ skill: SkillsDirectorySkill }>) {
	return (
		<div className="relative w-fit overflow-hidden rounded-t-xl bg-surface text-text">
			<IconTile
				aria-hidden
				icon={<GlobeIcon label="" />}
				label={skill.name}
				size="xlarge"
				variant={getSkillIconTileVariant(skill)}
			/>
		</div>
	);
}

/** The "Created by ✓ / Added by / Last update" attribution row. */
export function SkillProfileMeta({ skill }: Readonly<{ skill: SkillsDirectorySkill }>) {
	const lastUpdatedLabel = getSkillLastUpdatedLabel(skill);
	return (
		<div className="flex flex-wrap gap-x-8 gap-y-2 pt-1">
			<div className="flex flex-col">
				<span className="flex items-center gap-1 text-sm font-semibold leading-5 text-text">
					{getSkillCreatedBy(skill)}
					{skill.verified ? (
						<Icon
							className="text-icon-information"
							render={<StatusVerifiedIcon label="Verified" size="small" color="currentColor" />}
						/>
					) : null}
				</span>
				<span className="text-xs leading-4 text-text-subtlest">Created by</span>
			</div>
			<div className="flex flex-col">
				<span className="text-sm font-semibold leading-5 text-text">{skill.addedBy ?? "You"}</span>
				<span className="text-xs leading-4 text-text-subtlest">Added by</span>
			</div>
			{lastUpdatedLabel ? (
				<div className="flex flex-col">
					<span className="text-sm font-semibold leading-5 text-text">{lastUpdatedLabel}</span>
					<span className="text-xs leading-4 text-text-subtlest">Last update</span>
				</div>
			) : null}
		</div>
	);
}
