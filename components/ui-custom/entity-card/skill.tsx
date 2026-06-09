"use client";

import Image from "next/image";
import { type ReactElement, type ReactNode } from "react";
import PeopleGroupIcon from "@atlaskit/icon/core/people-group";
import StarUnstarredIcon from "@atlaskit/icon/core/star-unstarred";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { IconTile, type IconTileVariant } from "@/components/ui/icon-tile";
import { cn } from "@/lib/utils";

import {
	EntityCardByline,
	EntityCardDescription,
	EntityCardFooter,
	EntityCardHeader,
	EntityCardMoreButton,
	EntityCardStat,
	formatCompact,
} from "./parts";

export type EntityCardDensity = "directory" | "preview" | "compact";

export interface EntityCardIcon {
	render: ReactElement;
	label: string;
	className?: string;
}

export type EntityCardSource =
	| {
			type: "app";
			name: string;
			logoSrc?: string;
	  }
	| {
			type: "custom";
			name: string;
			avatarSrc?: string;
			fallbackInitials?: string;
	  };

export interface EntityCardSkillProps {
	name: string;
	icon?: ReactNode;
	iconTile?: boolean;
	iconVariant?: IconTileVariant;
	iconMeta?: EntityCardIcon;
	publisher?: string;
	publisherLogo?: ReactNode;
	verified?: boolean;
	source?: EntityCardSource;
	description?: string;
	starCount?: number;
	teammateCount?: number;
	revealStatsOnHover?: boolean;
	action?: ReactNode;
	onMoreActions?: () => void;
	density?: EntityCardDensity;
	className?: string;
}

function getInitials(name: string): string {
	return (
		name
			.split(" ")
			.filter(Boolean)
			.slice(0, 2)
			.map((word) => word[0]?.toUpperCase())
			.join("") || "?"
	);
}

function EntityCardSourceRow({ source }: Readonly<{ source: EntityCardSource }>) {
	return (
		<div data-slot="entity-card-source" className="flex items-center gap-1">
			{source.type === "custom" ? (
				<>
					<Avatar size="xs">
						{source.avatarSrc ? (
							<AvatarImage src={source.avatarSrc} alt={source.name} />
						) : null}
						<AvatarFallback>{source.fallbackInitials ?? getInitials(source.name)}</AvatarFallback>
					</Avatar>
					<p className="text-xs text-text-subtle">{source.name}</p>
				</>
			) : (
				<>
					{source.logoSrc ? (
						<Image
							src={source.logoSrc}
							alt={`${source.name} logo`}
							width={16}
							height={16}
							className="size-4 rounded-xs object-cover"
							unoptimized
						/>
					) : (
						<span aria-hidden className="size-4 rounded-full bg-bg-neutral" />
					)}
					<p className="text-xs text-text-subtlest">{source.name}</p>
				</>
			)}
		</div>
	);
}

export function EntityCardSkill({
	name,
	icon,
	iconTile = true,
	iconVariant = "gray",
	iconMeta,
	publisher,
	verified = false,
	source,
	description,
	starCount,
	teammateCount,
	revealStatsOnHover = false,
	action,
	onMoreActions,
	density = "directory",
	className,
}: Readonly<EntityCardSkillProps>) {
	const showStars = typeof starCount === "number";
	const showTeammates = typeof teammateCount === "number";

	if (density === "preview") {
		return (
			<div data-slot="entity-card-skill" className={cn("flex flex-col gap-4", className)}>
				<div data-slot="entity-card-skill-header" className="flex flex-col gap-2">
					<div className="flex items-center gap-2">
						{iconMeta ? (
							<Icon
								render={iconMeta.render}
								label={iconMeta.label}
								className={cn("text-icon-subtle", iconMeta.className)}
							/>
						) : icon ? (
							<span aria-hidden className="inline-flex size-4 items-center justify-center text-icon-subtle [&_svg]:size-4">
								{icon}
							</span>
						) : null}
						<h3 className="text-sm font-semibold leading-5 text-text">{name}</h3>
					</div>
					{description ? (
						<p className="line-clamp-2 text-sm leading-5 text-text">{description}</p>
					) : null}
				</div>

				{source ? <EntityCardSourceRow source={source} /> : null}
			</div>
		);
	}

	return (
		<div data-slot="entity-card-skill" className={cn("contents", className)}>
			<EntityCardHeader
				action={
					action ?? (onMoreActions ? (
						<EntityCardMoreButton label={`More actions for ${name}`} onClick={onMoreActions} />
					) : null)
				}
				byline={publisher ? <EntityCardByline publisher={publisher} verified={verified} /> : undefined}
				leading={
					icon ? (
						iconTile ? (
							<IconTile aria-hidden icon={icon} label={name} size="medium" variant={iconVariant} />
						) : (
							<span aria-hidden className="inline-flex size-4 items-center justify-center [&_svg]:size-4">
								{icon}
							</span>
						)
					) : null
				}
				title={name}
			/>

			<EntityCardDescription>
				{description ?? `Learn how ${name} can help your team work faster.`}
			</EntityCardDescription>

			{showStars || showTeammates ? (
				<EntityCardFooter
					className={cn(
						revealStatsOnHover &&
							"opacity-0 transition-opacity duration-fast ease-out group-hover/card:opacity-100 group-focus-within/card:opacity-100",
					)}
				>
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
							Used by {formatCompact(teammateCount)} teammates
						</EntityCardStat>
					) : null}
				</EntityCardFooter>
			) : null}
		</div>
	);
}
