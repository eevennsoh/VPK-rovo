"use client";

import { type ReactNode } from "react";
import WrenchIcon from "@atlaskit/icon-lab/core/wrench";
import PeopleGroupIcon from "@atlaskit/icon/core/people-group";

import { Tile } from "@/components/ui/tile";
import { cn } from "@/lib/utils";

import {
	EntityCardDescription,
	EntityCardFooter,
	EntityCardHeader,
	EntityCardMoreButton,
	EntityCardStat,
} from "./parts";

export interface EntityCardToolProps {
	name: string;
	appLogo: ReactNode;
	description?: string;
	toolCount?: number;
	teammateCount?: number;
	active?: boolean;
	action?: ReactNode;
	onMoreActions?: () => void;
	className?: string;
}

export function EntityCardTool({
	name,
	appLogo,
	description,
	toolCount,
	teammateCount,
	active = false,
	action,
	onMoreActions,
	className,
}: Readonly<EntityCardToolProps>) {
	const showTools = typeof toolCount === "number";
	const showTeammates = typeof teammateCount === "number";

	return (
		<div data-slot="entity-card-tool" className={cn("contents", className)}>
			<div className="flex flex-col gap-2">
				<EntityCardHeader
					action={
						action ?? (onMoreActions ? (
							<EntityCardMoreButton active={active} label={`More actions for ${name}`} onClick={onMoreActions} />
						) : null)
					}
					leading={
						<Tile isInset={false} label={name} size="small" variant="transparent">
							{appLogo}
						</Tile>
					}
					title={name}
				/>

				<EntityCardDescription>
					{description ?? `Learn how ${name} can help your team work faster.`}
				</EntityCardDescription>
			</div>

			{showTools || showTeammates ? (
				<EntityCardFooter>
					{showTools ? (
						<EntityCardStat
							icon={<WrenchIcon label="" size="small" spacing="none" color="currentColor" />}
						>
							{toolCount} tools
						</EntityCardStat>
					) : null}
					{showTeammates ? (
						<EntityCardStat
							icon={<PeopleGroupIcon label="" size="small" spacing="none" color="currentColor" />}
						>
							Used by {teammateCount} teammates
						</EntityCardStat>
					) : null}
				</EntityCardFooter>
			) : null}
		</div>
	);
}
