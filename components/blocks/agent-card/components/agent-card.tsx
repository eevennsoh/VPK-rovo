"use client";

import { type CSSProperties, type MouseEvent, type ReactNode, type UIEvent, useCallback, useState } from "react";
import Image from "next/image";
import AiChatIcon from "@atlaskit/icon/core/ai-chat";
import StarUnstarredIcon from "@atlaskit/icon/core/star-unstarred";

import { Avatar, AvatarCompanyBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage, AvatarProjectBadge } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AtlassianLogo } from "@/components/ui/logo";
import { Separator } from "@/components/ui/separator";
import { SkillTag, SkillTagGroup, type SkillTagColor } from "@/components/ui-custom/skill-tag";
import { TWGAppstack, type TwgToolSource } from "@/components/ui-custom/twg-appstack";
import { getSkillIcon } from "@/lib/skill-icons";
import { cn } from "@/lib/utils";

import {
	AgentCardBanner,
	AgentCardByline,
	AgentCardCapabilities,
	AgentCardDescription,
	AgentCardFooter,
	AgentCardHeader,
	AgentCardMoreButton,
	AgentCardSection,
	AgentCardShell,
	AgentCardStat,
	type AgentCardCapability,
	formatCompact,
} from "./agent-card-parts";

/** A skill tag shown in the agent card's "Skills" section. */
export interface AgentCardSkill {
	label: string;
	color?: SkillTagColor;
	icon?: ReactNode;
}

const MAX_VISIBLE_COLLABORATORS = 4;
const SKILLS_MAX_ROWS = 2;
const SKILLS_GROUP_CLASS_NAME = "h-11 content-start overflow-clip [overflow-clip-margin:3px]";
const PROJECT_BADGE_AVATAR_SRCS = [
	"/avatar-project/apple.svg",
	"/avatar-project/bank.svg",
	"/avatar-project/battery.svg",
	"/avatar-project/boat.svg",
	"/avatar-project/book.svg",
	"/avatar-project/canvas.svg",
	"/avatar-project/cat.svg",
	"/avatar-project/celebration.svg",
	"/avatar-project/cloud.svg",
	"/avatar-project/code.svg",
	"/avatar-project/compass.svg",
	"/avatar-project/connie-blog.svg",
	"/avatar-project/gears.svg",
	"/avatar-project/government.svg",
	"/avatar-project/graduation.svg",
	"/avatar-project/graph.svg",
	"/avatar-project/group.svg",
	"/avatar-project/hr-badge.svg",
	"/avatar-project/id.svg",
	"/avatar-project/it.svg",
	"/avatar-project/launch-ship.svg",
	"/avatar-project/life-ring.svg",
	"/avatar-project/light-bulb.svg",
	"/avatar-project/lightning.svg",
	"/avatar-project/loom-record.svg",
	"/avatar-project/loom-video.svg",
	"/avatar-project/magnifying-glass.svg",
	"/avatar-project/mail.svg",
	"/avatar-project/map.svg",
	"/avatar-project/megaphone.svg",
	"/avatar-project/palm-tree.svg",
	"/avatar-project/paper-airplane.svg",
	"/avatar-project/pencil.svg",
	"/avatar-project/phone.svg",
	"/avatar-project/pin.svg",
	"/avatar-project/plant.svg",
	"/avatar-project/rocket.svg",
	"/avatar-project/science.svg",
	"/avatar-project/service-bell.svg",
	"/avatar-project/shield.svg",
	"/avatar-project/shopping-cart.svg",
	"/avatar-project/star.svg",
	"/avatar-project/stopwatch.svg",
	"/avatar-project/store-bag.svg",
	"/avatar-project/storefront.svg",
	"/avatar-project/sun.svg",
	"/avatar-project/support-wrench.svg",
	"/avatar-project/tracking.svg",
	"/avatar-project/unicorn.svg",
	"/avatar-project/video.svg",
] as const;
const SCROLL_MASK_IMAGE = [
	"linear-gradient(to bottom, transparent 0, black var(--scroll-mask-fade-size), black 100%)",
	"linear-gradient(black, black)",
].join(", ");
const SCROLL_MASK_STYLE = {
	"--scroll-mask-fade-size": "var(--ds-space-200)",
	"--scroll-mask-scrollbar-width": "10px",
	maskImage: SCROLL_MASK_IMAGE,
	WebkitMaskImage: SCROLL_MASK_IMAGE,
	maskPosition: "0 0, 100% 0",
	WebkitMaskPosition: "0 0, 100% 0",
	maskRepeat: "no-repeat, no-repeat",
	WebkitMaskRepeat: "no-repeat, no-repeat",
	maskSize: "calc(100% - var(--scroll-mask-scrollbar-width)) 100%, var(--scroll-mask-scrollbar-width) 100%",
	WebkitMaskSize: "calc(100% - var(--scroll-mask-scrollbar-width)) 100%, var(--scroll-mask-scrollbar-width) 100%",
} satisfies CSSProperties & {
	"--scroll-mask-fade-size": string;
	"--scroll-mask-scrollbar-width": string;
};

function getProjectBadgeAvatarSrc(seed: string) {
	let hash = 0;

	for (let index = 0; index < seed.length; index += 1) {
		hash = ((hash * 31) + seed.charCodeAt(index)) >>> 0;
	}

	return PROJECT_BADGE_AVATAR_SRCS[hash % PROJECT_BADGE_AVATAR_SRCS.length];
}

/**
 * Agent card layout:
 * - `"expanded"` (default): cover banner, byline, capabilities feature list, and a
 *   stats / collaborators footer. Matches the rich template-detail card.
 * - `"template"`: a flat card — icon + name header, description, "Works with"
 *   sources, and "Skills" tags. No banner, capabilities, or footer.
 */
export type AgentCardVariant = "expanded" | "template";

export interface AgentCardProps {
	name: string;
	/** Layout variant. Defaults to `"expanded"`. */
	variant?: AgentCardVariant;
	avatarSrc?: string;
	/** Flat icon shown by the `"template"` variant header (when there is no banner). */
	iconSrc?: string;
	publisher: string;
	attributionKind?: "company" | "team" | "person";
	publisherLogoSrc?: string;
	description?: string;
	/** Capabilities feature list — only rendered by the `"expanded"` variant. */
	capabilities?: readonly (AgentCardCapability | string)[];
	capabilitiesLabel?: string;
	sources?: ReadonlyArray<TwgToolSource>;
	skills?: ReadonlyArray<AgentCardSkill>;
	stats?: ReadonlyArray<{ value: string; label: string }>;
	collaborators?: ReadonlyArray<{ src: string; name: string }>;
	collaboratorOverflow?: number;
	coverBackgroundColor?: string;
	verified?: boolean;
	rating?: number;
	feedbackCount?: number;
	chatCount?: number;
	onSelect?: () => void;
	onMoreActions?: () => void;
	className?: string;
}

/**
 * Agent card — a bordered, hover-elevating surface. The default `"expanded"` variant
 * shows a cover banner, attribution byline, "Works with" sources, "Skills" tags, a
 * scrollable capabilities feature list, and a stats / collaborators footer that swaps
 * to a "Use template" action on hover. The `"template"` variant renders a flat card
 * (icon + name, description, "Works with", "Skills"). Self-contained block; passing
 * onSelect makes the whole card selectable.
 */
export function AgentCard({
	name,
	variant = "expanded",
	avatarSrc,
	iconSrc,
	publisher,
	attributionKind,
	publisherLogoSrc,
	description,
	capabilities = [],
	capabilitiesLabel,
	sources = [],
	skills = [],
	stats = [],
	collaborators = [],
	collaboratorOverflow,
	coverBackgroundColor,
	verified = false,
	rating,
	feedbackCount,
	chatCount,
	onSelect,
	onMoreActions,
	className,
}: Readonly<AgentCardProps>) {
	const showStats = stats.length > 0;
	const showRating = !showStats && typeof rating === "number";
	const showChats = !showStats && typeof chatCount === "number";
	const showCollaborators = collaborators.length > 0;
	const showFooter = showStats || showRating || showChats || showCollaborators;
	const [bodyScrolled, setBodyScrolled] = useState(false);
	const visibleCollaborators = collaborators.slice(0, MAX_VISIBLE_COLLABORATORS);
	const hiddenCollaboratorCount =
		Math.max(collaborators.length - MAX_VISIBLE_COLLABORATORS, 0) + (collaboratorOverflow ?? 0);
	const showHiddenCollaboratorCount =
		visibleCollaborators.length === MAX_VISIBLE_COLLABORATORS && hiddenCollaboratorCount > 0;
	const handleUseTemplateClick = (event: MouseEvent<HTMLButtonElement>) => {
		event.stopPropagation();
		onSelect?.();
	};
	const handleBodyScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
		const nextBodyScrolled = event.currentTarget.scrollTop > 0;
		setBodyScrolled((currentBodyScrolled) => (
			currentBodyScrolled === nextBodyScrolled ? currentBodyScrolled : nextBodyScrolled
		));
	}, []);
	// The scroll body sits above the shell's select-overlay button (so it can own
	// wheel/drag scroll), which means clicks on it no longer fall through to that
	// button. Forward plain clicks to onSelect so whole-card selection still works;
	// clicks that originate on a genuinely interactive control are ignored here.
	const handleBodyClick = useCallback(
		(event: MouseEvent<HTMLDivElement>) => {
			if (event.defaultPrevented) return;
			if ((event.target as HTMLElement).closest("a,button,[role=button],[role=menuitem],input,select,textarea")) {
				return;
			}
			onSelect?.();
		},
		[onSelect],
	);
	const projectBadgeAvatarSrc = getProjectBadgeAvatarSrc(`${publisher}:${name}`);
	const avatarBadge = (() => {
		if (attributionKind === "company") {
			return (
				<AvatarCompanyBadge>
					{publisherLogoSrc ? (
						<img alt="" aria-hidden src={publisherLogoSrc} />
					) : (
						<AtlassianLogo
							appearance="inverse"
							label=""
							name="atlassian"
							shouldUseNewLogoDesign
							size="xxsmall"
							themeAware={false}
						/>
					)}
				</AvatarCompanyBadge>
			);
		}

		if (attributionKind === "team") {
			return (
				<AvatarProjectBadge>
					<img alt="" aria-hidden src={publisherLogoSrc ?? projectBadgeAvatarSrc} />
				</AvatarProjectBadge>
			);
		}

		return null;
	})();

	if (variant === "template") {
		return (
			<AgentCardShell className={className} onSelect={onSelect} selectLabel={`Select ${name}`}>
				<AgentCardHeader
					action={
						onMoreActions ? (
							<AgentCardMoreButton label={`More actions for ${name}`} onClick={onMoreActions} />
						) : null
					}
					leading={
						iconSrc ? (
							<Image alt="" aria-hidden className="size-8 object-contain" height={32} src={iconSrc} width={32} />
						) : undefined
					}
					title={name}
				/>

				<AgentCardDescription>
					{description ?? `Learn how ${name} can help your team work faster.`}
				</AgentCardDescription>

				{sources.length > 0 ? (
					<AgentCardSection label="Works with">
						<TWGAppstack animated={false} className="justify-start" iconSize="md" maxVisible={6} sources={sources} />
					</AgentCardSection>
				) : null}

				{skills.length > 0 ? (
					<AgentCardSection label="Skills">
						<SkillTagGroup maxRows={SKILLS_MAX_ROWS}>
							{skills.map((skill) => (
								<SkillTag color={skill.color ?? "default"} icon={skill.icon ?? getSkillIcon(skill.label)} key={skill.label}>
									{skill.label}
								</SkillTag>
							))}
						</SkillTagGroup>
					</AgentCardSection>
				) : null}
			</AgentCardShell>
		);
	}

	return (
		<AgentCardShell
			className={cn("gap-0 overflow-clip p-0", className)}
			onSelect={onSelect}
			selectLabel={`Select ${name}`}
		>
			<div className="shrink-0 bg-surface" data-slot="agent-card-sticky-header">
				<AgentCardBanner avatarBadge={avatarBadge} avatarSrc={avatarSrc} backgroundColor={coverBackgroundColor} />
				<div className="px-4 pt-3">
					<AgentCardHeader
						action={
							onMoreActions ? (
								<AgentCardMoreButton label={`More actions for ${name}`} onClick={onMoreActions} />
							) : null
						}
						byline={<AgentCardByline publisher={publisher} verified={verified} />}
						title={name}
					/>
					<AgentCardDescription className="mt-1">
						{description ?? `Learn how ${name} can help your team work faster.`}
					</AgentCardDescription>
				</div>
			</div>

			{/* Raise the scroll body above the absolute z-0 select-overlay button and give
			    it pointer-events so wheel/drag scroll lands here. Plain clicks are forwarded
			    to onSelect (see handleBodyClick); interactive descendants keep their behavior. */}
			<div
				className="pointer-events-auto relative z-10 flex min-h-0 flex-auto flex-col gap-3 overflow-y-auto px-4 pt-2 [scrollbar-gutter:stable]"
				data-slot="agent-card-scroll"
				onClick={onSelect ? handleBodyClick : undefined}
				onScroll={handleBodyScroll}
				style={bodyScrolled ? SCROLL_MASK_STYLE : undefined}
			>
				{sources.length > 0 ? (
					<AgentCardSection label="Works with">
						<TWGAppstack animated={false} className="justify-start" iconSize="md" maxVisible={8} sources={sources} />
					</AgentCardSection>
				) : null}

				{skills.length > 0 ? (
					<AgentCardSection label="Skills">
						<SkillTagGroup className={SKILLS_GROUP_CLASS_NAME} maxRows={SKILLS_MAX_ROWS}>
							{skills.map((skill) => (
								<SkillTag color={skill.color ?? "default"} icon={skill.icon ?? getSkillIcon(skill.label)} key={skill.label}>
									{skill.label}
								</SkillTag>
							))}
						</SkillTagGroup>
					</AgentCardSection>
				) : null}

				<div className="py-1.5">
					<Separator />
				</div>

				<div className="pb-4">
					<AgentCardCapabilities items={capabilities} label={capabilitiesLabel} />
				</div>
			</div>

			{showFooter ? (
				<div className="relative shrink-0 overflow-clip border-t border-border bg-surface">
					<AgentCardFooter className="justify-between px-4 py-3 transition-opacity duration-fast ease-out group-hover/card:opacity-0 group-focus-within/card:opacity-0">
						<div className="flex items-center gap-6">
							{showStats ? (
								stats.map((stat) => (
									<div className="flex flex-col" key={stat.label}>
										<span className="text-sm font-semibold leading-5 text-text">{stat.value}</span>
										<span className="leading-4">{stat.label}</span>
									</div>
								))
							) : (
								<div className="flex items-center gap-4">
									{showRating ? (
										<AgentCardStat
											icon={<StarUnstarredIcon label="" size="small" spacing="none" color="currentColor" />}
										>
											{rating.toFixed(1)}
											{typeof feedbackCount === "number" ? ` (${formatCompact(feedbackCount)} feedback)` : null}
										</AgentCardStat>
									) : null}
									{showChats ? (
										<AgentCardStat
											icon={<AiChatIcon label="" size="small" spacing="none" color="currentColor" />}
										>
											{formatCompact(chatCount)} chats
										</AgentCardStat>
									) : null}
								</div>
							)}
						</div>
						{showCollaborators ? (
							<AvatarGroup label="Collaborators">
								{visibleCollaborators.map((person) => (
									<Avatar key={person.src} size="sm">
										<AvatarImage alt={person.name} src={person.src} />
										<AvatarFallback>{person.name.slice(0, 2)}</AvatarFallback>
									</Avatar>
								))}
								{showHiddenCollaboratorCount ? (
									<AvatarGroupCount>+{hiddenCollaboratorCount}</AvatarGroupCount>
								) : null}
							</AvatarGroup>
						) : null}
					</AgentCardFooter>
					<div className="pointer-events-none absolute inset-0 flex items-center px-4 py-2 opacity-0 transition-opacity duration-fast ease-out group-hover/card:pointer-events-auto group-hover/card:opacity-100 group-focus-within/card:pointer-events-auto group-focus-within/card:opacity-100">
						<Button
							className="w-full"
							onClick={handleUseTemplateClick}
							tabIndex={-1}
							type="button"
							variant="outline"
						>
							Use template
						</Button>
					</div>
				</div>
			) : null}
		</AgentCardShell>
	);
}
