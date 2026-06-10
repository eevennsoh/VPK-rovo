"use client";

import { type ReactNode } from "react";

import { EntityCard, type EntityCardAppProps } from "@/components/ui-custom/entity-card";
import { cn } from "@/lib/utils";

import { CardDirectory } from "./card-directory";

export interface CardDirectoryAppProps extends EntityCardAppProps {
	moreAction?: ReactNode;
	onSelect?: () => void;
}

/** App directory card shell adapter — app logo tile, tool/knowledge counts, and teammate usage. */
export function CardDirectoryApp({
	active = false,
	className,
	moreAction,
	name,
	onMoreActions,
	onSelect,
	...entityProps
}: Readonly<CardDirectoryAppProps>) {
	return (
		<CardDirectory active={active} className={cn("gap-4", className)} onSelect={onSelect} selectLabel={`Select ${name}`}>
			<EntityCard.App
				{...entityProps}
				active={active}
				action={moreAction}
				name={name}
				onMoreActions={onMoreActions}
			/>
		</CardDirectory>
	);
}
