"use client";

import { type CSSProperties, type MouseEvent, type ReactNode, type UIEvent, useCallback, useState } from "react";
import Image from "next/image";
import AiChatIcon from "@atlaskit/icon/core/ai-chat";
import PeopleGroupIcon from "@atlaskit/icon/core/people-group";
import StarUnstarredIcon from "@atlaskit/icon/core/star-unstarred";
import StatusVerifiedIcon from "@atlaskit/icon/core/status-verified";
import ThumbsUpIcon from "@atlaskit/icon/core/thumbs-up";

import { Avatar, AvatarCompanyBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage, AvatarProjectBadge } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { AtlassianLogo } from "@/components/ui/logo";
import { Separator } from "@/components/ui/separator";
import { SkillTag, SkillTagGroup, type SkillTagColor } from "@/components/ui-custom/skill-tag";
import { TWGAppstack, type TwgToolSource } from "@/components/ui-custom/twg-appstack";
import { getSkillIcon } from "@/lib/skill-icons";
import { token } from "@/lib/tokens";
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
	BANNER_HEXAGON_PATH,
	formatCompact,
	getAgentCardBannerCoverColor,
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
const STAMP_PERFORATION_INTERVAL_COUNT = 29;
const STAMP_PERFORATION_INTERVAL = `calc(100% / ${STAMP_PERFORATION_INTERVAL_COUNT})`;
const STAMP_PERFORATION_PATTERN_OFFSET = `calc(${STAMP_PERFORATION_INTERVAL} / -2)`;
const STAMP_PERFORATION_BOTTOM_MASK_STYLE = {
	"--stamp-perforation-interval": STAMP_PERFORATION_INTERVAL,
	"--stamp-perforation-offset": STAMP_PERFORATION_PATTERN_OFFSET,
	maskImage: "radial-gradient(circle at 50% 100%, transparent 0 3px, black 3.25px)",
	WebkitMaskImage: "radial-gradient(circle at 50% 100%, transparent 0 3px, black 3.25px)",
	maskPosition: "var(--stamp-perforation-offset) 0",
	WebkitMaskPosition: "var(--stamp-perforation-offset) 0",
	maskRepeat: "repeat-x",
	WebkitMaskRepeat: "repeat-x",
	maskSize: "var(--stamp-perforation-interval) 100%",
	WebkitMaskSize: "var(--stamp-perforation-interval) 100%",
} satisfies CSSProperties & {
	"--stamp-perforation-interval": string;
	"--stamp-perforation-offset": string;
};
const STAMP_PERFORATION_TOP_MASK_STYLE = {
	"--stamp-perforation-interval": STAMP_PERFORATION_INTERVAL,
	"--stamp-perforation-offset": STAMP_PERFORATION_PATTERN_OFFSET,
	maskImage: "radial-gradient(circle at 50% 0, transparent 0 3px, black 3.25px)",
	WebkitMaskImage: "radial-gradient(circle at 50% 0, transparent 0 3px, black 3.25px)",
	maskPosition: "var(--stamp-perforation-offset) 0",
	WebkitMaskPosition: "var(--stamp-perforation-offset) 0",
	maskRepeat: "repeat-x",
	WebkitMaskRepeat: "repeat-x",
	maskSize: "var(--stamp-perforation-interval) 100%",
	WebkitMaskSize: "var(--stamp-perforation-interval) 100%",
} satisfies CSSProperties & {
	"--stamp-perforation-interval": string;
	"--stamp-perforation-offset": string;
};
const EXPERIMENTAL_COVER_TEXT_COLOR = "#CFE1FD";
const EXPERIMENTAL_COVER_TEXT_COLORS: Record<string, string> = {
	"dev-agents": "#37471F",
	"product-agents": "#48245D",
	"service-agents": "#533F04",
	"strategy-agents": "#693200",
	"teamwork-agents": EXPERIMENTAL_COVER_TEXT_COLOR,
};
const EXPERIMENTAL_DETAIL_BACKGROUND_COLOR = "var(--ds-background-accent-blue-subtlest)";
const EXPERIMENTAL_DETAIL_BACKGROUND_COLORS: Record<string, string> = {
	"dev-agents": "var(--ds-background-accent-lime-subtlest)",
	"product-agents": "var(--ds-background-accent-purple-subtlest)",
	"service-agents": "var(--ds-background-accent-yellow-subtlest)",
	"strategy-agents": "var(--ds-background-accent-orange-subtlest)",
	"teamwork-agents": EXPERIMENTAL_DETAIL_BACKGROUND_COLOR,
};
const EXPERIMENTAL_DETAIL_TEXT_COLOR = "var(--ds-text-accent-blue-bolder)";
const EXPERIMENTAL_DETAIL_TEXT_COLORS: Record<string, string> = {
	"dev-agents": "var(--ds-text-accent-lime-bolder)",
	"product-agents": "var(--ds-text-accent-purple-bolder)",
	"service-agents": "var(--ds-text-accent-yellow-bolder)",
	"strategy-agents": "var(--ds-text-accent-orange-bolder)",
	"teamwork-agents": EXPERIMENTAL_DETAIL_TEXT_COLOR,
};
const EXPERIMENTAL_COVER_TEXT_CLASS_NAME = "text-[var(--agent-card-cover-text-color)]";
const EXPERIMENTAL_DETAIL_TEXT_CLASS_NAME = "text-[var(--agent-card-detail-text-color)]";
const EXPERIMENTAL_VERIFIED_ICON_CLASS_NAME = "text-[#292A2E]";

function getAgentAvatarCategory(avatarSrc: string | undefined): string | undefined {
	return avatarSrc?.match(/\/avatar-agent\/([^/]+)\//u)?.[1];
}

function getExperimentalCoverTextColor(avatarSrc: string | undefined): string {
	const category = getAgentAvatarCategory(avatarSrc);
	return (category ? EXPERIMENTAL_COVER_TEXT_COLORS[category] : undefined) ?? EXPERIMENTAL_COVER_TEXT_COLOR;
}

function getExperimentalDetailBackgroundColor(avatarSrc: string | undefined): string {
	const category = getAgentAvatarCategory(avatarSrc);
	return (category ? EXPERIMENTAL_DETAIL_BACKGROUND_COLORS[category] : undefined) ?? EXPERIMENTAL_DETAIL_BACKGROUND_COLOR;
}

function getExperimentalDetailTextColor(avatarSrc: string | undefined): string {
	const category = getAgentAvatarCategory(avatarSrc);
	return (category ? EXPERIMENTAL_DETAIL_TEXT_COLORS[category] : undefined) ?? EXPERIMENTAL_DETAIL_TEXT_COLOR;
}

function getUnmaskedAgentAvatarSrc(avatarSrc: string | undefined): string | undefined {
	return avatarSrc?.replace("/avatar-agent/", "/avatar-agent-unmasked/");
}

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
 * - `"experimental"` / `"experimental-template"`: compact banner-first treatment
 *   with inline metrics, app stack, skill stack, and feature list in a raised body panel.
 * - `"experimental-profile"`: built-agent profile treatment with the same header,
 *   description, and social proof, but no template-building detail sections.
 * - `"template"`: a flat card — icon + name header, description, "Works with"
 *   sources, and "Skills" tags. No banner, capabilities, or footer.
 */
export type AgentCardVariant = "expanded" | "experimental" | "experimental-template" | "experimental-profile" | "template";

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
	/** Capabilities feature list — rendered by the `"expanded"` and experimental template variants. */
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
 * to a "Use template" action on hover. The experimental template variant renders
 * a banner-first card with inline metrics and stacked body sections, while the
 * experimental profile variant stops after the built-agent summary. The `"template"`
 * variant renders a flat card (icon + name, description, "Works with", "Skills").
 * Self-contained block; passing onSelect makes the whole card selectable.
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
	const renderAvatarBadge = (badgeClassName?: string) => {
		if (attributionKind === "company") {
			return (
				<AvatarCompanyBadge className={badgeClassName}>
					{publisherLogoSrc ? (
						<img alt="" aria-hidden src={publisherLogoSrc} />
					) : (
						<AtlassianLogo
							iconColor="#FFFFFF"
							label=""
							name="atlassian"
							shouldUseNewLogoDesign
							size="xxsmall"
							textColor="#FFFFFF"
							themeAware={false}
						/>
					)}
				</AvatarCompanyBadge>
			);
		}

		if (attributionKind === "team") {
			return (
				<AvatarProjectBadge className={badgeClassName}>
					<img alt="" aria-hidden src={publisherLogoSrc ?? projectBadgeAvatarSrc} />
				</AvatarProjectBadge>
			);
		}

		return null;
	};
	const avatarBadge = renderAvatarBadge();

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

	if (variant === "experimental" || variant === "experimental-template" || variant === "experimental-profile") {
		const coverColor = coverBackgroundColor ?? getAgentCardBannerCoverColor(avatarSrc);
		const coverStyle = {
			"--agent-card-cover-color": coverColor,
			"--agent-card-detail-color": getExperimentalDetailBackgroundColor(avatarSrc),
			"--agent-card-detail-text-color": getExperimentalDetailTextColor(avatarSrc),
			"--agent-card-cover-text-color": getExperimentalCoverTextColor(avatarSrc),
		} as CSSProperties & {
			"--agent-card-cover-color": string;
			"--agent-card-detail-color": string;
			"--agent-card-detail-text-color": string;
			"--agent-card-cover-text-color": string;
		};
		const showExperimentalTemplateDetails = variant !== "experimental-profile";
		const visibleStats = stats.slice(0, 2);
		const showInlineStats = visibleStats.length > 0 || showRating || showChats;
		const showExperimentalCollaborators = showExperimentalTemplateDetails && showCollaborators;
		const showExperimentalSocialMetadata = showInlineStats || showExperimentalCollaborators;
		const showExperimentalUseTemplateAction = showExperimentalTemplateDetails;
		const unmaskedAvatarSrc = getUnmaskedAgentAvatarSrc(avatarSrc);

		return (
			<AgentCardShell
				className={cn(
					"gap-0 overflow-clip rounded-[16px] bg-transparent p-0 after:rounded-[16px] after:border-0 [&_[data-slot=agent-card-select]]:rounded-[16px]",
					className,
				)}
				onSelect={onSelect}
				selectLabel={`Select ${name}`}
			>
				<div className="relative flex min-h-0 flex-auto flex-col overflow-visible" style={coverStyle}>
					{avatarSrc ? (
						<Image
							alt=""
							aria-hidden
							className="pointer-events-none absolute top-3 left-[100%] z-20 h-40 w-[218px] -translate-x-1/2 -translate-y-1/2 object-contain opacity-95"
							height={160}
							src={unmaskedAvatarSrc ?? avatarSrc}
							width={218}
						/>
					) : null}
					<div
						className={cn(
							"relative z-10 flex shrink-0 flex-col gap-3 rounded-t-[16px] bg-[var(--agent-card-cover-color)] px-4 pt-4 pb-4 text-text-inverse",
							!showExperimentalTemplateDetails && "rounded-b-[16px]",
						)}
						style={showExperimentalTemplateDetails ? STAMP_PERFORATION_BOTTOM_MASK_STYLE : undefined}
					>
						<div className="relative flex items-center gap-3">
							<div aria-hidden className="group/avatar relative h-10 w-[35px] shrink-0" data-size="lg">
								{avatarSrc ? (
									<Image alt="" aria-hidden className="absolute inset-0 size-full object-contain" height={40} src={avatarSrc} width={35} />
								) : null}
								<svg
									aria-hidden="true"
									className={cn("pointer-events-none absolute inset-0 size-full overflow-visible stroke-current", EXPERIMENTAL_COVER_TEXT_CLASS_NAME)}
									focusable="false"
									viewBox="0 0 43 48"
								>
									<path d={BANNER_HEXAGON_PATH} fill="none" strokeWidth={1} vectorEffect="non-scaling-stroke" />
								</svg>
								{renderAvatarBadge("ring-[var(--agent-card-cover-color)]")}
							</div>
							<div className="min-w-0 flex-1">
								<h3 className={cn("truncate", EXPERIMENTAL_COVER_TEXT_CLASS_NAME)} style={{ font: token("font.heading.xsmall") }}>
									{name}
								</h3>
								<p className="flex items-center gap-1 text-xs leading-4">
									<span className={EXPERIMENTAL_COVER_TEXT_CLASS_NAME}>By</span>
									<span className={cn("truncate", EXPERIMENTAL_COVER_TEXT_CLASS_NAME)}>{publisher}</span>
									{verified ? (
										<Icon
											className={EXPERIMENTAL_VERIFIED_ICON_CLASS_NAME}
											render={<StatusVerifiedIcon label="Verified" size="small" color="currentColor" />}
										/>
									) : null}
								</p>
							</div>
							{onMoreActions ? (
								<AgentCardMoreButton
									className={cn(
										EXPERIMENTAL_COVER_TEXT_CLASS_NAME,
										"[&_svg]:text-current hover:bg-white/20 active:bg-white/30",
									)}
									label={`More actions for ${name}`}
									onClick={onMoreActions}
								/>
							) : null}
						</div>
						<div className="relative flex flex-col gap-3">
							<AgentCardDescription className={cn("line-clamp-3 min-h-0", EXPERIMENTAL_COVER_TEXT_CLASS_NAME)}>
								{description ?? `Learn how ${name} can help your team work faster.`}
							</AgentCardDescription>

							{showExperimentalSocialMetadata ? (
								<>
									<div className={cn("flex min-h-6 items-center gap-3", showInlineStats ? "justify-between" : "justify-end")}>
										{showInlineStats ? (
											<AgentCardFooter className={cn("min-h-6 min-w-0 flex-1 items-center gap-4 [&_[data-slot=icon]]:text-current", EXPERIMENTAL_COVER_TEXT_CLASS_NAME)}>
												{visibleStats.length > 0 ? (
													visibleStats.map((stat, index) => (
														<AgentCardStat
															icon={
																index === 0 ? (
																	<PeopleGroupIcon label="" size="small" spacing="none" color="currentColor" />
																) : (
																	<ThumbsUpIcon label="" size="small" spacing="none" color="currentColor" />
																)
															}
															key={stat.label}
														>
															{stat.value} {stat.label.toLowerCase()}
														</AgentCardStat>
													))
												) : (
													<>
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
													</>
												)}
											</AgentCardFooter>
										) : null}
										{showExperimentalCollaborators ? (
											<AvatarGroup className="items-center *:data-[slot=avatar]:ring-[var(--agent-card-cover-color)]" label="Collaborators">
												{visibleCollaborators.map((person) => (
													<Avatar key={person.src} size="sm">
														<AvatarImage alt={person.name} src={person.src} />
														<AvatarFallback>{person.name.slice(0, 2)}</AvatarFallback>
													</Avatar>
												))}
												{showHiddenCollaboratorCount ? (
													<AvatarGroupCount className="ring-[var(--agent-card-cover-color)]">+{hiddenCollaboratorCount}</AvatarGroupCount>
												) : null}
											</AvatarGroup>
										) : null}
									</div>
									{showExperimentalUseTemplateAction ? (
										<Button
											className={cn(
												"mt-2 w-full border-current bg-transparent hover:bg-white/20 active:bg-white/30",
												EXPERIMENTAL_COVER_TEXT_CLASS_NAME,
											)}
											onClick={handleUseTemplateClick}
											type="button"
											variant="outline"
										>
											Use template
										</Button>
									) : null}
								</>
							) : null}
						</div>
					</div>

					{showExperimentalTemplateDetails ? (
						<div
							className="relative z-10 flex min-h-0 flex-auto flex-col rounded-b-[16px] bg-[var(--agent-card-detail-color)]"
							style={STAMP_PERFORATION_TOP_MASK_STYLE}
						>
							<div
								className="pointer-events-auto relative z-10 flex min-h-0 flex-auto flex-col gap-3 overflow-y-auto px-4 pt-5 pb-4 text-text [scrollbar-gutter:stable]"
								data-slot="agent-card-scroll"
								onClick={onSelect ? handleBodyClick : undefined}
								onScroll={handleBodyScroll}
								style={bodyScrolled ? SCROLL_MASK_STYLE : undefined}
							>
								{sources.length > 0 ? (
									<AgentCardSection label="Works with" labelClassName={EXPERIMENTAL_DETAIL_TEXT_CLASS_NAME}>
										<TWGAppstack animated={false} className="justify-start" iconSize="md" maxVisible={7} sources={sources} />
									</AgentCardSection>
								) : null}

								{skills.length > 0 ? (
									<AgentCardSection label="Skills" labelClassName={EXPERIMENTAL_DETAIL_TEXT_CLASS_NAME}>
										<SkillTagGroup className={SKILLS_GROUP_CLASS_NAME} maxRows={SKILLS_MAX_ROWS}>
											{skills.map((skill) => (
												<SkillTag
													color={skill.color ?? "default"}
													icon={skill.icon ?? getSkillIcon(skill.label)}
													key={skill.label}
												>
													{skill.label}
												</SkillTag>
											))}
										</SkillTagGroup>
									</AgentCardSection>
								) : null}

								{capabilities.length > 0 ? (
									<>
										<div className={cn("py-1.5", EXPERIMENTAL_DETAIL_TEXT_CLASS_NAME)}>
											<Separator className="bg-current opacity-30" />
										</div>
										<AgentCardCapabilities
											iconClassName={EXPERIMENTAL_DETAIL_TEXT_CLASS_NAME}
											items={capabilities}
											itemClassName={EXPERIMENTAL_DETAIL_TEXT_CLASS_NAME}
										/>
									</>
								) : null}
							</div>
						</div>
					) : null}
				</div>
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
