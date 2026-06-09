"use client";

import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

import {
	EntityCardDescription,
	EntityCardFooter,
	EntityCardHeader,
} from "./parts";

export interface EntityCardKnowledgeProps {
	name: string;
	description?: string;
	providerName?: string;
	icon?: ReactNode;
	className?: string;
}

export function EntityCardKnowledge({
	name,
	description,
	providerName,
	icon,
	className,
}: Readonly<EntityCardKnowledgeProps>) {
	return (
		<div data-slot="entity-card-knowledge" className={cn("contents", className)}>
			<div className="flex flex-col gap-2">
				<EntityCardHeader
					leading={icon ?? null}
					title={name}
				/>
				{description ? <EntityCardDescription>{description}</EntityCardDescription> : null}
			</div>
			{providerName ? (
				<EntityCardFooter>
					<span>{providerName}</span>
				</EntityCardFooter>
			) : null}
		</div>
	);
}
