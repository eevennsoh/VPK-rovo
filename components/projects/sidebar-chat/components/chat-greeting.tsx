"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import type { ReactNode } from "react";
import { token } from "@/lib/tokens";
import Heading from "@/components/blocks/shared-ui/heading";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { ControlledRovoIllustration } from "@/components/ui-custom/rovo-illustration";
import { VisualIdentityTile } from "@/components/projects/shared/components/visual-identity-tile";
import { GreetingPromptRow } from "@/components/projects/shared/components/greeting-prompt-row";
import { defaultSuggestions, type RovoSuggestion } from "@/lib/rovo-suggestions";
import { isRovoAgentProfile, type RovoAgentProfile } from "@/app/data/directory/agents";
import { RichTextMentionVisualMark } from "@/components/ui-custom/rich-text-editor";
import { Kbd } from "@/components/ui/kbd";
import { ReturnIcon } from "@/components/ui/vpk-icons";
import type { DirectoryAutocompleteState } from "@/lib/directory-autocomplete";
import { cn } from "@/lib/utils";

const DEFAULT_ILLUSTRATION_SRC = "/illustration-ai/chat/light.svg";
const DEFAULT_ILLUSTRATION_DARK_SRC = "/illustration-ai/chat/dark.svg";
const AGENT_ILLUSTRATION_SRC = "/illustration-ai/ai/light.svg";
const AGENT_ILLUSTRATION_DARK_SRC = "/illustration-ai/ai/dark.svg";
const LIGHT_SVG_SUFFIX = "/light.svg";
const MAX_MODE_HEADING = "Let's plan your next move";
const MAX_MODE_ILLUSTRATION_SRC = "/illustration-ai/max/light.gif";
const MAX_MODE_ILLUSTRATION_DARK_SRC = "/illustration-ai/max/dark.gif";
const CHAT_GREETING_ILLUSTRATION_CLASS_NAME = "h-[67px] w-[74px]";
// Custom-agent greeting prompts share one consistent "AI chat" glyph rather
// than a per-prompt contextual icon. Maps to AiChatIcon via ICON_REGISTRY.
const CUSTOM_AGENT_STARTER_ICON_NAME = "ai-chat";
const CHAT_GREETING_MODE_TRANSITION = {
	type: "spring",
	bounce: 0,
	visualDuration: 0.14,
} as const;
const CHAT_GREETING_EXIT_TRANSITION = {
	duration: 0.08,
} as const;
const CHAT_GREETING_REDUCED_TRANSITION = {
	duration: 0.08,
} as const;
const CHAT_GREETING_CONTAINER_VARIANTS = {
	hidden: {},
	visible: {
		transition: {
			staggerChildren: 0.04,
		},
	},
	exit: {
		transition: {
			staggerChildren: 0.02,
			staggerDirection: -1,
		},
	},
} as const;
const CHAT_GREETING_ITEM_VARIANTS = {
	hidden: {
		opacity: 0,
		transform: "translateY(6px)",
	},
	visible: {
		opacity: 1,
		transform: "translateY(0px)",
		transition: CHAT_GREETING_MODE_TRANSITION,
	},
	exit: {
		opacity: 0,
		transform: "translateY(-6px)",
		transition: CHAT_GREETING_EXIT_TRANSITION,
	},
} as const;
const CHAT_GREETING_REDUCED_ITEM_VARIANTS = {
	hidden: {
		opacity: 0,
	},
	visible: {
		opacity: 1,
		transition: CHAT_GREETING_REDUCED_TRANSITION,
	},
	exit: {
		opacity: 0,
		transition: CHAT_GREETING_REDUCED_TRANSITION,
	},
} as const;
type ChatGreetingItemVariants = typeof CHAT_GREETING_ITEM_VARIANTS | typeof CHAT_GREETING_REDUCED_ITEM_VARIANTS;

interface ChatGreetingProps {
	/** Optional custom heading text */
	heading?: string;
	/** Optional custom light-mode illustration src */
	illustrationSrc?: string;
	/** Optional custom dark-mode illustration src */
	illustrationDarkSrc?: string;
	/**
	 * Render the illustration + heading block above the suggestion list.
	 * Surfaces with constrained vertical space (e.g. the floating chat) can
	 * pass `false` to keep just the suggestions.
	 */
	showHero?: boolean;
	/** Whether to render the Max-mode greeting and illustration. */
	isMaxMode?: boolean;
	/** Optional custom suggestions list */
	suggestions?: ReadonlyArray<RovoSuggestion>;
	/** Composer-owned skill/tool autocomplete state for filtered empty-state rows. */
	directoryAutocompleteState?: DirectoryAutocompleteState | null;
	/** Uses two columns for large Rovo-style empty states only. */
	useWideSuggestionLayout?: boolean;
	/** Optional selected agent profile for custom-agent empty states. */
	selectedAgent?: RovoAgentProfile | null;
	/**
	 * Render the custom-agent greeting at the narrower Test-panel width
	 * (600px) instead of the default 800px used in the main Rovo App chat.
	 */
	isAgentTest?: boolean;
	/** Callback when a suggestion is clicked */
	onSuggestionClick?: (suggestion: RovoSuggestion) => void;
	onDirectoryAutocompleteSelect?: (index: number) => void;
	onDirectoryAutocompleteActiveChange?: (index: number) => void;
}

interface SkillListItemProps {
	active?: boolean;
	onActive?: () => void;
	suggestion: RovoSuggestion;
	shortcut?: ReactNode;
	onClick?: () => void;
}

function getPairedDarkIllustrationSrc(illustrationSrc: string): string {
	if (illustrationSrc.endsWith(LIGHT_SVG_SUFFIX)) {
		return `${illustrationSrc.slice(0, -LIGHT_SVG_SUFFIX.length)}/dark.svg`;
	}

	return DEFAULT_ILLUSTRATION_DARK_SRC;
}

function SkillListItem({
	active = false,
	onActive,
	suggestion,
	shortcut,
	onClick,
}: Readonly<SkillListItemProps>) {
	const iconColor = suggestion.id === "work-last-7-days" || suggestion.id === "draft-confluence-page"
		? token("color.icon.accent.blue")
		: token("color.icon.subtlest");

	return (
		<GreetingPromptRow
			description={suggestion.description}
			icon={suggestion.icon}
			iconColor={iconColor}
			imageSrc={suggestion.imageSrc}
			label={suggestion.label}
			active={active}
			onClick={onClick}
			onFocus={onActive}
			onMouseEnter={onActive}
			shortcut={shortcut}
		/>
	);
}

function DirectoryAutocompleteShortcut({
	active,
	index,
}: Readonly<{
	active: boolean;
	index: number;
}>) {
	if (active) {
		return <ReturnIcon className="size-3.5 text-icon-subtlest" />;
	}

	return (
		<Kbd className="h-5 min-w-7 rounded-sm bg-bg-neutral px-1.5 text-[11px] text-text-subtle">
			⌘{index + 1}
		</Kbd>
	);
}

function DirectoryAutocompleteItem({
	active,
	index,
	state,
	onActive,
	onSelect,
}: Readonly<{
	active: boolean;
	index: number;
	state: DirectoryAutocompleteState;
	onActive?: () => void;
	onSelect?: () => void;
}>) {
	const match = state.matches[index];
	if (!match) {
		return null;
	}

	return (
		<GreetingPromptRow
			active={active}
			description={match.mention.description}
			label={match.mention.label}
			onClick={onSelect}
			onFocus={onActive}
			onMouseEnter={onActive}
			shortcut={<DirectoryAutocompleteShortcut active={active} index={index} />}
			visual={
				match.mention.visual ? (
					<RichTextMentionVisualMark
						category={match.mention.category}
						label={match.mention.label}
						size="menu"
						visual={match.mention.visual}
					/>
				) : undefined
			}
		/>
	);
}

function CustomAgentStarterItem({
	suggestion,
	onClick,
}: Readonly<SkillListItemProps>) {
	const hasOwnVisual = Boolean(suggestion.imageSrc || suggestion.icon);

	return (
		<GreetingPromptRow
			description={suggestion.description}
			icon={suggestion.icon}
			iconColor={token("color.icon.subtle")}
			imageSrc={suggestion.imageSrc}
			label={suggestion.label}
			onClick={onClick}
			visual={
				hasOwnVisual ? undefined : (
					// Greeting prompts have no inherent icon, so use a single consistent
					// "AI chat" glyph on the neutral surface treatment (bordered white
					// tile + subtle icon) instead of a per-prompt contextual identity.
					<VisualIdentityTile
						className="border border-border bg-surface"
						decorative
						label={suggestion.label}
						size="medium"
						visualIdentity={{ iconName: CUSTOM_AGENT_STARTER_ICON_NAME, tileVariant: "gray" }}
					/>
				)
			}
		/>
	);
}

function CustomAgentGreeting({
	agent,
	isAgentTest = false,
	itemVariants,
	onSuggestionClick,
}: Readonly<{
	agent: RovoAgentProfile;
	isAgentTest?: boolean;
	itemVariants: ChatGreetingItemVariants;
	onSuggestionClick?: (suggestion: RovoSuggestion) => void;
}>) {
	return (
		<motion.div
			animate="visible"
			className={cn(
				"mx-auto flex w-full flex-col items-center gap-8 text-center",
				isAgentTest ? "max-w-[600px]" : "max-w-[800px]",
			)}
			exit="exit"
			initial="hidden"
			key={agent.id}
			variants={CHAT_GREETING_CONTAINER_VARIANTS}
		>
			<div className="flex max-w-[360px] flex-col items-center gap-3">
				<motion.div variants={itemVariants}>
					<AgentAvatarVisual avatarSrc={agent.avatarSrc} logoName={agent.logoName} label={agent.name} sizePx={40} className="size-10 object-contain" loading="eager" />
				</motion.div>
				<motion.div className="flex flex-col items-center gap-2" variants={itemVariants}>
					<Heading size="large" className="text-center">{agent.name}</Heading>
					{agent.description ? (
						<p className="text-sm leading-6 text-text-subtle">{agent.description}</p>
					) : null}
				</motion.div>
			</div>
			<motion.div className="w-full" variants={CHAT_GREETING_CONTAINER_VARIANTS}>
				<div className="mx-auto flex w-fit max-w-full flex-col gap-1">
					{agent.starters.map((suggestion) => (
						<motion.div key={suggestion.id} variants={itemVariants}>
							<CustomAgentStarterItem
								suggestion={suggestion}
								onClick={() => onSuggestionClick?.(suggestion)}
							/>
						</motion.div>
					))}
				</div>
			</motion.div>
		</motion.div>
	);
}

export default function ChatGreeting({
	heading = "How can I help?",
	illustrationSrc = DEFAULT_ILLUSTRATION_SRC,
	illustrationDarkSrc,
	isMaxMode = false,
	selectedAgent = null,
	isAgentTest = false,
	showHero = true,
	suggestions,
	directoryAutocompleteState = null,
	useWideSuggestionLayout = false,
	onSuggestionClick,
	onDirectoryAutocompleteSelect,
	onDirectoryAutocompleteActiveChange,
}: Readonly<ChatGreetingProps>) {
	const shouldReduceMotion = useReducedMotion();
	const customAgent = selectedAgent !== null && !isRovoAgentProfile(selectedAgent) ? selectedAgent : null;
	const greetingSuggestions = suggestions ?? defaultSuggestions;
	const shouldRenderDirectoryMatches =
		!customAgent &&
		directoryAutocompleteState !== null &&
		directoryAutocompleteState.matches.length > 0;
	const shouldHideSuggestionList =
		!customAgent &&
		directoryAutocompleteState !== null &&
		directoryAutocompleteState.matches.length === 0;
	const resolvedHeading = isMaxMode ? MAX_MODE_HEADING : heading;
	const resolvedIllustrationSrc = isMaxMode ? MAX_MODE_ILLUSTRATION_SRC : illustrationSrc;
	const resolvedIllustrationDarkSrc = isMaxMode
		? MAX_MODE_ILLUSTRATION_DARK_SRC
		: illustrationDarkSrc ?? getPairedDarkIllustrationSrc(illustrationSrc);
	const shouldUseControlledAgentIllustration =
		!isMaxMode &&
		resolvedIllustrationSrc === AGENT_ILLUSTRATION_SRC &&
		resolvedIllustrationDarkSrc === AGENT_ILLUSTRATION_DARK_SRC;
	// The default Rovo chat hero uses the animated, layered chat illustration
	// (enter → idle lifecycle) instead of the static chat SVG.
	const shouldUseControlledChatIllustration = !isMaxMode && resolvedIllustrationSrc === DEFAULT_ILLUSTRATION_SRC;
	const heroKey = isMaxMode ? "max" : "default";
	const itemVariants = shouldReduceMotion ? CHAT_GREETING_REDUCED_ITEM_VARIANTS : CHAT_GREETING_ITEM_VARIANTS;

	return (
		<div className="w-full">
			<AnimatePresence mode="wait">
				{customAgent ? (
					<CustomAgentGreeting
						agent={customAgent}
						isAgentTest={isAgentTest}
						itemVariants={itemVariants}
						key={`agent-${customAgent.id}`}
						onSuggestionClick={onSuggestionClick}
					/>
				) : (
					<motion.div
						animate="visible"
						className="flex flex-col gap-6"
						exit="exit"
						initial="hidden"
						key={`rovo-${heroKey}-${resolvedHeading}`}
						variants={CHAT_GREETING_CONTAINER_VARIANTS}
					>
						{showHero ? (
							<motion.div
								className="flex flex-col items-center gap-2"
								variants={CHAT_GREETING_CONTAINER_VARIANTS}
							>
								<motion.div className={cn(CHAT_GREETING_ILLUSTRATION_CLASS_NAME, "relative")} style={{ willChange: "transform, opacity" }} variants={itemVariants}>
									{shouldUseControlledChatIllustration ? (
										<ControlledRovoIllustration illusId="chat" size={74} />
									) : shouldUseControlledAgentIllustration ? (
										<ControlledRovoIllustration illusId="ai" size={74} />
									) : (
										<>
											<Image
												src={resolvedIllustrationSrc}
												alt=""
												width={74}
												height={67}
												priority
												className={cn(CHAT_GREETING_ILLUSTRATION_CLASS_NAME, "object-contain dark:hidden [[data-color-mode=dark]_&]:hidden")}
											/>
											<Image
												src={resolvedIllustrationDarkSrc}
												alt=""
												width={74}
												height={67}
												priority
												className={cn(CHAT_GREETING_ILLUSTRATION_CLASS_NAME, "hidden object-contain dark:block [[data-color-mode=dark]_&]:block")}
											/>
										</>
									)}
								</motion.div>
								<motion.div style={{ willChange: "transform, opacity" }} variants={itemVariants}>
									<Heading size="large" className="text-center">{resolvedHeading}</Heading>
								</motion.div>
							</motion.div>
						) : null}
						{shouldHideSuggestionList ? null : (
							<motion.div className="w-full" variants={CHAT_GREETING_CONTAINER_VARIANTS}>
								<div className={cn(
									"grid gap-1",
									shouldRenderDirectoryMatches && useWideSuggestionLayout ? "grid-cols-2 gap-x-8" : "grid-cols-1",
								)}>
									{shouldRenderDirectoryMatches
										? directoryAutocompleteState.matches.map((match, index) => (
												<motion.div key={match.mention.id} variants={itemVariants}>
													<DirectoryAutocompleteItem
														active={directoryAutocompleteState.activeIndex === index}
														index={index}
														state={directoryAutocompleteState}
														onActive={() => onDirectoryAutocompleteActiveChange?.(index)}
														onSelect={() => onDirectoryAutocompleteSelect?.(index)}
													/>
												</motion.div>
											))
										: greetingSuggestions.map((suggestion) => (
												<motion.div key={suggestion.id} variants={itemVariants}>
													<SkillListItem
														suggestion={suggestion}
														onClick={() => onSuggestionClick?.(suggestion)}
													/>
												</motion.div>
											))}
								</div>
							</motion.div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
