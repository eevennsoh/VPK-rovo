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
	/** Renders the persistent "added" check when the app is already on the agent. */
	added?: boolean;
	/** Swaps the leading logo for a 16×16 select checkbox on hover/select. */
	selectable?: boolean;
	/** Current selection state for the leading checkbox. */
	selected?: boolean;
	/** Toggles selection from the leading checkbox. */
	onSelectedChange?: (checked: boolean) => void;
	/** Accessible label for the leading checkbox (e.g. "Select {name}"). */
	selectLabel?: string;
	promptSuggestion?: string;
	mentionHandle?: string;
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
	added = false,
	selectable = false,
	selected = false,
	onSelectedChange,
	selectLabel,
	promptSuggestion,
	mentionHandle,
	className,
}: Readonly<EntityCardAppProps>) {
	const showTools = typeof toolCount === "number";
	const showKnowledge = typeof knowledgeCount === "number";
	const showTeammates = typeof teammateCount === "number";

	const descriptionContent = (
		<EntityCardDescription>
			{description ?? `Learn how ${name} can help your team work faster.`}
		</EntityCardDescription>
	);

	const footerContent = showTools || showKnowledge || showTeammates ? (
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
	) : null;

	const header = (
		<EntityCardHeader
			added={added}
			action={
				action ?? (onMoreActions ? (
					<EntityCardMoreButton active={active} label={`More actions for ${name}`} onClick={onMoreActions} />
				) : null)
			}
			reserveByline
			onSelectedChange={onSelectedChange}
			selectLabel={selectLabel}
			selectable={selectable}
			selected={selected}
			leading={
				<Tile isInset={false} label={name} size="medium" variant="transparent">
					{appLogo}
				</Tile>
			}
			title={name}
		/>
	);

	if (promptSuggestion) {
		return (
			<div data-slot="entity-card-app" className={cn("contents", className)}>
				<div className="flex flex-col gap-2">
					{header}

					{/* Hover swap: the resting description + stats and the onboarding prompt
					    share one grid cell so the card height never shifts, and cross-fade
					    on card hover/focus-within (the `group/card` context lives on the shell). */}
					<div className="grid">
						<div className="flex flex-col gap-2 [grid-area:1/1] transition-opacity duration-fast ease-out group-hover/card:opacity-0 group-focus-within/card:opacity-0">
							{descriptionContent}
							{footerContent}
						</div>

						<div className="flex flex-col gap-2 opacity-0 [grid-area:1/1] transition-opacity duration-fast ease-out group-hover/card:opacity-100 group-focus-within/card:opacity-100">
							<p className="line-clamp-2 min-h-10 text-sm leading-5 text-text-subtle">
								{`“${promptSuggestion}”`}
							</p>
							<p className="text-xs leading-4 text-text-subtlest">@ {mentionHandle}</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div data-slot="entity-card-app" className={cn("contents", className)}>
			<div className="flex flex-col gap-2">
				{header}

				{descriptionContent}
			</div>

			{footerContent}
		</div>
	);
}
