"use client";

import SkillIcon from "@atlaskit/icon-lab/core/skill";
import { useState } from "react";

import { SkillSelector } from "@/components/blocks/skill-selector";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Icon } from "@/components/ui/icon";
import { ContextBarPill } from "@/components/ui-custom/context-bar";

interface ActivityComposerSkillContextPillProps {
	onSelectSkill: (skillId: string) => void;
}

/** Opens the directory-backed Skill Selector and inserts the chosen skill into the composer. */
export function ActivityComposerSkillContextPill({
	onSelectSkill,
}: Readonly<ActivityComposerSkillContextPillProps>) {
	const [isOpen, setIsOpen] = useState(false);
	const [pinnedSkillIds, setPinnedSkillIds] = useState<readonly string[]>([]);
	const [query, setQuery] = useState("");

	const handleOpenChange = (nextOpen: boolean) => {
		setIsOpen(nextOpen);
		if (!nextOpen) {
			setQuery("");
		}
	};

	const handleSkillToggle = (skillId: string) => {
		onSelectSkill(skillId);
		setIsOpen(false);
		setQuery("");
	};

	const handleFooterAction = () => {
		setIsOpen(false);
		setQuery("");
	};

	return (
		<DropdownMenu onOpenChange={handleOpenChange} open={isOpen}>
			<DropdownMenuTrigger
				render={
					<ContextBarPill
						className="motion-reduce:transition-none"
						icon={<Icon aria-hidden render={<SkillIcon label="" size="small" />} />}
					/>
				}
			>
				Use skills
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="max-h-none w-[360px] overflow-hidden p-0"
				positionerClassName="z-[502]"
				sideOffset={8}
			>
				<SkillSelector
					onBrowseSkills={handleFooterAction}
					onCreateSkill={handleFooterAction}
					onPinnedSkillIdsChange={setPinnedSkillIds}
					onQueryChange={setQuery}
					onSkillToggle={handleSkillToggle}
					pinnedSkillIds={pinnedSkillIds}
					query={query}
					selectionMode="single"
				/>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
