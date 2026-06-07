"use client";

import type { ChatStatus, FileUIPart } from "ai";
import {
	PromptInputProvider,
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
import { textareaCSS } from "@/components/blocks/shared-ui/composer-styles";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { VoiceButtonState } from "@/components/ui-audio/voice-button";
import ChatContextBar from "@/components/projects/sidebar-chat/components/chat-context-bar";
import {
	resolveRovoAppComposerResponseGradientState,
	type RovoAppComposerResponseGradientGenerationState,
} from "@/components/projects/shared/lib/rovo-app-composer-response-gradient-state";
import type { RovoAppPlanExecutionTrackerViewModel } from "@/components/projects/shared/lib/rovo-app-plan-execution-tracker";
import type { RovoAppQueuedAction } from "@/lib/rovo-app-types";
import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";
import DeleteIcon from "@atlaskit/icon/core/delete";
import { AnimatePresence, motion } from "motion/react";
import { useCallback } from "react";
import { RovoAppPlanExecutionTracker } from "@/components/projects/shared/components/rovo-app-plan-execution-tracker";
import { RovoAppComposerResponseGradient } from "@/components/projects/shared/components/rovo-app-composer-response-gradient";
import { ComposerCardBody } from "@/components/projects/shared/components/composer-card-body";
import { ComposerFloatingBody } from "@/components/projects/shared/components/composer-floating-body";

const EMPTY_REALTIME_OUTPUT_WAVEFORM_BARS: number[] = [];
const EMPTY_QUEUED_PROMPTS: ReadonlyArray<RovoAppQueuedAction> = [];

/**
 * Visual chrome of the composer body:
 * - "card" — Rovo's bordered card with the smooth height-animation system, the
 *   Add action-menu, the Rovo Cursor + Customize controls, and the full
 *   reasoning-aware send controls.
 * - "floating" — Studio's FloatingComposer single-row layout with inline
 *   +/Cursor buttons, the send-only action button, and the hover-revealed
 *   "Browse templates / start from scratch" links.
 */
export type RovoAppComposerChrome = "card" | "floating";

export interface RovoAppComposerProps {
	/** Selects the composer body layout. Defaults to the Rovo "card" chrome. */
	chrome?: RovoAppComposerChrome;
	artifactTitle?: string | null;
	autoFocus?: boolean;
	backgroundArtifactLabel?: string | null;
	composerStatus: ChatStatus;
	compact?: boolean;
	errorMessage?: string | null;
	experimentalDarkCta?: boolean;
	/** Floating chrome: bumps the prompt input to the in-session 800px width. */
	fillWidth?: boolean;
	/** Floating chrome: focus the textarea whenever this key increments. */
	focusRequestKey?: number;
	isPlanMode?: boolean;
	micStream?: MediaStream | null;
	queuedPrompts?: ReadonlyArray<RovoAppQueuedAction>;
	onStop: () => Promise<void>;
	onDismissPlanExecutionTracker?: () => void;
	onDismissArtifactContext?: () => void;
	onRemoveQueuedPrompt?: (id: string) => void;
	/** Floating chrome: when provided, renders a "Send now" action per queued prompt. */
	onSendQueuedPromptNow?: (id: string) => void;
	/** Floating chrome: when provided, reveals a "Browse templates" link. */
	onBrowseTemplates?: () => void;
	/** Floating chrome: when provided, reveals a "start from scratch" link. */
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
	realtimeGenerationState?: RovoAppComposerResponseGradientGenerationState;
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
	chrome = "card",
	artifactTitle,
	autoFocus = true,
	backgroundArtifactLabel,
	composerStatus,
	compact = false,
	errorMessage,
	experimentalDarkCta = false,
	fillWidth = false,
	focusRequestKey,
	galleryExpanded = false,
	isPlanMode = false,
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
	onTogglePlanMode,
	onToggleRealtimeVoice,
	placeholder = "Describe what it should do",
	planExecutionTracker = null,
	prefillText,
	previewPrompt = null,
	realtimeGenerationState = "idle",
	realtimeOutputWaveformBars = EMPTY_REALTIME_OUTPUT_WAVEFORM_BARS,
	realtimeVoiceActive = false,
	realtimeVoiceState = "idle",
	clickyActive = false,
	renderResponseGradient,
	showBackgroundStop = false,
	submitDisabled = false,
}: Readonly<RovoAppComposerProps>) {
	const controller = usePromptInputController();
	const canSubmit = controller.textInput.value.trim().length > 0 || controller.attachments.files.length > 0;
	const hasQueuedPrompts = queuedPrompts.length > 0;
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

	const bodyBaseProps = {
		autoFocus,
		canSubmit,
		clickyActive,
		composerStatus,
		micStream,
		onPromptSubmit: handlePromptSubmit,
		onStop,
		onToggleClicky,
		onToggleRealtimeVoice,
		placeholder,
		prefillText,
		realtimeVoiceActive,
		showBackgroundStop,
		submitDisabled,
		textValue: controller.textInput.value,
		attachmentCount: controller.attachments.files.length,
	};

	return (
		<div className="relative isolate overflow-visible">
			<div className="pointer-events-none absolute inset-0 overflow-visible">
				{renderResponseGradient ? (
					renderResponseGradient({
						active: chrome === "card" ? realtimeVoiceActive || realtimeResponseGradientState.visible : realtimeResponseGradientState.visible,
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
												{onSendQueuedPromptNow ? (
													<Button
														aria-label="Send now"
														onClick={() => onSendQueuedPromptNow(queuedPrompt.id)}
														size="icon"
														type="button"
														variant="ghost"
														className="size-7 rounded-full text-icon-subtle opacity-0 transition-opacity group-hover:opacity-100"
													>
														<ArrowUpIcon label="" size="small" />
													</Button>
												) : null}
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

				{chrome === "floating" ? (
					<ComposerFloatingBody
						{...bodyBaseProps}
						experimentalDarkCta
						fillWidth={fillWidth}
						focusRequestKey={focusRequestKey}
						onBrowseTemplates={onBrowseTemplates}
						onStartFromScratch={onStartFromScratch}
					/>
				) : (
					<ComposerCardBody
						{...bodyBaseProps}
						artifactTitle={artifactTitle}
						compact={compact}
						experimentalDarkCta={experimentalDarkCta}
						galleryExpanded={galleryExpanded}
						isPlanMode={isPlanMode}
						onTogglePlanMode={onTogglePlanMode}
						previewPrompt={previewPrompt}
					/>
				)}
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
