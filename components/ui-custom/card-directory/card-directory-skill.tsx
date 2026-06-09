"use client";

import { EntityCard, type EntityCardSkillProps } from "@/components/ui-custom/entity-card";

import { CardDirectory } from "./card-directory";

export interface CardDirectorySkillProps extends EntityCardSkillProps {
	onSelect?: () => void;
}

/** Skill directory card shell adapter — icon tile, publisher attribution, and usage stats. */
export function CardDirectorySkill({
	className,
	name,
	onSelect,
	...entityProps
}: Readonly<CardDirectorySkillProps>) {
	return (
		<CardDirectory className={className} onSelect={onSelect} selectLabel={`Select ${name}`}>
			<EntityCard.Skill {...entityProps} name={name} />
		</CardDirectory>
	);
}
