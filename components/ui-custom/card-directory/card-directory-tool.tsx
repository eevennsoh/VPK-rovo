"use client";

import { type ReactNode } from "react";

import { EntityCard, type EntityCardToolProps } from "@/components/ui-custom/entity-card";
import { cn } from "@/lib/utils";

import { CardDirectory } from "./card-directory";

export interface CardDirectoryToolProps extends EntityCardToolProps {
	moreAction?: ReactNode;
	onSelect?: () => void;
}

/** Tool/app directory card shell adapter — app logo tile, tool count, and teammate usage. */
export function CardDirectoryTool({
	active = false,
	className,
	moreAction,
	name,
	onMoreActions,
	onSelect,
	...entityProps
}: Readonly<CardDirectoryToolProps>) {
	return (
		<CardDirectory active={active} className={cn("gap-4", className)} onSelect={onSelect} selectLabel={`Select ${name}`}>
			<EntityCard.Tool
				{...entityProps}
				active={active}
				action={moreAction}
				name={name}
				onMoreActions={onMoreActions}
			/>
		</CardDirectory>
	);
}
