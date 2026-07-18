"use client";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import { useState, type ReactElement } from "react";

import { SkillSelector } from "@/components/blocks/skill-selector";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SkillSelectorPageProps {
	presentation?: "dropdown" | "standalone";
}

const SKILL_SELECTOR_STANDALONE_SURFACE_CLASS =
	"w-[360px] overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-2xl";

export default function SkillSelectorPage({
	presentation = "dropdown",
}: Readonly<SkillSelectorPageProps> = {}): ReactElement {
	const [open, setOpen] = useState(true);
	const [pinnedSkillIds, setPinnedSkillIds] = useState<readonly string[]>([]);
	const [selectedSkillIds, setSelectedSkillIds] = useState<readonly string[]>([]);

	const selector = (
		<SkillSelector
			onBrowseSkills={() => undefined}
			onCreateSkill={() => undefined}
			onPinnedSkillIdsChange={setPinnedSkillIds}
			onSkillToggle={(skillId) => setSelectedSkillIds([skillId])}
			pinnedSkillIds={pinnedSkillIds}
			selectedSkillIds={selectedSkillIds}
			selectionMode="single"
		/>
	);

	if (presentation === "standalone") {
		return (
			<div className={SKILL_SELECTOR_STANDALONE_SURFACE_CLASS} data-skill-selector-demo="standalone">
				{selector}
			</div>
		);
	}

	return (
		<DropdownMenu onOpenChange={setOpen} open={open}>
			<DropdownMenuTrigger render={<Button aria-label="Select skill" variant="outline" />}>
				Select skill
				<ChevronDownIcon label="" size="small" />
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="max-h-none w-[360px] overflow-hidden p-0"
				portalled={false}
				sideOffset={8}
			>
				{selector}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export { SkillSelector } from "@/components/blocks/skill-selector";
export type { SkillSelectorAction, SkillSelectorProps } from "@/components/blocks/skill-selector";
