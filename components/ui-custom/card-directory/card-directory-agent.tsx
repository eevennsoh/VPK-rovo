"use client";

import { type ReactNode } from "react";

import { EntityCard, type EntityCardAgentProps } from "@/components/ui-custom/entity-card";
import { cn } from "@/lib/utils";

import { CardDirectory } from "./card-directory";

export interface CardDirectoryAgentProps extends EntityCardAgentProps {
	moreAction?: ReactNode;
	onSelect?: () => void;
}

/** Agent directory card shell adapter — hexagon avatar, attribution, rating, and chat stats. */
export function CardDirectoryAgent({
	active = false,
	className,
	moreAction,
	name,
	onMoreActions,
	onSelect,
	...entityProps
}: Readonly<CardDirectoryAgentProps>) {
	return (
		<CardDirectory active={active} className={cn("gap-4", className)} onSelect={onSelect} selectLabel={`Select ${name}`}>
			<EntityCard.Agent
				{...entityProps}
				active={active}
				action={moreAction}
				name={name}
				onMoreActions={onMoreActions}
			/>
		</CardDirectory>
	);
}
