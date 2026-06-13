"use client";

import { useMemo, useState } from "react";
import GlobeIcon from "@atlaskit/icon/core/globe";
import StatusVerifiedIcon from "@atlaskit/icon/core/status-verified";

import {
	Agent,
	AgentConfigFields,
	AgentContent,
	type AgentConfigFormValue,
	type AgentConfigTextFieldName,
} from "@/components/blocks/skill-config";
import {
	frontmatterValueToString,
	getFrontmatterField,
	parseSkillMd,
	serializeSkillMd,
	setFrontmatterField,
} from "@/app/data/directory/skill-frontmatter";
import {
	DEFAULT_SKILLS,
	getSkillCreatedBy,
	getSkillIconTileVariant,
	getSkillLastUpdatedLabel,
	getSkillMarkdown,
	slugifySkillName,
	type SkillsDirectorySkill,
} from "@/app/data/directory/skills";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";
import { cn } from "@/lib/utils";

const SURFACE_CLASSNAME = "min-h-[760px] w-full";

const SAMPLE_SKILL: SkillsDirectorySkill =
	DEFAULT_SKILLS.find((skill) => skill.id === "design-landing-page") ?? DEFAULT_SKILLS[0];

const EMPTY_SKILL: SkillsDirectorySkill = {
	id: "untitled-skill",
	name: "Untitled skill",
	description: "Describe when this skill should be used and what it does.",
	icon: "page",
	source: "custom",
	collectionId: "custom",
	companyId: "you",
	publisherName: "Venn",
	createdBy: "Venn",
	addedBy: "You",
	verified: false,
};

/**
 * Skill-config showcase: the same SKILL.md-standard editing experience as the
 * skills-directory detail view — a globe cover, an editable name + human
 * description, the in-editor frontmatter card, and a markdown body. No bottom
 * apps panel (apps are referenced via the editor's `/` command).
 */
function SkillConfigDemoScreen({ skill, idPrefix }: Readonly<{ skill: SkillsDirectorySkill; idPrefix: string }>) {
	const [skillMd, setSkillMd] = useState(() => getSkillMarkdown(skill));
	const [displayName, setDisplayName] = useState(skill.name);
	const [displayDescription, setDisplayDescription] = useState(() =>
		frontmatterValueToString(getFrontmatterField(parseSkillMd(getSkillMarkdown(skill)).frontmatter, "description")),
	);

	const config = useMemo<AgentConfigFormValue>(
		() => ({
			name: displayName,
			description: displayDescription,
			summary: displayDescription,
			instructions: skillMd,
			agentId: skill.id,
			action: "draft",
		}),
		[displayName, displayDescription, skillMd, skill.id],
	);

	function handleTextChange(field: AgentConfigTextFieldName, value: string) {
		if (field === "name") {
			setDisplayName(value);
			setSkillMd((current) => {
				const { frontmatter, body } = parseSkillMd(current);
				return serializeSkillMd(setFrontmatterField(frontmatter, "name", slugifySkillName(value)), body);
			});
			return;
		}
		if (field === "description") {
			setDisplayDescription(value);
			return;
		}
		if (field === "instructions") {
			setSkillMd(value);
		}
	}

	const lastUpdatedLabel = getSkillLastUpdatedLabel(skill);

	return (
		<Agent className={cn(SURFACE_CLASSNAME, "flex flex-col")}>
			<AgentContent className="flex min-h-0 flex-1 flex-col">
				<AgentConfigFields
					config={config}
					idPrefix={idPrefix}
					showConfigToolbar={false}
					frontmatter={{ enabled: true }}
					onTextChange={handleTextChange}
					profileCover={
						<div className="relative w-fit overflow-hidden rounded-t-xl bg-surface text-text">
							<IconTile
								aria-hidden
								icon={<GlobeIcon label="" />}
								label={skill.name}
								size="xlarge"
								variant={getSkillIconTileVariant(skill)}
							/>
						</div>
					}
					profileMetaSlot={
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
					}
				/>
			</AgentContent>
		</Agent>
	);
}

export function SkillConfigDemoFull() {
	return <SkillConfigDemoScreen skill={SAMPLE_SKILL} idPrefix="skill-config-demo-full" />;
}

export function SkillConfigDemoEmpty() {
	return <SkillConfigDemoScreen skill={EMPTY_SKILL} idPrefix="skill-config-demo-empty" />;
}

export default function SkillConfigDemo() {
	return <SkillConfigDemoFull />;
}
