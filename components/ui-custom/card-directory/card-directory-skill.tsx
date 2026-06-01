"use client";

import { type ReactNode } from "react";
import EyeOpenIcon from "@atlaskit/icon/core/eye-open";
import StarUnstarredIcon from "@atlaskit/icon/core/star-unstarred";

import { IconTile, type IconTileVariant } from "@/components/ui/icon-tile";
import { cn } from "@/lib/utils";

import { CardDirectory } from "./card-directory";
import {
	CardDirectoryDescription,
	CardDirectoryFooter,
	CardDirectoryHeader,
	CardDirectoryMoreButton,
	CardDirectoryStat,
	formatCompact,
} from "./card-directory-parts";

export interface CardDirectorySkillProps {
	name: string;
	/** Core icon element rendered inside the leading icon tile (or plain when `iconTile` is false). */
	icon: ReactNode;
	iconVariant?: IconTileVariant;
	/** Wrap the icon in an `IconTile` (default). Set false for a bare 16px icon beside the title (Figma skill card). */
	iconTile?: boolean;
	publisher: string;
	/** Small publisher logo shown beside the publisher name in the footer. */
	publisherLogo?: ReactNode;
	description?: string;
	starCount?: number;
	viewCount?: number;
	/** Hide the usage stats until the card is hovered or focused (Figma skill card). */
	revealStatsOnHover?: boolean;
	onSelect?: () => void;
	onMoreActions?: () => void;
	className?: string;
}

/** Skill directory card — icon tile, publisher attribution, and usage stats. */
export function CardDirectorySkill({
	name,
	icon,
	iconVariant = "gray",
	iconTile = true,
	publisher,
	publisherLogo,
	description,
	starCount,
	viewCount,
	revealStatsOnHover = false,
	onSelect,
	onMoreActions,
	className,
}: Readonly<CardDirectorySkillProps>) {
	const showStars = typeof starCount === "number";
	const showViews = typeof viewCount === "number";

	return (
		<CardDirectory className={className} onSelect={onSelect} selectLabel={`Select ${name}`}>
			<CardDirectoryHeader
				action={
					onMoreActions ? (
						<CardDirectoryMoreButton label={`More actions for ${name}`} onClick={onMoreActions} />
					) : null
				}
				leading={
					iconTile ? (
						<IconTile aria-hidden icon={icon} label={name} size="small" variant={iconVariant} />
					) : (
						<span aria-hidden className="inline-flex size-4 items-center justify-center [&_svg]:size-4">
							{icon}
						</span>
					)
				}
				title={name}
			/>

			<CardDirectoryDescription>
				{description ?? `Learn how ${name} can help your team work faster.`}
			</CardDirectoryDescription>

			<CardDirectoryFooter className="justify-between">
				<span className="inline-flex min-w-0 items-center gap-1 text-text-subtle">
					{publisherLogo ?? null}
					<span className="truncate">{publisher}</span>
				</span>
				{showStars || showViews ? (
					<span
						className={cn(
							"inline-flex shrink-0 items-center gap-4",
							revealStatsOnHover &&
								"opacity-0 transition-opacity duration-fast ease-out group-hover/card:opacity-100 group-focus-within/card:opacity-100",
						)}
					>
						{showStars ? (
							<CardDirectoryStat
								icon={<StarUnstarredIcon label="" size="small" spacing="none" color="currentColor" />}
							>
								{formatCompact(starCount)}
							</CardDirectoryStat>
						) : null}
						{showViews ? (
							<CardDirectoryStat
								icon={<EyeOpenIcon label="" size="small" spacing="none" color="currentColor" />}
							>
								{formatCompact(viewCount)}
							</CardDirectoryStat>
						) : null}
					</span>
				) : null}
			</CardDirectoryFooter>
		</CardDirectory>
	);
}
