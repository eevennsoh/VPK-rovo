"use client";

import { type ReactNode } from "react";
import WrenchIcon from "@atlaskit/icon-lab/core/wrench";
import PeopleGroupIcon from "@atlaskit/icon/core/people-group";

import { Tile } from "@/components/ui/tile";
import { cn } from "@/lib/utils";

import { CardDirectory } from "./card-directory";
import {
	CardDirectoryDescription,
	CardDirectoryFooter,
	CardDirectoryHeader,
	CardDirectoryMoreButton,
	CardDirectoryStat,
} from "./card-directory-parts";

export interface CardDirectoryToolProps {
	name: string;
	/** App logo element rendered inside the leading tile. */
	appLogo: ReactNode;
	description?: string;
	toolCount?: number;
	teammateCount?: number;
	active?: boolean;
	moreAction?: ReactNode;
	onSelect?: () => void;
	onMoreActions?: () => void;
	className?: string;
}

/** Tool/app directory card — app logo tile, tool count, and teammate usage. */
export function CardDirectoryTool({
	name,
	appLogo,
	description,
	toolCount,
	teammateCount,
	active = false,
	moreAction,
	onSelect,
	onMoreActions,
	className,
}: Readonly<CardDirectoryToolProps>) {
	const showTools = typeof toolCount === "number";
	const showTeammates = typeof teammateCount === "number";

	return (
		<CardDirectory active={active} className={cn("gap-4", className)} onSelect={onSelect} selectLabel={`Select ${name}`}>
			<div className="flex flex-col gap-2">
				<CardDirectoryHeader
					action={
						moreAction ?? (onMoreActions ? (
							<CardDirectoryMoreButton active={active} label={`More actions for ${name}`} onClick={onMoreActions} />
						) : null)
					}
					leading={
						<Tile isInset={false} label={name} size="small" variant="transparent">
							{appLogo}
						</Tile>
					}
					title={name}
				/>

				<CardDirectoryDescription>
					{description ?? `Learn how ${name} can help your team work faster.`}
				</CardDirectoryDescription>
			</div>

			{showTools || showTeammates ? (
				<CardDirectoryFooter>
					{showTools ? (
						<CardDirectoryStat
							icon={<WrenchIcon label="" size="small" spacing="none" color="currentColor" />}
						>
							{toolCount} tools
						</CardDirectoryStat>
					) : null}
					{showTeammates ? (
						<CardDirectoryStat
							icon={<PeopleGroupIcon label="" size="small" spacing="none" color="currentColor" />}
						>
							Used by {teammateCount} teammates
						</CardDirectoryStat>
					) : null}
				</CardDirectoryFooter>
			) : null}
		</CardDirectory>
	);
}
