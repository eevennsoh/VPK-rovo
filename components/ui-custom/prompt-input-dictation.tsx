"use client";

import CrossIcon from "@atlaskit/icon/core/cross";
import MicrophoneIcon from "@atlaskit/icon/core/microphone";

import { LiveWaveform } from "@/components/ui-audio/live-waveform";
import { PromptInputButton } from "@/components/ui-custom/prompt-input-button";
import { ROVO_WAVEFORM_COLOR_CSS_VARS } from "@/lib/rovo-colors";
import { cn } from "@/lib/utils";

export type PromptInputDictationState = "idle" | "listening" | "processing";

export interface PromptInputDictationControlProps {
	className?: string;
	disabled?: boolean;
	mediaStream?: MediaStream | null;
	onStart?: () => void;
	onStop?: () => void;
	screenAssistantTarget?: string;
	state?: PromptInputDictationState;
	supported?: boolean;
	transcriptPreview?: string | null;
}

/**
 * Controlled dictation chrome for PromptInput.
 *
 * Speech recognition, microphone permission, transcript commits, and state
 * transitions stay with the host. This component only renders the shared
 * idle/listening/processing affordance and forwards user intent.
 */
export const PromptInputDictationControl = ({
	className,
	disabled = false,
	mediaStream = null,
	onStart,
	onStop,
	screenAssistantTarget,
	state = "idle",
	supported = true,
	transcriptPreview = null,
}: Readonly<PromptInputDictationControlProps>) => {
	if (!supported) {
		return null;
	}

	if (state === "idle") {
		return (
			<PromptInputButton
				aria-label="Start dictation"
				className={cn("size-8 hover:opacity-90 active:opacity-80", className)}
				data-screen-assistant-target={screenAssistantTarget}
				disabled={disabled}
				onClick={onStart}
				tooltip={{ content: "Dictate", delay: 0 }}
				variant="ghost"
			>
				<MicrophoneIcon label="" />
			</PromptInputButton>
		);
	}

	const isListening = state === "listening" && mediaStream !== null;

	return (
		<div
			className={cn(
				"flex h-8 items-center gap-1 overflow-hidden rounded-md bg-bg-neutral-bold pl-1 pr-3 text-text-inverse shadow-sm",
				className,
			)}
			data-dictation-state={state}
		>
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
				disabled={disabled}
				onClick={onStop}
				type="button"
			>
				<CrossIcon label="" size="small" />
			</button>
			<span className="flex h-full w-8 shrink-0 items-center">
				<LiveWaveform
					active={isListening}
					barColor="currentColor"
					barColors={[...ROVO_WAVEFORM_COLOR_CSS_VARS]}
					barCount={8}
					barGap={2}
					barHeightScale={state === "processing" ? 1.15 : 1}
					barOpacityMax={1}
					barOpacityMin={1}
					barRadius={0}
					barWidth={2}
					className="min-h-0 min-w-0 flex-1 animate-in fade-in duration-slow"
					entranceAnimation="stagger"
					entranceDurationMs={180}
					entranceStaggerMs={14}
					fadeEdges={false}
					fftSize={512}
					height="100%"
					mediaStream={isListening ? mediaStream : null}
					mode="static"
					processing={!isListening}
					sensitivity={2.4}
					smoothingTimeConstant={0.35}
				/>
			</span>
			{transcriptPreview ? (
				<span className="sr-only">
					Latest dictation transcript: {transcriptPreview}
				</span>
			) : null}
		</div>
	);
};
