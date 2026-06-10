"use client";

import { EntityCard, type EntityCardAgentExpandedProps } from "@/components/ui-custom/entity-card";
import { cn } from "@/lib/utils";

import { CardDirectory } from "./card-directory";

export interface CardDirectoryAgentExpandedProps extends EntityCardAgentExpandedProps {
	onSelect?: () => void;
}

/**
 * Expanded agent directory card shell adapter — cover banner, attribution,
 * scrollable capabilities, and hover footer action.
 */
export function CardDirectoryAgentExpanded({
	className,
	name,
	onSelect,
	...entityProps
}: Readonly<CardDirectoryAgentExpandedProps>) {
	return (
		<CardDirectory
			className={cn("gap-0 overflow-clip p-0", className)}
			onSelect={onSelect}
			selectLabel={`Select ${name}`}
		>
			<EntityCard.AgentExpanded {...entityProps} name={name} onSelect={onSelect} />
		</CardDirectory>
	);
}
