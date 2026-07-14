"use client";

// oxlint-disable react-doctor/jsx-no-jsx-as-prop -- These components intentionally use slot/render-node props for icons, triggers, and adornments.

import { type ReactNode } from "react";
import AiChatIcon from "@atlaskit/icon/core/ai-chat";
import StarUnstarredIcon from "@atlaskit/icon/core/star-unstarred";

import type { AtlassianLogoName } from "@/components/ui/logo";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
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
	/** When set, renders the upstream `@atlassian/logo-third-party` borderless glyph inside the hexagon avatar. */
	brandName?: ThirdPartyLogoName;
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
	brandName,
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
		<AgentAvatarVisual
			avatarSrc={avatarSrc}
			brandName={brandName}
			className={avatarImageClassName}
			fallbackText={name.slice(0, 2).toUpperCase()}
			inset={insetLogo}
			label={name}
			logoName={logoName}
			sizePx={32}
		/>
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
