"use client";

import { cn } from "@/lib/utils";
import { ClickyOverlay } from "@/components/projects/studio/components/clicky/clicky-overlay";
import { ScreenAssistantControls } from "./screen-assistant-controls";
import { ScreenAssistantTranscript } from "./screen-assistant-transcript";
import { useScreenAssistant } from "./use-screen-assistant";
import type { ScreenAssistantProps } from "./types";

// ---------------------------------------------------------------------------
// ScreenAssistant — one isolated, drop-in unit that bundles the two Studio
// experiences:
//   • "AI Cursor" (Clicky): the on-screen cursor companion + pointing overlay.
//   • "Live chat": the OpenAI Realtime voice conversation + live transcript.
//
// It is decoupled from Studio's chat/agent/artifact plumbing via the optional
// `adapter` prop, and ships self-contained defaults so it runs standalone in a
// sandbox. A host (Studio, Rovo, a future surface) can pass an adapter to wire
// the app-owned tools (get_screen_state, point_at_target, set_composer_text,
// submit_composer, apply_agent_draft_patch, delegate_to_rovo) into real
// behavior when re-integrating.
// ---------------------------------------------------------------------------

export function ScreenAssistant({
	adapter,
	chatMessages,
	defaultActive = false,
	onActiveChange,
	showControls = true,
	showTranscript = true,
	showHarnessControls = false,
	className,
}: Readonly<ScreenAssistantProps>) {
	const assistant = useScreenAssistant({
		adapter,
		chatMessages,
		defaultActive,
		onActiveChange,
	});

	const statusLabel = assistant.isRealtimeActive
		? assistant.realtime.voiceState
		: assistant.realtime.connectionState === "connecting"
			? "connecting"
			: null;

	return (
		<>
			{/* AI cursor companion overlay (fixed, pointer-events-none) */}
			<ClickyOverlay
				state={assistant.clicky.state}
				pointTarget={assistant.clicky.pointTarget}
				responseText={assistant.clicky.responseText}
				history={assistant.clicky.history}
				screenshotDimensions={assistant.clicky.screenshotDimensions}
				onReturnToIdle={assistant.clicky.returnToIdle}
			/>

			{(showControls || showTranscript) ? (
				<div
					className={cn(
						"pointer-events-auto fixed bottom-4 right-4 z-[9990] flex flex-col gap-3",
						className,
					)}
				>
					{showTranscript ? (
						<ScreenAssistantTranscript
							transcript={assistant.transcript}
							liveUserTranscript={assistant.liveUserTranscript}
							liveAssistantTranscript={assistant.liveAssistantTranscript}
							statusLabel={statusLabel}
						/>
					) : null}
					{showControls ? (
						<ScreenAssistantControls
							assistant={assistant}
							showHarnessControls={showHarnessControls}
						/>
					) : null}
				</div>
			) : null}
		</>
	);
}
