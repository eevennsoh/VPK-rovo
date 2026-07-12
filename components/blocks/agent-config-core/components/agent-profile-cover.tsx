"use client";

import SkillIcon from "@atlaskit/icon-lab/core/skill";

import { IconTile } from "@/components/ui/icon-tile";

export const AGENT_AVATAR_SRC = "/avatar-agent/teamwork-agents/blocker-checker.svg";

export function AgentProfileCover() {
	return (
		<div className="relative overflow-hidden rounded-t-xl bg-surface text-text">
			<IconTile aria-hidden icon={<SkillIcon label="" />} label="Skill" size="xlarge" variant="gray" />
		</div>
	);
}
