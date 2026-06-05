"use client";

import Image from "next/image";
import { type ReactNode } from "react";
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
	/**
	 * Inset the `avatarSrc` image to 16x16 inside the hexagon container (rather
	 * than letting it fill edge-to-edge). Use with the purpose-built borderless
	 * 16px marks (e.g. Notion, Slack, Google Drive) so the logo sits centered as
	 * a tile while the hexagon container + outline are preserved.
	 */
	insetLogo?: boolean;
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
	logoName,
	publisher,
	description,
	verified = false,
	rating,
	feedbackCount,
	chatCount,
	avatarImageClassName,
	insetLogo = false,
	active = false,
	moreAction,
	onSelect,
	onMoreActions,
	className,
}: Readonly<CardDirectoryAgentProps>) {
	const showRating = typeof rating === "number";
	const showChats = typeof chatCount === "number";
	const leadingAvatar = (
		<Avatar size="default" shape="hexagon">
			{logoName ? (
				// The Atlassian "one" brand mark reads heavy at 32px inside the hexagon;
				// render it at 20x20 so it sits like an inset logo rather than a full bleed.
				<AtlassianLogo
					name={logoName}
					size={logoName === "atlassian" ? "xsmall" : "medium"}
					themeAware
					label={name}
				/>
			) : avatarSrc ? (
				// Inset marks sit at 16x16 inside the hexagon container so they read as a
				// tile; otherwise the image fills the hexagon (with optional scaling).
				<Image
					alt=""
					aria-hidden
					className={
						insetLogo
							? cn("size-4 object-contain", avatarImageClassName)
							: cn("size-full object-contain", avatarImageClassName)
					}
					height={insetLogo ? 16 : 32}
					src={avatarSrc}
					width={insetLogo ? 16 : 32}
				/>
			) : null}
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
