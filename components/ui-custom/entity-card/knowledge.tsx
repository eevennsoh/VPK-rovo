"use client";

import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

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
		<div data-slot="entity-card-knowledge" className={cn("flex min-h-full flex-col justify-between gap-4", className)}>
			<span className="flex flex-col gap-2">
				<span className="flex items-center gap-2">
					{icon ? (
						<span aria-hidden="true" className="flex size-5 shrink-0 items-center justify-center">
							{icon}
						</span>
					) : null}
					<span className="font-semibold leading-5 text-text">{name}</span>
				</span>
				{description ? (
					<span className="line-clamp-2 text-sm leading-5 text-text">{description}</span>
				) : null}
			</span>
			{providerName ? (
				<span className="text-xs leading-4 text-text-subtlest">{providerName}</span>
			) : null}
		</div>
	);
}
