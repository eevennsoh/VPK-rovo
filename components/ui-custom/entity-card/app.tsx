"use client";

// oxlint-disable react-doctor/jsx-no-jsx-as-prop -- These components intentionally use slot/render-node props for icons, triggers, and adornments.

import { type ReactNode } from "react";
import PeopleGroupIcon from "@atlaskit/icon/core/people-group";
import BookWithBookmarkIcon from "@atlaskit/icon/core/book-with-bookmark";
import WrenchIcon from "@atlaskit/icon-lab/core/wrench";

import { Tile } from "@/components/ui/tile";
import { cn } from "@/lib/utils";

import {
	EntityCardDescription,
	EntityCardFooter,
	EntityCardHeader,
	EntityCardMoreButton,
	EntityCardStat,
} from "./parts";

export interface EntityCardAppProps {
	name: string;
	appLogo: ReactNode;
	description?: string;
	toolCount?: number;
	knowledgeCount?: number;
	teammateCount?: number;
	active?: boolean;
	action?: ReactNode;
	onMoreActions?: () => void;
	className?: string;
}

export function EntityCardApp({
	name,
	appLogo,
	description,
	toolCount,
	knowledgeCount,
	teammateCount,
	active = false,
	action,
	onMoreActions,
	className,
}: Readonly<EntityCardAppProps>) {
	const showTools = typeof toolCount === "number";
	const showKnowledge = typeof knowledgeCount === "number";
	const showTeammates = typeof teammateCount === "number";

	return (
		<div data-slot="entity-card-app" className={cn("contents", className)}>
			<div className="flex flex-col gap-2">
				<EntityCardHeader
					action={
						action ?? (onMoreActions ? (
							<EntityCardMoreButton active={active} label={`More actions for ${name}`} onClick={onMoreActions} />
						) : null)
					}
					reserveByline
					leading={
						<Tile isInset={false} label={name} size="medium" variant="transparent">
							{appLogo}
						</Tile>
					}
					title={name}
				/>

				<EntityCardDescription>
					{description ?? `Learn how ${name} can help your team work faster.`}
				</EntityCardDescription>
			</div>

			{showTools || showKnowledge || showTeammates ? (
				<EntityCardFooter>
					{showTools ? (
						<EntityCardStat
							icon={<WrenchIcon label="" size="small" spacing="none" color="currentColor" />}
						>
							{toolCount} tools
						</EntityCardStat>
					) : null}
					{showKnowledge ? (
						<EntityCardStat
							icon={<BookWithBookmarkIcon label="" size="small" spacing="none" color="currentColor" />}
						>
							{knowledgeCount} knowledge
						</EntityCardStat>
					) : null}
					{showTeammates ? (
						<EntityCardStat
							icon={<PeopleGroupIcon label="" size="small" spacing="none" color="currentColor" />}
						>
							{teammateCount} teammates
						</EntityCardStat>
					) : null}
				</EntityCardFooter>
			) : null}
		</div>
	);
}
