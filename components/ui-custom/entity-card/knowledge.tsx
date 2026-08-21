"use client";

// oxlint-disable react-doctor/jsx-no-jsx-as-prop -- These components intentionally use slot/render-node props for icons, triggers, and adornments.

import { type ReactNode } from "react";
import PeopleGroupIcon from "@atlaskit/icon/core/people-group";
import StarUnstarredIcon from "@atlaskit/icon/core/star-unstarred";

import { cn } from "@/lib/utils";

import {
	EntityCardByline,
	EntityCardDescription,
	EntityCardFooter,
	EntityCardHeader,
	EntityCardStat,
	formatCompact,
} from "./parts";

export interface EntityCardKnowledgeProps {
	name: string;
	description?: string;
	/** Attribution shown as a "By {publisher}" byline under the title. */
	publisher?: string;
	/** Renders the verified checkmark beside the publisher byline. */
	verified?: boolean;
	starCount?: number;
	teammateCount?: number;
	icon?: ReactNode;
	/** Marks the knowledge app as already on the agent. */
	added?: boolean;
	/** Renders the shared add/remove switch and toggles immediately. */
	onAddedChange?: (checked: boolean) => void;
	/** Swaps the leading icon for a 16×16 select checkbox on hover/select. */
	selectable?: boolean;
	/** Current selection state for the leading checkbox. */
	selected?: boolean;
	/** Toggles selection from the leading checkbox. */
	onSelectedChange?: (checked: boolean) => void;
	/** Accessible label for the leading checkbox (e.g. "Select {name}"). */
	selectLabel?: string;
	className?: string;
}

export function EntityCardKnowledge({
	name,
	description,
	publisher,
	verified = false,
	starCount,
	teammateCount,
	icon,
	added = false,
	onAddedChange,
	selectable = false,
	selected = false,
	onSelectedChange,
	selectLabel,
	className,
}: Readonly<EntityCardKnowledgeProps>) {
	const showStars = typeof starCount === "number";
	const showTeammates = typeof teammateCount === "number";

	return (
		<div data-slot="entity-card-knowledge" className={cn("contents", className)}>
			<div className="flex flex-col gap-2">
				<EntityCardHeader
					added={added}
					onAddedChange={onAddedChange}
					byline={publisher ? <EntityCardByline publisher={publisher} verified={verified} /> : undefined}
					onSelectedChange={onSelectedChange}
					selectLabel={selectLabel}
					selectable={selectable}
					selected={selected}
					leading={
						icon ? (
							// Knowledge icons are rebuilt at the suggestion-menu visual size
							// (32px tile/logo). Pin them to the 32px lockup the tool card's
							// `Tile size="medium"` logo uses so both directory cards match —
							// the inner `[data-slot=tile]` (image kinds) and bare logo/svg
							// spans (logo kinds) are both held at 32px.
							<span className="inline-flex size-8 shrink-0 items-center justify-center [&>span]:size-8! [&_[data-slot=tile]]:size-8! [&_img]:size-8! [&_svg]:size-8!">
								{icon}
							</span>
						) : null
					}
					title={name}
				/>
				{description ? <EntityCardDescription>{description}</EntityCardDescription> : null}
			</div>
			{showStars || showTeammates ? (
				<EntityCardFooter>
					{showStars ? (
						<EntityCardStat
							icon={<StarUnstarredIcon label="" size="small" spacing="none" color="currentColor" />}
						>
							{formatCompact(starCount)}
						</EntityCardStat>
					) : null}
					{showTeammates ? (
						<EntityCardStat
							icon={<PeopleGroupIcon label="" size="small" spacing="none" color="currentColor" />}
						>
							{formatCompact(teammateCount)} teammates
						</EntityCardStat>
					) : null}
				</EntityCardFooter>
			) : null}
		</div>
	);
}
