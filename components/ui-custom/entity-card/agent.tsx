"use client";

// oxlint-disable react-doctor/jsx-no-jsx-as-prop -- These components intentionally use slot/render-node props for icons, triggers, and adornments.

import Image from "next/image";
import { type ReactNode } from "react";
import AiChatIcon from "@atlaskit/icon/core/ai-chat";
import StarUnstarredIcon from "@atlaskit/icon/core/star-unstarred";

import { Avatar } from "@/components/ui/avatar";
import { AtlassianLogo, type AtlassianLogoName } from "@/components/ui/logo";
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

export interface EntityCardAgentProps {
	name: string;
	avatarSrc?: string;
	logoName?: AtlassianLogoName;
	publisher: string;
	description?: string;
	verified?: boolean;
	rating?: number;
	feedbackCount?: number;
	chatCount?: number;
	avatarImageClassName?: string;
	insetLogo?: boolean;
	active?: boolean;
	action?: ReactNode;
	onMoreActions?: () => void;
	className?: string;
}

export function EntityCardAgent({
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
	action,
	onMoreActions,
	className,
}: Readonly<EntityCardAgentProps>) {
	const showRating = typeof rating === "number";
	const showChats = typeof chatCount === "number";
	const leadingAvatar = (
		<Avatar size="default" shape="hexagon">
			{logoName ? (
				<AtlassianLogo
					name={logoName}
					size={logoName === "atlassian" ? "xsmall" : "medium"}
					themeAware
					label={name}
				/>
			) : avatarSrc ? (
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
		<div data-slot="entity-card-agent" className={cn("contents", className)}>
			<div className="flex flex-col gap-2">
				<EntityCardHeader
					action={
						action ?? (onMoreActions ? (
							<EntityCardMoreButton active={active} label={`More actions for ${name}`} onClick={onMoreActions} />
						) : null)
					}
					byline={<EntityCardByline publisher={publisher} verified={verified} />}
					leading={leadingAvatar}
					title={name}
				/>

				<EntityCardDescription>
					{description ?? `Learn how ${name} can help your team work faster.`}
				</EntityCardDescription>
			</div>

			{showRating || showChats ? (
				<EntityCardFooter>
					{showRating ? (
						<EntityCardStat
							icon={<StarUnstarredIcon label="" size="small" spacing="none" color="currentColor" />}
						>
							{rating.toFixed(1)}
							{typeof feedbackCount === "number" ? ` (${formatCompact(feedbackCount)} feedback)` : null}
						</EntityCardStat>
					) : null}
					{showChats ? (
						<EntityCardStat
							icon={<AiChatIcon label="" size="small" spacing="none" color="currentColor" />}
						>
							{formatCompact(chatCount)} chats
						</EntityCardStat>
					) : null}
				</EntityCardFooter>
			) : null}
		</div>
	);
}
