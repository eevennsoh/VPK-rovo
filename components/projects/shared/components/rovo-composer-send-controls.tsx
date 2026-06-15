"use client";

// oxlint-disable react-doctor/no-multi-comp -- This module intentionally colocates coupled component parts as a compound component or demo surface API.

// oxlint-disable react-doctor/no-event-handler -- Effects in this file bridge external systems, animation/media state, timers, or parent-controlled state rather than user event handlers.

import { cloneElement, useCallback, useEffect, useRef, useState, type HTMLAttributes, type ReactElement } from "react";
import type { ChatStatus } from "ai";
import { AnimatePresence, motion } from "motion/react";
import CustomizeMenu from "@/components/blocks/shared-ui/customize-menu";
import { REASONING_OPTIONS } from "@/components/blocks/shared-ui/data/customize-menu-data";
import {
	PromptInputAutoButton,
	PromptInputButton,
	PromptInputSubmit,
} from "@/components/ui-custom/prompt-input";
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger } from "@/components/ui/popover";
import { LiveWaveform } from "@/components/ui-audio/live-waveform";
import BorderBeam from "@/components/visual/border-beam";
import { resolveRovoAppComposerIdleAction } from "@/components/projects/shared/lib/rovo-app-composer-idle-action";
import { resolveRovoAppComposerWaveformState } from "@/components/projects/shared/lib/rovo-app-composer-waveform-state";
import { ROVO_WAVEFORM_COLOR_CSS_VARS } from "@/lib/rovo-colors";
import { cn } from "@/lib/utils";
import ArrowUpIcon from "@atlaskit/icon/core/arrow-up";
import CrossIcon from "@atlaskit/icon/core/cross";
import MicrophoneIcon from "@atlaskit/icon/core/microphone";
import AudioWaveformIcon from "@atlaskit/icon-lab/core/audio-waveform";

const ROVO_COMPOSER_WAVEFORM_INTRO_MS = 500;
const EXPERIMENTAL_DARK_CTA_CLASS_NAME = "bg-bg-neutral-bold text-text-inverse hover:bg-bg-neutral-bold-hovered active:bg-bg-neutral-bold-pressed";
const ACTIVE_VOICE_BEAM_PROPS = {
	colorVariant: "rovo" as const,
	size: "line" as const,
	strength: 0.95,
	theme: "dark" as const,
};

export type RovoComposerDictationState = "idle" | "recording" | "processing";

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
	micStream?: MediaStream | null;
	onStartDictation?: () => void;
	onStopDictation?: () => void;
	onStop: () => Promise<void> | void;
	onToggleRealtimeVoice?: () => void;
	realtimeVoiceActive?: boolean;
	realtimeVoiceState?: "idle" | "connecting" | "listening" | "speaking";
	screenAssistantTargetPrefix?: string;
	showBackgroundStop?: boolean;
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
	micStream = null,
	onStartDictation,
	onStopDictation,
	onStop,
	onToggleRealtimeVoice,
	realtimeVoiceActive = false,
	realtimeVoiceState = "idle",
	screenAssistantTargetPrefix,
	showBackgroundStop = false,
	submitButtonClassName,
	submitDisabled = false,
	voiceStartButtonClassName,
}: Readonly<RovoComposerActionButtonProps>): ReactElement {
	const realtimeWaveformIntroTimeoutRef = useRef<number | null>(null);
	const [isRealtimeWaveformIntroActive, setIsRealtimeWaveformIntroActive] = useState(false);
	const [isDictationOptimisticActive, setIsDictationOptimisticActive] = useState(false);
	const resolvedComposerBusy = isComposerBusy ?? (composerStatus === "submitted" || composerStatus === "streaming");
	const isDictationActive = dictationState !== "idle" || isDictationOptimisticActive;
	const idleAction = resolveRovoAppComposerIdleAction({
		canStartDictation: Boolean(onStartDictation),
		canStartRealtimeVoice: Boolean(onToggleRealtimeVoice),
		canSubmit,
		isComposerBusy: resolvedComposerBusy,
		realtimeVoiceActive,
		showBackgroundStop,
		submitDisabled,
	});
	const realtimeWaveformState = resolveRovoAppComposerWaveformState({
		hasMicStream: micStream !== null,
		isIntroActive: isRealtimeWaveformIntroActive,
		realtimeVoiceActive,
	});
	const isRealtimeListening = realtimeVoiceState === "listening" && realtimeWaveformState.active;
	const isRealtimeWaveformProcessing = !isRealtimeListening && realtimeVoiceActive;
	const isDictationRecording = dictationState === "recording" && micStream !== null;
	const experimentalDarkCtaClassName = experimentalDarkCta ? EXPERIMENTAL_DARK_CTA_CLASS_NAME : undefined;
	const shouldShowDictationStart = Boolean(onStartDictation) && !resolvedComposerBusy && !realtimeVoiceActive && !submitDisabled;
	const shouldShowRealtimeVoiceStart = idleAction === "voice-start" && !canSubmit && Boolean(onToggleRealtimeVoice);

	const clearRealtimeWaveformIntro = useCallback(() => {
		if (realtimeWaveformIntroTimeoutRef.current !== null) {
			window.clearTimeout(realtimeWaveformIntroTimeoutRef.current);
			realtimeWaveformIntroTimeoutRef.current = null;
		}
	}, []);

	const handleToggleRealtimeVoice = useCallback(() => {
		if (!onToggleRealtimeVoice) {
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
	}, [clearRealtimeWaveformIntro, onToggleRealtimeVoice, realtimeVoiceActive]);

	const handleStartDictation = useCallback(() => {
		setIsDictationOptimisticActive(true);
		onStartDictation?.();
	}, [onStartDictation]);

	const handleStopDictation = useCallback(() => {
		setIsDictationOptimisticActive(false);
		onStopDictation?.();
	}, [onStopDictation]);

	useEffect(() => {
		if (dictationState !== "idle" || realtimeVoiceActive) {
			setIsDictationOptimisticActive(false);
		}
	}, [dictationState, realtimeVoiceActive]);

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
						<BorderBeam {...ACTIVE_VOICE_BEAM_PROPS} className="inline-flex h-8 rounded-md">
							<div className="flex h-8 items-center gap-1 overflow-hidden rounded-md bg-bg-neutral-bold pl-1 pr-3 text-text-inverse shadow-sm">
								<button
									aria-hidden="true"
									className="hidden"
									disabled
									tabIndex={-1}
									type="submit"
								/>
								<button
									aria-label="Stop dictation"
									className="flex size-6 shrink-0 items-center justify-center rounded-sm text-text-inverse transition-colors hover:bg-bg-neutral-bold-hovered active:bg-bg-neutral-bold-pressed"
									onClick={handleStopDictation}
									type="button"
								>
									<CrossIcon label="" size="small" />
								</button>
								<span className="flex h-full w-8 shrink-0 items-center">
									<LiveWaveform
										active={isDictationRecording}
										barColor="currentColor"
										barColors={[...ROVO_WAVEFORM_COLOR_CSS_VARS]}
										barGap={2}
										barHeightScale={dictationState === "processing" ? 1.15 : 1}
										barOpacityMax={1}
										barOpacityMin={1}
										barWidth={2}
										barRadius={0}
										className="min-h-0 min-w-0 flex-1 animate-in fade-in duration-300"
										entranceAnimation="stagger"
										entranceDurationMs={180}
										entranceStaggerMs={14}
										fadeEdges={false}
										height="100%"
										mediaStream={isDictationRecording ? micStream : null}
										mode={isDictationRecording ? "scrolling" : "static"}
										processing={isDictationActive && !isDictationRecording}
									/>
								</span>
								{dictationTranscriptPreview ? (
									<span className="sr-only">Latest dictation transcript: {dictationTranscriptPreview}</span>
								) : null}
							</div>
						</BorderBeam>
					</motion.div>
				) : realtimeVoiceActive ? (
					<motion.div
						key="waveform"
						initial={{ opacity: 0, transform: "scale(0.8)" }}
						animate={{ opacity: 1, transform: "scale(1)" }}
						exit={{ opacity: 0, transform: "scale(0.8)" }}
						transition={{ type: "spring", bounce: 0, visualDuration: 0.15 }}
						style={{ willChange: "transform, opacity" }}
					>
						<BorderBeam {...ACTIVE_VOICE_BEAM_PROPS} className="inline-flex size-8 rounded-md">
							<button
								aria-label="Stop live voice"
								className="flex size-8 items-center justify-center overflow-hidden rounded-md bg-bg-neutral-bold p-0 text-text-inverse shadow-sm transition-colors hover:bg-bg-neutral-bold-hovered active:bg-bg-neutral-bold-pressed"
								onClick={handleToggleRealtimeVoice}
								type="button"
							>
								<span className="flex size-4 min-w-0 items-center justify-center overflow-hidden">
									<LiveWaveform
										active={isRealtimeListening}
										barColor="currentColor"
										barColors={[...ROVO_WAVEFORM_COLOR_CSS_VARS]}
										barGap={2}
										barHeightScale={isRealtimeWaveformProcessing ? 1.15 : 1}
										barOpacityMax={1}
										barOpacityMin={1}
										barWidth={2}
										barRadius={0}
										className="min-h-0 min-w-0 flex-1 animate-in fade-in duration-300"
										entranceAnimation="stagger"
										entranceDurationMs={180}
										entranceStaggerMs={14}
										fadeEdges={false}
										height="16px"
										mediaStream={isRealtimeListening ? micStream : null}
										mode={isRealtimeListening ? "scrolling" : "static"}
										processing={isRealtimeWaveformProcessing}
									/>
								</span>
							</button>
						</BorderBeam>
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
						<div className="flex items-center gap-1">
							{shouldShowDictationStart ? (
								<PromptInputButton
									variant="ghost"
									aria-label="Start dictation"
									className="size-8 hover:opacity-90 active:opacity-80"
									data-screen-assistant-target={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:dictation` : undefined}
									onClick={handleStartDictation}
									tooltip={{ content: "Dictate", delay: 0 }}
								>
									<MicrophoneIcon label="" />
								</PromptInputButton>
							) : null}
							{idleAction === "submit" ? (
								<PromptInputSubmit aria-label="Submit" className={cn("hover:opacity-90 active:opacity-80", experimentalDarkCtaClassName, submitButtonClassName)} disabled={submitDisabled || !canSubmit} onStop={() => void onStop()} size="icon-sm" status={composerStatus}>
									<ArrowUpIcon label="" />
								</PromptInputSubmit>
							) : null}
							{shouldShowRealtimeVoiceStart ? (
								<PromptInputButton
									variant="default"
									aria-label="Start live voice"
									className={cn("size-8 hover:opacity-90 active:opacity-80", experimentalDarkCtaClassName, voiceStartButtonClassName)}
									data-screen-assistant-target={screenAssistantTargetPrefix ? `${screenAssistantTargetPrefix}:voice` : undefined}
									onClick={handleToggleRealtimeVoice}
									tooltip={{ content: "Live chat", delay: 0 }}
								>
									<AudioWaveformIcon label="" />
								</PromptInputButton>
							) : null}
						</div>
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
						<PromptInputSubmit
							aria-label="Stop background work"
							onStop={() => void onStop()}
							size="icon-sm"
							status="streaming"
						>
							<ArrowUpIcon label="" />
						</PromptInputSubmit>
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
						<PromptInputSubmit aria-label="Stop" onStop={() => void onStop()} size="icon-sm" status={composerStatus}>
							<ArrowUpIcon label="" />
						</PromptInputSubmit>
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
	micStream,
	onCompanyKnowledgeChange,
	onOpenChange,
	onReasoningChange,
	onStop,
	onStartDictation,
	onStopDictation,
	onToggleRealtimeVoice,
	open,
	realtimeVoiceActive,
	realtimeVoiceState,
	screenAssistantTargetPrefix,
	selectedReasoning,
	showBackgroundStop,
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
		<div className={cn("flex h-8 min-w-0 shrink-0 items-center justify-end gap-1.5", className)} {...props}>
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
				micStream={micStream}
				onStop={onStop}
				onStartDictation={onStartDictation}
				onStopDictation={onStopDictation}
				onToggleRealtimeVoice={onToggleRealtimeVoice}
				realtimeVoiceActive={realtimeVoiceActive}
				realtimeVoiceState={realtimeVoiceState}
				screenAssistantTargetPrefix={screenAssistantTargetPrefix}
				showBackgroundStop={showBackgroundStop}
				submitButtonClassName={submitButtonClassName}
				submitDisabled={submitDisabled}
				voiceStartButtonClassName={voiceStartButtonClassName}
			/>
		</div>
	);
}
