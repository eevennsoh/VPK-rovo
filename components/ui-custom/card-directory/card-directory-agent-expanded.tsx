"use client";

import { type CSSProperties, type MouseEvent, type UIEvent, useCallback, useState } from "react";
import AiChatIcon from "@atlaskit/icon/core/ai-chat";
import StarUnstarredIcon from "@atlaskit/icon/core/star-unstarred";

import { Avatar, AvatarCompanyBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage, AvatarProjectBadge } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { AtlassianLogo } from "@/components/ui/logo";
import { Separator } from "@/components/ui/separator";
import { SkillTag, SkillTagGroup } from "@/components/ui-custom/skill-tag";
import { TWGAppstack, type TwgToolSource } from "@/components/ui-custom/twg-appstack";
import { cn } from "@/lib/utils";

import { CardDirectory } from "./card-directory";
import {
	CardDirectoryBanner,
	CardDirectoryByline,
	CardDirectoryCapabilities,
	CardDirectoryDescription,
	CardDirectoryFooter,
	CardDirectoryHeader,
	CardDirectoryMoreButton,
	CardDirectorySection,
	CardDirectoryStat,
	type CardDirectoryCapability,
	formatCompact,
} from "./card-directory-parts";
import { type CardDirectoryTemplateSkill } from "./card-directory-template";

const MAX_VISIBLE_COLLABORATORS = 4;
const CARD_DIRECTORY_SKILLS_MAX_ROWS = 2;
// Reserve two rows and clip a would-be third row, but use `overflow-clip` with a small
// clip-margin instead of `overflow-hidden`: the tags are `-skew-x-12`, so their corners
// overhang the group box by ~2px (bottom-left slash, top-right edge). A plain
// `overflow-hidden` slices those skewed corners at the row edges; the 3px clip-margin
// keeps them whole while a third row (which starts ~4px below the reserved box) stays clipped.
const CARD_DIRECTORY_SKILLS_GROUP_CLASS_NAME = "h-11 content-start overflow-clip [overflow-clip-margin:3px]";
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
const CARD_DIRECTORY_SCROLL_MASK_IMAGE = [
	"linear-gradient(to bottom, transparent 0, black var(--scroll-mask-fade-size), black 100%)",
	"linear-gradient(black, black)",
].join(", ");
const CARD_DIRECTORY_SCROLL_MASK_STYLE = {
	"--scroll-mask-fade-size": "var(--ds-space-200)",
	"--scroll-mask-scrollbar-width": "10px",
	maskImage: CARD_DIRECTORY_SCROLL_MASK_IMAGE,
	WebkitMaskImage: CARD_DIRECTORY_SCROLL_MASK_IMAGE,
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

export interface CardDirectoryAgentExpandedProps {
	name: string;
	avatarSrc?: string;
	publisher: string;
	attributionKind?: "company" | "team" | "person";
	publisherLogoSrc?: string;
	description?: string;
	/** Capability lines rendered as a scrollable list. */
	capabilities: readonly (CardDirectoryCapability | string)[];
	/** Optional label above the capabilities list. Omit to render the bare list. */
	capabilitiesLabel?: string;
	/** Connected data sources shown in the "Works with" section. */
	sources?: ReadonlyArray<TwgToolSource>;
	/** Skill tags shown in the "Skills" section. */
	skills?: ReadonlyArray<CardDirectoryTemplateSkill>;
	/** Footer metadata blocks (value over label), e.g. remix count, last update. */
	stats?: ReadonlyArray<{ value: string; label: string }>;
	/** Collaborator avatars shown at the footer's trailing edge. */
	collaborators?: ReadonlyArray<{ src: string; name: string }>;
	/** Overflow count appended to the collaborator group (e.g. 4 → "+4"). */
	collaboratorOverflow?: number;
	/** Override the avatar-category-derived cover color. */
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
 * Expanded agent directory card — cover banner, attribution, a scrollable capabilities
 * list, and rating/chat stats. A more fleshed-out take on `CardDirectoryAgent`.
 */
export function CardDirectoryAgentExpanded({
	name,
	avatarSrc,
	publisher,
	attributionKind,
	publisherLogoSrc,
	description,
	capabilities,
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
}: Readonly<CardDirectoryAgentExpandedProps>) {
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

	return (
		<CardDirectory
			className={cn("gap-0 overflow-clip p-0", className)}
			onSelect={onSelect}
			selectLabel={`Select ${name}`}
		>
			<div className="shrink-0 bg-surface" data-slot="card-directory-sticky-header">
				<CardDirectoryBanner avatarBadge={avatarBadge} avatarSrc={avatarSrc} backgroundColor={coverBackgroundColor} />
				<div className="px-4 pt-3">
					<CardDirectoryHeader
						action={
							onMoreActions ? (
								<CardDirectoryMoreButton label={`More actions for ${name}`} onClick={onMoreActions} />
							) : null
						}
						byline={<CardDirectoryByline publisher={publisher} verified={verified} />}
						title={name}
					/>
					<CardDirectoryDescription className="mt-1">
						{description ?? `Learn how ${name} can help your team work faster.`}
					</CardDirectoryDescription>
				</div>
			</div>

			{/* Scrollable body — banner/header/description stay pinned above, footer pinned below. */}
			<div
				className="flex min-h-0 flex-auto flex-col gap-3 overflow-y-auto px-4 pt-2 [scrollbar-gutter:stable]"
				onScroll={handleBodyScroll}
				style={bodyScrolled ? CARD_DIRECTORY_SCROLL_MASK_STYLE : undefined}
			>
				{sources.length > 0 ? (
					<CardDirectorySection label="Works with">
						<TWGAppstack animated={false} className="justify-start" iconSize="md" maxVisible={8} sources={sources} />
					</CardDirectorySection>
				) : null}

				{skills.length > 0 ? (
					<CardDirectorySection label="Skills">
						<SkillTagGroup className={CARD_DIRECTORY_SKILLS_GROUP_CLASS_NAME} maxRows={CARD_DIRECTORY_SKILLS_MAX_ROWS}>
							{skills.map((skill) => (
								<SkillTag color={skill.color ?? "default"} icon={skill.icon} key={skill.label}>
									{skill.label}
								</SkillTag>
							))}
						</SkillTagGroup>
					</CardDirectorySection>
				) : null}

				<div className="py-1.5">
					<Separator />
				</div>

				<div className="pb-4">
					<CardDirectoryCapabilities items={capabilities} label={capabilitiesLabel} />
				</div>
			</div>

			{showFooter ? (
				<div className="relative shrink-0 overflow-clip border-t border-border bg-surface">
					<CardDirectoryFooter className="justify-between px-4 py-3 transition-opacity duration-fast ease-out group-hover/card:opacity-0 group-focus-within/card:opacity-0">
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
					</CardDirectoryFooter>
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
		</CardDirectory>
	);
}
