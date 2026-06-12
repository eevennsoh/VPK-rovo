"use client";

import type { CSSProperties, ReactNode } from "react";

import { AgentCardShell } from "@/components/blocks/agent-card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tile } from "@/components/ui/tile";
import { TeamworkGraphMark } from "@/components/ui-custom/teamwork-graph-mark";
import { TWGAppstack, type TwgToolSource } from "@/components/ui-custom/twg-appstack";
import { TwgToolBannerBackground } from "@/components/ui-custom/twg-tool";
import { ROVO_COLOR_SWATCHES } from "@/lib/rovo-colors";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import {
	DEFAULT_TWG_AGENT_CARD_SOURCES,
	DEFAULT_TWG_AGENT_CARD_SUGGESTIONS,
} from "../data/demo";

export interface TWGAgentSuggestion {
	id: string;
	name: string;
	description: string;
}

export interface TWGAgentCardProps {
	userName?: string;
	userAvatarSrc?: string;
	headline?: ReactNode;
	suggestedAgents?: readonly TWGAgentSuggestion[];
	sources?: readonly TwgToolSource[];
	onSelect?: () => void;
	selectLabel?: string;
	className?: string;
}

const DEFAULT_USER_AVATAR_SRC = "/avatar-human/florence-applebee.png";
const DEFAULT_HEADLINE = "we think we can help you complete your life by creating a team of autonomous agents for you.";

const GESTURAL_LINE_STYLE = {
	maskImage: `url("/gestural-line/eyelash-3.svg")`,
	maskPosition: "center",
	maskRepeat: "no-repeat",
	maskSize: "contain",
	WebkitMaskImage: `url("/gestural-line/eyelash-3.svg")`,
	WebkitMaskPosition: "center",
	WebkitMaskRepeat: "no-repeat",
	WebkitMaskSize: "contain",
} satisfies CSSProperties;

const CARD_ACCENT_STYLE = {
	"--twg-agent-card-blue": ROVO_COLOR_SWATCHES[0].cssVar,
	"--twg-agent-card-orange": ROVO_COLOR_SWATCHES[1].cssVar,
	"--twg-agent-card-purple": ROVO_COLOR_SWATCHES[2].cssVar,
	"--twg-agent-card-lime": ROVO_COLOR_SWATCHES[3].cssVar,
} as CSSProperties;

function TWGAgentCardHeadline({
	headline,
	userAvatarSrc,
	userName,
}: Readonly<{
	headline: ReactNode;
	userAvatarSrc: string;
	userName: string;
}>) {
	return (
		<p className="relative z-10 text-text [text-wrap:balance]" style={{ font: token("font.heading.medium") }}>
			<span className="inline-flex items-center gap-2 align-middle">
				<span>Hey</span>
				<Avatar aria-hidden>
					<AvatarImage alt="" src={userAvatarSrc} />
					<AvatarFallback>{userName.slice(0, 2).toUpperCase()}</AvatarFallback>
				</Avatar>
				<span>{userName},</span>
			</span>{" "}
			{headline}
		</p>
	);
}

function TWGAgentSuggestionRow({ suggestion }: Readonly<{ suggestion: TWGAgentSuggestion }>) {
	return (
		<div className="grid min-w-0 gap-0.5">
			<p className="truncate text-sm font-semibold leading-5 text-text">{suggestion.name}</p>
			<p className="line-clamp-2 text-xs leading-4 text-text-subtle">{suggestion.description}</p>
		</div>
	);
}

export function TWGAgentCard({
	className,
	headline = DEFAULT_HEADLINE,
	onSelect,
	selectLabel = "Open Teamwork Graph agent recommendations",
	sources = DEFAULT_TWG_AGENT_CARD_SOURCES,
	suggestedAgents = DEFAULT_TWG_AGENT_CARD_SUGGESTIONS,
	userAvatarSrc = DEFAULT_USER_AVATAR_SRC,
	userName = "Venn",
}: Readonly<TWGAgentCardProps>) {
	const visibleSuggestions = suggestedAgents.slice(0, 3);

	return (
		<AgentCardShell
			className={cn(
				"h-[423px] w-full max-w-[376px] gap-0 overflow-hidden rounded-[16px] bg-surface p-0 after:rounded-[16px] [&_[data-slot=agent-card-select]]:rounded-[16px]",
				className,
			)}
			onSelect={onSelect}
			selectLabel={selectLabel}
		>
			<div
				className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[16px]"
				data-slot="twg-agent-card"
				style={CARD_ACCENT_STYLE}
			>
				<TwgToolBannerBackground />
				<div
					aria-hidden
					className="pointer-events-none absolute -right-2 top-[52%] z-0 h-16 w-[136px] -rotate-6 bg-orange-300 opacity-95"
					style={GESTURAL_LINE_STYLE}
				/>
				<div aria-hidden className="absolute right-4 top-4 size-2 rounded-full bg-blue-600 opacity-70" />
				<div aria-hidden className="absolute right-8 top-8 size-1.5 rounded-full bg-purple-500 opacity-70" />
				<div aria-hidden className="absolute right-3 top-12 size-2 rounded-full bg-lime-400 opacity-70" />

				<div className="relative z-10 flex shrink-0 items-start gap-3 px-4 pt-4">
					<Tile
						hasBorder
						label="Teamwork Graph"
						size="xlarge"
						variant="neutral"
					>
						<TeamworkGraphMark />
					</Tile>
					<div className="min-w-0 flex-1 pt-0.5">
						<p className="truncate text-base font-semibold leading-5 text-text-subtle">
							Suggested by Teamwork Graph
						</p>
						<TWGAppstack
							animated
							className="mt-2 justify-start"
							iconSize="md"
							maxVisible={7}
							sources={sources}
						/>
					</div>
				</div>

				<div className="relative z-10 flex min-h-0 flex-1 flex-col px-4 pt-4">
					<TWGAgentCardHeadline
						headline={headline}
						userAvatarSrc={userAvatarSrc}
						userName={userName}
					/>
				</div>

				<div className="relative z-10 grid shrink-0 grid-cols-[96px_minmax(0,1fr)] gap-x-4 px-4 pb-4">
					<p className="col-span-2 mb-2 text-xs font-semibold leading-4 text-text-subtlest">
						Your dream team
					</p>
					<div
						aria-label={`${suggestedAgents.length} suggested agents`}
						className="self-start text-[128px]/[0.76] font-black text-text"
					>
						{suggestedAgents.length}
					</div>
					<div className="flex min-w-0 flex-col gap-2.5 pt-1">
						{visibleSuggestions.map((suggestion) => (
							<TWGAgentSuggestionRow key={suggestion.id} suggestion={suggestion} />
						))}
					</div>
				</div>
			</div>
		</AgentCardShell>
	);
}

TWGAgentCard.displayName = "TWGAgentCard";
