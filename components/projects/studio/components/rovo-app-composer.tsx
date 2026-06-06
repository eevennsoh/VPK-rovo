"use client";

import type { ChatStatus, FileUIPart } from "ai";
import {
	PromptInputButton,
	PromptInputProvider,
	PromptInputTextarea,
	usePromptInputController,
} from "@/components/ui-custom/prompt-input";
import {
	Queue,
	QueueItem,
	QueueItemActions,
	QueueItemContent,
	QueueItemIndicator,
	QueueList,
} from "@/components/ui-custom/queue";
import { composerTextareaClassName, floatingComposerTextareaClassName, textareaCSS } from "@/components/blocks/shared-ui/composer-styles";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { VoiceButtonState } from "@/components/ui-audio/voice-button";
import ChatContextBar from "@/components/projects/sidebar-chat/components/chat-context-bar";
import { ROVO_APP_STUDIO_COMPOSER_MAX_WIDTH_CLASS, ROVO_APP_STUDIO_COMPOSER_SESSION_MAX_WIDTH_CLASS } from "@/components/projects/studio/lib/rovo-app-shell-layout";
import { resolveRovoAppComposerResponseGradientState } from "@/components/projects/studio/lib/rovo-app-composer-response-gradient-state";
import type { RealtimeGenerationState } from "@/components/projects/studio/hooks/use-realtime-voice";
import { cn } from "@/lib/utils";
import type { RovoAppPlanExecutionTrackerViewModel } from "@/components/projects/studio/lib/rovo-app-plan-execution-tracker";
import type { RovoAppQueuedAction } from "@/lib/rovo-app-types";
import AddIcon from "@atlaskit/icon/core/add";
import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";
import CursorIcon from "@atlaskit/icon-lab/core/cursor";
import DeleteIcon from "@atlaskit/icon/core/delete";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RovoAppPlanExecutionTracker } from "./rovo-app-plan-execution-tracker";
import { RovoAppComposerResponseGradient } from "./rovo-app-composer-response-gradient";
import { RovoComposerActionButton } from "@/components/projects/shared/components/rovo-composer-send-controls";
import { FloatingComposer } from "@/components/projects/shared/components/floating-composer";
import SvgTracing from "@/components/visual/svg-tracing";
import {
	DEFAULT_SVG_TRACE_CONFIG,
	SVG_TRACE_SCRATCH_UNDERLINE_PRESET,
	SVG_TRACE_TEMPLATES_LOOP_PRESET,
	type SvgTraceConfig,
} from "@/components/visual/svg-tracing/data";

const SCRATCH_SCRIBBLE_CONFIG: SvgTraceConfig = {
	...DEFAULT_SVG_TRACE_CONFIG,
	duration: 0.72,
	strokeWidth: 1.45,
	colorStopCount: 6,
	segmentCap: "butt",
	easingId: "easeInOutCubic",
	traceMode: "draw-eat",
	loop: false,
	repeatCount: 1,
	showOutline: false,
};

const TEMPLATES_SWEEP_CONFIG: SvgTraceConfig = {
	...SCRATCH_SCRIBBLE_CONFIG,
	duration: 0.78,
	strokeWidth: 1.45,
};

const SCRATCH_SCRIBBLE_DELAY_MS = 480;

// Grace period before the hover reveal hides, so the pointer can travel from
// the input down to the "Or start from scratch" link without it vanishing.
const REVEAL_HIDE_DELAY_MS = 400;

const EMPTY_REALTIME_OUTPUT_WAVEFORM_BARS: number[] = [];
const EMPTY_QUEUED_PROMPTS: ReadonlyArray<RovoAppQueuedAction> = [];

interface RovoAppComposerProps {
	artifactTitle?: string | null;
	autoFocus?: boolean;
	backgroundArtifactLabel?: string | null;
	composerStatus: ChatStatus;
	compact?: boolean;
	errorMessage?: string | null;
	focusRequestKey?: number;
	/** Widen the prompt input to the 800px in-session width (vs. the 600px home width). */
	fillWidth?: boolean;
	isPlanMode?: boolean;
	micStream?: MediaStream | null;
	queuedPrompts?: ReadonlyArray<RovoAppQueuedAction>;
	onStop: () => Promise<void>;
	onDismissPlanExecutionTracker?: () => void;
	onDismissArtifactContext?: () => void;
	onRemoveQueuedPrompt?: (id: string) => void;
	onSendQueuedPromptNow?: (id: string) => void;
	onBrowseTemplates?: () => void;
	onStartFromScratch?: () => void;
	onSubmit: (payload: { text: string; files: FileUIPart[] }) => Promise<void>;
	onToggleClicky?: () => void;
	onTogglePlanMode?: () => void;
	onToggleRealtimeVoice?: () => void;
	onToggleVoice?: () => void;
	galleryExpanded?: boolean;
	placeholder?: string;
	planExecutionTracker?: RovoAppPlanExecutionTrackerViewModel | null;
	prefillText?: string | null;
	previewPrompt?: string | null;
	realtimeGenerationState?: RealtimeGenerationState;
	realtimeOutputWaveformBars?: number[];
	realtimeVoiceActive?: boolean;
	realtimeVoiceState?: "idle" | "connecting" | "listening" | "speaking";
	clickyActive?: boolean;
	renderResponseGradient?: (props: {
		active: boolean;
		phase: "warmup" | "speaking";
		signal: number[];
		voiceState: "idle" | "connecting" | "listening" | "speaking";
		generationState: string;
		micStream?: MediaStream | null;
	}) => React.ReactNode;
	showBackgroundStop?: boolean;
	submitDisabled?: boolean;
	voiceState?: VoiceButtonState;
}

function RovoAppComposerInner({
	artifactTitle,
	autoFocus = true,
	backgroundArtifactLabel,
	composerStatus,
	errorMessage,
	focusRequestKey,
	fillWidth = false,
	micStream,
	onDismissPlanExecutionTracker,
	onDismissArtifactContext,
	queuedPrompts = EMPTY_QUEUED_PROMPTS,
	onStop,
	onRemoveQueuedPrompt,
	onSendQueuedPromptNow,
	onBrowseTemplates,
	onStartFromScratch,
	onSubmit,
	onToggleClicky,
	onToggleRealtimeVoice,
	clickyActive = false,
	placeholder = "Describe what it should do",
	planExecutionTracker = null,
	prefillText,
	realtimeGenerationState = "idle",
	realtimeOutputWaveformBars = EMPTY_REALTIME_OUTPUT_WAVEFORM_BARS,
	realtimeVoiceActive = false,
	realtimeVoiceState = "idle",
	renderResponseGradient,
	showBackgroundStop = false,
	submitDisabled = false,
}: Readonly<RovoAppComposerProps>) {
	const controller = usePromptInputController();
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const [isInputFocused, setIsInputFocused] = useState(false);
	const [isComposerHoverActive, setIsComposerHoverActive] = useState(false);
	const [scratchScribbleReplayKey, setScratchScribbleReplayKey] = useState(0);
	const [templateSweepReplayKey, setTemplateSweepReplayKey] = useState(0);
	const [isScratchScribblePlaying, setIsScratchScribblePlaying] = useState(false);
	const revealHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const scratchScribbleDelayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const canSubmit = controller.textInput.value.trim().length > 0 || controller.attachments.files.length > 0;
	const hasQueuedPrompts = queuedPrompts.length > 0;

	const replayRevealTraces = useCallback(() => {
		if (scratchScribbleDelayTimeoutRef.current) {
			clearTimeout(scratchScribbleDelayTimeoutRef.current);
		}
		setIsScratchScribblePlaying(false);
		setTemplateSweepReplayKey((currentKey) => currentKey + 1);
		scratchScribbleDelayTimeoutRef.current = setTimeout(() => {
			setIsScratchScribblePlaying(true);
			setScratchScribbleReplayKey((currentKey) => currentKey + 1);
			scratchScribbleDelayTimeoutRef.current = null;
		}, SCRATCH_SCRIBBLE_DELAY_MS);
	}, []);

	const showReveal = useCallback(() => {
		if (revealHideTimeoutRef.current) {
			clearTimeout(revealHideTimeoutRef.current);
			revealHideTimeoutRef.current = null;
		}
		setIsComposerHoverActive(true);
		replayRevealTraces();
	}, [replayRevealTraces]);

	const scheduleHideReveal = useCallback(() => {
		if (revealHideTimeoutRef.current) {
			clearTimeout(revealHideTimeoutRef.current);
		}
		if (scratchScribbleDelayTimeoutRef.current) {
			clearTimeout(scratchScribbleDelayTimeoutRef.current);
			scratchScribbleDelayTimeoutRef.current = null;
		}
		revealHideTimeoutRef.current = setTimeout(() => {
			setIsComposerHoverActive(false);
			setIsScratchScribblePlaying(false);
			revealHideTimeoutRef.current = null;
		}, REVEAL_HIDE_DELAY_MS);
	}, []);

	useEffect(() => {
		return () => {
			if (revealHideTimeoutRef.current) {
				clearTimeout(revealHideTimeoutRef.current);
			}
			if (scratchScribbleDelayTimeoutRef.current) {
				clearTimeout(scratchScribbleDelayTimeoutRef.current);
			}
		};
	}, []);

	// Reveal shows while the composer is hovered (with a close grace period so
	// the pointer can reach the link below) or while the textarea is focused.
	const isRevealVisible = isInputFocused || isComposerHoverActive;
	const showTemplateSweep = isRevealVisible;
	const showScratchScribble = isRevealVisible && isScratchScribblePlaying;
	const realtimeResponseGradientState = resolveRovoAppComposerResponseGradientState({
		realtimeGenerationState,
		realtimeVoiceState,
	});

	const handlePromptSubmit = useCallback(
		(payload: { text: string; files: FileUIPart[] }) => {
			if (submitDisabled) {
				return;
			}

			void onSubmit(payload).catch(() => {});
		},
		[onSubmit, submitDisabled],
	);

	const artifactContextBar = artifactTitle
		? {
				iconName: "artifact" as const,
				label: artifactTitle,
				signature: `rovo-artifact:${artifactTitle}`,
				variant: "edit" as const,
			}
		: null;

	useEffect(() => {
		if (typeof focusRequestKey !== "number" || focusRequestKey <= 0) {
			return;
		}

		requestAnimationFrame(() => {
			// The forwarded ref points at the core editor's contentEditable; focusing
			// it lands the caret per the editor (autofocus="end"), so no manual caret
			// placement is needed.
			textareaRef.current?.focus();
		});
	}, [focusRequestKey]);

	// Apply prefilled text from gallery click or voice transcript streaming.
	// Routing through the controller lets the core editor sync the value into the
	// contentEditable (via setComposerPlainText), which auto-grows on its own —
	// no manual textarea height management is needed anymore.
	const appliedPrefillRef = useRef<string | null>(null);
	useEffect(() => {
		if (prefillText && prefillText !== appliedPrefillRef.current) {
			appliedPrefillRef.current = prefillText;
			controller.textInput.setInput(prefillText);
		} else if (prefillText === null && appliedPrefillRef.current !== null) {
			// Voice transcript cleared (auto-sent) — clear the input
			appliedPrefillRef.current = null;
			controller.textInput.clear();
		}
	}, [prefillText, controller.textInput]);

	return (
		<div className="relative isolate overflow-visible">
			<div className="pointer-events-none absolute inset-0 overflow-visible">
				{renderResponseGradient ? (
					renderResponseGradient({
						active: realtimeResponseGradientState.visible,
						phase: realtimeResponseGradientState.phase ?? "warmup",
						signal: realtimeOutputWaveformBars,
						voiceState: realtimeVoiceState,
						generationState: realtimeGenerationState,
						micStream,
					})
				) : (
					<RovoAppComposerResponseGradient active={realtimeResponseGradientState.visible} phase={realtimeResponseGradientState.phase ?? "warmup"} signal={realtimeOutputWaveformBars} />
				)}
			</div>
			<div className="flex w-full flex-col overflow-visible">
				{errorMessage ? <Alert variant="danger">{errorMessage}</Alert> : null}
				{backgroundArtifactLabel ? <p className="px-1 text-text-subtlest text-xs">{backgroundArtifactLabel}</p> : null}

				{hasQueuedPrompts ? (
					<div className="px-1">
						<Queue className="rounded-b-none border-border border-b-0 bg-surface-raised px-2 pt-2 pb-2 shadow-none">
							<QueueList className="mt-0 mb-0 w-full [&_[data-slot=scroll-area-viewport]>div]:max-h-28 [&_[data-slot=scroll-area-viewport]>div]:pr-0 [&_ul]:w-full">
								{queuedPrompts.map((queuedPrompt) => (
									<QueueItem key={queuedPrompt.id} className="w-full bg-surface py-2 hover:bg-surface-hovered">
										<div className="flex items-center gap-2">
											<QueueItemIndicator />
											<QueueItemContent className="text-text-subtle">
												{queuedPrompt.text}
											</QueueItemContent>
											<QueueItemActions>
												<Button
													aria-label="Send now"
													onClick={() => onSendQueuedPromptNow?.(queuedPrompt.id)}
													size="icon"
													type="button"
													variant="ghost"
													className="size-7 rounded-full text-icon-subtle opacity-0 transition-opacity group-hover:opacity-100"
												>
													<ArrowUpIcon label="" size="small" />
												</Button>
												<Button
													aria-label="Remove queued message"
													onClick={() => onRemoveQueuedPrompt?.(queuedPrompt.id)}
													size="icon"
													type="button"
													variant="ghost"
													className="size-7 rounded-full text-icon-subtle opacity-0 transition-opacity group-hover:opacity-100"
												>
													<DeleteIcon label="" size="small" />
												</Button>
											</QueueItemActions>
										</div>
									</QueueItem>
								))}
							</QueueList>
						</Queue>
					</div>
				) : null}

				<AnimatePresence>
					{planExecutionTracker ? (
						<motion.div
							key="plan-execution-tracker"
							initial={{ opacity: 0, y: 24 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: 24 }}
							transition={{ type: "spring", bounce: 0, visualDuration: 0.35 }}
							className="pb-3"
							style={{ willChange: "transform, opacity" }}
						>
							<RovoAppPlanExecutionTracker
								onDismiss={onDismissPlanExecutionTracker}
								tracker={planExecutionTracker}
							/>
						</motion.div>
					) : null}
				</AnimatePresence>

				<ChatContextBar context={artifactContextBar} onDismiss={onDismissArtifactContext} />

				<div
					className="relative z-10"
					onMouseEnter={showReveal}
					onMouseLeave={scheduleHideReveal}
				>
					<FloatingComposer
						allowOverflow
						className={cn("relative z-10 mx-auto", fillWidth ? ROVO_APP_STUDIO_COMPOSER_SESSION_MAX_WIDTH_CLASS : ROVO_APP_STUDIO_COMPOSER_MAX_WIDTH_CLASS)}
						data-screen-assistant-target="studio-composer"
						onSubmit={handlePromptSubmit}
						addButton={
							<div className="flex items-center gap-1">
								<PromptInputButton size="icon-sm" variant="ghost" aria-label="Add">
									<AddIcon label="" />
								</PromptInputButton>
								<PromptInputButton
									size="icon-sm"
									variant={clickyActive ? "default" : "ghost"}
									onClick={onToggleClicky}
									aria-label="Rovo Cursor"
									aria-pressed={clickyActive}
									tooltip={{ content: "Rovo Cursor", delay: 0 }}
								>
									<CursorIcon label="" />
								</PromptInputButton>
							</div>
						}
						actions={
							<RovoComposerActionButton
								canSubmit={canSubmit}
								composerStatus={composerStatus}
								experimentalDarkCta
								micStream={micStream}
								onStop={onStop}
								onToggleRealtimeVoice={onToggleRealtimeVoice}
								realtimeVoiceActive={realtimeVoiceActive}
								screenAssistantTargetPrefix="studio-composer"
								showBackgroundStop={showBackgroundStop}
								submitDisabled={submitDisabled}
							/>
						}
					>
						<PromptInputTextarea
							ref={textareaRef}
							autoFocus={autoFocus}
							autoResize
							className={cn(composerTextareaClassName, floatingComposerTextareaClassName)}
							onBlur={() => setIsInputFocused(false)}
							onFocus={() => {
								setIsInputFocused(true);
								replayRevealTraces();
							}}
							placeholder={placeholder}
							rows={1}
							suppressHydrationWarning
						/>
					</FloatingComposer>

					{onStartFromScratch ? (
						<AnimatePresence>
							{isRevealVisible ? (
								<motion.div
									key="start-from-scratch"
									initial={{ opacity: 0, y: -4 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -4 }}
									transition={{ type: "spring", bounce: 0, visualDuration: 0.2 }}
									// Anchored absolutely below the composer so the reveal fades
									// in over the layout instead of reflowing/recentering it.
									className="absolute inset-x-0 top-full flex items-center justify-center pt-2"
									style={{ willChange: "opacity, transform" }}
								>
									<span
										// Prevent the textarea from blurring before a click lands,
										// which would unmount this reveal mid-interaction.
										onMouseDown={(event) => event.preventDefault()}
										className="text-xs text-text-subtlest"
									>
										{onBrowseTemplates ? (
											<>
												<button
													type="button"
													onClick={onBrowseTemplates}
													className="rounded-xs transition-colors hover:text-text focus-visible:text-text focus-visible:outline-none"
												>
													Browse{" "}
													<span className="relative">
														templates
														{/* Decorative rainbow-traced template sweep. */}
														{showTemplateSweep ? (
															<span
																aria-hidden
																className="pointer-events-none absolute top-full left-1/2 w-11 -translate-x-1/2 pt-px"
															>
																<SvgTracing
																	shape={SVG_TRACE_TEMPLATES_LOOP_PRESET}
																	config={TEMPLATES_SWEEP_CONFIG}
																	resetKey={templateSweepReplayKey}
																	svgClassName="h-2.5 w-full"
																/>
															</span>
														) : null}
													</span>
												</button>
												{" or "}
											</>
										) : (
											"Or "
										)}
										<button
											type="button"
											onClick={onStartFromScratch}
											className="rounded-xs transition-colors hover:text-text focus-visible:text-text focus-visible:outline-none"
										>
											start from{" "}
											<span className="relative">
												scratch
												{/* Decorative rainbow-traced doodle. */}
												{showScratchScribble ? (
													<span
														aria-hidden
														className="pointer-events-none absolute top-full left-1/2 w-6 -translate-x-1/2 pt-px"
													>
														<SvgTracing
															shape={SVG_TRACE_SCRATCH_UNDERLINE_PRESET}
															config={SCRATCH_SCRIBBLE_CONFIG}
															resetKey={scratchScribbleReplayKey}
															svgClassName="h-2.5 w-full"
														/>
													</span>
												) : null}
											</span>
										</button>
									</span>
								</motion.div>
							) : null}
						</AnimatePresence>
					) : null}
				</div>
			</div>

			<style>{textareaCSS}</style>
		</div>
	);
}

export function RovoAppComposer(props: Readonly<RovoAppComposerProps>) {
	return (
		<PromptInputProvider>
			<RovoAppComposerInner {...props} />
		</PromptInputProvider>
	);
}
