"use client";

// oxlint-disable react-doctor/no-multi-comp -- This module intentionally colocates coupled component parts as a compound component or demo surface API.

// oxlint-disable react-doctor/no-event-handler -- Effects in this file bridge external systems, animation/media state, timers, or parent-controlled state rather than user event handlers.

import { cloneElement, useCallback, useEffect, useRef, useState, type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import type { ChatStatus } from "ai";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import CustomizeMenu from "@/components/projects/shared/components/chat-configuration/customize-menu";
import { REASONING_OPTIONS } from "@/components/projects/shared/components/chat-configuration/customize-menu-data";
import {
	PromptInputAutoButton,
	PromptInputButton,
	PromptInputDictationControl,
	PromptInputSubmit,
} from "@/components/ui-custom/prompt-input";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { LiveWaveform } from "@/components/ui-audio/live-waveform";
import { RovoCursorTrackingIcon } from "@/components/projects/shared/components/rovo-cursor-tracking-icon";
import { resolveRovoAppComposerIdleAction } from "@/components/projects/shared/lib/rovo-app-composer-idle-action";
import { resolveRovoAppComposerWaveformState } from "@/components/projects/shared/lib/rovo-app-composer-waveform-state";
import { ROVO_WAVEFORM_COLOR_CSS_VARS } from "@/lib/rovo-colors";
import { cn } from "@/lib/utils";
import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";
import AudioWaveformIcon from "@atlaskit/icon-lab/core/audio-waveform";

const ROVO_COMPOSER_WAVEFORM_INTRO_MS = 500;
const EXPERIMENTAL_DARK_CTA_CLASS_NAME = "bg-bg-neutral-bold text-text-inverse hover:bg-bg-neutral-bold-hovered active:bg-bg-neutral-bold-pressed";
// Default CTA styling: matches the VPK primary button (brand blue). Applied when the
// experimental dark CTA flag is off. The [&_svg] override re-tints the icon because the
// underlying ghost button pins it to text-icon-subtle.
const BRAND_CTA_CLASS_NAME = "bg-primary text-primary-foreground [&_svg]:text-primary-foreground hover:bg-primary-hovered active:bg-primary-pressed";
const ACTION_FRAME_CLASS_NAME = "flex h-9 shrink-0 items-center justify-center";
const ROVO_CURSOR_BUTTON_TRANSITION = { type: "spring", bounce: 0.18, visualDuration: 0.22 } as const;
const ROVO_CURSOR_BUTTON_VARIANTS = {
	rest: { transform: "scale(1)" },
	hover: { transform: "scale(1.06)" },
	tap: { transform: "scale(0.96)" },
} as const;
const ROVO_CURSOR_BUTTON_REDUCED_VARIANTS = {
	rest: { transform: "scale(1)" },
	hover: { transform: "scale(1)" },
	tap: { transform: "scale(1)" },
} as const;

export type RovoComposerDictationState = "idle" | "recording" | "processing";

interface ComposerVoiceWaveformProps {
	active: boolean;
	barHeightScale: number;
	barCount?: 4 | 8;
	mediaStream: MediaStream | null;
	processing: boolean;
}

function ComposerVoiceWaveform({
	active,
	barHeightScale,
	barCount = 8,
	mediaStream,
	processing,
}: Readonly<ComposerVoiceWaveformProps>): ReactElement {
	return (
		<span className={cn("flex h-full shrink-0 items-center", barCount === 4 ? "w-4" : "w-8")}>
			<LiveWaveform
				active={active}
				barColor="currentColor"
				barColors={[...ROVO_WAVEFORM_COLOR_CSS_VARS]}
				barCount={barCount}
				barGap={2}
				barHeightScale={barHeightScale}
				barOpacityMax={1}
				barOpacityMin={1}
				barWidth={2}
				barRadius={0}
				className="min-h-0 min-w-0 flex-1 animate-in fade-in duration-slow"
				entranceAnimation="stagger"
				entranceDurationMs={180}
				entranceStaggerMs={14}
				fadeEdges={false}
				fftSize={512}
				height="100%"
				mediaStream={mediaStream}
				mode="static"
				processing={processing}
				sensitivity={2.4}
				smoothingTimeConstant={0.35}
			/>
		</span>
	);
}

function ComposerActionFrame({ children }: Readonly<{ children: ReactNode }>): ReactElement {
	return (
		<div className={ACTION_FRAME_CLASS_NAME}>
			{children}
		</div>
	);
}

const autoReasoningButtonClassName = [
	"whitespace-nowrap",
	"[&[aria-expanded=true]]:border-transparent",
	"[&[aria-expanded=true]]:bg-transparent",
	"[&[aria-expanded=true]]:text-text-subtle",
	"[&[aria-expanded=true]_svg]:text-icon-subtle",
].join(" ");

function getReasoningButtonLabel(option: (typeof REASONING_OPTIONS)[number]): string {
	return option.id === "let-rovo-decide" ? "Auto" : option.label;
}

export interface RovoComposerReasoningSelectorProps {
	companyKnowledgeEnabled: boolean;
	onCompanyKnowledgeChange: (enabled: boolean) => void;
	onReasoningChange: (reasoning: string) => void;
	onOpenChange?: (open: boolean) => void;
	open?: boolean;
	selectedReasoning: string;
	webResultsEnabled: boolean;
	onWebResultsChange: (enabled: boolean) => void;
}

export function RovoComposerReasoningSelector({
	companyKnowledgeEnabled,
	onCompanyKnowledgeChange,
	onReasoningChange,
	onOpenChange,
	open,
	selectedReasoning,
	webResultsEnabled,
	onWebResultsChange,
}: Readonly<RovoComposerReasoningSelectorProps>): ReactElement {
	const selectedReasoningOption = REASONING_OPTIONS.find((option) => option.id === selectedReasoning) ?? REASONING_OPTIONS[0];
	const selectedReasoningButtonLabel = getReasoningButtonLabel(selectedReasoningOption);

	return (
		<Popover open={open} onOpenChange={onOpenChange}>
			<PopoverTrigger
				render={(
					<PromptInputAutoButton
						aria-label={`Reasoning: ${selectedReasoningOption.label}`}
						className={autoReasoningButtonClassName}
					>
						{cloneElement(selectedReasoningOption.icon, { label: "" })}
						<span>{selectedReasoningButtonLabel}</span>
					</PromptInputAutoButton>
				)}
			/>
			<PopoverContent side="top" align="end" sideOffset={8} positionerClassName="z-[600]" className="w-auto p-2">
				<PopoverTitle className="sr-only">Choose reasoning</PopoverTitle>
				<CustomizeMenu
					selectedReasoning={selectedReasoning}
					onReasoningChange={onReasoningChange}
					showSources={false}
					webResultsEnabled={webResultsEnabled}
					onWebResultsChange={onWebResultsChange}
					companyKnowledgeEnabled={companyKnowledgeEnabled}
					onCompanyKnowledgeChange={onCompanyKnowledgeChange}
					onClose={() => onOpenChange?.(false)}
				/>
			</PopoverContent>
		</Popover>
	);
}

export interface RovoComposerActionButtonProps {
	canSubmit: boolean;
	composerStatus: ChatStatus;
	dictationState?: RovoComposerDictationState;
	dictationTranscriptPreview?: string | null;
	experimentalDarkCta?: boolean;
	isComposerBusy?: boolean;
	liveVoiceEnabled?: boolean;
	clickyActive?: boolean;
	micStream?: MediaStream | null;
	onStartDictation?: () => void;
	onStopDictation?: () => void;
	onStop: () => Promise<void> | void;
	onToggleClicky?: () => void;
	onToggleRealtimeVoice?: () => void;
	realtimeVoiceActive?: boolean;
	realtimeVoiceState?: "idle" | "connecting" | "listening" | "speaking";
	screenAssistantTargetPrefix?: string;
	showBackgroundStop?: boolean;
	showSubmitWhenEmpty?: boolean;
	submitButtonClassName?: string;
	submitDisabled?: boolean;
	voiceStartButtonClassName?: string;
}

export function RovoComposerActionButton({
	canSubmit,
	composerStatus,
	dictationState = "idle",
	dictationTranscriptPreview = null,
	experimentalDarkCta = false,
	isComposerBusy,
	liveVoiceEnabled = false,
	clickyActive = false,
	micStream = null,
	onStartDictation,
	onStopDictation,
	onStop,
	onToggleClicky,
	onToggleRealtimeVoice,
	realtimeVoiceActive = false,
	realtimeVoiceState = "idle",
	screenAssistantTargetPrefix,
	showBackgroundStop = false,
	showSubmitWhenEmpty = false,
	submitButtonClassName,
	submitDisabled = false,
	voiceStartButtonClassName,
}: Readonly<RovoComposerActionButtonProps>): ReactElement {
	const realtimeWaveformIntroTimeoutRef = useRef<number | null>(null);
	const shouldReduceMotion = useReducedMotion();
	const [isRealtimeWaveformIntroActive, setIsRealtimeWaveformIntroActive] = useState(false);
	const [isDictationOptimisticActive, setIsDictationOptimisticActive] = useState(false);
	const resolvedComposerBusy = isComposerBusy ?? (composerStatus === "submitted" || composerStatus === "streaming");
	const resolvedRealtimeVoiceActive = liveVoiceEnabled && realtimeVoiceActive;
	const isDictationActive = dictationState !== "idle" || isDictationOptimisticActive;
	const idleAction = showSubmitWhenEmpty && !resolvedComposerBusy && !resolvedRealtimeVoiceActive && !showBackgroundStop
		? "submit"
		: resolveRovoAppComposerIdleAction({
			canStartDictation: Boolean(onStartDictation),
			canStartRealtimeVoice: liveVoiceEnabled && Boolean(onToggleRealtimeVoice),
			canSubmit,
			isComposerBusy: resolvedComposerBusy,
			realtimeVoiceActive: resolvedRealtimeVoiceActive,
			showBackgroundStop,
			submitDisabled,
		});
	const realtimeWaveformState = resolveRovoAppComposerWaveformState({
		hasMicStream: micStream !== null,
		isIntroActive: isRealtimeWaveformIntroActive,
		realtimeVoiceActive: resolvedRealtimeVoiceActive,
	});
	const isRealtimeMicWaveformActive = realtimeVoiceState === "listening" && realtimeWaveformState.active;
	const isRealtimeWaveformProcessing = !isRealtimeMicWaveformActive && resolvedRealtimeVoiceActive;
	const isDictationRecording = dictationState === "recording" && micStream !== null;
	const experimentalDarkCtaClassName = experimentalDarkCta ? EXPERIMENTAL_DARK_CTA_CLASS_NAME : undefined;
	const liveVoiceCtaClassName = experimentalDarkCtaClassName ?? BRAND_CTA_CLASS_NAME;
	const shouldShowDictationStart = Boolean(onStartDictation) && !resolvedComposerBusy && !resolvedRealtimeVoiceActive && !submitDisabled;
	const shouldShowRealtimeVoiceStart = liveVoiceEnabled && idleAction === "voice-start" && !canSubmit && Boolean(onToggleRealtimeVoice);
	const shouldShowRealtimeVoiceRail = resolvedRealtimeVoiceActive && Boolean(onToggleClicky);

	const clearRealtimeWaveformIntro = useCallback(() => {
		if (realtimeWaveformIntroTimeoutRef.current !== null) {
			window.clearTimeout(realtimeWaveformIntroTimeoutRef.current);
			realtimeWaveformIntroTimeoutRef.current = null;
		}
	}, []);

	const handleToggleRealtimeVoice = useCallback(() => {
		if (!liveVoiceEnabled || !onToggleRealtimeVoice) {
			return;
		}

		clearRealtimeWaveformIntro();

		if (!realtimeVoiceActive) {
			setIsRealtimeWaveformIntroActive(true);
			realtimeWaveformIntroTimeoutRef.current = window.setTimeout(() => {
				realtimeWaveformIntroTimeoutRef.current = null;
				setIsRealtimeWaveformIntroActive(false);
			}, ROVO_COMPOSER_WAVEFORM_INTRO_MS);
		} else {
			setIsRealtimeWaveformIntroActive(false);
		}

		onToggleRealtimeVoice();
	}, [clearRealtimeWaveformIntro, liveVoiceEnabled, onToggleRealtimeVoice, realtimeVoiceActive]);

	const handleStartDictation = useCallback(() => {
		setIsDictationOptimisticActive(true);
		onStartDictation?.();
	}, [onStartDictation]);

	const handleStopDictation = useCallback(() => {
		setIsDictationOptimisticActive(false);
		onStopDictation?.();
	}, [onStopDictation]);

	useEffect(() => {
		if (dictationState !== "idle" || resolvedRealtimeVoiceActive) {
			setIsDictationOptimisticActive(false);
		}
	}, [dictationState, resolvedRealtimeVoiceActive]);

	useEffect(() => {
		return () => {
			clearRealtimeWaveformIntro();
		};
	}, [clearRealtimeWaveformIntro]);

	return (
		<>
			<AnimatePresence mode="popLayout" initial={false}>
				{isDictationActive ? (
					<motion.div
						key="dictation-active"
						initial={{ opacity: 0, transform: "scale(0.8)" }}
						animate={{ opacity: 1, transform: "scale(1)" }}
						exit={{ opacity: 0, transform: "scale(0.8)" }}
						transition={{ type: "spring", bounce: 0, visualDuration: 0.15 }}
						style={{ willChange: "transform, opacity" }}
					>
						<ComposerActionFrame>
							<PromptInputDictationControl
								mediaStream={micStream}
								onStop={handleStopDictation}
								state={isDictationRecording ? "listening" : "processing"}
								transcriptPreview={dictationTranscriptPreview}
							/>
						</ComposerActionFrame>
					</motion.div>
				) : shouldShowRealtimeVoiceRail ? (
					<motion.div
						key="live-voice-active"
						initial={{ opacity: 0, transform: "scale(0.8)" }}
						animate={{ opacity: 1, transform: "scale(1)" }}
						exit={{ opacity: 0, transform: "scale(0.8)" }}
						transition={{ type: "spring", bounce: 0, visualDuration: 0.15 }}
						style={{ willChange: "transform, opacity" }}
					>
						<div
							className={cn(
								"relative flex h-9 w-[68px] items-center justify-center overflow-hidden rounded-[8px]",
								clickyActive ? "text-text-inverse" : undefined,
							)}
						>
							<span aria-hidden="true" className="absolute inset-0 rounded-[8px] bg-bg-neutral" />
							<span
								aria-hidden="true"
								className={cn(
									"absolute top-0.5 right-0.5 bottom-0.5 rounded-md bg-bg-neutral-bold shadow-sm transition-[width] duration-medium ease-in-out motion-reduce:transition-none",
									clickyActive ? "w-16" : "w-8",
								)}
							/>
							<div className="relative z-10 flex h-8 w-16 items-center gap-0">
								<motion.button
									aria-label="Rovo cursor"
									aria-pressed={clickyActive}
									animate="rest"
									className={cn(
										"group/rovo-cursor-button flex size-8 shrink-0 items-center justify-center rounded-md border border-transparent p-0 outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
										clickyActive
											? "text-text-inverse"
											: "text-icon-subtle",
									)}
									data-screen-assistant-target={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:cursor` : undefined}
									initial="rest"
									onClick={onToggleClicky}
									style={{ willChange: shouldReduceMotion ? undefined : "transform" }}
									transition={ROVO_CURSOR_BUTTON_TRANSITION}
									type="button"
									variants={shouldReduceMotion ? ROVO_CURSOR_BUTTON_REDUCED_VARIANTS : ROVO_CURSOR_BUTTON_VARIANTS}
									whileHover="hover"
									whileTap="tap"
								>
									{clickyActive ? (
										<RovoCursorTrackingIcon active />
									) : (
										<RovoCursorTrackingIcon active={false} />
									)}
								</motion.button>
								<button
									aria-label="Stop live voice"
									className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md p-0 text-text-inverse outline-none transition-colors hover:bg-bg-neutral-bold-hovered focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-bg-neutral-bold-pressed"
									data-screen-assistant-target={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:voice` : undefined}
									onClick={handleToggleRealtimeVoice}
									type="button"
								>
									<ComposerVoiceWaveform
										active={isRealtimeMicWaveformActive}
										barCount={4}
										barHeightScale={isRealtimeWaveformProcessing ? 1.15 : 1}
										mediaStream={isRealtimeMicWaveformActive ? micStream : null}
										processing={isRealtimeWaveformProcessing}
									/>
								</button>
							</div>
						</div>
					</motion.div>
				) : resolvedRealtimeVoiceActive ? (
					<motion.div
						key="waveform"
						initial={{ opacity: 0, transform: "scale(0.8)" }}
						animate={{ opacity: 1, transform: "scale(1)" }}
						exit={{ opacity: 0, transform: "scale(0.8)" }}
						transition={{ type: "spring", bounce: 0, visualDuration: 0.15 }}
						style={{ willChange: "transform, opacity" }}
					>
						<ComposerActionFrame>
							<button
								aria-label="Stop live voice"
								className="flex size-8 items-center justify-center overflow-hidden rounded-md bg-bg-neutral-bold p-0 text-text-inverse shadow-sm outline-none transition-colors hover:bg-bg-neutral-bold-hovered focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-bg-neutral-bold-pressed"
								onClick={handleToggleRealtimeVoice}
								type="button"
							>
								<ComposerVoiceWaveform
									active={isRealtimeMicWaveformActive}
									barCount={4}
									barHeightScale={isRealtimeWaveformProcessing ? 1.15 : 1}
									mediaStream={isRealtimeMicWaveformActive ? micStream : null}
									processing={isRealtimeWaveformProcessing}
								/>
							</button>
						</ComposerActionFrame>
					</motion.div>
				) : idleAction === "submit" || idleAction === "voice-start" ? (
					<motion.div
						key={idleAction === "submit" ? "submit-actions" : "voice-start"}
						initial={{ opacity: 0, transform: "scale(0.8)" }}
						animate={{ opacity: 1, transform: "scale(1)" }}
						exit={{ opacity: 0, transform: "scale(0.8)" }}
						transition={{ type: "spring", bounce: 0, visualDuration: 0.15 }}
						style={{ willChange: "transform, opacity" }}
					>
						<ComposerActionFrame>
							<div className="flex h-9 items-center gap-1">
								{shouldShowDictationStart ? (
									<PromptInputDictationControl
										onStart={handleStartDictation}
										screenAssistantTarget={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:dictation` : undefined}
									/>
								) : null}
								{idleAction === "submit" ? (
									<PromptInputSubmit aria-label="Submit" className={cn("hover:opacity-90 active:opacity-80", experimentalDarkCtaClassName, submitButtonClassName)} disabled={submitDisabled || !canSubmit} onStop={() => void onStop()} size="icon-sm" status={composerStatus}>
										<ArrowUpIcon label="" />
									</PromptInputSubmit>
								) : null}
								{shouldShowRealtimeVoiceStart ? (
									<PromptInputButton
										aria-label="Start live voice"
										className={cn("size-8 hover:opacity-90 active:opacity-80", liveVoiceCtaClassName, voiceStartButtonClassName)}
										data-screen-assistant-target={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:voice` : undefined}
										onClick={handleToggleRealtimeVoice}
										tooltip={{ content: "Live chat", delay: 0 }}
										variant="ghost"
									>
										<AudioWaveformIcon label="" />
									</PromptInputButton>
								) : null}
							</div>
						</ComposerActionFrame>
					</motion.div>
				) : idleAction === "background-stop" ? (
					<motion.div
						key="background-stop"
						initial={{ opacity: 0, transform: "scale(0.8)" }}
						animate={{ opacity: 1, transform: "scale(1)" }}
						exit={{ opacity: 0, transform: "scale(0.8)" }}
						transition={{ type: "spring", bounce: 0, visualDuration: 0.15 }}
						style={{ willChange: "transform, opacity" }}
					>
						<ComposerActionFrame>
							<PromptInputSubmit
								aria-label="Stop background work"
								onStop={() => void onStop()}
								size="icon-sm"
								status="streaming"
							>
								<ArrowUpIcon label="" />
							</PromptInputSubmit>
						</ComposerActionFrame>
					</motion.div>
				) : null}
			</AnimatePresence>
			<AnimatePresence initial={false}>
				{resolvedComposerBusy ? (
					<motion.div
						key="stop"
						initial={{ opacity: 0, transform: "scale(0.8)" }}
						animate={{ opacity: 1, transform: "scale(1)" }}
						exit={{ opacity: 0, transform: "scale(0.8)" }}
						transition={{ type: "spring", bounce: 0, visualDuration: 0.15 }}
						style={{ willChange: "transform, opacity" }}
					>
						<ComposerActionFrame>
							<PromptInputSubmit aria-label="Stop" onStop={() => void onStop()} size="icon-sm" status={composerStatus}>
								<ArrowUpIcon label="" />
							</PromptInputSubmit>
						</ComposerActionFrame>
					</motion.div>
				) : null}
			</AnimatePresence>
		</>
	);
}

export type RovoComposerSendControlsProps = HTMLAttributes<HTMLDivElement> &
	RovoComposerReasoningSelectorProps &
	RovoComposerActionButtonProps & {
		hideReasoningSelector?: boolean;
	};

export function RovoComposerSendControls({
	canSubmit,
	className,
	companyKnowledgeEnabled,
	composerStatus,
	dictationState,
	dictationTranscriptPreview,
	experimentalDarkCta,
	hideReasoningSelector = false,
	isComposerBusy,
	liveVoiceEnabled = false,
	clickyActive,
	micStream,
	onCompanyKnowledgeChange,
	onOpenChange,
	onReasoningChange,
	onStop,
	onStartDictation,
	onStopDictation,
	onToggleClicky,
	onToggleRealtimeVoice,
	open,
	realtimeVoiceActive,
	realtimeVoiceState,
	screenAssistantTargetPrefix,
	selectedReasoning,
	showBackgroundStop,
	showSubmitWhenEmpty,
	submitButtonClassName,
	submitDisabled,
	voiceStartButtonClassName,
	webResultsEnabled,
	onWebResultsChange,
	...props
}: Readonly<RovoComposerSendControlsProps>): ReactElement {
	useEffect(() => {
		if (hideReasoningSelector && open) {
			onOpenChange?.(false);
		}
	}, [hideReasoningSelector, onOpenChange, open]);

	return (
		<div className={cn("flex h-9 min-w-0 shrink-0 items-center justify-end gap-1", className)} {...props}>
			<AnimatePresence initial={false} mode="popLayout">
				{hideReasoningSelector ? null : (
					<motion.div
						key="reasoning-selector"
						initial={{ opacity: 0, transform: "scale(0.8)" }}
						animate={{ opacity: 1, transform: "scale(1)" }}
						exit={{ opacity: 0, transform: "scale(0.8)" }}
						transition={{ type: "spring", bounce: 0, visualDuration: 0.15 }}
						style={{ willChange: "transform, opacity" }}
					>
						<RovoComposerReasoningSelector
							companyKnowledgeEnabled={companyKnowledgeEnabled}
							onCompanyKnowledgeChange={onCompanyKnowledgeChange}
							onReasoningChange={onReasoningChange}
							onOpenChange={onOpenChange}
							open={open}
							selectedReasoning={selectedReasoning}
							webResultsEnabled={webResultsEnabled}
							onWebResultsChange={onWebResultsChange}
						/>
					</motion.div>
				)}
			</AnimatePresence>
			<RovoComposerActionButton
				canSubmit={canSubmit}
				composerStatus={composerStatus}
				dictationState={dictationState}
				dictationTranscriptPreview={dictationTranscriptPreview}
				experimentalDarkCta={experimentalDarkCta}
				isComposerBusy={isComposerBusy}
				liveVoiceEnabled={liveVoiceEnabled}
				clickyActive={clickyActive}
				micStream={micStream}
				onStop={onStop}
				onStartDictation={onStartDictation}
				onStopDictation={onStopDictation}
				onToggleClicky={onToggleClicky}
				onToggleRealtimeVoice={onToggleRealtimeVoice}
				realtimeVoiceActive={realtimeVoiceActive}
				realtimeVoiceState={realtimeVoiceState}
				screenAssistantTargetPrefix={screenAssistantTargetPrefix}
				showBackgroundStop={showBackgroundStop}
				showSubmitWhenEmpty={showSubmitWhenEmpty}
				submitButtonClassName={submitButtonClassName}
				submitDisabled={submitDisabled}
				voiceStartButtonClassName={voiceStartButtonClassName}
			/>
		</div>
	);
}
