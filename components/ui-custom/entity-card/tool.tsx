"use client";

// oxlint-disable react-doctor/jsx-no-jsx-as-prop -- These components intentionally use slot/render-node props for icons, triggers, and adornments.

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
	/** Renders the persistent "added" check when the tool is already on the agent. */
	added?: boolean;
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
	added = false,
	className,
}: Readonly<EntityCardToolProps>) {
	const showTools = typeof toolCount === "number";
	const showTeammates = typeof teammateCount === "number";

	return (
		<div data-slot="entity-card-tool" className={cn("contents", className)}>
			<div className="flex flex-col gap-2">
				<EntityCardHeader
					added={added}
					action={
						action ?? (onMoreActions ? (
							<EntityCardMoreButton active={active} label={`More actions for ${name}`} onClick={onMoreActions} />
						) : null)
					}
					// Tool cards have no "By" attribution, but agent/skill/knowledge
					// cards do. `reserveByline` keeps the header the same height as a
					// title + byline header (so the cards line up) WITHOUT inserting a
					// visible row — the logo + title stay vertically centered.
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
							{teammateCount} teammates
						</EntityCardStat>
					) : null}
				</EntityCardFooter>
			) : null}
		</div>
	);
}
