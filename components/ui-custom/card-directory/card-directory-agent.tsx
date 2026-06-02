"use client";

import Image from "next/image";
import AiChatIcon from "@atlaskit/icon/core/ai-chat";
import StarUnstarredIcon from "@atlaskit/icon/core/star-unstarred";

import { Avatar } from "@/components/ui/avatar";
import { AtlassianLogo, type AtlassianLogoName } from "@/components/ui/logo";
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
	avatarSrc?: string;
	/** When set, renders the ADS brand logo instead of an `avatarSrc` image. */
	logoName?: AtlassianLogoName;
	publisher: string;
	description?: string;
	verified?: boolean;
	rating?: number;
	feedbackCount?: number;
	chatCount?: number;
	/** Extra classes applied to the avatar image (e.g. to scale a wide logo). */
	avatarImageClassName?: string;
	onSelect?: () => void;
	onMoreActions?: () => void;
	className?: string;
}

/** Agent directory card — hexagon avatar, attribution, rating, and chat stats. */
export function CardDirectoryAgent({
	name,
	avatarSrc,
	logoName,
	publisher,
	description,
	verified = false,
	rating,
	feedbackCount,
	chatCount,
	avatarImageClassName,
	onSelect,
	onMoreActions,
	className,
}: Readonly<CardDirectoryAgentProps>) {
	const showRating = typeof rating === "number";
	const showChats = typeof chatCount === "number";

	return (
		<CardDirectory className={className} onSelect={onSelect} selectLabel={`Select ${name}`}>
			<CardDirectoryHeader
				action={
					onMoreActions ? (
						<CardDirectoryMoreButton label={`More actions for ${name}`} onClick={onMoreActions} />
					) : null
				}
				byline={<CardDirectoryByline publisher={publisher} verified={verified} />}
				leading={
					<Avatar size="default" shape="hexagon">
						{logoName ? (
							<AtlassianLogo name={logoName} size="medium" themeAware label={name} />
						) : avatarSrc ? (
							<Image
								alt=""
								aria-hidden
								className={cn("size-full object-contain", avatarImageClassName)}
								height={32}
								src={avatarSrc}
								width={32}
							/>
						) : null}
					</Avatar>
				}
				title={name}
			/>

			<CardDirectoryDescription>
				{description ?? `Learn how ${name} can help your team work faster.`}
			</CardDirectoryDescription>

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
