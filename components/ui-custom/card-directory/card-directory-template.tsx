"use client";

import { EntityCard, type EntityCardTemplateProps, type EntityCardTemplateSkill } from "@/components/ui-custom/entity-card";

import { CardDirectory } from "./card-directory";

export type CardDirectoryTemplateSkill = EntityCardTemplateSkill;

export interface CardDirectoryTemplateProps extends EntityCardTemplateProps {
	onSelect?: () => void;
}

/**
 * Agent-template directory card shell adapter — rich icon, "Works with" sources,
 * and "Skills" tags. A flat take on the studio bento tile.
 */
export function CardDirectoryTemplate({
	className,
	name,
	onSelect,
	...entityProps
}: Readonly<CardDirectoryTemplateProps>) {
	return (
		<CardDirectory className={className} onSelect={onSelect} selectLabel={`Select ${name}`}>
			<EntityCard.Template {...entityProps} name={name} />
		</CardDirectory>
	);
}
