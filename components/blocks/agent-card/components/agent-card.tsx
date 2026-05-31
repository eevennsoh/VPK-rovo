"use client";

import Image from "next/image";
import type { ComponentProps, ReactElement } from "react";

import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import AudioWaveformIcon from "@atlaskit/icon-lab/core/audio-waveform";
import SwapIcon from "@atlaskit/icon-lab/core/swap";

import { Avatar, AvatarCompanyBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AtlassianLogo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";

const AGENT_CATEGORY_BANNER_COLOR: Record<string, string> = {
	"dev-agents": "#82B536",
	"product-agents": "#BF63F3",
	"service-agents": "#FFC716",
	"strategy-agents": "#FF9F1A",
	"teamwork-agents": "#1868DB",
};

const DEFAULT_BANNER_COLOR = "#1868DB";

function getBannerColorFromAvatarSrc(src: string): string {
	const category = src.match(/\/avatar-agent\/([^/]+)\//)?.[1];
	return (category && AGENT_CATEGORY_BANNER_COLOR[category]) ?? DEFAULT_BANNER_COLOR;
}

export interface AgentCardProps extends Omit<ComponentProps<"section">, "children"> {
	name?: string;
	partnerName?: string;
	description?: string;
	avatarSrc?: string;
	coverSrc?: string;
	avatarAlt?: string;
	coverBackgroundColor?: string;
	inputPlaceholder?: string;
	inputActionLabel?: string;
	moreActionLabel?: string;
	swapActionLabel?: string;
	voiceActionLabel?: string;
	onInputAction?: () => void;
	onMoreAction?: () => void;
	onSwapAction?: () => void;
	onVoiceInput?: () => void;
}

function AgentCard({
	name = "Task Improver",
	partnerName = "Atlassian",
	description = "Proactively assists by automatically suggesting subtasks when you start adding one and providing comment summaries.",
	avatarSrc = "/avatar-agent/teamwork-agents/blocker-checker.svg",
	coverSrc = avatarSrc,
	avatarAlt = "",
	coverBackgroundColor,
	inputPlaceholder = "Ask, @mention, or / for actions",
	inputActionLabel,
	moreActionLabel,
	swapActionLabel,
	voiceActionLabel = "Start voice input",
	onInputAction,
	onMoreAction,
	onSwapAction,
	onVoiceInput,
	className,
	...props
}: Readonly<AgentCardProps>): ReactElement {
	const resolvedMoreActionLabel = moreActionLabel ?? `More actions for ${name}`;
	const resolvedSwapActionLabel = swapActionLabel ?? `Swap ${name}`;
	const resolvedCoverBackgroundColor =
		coverBackgroundColor ?? getBannerColorFromAvatarSrc(avatarSrc);

	return (
		<section
			aria-label={`${name} agent card`}
			className={cn(
				"relative flex !h-auto w-[360px] max-w-full self-start flex-col overflow-hidden rounded-xl bg-surface-raised shadow-sm",
				className,
			)}
			data-slot="agent-card"
			{...props}
		>
			<div
				aria-hidden="true"
				className="relative h-12 shrink-0 overflow-hidden"
				style={{ backgroundColor: resolvedCoverBackgroundColor }}
			>
				<Image
					alt=""
					aria-hidden
					className="absolute top-1/2 left-[76%] h-48 w-[168px] -translate-x-1/2 -translate-y-1/2 opacity-95"
					height={192}
					src={coverSrc}
					width={168}
				/>
			</div>

			<div className="flex flex-col gap-4 bg-surface-raised pt-6">
				<div className="flex flex-col gap-1 px-4 pt-2">
					<div className="flex w-full items-center justify-between gap-3">
						<h3 className="min-w-0 truncate text-[20px] leading-6 font-bold text-text">
							{name}
						</h3>
						<div className="flex items-center gap-2">
							<Button
								aria-label={resolvedSwapActionLabel}
								className="size-6 rounded-md bg-surface p-0 text-icon-subtle"
								onClick={onSwapAction}
								size="icon-xs"
								type="button"
								variant="outline"
							>
								<SwapIcon label="" size="small" />
							</Button>
							<Button
								aria-label={resolvedMoreActionLabel}
								className="size-6 rounded-md bg-surface p-0 text-icon-subtle"
								onClick={onMoreAction}
								size="icon-xs"
								type="button"
								variant="outline"
							>
								<ShowMoreHorizontalIcon label="" size="small" />
							</Button>
						</div>
					</div>
					<p className="text-xs leading-4 text-text-subtle">
						By <span className="text-link">{partnerName}</span>
					</p>
				</div>
				<p className="px-4 pb-4 text-sm leading-5 text-text">
					{description}
				</p>
			</div>

			<div className="flex h-[60px] items-start bg-surface px-3 pb-3">
				<div className="flex h-12 w-full items-center justify-between rounded-xl border border-border bg-bg-input px-3 shadow-[0px_-2px_25px_rgba(30,31,33,0.08)]">
					{onInputAction ? (
						<button
							aria-label={inputActionLabel ?? inputPlaceholder}
							className="min-w-0 flex-1 truncate rounded-md px-1.5 text-left text-sm leading-5 text-text-subtlest outline-none hover:text-text-subtle focus-visible:ring-2 focus-visible:ring-ring"
							onClick={onInputAction}
							type="button"
						>
							{inputPlaceholder}
						</button>
					) : (
						<p className="min-w-0 flex-1 truncate px-1.5 text-left text-sm leading-5 text-text-subtlest">
							{inputPlaceholder}
						</p>
					)}
					<Button
						aria-label={voiceActionLabel}
						className="size-8 rounded-md p-0 text-icon-subtle"
						onClick={onVoiceInput}
						size="icon"
						type="button"
						variant="ghost"
					>
						<AudioWaveformIcon label="" size="small" />
					</Button>
				</div>
			</div>

			<Avatar
				aria-hidden={avatarAlt === ""}
				className="absolute top-6 left-4"
				shape="hexagon"
				size="xl"
			>
				<AvatarImage alt={avatarAlt} src={avatarSrc} />
				<AvatarFallback>{name.slice(0, 2)}</AvatarFallback>
				<AvatarCompanyBadge>
					<AtlassianLogo
						appearance="inverse"
						label=""
						name="atlassian"
						shouldUseNewLogoDesign
						size="xxsmall"
						themeAware={false}
					/>
				</AvatarCompanyBadge>
			</Avatar>
		</section>
	);
}

export { AgentCard };
