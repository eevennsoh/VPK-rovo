"use client";

// oxlint-disable react-doctor/exhaustive-deps -- Effects in this file intentionally coordinate refs, external animation loops, timers, subscriptions, or measured DOM state; dependencies are constrained to avoid restarting those bridges.
// oxlint-disable react-doctor/jsx-no-jsx-as-prop -- These components intentionally use slot/render-node props for icons, triggers, and adornments.
// oxlint-disable react-doctor/no-event-handler -- Effects in this file bridge external systems, animation/media state, timers, or parent-controlled state rather than user event handlers.
// oxlint-disable react-doctor/no-initialize-state -- These components intentionally seed local interactive state from props or external runtime state before user edits take ownership.
// oxlint-disable react-doctor/no-pass-data-to-parent -- Callbacks in this file intentionally report measured, generated, or selected data to an owning parent component.

/* eslint-disable react-hooks/exhaustive-deps -- These callbacks/effects intentionally read stable refs that bridge external animation, drag, preview, and editor state. */

import { Fragment, useEffect, useMemo, useCallback, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { DEFAULT_REASONING_OPTION_ID } from "@/components/blocks/shared-ui/data/customize-menu-data";
import { useRovoChat } from "@/app/contexts";
import type { SendPromptOptions } from "@/app/contexts";
import type { ChatContextBarDescriptor } from "./lib/chat-context-bar";
import type { ChatSurfaceSwitchHandler } from "@/components/projects/shared/components/chat-surface-switcher";
import { useLazyRef } from "@/lib/use-lazy-ref";
import {
	Conversation,
	ConversationContent,
	ConversationScrollButton,
} from "@/components/ui-custom/conversation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import CheckMarkIcon from "@atlaskit/icon/core/check-mark";
import EditIcon from "@atlaskit/icon/core/edit";
import { MessageTurns } from "@/components/projects/shared/message-turns";
import {
	getMessageAgentResult,
	getMessageArtifactResult,
	hasTurnCompleteSignal,
	isRenderableRovoUIMessage,
	type RovoDataParts,
} from "@/lib/rovo-ui-messages";
import { mergeRovoContextDescriptions } from "@/lib/rovo-context";
import {
	buildClarificationMessageMetadata,
	buildClarificationDismissPrompt,
	buildClarificationSummaryPrompt,
	createClarificationSubmission,
	getLatestQuestionCardPayload,
	type ClarificationAnswers,
	type ParsedQuestionCardPayload,
} from "@/components/projects/shared/lib/question-card-widget";
import {
	getLatestPendingPlanWidget,
	type ParsedPlanWidgetPayload,
} from "@/components/projects/shared/lib/plan-widget";
import {
	getPlanApprovalKeyFromPlanWidget,
	type PlanApprovalSelection,
} from "@/components/projects/shared/lib/plan-approval";
import { buildGenerativeWidgetSubmitPrompt, type GenerativeWidgetPrimaryActionPayload } from "@/components/projects/shared/lib/generative-widget";
import type { GenerativeCardAnimationProps } from "@/components/projects/shared/components/generative-widget-card";
import { ClarificationQuestionCard } from "@/components/projects/shared/components/clarification-question-card";
import { QuestionCardShortcutsFooter } from "@/components/projects/shared/components/question-card-shortcuts-footer";
import { ApprovalCard } from "@/components/blocks/approval-card/page";
import { useDismissibleCards } from "@/components/projects/shared/hooks/use-dismissible-cards";
import type { RovoSuggestion } from "@/lib/rovo-suggestions";
import type { ComposerDirectoryAutocompleteController } from "@/components/ui-custom/rich-text-editor";
import type { DirectoryAutocompleteState } from "@/lib/directory-autocomplete";
import { isRovoAgentProfile, type RovoAgentProfile } from "@/app/data/directory/agents";
import ChatHeader from "./components/chat-header";
import { ChatHistoryDrawer } from "./components/chat-history-drawer";
import ChatGreeting from "./components/chat-greeting";
import ChatComposer from "./components/chat-composer";
import MessageBubble from "./components/message-bubble";
import { AgentActivityTimeline } from "./components/agent-activity-timeline";
import { ArtifactResultCard, type ArtifactResult } from "./components/artifact-result-card";
import { AgentResultCard, isGeneratedAgentResult } from "./components/agent-result-card";
import { StreamingThinkingIndicator } from "./components/streaming-thinking-indicator";
import { PreloadThinkingIndicator } from "@/components/projects/shared/components/preload-thinking-indicator";
import { chatStyles } from "./data/styles";
import { cn } from "@/lib/utils";
import { useChatSubmit, type ChatSubmitInterceptOutcome } from "./hooks/use-chat-submit";
import { useScrollAnchor } from "./hooks/use-scroll-anchor";
import { useThinkingStatus } from "./hooks/use-thinking-status";
import { appendOptimisticCompactUserMessage } from "./lib/optimistic-user-message";
import { type DelegationRequest, useRealtimeVoice } from "@/components/projects/rovo/hooks/use-realtime-voice";
import { appendDictationTranscript, resolveComposerDictationState, restoreDictationBaseline } from "@/lib/composer-dictation";
import { useClicky } from "@/components/projects/rovo/hooks/use-clicky";
import { useClickyVoice } from "@/components/projects/rovo/hooks/use-clicky-voice";
import { ClickyOverlay } from "@/components/projects/rovo/components/clicky/clicky-overlay";
import { parseClickyResponse } from "@/components/projects/rovo/lib/clicky-point-parser";
import styles from "./chat.module.css";

export type { ChatSubmitInterceptOutcome } from "./hooks/use-chat-submit";

interface ChatPanelCardsProps {
	generativeAnimation?: GenerativeCardAnimationProps;
}

type GeneratedResult =
	| { type: "artifact"; result: ArtifactResult }
	| { type: "agent"; result: RovoDataParts["agent-result"] };

export interface ChatPanelGreetingProps {
	heading?: string;
	illustrationSrc?: string;
	illustrationDarkSrc?: string;
	showHero?: boolean;
	suggestions?: ReadonlyArray<RovoSuggestion>;
}

export interface ChatPanelCustomAgentTabs {
	activity?: ReactNode;
	trigger?: ReactNode;
}

export interface ChatPanelAgentVersionOption {
	id: string;
	label: string;
	variant?: "neutral" | "success";
	sectionBreakBefore?: boolean;
	/**
	 * Marks the currently published / live version. The dropdown renders a
	 * "Current" text label (outside the badge) on this row so users can tell
	 * which version is live, independent of which one they have selected to
	 * preview.
	 */
	isCurrent?: boolean;
}

interface ChatPanelProps {
	onClose: () => void;
	sendPromptOptions?: SendPromptOptions;
	enableSmartWidgets?: boolean;
	cards?: ChatPanelCardsProps;
	greeting?: ChatPanelGreetingProps;
	customAgentTabs?: ChatPanelCustomAgentTabs;
	/**
	 * When true, renders the agent Test-mode-only controls in the custom
	 * agent tab header: the version dropdown and the new-chat/edit button.
	 * Other custom-agent tab surfaces (e.g. the RFP report canvas) keep these
	 * hidden, so this must only be set by the agent Test panel. It also keeps
	 * the custom agent tab list (Chat / Trigger / Activity) as a centered pill;
	 * every other surface renders the tab list full width.
	 */
	showAgentTestControls?: boolean;
	agentVersionOptions?: readonly ChatPanelAgentVersionOption[];
	selectedAgentVersionId?: string;
	onAgentVersionChange?: (versionId: string) => void;
	/**
	 * Optional override appended to the scrollable conversation content
	 * wrapper. Used to align the conversation body's horizontal padding with
	 * a surrounding header (e.g. the agent Test panel matches its `px-6`
	 * header). Shared chat surfaces omit this to keep the default `px-4`.
	 */
	conversationContentClassName?: string;
	/**
	 * Optional override appended to the compact chat composer wrapper. Shared
	 * chat surfaces omit this to keep the default `px-3`; the Studio agent Test
	 * panel passes `px-0` because the surrounding panel already supplies the
	 * 24px horizontal inset.
	 */
	composerContainerClassName?: string;
	/**
	 * When true, the bottom-aligned Test greeting reserves vertical space equal
	 * to a single-line chat context bar below its last conversation starter.
	 * The Studio agent Test panel sets this because its sibling Ask Rovo panel
	 * renders an "Edit:" context bar above its composer; reserving the matching
	 * footprint keeps the two greetings' last prompts on the same baseline.
	 */
	composerReservesContextBarSpace?: boolean;
	greetingSelectedAgent?: RovoAgentProfile | null;
	hideAiCursor?: boolean;
	hideComposerSourceAndModelControls?: boolean;
	hideHeader?: boolean;
	headerVariant?: "default" | "minimal";
	abortOnUnmount?: boolean;
	/**
	 * Optional deterministic submit interceptor. When provided and it reports the
	 * prompt as handled, the composer submission skips the model entirely — the
	 * user message and the returned `assistantReply` are injected locally. Used by
	 * the studio agent-edit ("Improve your agent?") chat to apply scripted agent
	 * edits; absent for normal conversational chats (including the agent test
	 * chat, which must stay a real conversation).
	 */
	onInterceptSubmit?: (text: string) => ChatSubmitInterceptOutcome;
	containerClassName?: string;
	containerStyle?: CSSProperties;
	onSurfaceSwitch?: ChatSurfaceSwitchHandler;
	chatContextBar?: ChatContextBarDescriptor | null;
	onArtifactResult?: (artifact: ArtifactResult) => void;
	onArtifactDialogOpen?: (artifact: ArtifactResult) => void;
	preserveFloatingSurfaceOnArtifactDialogOpen?: boolean;
}

const COMPACT_CHAT_WIDTH_MAX = 520;

/**
 * Footprint of a single-line chat context bar (the "Edit:" pill above the
 * sidebar composer): the pill's `py-2` + small-icon line height (~36px) plus
 * its `mb-3` bottom margin (12px). The bottom-aligned Test greeting reserves
 * this much space below its last starter so it lines up with the sibling Ask
 * Rovo greeting, whose composer carries that context bar. Keep in sync with
 * `ContextBar` in components/ui-custom/context-bar/context-bar.tsx.
 */
const CONTEXT_BAR_RESERVED_SPACE_PX = 48;
/**
 * Vertical gap the Test layout inserts between the conversation track and the
 * composer (the `gap-3` on the empty-state wrapper below). The sibling Ask Rovo
 * composer has no such gap, so the bottom-aligned Test greeting subtracts it
 * from its reserved space to keep its last starter level with the Ask Rovo one.
 * Keep in sync with the `gap-3` on the agent-test empty-state wrapper.
 */
const AGENT_TEST_COMPOSER_GAP_PX = 12;
const REGULAR_CHAT_WIDTH_MAX = 900;
const ARTIFACT_DIALOG_FLOATING_PIN_REASON = "sidebar-chat-artifact-dialog";
const DEFAULT_AGENT_VERSION_OPTIONS: readonly ChatPanelAgentVersionOption[] = [
	{ id: "draft", label: "Draft", variant: "neutral" },
	{ id: "version-2", label: "V2", variant: "success", sectionBreakBefore: true, isCurrent: true },
	{ id: "version-1", label: "V1", variant: "success" },
];

type SmartWidthClass = "compact" | "regular" | "wide";

type RealtimeTranscriptPayload =
	| string
	| {
			delta?: string;
			text?: string;
			transcript?: string;
	  };

function getSmartWidthClass(widthPx: number): SmartWidthClass {
	if (widthPx <= COMPACT_CHAT_WIDTH_MAX) return "compact";
	if (widthPx <= REGULAR_CHAT_WIDTH_MAX) return "regular";
	return "wide";
}

function getRealtimeTranscriptText(payload: RealtimeTranscriptPayload): string {
	if (typeof payload === "string") {
		return payload;
	}

	return payload.text ?? payload.transcript ?? payload.delta ?? "";
}

function CustomAgentTabEmptyState({
	description,
	title,
}: Readonly<{
	description: string;
	title: string;
}>): React.ReactElement {
	return (
		<div className="flex min-h-[220px] items-center justify-center p-6 text-center">
			<div className="max-w-[280px] space-y-2">
				<h3 className="text-sm font-semibold text-text">{title}</h3>
				<p className="text-sm leading-6 text-text-subtle">{description}</p>
			</div>
		</div>
	);
}

function isCustomAgentTabsProfile(agent: { byline?: string }): boolean {
	return /\bcustom agent\b/iu.test(agent.byline ?? "");
}

export default function ChatPanel({
	onClose,
	sendPromptOptions,
	enableSmartWidgets = false,
	cards,
	greeting,
	greetingSelectedAgent,
	customAgentTabs,
	showAgentTestControls = false,
	agentVersionOptions = DEFAULT_AGENT_VERSION_OPTIONS,
	selectedAgentVersionId,
	onAgentVersionChange,
	conversationContentClassName,
	composerContainerClassName,
	composerReservesContextBarSpace = false,
	hideAiCursor = false,
	hideComposerSourceAndModelControls = false,
	hideHeader = false,
	headerVariant = "default",
	abortOnUnmount = true,
	onInterceptSubmit,
	containerClassName,
	containerStyle,
	onSurfaceSwitch,
	chatContextBar,
	onArtifactResult,
	onArtifactDialogOpen,
	preserveFloatingSurfaceOnArtifactDialogOpen = false,
}: Readonly<ChatPanelProps>): React.ReactElement {
	const {
		resetChat,
		uiMessages: rawUiMessages,
		sendPrompt,
		acceptPlanReview,
		submitPlanApproval,
		editMessage,
		editingMessageId,
		setEditingMessageId,
		chatSurface,
		activeThreadId,
		selectedAgent,
		selectableAgents,
		selectAgent,
		getSessionAgentEntry,
		isCustomAgentSelected,
		activePrompt,
		isHistoryOpen,
		pinFloating,
		toggleHistory,
		unpinFloating,
	} = useRovoChat();
	const panelRef = useRef<HTMLDivElement | null>(null);
	const artifactDialogFloatingPinRef = useRef(false);
	const reportedArtifactResultKeysRef = useLazyRef<Set<string>>(() => new Set());
	const [containerWidthPx, setContainerWidthPx] = useState<number | null>(null);
	const [viewportWidthPx, setViewportWidthPx] = useState<number | null>(null);
	const [selectedReasoning, setSelectedReasoning] = useState(DEFAULT_REASONING_OPTION_ID);
	const [directoryAutocompleteState, setDirectoryAutocompleteState] = useState<DirectoryAutocompleteState | null>(null);
	const [directoryAutocompleteController, setDirectoryAutocompleteController] = useState<ComposerDirectoryAutocompleteController | null>(null);
	const [uncontrolledAgentVersionId, setUncontrolledAgentVersionId] = useState<string>(agentVersionOptions[0]?.id ?? "draft");
	const fallbackAgentVersionId = agentVersionOptions[0]?.id ?? DEFAULT_AGENT_VERSION_OPTIONS[0].id;
	const resolvedUncontrolledAgentVersionId = agentVersionOptions.some((version) => version.id === uncontrolledAgentVersionId)
		? uncontrolledAgentVersionId
		: fallbackAgentVersionId;
	const resolvedAgentVersionId = selectedAgentVersionId ?? resolvedUncontrolledAgentVersionId;
	const selectedAgentVersion =
		agentVersionOptions.find((version) => version.id === resolvedAgentVersionId) ??
		agentVersionOptions[0] ??
		DEFAULT_AGENT_VERSION_OPTIONS[0];
	const isCollapsibleEditContextBar = Boolean(chatContextBar?.collapsible && chatContextBar.variant === "edit");
	const [contextBarOpenState, setContextBarOpenState] = useState({
		isOpen: true,
		signature: chatContextBar?.signature,
	});
	let resolvedContextBarOpenState = contextBarOpenState;
	if (contextBarOpenState.signature !== chatContextBar?.signature) {
		resolvedContextBarOpenState = {
			isOpen: true,
			signature: chatContextBar?.signature,
		};
		setContextBarOpenState(resolvedContextBarOpenState);
	}
	const isContextBarOpen = resolvedContextBarOpenState.isOpen;
	const setIsContextBarOpen = (isOpen: boolean) => {
		setContextBarOpenState((currentState) => ({ ...currentState, isOpen }));
	};

	useEffect(() => {
		if (agentVersionOptions.some((version) => version.id === resolvedAgentVersionId)) {
			return;
		}

		onAgentVersionChange?.(fallbackAgentVersionId);
	}, [agentVersionOptions, fallbackAgentVersionId, onAgentVersionChange, resolvedAgentVersionId]);

	useEffect(() => {
		const updateViewportWidth = () => {
			if (typeof window === "undefined") return;
			const width = Math.max(1, Math.round(window.innerWidth));
			setViewportWidthPx((prev) => (prev === width ? prev : width));
		};

		updateViewportWidth();
		window.addEventListener("resize", updateViewportWidth);
		return () => window.removeEventListener("resize", updateViewportWidth);
	}, []);

	useEffect(() => {
		const panelElement = panelRef.current;
		if (!panelElement) return;

		const updateContainerWidth = (widthValue: number) => {
			const width = Math.max(1, Math.round(widthValue));
			setContainerWidthPx((prev) => (prev === width ? prev : width));
		};

		updateContainerWidth(panelElement.getBoundingClientRect().width);

		if (typeof ResizeObserver !== "function") return;

		const observer = new ResizeObserver((entries) => {
			const entry = entries[0];
			if (!entry) return;
			updateContainerWidth(entry.contentRect.width);
		});

		observer.observe(panelElement);
		return () => observer.disconnect();
	}, []);

	const resolvedSendPromptOptions = useMemo(() => {
		if (!sendPromptOptions?.smartGeneration) return sendPromptOptions;

		const widthSource = containerWidthPx ?? viewportWidthPx;
		const widthClass = widthSource ? getSmartWidthClass(widthSource) : undefined;

		return {
			...sendPromptOptions,
			smartGeneration: {
				...sendPromptOptions.smartGeneration,
				containerWidthPx: containerWidthPx ?? undefined,
				viewportWidthPx: viewportWidthPx ?? undefined,
				widthClass,
			},
		};
	}, [containerWidthPx, sendPromptOptions, viewportWidthPx]);

	const {
		prompt,
		setPrompt,
		handleSubmit,
		submitPrompt,
		interceptSubmit,
		abort,
		uiMessages,
		isStreaming,
		hasInFlightTurn,
		isSubmitPending,
		activeRequestStartedAt,
		localThinkingAssistantMessageId,
		queuedPrompts,
		removeQueuedPrompt,
	} = useChatSubmit({
		defaultPromptOptions: resolvedSendPromptOptions,
		onInterceptSubmit,
		requireIntercept: isCollapsibleEditContextBar && isContextBarOpen,
	});

	// --- Rovo AI cursor companion (Clicky) ---
	const clicky = useClicky();
	const {
		toggle: toggleClicky,
		isActive: isClickyActive,
		deactivate: deactivateClicky,
		startListening: clickyStartListening,
		startProcessing: clickyStartProcessing,
		startPointing: clickyStartPointing,
		startSpeaking: clickyStartSpeaking,
		returnToIdle: clickyReturnToIdle,
		addExchange: clickyAddExchange,
		screenshotDimensions: clickyScreenshotDimensions,
		setScreenshotDimensions: clickySetScreenshotDimensions,
	} = clicky;

	useEffect(() => {
		if (hideAiCursor && isClickyActive) {
			deactivateClicky();
		}
	}, [deactivateClicky, hideAiCursor, isClickyActive]);

	// Cmd+Shift+K (Mac) / Ctrl+Shift+K toggles the AI cursor; Escape deactivates it.
	useEffect(() => {
		if (hideAiCursor) {
			return;
		}

		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "K" && e.shiftKey && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				toggleClicky();
				return;
			}

			if (e.key === "Escape" && isClickyActive) {
				deactivateClicky();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [deactivateClicky, hideAiCursor, isClickyActive, toggleClicky]);

	const realtimeTranscriptRef = useRef("");
	const promptRef = useRef(prompt);
	const dictationBaselineRef = useRef<string | null>(null);
	const isDictationActiveRef = useRef(false);
	const [isDictationActive, setIsDictationActive] = useState(false);
	const [dictationTranscriptPreview, setDictationTranscriptPreview] = useState<string | null>(null);

	useEffect(() => {
		promptRef.current = prompt;
	}, [prompt]);

	const handleRealtimeSpeechStarted = useCallback(() => {
		realtimeTranscriptRef.current = "";

		if (isDictationActiveRef.current) {
			setDictationTranscriptPreview(null);
			return;
		}

		// Clicky runs a private voice + screenshot loop; leave the composer untouched.
		if (isClickyActive) {
			clickyStartListening();
			return;
		}

		setPrompt("");
	}, [isClickyActive, clickyStartListening, setPrompt]);
	const handleRealtimeTranscript = useCallback((payload: RealtimeTranscriptPayload) => {
		// Suppress live transcript deltas in the composer while Clicky is active.
		if (isClickyActive) {
			return;
		}

		const transcriptText = getRealtimeTranscriptText(payload);
		if (!transcriptText.trim()) {
			return;
		}

		if (isDictationActiveRef.current) {
			setDictationTranscriptPreview(transcriptText);
			return;
		}

		realtimeTranscriptRef.current = transcriptText;
		setPrompt(transcriptText);
	}, [isClickyActive, setPrompt]);
	const handleRealtimeTranscriptCompleted = useCallback((payload: RealtimeTranscriptPayload) => {
		const transcriptText = getRealtimeTranscriptText(payload);

		if (isDictationActiveRef.current) {
			const nextText = appendDictationTranscript(promptRef.current, transcriptText);
			promptRef.current = nextText;
			setDictationTranscriptPreview(transcriptText);
			setPrompt(nextText);
			return;
		}

		// Clicky: transition to processing and record the user's spoken question
		// instead of routing it into the chat composer/thread.
		if (isClickyActive) {
			clickyStartProcessing();
			if (transcriptText.trim()) {
				clickyAddExchange({ role: "user", content: transcriptText });
			}
			return;
		}

		if (!transcriptText.trim()) {
			return;
		}

		realtimeTranscriptRef.current = transcriptText;
		setPrompt(transcriptText);
	}, [isClickyActive, clickyStartProcessing, clickyAddExchange, setPrompt]);
	const handleRealtimeAssistantTextCompleted = useCallback((payload: { messageId?: string; text?: string } | string) => {
		if (isDictationActiveRef.current) {
			return;
		}

		// Only Clicky consumes the realtime model's own text response (POINT tags);
		// normal voice mode delegates to the Rovo chat stream instead.
		if (!isClickyActive) {
			return;
		}

		const text = typeof payload === "string" ? payload : (payload.text ?? "");
		if (!text) {
			return;
		}

		const parsed = parseClickyResponse(text, clickyScreenshotDimensions);
		clickyAddExchange({ role: "assistant", content: parsed.text || text });
		if (parsed.point) {
			clickyStartPointing(parsed.point, parsed.text);
		} else {
			clickyStartSpeaking(text);
		}
	}, [isClickyActive, clickyScreenshotDimensions, clickyAddExchange, clickyStartPointing, clickyStartSpeaking]);
	const handleRealtimeDelegateToRovo = useCallback(
		(request: DelegationRequest) => {
			if (isDictationActiveRef.current) {
				return;
			}

			// Clicky's spoken queries must never delegate into the chat thread.
			if (isClickyActive) {
				return;
			}

			const promptText = request.prompt.trim();
			if (!promptText) {
				return;
			}

			const contextDescription = mergeRovoContextDescriptions(
				resolvedSendPromptOptions?.contextDescription,
				request.conversationSummary ? `[Voice context] ${request.conversationSummary}` : undefined,
			);
			const promptOptions = contextDescription
				? {
						...resolvedSendPromptOptions,
						contextDescription,
					}
				: resolvedSendPromptOptions;
			realtimeTranscriptRef.current = "";
			setPrompt("");
			void sendPrompt(promptText, promptOptions);
		},
		[isClickyActive, resolvedSendPromptOptions, sendPrompt, setPrompt],
	);
	const realtime = useRealtimeVoice({
		chatMessages: uiMessages,
		isGenerating: isStreaming,
		onDelegateToRovo: handleRealtimeDelegateToRovo,
		onSpeechStarted: handleRealtimeSpeechStarted,
		onSpeechTranscriptCompleted: handleRealtimeTranscriptCompleted,
		onSpeechTranscriptDelta: handleRealtimeTranscript,
		onAssistantTextCompleted: handleRealtimeAssistantTextCompleted,
	});

	// --- Clicky voice bridge: connects realtime + injects prompt + sends screenshots ---
	useClickyVoice({
		clickyState: clicky.state,
		isClickyActive,
		sendImageInput: realtime.sendImageInput,
		isRealtimeConnected: realtime.isConnected,
		connectRealtime: realtime.connect,
		disconnectRealtime: realtime.disconnect,
		injectContext: realtime.injectContext,
		onScreenshotCaptured: clickySetScreenshotDimensions,
	});
	const isRealtimeVoiceActive = realtime.voiceState !== "idle";
	const dictationState = resolveComposerDictationState({
		active: isDictationActive,
		voiceState: realtime.voiceState,
	});
	const handleCancelDictation = useCallback(() => {
		const restoredText = restoreDictationBaseline(dictationBaselineRef.current);
		dictationBaselineRef.current = null;
		isDictationActiveRef.current = false;
		promptRef.current = restoredText;
		setIsDictationActive(false);
		setDictationTranscriptPreview(null);
		setPrompt(restoredText);
		realtime.disconnect();
	}, [realtime, setPrompt]);
	const handleAcceptDictation = useCallback(() => {
		dictationBaselineRef.current = null;
		isDictationActiveRef.current = false;
		setIsDictationActive(false);
		setDictationTranscriptPreview(null);
		realtime.disconnect();
	}, [realtime]);
	const handleStartDictation = useCallback(() => {
		if (realtime.voiceState !== "idle") {
			realtimeTranscriptRef.current = "";
			realtime.disconnect();
		}

		const baselineText = promptRef.current;
		dictationBaselineRef.current = baselineText;
		isDictationActiveRef.current = true;
		setIsDictationActive(true);
		setDictationTranscriptPreview(null);
		realtime.connect({ transcriptionOnly: true });
	}, [realtime]);
	const handleToggleRealtimeVoice = useCallback(() => {
		if (realtime.voiceState === "idle") {
			if (isDictationActiveRef.current) {
				dictationBaselineRef.current = null;
				isDictationActiveRef.current = false;
				setIsDictationActive(false);
				setDictationTranscriptPreview(null);
			}

			realtimeTranscriptRef.current = "";
			setPrompt("");
			realtime.connect();
			return;
		}

		const transcriptToPreserve = realtime.currentTranscript || realtimeTranscriptRef.current;
		realtime.disconnect();
		if (transcriptToPreserve.trim()) {
			setPrompt(transcriptToPreserve);
		}
	}, [realtime, setPrompt]);
	const isStreamingLifecycleActive = isStreaming || isSubmitPending;
	const isRequestInFlight = hasInFlightTurn;
	const hasPendingChatWork = isRequestInFlight || queuedPrompts.length > 0;

	const rawMessages = useMemo(() => uiMessages.filter(isRenderableRovoUIMessage), [uiMessages]);
	const optimisticPrompt = activePrompt ?? (isSubmitPending ? queuedPrompts[0] ?? null : null);
	const messages = useMemo(
		() => appendOptimisticCompactUserMessage(rawMessages, optimisticPrompt),
		[optimisticPrompt, rawMessages]
	);

	useEffect(() => {
		if (!onArtifactResult) {
			return;
		}

		for (const message of messages) {
			const artifactResult = getMessageArtifactResult(message);
			if (!artifactResult) {
				continue;
			}

			const resultKey = `${message.id}:${artifactResult.documentId}:${artifactResult.action}`;
			if (reportedArtifactResultKeysRef.current.has(resultKey)) {
				continue;
			}

			reportedArtifactResultKeysRef.current.add(resultKey);
			onArtifactResult(artifactResult);
		}
	}, [messages, onArtifactResult]);
	const lastAssistantMessageId = useMemo(() => {
		for (let i = messages.length - 1; i >= 0; i--) {
			if (messages[i].role === "assistant") {
				return messages[i].id;
			}
		}
		return null;
	}, [messages]);

	const activeQuestionCard = useMemo(() => getLatestQuestionCardPayload(rawUiMessages), [rawUiMessages]);
	const handleClarificationDismiss = useCallback(
		(questionCard: ParsedQuestionCardPayload) => {
			const dismissPrompt = buildClarificationDismissPrompt(questionCard);
			void sendPrompt(dismissPrompt, {
				...resolvedSendPromptOptions,
				messageMetadata: {
					...(resolvedSendPromptOptions?.messageMetadata ?? {}),
					...buildClarificationMessageMetadata(questionCard, {
						status: "dismissed",
					}),
				},
			});
		},
		[resolvedSendPromptOptions, sendPrompt],
	);

	const {
		shouldShowQuestionCard: shouldShowQuestionCardRaw,
		activeQuestionCardKey,
		hideQuestionCard,
		dismissQuestionCard,
	} = useDismissibleCards({
		activeQuestionCard,
		onDismissQuestionCard: handleClarificationDismiss,
	});
	const shouldShowQuestionCard = !isRequestInFlight && shouldShowQuestionCardRaw;
	const activePendingPlan = useMemo(() => getLatestPendingPlanWidget(rawUiMessages), [rawUiMessages]);
	const [dismissedApprovalCardKey, setDismissedApprovalCardKey] = useState<string | null>(null);
	const [isSubmittingPlanApproval, setIsSubmittingPlanApproval] = useState(false);
	const pendingPlanKey = activePendingPlan?.planWidget.deferredToolCallId ?? null;
	const shouldShowApprovalCard =
		activePendingPlan !== null &&
		pendingPlanKey !== dismissedApprovalCardKey &&
		!shouldShowQuestionCard &&
		!isStreamingLifecycleActive;

	useEffect(() => {
		setDismissedApprovalCardKey(null);
		setIsSubmittingPlanApproval(false);
	}, [activeThreadId]);

	const { conversationContextRef, scrollSpacerRef, getLatestTurnTargetTop, scrollFollowMode } = useScrollAnchor({
		enableTargetFollow: chatSurface !== "floating",
		isGenerationActive: isStreamingLifecycleActive,
		uiMessages: messages,
	});

	const thinking = useThinkingStatus({
		messages,
		isRequestInFlight,
		activeRequestStartedAt,
	});

	useEffect(() => {
		if (!abortOnUnmount) return;
		return () => abort();
	}, [abort, abortOnUnmount]);

	const releaseArtifactDialogFloatingPin = useCallback(() => {
		if (!artifactDialogFloatingPinRef.current) {
			return;
		}

		artifactDialogFloatingPinRef.current = false;
		unpinFloating(ARTIFACT_DIALOG_FLOATING_PIN_REASON);
	}, [unpinFloating]);

	useEffect(() => releaseArtifactDialogFloatingPin, [releaseArtifactDialogFloatingPin]);

	const hasMessages = messages.length > 0;
	const resolvedGreeting = isCollapsibleEditContextBar && !isContextBarOpen ? undefined : greeting;
	const isAgentTestEmptyState = showAgentTestControls && !hasMessages;
	// Bottom-align the Test greeting so its last conversation starter lines up
	// with the Ask Rovo greeting's last prompt. Only fall back to vertical
	// centering when the custom agent has no conversation starters to anchor.
	const hasTestGreetingSuggestions = (resolvedGreeting?.suggestions?.length ?? 0) > 0;
	const shouldBottomAlignAgentTestEmptyState = isAgentTestEmptyState && hasTestGreetingSuggestions;
	const shouldCenterAgentTestEmptyState = isAgentTestEmptyState && !hasTestGreetingSuggestions;
	const shouldHugEmptyGreeting = !hasMessages && greeting?.showHero === false;
	const shouldUseNaturalEmptyGreeting = shouldHugEmptyGreeting || isAgentTestEmptyState;
	const shouldUseAutoMessageTrack = shouldUseNaturalEmptyGreeting && containerStyle?.display === "grid";
	const directoryAutocompleteGreetingAgent = greetingSelectedAgent ?? selectedAgent;
	const canShowDirectoryAutocompleteGreeting =
		directoryAutocompleteGreetingAgent === null ||
		isRovoAgentProfile(directoryAutocompleteGreetingAgent);
	const shouldShowDirectoryAutocompleteList =
		!hasMessages &&
		canShowDirectoryAutocompleteGreeting &&
		directoryAutocompleteState !== null &&
		directoryAutocompleteState.matches.length > 0;
	const shouldUseWideDirectoryAutocompleteList =
		(chatSurface !== "floating") &&
		(containerWidthPx ?? viewportWidthPx ?? 0) >= 760;
	const resolvedContainerStyle = shouldUseAutoMessageTrack
		? { ...containerStyle, gridTemplateRows: "auto auto" }
		: containerStyle;

	const handleClarificationSubmit = useCallback(
		(answers: ClarificationAnswers) => {
			if (!activeQuestionCard) return;

			const clarificationSubmission = createClarificationSubmission(activeQuestionCard, answers);
			const clarificationPrompt = buildClarificationSummaryPrompt(activeQuestionCard, answers);

			const clarificationMetadata = {
				...(resolvedSendPromptOptions?.messageMetadata ?? {}),
				...buildClarificationMessageMetadata(activeQuestionCard, {
					answers,
					status: "answered",
				}),
			};

			void sendPrompt(clarificationPrompt, {
				...resolvedSendPromptOptions,
				messageMetadata: clarificationMetadata,
				clarification: clarificationSubmission,
			});
		},
		[activeQuestionCard, resolvedSendPromptOptions, sendPrompt],
	);
	const handleBuildPlan = useCallback(
		(planWidget: ParsedPlanWidgetPayload) => {
			return acceptPlanReview(planWidget);
		},
		[acceptPlanReview],
	);
	const handlePlanApprovalSubmit = useCallback(
		(selection: PlanApprovalSelection) => {
			if (!activePendingPlan) return;
			setIsSubmittingPlanApproval(true);
			void submitPlanApproval(activePendingPlan.planWidget, selection)
				.finally(() => setIsSubmittingPlanApproval(false));
		},
		[activePendingPlan, submitPlanApproval],
	);
	const handleDismissApprovalCard = useCallback(() => {
		setDismissedApprovalCardKey(pendingPlanKey);
	}, [pendingPlanKey]);
	const resolvePlanBuildState = useCallback(
		(planWidget: ParsedPlanWidgetPayload, message: { id: string }) => {
			if (!planWidget.deferredToolCallId) {
				return {};
			}

			const isActivePendingPlan =
				activePendingPlan?.sourceMessageId === message.id &&
				getPlanApprovalKeyFromPlanWidget(activePendingPlan.planWidget) ===
					getPlanApprovalKeyFromPlanWidget(planWidget);
			if (isActivePendingPlan) {
				return {};
			}

			return {
				isBuildDisabled: true,
				buildDisabledReason: activePendingPlan
					? "A newer reply superseded this plan."
					: "This plan is no longer awaiting review.",
			};
		},
		[activePendingPlan],
	);

	const handleFollowUpSuggestionClick = useCallback((question: string) => void submitPrompt(question), [submitPrompt]);

	const handleGreetingSuggestionClick = useCallback(
		(suggestion: RovoSuggestion) => {
			const promptText = suggestion.prompt ?? suggestion.label;
			const hasSeparatePrompt = suggestion.prompt && suggestion.prompt !== suggestion.label;

			void (async () => {
				// Route build-intent greeting chips through the deterministic
				// interceptor first so they get the scripted reply instead of the
				// real model; fall back to the normal send for everything else.
				if (await interceptSubmit(promptText)) {
					return;
				}

				void sendPrompt(promptText, {
					...resolvedSendPromptOptions,
					contextDescription: mergeRovoContextDescriptions(
						resolvedSendPromptOptions?.contextDescription,
						suggestion.contextDescription,
					),
					messageMetadata: {
						...resolvedSendPromptOptions?.messageMetadata,
						...(hasSeparatePrompt ? { displayLabel: suggestion.label } : {}),
					},
				});
			})();
		},
		[interceptSubmit, resolvedSendPromptOptions, sendPrompt],
	);
	const handleDirectoryAutocompleteSelect = useCallback((index: number) => {
		directoryAutocompleteController?.acceptIndex(index);
	}, [directoryAutocompleteController]);
	const handleDirectoryAutocompleteActiveChange = useCallback((index: number) => {
		directoryAutocompleteController?.setActiveIndex(index);
	}, [directoryAutocompleteController]);

	const handleWidgetPrimaryAction = useCallback(
		(payload: GenerativeWidgetPrimaryActionPayload) => {
			void submitPrompt(buildGenerativeWidgetSubmitPrompt(payload));
		},
		[submitPrompt],
	);

	const handleArtifactDialogOpen = useCallback(
		(artifact: ArtifactResult) => {
			if (
				preserveFloatingSurfaceOnArtifactDialogOpen &&
				chatSurface === "floating" &&
				!artifactDialogFloatingPinRef.current
			) {
				artifactDialogFloatingPinRef.current = true;
				pinFloating(ARTIFACT_DIALOG_FLOATING_PIN_REASON);
			}

			onArtifactDialogOpen?.(artifact);
		},
		[
			chatSurface,
			onArtifactDialogOpen,
			pinFloating,
			preserveFloatingSurfaceOnArtifactDialogOpen,
		],
	);
	const handleAgentResultSelect = useCallback((agent: RovoDataParts["agent-result"]) => {
		if (selectableAgents.some((selectableAgent) => selectableAgent.id === agent.agentId)) {
			selectAgent(agent.agentId);
		}
	}, [selectAgent, selectableAgents]);

	const messagesContainerStyle = {
		display: chatStyles.messagesContainer.display,
		flexDirection: chatStyles.messagesContainer.flexDirection,
		// Test empty state: grow to full height, then bottom-align the greeting
		// (so its last starter lines up with the Ask Rovo greeting) — or center it
		// when the agent has no starters. (Inline values win over Tailwind classes,
		// so the alignment must live here rather than only on the className.)
		justifyContent: shouldBottomAlignAgentTestEmptyState
			? "flex-end"
			: shouldCenterAgentTestEmptyState
				? "center"
				: hasMessages || shouldUseNaturalEmptyGreeting
					? "flex-start"
					: "flex-end",
		flex: isAgentTestEmptyState ? "1 1 auto" : hasMessages || shouldUseNaturalEmptyGreeting ? "0 0 auto" : chatStyles.messagesContainer.flex,
		minHeight: isAgentTestEmptyState ? "100%" : shouldUseNaturalEmptyGreeting ? "auto" : "100%",
		// When bottom-aligning the Test greeting, reserve the sibling Ask Rovo
		// composer's context-bar footprint below the last starter, minus the
		// `gap-3` the Test layout already inserts above its composer, so both
		// greetings share a baseline. (Base 24px from the content track's `py-6`.)
		...(shouldBottomAlignAgentTestEmptyState && composerReservesContextBarSpace
			? { paddingBottom: `${24 + CONTEXT_BAR_RESERVED_SPACE_PX - AGENT_TEST_COMPOSER_GAP_PX}px` }
			: {}),
	};
	const isHeaderHistoryEnabled = !hideHeader && headerVariant === "default";
	const shouldRenderHeaderHistory = isHeaderHistoryEnabled && chatSurface !== "floating";
	const shouldRenderCustomAgentTabs = Boolean(customAgentTabs) || (isCustomAgentSelected && isCustomAgentTabsProfile(selectedAgent));
	const chatConversationBody = (
		<Conversation
			className="min-h-0 min-w-0 flex-1"
			contextRef={conversationContextRef}
			followMode={scrollFollowMode}
			initial={false}
			resize={isStreamingLifecycleActive ? "instant" : "smooth"}
			resizeTarget={isStreamingLifecycleActive ? "bottom" : "follow"}
			targetScrollTop={getLatestTurnTargetTop}
		>
			<ConversationContent
				className={cn(
					"mx-auto flex min-w-0 max-w-[800px] flex-col gap-4 px-4 py-6 md:gap-6",
					conversationContentClassName
				)}
				// In the Test empty state, messagesContainerStyle grows this content
				// track to full height and bottom-aligns (or centers when there are no
				// starters) the greeting (inline values win over Tailwind classes).
				style={messagesContainerStyle}
			>
				{messages.length === 0 ? (
					<div className="w-full" style={chatStyles.emptyState}>
						<ChatGreeting
							heading={resolvedGreeting?.heading}
							illustrationSrc={resolvedGreeting?.illustrationSrc}
							illustrationDarkSrc={resolvedGreeting?.illustrationDarkSrc}
							isAgentTest={showAgentTestControls}
							isComposing={prompt.trim().length > 0}
							isMaxMode={selectedReasoning === "max"}
							selectedAgent={greetingSelectedAgent ?? selectedAgent}
							showHero={resolvedGreeting?.showHero}
							suggestions={resolvedGreeting?.suggestions}
							directoryAutocompleteState={directoryAutocompleteState}
							useWideSuggestionLayout={shouldUseWideDirectoryAutocompleteList}
							onSuggestionClick={handleGreetingSuggestionClick}
							onDirectoryAutocompleteSelect={handleDirectoryAutocompleteSelect}
							onDirectoryAutocompleteActiveChange={handleDirectoryAutocompleteActiveChange}
						/>
					</div>
				) : (
					<MessageTurns
						isUserMessage={(message) => message.role === "user"}
						getMessageContainerClassName={(message) => (message.role === "assistant" ? "[&:empty]:hidden" : undefined)}
						getMessageContainerStyle={(message, messageIndex, turn) => {
							return {
								paddingLeft: message.role === "assistant" ? "12px" : "0",
								paddingRight: message.role === "assistant" ? "12px" : "0",
								marginTop: message.role === "assistant" && messageIndex > 0 && (turn[messageIndex - 1]?.role === "user" || turn[messageIndex - 1]?.role === "assistant") ? "24px" : "0",
							};
						}}
						latestTurnClassName={styles.latestTurn}
						latestTurnDataAttribute="data-chat-latest-turn"
						messages={messages}
						renderMessage={(message) => (
							<MessageBubble
								message={message}
								isThinkingLifecycleStreaming={(isStreamingLifecycleActive || message.id === localThinkingAssistantMessageId) && message.id === lastAssistantMessageId}
								onSuggestionClick={handleFollowUpSuggestionClick}
								showFollowUpSuggestions={message.id === lastAssistantMessageId && !hasPendingChatWork}
								enableSmartWidgets={enableSmartWidgets}
								generativeCardAnimation={cards?.generativeAnimation}
								editingMessageId={editingMessageId}
								onEditMessage={(messageId, nextText) =>
									editMessage(messageId, nextText, resolvedSendPromptOptions)
								}
								onSetEditingMessageId={setEditingMessageId}
								onWidgetPrimaryAction={handleWidgetPrimaryAction}
								onBuildPlan={handleBuildPlan}
								resolvePlanBuildState={resolvePlanBuildState}
							/>
						)}
						renderTurnAfter={(turn) => {
							const generatedResults = turn.flatMap((message): GeneratedResult[] => {
								const artifactResult = getMessageArtifactResult(message);
								const agentResult = getMessageAgentResult(message);
								const generatedAgentResult =
									isGeneratedAgentResult(agentResult) && hasTurnCompleteSignal(message)
										? agentResult
										: null;
								const results: GeneratedResult[] = [];

								if (artifactResult && !generatedAgentResult) {
									results.push({ type: "artifact", result: artifactResult });
								}
								if (generatedAgentResult) {
									results.push({ type: "agent", result: generatedAgentResult });
								}

								return results;
							});

							return generatedResults.length > 0 ? (
								<div className="w-full space-y-2" data-testid="rovo-generated-result-group">
									{generatedResults.map((generatedResult) => (
										generatedResult.type === "artifact" ? (
											<ArtifactResultCard
												key={`artifact-${generatedResult.result.documentId}-${generatedResult.result.action}`}
												artifact={generatedResult.result}
												onDialogOpen={handleArtifactDialogOpen}
												onDialogClose={releaseArtifactDialogFloatingPin}
											/>
										) : (
											<AgentResultCard
												key={`agent-${generatedResult.result.agentId}-${generatedResult.result.action}`}
												agent={generatedResult.result}
												onSelectAgent={handleAgentResultSelect}
											/>
										)
									))}
								</div>
							) : null;
						}}
					/>
				)}
				{thinking.shouldShowPreloader ? (
					<div style={chatStyles.thinkingContainer}>
						<PreloadThinkingIndicator />
					</div>
				) : null}
				{thinking.shouldShowThinkingStatus ? (
					<StreamingThinkingIndicator
						reasoningKey={thinking.streamingReasoningKey}
						label={thinking.resolvedThinkingLabel}
						hasDetails={thinking.hasThinkingDetails}
						hasReasoningContent={thinking.hasReasoningContent}
						trimmedReasoningContent={thinking.trimmedReasoningContent}
						hasThinkingToolCalls={thinking.hasThinkingToolCalls}
						thinkingToolCalls={thinking.thinkingToolCalls}
						allowAutoCollapse={thinking.allowAutoCollapse}
						lastMessageId={thinking.lastMessage?.id}
						containerStyle={chatStyles.thinkingContainer}
						phaseProps={thinking.reasoningPhaseProps}
					/>
				) : null}
				{hasMessages ? <div ref={scrollSpacerRef} aria-hidden style={{ height: 0, flexShrink: 0 }} /> : null}
			</ConversationContent>
			<ConversationScrollButton className="z-10 transition-all" />
		</Conversation>
	);
	const chatComposerBody = (
		<div className="min-w-0 shrink-0">
			{shouldShowQuestionCard && activeQuestionCard ? (
				<>
					<div className="px-3">
						<ClarificationQuestionCard
							key={activeQuestionCardKey ?? undefined}
							questionCard={activeQuestionCard}
							onSubmit={(answers) => {
								handleClarificationSubmit(answers);
								hideQuestionCard();
							}}
							onDismiss={dismissQuestionCard}
						/>
					</div>
					<QuestionCardShortcutsFooter />
				</>
			) : shouldShowApprovalCard && activePendingPlan ? (
				<>
					<ApprovalCard
						key={pendingPlanKey ?? undefined}
						onDismiss={handleDismissApprovalCard}
						onSelect={handlePlanApprovalSubmit}
						isSubmitting={isSubmittingPlanApproval}
					/>
					<QuestionCardShortcutsFooter escLabel="cancel" />
				</>
			) : (
				<>
					<ChatComposer
						prompt={prompt}
						isStreaming={isStreamingLifecycleActive}
						hasInFlightTurn={hasInFlightTurn}
						queuedPrompts={queuedPrompts}
						experimentalDarkCta
						containerClassName={composerContainerClassName}
						hideAiCursor={hideAiCursor}
						hideSourceAndModelControls={hideComposerSourceAndModelControls}
						micStream={realtime.micStream}
						dictationState={dictationState}
						dictationTranscriptPreview={dictationTranscriptPreview}
						clickyActive={!hideAiCursor && isClickyActive}
						onAcceptDictation={handleAcceptDictation}
						onCancelDictation={handleCancelDictation}
						onPromptChange={setPrompt}
						onStartDictation={handleStartDictation}
						onSubmit={handleSubmit}
						onStop={abort}
						onToggleClicky={toggleClicky}
						onToggleRealtimeVoice={handleToggleRealtimeVoice}
						onRemoveQueuedPrompt={removeQueuedPrompt}
						onReasoningChange={setSelectedReasoning}
						realtimeVoiceActive={isRealtimeVoiceActive}
						realtimeVoiceState={realtime.voiceState}
						selectedReasoning={selectedReasoning}
						chatContextBar={chatContextBar}
						directoryAutocompleteListVisible={shouldShowDirectoryAutocompleteList}
						onContextBarOpenChange={setIsContextBarOpen}
						onDirectoryAutocompleteChange={setDirectoryAutocompleteState}
						onDirectoryAutocompleteControllerChange={setDirectoryAutocompleteController}
					/>
				</>
			)}
		</div>
	);
	const chatPanelBody = (
		<>
			{chatConversationBody}
			{chatComposerBody}
		</>
	);

	return (
		<div ref={panelRef} className={cn("relative overflow-hidden", containerClassName)} style={{ ...chatStyles.chatPanel, ...resolvedContainerStyle }}>
			<ChatHistoryDrawer active={shouldRenderHeaderHistory} />
			{!hideHeader && (
				<div className="shrink-0">
					<ChatHeader
						variant={headerVariant}
						isHistoryOpen={isHistoryOpen}
						onClose={onClose}
						onHistoryToggle={toggleHistory}
						onNewChat={resetChat}
						onSurfaceSwitch={onSurfaceSwitch}
					/>
				</div>
			)}
			{shouldRenderCustomAgentTabs ? (
				<>
					<Tabs
						defaultValue="chat"
						aria-label="Custom agent views"
						className={cn(
							"min-h-0 min-w-0 flex-1",
							isAgentTestEmptyState && "flex flex-col",
						)}
					>
						<div
							className={cn(
								"flex shrink-0 items-center gap-2 pt-3 pb-3",
								// In Test mode the surrounding panel already supplies the
								// header-matching horizontal inset (px-6), so the row drops
								// its own padding to keep the version dropdown and edit
								// button aligned with the header controls above. Other
								// surfaces keep the px-3 inset.
								showAgentTestControls ? null : "px-3",
								// Match the Test-mode control bar height on every surface so
								// the Chat/Trigger/Activity pill lands at the same vertical
								// position as the Test-mode tab bar. The Test row is sized by
								// its flanking controls (version dropdown + edit button), so
								// reserve the same row height when those controls are absent.
								showAgentTestControls ? null : "min-h-[56px]",
							)}
						>
							{showAgentTestControls ? (
								<DropdownMenu>
									<DropdownMenuTrigger
										render={
											<Button
												aria-label="Switch version"
												// Nudge the version control 8px left so its lozenge
												// visually aligns with the header controls above.
												className="-ml-2 h-8 shrink-0 gap-1.5 px-2 text-sm font-medium text-text"
												type="button"
												variant="ghost"
											/>
										}
									>
										<Badge variant={selectedAgentVersion.variant ?? "success"}>
											{selectedAgentVersion.label}
										</Badge>
										<ChevronDownIcon label="" size="small" spacing="none" />
									</DropdownMenuTrigger>
									<DropdownMenuContent align="start" sideOffset={8}>
										<DropdownMenuGroup>
											{agentVersionOptions.map((version) => (
												<Fragment key={version.id}>
													{version.sectionBreakBefore ? (
														<DropdownMenuSeparator />
													) : null}
													<DropdownMenuItem
														onSelect={() => {
															if (selectedAgentVersionId === undefined) {
																setUncontrolledAgentVersionId(version.id);
															}
															onAgentVersionChange?.(version.id);
														}}
														className={cn((version.variant ?? "success") === "neutral" && "bg-popover sticky top-0 z-10")}
														elemAfter={version.id === selectedAgentVersion.id ? <CheckMarkIcon label="Selected" /> : undefined}
													>
														<span className="flex min-w-0 items-center gap-2">
															<Badge variant={version.variant ?? "success"}>{version.label}</Badge>
															{version.isCurrent ? (
																<span className="text-xs text-text-subtle">Current</span>
															) : null}
														</span>
													</DropdownMenuItem>
												</Fragment>
											))}
										</DropdownMenuGroup>
									</DropdownMenuContent>
								</DropdownMenu>
							) : null}
							<div className={cn("flex flex-1", showAgentTestControls ? "justify-center" : null)}>
								<TabsList
									className={cn(
										showAgentTestControls
											? "w-full max-w-[376px]"
											: "w-full",
									)}
								>
									<TabsTrigger value="chat">Chat</TabsTrigger>
									<TabsTrigger value="trigger">Trigger</TabsTrigger>
									<TabsTrigger value="activity">Activity</TabsTrigger>
								</TabsList>
							</div>
							{showAgentTestControls ? (
								<Button aria-label="New chat" size="icon" variant="ghost" onClick={resetChat}>
									<EditIcon label="" />
								</Button>
							) : null}
						</div>
						<TabsContent
							value="chat"
							keepMounted
							className="min-h-0 flex flex-1 flex-col data-[hidden]:hidden"
						>
							{isAgentTestEmptyState ? (
								// Fill the full tab height and pin the composer to the
								// bottom (conversation grows to take the slack) so the Test
								// composer aligns with the bottom-anchored sidebar composer
								// instead of floating mid-height.
								<div className="mx-auto flex min-h-0 w-full flex-1 flex-col gap-3">
									{chatConversationBody}
									{chatComposerBody}
								</div>
							) : (
								chatConversationBody
							)}
						</TabsContent>
						<TabsContent value="trigger" className="min-h-0 flex-1 overflow-y-auto px-4 py-5 data-[hidden]:hidden">
							{customAgentTabs?.trigger ?? (
								<CustomAgentTabEmptyState
									title="No trigger configured"
									description={`${selectedAgent.name} does not have trigger details in this view yet.`}
								/>
							)}
						</TabsContent>
						<TabsContent value="activity" className="min-h-0 flex-1 overflow-y-auto px-4 py-5 data-[hidden]:hidden">
							{customAgentTabs?.activity ?? (
								<AgentActivityTimeline
									entry={getSessionAgentEntry(selectedAgent.id)}
									messages={rawUiMessages}
									emptyState={
										<CustomAgentTabEmptyState
											title="No activity yet"
											description={`${selectedAgent.name} has not recorded activity in this view yet.`}
										/>
									}
								/>
							)}
						</TabsContent>
					</Tabs>
					{isAgentTestEmptyState ? null : chatComposerBody}
				</>
			) : (
				chatPanelBody
			)}
			{hideAiCursor ? null : (
				<ClickyOverlay
					state={clicky.state}
					pointTarget={clicky.pointTarget}
					responseText={clicky.responseText}
					history={clicky.history}
					screenshotDimensions={clickyScreenshotDimensions}
					onReturnToIdle={clickyReturnToIdle}
				/>
			)}
		</div>
	);
}
