"use client";

import { EntityCard, type EntityCardKnowledgeProps } from "@/components/ui-custom/entity-card";
import { cn } from "@/lib/utils";

import { CardDirectory } from "./card-directory";

export interface CardDirectoryKnowledgeProps extends EntityCardKnowledgeProps {
	onSelect?: () => void;
}

/** Knowledge directory card shell adapter — app identity, description, and provider metadata. */
export function CardDirectoryKnowledge({
	className,
	name,
	onSelect,
	...entityProps
}: Readonly<CardDirectoryKnowledgeProps>) {
	return (
		<CardDirectory
			className={cn("gap-4", className)}
			onSelect={onSelect}
			selectLabel={`Select ${name}`}
		>
			<EntityCard.Knowledge {...entityProps} name={name} />
		</CardDirectory>
	);
}
