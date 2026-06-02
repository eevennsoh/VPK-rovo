"use client";

import Image from "next/image";
import { type ReactNode } from "react";
import AiChatIcon from "@atlaskit/icon/core/ai-chat";
import StarUnstarredIcon from "@atlaskit/icon/core/star-unstarred";

import { Avatar } from "@/components/ui/avatar";
import { AtlassianLogo, isAtlassianLogoSource } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

import { CardDirectory } from "./card-directory";
import {
	CardDirectoryByline,
	CardDirectoryDescription,
	CardDirectoryFooter,
	CardDirectoryHeader,
	CardDirectoryMoreButton,
	CardDirectoryStat,
	formatCompact,
} from "./card-directory-parts";

export interface CardDirectoryAgentProps {
	name: string;
	avatarSrc: string;
	publisher: string;
	description?: string;
	verified?: boolean;
	rating?: number;
	feedbackCount?: number;
	chatCount?: number;
	/** Extra classes applied to the avatar image (e.g. to scale a wide logo). */
	avatarImageClassName?: string;
	active?: boolean;
	moreAction?: ReactNode;
	onSelect?: () => void;
	onMoreActions?: () => void;
	className?: string;
}

/** Agent directory card — hexagon avatar, attribution, rating, and chat stats. */
export function CardDirectoryAgent({
	name,
	avatarSrc,
	publisher,
	description,
	verified = false,
	rating,
	feedbackCount,
	chatCount,
	avatarImageClassName,
	active = false,
	moreAction,
	onSelect,
	onMoreActions,
	className,
}: Readonly<CardDirectoryAgentProps>) {
	const showRating = typeof rating === "number";
	const showChats = typeof chatCount === "number";
	const leadingAvatar = isAtlassianLogoSource(avatarSrc) ? (
		<Avatar size="default" shape="hexagon" className="items-center justify-center bg-surface">
			<AtlassianLogo name="atlassian" label={name} size="medium" />
		</Avatar>
	) : (
		<Avatar size="default" shape="hexagon">
			<Image
				alt=""
				aria-hidden
				className={cn("size-full object-contain", avatarImageClassName)}
				height={32}
				src={avatarSrc}
				width={32}
			/>
		</Avatar>
	);

	return (
		<CardDirectory active={active} className={cn("gap-4", className)} onSelect={onSelect} selectLabel={`Select ${name}`}>
			<div className="flex flex-col gap-2">
				<CardDirectoryHeader
					action={
						moreAction ?? (onMoreActions ? (
							<CardDirectoryMoreButton active={active} label={`More actions for ${name}`} onClick={onMoreActions} />
						) : null)
					}
					byline={<CardDirectoryByline publisher={publisher} verified={verified} />}
					leading={leadingAvatar}
					title={name}
				/>

				<CardDirectoryDescription>
					{description ?? `Learn how ${name} can help your team work faster.`}
				</CardDirectoryDescription>
			</div>

			{showRating || showChats ? (
				<CardDirectoryFooter>
					{showRating ? (
						<CardDirectoryStat
							icon={<StarUnstarredIcon label="" size="small" spacing="none" color="currentColor" />}
						>
							{rating.toFixed(1)}
							{typeof feedbackCount === "number" ? ` (${formatCompact(feedbackCount)} feedback)` : null}
						</CardDirectoryStat>
					) : null}
					{showChats ? (
						<CardDirectoryStat
							icon={<AiChatIcon label="" size="small" spacing="none" color="currentColor" />}
						>
							{formatCompact(chatCount)} chats
						</CardDirectoryStat>
					) : null}
				</CardDirectoryFooter>
			) : null}
		</CardDirectory>
	);
}
