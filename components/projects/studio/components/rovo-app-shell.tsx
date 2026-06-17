"use client";

// oxlint-disable react-doctor/exhaustive-deps -- Effects in this file intentionally coordinate refs, external animation loops, timers, subscriptions, or measured DOM state; dependencies are constrained to avoid restarting those bridges.
// oxlint-disable react-doctor/jsx-no-jsx-as-prop -- These components intentionally use slot/render-node props for icons, triggers, and adornments.
// oxlint-disable react-doctor/no-adjust-state-on-prop-change -- These effects synchronize external chat, animation, media, or controlled workflow state and are intentionally guarded by refs/keys.
// oxlint-disable react-doctor/no-chain-state-updates -- Related state fields are updated together to preserve atomic UI transitions and avoid partial interaction states.
// oxlint-disable react-doctor/no-derived-state -- These components maintain local derived display state for controlled animations, measurements, or draft editing that cannot be represented as render-only values without changing UX.
// oxlint-disable react-doctor/no-event-handler -- Effects in this file bridge external systems, animation/media state, timers, or parent-controlled state rather than user event handlers.
// oxlint-disable react-doctor/no-initialize-state -- These components intentionally seed local interactive state from props or external runtime state before user edits take ownership.
// oxlint-disable react-doctor/no-pass-data-to-parent -- Callbacks in this file intentionally report measured, generated, or selected data to an owning parent component.
// oxlint-disable react-doctor/no-pass-live-state-to-parent -- Callbacks in this file intentionally stream live interaction state to the parent owner.
// oxlint-disable react-doctor/prefer-module-scope-static-value -- These values are intentionally colocated with the component/demo contract for readability and token context.

import type { FileUIPart } from "ai";
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion, type AnimationPlaybackControls } from "motion/react";
import { type CSSProperties, type PointerEvent as ReactPointerEvent, startTransition, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, ViewTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArtifactPanel } from "@/components/blocks/artifact";
import { TWGAppstack, type TwgToolSource } from "@/components/ui-custom/twg-appstack";
import { ChatTimelineNavigator } from "@/components/blocks/chat-timeline/chat-timeline-navigator";
import { useLazyRef } from "@/lib/use-lazy-ref";
import {
	DEFAULT_STARTER_ICON,
	getStarterIcon,
	type StarterIconKey,
} from "@/components/blocks/conversation-starters";
import { CreateButton } from "@/components/blocks/top-navigation/components/create-button";
import { AgentsDirectoryDialog, type AgentsDirectoryTemplateBuildOptions } from "@/components/blocks/agents-directory";
import { inferAutomationRules } from "@/components/blocks/triggers/data/trigger-catalog";
import { AGENT_TEMPLATES_CATEGORIES, AgentTemplatesDialog, type AgentTemplatesAgent } from "@/components/blocks/agent-templates";
import {
	DEMO_AGENT_TEMPLATES,
	DEMO_AGENT_TEMPLATES_SESSION,
} from "@/components/blocks/agent-templates/data/demo-template-agents";
import { RovoAppBrowserArtifact } from "@/components/projects/studio/components/rovo-app-browser-artifact";
import { RovoAppComposer } from "@/components/projects/studio/components/rovo-app-composer";
import { StudioAgentsSection } from "@/components/projects/studio/components/rovo-app-custom-agents-table";
import { RovoAppMessages } from "@/components/projects/studio/components/rovo-app-messages";
import { RovoAppHermesSkillDraftBar } from "@/components/projects/studio/components/rovo-app-hermes-skill-draft-bar";
import { RovoAppAgentConfigPanel, type AgentConfigView } from "@/components/projects/studio/components/rovo-app-agent-config-panel";
import { AgentTestPanel } from "@/components/blocks/agent-test";
import {
	SpotlightActions,
	SpotlightBody,
	SpotlightCard,
	SpotlightControls,
	SpotlightDismissControl,
	SpotlightFooter,
	SpotlightHeader,
	SpotlightHeadline,
	SpotlightPrimaryAction,
	SpotlightSecondaryAction,
	SpotlightStepCount,
	SpotlightTarget,
} from "@/components/blocks/spotlight";
import { useAgentOnboardingTour } from "@/components/projects/studio/hooks/use-agent-onboarding-tour";
import { RovoAppShellPaneLayout } from "@/components/projects/studio/components/rovo-app-shell-pane-layout";
import { RovoAppSidebar } from "@/components/projects/studio/components/rovo-app-sidebar";
import { isGeneratedAgentResult } from "@/components/projects/sidebar-chat/components/agent-result-card";
import { useArtifactAnnotations } from "@/components/ui-custom/hooks/use-artifact-annotations";
import { useBentoDescriptionClamp } from "@/components/ui-custom/hooks/use-bento-description-clamp";
import { useHasHorizontalOverflow } from "@/components/hooks/use-has-horizontal-overflow";
import { BENTO_CAROUSEL_CONTAINER_CLASS, BENTO_CAROUSEL_TILE_CLASS, CarouselArrow, getBentoEdgeMaskStyle } from "@/components/ui-custom/bento-carousel";
import { formatAnnotationsForVoiceContext } from "@/components/ui-custom/lib/artifact-annotations";
import type { ArtifactAnnotation } from "@/components/ui-custom/lib/artifact-annotations";
import { useRovoApp } from "@/components/projects/studio/hooks/use-rovo-app";
import { useHmrReloadSuppression } from "@/components/projects/studio/hooks/use-hmr-reload-suppression";
import { useAgentUrlSync } from "@/hooks/use-agent-url-sync";
import {
	buildRovoAppBrowserArtifactKey,
	shouldAutoOpenRovoAppBrowserArtifact,
	shouldShowReopenRovoAppBrowserArtifactControl,
} from "@/components/projects/studio/lib/rovo-app-browser-preview";
import { resolveRovoAppComposerPlaceholder } from "@/components/projects/shared/lib/rovo-app-composer-placeholder";
import { ROVO_APP_MAX_CHAT_PANE_WIDTH, ROVO_APP_MIN_ARTIFACT_PANE_WIDTH, ROVO_APP_MIN_CHAT_PANE_WIDTH, ROVO_APP_STUDIO_CONTENT_MAX_WIDTH_CLASS, getRovoAppShellLayout } from "@/components/projects/studio/lib/rovo-app-shell-layout";
import { getRovoAppSmartGenerationLayoutContext } from "@/components/projects/studio/lib/rovo-app-smart-generation-layout";
import { deriveRovoAppTimelineItems } from "@/components/projects/studio/lib/rovo-app-timeline";
import {
	buildDeterministicTriggerThinkingParts,
	DETERMINISTIC_TRIGGER_TRACE_INITIAL_DELAY_MS,
	DETERMINISTIC_TRIGGER_TRACE_STAGE_DELAYS_MS,
	planDeterministicAgentBuild,
} from "@/components/projects/studio/lib/demo-agent-builder";
import { buildComposerHermesContext, shouldResetComposerHermesSkillSelection } from "@/components/projects/studio/lib/rovo-app-hermes-skill-selection";
import { getStudioAutomationGeneratingAgents } from "@/components/projects/studio/lib/studio-automation-generating-agents";
import { useHermesEmbedEnabled } from "@/lib/hermes-feature-flags";
import { buildRovoAppThreadPath } from "@/components/projects/studio/lib/rovo-app-thread-route-sync";
import { createRovoAppUserMessage } from "@/components/projects/studio/lib/rovo-app-user-message";
import { appendDictationTranscript, resolveComposerDictationState } from "@/lib/composer-dictation";
import { readSessionAgentRecords } from "@/components/projects/studio/lib/studio-session-agent-storage";
import {
	applyTemplateDefaultsToResult,
	buildCreationTemplateContextFromAgent,
	buildCreationTemplateContextFromStarter,
	buildStudioAgentCreationContext,
	buildStudioAgentCreationContinuationContext,
	buildTemplateAgentResultFromAgent,
	resolveTemplateConfigForResult,
	type StudioCreationTemplateContext,
} from "@/components/projects/studio/lib/studio-agent-creation-context";
import {
	deriveTemplateCategoryIds,
	omitDomainScopeAnswer,
	readDomainCategoryIds,
	withDomainScopeQuestion,
} from "@/components/projects/studio/lib/agent-creation-domain-scope";
import { repairGeneratedAgentCatalog } from "@/app/data/directory/repair-agent-result";
import { type DelegationRequest, useRealtimeVoice } from "@/components/projects/studio/hooks/use-realtime-voice";
import type { ConversationFollowMode } from "@/components/ui-custom/conversation";
import { useSidebar as useGlobalSidebar } from "@/app/contexts/context-sidebar";
import { LeftNavigation } from "@/components/blocks/top-navigation/components/left-navigation";
import { RightNavigation } from "@/components/blocks/top-navigation/components/right-navigation";
import SearchSuggestionsPanel from "@/components/blocks/top-navigation/components/search-suggestions-panel";
import { useTopNavigation } from "@/components/blocks/top-navigation/hooks/use-top-navigation";
import {
	TOP_NAV_COLLAPSED_HEADER_PADDING_PX,
	TOP_NAV_COLLAPSED_LEFT_SECTION_WIDTH_PX,
	TOP_NAV_HEADER_HEIGHT_PX,
	TOP_NAV_PADDING_PX,
} from "@/components/blocks/top-navigation/layout-constants";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SkillTag, SkillTagGroup, type SkillTagColor } from "@/components/ui-custom/skill-tag";
import SearchIcon from "@atlaskit/icon/core/search";
import { SidebarProvider, SidebarResizeHandle } from "@/components/ui/sidebar";
import { Footer } from "@/components/ui-custom/footer";
import { useClicky } from "@/components/projects/studio/hooks/use-clicky";
import { useClickyVoice } from "@/components/projects/studio/hooks/use-clicky-voice";
import { ClickyOverlay } from "@/components/projects/studio/components/clicky/clicky-overlay";
import { ScreenAssistantRegionOverlay } from "@/components/screen-assistant/screen-assistant-region-overlay";
import {
	activateStudioScreenAssistantTarget,
	createStudioScreenAssistantSnapshot,
	getStudioScreenAssistantVisibleTargets,
	groundStudioScreenAssistantTarget,
	normalizeAgentDraftPatch,
	type StudioScreenAssistantRegion,
	type StudioScreenAssistantTarget,
} from "@/components/projects/studio/lib/studio-screen-assistant";
import { useSidebarResize } from "@/components/projects/studio/hooks/use-sidebar-resize";
import { useSidebarResize as useStudioAskRovoChatResize } from "@/components/projects/rovo/hooks/use-sidebar-resize";
import ChatPanel, { type ChatPanelGreetingProps } from "@/components/projects/sidebar-chat/page";
import type { ChatContextBarDescriptor } from "@/components/projects/sidebar-chat/lib/chat-context-bar";
import {
	AGENT_EDIT_GREETING_HEADING,
	AGENT_EDIT_GREETING_ILLUSTRATION_DARK_SRC,
	AGENT_EDIT_GREETING_ILLUSTRATION_SRC,
	agentEditSuggestions,
} from "@/components/projects/studio/data/agent-edit-greeting";
import {
	STUDIO_RFP_DEMO_AGENT_PROFILE_ID,
	STUDIO_RFP_DEMO_AGENT_RESULT,
	STUDIO_RFP_DEMO_AGENT_SOURCE_KEY,
} from "@/components/projects/studio/data/rfp-demo-agent";
import { clamp, cn, createId } from "@/lib/utils";
import { getRandomAgentAvatarSrc } from "@/lib/agent-avatars";
import { getSkillIcon } from "@/lib/skill-icons";
import { token } from "@/lib/tokens";
import { getLatestDataPart, getLatestUserMessageId, getMessageAgentResult, getMessageArtifactResult, getMessageText, hasTurnCompleteSignal, type RovoDataParts } from "@/lib/rovo-ui-messages";
import { getRovoAppArtifactKindLabel, getRovoAppArtifactTypeLabel, sortRovoAppArtifacts } from "@/components/projects/rovo/lib/rovo-app-artifacts";
import { RovoAppHeader } from "@/components/projects/studio/components/rovo-app-header";
import { ApprovalCard } from "@/components/blocks/approval-card/page";
import { ClarificationQuestionCard } from "@/components/projects/shared/components/clarification-question-card";
import { QuestionCardShortcutsFooter } from "@/components/projects/shared/components/question-card-shortcuts-footer";
import { getLatestQuestionCardPayload, type ClarificationAnswers, type ParsedQuestionCardPayload } from "@/components/projects/shared/lib/question-card-widget";
import type { PlanApprovalSelection } from "@/components/projects/shared/lib/plan-approval";
import { getLatestPendingPlanWidget, type ParsedPlanWidgetPayload } from "@/components/projects/shared/lib/plan-widget";
import { useDismissibleCards } from "@/components/projects/shared/hooks/use-dismissible-cards";
import { approveSkillDraft, fetchSkillDraftDetail, fetchSkillDrafts, rejectSkillDraft } from "@/components/projects/control-plane/lib/control-plane-api";
import type { HermesSkillDraftDetail, HermesSkillDraftSummary } from "@/lib/rovo-runtime-types";
import type { RovoAppHermesContext } from "@/lib/rovo-app-types";
import { getStudioSessionAgentDisplayName, useRovoSelectedAgent } from "@/app/contexts";
import { ROVO_DIRECTORY_AGENT_PROFILES, getRovoAgentPromptContext, isRovoAgentProfile, type RovoAgentProfile } from "@/app/data/directory/agents";

interface RovoAppShellProps {
	embedded?: boolean;
	initialThreadId?: string | null;
}

const ROVO_APP_SIDEBAR_MOTION_DURATION = "--duration-medium";
const ROVO_APP_SIDEBAR_MOTION_FALLBACK_MS = 200;
// Studio sidebar opens at this width by default across every view (home, agent
// config, etc.). The resize minimum is lowered to match so the default width is
// never clamped up on mount.
const ROVO_APP_SIDEBAR_DEFAULT_WIDTH = 216;
const ROVO_APP_SIDEBAR_MIN_WIDTH = 216;
const ROVO_APP_SIDEBAR_MAX_WIDTH = 480;
const STUDIO_AGENT_MAX_CONVERSATION_STARTERS = 3;
const STUDIO_LANDING_ENTER_TRANSITION = {
	type: "spring",
	visualDuration: 0.32,
	bounce: 0,
} as const;
const STUDIO_LANDING_REDUCED_TRANSITION = {
	duration: 0.08,
} as const;
const STUDIO_LANDING_CONTENT_INITIAL = {
	opacity: 0,
	transform: "translateY(8px)",
} as const;
const STUDIO_LANDING_CONTENT_VISIBLE = {
	opacity: 1,
	transform: "translateY(0px)",
} as const;
const STUDIO_LANDING_REDUCED_CONTENT_INITIAL = {
	opacity: 0,
} as const;
const STUDIO_LANDING_REDUCED_CONTENT_VISIBLE = {
	opacity: 1,
} as const;
const STUDIO_HOME_BENTO_INSTANT_EXIT = {
	height: 0,
	marginBottom: 0,
	opacity: 0,
	overflow: "hidden",
	transition: { duration: 0 },
} as const;
const STUDIO_HOME_BENTO_COLLAPSE_EXIT = {
	height: 0,
	marginBottom: 0,
	opacity: 0,
	overflow: "hidden",
	transform: "translateY(-8px)",
	transition: { type: "spring", visualDuration: 0.35, bounce: 0 },
} as const;
type StudioHomeBentoExitContext = {
	instant: boolean;
	reduceMotion: boolean;
};
const STUDIO_HOME_BENTO_VARIANTS = {
	hidden: {
		opacity: 0,
		transform: "translateY(-8px)",
	},
	visible: {
		opacity: 1,
		transform: "translateY(0px)",
		transition: STUDIO_LANDING_ENTER_TRANSITION,
	},
	exit: ({ instant, reduceMotion }: StudioHomeBentoExitContext) =>
		instant || reduceMotion ? STUDIO_HOME_BENTO_INSTANT_EXIT : STUDIO_HOME_BENTO_COLLAPSE_EXIT,
} as const;

const DEFAULT_COMPOSER_PLACEHOLDER = "Describe the agent you want to build";
const REALTIME_THREAD_SUMMARY_MAX_MESSAGES = 10;
const REALTIME_RESULT_SUMMARY_MAX_CHARS = 500;
const ROVO_APP_SPLIT_CHAT_PANEL_ID = "rovo-app-chat-pane";
const ROVO_APP_SPLIT_ARTIFACT_PANEL_ID = "rovo-app-artifact-pane";
const STUDIO_AUTOMATION_DISCOVERY_SOURCE_PATTERN = /\b(?:slack|jira|confluence|loom|figma|github|bitbucket|calendar|atlas|twg|teamwork graph)\b/giu;
type HomeStarterCategory = "analyze" | "brainstorm" | "review" | "summarize" | "create";

interface HomeStarterCategoryOption {
	iconClassName?: string;
	iconSrc?: string;
	id: HomeStarterCategory;
	label: string;
}

interface HomeStarterHeroSkill {
	color?: SkillTagColor;
	icon?: React.ReactNode;
	label: string;
}

interface HomeStarterHeroDecoration {
	bannerClassName: string;
	skills: ReadonlyArray<HomeStarterHeroSkill>;
	sources: ReadonlyArray<TwgToolSource>;
}

function isStudioAutomationDiscoveryDemoPrompt(prompt: string): boolean {
	const normalized = prompt
		.toLowerCase()
		.replace(/[^\p{L}\p{N}]+/gu, " ")
		.replace(/\s+/g, " ")
		.trim();
	if (!normalized) {
		return false;
	}

	const sourceMatches = new Set(normalized.match(STUDIO_AUTOMATION_DISCOVERY_SOURCE_PATTERN) ?? []).size;
	const hasRecentWorkSignal =
		/\b(?:last|past|recent)\s+(?:30|thirty)\s+days?\b/u.test(normalized) ||
		/\b(?:last|past|recent)\s+month\b/u.test(normalized) ||
		normalized.includes("work history") ||
		normalized.includes("recent work");
	const hasAutomationSignal =
		normalized.includes("manual workflow") ||
		normalized.includes("manual workflows") ||
		normalized.includes("repeated workflow") ||
		normalized.includes("automation") ||
		normalized.includes("agentic") ||
		/\bcreate\s+(?:an?\s+)?agents?\b/u.test(normalized);

	return hasRecentWorkSignal && hasAutomationSignal && sourceMatches >= 3;
}

interface HomeStarterTemplate {
	description: string;
	hero?: HomeStarterHeroDecoration;
	iconSrc: string;
	layoutClassName: string;
	prompt: string;
	title: string;
}

type HomeStarterCardGlowCSSProperties = CSSProperties & Record<`--card-glow-${string}`, string | number>;

const RICH_ICON_ROOT = "/illustration/rich-icon";
const HOME_STARTER_DEFAULT_CATEGORY: HomeStarterCategory = "brainstorm";

const HOME_STARTER_CATEGORIES: ReadonlyArray<HomeStarterCategoryOption> = [
	{ id: "brainstorm", label: "Planning", iconSrc: `${RICH_ICON_ROOT}/lightbulb/standard.svg`, iconClassName: "-translate-y-px scale-[1.08]" },
	{ id: "analyze", label: "Insights", iconSrc: `${RICH_ICON_ROOT}/marketing/standard.svg`, iconClassName: "scale-[1.08]" },
	{ id: "review", label: "Operations", iconSrc: `${RICH_ICON_ROOT}/product-management/standard.svg`, iconClassName: "translate-x-0.5 -translate-y-0.5 scale-[1.14]" },
	{ id: "summarize", label: "Writing", iconSrc: `${RICH_ICON_ROOT}/illustrations/standard.svg`, iconClassName: "-translate-y-px scale-[0.88]" },
	{ id: "create", label: "Work management", iconSrc: `${RICH_ICON_ROOT}/project-management/standard.svg`, iconClassName: "scale-[1.08]" },
];

// The hover glow uses each tile's own agent-avatar color so the stroke always
// matches the avatar shown on the tile. Avatars are grouped by agent family
// under /avatar-agent/<group>/, and every avatar in a family shares one brand
// color, so we derive the accent from the avatar group in `iconSrc`.
const HOME_STARTER_AVATAR_GROUP_ACCENTS: Readonly<Record<string, string>> = {
	"dev-agents": "#82B536",
	"product-agents": "#BF63F3",
	"service-agents": "#FFC716",
	"strategy-agents": "#FCA700",
	"teamwork-agents": "#1868DB",
};
const HOME_STARTER_CARD_GLOW_FALLBACK_ACCENT = "#1868DB";

const HOME_STARTER_CARD_GLOW_EFFECT_STYLE: HomeStarterCardGlowCSSProperties = {
	"--card-glow-border-core": 36,
	"--card-glow-border-spread": 120,
	"--card-glow-border-width": 1,
	"--card-glow-icon-blur": 28,
	"--card-glow-icon-brightness": 1.3,
	"--card-glow-icon-contrast": 1.4,
	"--card-glow-icon-opacity": 0.25,
	"--card-glow-icon-saturate": 5,
	"--card-glow-icon-scale": 3.4,
};

const HOME_STARTER_CARD_GLOW_LAYER_STYLE: CSSProperties = {
	filter: [
		"blur(calc(var(--card-glow-icon-blur) * 1px))",
		"saturate(var(--card-glow-icon-saturate))",
		"brightness(var(--card-glow-icon-brightness))",
		"contrast(var(--card-glow-icon-contrast))",
	].join(" "),
	scale: "var(--card-glow-icon-scale)",
	translate: "calc(var(--card-glow-pointer-x, -10) * 50cqi) calc(var(--card-glow-pointer-y, -10) * 50cqh)",
	willChange: "translate, scale, filter, opacity",
};

const HOME_STARTER_CARD_BASE_BORDER_STYLE: CSSProperties = {
	boxShadow: `inset 0 0 0 calc(var(--card-glow-border-width) * 1px) ${token("color.border")}`,
};

// The hover glow is a plain accent radial-gradient painted onto the same 1px
// ring as the base grey border (same border-box geometry + radius). It is fully
// transparent away from the pointer, so the grey stroke shows through everywhere
// except where the accent overlays it. Deliberately NO backdrop-filter here — an
// always-on filter recolors the ring even where the gradient is transparent,
// which crushes the grey border underneath and breaks coexistence.
const HOME_STARTER_CARD_BORDER_GLOW_STYLE: CSSProperties = {
	background: [
		"radial-gradient(",
		"circle at ",
		"calc((var(--card-glow-pointer-x, -10) + 1) * 50%) ",
		"calc((var(--card-glow-pointer-y, -10) + 1) * 50%), ",
		"var(--card-glow-tile-accent) 0 calc(var(--card-glow-border-core) * 1px), ",
		"transparent calc(var(--card-glow-border-spread) * 1px)",
		") border-box",
	].join(""),
	borderColor: "transparent",
	borderWidth: "calc(var(--card-glow-border-width) * 1px)",
	mask: "linear-gradient(#fff 0 100%) border-box, linear-gradient(#fff 0 100%) padding-box",
	maskComposite: "exclude",
	WebkitMask: "linear-gradient(#fff 0 100%) border-box, linear-gradient(#fff 0 100%) padding-box",
	WebkitMaskComposite: "xor",
};

const HOME_STARTER_VIEWS: Readonly<Record<HomeStarterCategory, ReadonlyArray<HomeStarterTemplate>>> = {
	analyze: [
		{
			description: "Synthesize feedback into themes, customer needs, risks, and recommended product actions.",
			iconSrc: "/avatar-agent/teamwork-agents/customer-insights.svg",
			layoutClassName: "sm:col-span-2 lg:col-start-1 lg:col-span-1 lg:row-start-1",
			prompt: "Build a Rovo agent named Customer Insights that analyzes customer feedback from Confluence pages, Jira Product Discovery, and Dovetail, then returns themes, needs, risks, and recommended actions.",
			title: "Customer Insights",
		},
		{
			description: "Scan Jira work items to find themes, candidate epics, and patterns worth acting on.",
			hero: {
				bannerClassName: "bg-[#82B536]",
				skills: [
					{ color: "strategy", label: "theme-mining" },
					{ color: "teamwork", label: "quote-selection" },
					{ color: "software", label: "decision-brief" },
					{ color: "service", label: "transcript-review" },
				],
				sources: [
					{ id: "jira", label: "Jira", provider: "jira" },
					{ id: "jira-product-discovery", label: "Jira Product Discovery", provider: "jira-product-discovery" },
					{ id: "confluence", label: "Confluence", provider: "confluence" },
				],
			},
			iconSrc: "/avatar-agent/dev-agents/code-reviewer.svg",
			layoutClassName: "sm:col-span-2 sm:row-span-2 lg:col-start-2 lg:row-start-1",
			prompt: "Build a Rovo agent named Jira Theme Analyzer that scans Jira work items with the JQL query builder, then identifies themes, recommends epic groupings, and logs them to Jira Product Discovery.",
			title: "Jira Theme Analyzer",
		},
		{
			description: "Turn transcripts into decisions, insights, recommendations, owners, and follow-up actions.",
			iconSrc: "/avatar-agent/strategy-agents/wildcard-1.svg",
			layoutClassName: "sm:row-span-2 lg:col-start-4 lg:row-start-1",
			prompt: "Build a Rovo agent named Transcript Insights Reporter that turns Loom and Microsoft Teams meeting transcripts into decisions, insights, recommendations, owners, and follow-up action items.",
			title: "Transcript Insights Reporter",
		},
		{
			description: "Find decisions, action items, highlights, and useful context across meeting notes.",
			iconSrc: "/avatar-agent/product-agents/wildcard-6.svg",
			layoutClassName: "sm:row-span-2 lg:col-start-5 lg:row-start-1",
			prompt: "Build a Rovo agent named Meeting Insights that searches Confluence notes and Microsoft Teams transcripts, then runs Summarize thread to surface decisions, action items, highlights, and useful context.",
			title: "Meeting Insights",
		},
		{
			description: "Spot emerging trends across notes and feedback.",
			iconSrc: "/avatar-agent/service-agents/wildcard-5.svg",
			layoutClassName: "lg:col-start-1 lg:row-start-2",
			prompt: "Build a Rovo agent named Trend Spotter that scans Confluence notes and Dovetail feedback with Run deep research to surface emerging themes, leading indicators, and worth-watching shifts.",
			title: "Trend Spotter",
		},
		{
			description: "Map sentiment shifts across customer signals.",
			iconSrc: "/avatar-agent/product-agents/wildcard-4.svg",
			layoutClassName: "sm:col-span-2",
			prompt: "Build a Rovo agent named Sentiment Mapper that clusters Zendesk and Salesforce customer comments by sentiment, intent, and impact, then highlights the shifts that need a response.",
			title: "Sentiment Mapper",
		},
		{
			description: "Trace product drop-offs, connect them to feedback, and suggest the next investigation.",
			iconSrc: "/avatar-agent/product-agents/wildcard-5.svg",
			layoutClassName: "",
			prompt: "Build a Rovo agent named Funnel Analyzer that runs Funnel analytics over Amplitude event data and feedback to identify drop-off points, the most likely causes, and the next investigation step.",
			title: "Funnel Analyzer",
		},
		{
			description: "Pull research into a single, decision-ready brief.",
			iconSrc: "/avatar-agent/teamwork-agents/work-organizer.svg",
			layoutClassName: "sm:col-span-2",
			prompt: "Build a Rovo agent named Research Synthesizer that pulls together Confluence notes and Dovetail interviews with Run deep research into a single brief with insights, supporting quotes, and recommended decisions.",
			title: "Research Synthesizer",
		},
	],
	brainstorm: [
		{
			description: "Review DACI decisions, close context gaps, and suggest the next decision-ready resources.",
			hero: {
				bannerClassName: "bg-[#1868DB]",
				skills: [
					{ color: "platform", label: "stakeholder-input" },
					{ color: "2p3p", label: "opportunity-sizing" },
					{ color: "default", label: "option-mapping" },
					{ color: "product", label: "risk-spotting" },
					{ color: "strategy", label: "constraint-mapping" },
					{ color: "teamwork", label: "rubric-building" },
					{ color: "software", label: "evidence-gap-check" },
					{ color: "service", label: "idea-ranking" },
				],
				sources: [
					{ id: "powerbi", label: "Power BI", provider: "teams", iconSrc: "/3p/powerbi/24.svg" },
					{ id: "jira-service-management", label: "Jira Service Management", provider: "jira-service-management" },
					{ id: "figma", label: "Figma", provider: "teams", iconSrc: "/3p/figma/24.svg" },
					{ id: "jira", label: "Jira", provider: "jira" },
					{ id: "microsoft-teams", label: "Microsoft Teams", provider: "teams", iconSrc: "/3p/microsoft-teams/24.svg" },
					{ id: "salesforce", label: "Salesforce", provider: "salesforce" },
					{ id: "slack", label: "Slack", provider: "teams", iconSrc: "/3p/slack/24.svg" },
				],
			},
			iconSrc: "/avatar-agent/teamwork-agents/decision-director.svg",
			layoutClassName: "sm:col-span-2 sm:row-span-2 lg:col-start-1 lg:col-span-2 lg:row-start-1 lg:row-span-2",
			prompt: "Build a Rovo agent named Decision Director that reviews DACI decision documents in Confluence, suggests improvements, identifies missing context, and points to useful Jira Product Discovery resources.",
			title: "Decision Director",
		},
		{
			description: "Create and review clear, measurable OKRs against examples, team priorities, and outcome guidance.",
			iconSrc: "/avatar-agent/product-agents/wildcard-2.svg",
			layoutClassName: "lg:col-start-3 lg:col-span-2 lg:row-start-1",
			prompt: "Build a Rovo agent named OKR Generator that creates effective OKRs in Jira Product Discovery, reviews draft OKRs in Confluence, finds similar examples, and shares guidance for stronger objectives and key results.",
			title: "OKR Generator",
		},
		{
			description: "Explore non-obvious directions before committing.",
			iconSrc: "/avatar-agent/dev-agents/code-planner.svg",
			layoutClassName: "lg:col-start-5 lg:row-start-1",
			prompt: "Build a Rovo agent named Opportunity Explorer that explores ideas in Jira Product Discovery to expand a rough idea into distinct approaches, adjacent opportunities, risks, and the strongest path to investigate first.",
			title: "Opportunity Explorer",
		},
		{
			description: "Turn ideas into experiments and decision points.",
			iconSrc: "/avatar-agent/service-agents/wildcard-1.svg",
			layoutClassName: "lg:col-start-3 lg:col-span-2 lg:row-start-2",
			prompt: "Build a Rovo agent named Experiment Planner that turns Jira Product Discovery ideas into experiments with hypotheses, success criteria, owners, decision points, and next steps, then tracks them with LaunchDarkly.",
			title: "Experiment Planner",
		},
		{
			description: "Compare options by upside, cost, and risk.",
			iconSrc: "/avatar-agent/strategy-agents/wildcard-2.svg",
			layoutClassName: "lg:col-start-5 lg:row-start-2",
			prompt: "Build a Rovo agent named Tradeoff Mapper that compares competing options in Jira Product Discovery by upside, cost, risk, reversibility, confidence, and team fit before recommending a direction.",
			title: "Tradeoff Mapper",
		},
		{
			description: "Stress-test ideas against weak assumptions.",
			iconSrc: "/avatar-agent/dev-agents/basic-coding-agent-template.svg",
			layoutClassName: "sm:col-span-2",
			prompt: "Build a Rovo agent named Assumption Tester that reads a Confluence brief and lists likely failure modes, weak assumptions, unknowns, and the evidence that would change the recommendation.",
			title: "Assumption Tester",
		},
		{
			description: "Define practical criteria for choosing a path.",
			iconSrc: "/avatar-agent/product-agents/wildcard-3.svg",
			layoutClassName: "",
			prompt: "Build a Rovo agent named Criteria Builder that uses Jira Product Discovery to define must-haves, nice-to-haves, risks, disqualifiers, and a comparison rubric for evaluating options.",
			title: "Criteria Builder",
		},
	],
	review: [
		{
			description: "Triage service requests, recommend field updates, and ask for missing details when needed.",
			iconSrc: "/avatar-agent/service-agents/service-triage.svg",
			layoutClassName: "sm:col-span-2 lg:col-start-1 lg:col-span-1 lg:row-start-1 lg:row-span-2",
			prompt: "Build a Rovo agent named Service Triage that triages Jira Service Management requests, recommends field updates, explains automation-ready output, and asks for missing details when needed.",
			title: "Service Triage",
		},
		{
			description: "Draft support responses, suggest assignees, and summarize requests for faster resolution.",
			hero: {
				bannerClassName: "bg-[#FCA700]",
				skills: [
					{ color: "platform", label: "handoff" },
					{ color: "2p3p", label: "postmortem-scan" },
					{ color: "default", label: "incident-routing" },
					{ color: "product", label: "readiness-review" },
					{ color: "strategy", label: "escalation-drafting" },
					{ color: "teamwork", label: "status-update" },
					{ color: "software", label: "owner-mapping" },
					{ color: "service", label: "compliance-note" },
				],
				sources: [
					{ id: "jira-service-management", label: "Jira Service Management", provider: "jira-service-management" },
					{ id: "salesforce", label: "Salesforce", provider: "salesforce" },
					{ id: "microsoft-teams", label: "Microsoft Teams", provider: "teams", iconSrc: "/3p/microsoft-teams/24.svg" },
				],
			},
			iconSrc: "/avatar-agent/strategy-agents/strategic-insight.svg",
			layoutClassName: "sm:col-span-2 sm:row-span-2 lg:col-start-2 lg:col-span-2 lg:row-start-1 lg:row-span-2",
			prompt: "Build a Rovo agent named Service Request Helper that drafts Jira Service Management responses using prior request insights, suggests assignees and skills, and summarizes requests for faster resolution.",
			title: "Service Request Helper",
		},
		{
			description: "Guide incident response, on-call actions, mitigation, status updates, and recovery.",
			iconSrc: "/avatar-agent/dev-agents/code-standardizer.svg",
			layoutClassName: "lg:col-start-4 lg:col-span-2 lg:row-start-1",
			prompt: "Build a Rovo agent named Rovo Ops that works as an Incident responder across Opsgenie and Jira Service Management for on-call duties, mitigation guidance, and faster detection, response, and recovery.",
			title: "Rovo Ops",
		},
		{
			description: "Answer Rovo setup and usage questions with concise guidance and helpful links.",
			iconSrc: "/avatar-agent/product-agents/wildcard-3.svg",
			layoutClassName: "lg:col-start-4 lg:row-start-2",
			prompt: "Build a Rovo agent named Rovo Expert that introduces Rovo features, answers setup and usage questions, and shares helpful Confluence links for unlocking organizational knowledge.",
			title: "Rovo Expert",
		},
		{
			description: "Help teammates document working style, communication norms, and collaboration preferences.",
			iconSrc: "/avatar-agent/teamwork-agents/user-manual-writer.svg",
			layoutClassName: "lg:col-start-5 lg:row-start-2",
			prompt: "Build a Rovo agent named User Manual Writer that helps people Write user manual pages in Confluence covering working hours, preferred environments, communication norms, and collaboration tips.",
			title: "User Manual Writer",
		},
		{
			description: "Answer policy and process questions from trusted context.",
			iconSrc: "/avatar-agent/teamwork-agents/workflow-builder.svg",
			layoutClassName: "sm:col-span-2",
			prompt: "Build a Rovo agent named Knowledge Base Guide that answers policy and process questions from trusted Confluence context, can Write KB article drafts, cites useful references, and flags missing information.",
			title: "Knowledge Base Guide",
		},
		{
			description: "Compile post-incident timelines, decisions, and follow-ups.",
			iconSrc: "/avatar-agent/service-agents/rca-agent.svg",
			layoutClassName: "",
			prompt: "Build a Rovo agent named Incident Recap Writer that turns Slack channels and Jira Service Management timelines into a recap, running Analyze root cause to surface root causes, decisions, follow-ups, and owners.",
			title: "Incident Recap Writer",
		},
	],
	summarize: [
		{
			description: "Create and review PRDs with customer empathy, evidence, acceptance criteria, and direct feedback.",
			hero: {
				bannerClassName: "bg-[#BF63F3]",
				skills: [
					{ color: "default", label: "content-briefing" },
					{ color: "product", label: "audience-fit" },
					{ color: "strategy", label: "meeting-recap" },
					{ color: "teamwork", label: "executive-summary" },
					{ color: "software", label: "brand-review" },
					{ color: "service", label: "translation-review" },
					{ color: "platform", label: "clarity-pass" },
					{ color: "2p3p", label: "prd-outline" },
					{ color: "default", label: "action-extraction" },
					{ color: "product", label: "changelog-writing" },
				],
				sources: [
					{ id: "figma", label: "Figma", provider: "teams", iconSrc: "/3p/figma/24.svg" },
					{ id: "bitbucket", label: "Bitbucket", provider: "bitbucket" },
					{ id: "github", label: "GitHub", provider: "teams", iconSrc: "/3p/github/24.svg" },
					{ id: "salesforce", label: "Salesforce", provider: "salesforce" },
					{ id: "jira-product-discovery", label: "Jira Product Discovery", provider: "jira-product-discovery" },
				],
			},
			iconSrc: "/avatar-agent/product-agents/wildcard-1.svg",
			layoutClassName: "sm:col-span-2 sm:row-span-2 lg:col-start-1 lg:col-span-2 lg:row-start-1 lg:row-span-2",
			prompt: "Build a Rovo agent named Product Requirements Guide that runs Build PRD in Confluence with Jira Product Discovery and Figma context, reviewing drafts with direct language, customer empathy, supporting evidence, and actionable feedback.",
			title: "Product Requirements Guide",
		},
		{
			description: "Convert Jira work items into grouped release notes for customers and stakeholders.",
			iconSrc: "/avatar-agent/dev-agents/deployment-summarizer.svg",
			layoutClassName: "lg:col-start-3 lg:row-start-1 lg:row-span-2",
			prompt: "Build a Rovo agent named Release Notes Drafter that reviews recent Jira work, groups it into themes, and drafts clear release notes in Confluence for stakeholders.",
			title: "Release Notes Drafter",
		},
		{
			description: "Draft or review content against brand voice, tone guidance, and audience needs.",
			iconSrc: "/avatar-agent/strategy-agents/wildcard-3.svg",
			layoutClassName: "lg:col-start-4 lg:col-span-2 lg:row-start-1",
			prompt: "Build a Rovo agent named Brand Voice Crafter that acts as a Brand voice editor over Confluence content, checking it against supplied brand voice and tone guidelines to help produce consistent communications.",
			title: "Brand Voice Crafter",
		},
		{
			description: "Draft social posts, improve engagement, and adapt messages by channel and audience.",
			iconSrc: "/avatar-agent/service-agents/wildcard-4.svg",
			layoutClassName: "lg:col-start-4 lg:row-start-2",
			prompt: "Build a Rovo agent named Social Media Writer that runs Produce marketing materials with Canva to draft social media posts, suggests more engaging variants, and adapts messaging for channel, audience, and tone.",
			title: "Social Media Writer",
		},
		{
			description: "Translate writing while preserving meaning, tone, accessibility, and audience context.",
			iconSrc: "/avatar-agent/teamwork-agents/global-translator.svg",
			layoutClassName: "lg:col-start-5 lg:row-start-2",
			prompt: "Build a Rovo agent named Global Translator that translates Confluence writing into most languages while preserving meaning, tone, and accessibility for speakers of other languages.",
			title: "Global Translator",
		},
		{
			description: "Condense dense context for leadership updates.",
			iconSrc: "/avatar-agent/service-agents/wildcard-5.svg",
			layoutClassName: "sm:col-span-2",
			prompt: "Build a Rovo agent named Executive Briefing Writer that condenses dense Confluence context into key points, decisions, risks, recommendations, and next steps for leadership.",
			title: "Executive Briefing Writer",
		},
		{
			description: "Package progress into stakeholder-ready updates.",
			iconSrc: "/avatar-agent/service-agents/ops-guide.svg",
			layoutClassName: "",
			prompt: "Build a Rovo agent named Stakeholder Update Builder that pulls Jira progress and posts to Slack, summarizing decisions, risks, blockers, and next steps in a concise update format.",
			title: "Stakeholder Update Builder",
		},
	],
	create: [
		{
			description: "Break large projects, epics, or workstreams into sequenced tasks, owners, and next steps.",
			hero: {
				bannerClassName: "bg-[#FFC716]",
				skills: [
					{ color: "teamwork", label: "dependency-map" },
					{ color: "software", label: "workflow-design" },
					{ color: "service", label: "blocker-scan" },
					{ color: "platform", label: "acceptance-criteria" },
					{ color: "2p3p", label: "prioritization" },
				],
				sources: [
					{ id: "google-drive", label: "Google Drive", provider: "google-drive" },
					{ id: "slack", label: "Slack", provider: "teams", iconSrc: "/3p/slack/24.svg" },
					{ id: "loom", label: "Loom", provider: "loom" },
				],
			},
			iconSrc: "/avatar-agent/service-agents/wildcard-2.svg",
			layoutClassName: "sm:col-span-2 sm:row-span-2 lg:col-start-4 lg:col-span-2 lg:row-start-1 lg:row-span-2",
			prompt: "Build a Rovo agent named Work Item Planner that breaks big projects and epics into smaller tasks in Jira, running Create work items to set owners, sequencing, and next steps.",
			title: "Work Item Planner",
		},
		{
			description: "Find, move, update, and organize Jira work items across sprints, epics, and stale queues.",
			iconSrc: "/avatar-agent/teamwork-agents/work-organizer.svg",
			layoutClassName: "lg:col-start-1 lg:row-start-1 lg:row-span-2",
			prompt: "Build a Rovo agent named Work Item Organizer that uses the Bulk issue editor to find and update Jira work items, moves them into sprints, assigns epics, deletes stale items, and recommends cleanup actions.",
			title: "Work Item Organizer",
		},
		{
			description: "Write concise bug reports with reproduction steps, impact, expected behavior, and triage notes.",
			iconSrc: "/avatar-agent/dev-agents/code-vulnerability-scanner-npm-yarn.svg",
			layoutClassName: "lg:col-start-2 lg:col-span-2 lg:row-start-1",
			prompt: "Build a Rovo agent named Bug Report Assistant that turns Jira and Sentry context into clear, concise bug reports with reproduction details, impact, expected behavior, and triage-ready notes.",
			title: "Bug Report Assistant",
		},
		{
			description: "Detect blocked work, explain the evidence, and recommend the clearest unblocking move.",
			iconSrc: "/avatar-agent/strategy-agents/wildcard-4.svg",
			layoutClassName: "lg:col-start-2 lg:row-start-2",
			prompt: "Build a Rovo agent named Blocker Checker that runs the Dependency mapper over Jira work items to detect likely blockers, explains the evidence, and recommends how to update or unblock the work.",
			title: "Blocker Checker",
		},
		{
			description: "Review work items against a team's definition of ready and suggest missing details.",
			iconSrc: "/avatar-agent/product-agents/feedback-analyzer.svg",
			layoutClassName: "lg:col-start-3 lg:row-start-2",
			prompt: "Build a Rovo agent named Readiness Checker that runs the Backlog groomer to review a Jira work item against a team's definition of ready and suggests fixes when required details are missing.",
			title: "Readiness Checker",
		},
		{
			description: "Summarize in-flight projects, priorities, owners, progress, and work that needs attention.",
			iconSrc: "/avatar-agent/teamwork-agents/progress-tracker.svg",
			layoutClassName: "sm:col-span-2",
			prompt: "Build a Rovo agent named Progress Tracker that uses the Milestone tracker over Jira to give teams a real-time overview of in-flight projects, current priorities, owners, and what should be prioritized next.",
			title: "Progress Tracker",
		},
		{
			description: "Recommend balanced sprint scope using capacity, velocity, issue size, and delivery risk.",
			iconSrc: "/avatar-agent/product-agents/wildcard-2.svg",
			layoutClassName: "",
			prompt: "Build a Rovo agent named Sprint Capacity Planner that runs the Sprint planner over Jira to recommend a balanced sprint scope based on team capacity, ticket sizes, prior velocity, and risk.",
			title: "Sprint Capacity Planner",
		},
	],
};

function parseCssDurationMs(value: string): number | null {
	const trimmedValue = value.trim();

	if (!trimmedValue) {
		return null;
	}

	if (trimmedValue.endsWith("ms")) {
		const durationMs = Number.parseFloat(trimmedValue.slice(0, -2));
		return Number.isFinite(durationMs) ? durationMs : null;
	}

	if (trimmedValue.endsWith("s")) {
		const durationSeconds = Number.parseFloat(trimmedValue.slice(0, -1));
		return Number.isFinite(durationSeconds) ? durationSeconds * 1000 : null;
	}

	const numericDuration = Number.parseFloat(trimmedValue);
	return Number.isFinite(numericDuration) ? numericDuration : null;
}

function getHomeStarterCardGlowAccent(iconSrc: string): string {
	const group = iconSrc.match(/\/avatar-agent\/([^/]+)\//)?.[1];
	return (group && HOME_STARTER_AVATAR_GROUP_ACCENTS[group]) || HOME_STARTER_CARD_GLOW_FALLBACK_ACCENT;
}

function getHomeStarterCardStyle(accentColor: string): HomeStarterCardGlowCSSProperties {
	return {
		"--card-glow-tile-accent": accentColor,
		containerType: "size",
		willChange: "transform, opacity",
	};
}

function resetHomeStarterCardPointer(tile: HTMLElement) {
	tile.style.setProperty("--card-glow-pointer-x", "-10");
	tile.style.setProperty("--card-glow-pointer-y", "-10");
}

function buildFallbackTemplatePrompt(agent: AgentTemplatesAgent): string {
	const appList = agent.sources?.map((source) => source.label).join(", ");
	const skillList = agent.skills?.map((skill) => skill.label).join(", ");
	const featureList = agent.capabilities?.map((capability) => capability.label).join("; ");

	return [
		`Use the ${agent.name} template to create a Rovo agent.`,
		agent.description,
		appList ? `Connect it to ${appList}.` : null,
		skillList ? `Include skills for ${skillList}.` : null,
		featureList ? `It should support these features: ${featureList}.` : null,
		"Keep the prompt concise and ready for me to review before sending.",
	].filter(Boolean).join(" ");
}

function HomeStarterCardGlowLayers({ iconSrc }: Readonly<{ iconSrc: string }>) {
	return (
		<>
			<span
				aria-hidden
				className="pointer-events-none absolute inset-0 z-0 grid place-items-center transform-gpu"
				style={HOME_STARTER_CARD_GLOW_LAYER_STYLE}
			>
				<Image
					alt=""
					aria-hidden
					className="size-12 object-contain opacity-[var(--card-glow-icon-opacity)]"
					height={48}
					src={iconSrc}
					width={48}
				/>
			</span>
			<span
				aria-hidden
				className="pointer-events-none absolute inset-0 z-[1] rounded-[inherit]"
				data-home-starter-card-base-border
				style={HOME_STARTER_CARD_BASE_BORDER_STYLE}
			/>
			<span
				aria-hidden
				className="pointer-events-none absolute inset-0 z-[2] overflow-hidden rounded-[inherit] border border-transparent"
				data-home-starter-card-glow-border
				style={HOME_STARTER_CARD_BORDER_GLOW_STYLE}
			/>
		</>
	);
}

const HOME_STARTER_HERO_VARIANTS = {
	exit: { opacity: 0, scale: 0.98, y: -4 },
	hidden: { opacity: 0, scale: 0.98, y: 8 },
	visible: { opacity: 1, scale: 1, y: 0 },
} as const;

function HomeStarterHeroTile({
	accentColor,
	onBlur,
	onClick,
	onFocus,
	onMouseEnter,
	onMouseLeave,
	setTileRef,
	shouldReduceMotion,
	template,
}: Readonly<{
	accentColor: string;
	onBlur: () => void;
	onClick: () => void;
	onFocus: () => void;
	onMouseEnter: () => void;
	onMouseLeave: () => void;
	setTileRef: (node: HTMLButtonElement | null) => void;
	shouldReduceMotion: boolean | null;
	template: HomeStarterTemplate & { hero: HomeStarterHeroDecoration };
}>) {
	const { hero } = template;

	return (
		<motion.button
			aria-label={`Use prompt starter: ${template.title}`}
			className={cn(
				"group group/home-starter-card relative isolate flex min-h-0 flex-col items-start gap-3 overflow-hidden rounded-lg bg-background p-4 text-left outline-none transition-[background-color,box-shadow] duration-fast ease-out hover:bg-bg-neutral-subtle focus-visible:ring-3 focus-visible:ring-ring/50",
				BENTO_CAROUSEL_TILE_CLASS,
				template.layoutClassName,
			)}
			onBlur={onBlur}
			onClick={onClick}
			onFocus={onFocus}
			onMouseEnter={onMouseEnter}
			onMouseLeave={onMouseLeave}
			ref={setTileRef}
			style={getHomeStarterCardStyle(accentColor)}
			transition={{ duration: 0.2, ease: [0, 0.4, 0, 1] }}
			type="button"
			variants={HOME_STARTER_HERO_VARIANTS}
			whileHover={
				shouldReduceMotion
					? undefined
					: { transition: { damping: 22, stiffness: 400, type: "spring" }, y: -2 }
			}
			whileTap={shouldReduceMotion ? undefined : { scale: 0.98, transition: { duration: 0.05 } }}
		>
			<HomeStarterCardGlowLayers iconSrc={template.iconSrc} />
			<span className="relative z-[3] inline-flex size-8 shrink-0 items-center justify-center">
				<Image
					alt=""
					aria-hidden
					className="size-8 object-contain"
					height={32}
					src={template.iconSrc}
					width={32}
				/>
			</span>
			<div className="relative z-[3] flex min-h-0 flex-1 flex-col gap-4">
				<div className="flex flex-col gap-1">
					<span className="block w-full min-w-0 text-sm font-semibold leading-5 text-text">
						{template.title}
					</span>
					<span className="block w-full min-w-0 text-sm leading-5 text-text max-lg:line-clamp-2 max-lg:overflow-hidden">
						{template.description}
					</span>
				</div>
				{hero.sources.length > 0 || hero.skills.length > 0 ? (
					<div className="flex flex-col gap-4 max-lg:hidden">
						{hero.sources.length > 0 ? (
							<div className="flex flex-col gap-1">
								<span className="block text-xs font-semibold leading-4 text-text-subtle">
									Works with
								</span>
								<TWGAppstack
									animated={false}
									className="justify-start"
									iconSize="md"
									maxVisible={hero.sources.length}
									sources={hero.sources}
								/>
							</div>
						) : null}
						{hero.skills.length > 0 ? (
							<div className="flex flex-col gap-1">
								<span className="block text-xs font-semibold leading-4 text-text-subtle">
									Skills
								</span>
								<SkillTagGroup maxRows={2}>
									{hero.skills.map((skill) => (
										<SkillTag color={skill.color ?? "default"} icon={skill.icon ?? getSkillIcon(skill.label)} key={skill.label}>
											{skill.label}
										</SkillTag>
									))}
								</SkillTagGroup>
							</div>
						) : null}
					</div>
				) : null}
			</div>
		</motion.button>
	);
}

const HOME_STARTER_CYCLE_DURATION_MS = 6000;

// Bottom "more below" tease. Applied as an alpha mask on the grid wrapper (the
// stable AnimatePresence host) rather than as a semi-transparent gradient
// overlay: an overlay only hides content that is fully opaque, so during a tab
// swap the exiting/entering tiles — whose own opacity is mid-animation — show
// *through* the scrim. A mask clips the content layer's alpha at the source, so
// transitioning tiles can never leak past the fade. Height matches the prior
// `h-24` (96px) overlay. The "Browse all" pill stays a separate, unmasked
// sibling so it keeps reading as a crisp affordance over the faded edge.

function HomeStarterBento({
	onBrowseTemplates,
	onDismiss,
	onPreviewEnd,
	onPreviewStart,
	onSelect,
	templatesDialogOpen,
}: Readonly<{
	onBrowseTemplates: (category: HomeStarterCategory) => void;
	onDismiss: () => void;
	onPreviewEnd: () => void;
	onPreviewStart: (prompt: string) => void;
	onSelect: (prompt: string, template?: StudioCreationTemplateContext) => void;
	templatesDialogOpen: boolean;
}>) {
	const [activeCategory, setActiveCategory] = useState<HomeStarterCategory>(HOME_STARTER_DEFAULT_CATEGORY);
	const [bentoInteracting, setBentoInteracting] = useState(false);
	const [browseAllHovered, setBrowseAllHovered] = useState(false);
	const shouldReduceMotion = useReducedMotion();
	const focusedTemplatePromptRef = useRef<string | null>(null);
	const hoveredTemplatePromptRef = useRef<string | null>(null);
	const bentoInteractingRef = useRef(false);
	const tileRefs = useRef<Array<HTMLButtonElement | null>>([]);
	const registerDescBox = useBentoDescriptionClamp();
	const { ref: bentoCarouselRef, canScrollLeft, canScrollRight, scrollByDir } = useHasHorizontalOverflow<HTMLDivElement>({ reduceMotion: shouldReduceMotion ?? false });
	const templates = HOME_STARTER_VIEWS[activeCategory];
	const visibleTemplates = templates.slice(0, 5);
	const canShowMore = templates.length > visibleTemplates.length;
	const cycleRunning = !shouldReduceMotion && !templatesDialogOpen;
	const cycleProgress = useMotionValue(0);
	const cycleControlsRef = useRef<AnimationPlaybackControls | null>(null);
	const updateBentoInteracting = useCallback((interacting: boolean) => {
		bentoInteractingRef.current = interacting;
		setBentoInteracting(interacting);
	}, []);

	useEffect(() => {
		if (!cycleRunning) {
			cycleProgress.set(0);
			return;
		}

		cycleProgress.set(0);
		const controls = animate(cycleProgress, 1, {
			duration: HOME_STARTER_CYCLE_DURATION_MS / 1000,
			ease: "linear",
			onComplete: () => {
				cycleProgress.set(0);
				setActiveCategory((prev) => {
					const currentIndex = HOME_STARTER_CATEGORIES.findIndex((entry) => entry.id === prev);
					const nextIndex = (currentIndex + 1) % HOME_STARTER_CATEGORIES.length;
					return HOME_STARTER_CATEGORIES[nextIndex].id;
				});
			},
		});
		if (bentoInteractingRef.current) {
			controls.pause();
		}
		cycleControlsRef.current = controls;

		return () => {
			controls.stop();
			cycleControlsRef.current = null;
		};
	}, [activeCategory, cycleRunning, cycleProgress]);

	useEffect(() => {
		const controls = cycleControlsRef.current;
		if (!controls) {
			return;
		}
		if (bentoInteracting) {
			controls.pause();
		} else {
			controls.play();
		}
	}, [bentoInteracting]);
	const handleTemplateMouseEnter = useCallback((prompt: string) => {
		hoveredTemplatePromptRef.current = prompt;
		onPreviewStart(prompt);
	}, [onPreviewStart]);
	const handleTemplateMouseLeave = useCallback(() => {
		hoveredTemplatePromptRef.current = null;

		if (focusedTemplatePromptRef.current) {
			onPreviewStart(focusedTemplatePromptRef.current);
		} else {
			onPreviewEnd();
		}
	}, [onPreviewEnd, onPreviewStart]);
	const handleTemplateFocus = useCallback((prompt: string) => {
		focusedTemplatePromptRef.current = prompt;
		onPreviewStart(prompt);
	}, [onPreviewStart]);
	const handleTemplateBlur = useCallback(() => {
		focusedTemplatePromptRef.current = null;

		if (hoveredTemplatePromptRef.current) {
			onPreviewStart(hoveredTemplatePromptRef.current);
		} else {
			onPreviewEnd();
		}
	}, [onPreviewEnd, onPreviewStart]);
	const handleBentoPointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
		for (const tile of tileRefs.current) {
			if (!tile) {
				continue;
			}

			const rect = tile.getBoundingClientRect();
			const centerX = rect.left + rect.width / 2;
			const centerY = rect.top + rect.height / 2;
			const relativeX = event.clientX - centerX;
			const relativeY = event.clientY - centerY;
			const normalizedX = relativeX / (rect.width / 2);
			const normalizedY = relativeY / (rect.height / 2);

			tile.style.setProperty("--card-glow-pointer-x", normalizedX.toFixed(3));
			tile.style.setProperty("--card-glow-pointer-y", normalizedY.toFixed(3));
		}
	}, []);
	const resetBentoPointer = useCallback(() => {
		for (const tile of tileRefs.current) {
			if (tile) {
				resetHomeStarterCardPointer(tile);
			}
		}
	}, []);
	return (
		<div
			className="w-full"
			onFocus={() => updateBentoInteracting(true)}
			onBlur={(event) => {
				if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
					updateBentoInteracting(false);
				}
			}}
			onMouseEnter={() => updateBentoInteracting(true)}
			onMouseLeave={() => updateBentoInteracting(false)}
			onPointerLeave={resetBentoPointer}
			onPointerMove={handleBentoPointerMove}
		>
			<div className="@container/bento relative" style={HOME_STARTER_CARD_GLOW_EFFECT_STYLE}>
				{/*
					`-mt-2 pt-2` gives the masked content top headroom that nets to zero
					visual shift: the bottom-fade mask clips its children to the box, so
					tiles flush with the top edge would have their hover lift (`y: -2`) and
					focus ring sliced off. The padding keeps that motion inside the opaque
					region; the negative margin pulls the box back so spacing is unchanged.
				*/}
				<div
					className={cn("relative -mt-2 pt-2", canShowMore && "lg:bento-fade-bottom")}
				>
					<AnimatePresence mode="wait" initial={false}>
						<motion.div
							key={activeCategory}
							ref={bentoCarouselRef}
							style={getBentoEdgeMaskStyle(canScrollLeft, canScrollRight)}
							className={cn(BENTO_CAROUSEL_CONTAINER_CLASS, ROVO_APP_STUDIO_CONTENT_MAX_WIDTH_CLASS)}
							initial={shouldReduceMotion ? false : "hidden"}
							animate="visible"
							exit={shouldReduceMotion ? undefined : "exit"}
							variants={{
								hidden: {},
								visible: {
									transition: { staggerChildren: 0.04, delayChildren: 0.02 },
								},
								exit: {
									transition: { staggerChildren: 0.02, staggerDirection: -1 },
								},
							}}
						>
							{visibleTemplates.map((template, index) => {
								const accentColor = getHomeStarterCardGlowAccent(template.iconSrc);

								if (template.hero) {
									return (
										<HomeStarterHeroTile
											accentColor={accentColor}
											key={template.title}
											onBlur={handleTemplateBlur}
											onClick={() => onSelect(template.prompt, buildCreationTemplateContextFromStarter(template))}
											onFocus={() => handleTemplateFocus(template.prompt)}
											onMouseEnter={() => handleTemplateMouseEnter(template.prompt)}
											onMouseLeave={handleTemplateMouseLeave}
											setTileRef={(node) => {
												tileRefs.current[index] = node;
											}}
											shouldReduceMotion={shouldReduceMotion}
											template={template as HomeStarterTemplate & { hero: HomeStarterHeroDecoration }}
										/>
									);
								}

								return (
									<motion.button
										key={template.title}
										type="button"
										aria-label={`Use prompt starter: ${template.title}`}
										onClick={() => onSelect(template.prompt)}
										onMouseEnter={() => handleTemplateMouseEnter(template.prompt)}
										onMouseLeave={handleTemplateMouseLeave}
										onFocus={() => handleTemplateFocus(template.prompt)}
										onBlur={handleTemplateBlur}
										className={cn(
											"group group/home-starter-card relative isolate flex min-h-0 flex-col items-start gap-3 overflow-hidden rounded-lg bg-background p-4 text-left outline-none transition-[background-color,box-shadow] duration-fast ease-out hover:bg-bg-neutral-subtle focus-visible:ring-3 focus-visible:ring-ring/50",
											BENTO_CAROUSEL_TILE_CLASS,
											template.layoutClassName,
										)}
										ref={(node) => {
											tileRefs.current[index] = node;
										}}
										variants={{
											hidden: { opacity: 0, y: 8, scale: 0.98 },
											visible: { opacity: 1, y: 0, scale: 1 },
											exit: { opacity: 0, y: -4, scale: 0.98 },
										}}
										transition={{ duration: 0.2, ease: [0, 0.4, 0, 1] }}
										whileHover={
											shouldReduceMotion
												? undefined
												: { y: -2, transition: { type: "spring", stiffness: 400, damping: 22 } }
										}
										whileTap={shouldReduceMotion ? undefined : { scale: 0.98, transition: { duration: 0.05 } }}
										style={getHomeStarterCardStyle(accentColor)}
									>
										<HomeStarterCardGlowLayers iconSrc={template.iconSrc} />
										<span className="relative z-[3] inline-flex size-8 shrink-0 items-center justify-center transition-opacity duration-fast ease-out group-hover:opacity-90">
											<Image
												alt=""
												aria-hidden
												className="size-8 object-contain"
												height={32}
												src={template.iconSrc}
												width={32}
											/>
										</span>
										<span className="relative z-[3] flex w-full min-w-0 flex-1 flex-col gap-1">
											<span className="block w-full min-w-0 text-sm font-semibold leading-5 text-text">
												{template.title}
											</span>
											<span
												ref={registerDescBox}
												className="block w-full min-w-0 flex-1 min-h-0 overflow-hidden"
											>
												<span className="text-sm leading-5 text-text-subtle line-clamp-2">
													{template.description}
												</span>
											</span>
										</span>
									</motion.button>
								);
							})}
						</motion.div>
					</AnimatePresence>
					<AnimatePresence initial={false}>
						{canScrollLeft ? (
							<CarouselArrow direction="previous" key="previous" label="Show previous prompt starters" onClick={() => scrollByDir(-1)} />
						) : null}
						{canScrollRight ? (
							<CarouselArrow direction="next" key="next" label="Show next prompt starters" onClick={() => scrollByDir(1)} />
						) : null}
					</AnimatePresence>
				</div>
				{canShowMore ? (
					<div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-2">
						<div
							className="group/browse-all pointer-events-auto relative flex items-center"
							onMouseEnter={() => setBrowseAllHovered(true)}
							onMouseLeave={() => setBrowseAllHovered(false)}
							onFocus={() => setBrowseAllHovered(true)}
							onBlur={(event) => {
								if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
									setBrowseAllHovered(false);
								}
							}}
						>
							<Button
								type="button"
								aria-label="Browse all agents"
								variant="ghost"
								size="compact"
								className="h-7 rounded-full border-0 bg-surface px-3 text-sm leading-5 font-normal text-text-subtle hover:bg-surface-hovered"
								style={{ boxShadow: token("elevation.shadow.overlay") }}
								onClick={() => onBrowseTemplates(activeCategory)}
							>
								Browse all
							</Button>
							{/* Absolutely positioned so "Browse all" stays centered at rest. */}
							<AnimatePresence initial={false}>
								{browseAllHovered ? (
									<>
										{/* Bridge the visual 8px gap so pointer movement from "Browse all" to
										    "Dismiss" cannot fall through and hover a bento tile behind it. */}
										<div aria-hidden className="pointer-events-auto absolute left-full top-0 h-7 w-2" />
										<motion.div
											key="dismiss"
											className="absolute left-full top-0 ml-2"
											initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
											animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
											exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: -8 }}
											transition={{ type: "spring", visualDuration: 0.25, bounce: 0.2 }}
										>
											<Button
												type="button"
												aria-label="Dismiss prompt starters"
												variant="ghost"
												size="compact"
												className="h-7 rounded-full border-0 bg-surface px-3 text-sm leading-5 font-normal text-text-subtle hover:bg-surface-hovered"
												style={{ boxShadow: token("elevation.shadow.overlay") }}
												onClick={onDismiss}
											>
												Dismiss
											</Button>
										</motion.div>
									</>
								) : null}
							</AnimatePresence>
						</div>
					</div>
				) : null}
			</div>
		</div>
	);
}

function getCssDurationTokenMs(tokenName: string, fallbackMs: number): number {
	if (typeof window === "undefined") {
		return fallbackMs;
	}

	const tokenValue = window.getComputedStyle(document.documentElement).getPropertyValue(tokenName);

	return parseCssDurationMs(tokenValue) ?? fallbackMs;
}

function mergeContextDescriptions(...parts: Array<string | null | undefined>): string | undefined {
	const mergedParts = parts.map((part) => part?.trim()).filter((part): part is string => Boolean(part));

	return mergedParts.length > 0 ? mergedParts.join("\n\n") : undefined;
}

function getNonEmptyString(value: unknown): string | null {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function normalizeStudioAgentResult(agentResult: RovoDataParts["agent-result"]): RovoAgentProfile | null {
	const id = getNonEmptyString(agentResult.agentId);
	const name = getNonEmptyString(agentResult.name);
	const summary = getNonEmptyString(agentResult.summary);
	const description = getNonEmptyString(agentResult.description) ?? summary;
	const conversationStarters = Array.isArray(agentResult.conversationStarters)
		? agentResult.conversationStarters.map((starter) => starter.trim()).filter(Boolean).slice(0, STUDIO_AGENT_MAX_CONVERSATION_STARTERS)
		: [];
	const conversationStarterIcons = Array.isArray(agentResult.conversationStarterIcons)
		? agentResult.conversationStarterIcons
		: [];

	if (!id || !name || !description || conversationStarters.length === 0) {
		return null;
	}

	const contextDescription = [
		"[Selected Studio-generated agent]",
		`Agent: ${name}`,
		"Source: /studio agent creation result",
		`Description: ${description}`,
		summary ? `Summary: ${summary}` : null,
		conversationStarters.length > 0 ? `Conversation starters: ${conversationStarters.join(" | ")}` : null,
		"Answer as this selected generated agent while using the existing Studio chat capabilities and available context.",
		"[End selected Studio-generated agent]",
	]
		.filter((line): line is string => Boolean(line))
		.join("\n");

	return {
		avatarSrc: getNonEmptyString(agentResult.avatarSrc) ?? getRandomAgentAvatarSrc(),
		byline: "Custom agent by You",
		contextDescription,
		description,
		id,
		name,
		starters: conversationStarters.map((starter, index) => ({
			icon: getStarterIcon((conversationStarterIcons[index] as StarterIconKey | undefined) ?? DEFAULT_STARTER_ICON),
			id: `${id}-starter-${index + 1}`,
			label: starter,
			prompt: starter,
			type: "prompt",
		})),
	};
}

function getStudioAgentCreationThreadTitle(thread: { title: string } | null): string {
	const title = thread?.title.trim();

	if (title && title !== "New chat") {
		return title;
	}

	return "Agent creation";
}

type StudioAgentRegistrationResult =
	| string
	| {
			id?: string | null;
	  }
	| RovoAgentProfile
	| null
	| undefined
	| void;

type StudioAgentRegistryContext = ReturnType<typeof useRovoSelectedAgent> & {
	registerCreatedAgentFromResult?: (
		agentResult: RovoDataParts["agent-result"],
		options?: { preserveCurrentThread?: boolean; select?: boolean; sourceKey?: string }
	) => RovoAgentProfile | null;
	registerAgentResult?: (agentResult: RovoDataParts["agent-result"], normalizedAgent?: RovoAgentProfile) => StudioAgentRegistrationResult;
	registerSessionAgent?: (agent: RovoAgentProfile, options?: { source?: string; result?: RovoDataParts["agent-result"] }) => StudioAgentRegistrationResult;
	selectAgent: (agentId: string, options?: { preserveCurrentThread?: boolean }) => void;
};

type StudioSubmitPromptPayload = Parameters<ReturnType<typeof useRovoApp>["submitPrompt"]>[0] & {
	creationMode?: "agent";
};

function resolveRegisteredStudioAgentId(result: StudioAgentRegistrationResult, fallbackAgentId: string): string {
	if (typeof result === "string" && result.trim().length > 0) {
		return result.trim();
	}

	if (result && typeof result === "object" && typeof result.id === "string" && result.id.trim().length > 0) {
		return result.id.trim();
	}

	return fallbackAgentId;
}

type RealtimeInjectContextPayload = {
	type: string;
	content?: string;
	role?: string;
	summary?: string;
	[key: string]: unknown;
};

type RealtimeMessageMutationResult =
	| string
	| {
			id?: string | null;
	  }
	| void;

type RovoAppRealtimeShellAdapter = ReturnType<typeof useRovoApp> & {
	appendRealtimeMessage?: (role: "user" | "assistant", content: string, options?: Record<string, unknown>) => Promise<RealtimeMessageMutationResult> | RealtimeMessageMutationResult;
	delegateToRovo?: (messageId: string, options?: Record<string, unknown>) => Promise<void>;
	setRealtimeMessageContent?: (messageId: string, content: string) => Promise<void> | void;
	submitRealtimeText?: (payload: { contextDescription?: string; hermesContext?: RovoAppHermesContext; files: FileUIPart[]; text: string }) => Promise<void>;
	updateRealtimeMessage?: (messageId: string, contentDelta: string) => Promise<void> | void;
	setVoiceMode?: (next: boolean) => void;
};

function waitForDeterministicTrace(ms: number): Promise<void> {
	return new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});
}

type ExtendedDelegationRequest = DelegationRequest & {
	delegatedMessageId?: string;
	messageId?: string;
	realtimeMessageId?: string;
};

type RealtimeSpeechTranscriptPayload =
	| string
	| {
			delta?: string;
			messageId?: string;
			text?: string;
			transcript?: string;
	  };

type RealtimeAssistantTextPayload =
	| string
	| {
			delta?: string;
			displayOnly?: boolean;
			messageId?: string;
			replace?: boolean;
			source?: "text" | "audio_transcript";
			text?: string;
	  };

type RealtimeAssistantTextCompletedPayload =
	| string
	| {
			messageId?: string;
			text?: string;
	  };

type RealtimeVoiceShellOptions = Parameters<typeof useRealtimeVoice>[0] & {
	onAssistantTextCompleted?: (payload: string | { messageId?: string; text?: string }) => void;
	onAssistantTextDelta?: (payload: string | { delta?: string; displayOnly?: boolean; messageId?: string; replace?: boolean; source?: "text" | "audio_transcript"; text?: string }) => void;
	onSpeechTranscriptCompleted?: (payload: string | { messageId?: string; transcript?: string; text?: string }) => void;
	onSpeechTranscriptDelta?: (payload: string | { delta?: string; messageId?: string; text?: string }) => void;
	onTextResponseStart?: (payload?: { messageId?: string }) => void;
};

type RealtimeVoiceShellResult = ReturnType<typeof useRealtimeVoice> & {
	connectionState?: string;
	connectionStatus?: string;
	currentAssistantMessageId?: string | null;
	currentUserMessageId?: string | null;
	isReconnecting?: boolean;
	sendTextInput?: (payload: { contextDescription?: string; messageId?: string; text: string }) => Promise<void>;
	sessionId?: string;
	sessionKey?: string;
	statusMessage?: string | null;
};

type StudioScreenAssistantToolCall = {
	args: Record<string, unknown>;
	callId: string;
	name: string;
};

type StudioScreenAssistantToolResponder = (output: unknown, createResponse?: boolean) => void;

type StudioScreenAssistantTestWindow = Window & {
	__VPK_E2E_SCREEN_ASSISTANT__?: boolean;
	__vpkStudioScreenAssistantTest?: {
		callTool: (call: { args?: Record<string, unknown>; name: string }) => Promise<unknown>;
		streamAssistantText: (chunks: string[]) => Promise<{ ok: true }>;
	};
};

type TypedScrollAnchorSource = "none" | "standard" | "realtime";

type ScrollActiveTimelineSelection = {
	latestTimelineMessageId: string | null;
	messageId: string;
	runtimeThreadId: string | null;
};

function resolveRealtimeMutationId(result: RealtimeMessageMutationResult): string | null {
	if (typeof result === "string" && result.trim()) {
		return result;
	}

	if (result && typeof result === "object" && typeof result.id === "string" && result.id.trim()) {
		return result.id;
	}

	return null;
}

function buildRealtimeThreadSummary(messages: ReadonlyArray<ReturnType<typeof useRovoApp>["messages"][number]>): string {
	const summary = messages
		.filter((message) => message.role === "user" || message.role === "assistant")
		.slice(-REALTIME_THREAD_SUMMARY_MAX_MESSAGES)
		.map((message) => {
			const text = getMessageText(message).trim();
			const artifact = getMessageArtifactResult(message);
			const fragments = [text || null, artifact ? `${artifact.action === "update" ? "Updated" : "Created"} artifact "${artifact.title}".` : null].filter((fragment): fragment is string =>
				Boolean(fragment),
			);

			if (fragments.length === 0) {
				return null;
			}

			return `${message.role}: ${fragments.join(" ")}`.trim();
		})
		.filter((line): line is string => Boolean(line))
		.join("\n");

	return summary.slice(0, 2_000);
}

function buildRealtimeArtifactContextSummary(input: {
	annotationContext: string | null;
	document: {
		id: string;
		kind: string;
		title: string;
	} | null;
}): string | null {
	if (!input.document) {
		return null;
	}

	return [`Artifact open: ${input.document.title}`, `Document ID: ${input.document.id}`, `Kind: ${input.document.kind}`, input.annotationContext ? input.annotationContext : null]
		.filter((part): part is string => Boolean(part))
		.join("\n");
}

function resolveRealtimeStatusMessage(realtime: RealtimeVoiceShellResult): string | null {
	const directStatus = typeof realtime.statusMessage === "string" && realtime.statusMessage.trim() ? realtime.statusMessage.trim() : null;
	if (directStatus) {
		return directStatus;
	}

	const connectionState =
		typeof realtime.connectionState === "string" && realtime.connectionState.trim()
			? realtime.connectionState.trim().toLowerCase()
			: typeof realtime.connectionStatus === "string" && realtime.connectionStatus.trim()
				? realtime.connectionStatus.trim().toLowerCase()
				: null;

	if (connectionState === "reconnecting" || realtime.isReconnecting) {
		return "Reconnecting voice...";
	}

	if (connectionState === "disconnected") {
		return "Voice disconnected";
	}

	return null;
}

function resolveRealtimeSessionIdentity(realtime: RealtimeVoiceShellResult, activeThreadId: string | null, runtimeThreadId: string): string | null {
	const candidates = [realtime.sessionId, realtime.sessionKey, realtime.connectionState, realtime.connectionStatus];

	const explicitIdentity = candidates.find((candidate) => {
		return typeof candidate === "string" && candidate.trim().length > 0;
	});

	if (explicitIdentity) {
		return explicitIdentity;
	}

	return realtime.voiceState !== "idle" ? `${activeThreadId ?? runtimeThreadId}:${realtime.voiceState}` : null;
}

function getViewportPointFromScreenAssistantTarget(
	target: StudioScreenAssistantTarget | null | undefined,
): { x: number; y: number; label: string; coordinateSpace: "viewport" } | null {
	if (!target?.rect) {
		return null;
	}

	return {
		x: target.rect.x + target.rect.width / 2,
		y: target.rect.y + target.rect.height / 2,
		label: target.label ?? target.fieldId ?? target.id ?? "Target",
		coordinateSpace: "viewport",
	};
}

export function RovoAppShell({ embedded = false, initialThreadId = null }: Readonly<RovoAppShellProps>) {
	const router = useRouter();
	const nav = useTopNavigation();
	const studioAgentRegistry = useRovoSelectedAgent() as StudioAgentRegistryContext;
	const { selectedAgent } = studioAgentRegistry;
	const selectedAgentContextDescription = getRovoAgentPromptContext(selectedAgent);
	const isCustomAgentSelected = !isRovoAgentProfile(selectedAgent);
	const [viewportWidthPx, setViewportWidthPx] = useState<number | null>(null);
	const [shellSize, setShellSize] = useState({ width: 0, height: 0 });
	const smartGenerationLayout = useMemo(() => {
		return getRovoAppSmartGenerationLayoutContext({
			shellWidth: shellSize.width,
			viewportWidth: viewportWidthPx,
		});
	}, [shellSize.width, viewportWidthPx]);
	const chat = useRovoApp({
		embedded,
		initialThreadId,
		smartGenerationLayout,
	});
	useHmrReloadSuppression(chat.isStreaming);
	const chatRef = useRef(chat);
	chatRef.current = chat;
	const [skillDrafts, setSkillDrafts] = useState<HermesSkillDraftSummary[]>([]);
	const [activePendingSkillDraftIndex, setActivePendingSkillDraftIndex] = useState(0);
	const [activePendingSkillDraftDetail, setActivePendingSkillDraftDetail] = useState<HermesSkillDraftDetail | null>(null);
	const [submittingSkillDraftId, setSubmittingSkillDraftId] = useState<string | null>(null);
	const [selectedHermesSkillIds, setSelectedHermesSkillIds] = useState<string[]>([]);
	const previousActiveThreadIdRef = useRef<string | null>(null);
	const activeThreadRecord = useMemo(() => chat.threads.find((thread) => thread.id === chat.activeThreadId) ?? null, [chat.activeThreadId, chat.threads]);
	const pendingThreadSkillDrafts = useMemo(() => {
		const pendingDraftIdSet = new Set(activeThreadRecord?.hermesContext?.pendingDraftIds ?? []);
		return skillDrafts.filter((draft) => draft.status === "pending" && pendingDraftIdSet.has(draft.id));
	}, [activeThreadRecord?.hermesContext?.pendingDraftIds, skillDrafts]);
	const activePendingSkillDraft = pendingThreadSkillDrafts[activePendingSkillDraftIndex] ?? pendingThreadSkillDrafts[0] ?? null;

	const hermesSurfaceMountedRef = useRef(true);
	const hermesSurfaceLastSerializedRef = useRef({ drafts: "" });
	const [hermesEmbedEnabled] = useHermesEmbedEnabled();
	const loadHermesSurfaceData = useCallback(async () => {
		// Hermes embed disabled: skip all draft fetching and clear any existing
		// surface data so no Hermes features run in the experience.
		if (!hermesEmbedEnabled) {
			hermesSurfaceLastSerializedRef.current = { drafts: "" };
			setSkillDrafts([]);
			return;
		}
		if (typeof document !== "undefined" && document.visibilityState !== "visible") {
			return;
		}
		const draftsResult = await Promise.allSettled([fetchSkillDrafts("pending")]);
		if (!hermesSurfaceMountedRef.current) {
			return;
		}

		const nextDrafts = draftsResult[0].status === "fulfilled" ? draftsResult[0].value : [];

		const draftsKey = JSON.stringify(nextDrafts);
		if (draftsKey !== hermesSurfaceLastSerializedRef.current.drafts) {
			hermesSurfaceLastSerializedRef.current.drafts = draftsKey;
			setSkillDrafts(nextDrafts);
		}
	}, [hermesEmbedEnabled]);

	useEffect(() => {
		hermesSurfaceMountedRef.current = true;
		void loadHermesSurfaceData();
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				void loadHermesSurfaceData();
			}
		};
		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			hermesSurfaceMountedRef.current = false;
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [loadHermesSurfaceData]);

	const hermesWasStreamingRef = useRef(false);
	useEffect(() => {
		if (hermesWasStreamingRef.current && !chat.isStreaming) {
			void loadHermesSurfaceData();
		}
		hermesWasStreamingRef.current = chat.isStreaming;
	}, [chat.isStreaming, loadHermesSurfaceData]);

	useEffect(() => {
		const previousThreadId = previousActiveThreadIdRef.current;
		previousActiveThreadIdRef.current = chat.activeThreadId;

		if (
			shouldResetComposerHermesSkillSelection({
				previousThreadId,
				nextThreadId: chat.activeThreadId,
			})
		) {
			setSelectedHermesSkillIds(activeThreadRecord?.hermesContext?.selectedSkillIds ?? []);
		}
	}, [activeThreadRecord?.hermesContext?.selectedSkillIds, chat.activeThreadId]);
	useEffect(() => {
		if (chat.activeThreadId && selectedHermesSkillIds.length === 0 && (activeThreadRecord?.hermesContext?.selectedSkillIds?.length ?? 0) > 0) {
			setSelectedHermesSkillIds(activeThreadRecord?.hermesContext?.selectedSkillIds ?? []);
		}
	}, [activeThreadRecord?.hermesContext?.selectedSkillIds, chat.activeThreadId, selectedHermesSkillIds.length]);
	useEffect(() => {
		if (pendingThreadSkillDrafts.length === 0) {
			setActivePendingSkillDraftIndex(0);
			setActivePendingSkillDraftDetail(null);
			return;
		}

		setActivePendingSkillDraftIndex((currentIndex) => Math.min(currentIndex, pendingThreadSkillDrafts.length - 1));
	}, [pendingThreadSkillDrafts]);

	useEffect(() => {
		if (!activePendingSkillDraft?.id) {
			setActivePendingSkillDraftDetail(null);
			return;
		}

		let cancelled = false;

		async function loadDraftDetail() {
			try {
				const detail = await fetchSkillDraftDetail(activePendingSkillDraft.id);
				if (!cancelled) {
					setActivePendingSkillDraftDetail(detail);
				}
			} catch {
				if (!cancelled) {
					setActivePendingSkillDraftDetail(null);
				}
			}
		}

		void loadDraftDetail();
		return () => {
			cancelled = true;
		};
	}, [activePendingSkillDraft?.id]);

	const clearHermesSkillSelection = useCallback(() => {
		setSelectedHermesSkillIds([]);
	}, []);

	const buildHermesPromptOptions = useCallback(
		(contextDescription?: string) => {
			const hermesContext = buildComposerHermesContext(selectedHermesSkillIds);
			const resolvedContextDescription = mergeContextDescriptions(
				contextDescription,
				selectedAgentContextDescription,
			);
			return {
				contextDescription: resolvedContextDescription,
				hermesContext,
			};
		},
		[selectedHermesSkillIds, selectedAgentContextDescription],
	);

	const [activeAgentConfig, setActiveAgentConfig] = useState<{
		profileId: string;
		sourceMessageId: string | null;
	} | null>(null);
	const activeAgentConfigRef = useRef(activeAgentConfig);
	const setActiveAgentConfigState = useCallback((nextAgentConfig: typeof activeAgentConfig) => {
		activeAgentConfigRef.current = nextAgentConfig;
		setActiveAgentConfig(nextAgentConfig);
	}, []);
	const [activeAgentConfigView, setActiveAgentConfigView] = useState<AgentConfigView>("configure");
	const [isSidebarAgentBrowserOpen, setIsSidebarAgentBrowserOpen] = useState(false);
	const [sidebarAgentBrowserInitialCategory, setSidebarAgentBrowserInitialCategory] = useState<HomeStarterCategory>(HOME_STARTER_DEFAULT_CATEGORY);
	const generatedAgentTestViewKeysRef = useLazyRef<Set<string>>(() => new Set());
	const hasSeededStudioRfpDemoAgentRef = useRef(false);
	// Bumped each time an agent is created from a generated result, so a later
	// effect (declared after the onboarding-tour hook) can kick off the tour
	// without the earlier create handler needing the tour controller in scope.
	const [agentCreationTourSignal, setAgentCreationTourSignal] = useState(0);
	const openAgentCreationAskRovoChat = useCallback(() => {
		// Keep the Ask Rovo panel on the default Rovo build helper.
		studioAgentRegistry.resetAgentToRovo({ preserveCurrentThread: true });
		// The studio shell runs generation through its own `useRovoApp` chat
		// store, which is SEPARATE from the RovoChatProvider context the Ask Rovo
		// sidebar reads. Without bridging, the sidebar sees an empty thread and
		// falls back to the "Improve your agent?" greeting. Adopt the generation
		// thread (its id + in-memory transcript) into the context so the sidebar
		// shows the same conversation used to build the agent — matching what a
		// page reload does, but without overwriting whatever Ask Rovo thread was
		// previously active or creating a duplicate thread.
		const generationThreadId = chatRef.current?.activeThreadId ?? null;
		const generationMessages = chatRef.current?.messages;
		if (generationThreadId && generationMessages && generationMessages.length > 0) {
			studioAgentRegistry.adoptThreadMessages(generationThreadId, generationMessages);
		}
		nav.openChat("sidebar");
	}, [nav, studioAgentRegistry]);

	useEffect(() => {
		if (
			embedded ||
			initialThreadId ||
			hasSeededStudioRfpDemoAgentRef.current ||
			typeof studioAgentRegistry.registerCreatedAgentFromResult !== "function"
		) {
			return;
		}

		if (typeof window !== "undefined" && new URLSearchParams(window.location.search).has("agent")) {
			return;
		}

		const existingEntry = studioAgentRegistry.getSessionAgentEntry?.(STUDIO_RFP_DEMO_AGENT_PROFILE_ID);
		const persistedRecord = readSessionAgentRecords().find(
			(record) => record.profileId === STUDIO_RFP_DEMO_AGENT_PROFILE_ID,
		);

		// A hydrated entry or persisted record whose resultKey predates the current
		// seed version carries the OLD instruction body (before apps/skills were woven
		// in as inline mention chips). resultKey is `${sourceKey}:…`, so a bump of
		// STUDIO_RFP_DEMO_AGENT_SOURCE_KEY marks every prior copy stale — re-seed it so
		// returning users pick up the new lozenge-rich instructions instead of keeping
		// their localStorage copy.
		const seedVersionPrefix = `${STUDIO_RFP_DEMO_AGENT_SOURCE_KEY}:`;
		const persistedResultKey = existingEntry?.resultKey ?? persistedRecord?.resultKey;
		const hasStaleSeed =
			typeof persistedResultKey === "string" && !persistedResultKey.startsWith(seedVersionPrefix);

		// An up-to-date persisted record not yet hydrated into an entry: leave it for
		// the rehydration effect to surface, and don't reseed.
		if (!existingEntry && persistedRecord && !hasStaleSeed) {
			return;
		}

		hasSeededStudioRfpDemoAgentRef.current = true;

		// Drop a stale hydrated entry first so the re-register replaces it instead of
		// adding a second entry with the same profileId. removeSessionAgent updates the
		// entries ref synchronously, so the register below sees the cleared state.
		if (hasStaleSeed && existingEntry) {
			studioAgentRegistry.removeSessionAgent?.(STUDIO_RFP_DEMO_AGENT_PROFILE_ID);
		}

		const reuseExistingProfile = hasStaleSeed ? undefined : existingEntry?.profile;
		const registeredProfile = reuseExistingProfile
			?? studioAgentRegistry.registerCreatedAgentFromResult(STUDIO_RFP_DEMO_AGENT_RESULT, {
				preserveCurrentThread: true,
				select: false,
				sourceKey: STUDIO_RFP_DEMO_AGENT_SOURCE_KEY,
			});
		const profileId = registeredProfile?.id ?? existingEntry?.profile.id;
		if (!profileId) {
			return;
		}

		const seededEntry = studioAgentRegistry.getSessionAgentEntry?.(profileId);
		if (seededEntry && seededEntry.publishedVersion === 0 && !seededEntry.publishedResult) {
			studioAgentRegistry.commitSessionAgentPublishReady?.(profileId);
			studioAgentRegistry.publishSessionAgent?.(profileId);
		}
	}, [embedded, initialThreadId, studioAgentRegistry]);

	const handleStudioAgentResultSelect = useCallback(
		(rawAgentResult: RovoDataParts["agent-result"], options?: { sourceMessageId?: string; sourceKey?: string }): boolean => {
			// Repair catalog references on every generated result at this single ingest
			// boundary (create AND any future update path), so hallucinated ids are
			// fuzzy-repaired, @[category:id] tokens resolved, and body lozenges unioned
			// into the config arrays. Idempotent — the context-side create path repairs
			// too, but applying here also covers non-create results. User panel edits go
			// through updateSessionAgentDraft and are intentionally NOT repaired here.
			// Deterministically enrich a template-based result from its originating
			// template BEFORE repair, so an agent created from a template always looks
			// rich (chipped body + bound skills/apps/knowledge/subagents + triggers)
			// even when the model returns a thin profile. Fill-when-empty + chip-less-
			// body-only replacement; a no-op for from-scratch (non-matching) results.
			const templateEnriched = applyTemplateDefaultsToResult(rawAgentResult);
			const repaired = {
				...templateEnriched,
				...repairGeneratedAgentCatalog(templateEnriched),
			};
			// Hydrate generated trigger strings (e.g. "A Jira issue is blocked",
			// "every day at 7am") into automation rules so the config panel shows
			// automation chips with nested provider-icon event triggers instead of
			// plain labels. Maps each string to its provider; only when no rules exist.
			const triggerStrings = Array.isArray(repaired.triggers) && repaired.triggers.length > 0
				? repaired.triggers
				: repaired.trigger
					? [repaired.trigger]
					: [];
			const templateForTriggers = resolveTemplateConfigForResult(repaired);
			const inferredAutomationRules = !repaired.automationRules || repaired.automationRules.length === 0
				? inferAutomationRules(triggerStrings, {
						automationName: templateForTriggers?.triggerAutomationName,
						prompt: templateForTriggers?.triggerPrompt,
					})
				: undefined;
			// Pre-fill the shared automation prompt + name (the "Agent Instructions" /
			// "Automation name" fields in the trigger dialog) from the originating
			// template, so a template-based agent's automation isn't a blank form.
			const agentResult = inferredAutomationRules
				? { ...repaired, automationRules: inferredAutomationRules }
				: repaired;
			const normalizedAgent = normalizeStudioAgentResult(agentResult);
			if (!normalizedAgent) {
				return false;
			}

			const sourceKey = options?.sourceKey
				?? (options?.sourceMessageId
					? `studio-agent-result:${chat.activeThreadId ?? chat.runtimeThreadId}:${options.sourceMessageId}:${agentResult.agentId}`
					: undefined);

			if (typeof studioAgentRegistry.registerCreatedAgentFromResult === "function") {
				const registered = studioAgentRegistry.registerCreatedAgentFromResult(agentResult, {
					preserveCurrentThread: true,
					select: true,
					sourceKey,
				});
				if (!registered) {
					return false;
				}
				setActiveAgentConfigState({
					profileId: registered.id,
					sourceMessageId: options?.sourceMessageId ?? null,
				});
				setActiveAgentConfigView("test");
				openAgentCreationAskRovoChat();
				setAgentCreationTourSignal((signal) => signal + 1);
				return true;
			}

			// Fallback integration point for older Worker C drafts: use session-agent
			// registration plus preserve-current-thread selection when available.
			let didRegisterAgent = false;
			let registrationResult: StudioAgentRegistrationResult = null;
			if (typeof studioAgentRegistry.registerAgentResult === "function") {
				didRegisterAgent = true;
				registrationResult = studioAgentRegistry.registerAgentResult(agentResult, normalizedAgent);
			} else if (typeof studioAgentRegistry.registerSessionAgent === "function") {
				didRegisterAgent = true;
				registrationResult = studioAgentRegistry.registerSessionAgent(normalizedAgent, {
					result: agentResult,
					source: "/studio",
				});
			}

			if (!didRegisterAgent) {
				return false;
			}

			const agentId = resolveRegisteredStudioAgentId(registrationResult, normalizedAgent.id);
			studioAgentRegistry.selectAgent(agentId, { preserveCurrentThread: true });
			setActiveAgentConfigState({
				profileId: agentId,
				sourceMessageId: options?.sourceMessageId ?? null,
			});
			setActiveAgentConfigView("test");
			openAgentCreationAskRovoChat();
			setAgentCreationTourSignal((signal) => signal + 1);
			return true;
		},
		[chat.activeThreadId, chat.runtimeThreadId, openAgentCreationAskRovoChat, setActiveAgentConfigState, studioAgentRegistry],
	);

	// "Start from scratch" — create a fresh, untitled session agent (no AI result
	// to derive from) and open the blank config pane on it. We register a minimal
	// create-payload directly via the registry because the normal agent-result path
	// (`normalizeStudioAgentResult`) requires a name, description, and conversation
	// starters, none of which exist for a from-scratch agent.
	const handleStartAgentFromScratch = useCallback(() => {
		if (typeof studioAgentRegistry.registerCreatedAgentFromResult !== "function") {
			return;
		}

		const uniqueSuffix = `${Date.now()}`;
		const blankAgentResult: RovoDataParts["agent-result"] = {
			action: "create",
			agentId: `untitled-agent-${uniqueSuffix}`,
			avatarSrc: getRandomAgentAvatarSrc(),
			name: "",
			summary: "",
		};

		const registered = studioAgentRegistry.registerCreatedAgentFromResult(blankAgentResult, {
			preserveCurrentThread: true,
			select: true,
			// A from-scratch agent has no name/content yet, so suppress the
			// "Saving…/Saved" indicator — there is nothing meaningful to save.
			silentSave: true,
			sourceKey: `studio-start-from-scratch:${uniqueSuffix}`,
		});
		if (!registered) {
			return;
		}

		setActiveAgentConfigState({
			profileId: registered.id,
			sourceMessageId: null,
		});
		setActiveAgentConfigView("configure");
		openAgentCreationAskRovoChat();
	}, [openAgentCreationAskRovoChat, setActiveAgentConfigState, studioAgentRegistry]);

	const handleStudioSidebarAgentSelect = useCallback(
		(agentId: string) => {
			// Open the agent for editing WITHOUT pointing chat at the custom
			// agent. The right-hand "Ask Rovo" panel must stay on the default Rovo
			// build helper (with the "Edit: <agent>" bar), exactly like the
			// create-from-scratch path. Selecting the custom agent here is what
			// caused the panel to "swap" onto the custom agent on the second
			// click. `activeAgentConfig` drives both the config pane and `?agent=`.
			setActiveAgentConfigState({
				profileId: agentId,
				sourceMessageId: null,
			});
			setActiveAgentConfigView("configure");
		},
		[setActiveAgentConfigState],
	);

	const handleDeleteStudioAgent = useCallback(
		(agentId: string) => {
			// Close the config pane first so its draft editor cannot re-save a
			// session agent after the registry entry is removed.
			if (activeAgentConfig?.profileId === agentId) {
				setActiveAgentConfigState(null);
			}
			startTransition(() => {
				studioAgentRegistry.removeSessionAgent(agentId);
			});
		},
		[activeAgentConfig?.profileId, setActiveAgentConfigState, studioAgentRegistry],
	);

	// Returns to the "Agents" landing (bento). Shared by the sidebar's "Agents"
	// header (when it has no recent agents to expand) and the "View all agents"
	// row. Must clear all three view-model layers: the agent-config pane
	// (activeAgentConfig), the selected custom agent (resetAgentToRovo flips
	// isCustomAgentSelected), and the chat thread (openNewChat). Without the first
	// two, openNewChat alone leaves the custom-agent screen open.
	const handleReturnToAgentsHome = useCallback(() => {
		setOptimisticUserMessage(null);
		setActiveAgentConfigState(null);
		setActiveAgentConfigView("configure");
		studioAgentRegistry.resetAgentToRovo();
		startTransition(() => {
			void chat.openNewChat();
		});
	}, [chat, setActiveAgentConfigState, studioAgentRegistry]);

	const handleSidebarBrowseAgentSelect = useCallback(
		(agent: { id: string }) => {
			if (studioAgentRegistry.getSessionAgentEntry?.(agent.id)) {
				// Editable custom agent: open the config pane and keep the
				// Ask Rovo build helper (do NOT select it for chat), matching the
				// create + sidebar-select paths so nothing "swaps" on re-entry.
				setActiveAgentConfigState({
					profileId: agent.id,
					sourceMessageId: null,
				});
				setActiveAgentConfigView("configure");
			} else {
				// Non-editable (built-in/published) agent: there is no config pane
				// to edit, so this is a genuine "chat with this agent" action.
				studioAgentRegistry.selectAgent(agent.id, { preserveCurrentThread: true });
				setActiveAgentConfigState(null);
				setActiveAgentConfigView("configure");
			}
			setIsSidebarAgentBrowserOpen(false);
		},
		[setActiveAgentConfigState, studioAgentRegistry],
	);

	const handleUpdateAgentDraft = useCallback(
		(profileId: string, patch: Partial<RovoDataParts["agent-result"]>) => {
			studioAgentRegistry.updateSessionAgentDraft?.(profileId, patch);
		},
		[studioAgentRegistry],
	);

	const handleCommitAgentPublishReady = useCallback(
		(profileId: string) => {
			studioAgentRegistry.commitSessionAgentPublishReady?.(profileId);
		},
		[studioAgentRegistry],
	);

	const handleTestAgent = useCallback(
		(profileId: string) => {
			studioAgentRegistry.commitSessionAgentPublishReady?.(profileId);
			setActiveAgentConfigView("test");
		},
		[studioAgentRegistry],
	);

	const handleAgentConfigViewChange = useCallback(
		(view: AgentConfigView) => {
			setActiveAgentConfigView(view);
		},
		[],
	);

	// Restore (or clear) the agent config pane when the active agent is
	// reconciled *from the URL* — deep link, reload, or browser back/forward.
	// In-page selection sets `activeAgentConfig` in its own handler; this covers
	// the URL-seed path, which otherwise only re-selects the agent for chat and
	// would leave the studio on the agent's chat surface with no config pane.
	const handleAgentRestoredFromUrl = useCallback((agentId: string | null) => {
		if (activeAgentConfigRef.current?.profileId !== agentId) {
			setActiveAgentConfigView("configure");
		}
		setActiveAgentConfigState(agentId ? { profileId: agentId, sourceMessageId: null } : null);
	}, [setActiveAgentConfigState]);

	// Mirror the agent being EDITED (the open config pane / `activeAgentConfig`)
	// into the URL (`?agent=`) so it is deep-linkable, survives reload, and works
	// with browser back/forward. This intentionally tracks the edited agent, not
	// the chat-selected agent: the Ask Rovo panel stays on the default Rovo build
	// helper while editing, so URL identity must follow the config pane.
	// `onAgentRestoredFromUrl` re-opens the config pane for the URL-restored agent.
	const selectableAgentIds = useMemo(
		() => studioAgentRegistry.selectableAgents.map((agent) => agent.id),
		[studioAgentRegistry.selectableAgents],
	);
	useAgentUrlSync({
		enabled: !embedded,
		editingAgentId: activeAgentConfig?.profileId ?? null,
		selectableAgentIds,
		onAgentRestored: handleAgentRestoredFromUrl,
	});

	const handlePublishAgent = useCallback(
		(profileId: string) => {
			studioAgentRegistry.publishSessionAgent?.(profileId);
		},
		[studioAgentRegistry],
	);

	const activeSessionAgentEntry = useMemo(() => {
		if (!activeAgentConfig) {
			return null;
		}
		const entries = studioAgentRegistry.sessionAgentEntries;
		if (!Array.isArray(entries)) {
			return null;
		}
		return entries.find((entry) => entry.profile.id === activeAgentConfig.profileId) ?? null;
	}, [activeAgentConfig, studioAgentRegistry.sessionAgentEntries]);
	const shouldShowAgentConfigPane = Boolean(activeSessionAgentEntry);
	// Drives the "Edit agent" context bar above the studio sidebar-chat input.
	// Defaults to the expanded "Edit: <agent>" state; the bar itself owns the
	// collapse-to-pill / re-expand affordance.
	const agentEditContextBar = useMemo<ChatContextBarDescriptor | null>(() => {
		if (!activeSessionAgentEntry || isCustomAgentSelected) {
			return null;
		}
		const { profile } = activeSessionAgentEntry;
		const agentName = getStudioSessionAgentDisplayName(activeSessionAgentEntry);
		return {
			iconName: "agent",
			label: agentName,
			avatarSrc: profile.avatarSrc,
			signature: `studio-edit-agent:${profile.id}`,
			variant: "edit",
			collapsible: true,
			collapsedLabel: "Edit agent",
		};
	}, [activeSessionAgentEntry, isCustomAgentSelected]);
	// When the "Edit agent" context bar is active, the Ask Rovo empty state pivots
	// to an agent-improvement greeting; closing the bar reverts to the default.
	const agentEditGreeting = useMemo<ChatPanelGreetingProps | undefined>(() => {
		if (!agentEditContextBar) {
			return undefined;
		}
		return {
			heading: AGENT_EDIT_GREETING_HEADING,
			illustrationSrc: AGENT_EDIT_GREETING_ILLUSTRATION_SRC,
			illustrationDarkSrc: AGENT_EDIT_GREETING_ILLUSTRATION_DARK_SRC,
			suggestions: agentEditSuggestions,
		};
	}, [agentEditContextBar]);
	// The Ask Rovo edit panel always talks to the default Rovo agent (it's a
	// build/improve helper), so it renders as a plain default-Rovo chat without
	// the custom-agent Chat / Trigger / Activity tab header. Those tabs belong to
	// the left-hand Test panel, which is the surface scoped to the custom agent.
	const askRovoChatResize = useStudioAskRovoChatResize({
		defaultWidth: 400,
		minWidth: 320,
		maxWidth: 720,
		direction: "rtl",
	});
	const askRovoChatPanelWidth = askRovoChatResize.sidebarWidth;
	const isStudioAskRovoChatActive = !embedded && shouldShowAgentConfigPane && nav.isSidebarChatOpen;
	// "Ask Rovo" must always talk to the default Rovo agent, not the custom agent
	// being edited in the config pane. Point the selected agent back to Rovo when
	// the chat is being opened, but preserve the current thread so a generation
	// transcript (or in-progress edit conversation) stays visible on reopen.
	const handleToggleAskRovoChat = useCallback(() => {
		if (!nav.isSidebarChatOpen) {
			studioAgentRegistry.resetAgentToRovo({ preserveCurrentThread: true });
		}
		nav.toggleChat();
	}, [nav, studioAgentRegistry]);
	// When the active agent disappears (e.g. provider remounts), clear the
	// config pane so we don't keep a stale reference around.
	useEffect(() => {
		if (activeAgentConfig && !activeSessionAgentEntry) {
			if (studioAgentRegistry.getSessionAgentEntry?.(activeAgentConfig.profileId)) {
				return;
			}

			setActiveAgentConfigState(null);
			setActiveAgentConfigView("configure");
		}
	}, [activeAgentConfig, activeSessionAgentEntry, setActiveAgentConfigState, studioAgentRegistry]);

	useEffect(() => {
		if (!activeAgentConfig || !activeSessionAgentEntry) {
			return;
		}

		for (const message of chat.messages.toReversed()) {
			const agentResult = getMessageAgentResult(message);
			if (!isGeneratedAgentResult(agentResult) || !hasTurnCompleteSignal(message)) {
				continue;
			}

			const isActiveGeneratedAgent =
				message.id === activeAgentConfig.sourceMessageId ||
				agentResult.agentId === activeSessionAgentEntry.sourceResult.agentId ||
				agentResult.agentId === activeSessionAgentEntry.draftResult.agentId ||
				agentResult.agentId === activeSessionAgentEntry.publishReadyResult.agentId;

			if (isActiveGeneratedAgent) {
				const agentResultKey = `${chat.runtimeThreadId}:${message.id}:${agentResult.agentId}:${agentResult.action}`;
				if (generatedAgentTestViewKeysRef.current.has(agentResultKey)) {
					break;
				}

				// Record the key as soon as the completed result is observed —
				// even when we're already in Test because a registration path
				// (handleRegisterAgent) or the Test toggle put us there. Only the
				// view-switch below is gated on "not already in test"; the key
				// itself must always be marked seen. Otherwise the first time the
				// user leaves Test this effect re-runs, finds the key unseen, and
				// yanks them back into Test — remounting the chat and replaying the
				// greeting (the "two clicks to leave Test" bug).
				generatedAgentTestViewKeysRef.current.add(agentResultKey);
				if (activeAgentConfigView !== "test") {
					setActiveAgentConfigView("test");
					openAgentCreationAskRovoChat();
				}
				break;
			}
		}
		}, [activeAgentConfig, activeAgentConfigView, activeSessionAgentEntry, chat.messages, chat.runtimeThreadId, generatedAgentTestViewKeysRef, openAgentCreationAskRovoChat]);

	// Bridge the global sidebar context (TopNavigation toggle) with the local
	// shadcn SidebarProvider so the nav bar button controls the thread sidebar.
	const globalSidebar = useGlobalSidebar();
	const globalSidebarVisibleRef = useRef(globalSidebar.isVisible);

	useEffect(() => {
		if (globalSidebar.isVisible !== globalSidebarVisibleRef.current) {
			globalSidebarVisibleRef.current = globalSidebar.isVisible;
			chat.setSidebarOpen(globalSidebar.isVisible);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- only react to global sidebar changes
	}, [globalSidebar.isVisible]);

	useEffect(() => {
		if (chat.sidebarOpen !== globalSidebarVisibleRef.current) {
			globalSidebarVisibleRef.current = chat.sidebarOpen;
			globalSidebar.setSidebarVisible(chat.sidebarOpen);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- only react to local sidebar changes
	}, [chat.sidebarOpen]);

	// Hover-reveal: show sidebar temporarily when hovering the toggle button.
	// Uses a debounced timer so the sidebar stays visible while the mouse
	// transitions from the toggle button to the sidebar content area.
	const [hoverRevealActive, setHoverRevealActive] = useState(false);
	const hoverLeaveTimerRef = useRef<number | null>(null);

	const clearHoverTimer = useCallback(() => {
		if (hoverLeaveTimerRef.current) {
			window.clearTimeout(hoverLeaveTimerRef.current);
			hoverLeaveTimerRef.current = null;
		}
	}, []);

	const scheduleSidebarHoverClose = useCallback(() => {
		clearHoverTimer();
		hoverLeaveTimerRef.current = window.setTimeout(
			() => {
				setHoverRevealActive(false);
			},
			getCssDurationTokenMs(ROVO_APP_SIDEBAR_MOTION_DURATION, ROVO_APP_SIDEBAR_MOTION_FALLBACK_MS),
		);
	}, [clearHoverTimer]);

	const handleSidebarHoverEnter = useCallback(() => {
		clearHoverTimer();
		setHoverRevealActive(true);
	}, [clearHoverTimer]);

	const handleSidebarHoverLeave = useCallback(() => {
		scheduleSidebarHoverClose();
	}, [scheduleSidebarHoverClose]);

	const handleSidebarContentMouseEnter = useCallback(() => {
		clearHoverTimer();
	}, [clearHoverTimer]);

	const handleSidebarContentMouseLeave = useCallback(() => {
		scheduleSidebarHoverClose();
	}, [scheduleSidebarHoverClose]);

	useEffect(() => {
		return () => clearHoverTimer();
	}, [clearHoverTimer]);

	// ⌘⇧O — create a new chat
	useEffect(() => {
		const handleNewChatShortcut = (e: KeyboardEvent) => {
			if (e.metaKey && e.shiftKey && e.key.toLowerCase() === "o") {
				e.preventDefault();
				chatRef.current.openNewChat();
			}
		};

		document.addEventListener("keydown", handleNewChatShortcut);
		return () => document.removeEventListener("keydown", handleNewChatShortcut);
	}, []);

	const isHoverOpen = hoverRevealActive && !chat.sidebarOpen;

	const artifactContentRef = useRef<HTMLDivElement | null>(null);
	const annotationContextRef = useRef<string | null>(null);
	const realtimeInjectContextRef = useRef<((payload: RealtimeInjectContextPayload) => void) | null>(null);
	const composerTextRef = useRef("");
	const dictationBaselineRef = useRef<string | null>(null);
	const dictationCommittedTextRef = useRef<string | null>(null);
	const isDictationActiveRef = useRef(false);
	const sidebarResize = useSidebarResize({
		defaultWidth: ROVO_APP_SIDEBAR_DEFAULT_WIDTH,
		minWidth: ROVO_APP_SIDEBAR_MIN_WIDTH,
		maxWidth: ROVO_APP_SIDEBAR_MAX_WIDTH,
		onCollapse: useCallback(() => {
			chat.setSidebarOpen(false);
		}, [chat]),
	});
	const rovoAppSidebarStyle = {
		"--sidebar-width": `${sidebarResize.sidebarWidth}px`,
	} as CSSProperties;
	const headerHeightStyle: CSSProperties = {
		height: `${TOP_NAV_HEADER_HEIGHT_PX}px`,
	};
	// Gate the persistent chrome's width/border transition so it never plays on
	// first paint. The chrome renders at its final geometry during hydration,
	// but a post-mount state settle (the global-sidebar bridge syncing
	// sidebarOpen, or a responsive width pass) would otherwise trigger the
	// transition-[width,border-color] animation on every refresh — the chrome
	// visibly slides into place. Flipping the flag a frame after mount lets that
	// initial settle apply instantly; only user-driven toggles after load animate.
	const [hasMountedChrome, setHasMountedChrome] = useState(false);
	useEffect(() => {
		const frame = requestAnimationFrame(() => setHasMountedChrome(true));
		return () => cancelAnimationFrame(frame);
	}, []);
	const [cursorMode, setCursorMode] = useState(false);
	const [galleryExpanded, setGalleryExpanded] = useState(false);
	const [agentTemplatesDialogOpen, setAgentTemplatesDialogOpen] = useState(false);
	const [agentTemplatesInitialCategory, setAgentTemplatesInitialCategory] = useState<HomeStarterCategory>(HOME_STARTER_DEFAULT_CATEGORY);
	const [composerFocusRequestKey, setComposerFocusRequestKey] = useState(0);
	const [previewPrompt, setPreviewPrompt] = useState<string | null>(null);
	const [prefillText, setPrefillText] = useState<string | null>(null);
	const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
	const [isDictationActive, setIsDictationActive] = useState(false);
	const [dictationTranscriptPreview, setDictationTranscriptPreview] = useState<string | null>(null);
	const [scrollActiveTimelineSelection, setScrollActiveTimelineSelection] = useState<ScrollActiveTimelineSelection | null>(null);
	const [scrollAnchorMessageId, setScrollAnchorMessageId] = useState<string | null>(null);
	const [scrollFollowMode, setScrollFollowMode] = useState<ConversationFollowMode>("bottom");
	const [optimisticUserMessage, setOptimisticUserMessage] = useState<ReturnType<typeof createRovoAppUserMessage> | null>(null);
	const [isDefaultHomeSubmitTransition, setIsDefaultHomeSubmitTransition] = useState(false);
	const [dismissedBrowserArtifactKey, setDismissedBrowserArtifactKey] = useState<string | null>(null);
	const realtimeUserMessageIdRef = useRef<string | null>(null);
	const realtimeAssistantMessageIdRef = useRef<string | null>(null);
	const realtimeAssistantMessagePromiseRef = useRef<Promise<string | null> | null>(null);
	const realtimeUserTranscriptHasDeltaRef = useRef(false);
	const manualVoiceStopRef = useRef(false);
	const injectedRealtimeThreadContextKeyRef = useRef<string | null>(null);
	const injectedRealtimeArtifactContextKeyRef = useRef<string | null>(null);
	const pendingTypedScrollAnchorRef = useRef(false);
	const isDefaultAgentHomeStateRef = useRef(false);
	const studioAgentCreationThreadKeysRef = useLazyRef<Set<string>>(() => new Set());
	const studioAgentCreationThreadTouchedAtRef = useLazyRef<Map<string, number>>(() => new Map());
	const [studioAgentCreationThreadIds, setStudioAgentCreationThreadIds] = useState<ReadonlySet<string>>(() => new Set());
	const studioAgentCreationThreads = useMemo(() => {
		return Array.from(studioAgentCreationThreadIds).map((threadId) => {
			const thread = chat.threads.find((currentThread) => currentThread.id === threadId) ?? null;
			// Prefer the live message list for the active thread (freshest); fall
			// back to a background thread's persisted messages. A pending question
			// card means that creation thread is paused awaiting the user's answers.
			const threadMessages = threadId === chat.activeThreadId ? chat.messages : (thread?.messages ?? []);
			return {
				id: threadId,
				lastTouchedAt: studioAgentCreationThreadTouchedAtRef.current.get(threadId) ?? 0,
				title: getStudioAgentCreationThreadTitle(thread),
				isAwaitingResponse: Boolean(getLatestQuestionCardPayload(threadMessages)),
			};
		});
		}, [chat.activeThreadId, chat.messages, chat.threads, studioAgentCreationThreadIds, studioAgentCreationThreadTouchedAtRef]);
	const studioAutomationGeneratingAgents = useMemo(() => (
		getStudioAutomationGeneratingAgents(chat.messages)
	), [chat.messages]);
	const handledAgentResultKeysRef = useLazyRef<Set<string>>(() => new Set());
	const previousTypedAnchorUserMessageIdRef = useRef<string | null>(null);
	const typedScrollAnchorSourceRef = useRef<TypedScrollAnchorSource>("none");
	const realtimeTypedResponseStartedRef = useRef(false);
	const speechStartedAtRef = useRef<string | null>(null);

	const markStudioAgentCreationThread = useCallback((threadId: string | null) => {
		if (!threadId) {
			return;
		}

		studioAgentCreationThreadKeysRef.current.add(threadId);
		studioAgentCreationThreadTouchedAtRef.current.set(threadId, Date.now());
		setStudioAgentCreationThreadIds((currentThreadIds) => {
			const nextThreadIds = new Set(currentThreadIds);
			nextThreadIds.add(threadId);
			return nextThreadIds;
		});
		}, [studioAgentCreationThreadKeysRef, studioAgentCreationThreadTouchedAtRef]);

	const unmarkStudioAgentCreationThread = useCallback((threadId: string | null) => {
		if (!threadId) {
			return;
		}

		studioAgentCreationThreadKeysRef.current.delete(threadId);
		studioAgentCreationThreadTouchedAtRef.current.delete(threadId);
		setStudioAgentCreationThreadIds((currentThreadIds) => {
			if (!currentThreadIds.has(threadId)) {
				return currentThreadIds;
			}

			const nextThreadIds = new Set(currentThreadIds);
			nextThreadIds.delete(threadId);
			return nextThreadIds;
		});
		}, [studioAgentCreationThreadKeysRef, studioAgentCreationThreadTouchedAtRef]);

	// Provenance of the template a user started agent creation from. The ref holds
	// the pending selection (set when a template/bento card is chosen, consumed +
	// cleared on submit); the per-thread map keeps it available for the
	// clarification continuation rounds on that creation thread.
	const creationTemplateRef = useRef<StudioCreationTemplateContext | null>(null);
	const creationTemplateByThreadRef = useRef<Record<string, StudioCreationTemplateContext>>({});

	const handleGalleryPreviewStart = useCallback((prompt: string) => {
		setPreviewPrompt(prompt);
	}, []);

	const handleGalleryPreviewEnd = useCallback(() => {
		setPreviewPrompt(null);
	}, []);

	const handleGallerySelect = useCallback((prompt: string, template?: StudioCreationTemplateContext) => {
		setPrefillText(prompt);
		setPreviewPrompt(null);
		creationTemplateRef.current = template ?? null;
		// Refocus the composer caret so the user can immediately hit Enter to submit.
		setComposerFocusRequestKey((currentKey) => currentKey + 1);
	}, []);

	const handleBrowseAgentTemplates = useCallback((category: HomeStarterCategory = HOME_STARTER_DEFAULT_CATEGORY) => {
		setAgentTemplatesInitialCategory(category);
		setAgentTemplatesDialogOpen(true);
	}, []);

	// The home bento's "Browse all" pill opens the full Agent Directory instead
	// of the lighter templates dialog. The bento auto-cycles its category, but we
	// always land the directory on the first template tab ("Planning") for a
	// predictable entry point, so the cycling tab is intentionally ignored.
	const handleBrowseAgentsDirectory = useCallback(() => {
		setSidebarAgentBrowserInitialCategory(AGENT_TEMPLATES_CATEGORIES[0].id);
		setIsSidebarAgentBrowserOpen(true);
	}, []);

	// The empty-instructions "start with a template" link opens the same agents
	// directory as "Browse all", landing on the first template tab.
	const handleStartAgentWithTemplate = handleBrowseAgentsDirectory;

	const handleTemplateAgentSelect = useCallback((agent: AgentTemplatesAgent) => {
		handleGallerySelect(
			agent.templatePrompt ?? buildFallbackTemplatePrompt(agent),
			buildCreationTemplateContextFromAgent(agent),
		);
		setAgentTemplatesDialogOpen(false);
		setIsSidebarAgentBrowserOpen(false);
	}, [handleGallerySelect]);

	const handleBuildTemplateAgent = useCallback((agent: AgentTemplatesAgent, options: AgentsDirectoryTemplateBuildOptions) => {
		if (typeof studioAgentRegistry.registerCreatedAgentFromResult !== "function") {
			return null;
		}

		const agentResult = buildTemplateAgentResultFromAgent(agent, {
			appIds: options.connectApps ? options.appIds : [],
		});
		const registered = studioAgentRegistry.registerCreatedAgentFromResult(agentResult, {
			preserveCurrentThread: true,
			select: true,
			sourceKey: `studio-template-setup:${agent.id}:${Date.now()}`,
		});

		return registered
			? {
					profileId: registered.id,
					onCancel: () => studioAgentRegistry.removeSessionAgent(registered.id),
				}
			: null;
	}, [studioAgentRegistry]);

	const handleOpenBuiltTemplateAgentConfig = useCallback((profileId: string) => {
		setActiveAgentConfigState({
			profileId,
			sourceMessageId: null,
		});
		setActiveAgentConfigView("configure");
		setIsSidebarAgentBrowserOpen(false);
	}, [setActiveAgentConfigState]);

	const handleFocusStudioComposer = useCallback(() => {
		setComposerFocusRequestKey((currentKey) => currentKey + 1);
	}, []);

	const handleRovoAppSuggestionSelect = useCallback(
		async (prompt: string) => {
			const contextDescription = annotationContextRef.current ?? undefined;
			try {
				await chat.submitPrompt({
					...buildHermesPromptOptions(contextDescription),
					files: [],
					text: prompt,
				});
			} catch {
				// submitPrompt already sets a user-visible error state.
			}
		},
		[buildHermesPromptOptions, chat],
	);

	// Question card / clarification support
	const activeQuestionCard = useMemo(() => getLatestQuestionCardPayload(chat.messages), [chat.messages]);
	const hasPersistedAgentCreationPrompt = useMemo(
		() => chat.messages.some((message) => message.metadata?.creationMode === "agent"),
		[chat.messages],
	);
	const { acceptPlanReview, submitClarification } = chat;
	// True when the active thread is a Studio agent-creation flow (model creation
	// card, persisted creation prompt, or a thread we tagged as creation). Computed
	// inline (not memoized) so it always reflects the live mutable refs — a memo
	// keyed on thread ids alone would read a stale snapshot if the ref is mutated
	// without a dep change.
	const isStudioAgentCreationThread =
		activeQuestionCard?.creationMode === "agent" ||
		hasPersistedAgentCreationPrompt ||
		studioAgentCreationThreadKeysRef.current.has(chat.runtimeThreadId) ||
		(chat.activeThreadId
			? studioAgentCreationThreadKeysRef.current.has(chat.activeThreadId)
			: false);
	// The template (if any) bound to this creation thread. Templates derive their
	// catalog scope from their bound ids and skip the domain-scope question;
	// free-text creation injects it instead. Read live for the same reason.
	const studioCreationTemplate =
		creationTemplateByThreadRef.current[chat.runtimeThreadId] ??
		(chat.activeThreadId ? creationTemplateByThreadRef.current[chat.activeThreadId] : undefined);
	// Free-text creation cards get a deterministic 10-category domain question
	// prepended so the user's pick scopes the generation catalog. Rendered only;
	// the base `activeQuestionCard` is what we submit to the model tool contract.
	const renderedQuestionCard =
		activeQuestionCard && isStudioAgentCreationThread && !studioCreationTemplate
			? withDomainScopeQuestion(activeQuestionCard)
			: activeQuestionCard;
	// Remember the chosen scope per thread so later clarification rounds (which no
	// longer render the domain question) keep the same catalog scope.
	const creationDomainScopeByThreadRef = useRef<Record<string, readonly string[]>>({});
	const getStudioAgentCreationClarificationOptions = useCallback(
		(categoryIds?: readonly string[]) => {
			if (!isStudioAgentCreationThread) {
				return undefined;
			}
			return {
				contextDescription: buildStudioAgentCreationContinuationContext(studioCreationTemplate, {
					categoryIds,
				}),
				creationMode: "agent" as const,
			};
		},
		[isStudioAgentCreationThread, studioCreationTemplate],
	);
	const handleCancelClarificationQuestionSet = useCallback(
		(questionCard: ParsedQuestionCardPayload) => {
			return chat.cancelClarificationQuestionSet(questionCard, getStudioAgentCreationClarificationOptions());
		},
		[chat, getStudioAgentCreationClarificationOptions],
	);
	const {
		shouldShowQuestionCard: shouldShowQuestionCardRaw,
		activeQuestionCardKey,
		hideQuestionCard,
		dismissQuestionCard,
	} = useDismissibleCards({
		activeQuestionCard,
		onDismissQuestionCard: handleCancelClarificationQuestionSet,
	});
	const [submittingQuestionCardKey, setSubmittingQuestionCardKey] = useState<string | null>(null);
	const isDeferredQuestionCard = Boolean(activeQuestionCard?.deferredToolCallId);
	const shouldShowQuestionCard = shouldShowQuestionCardRaw && (!chat.isStreaming || isDeferredQuestionCard);
	const handleClarificationSubmit = useCallback(
		async (answers: ClarificationAnswers) => {
			if (!activeQuestionCard) return;
			const questionCardKey = activeQuestionCardKey ?? `${activeQuestionCard.sessionId}:${activeQuestionCard.round}`;
			if (submittingQuestionCardKey === questionCardKey) return;
			setSubmittingQuestionCardKey(questionCardKey);
			try {
				// Scope the generation catalog: templates derive it from their bound
				// ids; free-text uses the domain-scope answer, remembered per thread so
				// later rounds (no domain question) keep the same scope.
				const scopeKey = activeQuestionCard.sessionId;
				const storedScope = scopeKey
					? creationDomainScopeByThreadRef.current[scopeKey]
					: undefined;
				const categoryIds = studioCreationTemplate
					? deriveTemplateCategoryIds(studioCreationTemplate)
					: (readDomainCategoryIds(answers) ?? storedScope);
				if (categoryIds && scopeKey) {
					creationDomainScopeByThreadRef.current[scopeKey] = categoryIds;
				}
				await submitClarification(
					activeQuestionCard,
					omitDomainScopeAnswer(answers),
					{
						...getStudioAgentCreationClarificationOptions(categoryIds),
						onSubmitted: hideQuestionCard,
					},
				);
			} catch {
				// submitClarification owns the user-facing error state.
			} finally {
				setSubmittingQuestionCardKey((currentKey) =>
					currentKey === questionCardKey ? null : currentKey,
				);
			}
		},
		[
			activeQuestionCard,
			activeQuestionCardKey,
			getStudioAgentCreationClarificationOptions,
			hideQuestionCard,
			studioCreationTemplate,
			submitClarification,
			submittingQuestionCardKey,
		],
	);
	const handleBuildPlan = useCallback(
		(planWidget: ParsedPlanWidgetPayload) => {
			return acceptPlanReview(planWidget);
		},
		[acceptPlanReview],
	);

	// Plan approval card support
	const activePendingPlan = useMemo(() => getLatestPendingPlanWidget(chat.messages), [chat.messages]);
	const [dismissedApprovalCardKey, setDismissedApprovalCardKey] = useState<string | null>(null);
	const [isSubmittingPlanApproval, setIsSubmittingPlanApproval] = useState(false);
	const pendingPlanKey = activePendingPlan?.planWidget.deferredToolCallId ?? null;
	const shouldShowApprovalCard = activePendingPlan !== null && pendingPlanKey !== dismissedApprovalCardKey && !shouldShowQuestionCard && !chat.isStreaming;
	// True when the composer dock renders a shadowed card (question or approval)
	// rather than the regular composer. Used to reserve room for the card's soft
	// shadow so the home-state scrollport doesn't clip it.
	const isShowingDockCard = (shouldShowQuestionCard && activeQuestionCard !== null) || (shouldShowApprovalCard && activePendingPlan !== null);

	useEffect(() => {
		setDismissedApprovalCardKey(null);
		setIsSubmittingPlanApproval(false);
	}, [chat.runtimeThreadId]);

	const handlePlanApprovalSubmit = useCallback(
		(selection: PlanApprovalSelection) => {
			if (!activePendingPlan) return;
			setIsSubmittingPlanApproval(true);
			void (async () => {
				try {
					await chat.submitPlanApproval(activePendingPlan.planWidget, selection);
				} finally {
					setIsSubmittingPlanApproval(false);
				}
			})();
		},
		[activePendingPlan, chat],
	);
	const handleDismissApprovalCard = useCallback(() => {
		setDismissedApprovalCardKey(pendingPlanKey);
	}, [pendingPlanKey]);

	const handleHermesSkillDraftApprove = useCallback(async (draft: HermesSkillDraftSummary) => {
		setSubmittingSkillDraftId(draft.id);
		try {
			await approveSkillDraft(draft.id);
			const nextDrafts = await fetchSkillDrafts("pending");
			setSkillDrafts(nextDrafts);
			setActivePendingSkillDraftDetail((currentDraft) => (currentDraft?.id === draft.id ? null : currentDraft));
		} finally {
			setSubmittingSkillDraftId((currentId) => (currentId === draft.id ? null : currentId));
		}
	}, []);
	const handleHermesSkillDraftReject = useCallback(async (draft: HermesSkillDraftSummary) => {
		setSubmittingSkillDraftId(draft.id);
		try {
			await rejectSkillDraft(draft.id);
			const nextDrafts = await fetchSkillDrafts("pending");
			setSkillDrafts(nextDrafts);
			setActivePendingSkillDraftDetail((currentDraft) => (currentDraft?.id === draft.id ? null : currentDraft));
		} finally {
			setSubmittingSkillDraftId((currentId) => (currentId === draft.id ? null : currentId));
		}
	}, []);
	const handleOpenHermesSkillDraftReview = useCallback(() => {
		router.push("/studio/skills");
	}, [router]);
	const handleOpenPlanPreview = useCallback(
		(planWidget: ParsedPlanWidgetPayload, sourceMessageId?: string) => {
			chat.openPlanAsDocument({
				title: planWidget.title,
				markdown: planWidget.markdown,
				sourceMessageId: sourceMessageId ?? null,
			});
		},
		[chat],
	);

	const resetTypedScrollAnchorState = useCallback(() => {
		pendingTypedScrollAnchorRef.current = false;
		previousTypedAnchorUserMessageIdRef.current = null;
		typedScrollAnchorSourceRef.current = "none";
		realtimeTypedResponseStartedRef.current = false;
	}, []);

	const activateTailFollowMode = useCallback(() => {
		resetTypedScrollAnchorState();
		setScrollAnchorMessageId(null);
		setScrollFollowMode("bottom");
	}, [resetTypedScrollAnchorState]);

	const queueTypedScrollAnchor = useCallback((source: Exclude<TypedScrollAnchorSource, "none">, latestUserMessageId: string | null) => {
		pendingTypedScrollAnchorRef.current = true;
		previousTypedAnchorUserMessageIdRef.current = latestUserMessageId;
		typedScrollAnchorSourceRef.current = source;
		realtimeTypedResponseStartedRef.current = false;
	}, []);

	const setChatVoiceMode = useCallback((next: boolean) => {
		const realtimeChat = chatRef.current as RovoAppRealtimeShellAdapter;
		if (typeof realtimeChat.setVoiceMode === "function") {
			realtimeChat.setVoiceMode(next);
			return;
		}

		if (realtimeChat.isVoiceMode !== next) {
			realtimeChat.toggleVoiceMode();
		}
	}, []);

	const injectRealtimeContext = useCallback((payload: RealtimeInjectContextPayload | null) => {
		if (!payload) {
			return;
		}

		realtimeInjectContextRef.current?.(payload);
	}, []);

	const appendRealtimeMessage = useCallback(async (role: "user" | "assistant", content: string, options?: Record<string, unknown>): Promise<string | null> => {
		const realtimeChat = chatRef.current as RovoAppRealtimeShellAdapter;
		if (typeof realtimeChat.appendRealtimeMessage !== "function") {
			return null;
		}

		const result = await realtimeChat.appendRealtimeMessage(role, content, options);
		return resolveRealtimeMutationId(result);
	}, []);

	const updateRealtimeMessage = useCallback(async (messageId: string | null, content: string, options?: { replace?: boolean }) => {
		if (!messageId || !content) {
			return;
		}

		const realtimeChat = chatRef.current as RovoAppRealtimeShellAdapter;
		if (options?.replace && typeof realtimeChat.setRealtimeMessageContent === "function") {
			await realtimeChat.setRealtimeMessageContent(messageId, content);
			return;
		}

		if (typeof realtimeChat.updateRealtimeMessage === "function") {
			await realtimeChat.updateRealtimeMessage(messageId, content);
		}
	}, []);

	const resetRealtimeAssistantMessageState = useCallback(() => {
		realtimeAssistantMessageIdRef.current = null;
		realtimeAssistantMessagePromiseRef.current = null;
	}, []);

	const ensureRealtimeAssistantMessage = useCallback(
		async (preferredMessageId?: string | null): Promise<string | null> => {
			// If we already have an active assistant message for this user turn,
			// always reuse it. The ref is only cleared by onSpeechStarted (when
			// the user speaks again), so all GPT responses within the same turn
			// merge into one bubble.
			if (realtimeAssistantMessageIdRef.current) {
				return realtimeAssistantMessageIdRef.current;
			}

			if (realtimeAssistantMessagePromiseRef.current) {
				return realtimeAssistantMessagePromiseRef.current;
			}

			const existingMessageId = preferredMessageId && chatRef.current.messages.some((message) => message.id === preferredMessageId && message.role === "assistant") ? preferredMessageId : null;
			if (existingMessageId) {
				realtimeAssistantMessageIdRef.current = existingMessageId;
				return existingMessageId;
			}

			const assistantCreatedAt = speechStartedAtRef.current ? new Date(new Date(speechStartedAtRef.current).getTime() + 1).toISOString() : undefined;
			const messageCreationPromise = appendRealtimeMessage("assistant", "", {
				messageId: preferredMessageId ?? undefined,
				createdAt: assistantCreatedAt,
			})
				.then((createdMessageId) => {
					if (createdMessageId) {
						realtimeAssistantMessageIdRef.current = createdMessageId;
					}
					return createdMessageId;
				})
				.finally(() => {
					if (realtimeAssistantMessagePromiseRef.current === messageCreationPromise) {
						realtimeAssistantMessagePromiseRef.current = null;
					}
				});
			realtimeAssistantMessagePromiseRef.current = messageCreationPromise;
			return messageCreationPromise;
		},
		[appendRealtimeMessage],
	);

	const handleStop = useCallback(async () => {
		manualVoiceStopRef.current = true;
		await chat.interruptActiveTurn({ source: "user-stop" });
	}, [chat]);

	// --- Studio AI cursor companion ---
	const clicky = useClicky();
	const {
		activate: activateClicky,
		isActive: isClickyActive,
		deactivate: deactivateClicky,
		startListening: clickyStartListening,
		startProcessing: clickyStartProcessing,
		startPointing: clickyStartPointing,
		startSpeaking: clickyStartSpeaking,
		returnToIdle: clickyReturnToIdle,
		addExchange: clickyAddExchange,
	} = clicky;
	const streamClickyAssistantText = useCallback((text: string) => {
		if (!text.trim()) {
			return false;
		}

		if (!isClickyActive) {
			activateClicky();
		}
		clickyStartSpeaking(text);
		return true;
	}, [activateClicky, clickyStartSpeaking, isClickyActive]);
	const [screenAssistantRegion, setScreenAssistantRegion] = useState<StudioScreenAssistantRegion | null>(null);
	const [screenAssistantRegionPainting, setScreenAssistantRegionPainting] = useState(false);
	const screenAssistantPointerRef = useRef<{ x: number; y: number } | null>(null);
	const screenAssistantComposerRef = useRef<{
		hasPrefill?: boolean;
		placeholder?: string;
	}>({
		placeholder: DEFAULT_COMPOSER_PLACEHOLDER,
	});
	// Refs let the screen-assistant tool executor (created with the realtime hook
	// below) reach values defined later in this component without re-creating the
	// hook on every change.
	const sendFunctionCallOutputRef = useRef<
		((payload: { callId: string; output: unknown; createResponse?: boolean }) => void) | null
	>(null);
	const handleComposerSubmitRef = useRef<
		((payload: { files: FileUIPart[]; text: string }) => void | Promise<void>) | null
	>(null);
	const prefillTextRef = useRef<string | null>(null);

	const clearPrefillSources = useCallback(() => {
		setPrefillText(null);
		setVoiceTranscript(null);
		composerTextRef.current = "";
		prefillTextRef.current = null;
	}, []);

	const handleComposerTextChange = useCallback((value: string) => {
		composerTextRef.current = value;
	}, []);

	useEffect(() => {
		const handlePointerMove = (event: PointerEvent) => {
			screenAssistantPointerRef.current = {
				x: event.clientX,
				y: event.clientY,
			};
		};

		window.addEventListener("pointermove", handlePointerMove, { passive: true });
		return () => window.removeEventListener("pointermove", handlePointerMove);
	}, []);

	useEffect(() => {
		if (!isClickyActive) {
			setScreenAssistantRegion(null);
			setScreenAssistantRegionPainting(false);
		}
	}, [isClickyActive]);

	const getScreenAssistantVisibleTargets = useCallback(
		() => getStudioScreenAssistantVisibleTargets(),
		[],
	);

	const getScreenAssistantSnapshot = useCallback(() => {
		const activePanel = activeSessionAgentEntry
			? "agent-config"
			: chat.panelState === "preview"
				? "artifact-preview"
				: "chat";

		return createStudioScreenAssistantSnapshot({
			activeAgentDraft: activeSessionAgentEntry?.draftResult ?? null,
			activeRegion: screenAssistantRegion,
			activePanel,
			composer: screenAssistantComposerRef.current,
			pointer: screenAssistantPointerRef.current,
			selectedAgent: {
				id: selectedAgent.id,
				name: selectedAgent.name,
			},
		});
	}, [activeSessionAgentEntry, chat.panelState, screenAssistantRegion, selectedAgent.id, selectedAgent.name]);

	const handleScreenAssistantToolCall = useCallback(
		(
			{ name, args }: StudioScreenAssistantToolCall,
			respond: StudioScreenAssistantToolResponder,
		) => {
			switch (name) {
				case "get_screen_state": {
					respond(getScreenAssistantSnapshot());
					return;
				}
				case "point_at_target": {
					const snapshot = getScreenAssistantSnapshot();
					const grounded = groundStudioScreenAssistantTarget({
						fieldId: typeof args.fieldId === "string" ? args.fieldId : undefined,
						id: typeof args.targetId === "string" ? args.targetId : undefined,
						label: typeof args.label === "string" ? args.label : undefined,
						activeRegion: snapshot.activeRegion ?? null,
						pointerTarget: snapshot.pointerContext?.target ?? null,
						visibleTargets: snapshot.visibleTargets,
					});
					const point = getViewportPointFromScreenAssistantTarget(grounded);
					const label =
						typeof args.label === "string" ? args.label : grounded?.label ?? "";
					let pointingStarted = false;
					if (point) {
						if (!isClickyActive) {
							activateClicky();
						}
						clickyStartPointing(point, label);
						pointingStarted = true;
					}
					respond({
						ok: pointingStarted,
						pointed: pointingStarted && grounded ? { id: grounded.id, label: grounded.label } : null,
					});
					return;
				}
				case "activate_screen_target": {
					const snapshot = getScreenAssistantSnapshot();
					respond(activateStudioScreenAssistantTarget({
						fieldId: typeof args.fieldId === "string" ? args.fieldId : undefined,
						id: typeof args.targetId === "string" ? args.targetId : undefined,
						label: typeof args.label === "string" ? args.label : undefined,
						pointerTarget: snapshot.pointerContext?.target ?? null,
						visibleTargets: snapshot.visibleTargets,
					}));
					return;
				}
				case "set_composer_text": {
					const text = typeof args.text === "string" ? args.text : "";
					setPrefillText(text);
					respond({ ok: Boolean(text) });
					return;
				}
				case "submit_composer": {
					const text = prefillTextRef.current ?? "";
					if (text.trim()) {
						void handleComposerSubmitRef.current?.({ files: [], text });
					}
					respond({ ok: Boolean(text.trim()) });
					return;
				}
				case "apply_agent_draft_patch": {
					const normalized = normalizeAgentDraftPatch(args.patch);
					let ok = false;
					let appliedFields: string[] = [];
					if (normalized && activeSessionAgentEntry) {
						const patch =
							normalized.description && !normalized.summary
								? { ...normalized, summary: normalized.description }
								: normalized;
						const nextEntry = studioAgentRegistry.updateSessionAgentDraft?.(
							activeSessionAgentEntry.profile.id,
							patch,
						);
						ok = Boolean(nextEntry);
						appliedFields = ok ? Object.keys(patch) : [];
					}
					if (ok) {
						streamClickyAssistantText(
							appliedFields.includes("instructions")
								? "Updated the instructions."
								: "Updated the agent draft.",
						);
					}
					respond({ appliedFields, ok });
					return;
				}
				default:
					respond({ ok: false, error: "unknown_tool" });
			}
		},
		[
			activateClicky,
			activeSessionAgentEntry,
			clickyStartPointing,
			getScreenAssistantSnapshot,
			isClickyActive,
			setPrefillText,
			streamClickyAssistantText,
			studioAgentRegistry,
		],
	);

	const handleRealtimeAssistantTextDelta = useCallback(
		async (payload: RealtimeAssistantTextPayload) => {
			if (isDictationActiveRef.current) {
				return;
			}

			const text = typeof payload === "string" ? payload : (payload.text ?? "");
			const replace = typeof payload === "string" ? false : payload.replace === true;
			const delta = typeof payload === "string" ? payload : (payload.delta ?? payload.text ?? "");
			if (!delta) {
				return;
			}

			if (text) {
				streamClickyAssistantText(text);
			}

			if (typeof payload !== "string" && payload.displayOnly === true) {
				return;
			}

			const messageId = typeof payload === "string" ? await ensureRealtimeAssistantMessage() : await ensureRealtimeAssistantMessage(payload.messageId ?? null);
			await updateRealtimeMessage(messageId, replace ? text : delta, replace ? { replace: true } : undefined);
		},
		[ensureRealtimeAssistantMessage, streamClickyAssistantText, updateRealtimeMessage],
	);

	const handleRealtimeAssistantTextCompleted = useCallback(
		async (payload: RealtimeAssistantTextCompletedPayload) => {
			if (isDictationActiveRef.current) {
				return;
			}

			const text = typeof payload === "string" ? payload : (payload.text ?? "");
			if (!text) {
				return;
			}

			// Cursor companion: animate "speaking" while the assistant talks.
			// Pointing is driven separately by the point_at_target tool.
			streamClickyAssistantText(text);
			clickyAddExchange({ role: "assistant", content: text });

			const messageId = typeof payload === "string" ? await ensureRealtimeAssistantMessage() : await ensureRealtimeAssistantMessage(payload.messageId ?? null);
			await updateRealtimeMessage(messageId, text, {
				replace: true,
			});
		},
		[clickyAddExchange, ensureRealtimeAssistantMessage, streamClickyAssistantText, updateRealtimeMessage],
	);

	// --- Realtime voice (live conversation mode) ---
		const realtime = useRealtimeVoice({
			onDelegateToRovo: useCallback(
				async (request: DelegationRequest) => {
					if (isDictationActiveRef.current) {
						return;
					}

					try {
					const c = chatRef.current as RovoAppRealtimeShellAdapter;
					const contextDescription = mergeContextDescriptions(request.conversationSummary ? `[Voice context] ${request.conversationSummary}` : undefined, annotationContextRef.current);
					const extendedRequest = request as ExtendedDelegationRequest;
					const delegatedMessageId = extendedRequest.delegatedMessageId ?? extendedRequest.realtimeMessageId ?? extendedRequest.messageId ?? realtimeUserMessageIdRef.current;

					if (delegatedMessageId && typeof c.delegateToRovo === "function") {
						await c.delegateToRovo(delegatedMessageId, {
							...buildHermesPromptOptions(contextDescription),
							conversationSummary: request.conversationSummary,
							existingRealtimeMessageId: realtimeAssistantMessageIdRef.current ?? undefined,
							intentType: request.intentType,
							prompt: request.prompt,
							referencedFiles: request.referencedFiles,
							urgency: request.urgency,
						});
						return;
					}

					if (c.isStreaming && c.panelState === "preview") {
						await c.applyVoiceSteer({
							...buildHermesPromptOptions(contextDescription),
							text: request.prompt,
						});
					} else {
						if (c.isStreaming) {
							await c.interruptActiveTurn({ source: "voice-barge-in" });
						}
						await c.submitPrompt({
							...buildHermesPromptOptions(contextDescription),
							text: request.prompt,
							files: [],
						});
					}
				} catch (error) {
					injectRealtimeContext({
						type: "delegation_error",
						content: error instanceof Error ? error.message : "Studio failed to process the delegated request.",
					});
					throw error;
				}
			},
			[buildHermesPromptOptions, injectRealtimeContext],
			),
			onSpeechStarted: useCallback(() => {
				if (isDictationActiveRef.current) {
					setDictationTranscriptPreview(null);
					return;
				}

				activateTailFollowMode();
			speechStartedAtRef.current = new Date().toISOString();
			realtimeUserTranscriptHasDeltaRef.current = false;
			resetRealtimeAssistantMessageState();
			realtimeUserMessageIdRef.current = null;
			setVoiceTranscript(null);

			// Rovo: transition to listening
			if (isClickyActive) {
				clickyStartListening();
			}

			const annotationContext = annotationContextRef.current;
			if (!annotationContext) {
				return;
			}

			injectRealtimeContext({
				type: "artifact_annotations",
				content: annotationContext,
			});
		}, [activateTailFollowMode, injectRealtimeContext, isClickyActive, clickyStartListening, resetRealtimeAssistantMessageState]),
		onSpeechTranscriptDelta: useCallback((payload: RealtimeSpeechTranscriptPayload) => {
			// Browser SpeechRecognition sends { text } (full replacement);
			// OpenAI transcription deltas send { delta, text } (accumulated).
			// Live chat keeps these deltas out of the composer; dictation owns
			// visible transcript preview and explicit accept/cancel behavior.
			const text = typeof payload === "string" ? payload : (payload.text ?? payload.delta ?? "");
			if (!text) {
				return;
			}

			if (isDictationActiveRef.current) {
				setDictationTranscriptPreview(text);
				const nextText = appendDictationTranscript(dictationCommittedTextRef.current ?? dictationBaselineRef.current ?? "", text);
				composerTextRef.current = nextText;
				setVoiceTranscript(nextText);
				setComposerFocusRequestKey((currentKey) => currentKey + 1);
				return;
			}

			realtimeUserTranscriptHasDeltaRef.current = true;
			}, []),
		onSpeechTranscriptCompleted: useCallback(
			async (payload: RealtimeSpeechTranscriptPayload) => {
				const transcript = typeof payload === "string" ? payload : (payload.transcript ?? payload.text ?? "");

				if (isDictationActiveRef.current) {
					if (!transcript.trim()) {
						return;
					}

					const nextText = appendDictationTranscript(dictationCommittedTextRef.current ?? dictationBaselineRef.current ?? "", transcript);
					dictationCommittedTextRef.current = nextText;
					composerTextRef.current = nextText;
					setDictationTranscriptPreview(transcript);
					setVoiceTranscript(nextText);
					setComposerFocusRequestKey((currentKey) => currentKey + 1);
					return;
				}

				// Rovo: transition to processing and record user exchange
				if (isClickyActive) {
					clickyStartProcessing();
					if (transcript) {
						clickyAddExchange({ role: "user", content: transcript });
					}
				}

				// If the user manually stopped voice, skip auto-submit and keep
				// partial transcript text out of the composer.
				if (manualVoiceStopRef.current) {
					manualVoiceStopRef.current = false;
					setVoiceTranscript(null);
					return;
				}

				if (!transcript) {
					setVoiceTranscript(null);
					return;
				}

				const messageId = await appendRealtimeMessage("user", transcript, {
					createdAt: speechStartedAtRef.current ?? undefined,
				});
				if (messageId) {
					realtimeUserMessageIdRef.current = messageId;
				}
				speechStartedAtRef.current = null;
				realtimeUserTranscriptHasDeltaRef.current = false;
				setVoiceTranscript(null);
			},
			[appendRealtimeMessage, isClickyActive, clickyStartProcessing, clickyAddExchange],
			),
		onTextResponseStart: useCallback(
			async (payload?: { messageId?: string }) => {
				if (isDictationActiveRef.current) {
					return;
				}

				if (typedScrollAnchorSourceRef.current === "realtime") {
					realtimeTypedResponseStartedRef.current = true;
				}
				realtimeAssistantMessageIdRef.current = await ensureRealtimeAssistantMessage(payload?.messageId ?? null);
			},
			[ensureRealtimeAssistantMessage],
			),
		onAssistantTextDelta: handleRealtimeAssistantTextDelta,
		onAssistantTextCompleted: handleRealtimeAssistantTextCompleted,
		onEndVoiceSession: useCallback(() => {
			manualVoiceStopRef.current = true;
			speechStartedAtRef.current = null;
			realtimeUserMessageIdRef.current = null;
			setVoiceTranscript(null);
		}, []),
		onToolCall: useCallback(
			({ name, args, callId }: { name: string; args: Record<string, unknown>; callId: string }) => {
				const respond = (output: unknown, createResponse?: boolean) =>
					sendFunctionCallOutputRef.current?.({
						callId,
						output,
						...(createResponse === false ? { createResponse: false } : {}),
					});

				handleScreenAssistantToolCall({ args, callId, name }, respond);
			},
			[handleScreenAssistantToolCall],
		),
		chatMessages: chat.messages,
		isGenerating: chat.isStreaming,
	} satisfies RealtimeVoiceShellOptions) as RealtimeVoiceShellResult;

	useEffect(() => {
		const testWindow = window as StudioScreenAssistantTestWindow;
		if (!testWindow.__VPK_E2E_SCREEN_ASSISTANT__) {
			return;
		}

		testWindow.__vpkStudioScreenAssistantTest = {
			callTool: async ({ args = {}, name }) =>
				new Promise((resolve) => {
					handleScreenAssistantToolCall(
						{ args, callId: `e2e-${Date.now()}`, name },
						(output) => resolve(output),
					);
				}),
			streamAssistantText: async (chunks) => {
				let text = "";
				for (const chunk of chunks) {
					text += chunk;
					await handleRealtimeAssistantTextDelta({
						delta: chunk,
						displayOnly: true,
						source: "text",
						text,
					});
				}
				return { ok: true };
			},
		};

		return () => {
			if (testWindow.__vpkStudioScreenAssistantTest) {
				delete testWindow.__vpkStudioScreenAssistantTest;
			}
		};
	}, [handleRealtimeAssistantTextDelta, handleScreenAssistantToolCall]);

	const isRealtimeActive = realtime.voiceState !== "idle";

	// --- Rovo voice bridge (connect + inject tool-based system prompt) ---
	useClickyVoice({
		isClickyActive,
		isRealtimeConnected: realtime.isConnected,
		connectRealtime: realtime.connect,
		injectContext: realtime.injectContext,
	});

	const realtimeStatusMessage = resolveRealtimeStatusMessage(realtime);
	const shouldChatVoiceModeBeEnabled = isRealtimeActive;
	const realtimeSessionIdentity = resolveRealtimeSessionIdentity(realtime, chat.activeThreadId, chat.runtimeThreadId);
	const wasRealtimeStreamingRef = useRef(false);
	const dictationState = resolveComposerDictationState({
		active: isDictationActive,
		voiceState: realtime.voiceState,
	});

	useEffect(() => {
		realtimeInjectContextRef.current = realtime.injectContext as typeof realtimeInjectContextRef.current;
	}, [realtime.injectContext]);

	useEffect(() => {
		if (shouldChatVoiceModeBeEnabled !== chat.isVoiceMode) {
			setChatVoiceMode(shouldChatVoiceModeBeEnabled);
		}
	}, [chat.isVoiceMode, setChatVoiceMode, shouldChatVoiceModeBeEnabled]);

	// Inject Rovo results back into GPT session for context continuity
	useEffect(() => {
		if (wasRealtimeStreamingRef.current && !chat.isStreaming && isRealtimeActive) {
			const lastAssistantMessage = [...chat.messages].reverse().find((m) => m.role === "assistant");
			if (lastAssistantMessage) {
				const text = getMessageText(lastAssistantMessage);
				const artifact = getMessageArtifactResult(lastAssistantMessage);
				const summary = artifact ? `Studio ${artifact.action === "update" ? "updated" : "created"} artifact "${artifact.title}". ${text || ""}` : text || "Studio completed the task.";
				injectRealtimeContext({
					type: "thread_message",
					content: summary.slice(0, REALTIME_RESULT_SUMMARY_MAX_CHARS),
				});
			}
		}
		wasRealtimeStreamingRef.current = chat.isStreaming;
	}, [chat.isStreaming, chat.messages, injectRealtimeContext, isRealtimeActive]);

	useEffect(() => {
		if (!isRealtimeActive || !realtimeSessionIdentity) {
			injectedRealtimeThreadContextKeyRef.current = null;
			return;
		}

		const contextKey = `${chat.activeThreadId ?? chat.runtimeThreadId}:${realtimeSessionIdentity}`;
		if (injectedRealtimeThreadContextKeyRef.current === contextKey) {
			return;
		}

		const summary = buildRealtimeThreadSummary(chat.messages);
		if (summary) {
			injectRealtimeContext({
				type: "thread_context",
				summary,
			});
		}
		injectedRealtimeThreadContextKeyRef.current = contextKey;
	}, [chat.activeThreadId, chat.messages, chat.runtimeThreadId, injectRealtimeContext, isRealtimeActive, realtimeSessionIdentity]);

	const startRealtimeVoice = useCallback(() => {
		if (isDictationActiveRef.current) {
			isDictationActiveRef.current = false;
			dictationBaselineRef.current = null;
			dictationCommittedTextRef.current = null;
			setIsDictationActive(false);
			setDictationTranscriptPreview(null);
		}

		manualVoiceStopRef.current = false;
		activateClicky();
		realtime.connect();
	}, [activateClicky, realtime]);

	const handleToggleRealtimeVoice = useCallback(() => {
		if (realtime.voiceState === "idle") {
			startRealtimeVoice();
			return;
		}

		realtimeUserMessageIdRef.current = null;
		resetRealtimeAssistantMessageState();
		speechStartedAtRef.current = null;
		// Set flag to prevent auto-submit race from a late transcription_completed
		manualVoiceStopRef.current = true;
		setVoiceTranscript(null);
		realtime.disconnect();
		deactivateClicky();
	}, [deactivateClicky, realtime, resetRealtimeAssistantMessageState, startRealtimeVoice]);

	const handleToggleClicky = useCallback(() => {
		if (isClickyActive) {
			deactivateClicky();
			return;
		}

		activateClicky();
		if (realtime.voiceState === "idle") {
			startRealtimeVoice();
		}
	}, [activateClicky, deactivateClicky, isClickyActive, realtime.voiceState, startRealtimeVoice]);

	// Keyboard shortcuts for Rovo
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Cmd+Shift+K (Mac) / Ctrl+Shift+K (other) toggles Rovo
			if (e.key === "K" && e.shiftKey && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				handleToggleClicky();
				return;
			}

			// Escape deactivates Rovo
			if (e.key === "Escape" && isClickyActive) {
				deactivateClicky();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [deactivateClicky, handleToggleClicky, isClickyActive]);

	const handleStartDictation = useCallback(() => {
		if (realtime.voiceState !== "idle") {
			realtimeUserMessageIdRef.current = null;
			resetRealtimeAssistantMessageState();
			speechStartedAtRef.current = null;
			manualVoiceStopRef.current = true;
			realtime.disconnect();
		}

		const baselineText = composerTextRef.current;
		dictationBaselineRef.current = baselineText;
		dictationCommittedTextRef.current = baselineText;
		isDictationActiveRef.current = true;
		setIsDictationActive(true);
		setDictationTranscriptPreview(null);
		setPrefillText(null);
		setVoiceTranscript(baselineText);
		setComposerFocusRequestKey((currentKey) => currentKey + 1);
		realtime.connect({ transcriptionOnly: true });
	}, [realtime, resetRealtimeAssistantMessageState]);

	const handleStopDictation = useCallback(() => {
		dictationBaselineRef.current = null;
		dictationCommittedTextRef.current = null;
		isDictationActiveRef.current = false;
		manualVoiceStopRef.current = true;
		setIsDictationActive(false);
		setDictationTranscriptPreview(null);
		setPrefillText(null);
		setVoiceTranscript(composerTextRef.current);
		realtime.disconnect();
	}, [realtime]);

	const handleComposerSubmit = useCallback(
		async ({ files, text }: { files: FileUIPart[]; text: string }) => {
			const realtimeChat = chatRef.current as RovoAppRealtimeShellAdapter;
			const realtimeVoice = realtime as RealtimeVoiceShellResult;
			const trimmedText = text.trim();
			const isAutomationDiscoveryDemoPrompt = isStudioAutomationDiscoveryDemoPrompt(trimmedText);
			const shouldStartStudioAgentCreation =
				isDefaultAgentHomeStateRef.current &&
				!isRealtimeActive &&
				!isAutomationDiscoveryDemoPrompt;
			const creationTemplate = shouldStartStudioAgentCreation ? (creationTemplateRef.current ?? undefined) : undefined;
			const studioAgentCreationContext = shouldStartStudioAgentCreation ? buildStudioAgentCreationContext(text, creationTemplate) : undefined;
			const contextDescription = mergeContextDescriptions(annotationContextRef.current, studioAgentCreationContext);
			const hermesPromptOptions = buildHermesPromptOptions(contextDescription);
			const shouldClearHermesSkillSelection = Boolean(hermesPromptOptions.hermesContext);
			const latestUserMessageIdBeforeSubmit = getLatestUserMessageId(chat.messages);

			if (isRealtimeActive) {
				if (typeof realtimeChat.submitRealtimeText === "function") {
					queueTypedScrollAnchor("realtime", latestUserMessageIdBeforeSubmit);
					try {
						await realtimeChat.submitRealtimeText({
							...hermesPromptOptions,
							files,
							text,
						});
						if (shouldClearHermesSkillSelection) {
							clearHermesSkillSelection();
						}
						clearPrefillSources();
					} catch (error) {
						resetTypedScrollAnchorState();
						throw error;
					}
					return;
				}

				if (typeof realtimeVoice.sendTextInput === "function") {
					queueTypedScrollAnchor("realtime", latestUserMessageIdBeforeSubmit);
					resetRealtimeAssistantMessageState();

					// Realtime text stays inside the active voice session so existing
					// voice barge-in behavior is unchanged; Send mode applies to
					// standard Studio text submissions below.
					// Cursor companion: show processing for text input sent through voice mode.
					if (isClickyActive) {
						clickyAddExchange({ role: "user", content: text });
						clickyStartProcessing();
					}

					let messageId: string | null = null;
					if (typeof realtimeChat.appendRealtimeMessage === "function") {
						messageId = await appendRealtimeMessage("user", text, {
							contextDescription,
						});
						if (messageId) {
							realtimeUserMessageIdRef.current = messageId;
						}
					}

						try {
							await realtimeVoice.sendTextInput({
								contextDescription,
								messageId: messageId ?? undefined,
								text,
							});
						} catch (error) {
							resetTypedScrollAnchorState();
							throw error;
						}
						clearPrefillSources();
						return;
					}
				}

			// Deterministic demo agent-editor. Studio build prompts typed while an
			// agent draft is open ("add a trigger to…", "give it Jira tools",
			// "rename it to…") are mapped onto the fake directory catalogs and
			// applied directly — no model call — so the demo is reliable and never
			// returns gibberish. New-agent prompts fall through to the normal
			// model-backed creation flow so the AI can ask clarification questions.
			// Voice/realtime is never intercepted.
			if (!isRealtimeActive && trimmedText) {
				const openAgentEntry = activeSessionAgentEntry;
				const buildPlan = planDeterministicAgentBuild(
					trimmedText,
					openAgentEntry ? openAgentEntry.draftResult : null,
				);
				if (buildPlan.handled) {
					// A build prompt typed from the default home state must run the same
					// landing→studio collapse + creation-thread bookkeeping the normal
					// path below does, since this branch returns before reaching it.
					const fromDefaultHomeState = isDefaultAgentHomeStateRef.current;
					const triggerAutomationNames = buildPlan.triggerAutomationNames ?? [];
					if (fromDefaultHomeState) {
						setIsDefaultHomeSubmitTransition(true);
						markStudioAgentCreationThread(chat.runtimeThreadId);
						markStudioAgentCreationThread(chat.activeThreadId);
					}
					queueTypedScrollAnchor("standard", latestUserMessageIdBeforeSubmit);
					try {
						await appendRealtimeMessage("user", trimmedText, { contextDescription });
						const assistantMessageId = createId("rovo-app-deterministic");
						const triggerTraceStartedAt = new Date();
						if (triggerAutomationNames.length > 0) {
							const triggerTraceStates = ["thinking", "review", "schedule", "delivery", "save", "complete"] as const;
							await appendRealtimeMessage("assistant", "", {
								contextDescription,
								messageId: assistantMessageId,
								parts: buildDeterministicTriggerThinkingParts({
									prompt: trimmedText,
									startedAt: triggerTraceStartedAt,
									state: triggerTraceStates[0],
									triggerAutomationNames,
								}),
							});
							const triggerTraceDelays = [
								DETERMINISTIC_TRIGGER_TRACE_INITIAL_DELAY_MS,
								...DETERMINISTIC_TRIGGER_TRACE_STAGE_DELAYS_MS,
							] as const;
							for (let index = 0; index < triggerTraceDelays.length; index += 1) {
								await waitForDeterministicTrace(triggerTraceDelays[index]);
								const stagedTraceState = triggerTraceStates[index + 1] ?? "complete";
								await appendRealtimeMessage("assistant", "", {
									contextDescription,
									messageId: assistantMessageId,
									parts: buildDeterministicTriggerThinkingParts({
										...(index === triggerTraceDelays.length - 1 && buildPlan.assistantReply
											? { assistantReply: buildPlan.assistantReply }
											: {}),
										prompt: trimmedText,
										startedAt: triggerTraceStartedAt,
										state: stagedTraceState,
										triggerAutomationNames,
									}),
								});
							}
						}
						if (buildPlan.mode === "update" && openAgentEntry && buildPlan.patch) {
							handleUpdateAgentDraft(openAgentEntry.profile.id, buildPlan.patch);
						}
						if (buildPlan.assistantReply && triggerAutomationNames.length === 0) {
							await appendRealtimeMessage("assistant", buildPlan.assistantReply, {
								contextDescription,
							});
						}
					} catch (error) {
						if (fromDefaultHomeState) {
							setIsDefaultHomeSubmitTransition(false);
						}
						resetTypedScrollAnchorState();
						throw error;
					}
					if (shouldClearHermesSkillSelection) {
						clearHermesSkillSelection();
					}
					clearPrefillSources();
					return;
				}
			}

			const shouldShowOptimisticPrompt =
				(chat.sendMode === "immediate" || !chat.shouldQueueNextSubmission) &&
				(trimmedText || files.length > 0);
			if (shouldShowOptimisticPrompt) {
				if (isDefaultAgentHomeStateRef.current) {
					setIsDefaultHomeSubmitTransition(true);
				}
				setOptimisticUserMessage(
					createRovoAppUserMessage({
						id: createId("rovo-app-user"),
						createdAt: new Date().toISOString(),
						files,
						text: trimmedText,
					}),
				);
			}

			queueTypedScrollAnchor("standard", latestUserMessageIdBeforeSubmit);
			try {
				if (shouldStartStudioAgentCreation) {
					markStudioAgentCreationThread(chat.runtimeThreadId);
					markStudioAgentCreationThread(chat.activeThreadId);
					// Keep the template provenance available for clarification rounds on
					// this creation thread, then clear the pending selection so a later
					// hand-typed brief isn't mislabeled as template-derived.
					if (creationTemplate) {
						if (chat.runtimeThreadId) {
							creationTemplateByThreadRef.current[chat.runtimeThreadId] = creationTemplate;
						}
						if (chat.activeThreadId) {
							creationTemplateByThreadRef.current[chat.activeThreadId] = creationTemplate;
						}
					}
					creationTemplateRef.current = null;
				}
				const submitPrompt = realtimeChat.submitPrompt as (payload: StudioSubmitPromptPayload) => Promise<void>;
				await submitPrompt({
					...hermesPromptOptions,
					files,
					text,
					...(shouldStartStudioAgentCreation ? { creationMode: "agent" as const } : {}),
				});
				if (shouldClearHermesSkillSelection) {
					clearHermesSkillSelection();
				}
				clearPrefillSources();
			} catch (error) {
				setIsDefaultHomeSubmitTransition(false);
				setOptimisticUserMessage(null);
				resetTypedScrollAnchorState();
				throw error;
			}
		},
		[
			appendRealtimeMessage,
			activeSessionAgentEntry,
			handleUpdateAgentDraft,
			chat.messages,
			isRealtimeActive,
			isClickyActive,
			clickyAddExchange,
			clickyStartProcessing,
			queueTypedScrollAnchor,
			realtime,
			resetRealtimeAssistantMessageState,
			resetTypedScrollAnchorState,
			setOptimisticUserMessage,
			buildHermesPromptOptions,
			clearHermesSkillSelection,
			clearPrefillSources,
			markStudioAgentCreationThread,
			chat.activeThreadId,
			chat.sendMode,
			chat.shouldQueueNextSubmission,
			chat.runtimeThreadId,
		],
	);

	// Deterministic agent-edit interception for the ask-Rovo ("Improve your
	// agent?") chat. That composer runs through ChatPanel/RovoChatProvider, not
	// handleComposerSubmit, so it gets its own seam wired to the same shared
	// planner. Returns { handled } so ChatPanel can skip the model and inject a
	// believable reply. While the edit context bar is open, ChatPanel also blocks
	// unmatched prompts from falling through to the normal clarification / plan
	// flow. The test chat does NOT receive this prop, so conversing with the
	// agent stays a real conversation.
	const handleAgentEditInterceptSubmit = useCallback(
		(text: string) => {
			const trimmedText = text.trim();
			const openAgentEntry = activeSessionAgentEntry;
			const buildPlan = planDeterministicAgentBuild(
				trimmedText,
				openAgentEntry ? openAgentEntry.draftResult : null,
			);
			if (!buildPlan.handled) {
				return { handled: false };
			}
			const applyBuildPlan = () => {
				if (buildPlan.mode === "update" && openAgentEntry && buildPlan.patch) {
					handleUpdateAgentDraft(openAgentEntry.profile.id, buildPlan.patch);
				}
			};
			const triggerAutomationNames = buildPlan.triggerAutomationNames ?? [];
			if (triggerAutomationNames.length === 0) {
				applyBuildPlan();
				return { handled: true, assistantReply: buildPlan.assistantReply };
			}
			return {
				handled: true,
				assistantReply: buildPlan.assistantReply,
				getPendingAssistantParts: ({ startedAt }: { startedAt: Date }) => buildDeterministicTriggerThinkingParts({
					prompt: trimmedText,
					startedAt,
					state: "thinking",
					triggerAutomationNames,
				}),
				assistantPartStages: [
					{
						delayMs: DETERMINISTIC_TRIGGER_TRACE_INITIAL_DELAY_MS,
						getAssistantParts: ({ startedAt }: { startedAt: Date }) => buildDeterministicTriggerThinkingParts({
							prompt: trimmedText,
							startedAt,
							state: "review",
							triggerAutomationNames,
						}),
					},
					{
						delayMs: DETERMINISTIC_TRIGGER_TRACE_STAGE_DELAYS_MS[0],
						getAssistantParts: ({ startedAt }: { startedAt: Date }) => buildDeterministicTriggerThinkingParts({
							prompt: trimmedText,
							startedAt,
							state: "schedule",
							triggerAutomationNames,
						}),
					},
					{
						delayMs: DETERMINISTIC_TRIGGER_TRACE_STAGE_DELAYS_MS[1],
						getAssistantParts: ({ startedAt }: { startedAt: Date }) => buildDeterministicTriggerThinkingParts({
							prompt: trimmedText,
							startedAt,
							state: "delivery",
							triggerAutomationNames,
						}),
					},
					{
						delayMs: DETERMINISTIC_TRIGGER_TRACE_STAGE_DELAYS_MS[2],
						getAssistantParts: ({ startedAt }: { startedAt: Date }) => buildDeterministicTriggerThinkingParts({
							prompt: trimmedText,
							startedAt,
							state: "save",
							triggerAutomationNames,
						}),
					},
					{
						delayMs: DETERMINISTIC_TRIGGER_TRACE_STAGE_DELAYS_MS[3],
						getAssistantParts: ({ startedAt }: { startedAt: Date }) => buildDeterministicTriggerThinkingParts({
							assistantReply: buildPlan.assistantReply,
							prompt: trimmedText,
							startedAt,
							state: "complete",
							triggerAutomationNames,
						}),
						onApply: applyBuildPlan,
					},
				],
			};
		},
		[activeSessionAgentEntry, handleUpdateAgentDraft],
	);

	// Keep the screen-assistant tool executor (created with the realtime hook
	// above) pointed at the latest handlers without re-creating the hook.
	sendFunctionCallOutputRef.current = realtime.sendFunctionCallOutput;
	handleComposerSubmitRef.current = handleComposerSubmit;
	prefillTextRef.current = prefillText;

	const displayMessages = useMemo(() => {
		if (!optimisticUserMessage) {
			return chat.messages;
		}

		const optimisticText = getMessageText(optimisticUserMessage).trim();
		const hasVisibleUserMessage = chat.messages.some((message) => {
			if (message.role !== "user") {
				return false;
			}

			if (message.id === optimisticUserMessage.id) {
				return true;
			}

			return optimisticText.length > 0 && getMessageText(message).trim() === optimisticText;
		});

		return hasVisibleUserMessage ? chat.messages : [...chat.messages, optimisticUserMessage];
	}, [chat.messages, optimisticUserMessage]);

	const visibleMessages = useMemo(() => {
		return displayMessages.filter((message) => {
			return message.role === "user" || message.role === "assistant";
		});
	}, [displayMessages]);
	useEffect(() => {
		if (studioAgentCreationThreadKeysRef.current.has(chat.runtimeThreadId) && chat.activeThreadId) {
			markStudioAgentCreationThread(chat.activeThreadId);
		}
		}, [chat.activeThreadId, chat.runtimeThreadId, markStudioAgentCreationThread, studioAgentCreationThreadKeysRef]);
	useEffect(() => {
		for (const message of chat.messages.toReversed()) {
			const agentResult = getMessageAgentResult(message);
			if (!isGeneratedAgentResult(agentResult) || !hasTurnCompleteSignal(message)) {
				continue;
			}

			const agentResultKey = `${chat.runtimeThreadId}:${message.id}:${agentResult.agentId}:${agentResult.action}`;
			if (handledAgentResultKeysRef.current.has(agentResultKey)) {
				continue;
			}

			if (handleStudioAgentResultSelect(agentResult, { sourceMessageId: message.id })) {
				handledAgentResultKeysRef.current.add(agentResultKey);
				unmarkStudioAgentCreationThread(chat.runtimeThreadId);
				unmarkStudioAgentCreationThread(chat.activeThreadId);
				break;
			}
		}
		}, [chat.activeThreadId, chat.messages, chat.runtimeThreadId, handledAgentResultKeysRef, handleStudioAgentResultSelect, unmarkStudioAgentCreationThread]);
	const timelineItems = useMemo(() => {
		return deriveRovoAppTimelineItems(displayMessages);
	}, [displayMessages]);
	const latestTimelineMessageId = timelineItems[0]?.id ?? null;
	const scrollActiveTimelineId = scrollActiveTimelineSelection
		&& scrollActiveTimelineSelection.runtimeThreadId === chat.runtimeThreadId
		&& scrollActiveTimelineSelection.latestTimelineMessageId === latestTimelineMessageId
		? scrollActiveTimelineSelection.messageId
		: null;
	const activeTimelineMessageId = scrollActiveTimelineId ?? latestTimelineMessageId;
	const handleScrollActiveTimelineChange = useCallback((messageId: string | null) => {
		setScrollActiveTimelineSelection(
			messageId
				? {
					latestTimelineMessageId,
					messageId,
					runtimeThreadId: chat.runtimeThreadId,
				}
				: null,
		);
	}, [chat.runtimeThreadId, latestTimelineMessageId]);

	useEffect(() => {
		if (!optimisticUserMessage) {
			return;
		}

		const hasVisibleUserMessage = chat.messages.some((message) => {
			if (message.role !== "user") {
				return false;
			}

			return message.id === optimisticUserMessage.id || getMessageText(message).trim() === getMessageText(optimisticUserMessage).trim();
		});

		if (hasVisibleUserMessage) {
			setOptimisticUserMessage(null);
		}
	}, [chat.messages, optimisticUserMessage]);

	useEffect(() => {
		const latestUserMessageId = getLatestUserMessageId(chat.messages);
		if (pendingTypedScrollAnchorRef.current && latestUserMessageId && latestUserMessageId !== previousTypedAnchorUserMessageIdRef.current) {
			pendingTypedScrollAnchorRef.current = false;
			previousTypedAnchorUserMessageIdRef.current = null;
			setScrollAnchorMessageId(latestUserMessageId);
			setScrollFollowMode("target");
		}
	}, [chat.messages]);

	useEffect(() => {
		activateTailFollowMode();
	}, [activateTailFollowMode, chat.runtimeThreadId]);

	useEffect(() => {
		if (typedScrollAnchorSourceRef.current !== "realtime" || !realtimeTypedResponseStartedRef.current) {
			return;
		}

		if (realtime.generationState !== "complete" && realtime.generationState !== "idle") {
			return;
		}

		activateTailFollowMode();
	}, [activateTailFollowMode, realtime.generationState]);

	useEffect(() => {
		if (typedScrollAnchorSourceRef.current !== "standard" || chat.isStreaming) {
			return;
		}

		activateTailFollowMode();
	}, [activateTailFollowMode, chat.isStreaming]);

	const visibleWorkspaceDocumentId = chat.visibleArtifactDocumentId;
	const workspaceDocument = useMemo(() => {
		return visibleWorkspaceDocumentId && chat.streamingArtifact?.documentId === visibleWorkspaceDocumentId
			? {
					id: chat.streamingArtifact.documentId ?? "streaming-artifact",
					threadId: chat.activeThreadId ?? chat.runtimeThreadId,
					title: chat.streamingArtifact.title || "Artifact draft",
					kind: chat.streamingArtifact.kind,
					sourceMessageId: null,
					createdAt: chat.streamingArtifact.createdAt,
					updatedAt: chat.streamingArtifact.updatedAt,
					versions: [
						{
							changeLabel: "Generating",
							id: "streaming",
							content: chat.streamingArtifact.content,
							createdAt: chat.streamingArtifact.updatedAt,
							title: chat.streamingArtifact.title || "Artifact draft",
						},
					],
				}
			: visibleWorkspaceDocumentId
				? (chat.documents.find((document) => document.id === visibleWorkspaceDocumentId) ?? null)
				: null;
	}, [chat.activeThreadId, chat.documents, chat.runtimeThreadId, chat.streamingArtifact, visibleWorkspaceDocumentId]);
	const selectedDocumentVersion = useMemo(() => {
		return workspaceDocument?.versions.find((version) => version.id === chat.selectedVersionId) ?? workspaceDocument?.versions.at(-1) ?? null;
	}, [chat.selectedVersionId, workspaceDocument]);
	const isArtifactOpen = chat.panelState !== "closed";

	const artifactMenuItems = useMemo(() => {
		const items = sortRovoAppArtifacts(chat.documents).map((artifact) => ({
			id: artifact.id,
			typeLabel: getRovoAppArtifactTypeLabel(artifact),
			title: artifact.title,
		}));
		const seenIds = new Set(items.map((item) => item.id));

		for (let index = chat.messages.length - 1; index >= 0; index--) {
			const artifactResult = getMessageArtifactResult(chat.messages[index]);
			if (!artifactResult || seenIds.has(artifactResult.documentId)) {
				continue;
			}

			seenIds.add(artifactResult.documentId);
			items.push({
				id: artifactResult.documentId,
				typeLabel: getRovoAppArtifactKindLabel(artifactResult.kind),
				title: artifactResult.title,
			});
		}

		return items;
	}, [chat.documents, chat.messages]);

	// Derive the latest browser state from message data parts
	const latestBrowserArtifact = useMemo(() => {
		let browserState = null;
		let browserStateMessageId: string | null = null;
		let browserScreenshot = null;

		for (let i = chat.messages.length - 1; i >= 0; i--) {
			const message = chat.messages[i];
			if (!browserState) {
				const part = getLatestDataPart(message, "data-browser-state");
				if (part) {
					browserState = part.data;
					browserStateMessageId = message.id;
				}
			}

			if (!browserScreenshot) {
				const part = getLatestDataPart(message, "data-browser-screenshot");
				if (part) {
					browserScreenshot = part.data;
				}
			}

			if (browserState && browserScreenshot) {
				break;
			}
		}

		return {
			browserArtifactKey: buildRovoAppBrowserArtifactKey({
				browserScreenshot,
				browserState,
				messageId: browserStateMessageId,
			}),
			browserScreenshot,
			browserState,
		};
	}, [chat.messages]);
	const browserArtifactKey = latestBrowserArtifact.browserArtifactKey;
	const browserState = latestBrowserArtifact.browserState;
	const browserScreenshot = latestBrowserArtifact.browserScreenshot;

	useEffect(() => {
		setDismissedBrowserArtifactKey(null);
	}, [chat.runtimeThreadId]);

	// Auto-open artifact panel when browser state arrives and no document artifact is active
	useEffect(() => {
		if (shouldAutoOpenRovoAppBrowserArtifact({
			browserArtifactKey,
			dismissedBrowserArtifactKey,
			hasWorkspaceDocument: Boolean(workspaceDocument),
			panelState: chat.panelState,
		})) {
			chat.setPanelState("preview");
		}
	}, [browserArtifactKey, chat, dismissedBrowserArtifactKey, workspaceDocument]);
	const shouldShowReopenBrowserPreviewControl = shouldShowReopenRovoAppBrowserArtifactControl({
		browserArtifactKey,
		dismissedBrowserArtifactKey,
		hasWorkspaceDocument: Boolean(workspaceDocument),
		panelState: chat.panelState,
	});
	const hasActiveThreadRun = typeof chat.activeThreadId === "string" && chat.backgroundStreamThreadIds.has(chat.activeThreadId);
	const showHomeState = !chat.isLoadingThread && !isArtifactOpen && !hasActiveThreadRun && visibleMessages.length === 0;
	const shouldShowChatHeader = !shouldShowAgentConfigPane && (visibleMessages.length > 0 || hasActiveThreadRun || chat.isStreaming);
	const isDefaultAgentHomeState = showHomeState && !isCustomAgentSelected && !shouldShowAgentConfigPane;
	isDefaultAgentHomeStateRef.current = isDefaultAgentHomeState;
	const shouldReduceMotion = useReducedMotion();
	const shouldReduceStudioLandingMotion = Boolean(shouldReduceMotion);
	const [landingMotionReady, setLandingMotionReady] = useState(false);
	const [bentoDismissed, setBentoDismissed] = useState(false);
	const shouldGateDefaultLandingContent = isDefaultAgentHomeState && !landingMotionReady;
	const shouldShowDefaultLandingContent = !shouldGateDefaultLandingContent;
	const shouldShowStudioAgentsSection = isDefaultAgentHomeState && shouldShowDefaultLandingContent;
	const shouldShowHomeStarterBento = isDefaultAgentHomeState && shouldShowDefaultLandingContent && !bentoDismissed;
	const shouldShowComposerDock = shouldShowDefaultLandingContent;
	const shouldShowTimelineNavigator = !showHomeState && !isArtifactOpen && timelineItems.length > 1;
	const composerPreviewState = resolveRovoAppComposerPlaceholder({
		defaultPlaceholder: DEFAULT_COMPOSER_PLACEHOLDER,
		previewPrompt,
		showHomeState,
	});
	const studioLandingMotionInitial = shouldReduceStudioLandingMotion
		? STUDIO_LANDING_REDUCED_CONTENT_INITIAL
		: STUDIO_LANDING_CONTENT_INITIAL;
	const studioLandingMotionVisible = shouldReduceStudioLandingMotion
		? STUDIO_LANDING_REDUCED_CONTENT_VISIBLE
		: STUDIO_LANDING_CONTENT_VISIBLE;
	const studioLandingMotionTransition = shouldReduceStudioLandingMotion
		? STUDIO_LANDING_REDUCED_TRANSITION
		: STUDIO_LANDING_ENTER_TRANSITION;
	const homeStarterBentoPresence = {
		instant: isDefaultHomeSubmitTransition,
		reduceMotion: shouldReduceStudioLandingMotion,
	};
	screenAssistantComposerRef.current = {
		hasPrefill: Boolean(voiceTranscript ?? prefillText),
		placeholder: composerPreviewState.placeholder,
	};

	useEffect(() => {
		if (landingMotionReady || shellSize.width <= 0 || shellSize.height <= 0) {
			return;
		}

		const frame = requestAnimationFrame(() => setLandingMotionReady(true));
		return () => cancelAnimationFrame(frame);
	}, [landingMotionReady, shellSize.height, shellSize.width]);

	useEffect(() => {
		if (showHomeState || !isDefaultHomeSubmitTransition) {
			return;
		}

		const frame = requestAnimationFrame(() => {
			setIsDefaultHomeSubmitTransition(false);
		});
		return () => cancelAnimationFrame(frame);
	}, [isDefaultHomeSubmitTransition, showHomeState]);

	const canAnnotateWorkspaceDocument = workspaceDocument !== null;
	const annotationState = useArtifactAnnotations({
		active: cursorMode && isArtifactOpen && !chat.streamingArtifact && chat.artifactMode === "preview" && process.env.NODE_ENV === "development",
		documentId: workspaceDocument?.id ?? null,
		documentKind: workspaceDocument?.kind ?? null,
		documentVersionId: selectedDocumentVersion?.id ?? null,
		containerRef: artifactContentRef,
	});
	const {
		annotations: artifactAnnotations,
		addComment: addArtifactAnnotationComment,
		clearAnnotations,
		dismissSelection: dismissArtifactSelection,
		formatContextForVoice,
		pendingSelection: pendingArtifactSelection,
		removeAnnotation: removeArtifactAnnotation,
	} = annotationState;

	const handleApplyAnnotations = useCallback(
		(annotationsToApply: ArtifactAnnotation[]) => {
			if (annotationsToApply.length === 0) {
				return;
			}

			for (const annotation of annotationsToApply) {
				const contextDescription = formatAnnotationsForVoiceContext([annotation]);
				void chat
					.submitPrompt({
						...buildHermesPromptOptions(contextDescription),
						text: annotation.comment,
						files: [],
					})
					.catch(() => {});
			}

			clearAnnotations();
			setCursorMode(false);
		},
		[buildHermesPromptOptions, chat, clearAnnotations],
	);

	const shellRef = useRef<HTMLDivElement | null>(null);
	// Onboarding tour: anchors steps to the right "Ask Rovo" panel (result card +
	// composer) and the center config panel (chat starters + Activate). shellRef
	// wraps the center <main> and excludes the right panel, so it scopes those
	// center selectors cleanly.
	const askRovoPanelRef = useRef<HTMLDivElement | null>(null);
	const agentOnboardingTour = useAgentOnboardingTour({
		rightPanelRef: askRovoPanelRef,
		centerRef: shellRef,
	});
	const { start: startAgentOnboardingTour } = agentOnboardingTour;
	useEffect(() => {
		if (agentCreationTourSignal === 0) {
			return;
		}
		// Defer a frame so the freshly opened right panel, result card, and test
		// view are mounted before the tour resolves its first anchor.
		const frame = requestAnimationFrame(() => startAgentOnboardingTour());
		return () => cancelAnimationFrame(frame);
	}, [agentCreationTourSignal, startAgentOnboardingTour]);
	const composerDockRef = useRef<HTMLDivElement | null>(null);
	const defaultHomeTopSpacerRef = useRef<HTMLDivElement | null>(null);
	const artifactCardOriginRef = useRef<DOMRect | null>(null);
	const artifactPreviewOriginRef = useLazyRef<Map<string, DOMRect>>(() => new Map());
	const [defaultHomeTopSpacerMeasurement, setDefaultHomeTopSpacerMeasurement] = useState<{ key: string; height: number } | null>(null);
	const [artifactOrigin, setArtifactOrigin] = useState({
		left: 0,
		top: 0,
		width: 320,
		height: 96,
	});
	const artifactSplitChatPaneWidthRef = useRef<number | null>(null);
	const artifactLayout = getRovoAppShellLayout(shellSize.width);
	const isAgentConfigOverlayActive = shouldShowAgentConfigPane && artifactLayout.mode !== "split";
	const shouldSplitArtifactPane = !shouldShowAgentConfigPane && isArtifactOpen && artifactLayout.mode === "split";
	const splitChatPaneMaxSize = shouldSplitArtifactPane || (shouldShowAgentConfigPane && !isAgentConfigOverlayActive)
		? Math.min(ROVO_APP_MAX_CHAT_PANE_WIDTH, Math.max(ROVO_APP_MIN_CHAT_PANE_WIDTH, shellSize.width - ROVO_APP_MIN_ARTIFACT_PANE_WIDTH))
		: ROVO_APP_MAX_CHAT_PANE_WIDTH;
	const splitChatPaneDefaultSize = shouldSplitArtifactPane || (shouldShowAgentConfigPane && !isAgentConfigOverlayActive)
		? clamp(artifactSplitChatPaneWidthRef.current ?? artifactLayout.chatPaneWidth ?? ROVO_APP_MIN_CHAT_PANE_WIDTH, ROVO_APP_MIN_CHAT_PANE_WIDTH, splitChatPaneMaxSize)
		: ROVO_APP_MIN_CHAT_PANE_WIDTH;
	const splitArtifactPaneDefaultSize = shouldSplitArtifactPane || (shouldShowAgentConfigPane && !isAgentConfigOverlayActive)
		? Math.max(ROVO_APP_MIN_ARTIFACT_PANE_WIDTH, shellSize.width - splitChatPaneDefaultSize)
		: ROVO_APP_MIN_ARTIFACT_PANE_WIDTH;
	const defaultHomeTopSpacerMeasurementKey = isDefaultAgentHomeState && landingMotionReady ? `${shellSize.width}:${shellSize.height}` : null;
	const defaultHomeTopSpacerHeight = defaultHomeTopSpacerMeasurement?.key === defaultHomeTopSpacerMeasurementKey
		? defaultHomeTopSpacerMeasurement.height
		: null;

	useLayoutEffect(() => {
		if (!landingMotionReady || !defaultHomeTopSpacerMeasurementKey || !isDefaultAgentHomeState || shouldSplitArtifactPane || shouldShowAgentConfigPane || defaultHomeTopSpacerHeight !== null) {
			return;
		}

		const spacerElement = defaultHomeTopSpacerRef.current;
		if (!spacerElement) {
			return;
		}

		const spacerHeight = Math.round(spacerElement.getBoundingClientRect().height);
		if (spacerHeight > 0) {
			setDefaultHomeTopSpacerMeasurement({
				key: defaultHomeTopSpacerMeasurementKey,
				height: spacerHeight,
			});
		}
	}, [defaultHomeTopSpacerHeight, defaultHomeTopSpacerMeasurementKey, isDefaultAgentHomeState, landingMotionReady, shouldShowAgentConfigPane, shouldSplitArtifactPane]);

	useEffect(() => {
		if (!isRealtimeActive) {
			injectedRealtimeArtifactContextKeyRef.current = null;
			return;
		}

		const artifactContext = buildRealtimeArtifactContextSummary({
			annotationContext: annotationContextRef.current,
			document: workspaceDocument
				? {
						id: workspaceDocument.id,
						kind: workspaceDocument.kind,
						title: workspaceDocument.title,
					}
				: null,
		});
		if (!artifactContext) {
			return;
		}

		const contextKey = [workspaceDocument?.id ?? "none", selectedDocumentVersion?.id ?? "latest", annotationContextRef.current ?? "no-annotations"].join(":");
		if (injectedRealtimeArtifactContextKeyRef.current === contextKey) {
			return;
		}

		injectRealtimeContext({
			type: "artifact_context",
			content: artifactContext,
		});
		injectedRealtimeArtifactContextKeyRef.current = contextKey;
	}, [injectRealtimeContext, isRealtimeActive, selectedDocumentVersion?.id, workspaceDocument]);

	useEffect(() => {
		if (isArtifactOpen || visibleMessages.length > 0) {
			setGalleryExpanded(false);
		}
	}, [isArtifactOpen, visibleMessages.length]);

	useEffect(() => {
		if (!showHomeState && previewPrompt !== null) {
			setPreviewPrompt(null);
		}
	}, [previewPrompt, showHomeState]);

	useEffect(() => {
		const nextContext = formatContextForVoice().trim();
		annotationContextRef.current = nextContext.length > 0 ? nextContext : null;
	}, [artifactAnnotations, formatContextForVoice]);

	useEffect(() => {
		if (!isArtifactOpen) {
			setCursorMode(false);
		}
	}, [isArtifactOpen]);

	useEffect(() => {
		if (chat.streamingArtifact) {
			setCursorMode(false);
		}
	}, [chat.streamingArtifact]);

	useEffect(() => {
		if (!canAnnotateWorkspaceDocument) {
			setCursorMode(false);
		}
	}, [canAnnotateWorkspaceDocument]);

	useEffect(() => {
		clearAnnotations();
	}, [clearAnnotations, workspaceDocument?.id]);

	useEffect(() => {
		clearAnnotations();
	}, [clearAnnotations, selectedDocumentVersion?.id]);

	useEffect(() => {
		if (chat.artifactMode !== "preview") {
			setCursorMode(false);
			clearAnnotations();
		}
	}, [chat.artifactMode, clearAnnotations]);

	useEffect(() => {
		const updateViewportWidth = () => {
			if (typeof window === "undefined") {
				return;
			}

			const width = Math.max(1, Math.round(window.innerWidth));
			setViewportWidthPx((prev) => (prev === width ? prev : width));
		};

		updateViewportWidth();
		window.addEventListener("resize", updateViewportWidth);
		return () => window.removeEventListener("resize", updateViewportWidth);
	}, []);

	useEffect(() => {
		const shellElement = shellRef.current;
		if (!shellElement || typeof ResizeObserver === "undefined") {
			return;
		}

		const updateBounds = () => {
			setShellSize((prev) => {
				const width = shellElement.clientWidth;
				const height = shellElement.clientHeight;
				return prev.width === width && prev.height === height ? prev : { width, height };
			});
		};

		updateBounds();
		const observer = new ResizeObserver(() => {
			updateBounds();
		});
		observer.observe(shellElement);
		return () => observer.disconnect();
	}, []);

	const handleOpenArtifactFromCard = useCallback(
		(documentId: string, element: HTMLElement) => {
			const shellElement = shellRef.current;
			if (shellElement) {
				const shellRect = shellElement.getBoundingClientRect();
				const cardRect = element.getBoundingClientRect();
				artifactCardOriginRef.current = new DOMRect(cardRect.left - shellRect.left, cardRect.top - shellRect.top, cardRect.width, cardRect.height);
			}
			void chat.openDocument(documentId);
		},
		[chat],
	);

		const handleRegisterArtifactCard = useCallback((documentId: string, element: HTMLElement) => {
			const shellElement = shellRef.current;
			if (!shellElement) {
				return;
			}

			const shellRect = shellElement.getBoundingClientRect();
			const cardRect = element.getBoundingClientRect();
			artifactPreviewOriginRef.current.set(documentId, new DOMRect(cardRect.left - shellRect.left, cardRect.top - shellRect.top, cardRect.width, cardRect.height));
		}, [artifactPreviewOriginRef]);

	useEffect(() => {
		if (!isArtifactOpen) {
			return;
		}

		const cardOrigin = artifactCardOriginRef.current;
		if (cardOrigin) {
			artifactCardOriginRef.current = null;
			setArtifactOrigin({
				left: Math.max(cardOrigin.x, 16),
				top: Math.max(cardOrigin.y, 16),
				width: Math.min(Math.max(cardOrigin.width, 260), 420),
				height: Math.min(Math.max(cardOrigin.height, 40), 140),
			});
			return;
		}

		const previewOrigin = workspaceDocument?.id ? (artifactPreviewOriginRef.current.get(workspaceDocument.id) ?? null) : null;
		if (previewOrigin) {
			setArtifactOrigin({
				left: Math.max(previewOrigin.x, 16),
				top: Math.max(previewOrigin.y, 16),
				width: Math.min(Math.max(previewOrigin.width, 260), 420),
				height: Math.min(Math.max(previewOrigin.height, 40), 220),
			});
			return;
		}

		const shellElement = shellRef.current;
		const composerElement = composerDockRef.current;
		if (!shellElement || !composerElement) {
			return;
		}

		const shellRect = shellElement.getBoundingClientRect();
		const composerRect = composerElement.getBoundingClientRect();
		const nextWidth = Math.min(Math.max(composerRect.width - 56, 260), 420);
		const nextHeight = Math.min(Math.max(composerRect.height, 72), 140);
		const nextLeft = Math.max(composerRect.left - shellRect.left + 28, 16);
		const nextTop = Math.max(composerRect.top - shellRect.top + 8, 16);

		setArtifactOrigin({
			left: nextLeft,
			top: nextTop,
			width: nextWidth,
			height: nextHeight,
		});
		}, [artifactPreviewOriginRef, isArtifactOpen, workspaceDocument?.id]);

	const handleArtifactSplitLayoutChanged = useCallback(
		(layout: Record<string, number>) => {
			const nextChatPanePercentage = layout[ROVO_APP_SPLIT_CHAT_PANEL_ID];
			if (!Number.isFinite(nextChatPanePercentage) || shellSize.width <= 0) {
				return;
			}

			artifactSplitChatPaneWidthRef.current = Math.round((shellSize.width * nextChatPanePercentage) / 100);
		},
		[shellSize.width],
	);

	const handleCloseArtifactPane = useCallback(() => {
		if (!workspaceDocument) {
			return;
		}

		if (chat.streamingArtifact?.documentId !== workspaceDocument.id) {
			chat.setActiveDocumentId(null);
		}
		chat.hideArtifactPane();
	}, [workspaceDocument, chat]);

	const handleOpenBrowserPreview = useCallback(() => {
		setDismissedBrowserArtifactKey(null);
		if (chat.panelState === "closed") {
			chat.setPanelState("preview");
		}
	}, [chat]);

	const handleCloseBrowserPreview = useCallback(() => {
		if (browserArtifactKey) {
			setDismissedBrowserArtifactKey(browserArtifactKey);
		}
		chat.hideArtifactPane();
	}, [browserArtifactKey, chat]);

	const agentConfigTestPanel = activeSessionAgentEntry ? (
		<AgentTestPanel entry={activeSessionAgentEntry} />
	) : null;

	const agentConfigPane = activeSessionAgentEntry ? (
		<RovoAppAgentConfigPanel
			activeView={activeAgentConfigView}
			entry={activeSessionAgentEntry}
			onCommitPublishReady={handleCommitAgentPublishReady}
			onPublish={handlePublishAgent}
			onTest={handleTestAgent}
			onViewChange={handleAgentConfigViewChange}
			testPanel={agentConfigTestPanel}
			chatContextBar={agentEditContextBar}
			chatGreeting={agentEditGreeting}
			onChatInterceptSubmit={handleAgentEditInterceptSubmit}
			onUpdateDraft={handleUpdateAgentDraft}
			onStartWithTemplate={handleStartAgentWithTemplate}
		/>
	) : null;

	const artifactPane = (() => {
		if (!isArtifactOpen) {
			return null;
		}

		if (!workspaceDocument && browserState) {
			return (
				<RovoAppBrowserArtifact
					url={browserState.url}
					title={browserState.title}
					status={browserState.status}
					screenshot={browserScreenshot}
					streamConfig={browserState.streamConfig ?? null}
					workspaceId={browserState.workspaceId ?? null}
					onClose={handleCloseBrowserPreview}
				/>
			);
		}

		if (!workspaceDocument) {
			return null;
		}

		return (
			<ArtifactPanel
				annotations={artifactAnnotations}
				contentRef={artifactContentRef}
				cursorMode={cursorMode}
				document={workspaceDocument}
				draftContent={chat.streamingArtifact?.content ?? chat.artifactDraftContent}
				isStreaming={Boolean(chat.streamingArtifact)}
				mode={chat.artifactMode}
				onAddComment={addArtifactAnnotationComment}
				onApplyAnnotations={handleApplyAnnotations}
				onClose={handleCloseArtifactPane}
				onCursorModeChange={canAnnotateWorkspaceDocument ? setCursorMode : undefined}
				onDelete={() => chat.deleteDocument(workspaceDocument.id)}
				onDraftChange={chat.setArtifactDraftContent}
				onDismissSelection={dismissArtifactSelection}
				onModeChange={chat.setArtifactMode}
				onRemoveAnnotation={removeArtifactAnnotation}
				onSave={chat.saveArtifactDraft}
				onVersionChange={(versionId) => {
					chat.setSelectedVersionId(versionId);
					const nextVersion = workspaceDocument?.versions.find((version) => version.id === versionId) ?? selectedDocumentVersion;
					chat.setArtifactDraftContent(nextVersion?.content ?? "");
				}}
				pendingSelection={pendingArtifactSelection}
				selectedVersionId={selectedDocumentVersion?.id ?? null}
			/>
		);
	})();

	const chatPane = (
		<>
			<ViewTransition key={chat.runtimeThreadId} enter="fade-in" exit="fade-out" default="none">
				<RovoAppMessages
					activeDocumentId={chat.activeDocument?.id ?? null}
					compact={isArtifactOpen || shouldShowAgentConfigPane}
					extraHorizontalPaddingWhenCompact
					isMaxMode={chat.isPlanMode}
					documents={chat.documents}
					editingMessageId={chat.editingMessageId}
					isStreaming={chat.isStreaming}
					messages={displayMessages}
					onBuildPlan={handleBuildPlan}
					onEditMessage={chat.editMessage}
					onOpenArtifactFromCard={handleOpenArtifactFromCard}
					onOpenBrowserPreview={handleOpenBrowserPreview}
					onOpenPlanPreview={handleOpenPlanPreview}
					onAgentResultSelect={handleStudioAgentResultSelect}
					onRegisterArtifactCard={handleRegisterArtifactCard}
					onRegenerate={chat.regenerateLatest}
					onScrollActiveUserMessageChange={handleScrollActiveTimelineChange}
					onSelectSuggestion={handleRovoAppSuggestionSelect}
					onSetEditingMessageId={chat.setEditingMessageId}
					onVote={chat.voteOnMessage}
					pendingPlanMetadataMessageIds={chat.pendingPlanMetadataMessageIds}
					pendingArtifactResult={chat.pendingArtifactResult}
					scrollAnchorMessageId={scrollAnchorMessageId}
					scrollFollowMode={scrollFollowMode}
					selectedAgent={selectedAgent}
					showEmptyState={showHomeState && shouldShowDefaultLandingContent}
					shouldSuppressLatestAssistantSuggestions={chat.shouldSuppressLatestAssistantSuggestions}
					streamingArtifact={chat.streamingArtifact}
					streamingArtifactMessageId={chat.streamingArtifactMessageId}
					votes={chat.votes}
				/>
			</ViewTransition>

			{shouldShowAgentConfigPane && showHomeState ? <div aria-hidden className="flex-1 shrink" /> : null}

			<AnimatePresence custom={homeStarterBentoPresence} initial={false}>
				{shouldShowHomeStarterBento ? (
					<motion.div
						key="home-starter-bento"
						className="z-10 mx-auto mb-3 w-[90%]"
						animate="visible"
						custom={homeStarterBentoPresence}
						exit="exit"
						initial={shouldReduceStudioLandingMotion ? false : "hidden"}
						style={{ willChange: "transform, opacity, height" }}
						variants={STUDIO_HOME_BENTO_VARIANTS}
					>
						<HomeStarterBento
							onBrowseTemplates={handleBrowseAgentsDirectory}
							onDismiss={() => setBentoDismissed(true)}
							onSelect={handleGallerySelect}
							onPreviewStart={handleGalleryPreviewStart}
							onPreviewEnd={handleGalleryPreviewEnd}
							templatesDialogOpen={agentTemplatesDialogOpen || isSidebarAgentBrowserOpen}
						/>
					</motion.div>
				) : null}
			</AnimatePresence>

			{shouldShowComposerDock ? (
				<div
					ref={composerDockRef}
					className={cn(
						"relative z-10 mx-auto flex min-w-0 w-full flex-col gap-3 overflow-visible",
						!showHomeState && "sticky bottom-0 bg-background/90 backdrop-blur",
						isArtifactOpen || shouldShowAgentConfigPane ? "max-w-none px-3" : "max-w-[800px]",
						// The question/approval card carries a soft 50px-blur shadow that the
						// home-state scrollport (chatPaneContainer overflow-y-auto) clips on the
						// left/right/bottom. When a card is shown, reserve room for that blur with
						// inner padding and bump max-w by the same amount so the card content width
						// is unchanged. Padding is scoped to the card case so the regular sticky
						// composer keeps its flush bottom alignment.
						isShowingDockCard && !(isArtifactOpen || shouldShowAgentConfigPane) && "max-w-[848px] px-6 pb-6",
					)}
				>
					{realtimeStatusMessage ? <div className="px-1 text-text-subtle text-xs">{realtimeStatusMessage}</div> : null}
					{shouldShowReopenBrowserPreviewControl ? (
						<div className="flex justify-center px-1">
							<Button onClick={handleOpenBrowserPreview} size="default" type="button" variant="outline">
								Reopen browser preview
							</Button>
						</div>
					) : null}
					<div>
						{shouldShowQuestionCard && activeQuestionCard ? (
							<>
								<ClarificationQuestionCard
									key={activeQuestionCardKey ?? undefined}
									questionCard={renderedQuestionCard ?? activeQuestionCard}
									isSubmitting={submittingQuestionCardKey === (activeQuestionCardKey ?? `${activeQuestionCard.sessionId}:${activeQuestionCard.round}`)}
									onSubmit={(answers) => {
										void handleClarificationSubmit(answers);
									}}
									onDismiss={() => {
										dismissQuestionCard();
										hideQuestionCard();
									}}
								/>
								<QuestionCardShortcutsFooter />
							</>
						) : shouldShowApprovalCard && activePendingPlan ? (
						<>
							<ApprovalCard key={pendingPlanKey ?? undefined} onDismiss={handleDismissApprovalCard} onSelect={handlePlanApprovalSubmit} isSubmitting={isSubmittingPlanApproval} />
							<QuestionCardShortcutsFooter escLabel="cancel" />
						</>
					) : (
						<>
							{activePendingSkillDraft ? (
								<div className="mb-3">
									<RovoAppHermesSkillDraftBar
										activeIndex={activePendingSkillDraftIndex}
										draft={activePendingSkillDraft}
										draftDetail={activePendingSkillDraftDetail}
										isSubmitting={submittingSkillDraftId === activePendingSkillDraft.id}
										onApprove={handleHermesSkillDraftApprove}
										onOpenReview={handleOpenHermesSkillDraftReview}
										onReject={handleHermesSkillDraftReject}
										onSelectIndex={setActivePendingSkillDraftIndex}
										totalDrafts={pendingThreadSkillDrafts.length}
									/>
								</div>
							) : null}
							<motion.div
								animate={showHomeState ? studioLandingMotionVisible : { opacity: 1, transform: "translateY(0px)" }}
								initial={showHomeState ? studioLandingMotionInitial : false}
								transition={showHomeState ? studioLandingMotionTransition : { duration: 0 }}
								style={{ willChange: "transform, opacity" }}
							>
								<RovoAppComposer
									key={chat.runtimeThreadId}
									artifactTitle={workspaceDocument?.title ?? null}
									autoFocus={!embedded}
									backgroundArtifactLabel={chat.backgroundArtifactLabel}
									composerStatus={chat.composerStatus}
									compact={isArtifactOpen || shouldShowAgentConfigPane}
									errorMessage={chat.inputError}
									dictationState={dictationState}
									dictationTranscriptPreview={dictationTranscriptPreview}
									focusRequestKey={composerFocusRequestKey}
									fillWidth={!showHomeState && !(isArtifactOpen || shouldShowAgentConfigPane)}
									galleryExpanded={galleryExpanded}
									isPlanMode={chat.isPlanMode}
									micStream={realtime.micStream}
									onDismissArtifactContext={handleCloseArtifactPane}
									onDismissPlanExecutionTracker={chat.dismissPlanExecutionTracker}
									onBrowseTemplates={
										isDefaultAgentHomeState && bentoDismissed ? () => setBentoDismissed(false) : undefined
									}
									onStartFromScratch={isDefaultAgentHomeState ? handleStartAgentFromScratch : undefined}
									onStop={handleStop}
									onRemoveQueuedPrompt={chat.removeQueuedPrompt}
									onSendQueuedPromptNow={chat.sendQueuedPromptNow}
									onSubmit={handleComposerSubmit}
									onTextChange={handleComposerTextChange}
									onStartDictation={handleStartDictation}
									onStopDictation={handleStopDictation}
									onTogglePlanMode={chat.togglePlanMode}
									onToggleRealtimeVoice={handleToggleRealtimeVoice}
									onToggleClicky={handleToggleClicky}
									clickyActive={isClickyActive}
									placeholder={composerPreviewState.placeholder}
									prefillText={voiceTranscript ?? prefillText}
									previewPrompt={composerPreviewState.activePreviewPrompt}
									planExecutionTracker={chat.planExecutionTracker}
									queuedPrompts={chat.queuedPrompts}
									realtimeVoiceActive={isRealtimeActive}
									realtimeVoiceState={realtime.voiceState}
									showBackgroundStop={chat.hasBackgroundDelegation}
								/>
							</motion.div>
							{!showHomeState ? <Footer className="relative z-10" /> : null}
						</>
					)}
					</div>
				</div>
			) : null}
		</>
	);

	const chatPaneContainer = (
		<div
			className={cn(
				"overscroll-behavior-contain relative z-10 flex h-full min-h-0 min-w-0 flex-1 flex-col touch-pan-y bg-background",
				// Home landing stacks bento + composer + agents table + footer in a
				// centered (flex-1 spacers) column. Without a scrollport the spacers
				// can't collapse far enough on short viewports and the bottom (the
				// agents table) gets clipped with no way to reach it. Chat state is
				// excluded: RovoAppMessages owns its own scroll there.
				showHomeState && "overflow-y-auto",
			)}
		>
			{shouldShowAgentConfigPane && activeSessionAgentEntry ? (
				<div
					className="absolute left-3 top-3 z-20 hidden items-center gap-2 rounded-md border border-border bg-surface px-2 py-1 text-xs md:flex"
					data-testid="chat-agent-testing-chrome"
				>
					<Badge
						variant={
							activeSessionAgentEntry.publishedVersion > 0 || activeSessionAgentEntry.publishedResult
								? "success"
								: "information"
						}
					>
						{activeSessionAgentEntry.publishedVersion > 0 || activeSessionAgentEntry.publishedResult
							? "Published"
							: "Testing"}
					</Badge>
					<span className="max-w-[180px] truncate text-text-subtle">
						{activeSessionAgentEntry.profile.name}
					</span>
				</div>
			) : null}
			{shouldShowTimelineNavigator ? (
				<ChatTimelineNavigator
					activeItemId={activeTimelineMessageId}
					className="absolute right-3 top-5 z-20 hidden md:block"
					items={timelineItems}
					onSelectItem={(messageId) => {
						handleScrollActiveTimelineChange(messageId);
						setScrollAnchorMessageId(messageId);
						setScrollFollowMode("target");
					}}
				/>
			) : null}
			{showHomeState && !shouldSplitArtifactPane && !shouldShowAgentConfigPane ? (
				<div
					ref={isDefaultAgentHomeState ? defaultHomeTopSpacerRef : undefined}
					aria-hidden
					className={cn(
						"min-h-3",
						isDefaultAgentHomeState && defaultHomeTopSpacerHeight !== null ? "shrink-0" : "flex-1 shrink",
					)}
					style={isDefaultAgentHomeState && defaultHomeTopSpacerHeight !== null ? { flexBasis: defaultHomeTopSpacerHeight } : undefined}
				/>
			) : null}
			{chatPane}
			{shouldShowStudioAgentsSection ? (
				<motion.div
					animate={studioLandingMotionVisible}
					initial={studioLandingMotionInitial}
					transition={studioLandingMotionTransition}
					style={{ willChange: "transform, opacity" }}
				>
					<StudioAgentsSection
						directoryAgents={ROVO_DIRECTORY_AGENT_PROFILES}
						entries={studioAgentRegistry.sessionAgentEntries}
						onBrowseTemplates={() => handleBrowseAgentTemplates()}
						onCreateAgent={handleFocusStudioComposer}
						onDeleteAgent={handleDeleteStudioAgent}
						onEditAgent={handleStudioSidebarAgentSelect}
						onSelectDirectoryAgent={handleSidebarBrowseAgentSelect}
					/>
				</motion.div>
			) : null}
			{showHomeState && !shouldSplitArtifactPane ? (
				<>
					{!shouldShowAgentConfigPane ? <div className="min-h-0 flex-1 shrink" /> : null}
					<Footer className="shrink-0" />
				</>
			) : null}
		</div>
	);

	return (
		<SidebarProvider className={cn(embedded ? "h-full" : "h-svh", "overflow-hidden")} defaultOpen={!embedded} onOpenChange={chat.setSidebarOpen} open={chat.sidebarOpen} style={rovoAppSidebarStyle}>
			<RovoAppSidebar
				activeThreadId={chat.activeThreadId}
				agentCreationThreads={studioAgentCreationThreads}
				generatingAgents={studioAutomationGeneratingAgents}
				hoverOpen={isHoverOpen}
				isAgentsHomeActive={isDefaultAgentHomeState}
				isResizing={sidebarResize.isResizing}
				onCancelThreadRun={async (threadId) => {
					await chat.cancelThreadRun(threadId);
				}}
				onDeleteAgent={handleDeleteStudioAgent}
				onDeleteThread={async (threadId) => {
					// Clear any in-progress agent-creation tracking first. Otherwise the
					// thread lingers in `studioAgentCreationThreadIds` after `chat.threads`
					// drops it, and the memo re-renders it as a ghost "Agent creation" row.
					unmarkStudioAgentCreationThread(threadId);
					startTransition(() => {
						void chat.deleteThread(threadId);
					});
				}}
				onNewChat={handleReturnToAgentsHome}
				onSelectAgent={handleStudioSidebarAgentSelect}
				onSelectThread={async (threadId) => {
					setOptimisticUserMessage(null);
					startTransition(async () => {
						await chat.loadThread(threadId);
						if (embedded) {
							return;
						}
						window.history.pushState(null, "", buildRovoAppThreadPath(threadId));
					});
				}}
				onSidebarMouseEnter={handleSidebarContentMouseEnter}
				onSidebarMouseLeave={handleSidebarContentMouseLeave}
				onViewAllAgents={handleReturnToAgentsHome}
				resizeHandle={
					<SidebarResizeHandle
						data-active={sidebarResize.isResizing ? "" : undefined}
						data-will-collapse={sidebarResize.willCollapse ? "" : undefined}
						onDoubleClick={sidebarResize.onResizeHandleDoubleClick}
						onPointerDown={sidebarResize.onResizeHandlePointerDown}
						onPointerEnter={sidebarResize.onResizeHandlePointerEnter}
						onPointerLeave={sidebarResize.onResizeHandlePointerLeave}
					/>
				}
				selectedAgentId={activeSessionAgentEntry?.profile.id ?? studioAgentRegistry.selectedAgentId}
				sessionAgentEntries={studioAgentRegistry.sessionAgentEntries}
				threads={chat.threads}
				threadsLoaded={chat.threadsLoaded}
				topOffset={!embedded}
			/>
			<AgentTemplatesDialog
				key={agentTemplatesInitialCategory}
				open={agentTemplatesDialogOpen}
				onOpenChange={setAgentTemplatesDialogOpen}
				agents={DEMO_AGENT_TEMPLATES}
				initialCategoryId={agentTemplatesInitialCategory}
				onSelectAgent={handleTemplateAgentSelect}
				sessionAgents={DEMO_AGENT_TEMPLATES_SESSION}
			/>
			{/* Opened by the home bento's "Browse all" pill, landing straight on the
			    category the user was exploring (e.g. "Planning"). The `key` remounts
			    AgentBrowser so its `initialTemplateCategory` re-seeds per category. */}
			<AgentsDirectoryDialog
				key={`agents-directory-${sidebarAgentBrowserInitialCategory}`}
				open={isSidebarAgentBrowserOpen}
				onOpenChange={setIsSidebarAgentBrowserOpen}
				agents={ROVO_DIRECTORY_AGENT_PROFILES}
				onSelectAgent={handleSidebarBrowseAgentSelect}
				onSelectTemplateAgent={handleTemplateAgentSelect}
				onBuildTemplateAgent={handleBuildTemplateAgent}
				onOpenBuiltTemplateAgentConfig={handleOpenBuiltTemplateAgentConfig}
				sessionAgents={studioAgentRegistry.sessionAgentEntries.map((entry) => entry.profile)}
				initialTemplateCategory={sidebarAgentBrowserInitialCategory}
				variant="experimental"
			/>

			{!embedded ? (
				<div
					className={cn(
						"fixed top-0 left-0 z-50 flex items-center px-3",
						hasMountedChrome && !sidebarResize.isResizing && "transition-[width,border-color] duration-medium ease-in-out",
						sidebarResize.isResizing && "transition-none",
						chat.sidebarOpen
							? cn(
									"w-(--sidebar-width) overflow-x-clip border-r",
									// Match resize-handle hover/active (blue). Do not use
									// `border-border-warning` here — it reads as orange/red in the
									// chrome; collapse intent stays on the handle (`data-will-collapse`).
									sidebarResize.isResizing || sidebarResize.isResizeHandleHovered ? "border-border-selected" : "border-border",
								)
							: "border-b border-border",
					)}
					style={{
						...headerHeightStyle,
						width: chat.sidebarOpen ? undefined : `${TOP_NAV_COLLAPSED_LEFT_SECTION_WIDTH_PX}px`,
						backgroundColor: token("elevation.surface"),
						viewTransitionName: "persistent-sidebar" as never,
					}}
				>
					<LeftNavigation
						product="studio"
						windowWidth={nav.windowWidth}
						isVisible={chat.sidebarOpen}
						isAppSwitcherOpen={nav.isAppSwitcherOpen}
						isSidebarResizing={sidebarResize.isResizing}
						hideAppSwitcher
						separatorLineOffsetPx={sidebarResize.sidebarWidth - TOP_NAV_PADDING_PX}
						onToggleSidebar={nav.toggleSidebar}
						onToggleAppSwitcher={nav.handleToggleAppSwitcher}
						onCloseAppSwitcher={nav.handleCloseAppSwitcher}
						onNavigate={(path) => nav.handleNavigate(path === "/" ? "/studio" : path)}
						onHoverEnter={handleSidebarHoverEnter}
						onHoverLeave={handleSidebarHoverLeave}
					/>
				</div>
			) : null}

			<div className="relative flex min-h-0 min-w-0 flex-1 flex-col">
				{!embedded ? (
					<div
						className="flex shrink-0 items-center border-b px-3 transition-[padding] duration-medium ease-in-out"
						style={{
							...headerHeightStyle,
							paddingLeft: chat.sidebarOpen ? undefined : `${TOP_NAV_COLLAPSED_HEADER_PADDING_PX}px`,
							borderColor: token("color.border"),
							backgroundColor: token("elevation.surface"),
							viewTransitionName: "persistent-header" as never,
						}}
					>
						<div className="relative flex min-w-0 flex-1 items-center justify-start gap-2">
							<div
								ref={nav.searchContainerRef}
								className="relative flex h-9 w-full items-center"
							>
								<InputGroup
									className={cn(
										"h-8 origin-center rounded-md bg-bg-input shadow-none transition-[transform,background-color,box-shadow] duration-medium ease-out hover:bg-bg-input-hovered",
										"has-[[data-slot=input-group-control]:focus-visible]:border-transparent has-[[data-slot=input-group-control]:focus-visible]:ring-0",
										nav.isSearchFocused && "scale-y-[1.15]",
										nav.isSearchFocused && "relative z-[1001]",
									)}
									style={
										nav.isSearchFocused
											? {
													backgroundColor: token("elevation.surface.overlay"),
													boxShadow: token("elevation.shadow.overlay"),
												}
											: undefined
									}
								>
									<InputGroupAddon align="inline-start">
										<span className="size-4 shrink-0 text-icon-subtle">
											<SearchIcon label="" spacing="none" />
										</span>
									</InputGroupAddon>
									<InputGroupInput
										type="search"
										aria-label="Search"
										value={nav.searchValue}
										onChange={(event) => nav.setSearchValue(event.currentTarget.value)}
										onFocus={nav.handleFocusSearch}
										onKeyDown={nav.handleSearchKeyDown}
										placeholder="Search"
										className="h-full text-sm placeholder:text-sm [&::-webkit-search-cancel-button]:hidden [&::-webkit-search-decoration]:hidden [&::-webkit-search-results-button]:hidden [&::-webkit-search-results-decoration]:hidden"
									/>
								</InputGroup>
								<SearchSuggestionsPanel
									anchorRef={nav.searchContainerRef}
									isVisible={nav.isSearchFocused}
									onSearchAllApps={nav.handleSearchAllApps}
									onRecentItemClick={nav.handleRecentItemClick}
									onRecentSearchClick={nav.handleRecentSearchClick}
									panelRef={nav.searchPanelRef}
								/>
							</div>

							<CreateButton />
						</div>
						<RightNavigation
							product="studio"
							windowWidth={nav.windowWidth}
							forceShowRovoAction={shouldShowAgentConfigPane}
							isChatOpen={nav.isSidebarChatOpen}
							onToggleChat={handleToggleAskRovoChat}
							onToggleTheme={nav.toggleTheme}
						/>
					</div>
				) : null}
				{shouldShowChatHeader ? (
					<RovoAppHeader
						artifactMenuItems={artifactMenuItems}
						isArtifactOpen={isArtifactOpen}
						onNewChat={() => {
							setOptimisticUserMessage(null);
							void chat.openNewChat();
						}}
						onOpenDocument={(documentId) => void chat.openDocument(documentId)}
						onSendModeChange={chat.setSendMode}
						sendMode={chat.sendMode}
					/>
				) : null}
				<main
					ref={shellRef}
					className={cn(
						"relative flex min-h-0 min-w-0 flex-1 bg-background text-foreground",
						!shouldShowAgentConfigPane && "px-3",
					)}
					style={{
						marginRight: isStudioAskRovoChatActive ? `${askRovoChatPanelWidth}px` : "0px",
						transition: askRovoChatResize.isResizing
							? undefined
							: "margin-right var(--duration-medium) var(--ease-in-out)",
					}}
				>
					<RovoAppShellPaneLayout
						agentConfigPane={agentConfigPane}
						artifactOrigin={artifactOrigin}
						artifactPane={artifactPane}
						artifactPanelId={ROVO_APP_SPLIT_ARTIFACT_PANEL_ID}
						chatPane={chatPaneContainer}
						chatPanelId={ROVO_APP_SPLIT_CHAT_PANEL_ID}
						minArtifactPaneWidth={ROVO_APP_MIN_ARTIFACT_PANE_WIDTH}
						minChatPaneWidth={ROVO_APP_MIN_CHAT_PANE_WIDTH}
						onArtifactSplitLayoutChanged={handleArtifactSplitLayoutChanged}
						shouldShowAgentConfigPane={shouldShowAgentConfigPane}
						shouldSplitArtifactPane={shouldSplitArtifactPane}
						shellSize={shellSize}
						splitArtifactPaneDefaultSize={splitArtifactPaneDefaultSize}
						splitChatPaneDefaultSize={splitChatPaneDefaultSize}
						splitChatPaneMaxSize={splitChatPaneMaxSize}
					/>
				</main>
				{!embedded && shouldShowAgentConfigPane ? (
					<div
						ref={askRovoPanelRef}
						data-shell-chrome=""
						aria-hidden={!isStudioAskRovoChatActive}
						{...(!isStudioAskRovoChatActive ? { inert: true } : {})}
						style={{
							position: "absolute",
							top: TOP_NAV_HEADER_HEIGHT_PX,
							right: 0,
							bottom: 0,
							width: `${askRovoChatPanelWidth}px`,
							pointerEvents: isStudioAskRovoChatActive ? "auto" : "none",
							transform: isStudioAskRovoChatActive
								? "translateX(0)"
								: `translateX(${askRovoChatPanelWidth}px)`,
							transition: askRovoChatResize.isResizing
								? undefined
								: "transform var(--duration-medium) var(--ease-in-out)",
							willChange: "transform",
							zIndex: 90,
						}}
					>
						<ChatPanel
							onClose={nav.toggleChat}
							abortOnUnmount={false}
							chatContextBar={agentEditContextBar}
							greeting={agentEditGreeting}
							onInterceptSubmit={handleAgentEditInterceptSubmit}
							hideComposerSourceAndModelControls={Boolean(agentEditContextBar)}
							// No left border here: the SidebarResizeHandle below paints the divider.
							// Keeping the panel's own `border-l` too would stack two translucent
							// `color.border` lines into a darker double-edge.
							containerStyle={{ borderRadius: 0, borderWidth: 0 }}
						/>
						<SidebarResizeHandle
							side="left"
							data-active={askRovoChatResize.isResizing ? "" : undefined}
							onDoubleClick={askRovoChatResize.onResizeHandleDoubleClick}
							onPointerDown={askRovoChatResize.onResizeHandlePointerDown}
							onPointerEnter={askRovoChatResize.onResizeHandlePointerEnter}
							onPointerLeave={askRovoChatResize.onResizeHandlePointerLeave}
						/>
					</div>
				) : null}
			</div>
			<ClickyOverlay
				state={clicky.state}
				paintingActive={screenAssistantRegionPainting}
				pointTarget={clicky.pointTarget}
				responseText={clicky.responseText}
				onReturnToIdle={clickyReturnToIdle}
			/>
			<ScreenAssistantRegionOverlay
				active={isClickyActive}
				getVisibleTargets={getScreenAssistantVisibleTargets}
				onPaintingChange={setScreenAssistantRegionPainting}
				onRegionChange={setScreenAssistantRegion}
				region={screenAssistantRegion}
			/>
			{agentOnboardingTour.isActive && agentOnboardingTour.anchorElement && agentOnboardingTour.step ? (
				<SpotlightTarget
					open
					anchor={agentOnboardingTour.anchorElement}
					placement={agentOnboardingTour.step.placement}
					onOpenChange={(next) => {
						if (!next) {
							agentOnboardingTour.dismiss();
						}
					}}
					content={
						<SpotlightCard className="w-72">
							<SpotlightHeader>
								<SpotlightHeadline>{agentOnboardingTour.step.headline}</SpotlightHeadline>
								<SpotlightControls>
									<SpotlightDismissControl onClick={agentOnboardingTour.dismiss} />
								</SpotlightControls>
							</SpotlightHeader>
							<SpotlightBody>{agentOnboardingTour.step.body}</SpotlightBody>
							<SpotlightFooter>
								<SpotlightStepCount
									current={agentOnboardingTour.stepIndex + 1}
									total={agentOnboardingTour.total}
								/>
								<SpotlightActions>
									{!agentOnboardingTour.isFirst ? (
										<SpotlightSecondaryAction onClick={agentOnboardingTour.back}>
											Back
										</SpotlightSecondaryAction>
									) : null}
									<SpotlightPrimaryAction
										onClick={
											agentOnboardingTour.isLast
												? agentOnboardingTour.dismiss
												: agentOnboardingTour.next
										}
									>
										{agentOnboardingTour.isLast ? "Finish" : "Next"}
									</SpotlightPrimaryAction>
								</SpotlightActions>
							</SpotlightFooter>
						</SpotlightCard>
					}
				/>
			) : null}
		</SidebarProvider>
	);
}
