"use client";

import { CursorWorkingTeam } from "@/components/arts/cursors/cursor-working-team";
import { RovoCursorTrackingIcon } from "@/components/projects/shared/components/rovo-cursor-tracking-icon";
import { LiveWaveform } from "@/components/ui-audio/live-waveform";
import { RovoCursor } from "@/components/ui-custom/rovo-cursor";
import { ROVO_WAVEFORM_COLOR_CSS_VARS } from "@/lib/rovo-colors";
import { cn } from "@/lib/utils";
import AudioWaveformIcon from "@atlaskit/icon-lab/core/audio-waveform";

interface CursorVoiceControlProps {
	/** Whether cursor (clicky) mode is on. */
	clickyActive: boolean;
	/** Whether a realtime voice session is connected (connecting/listening/speaking). */
	voiceActive: boolean;
	/** Whether the mic is actively capturing the user's speech. */
	listening: boolean;
	/**
	 * Whether the dispatched team is now working. Swaps the cursor glyph to the
	 * rainbow painting cursor and lets the rail expand leftward on hover/focus to
	 * reveal the {@link CursorWorkingTeam}.
	 */
	working: boolean;
	micStream: MediaStream | null;
	onToggleCursor: () => void;
	onToggleVoice: () => void;
}

/**
 * The Cursors art's always-visible cursor + voice rail.
 *
 * The active segment has a dark (neutral-bold) background that grows right-to-left to
 * cover the cursor when cursor mode turns on. Icons sit light on the dark segment. Stays
 * in an idle visual state until the human clicks: the voice button shows a calm
 * monochrome waveform glyph until a session connects, then swaps to the live colored
 * waveform. Once the team is `working`, the cursor glyph becomes the rainbow painting
 * cursor and the rail expands leftward on hover/focus to reveal {@link CursorWorkingTeam}
 * on the light base.
 */
export function CursorVoiceControl({
	clickyActive,
	voiceActive,
	listening,
	working,
	micStream,
	onToggleCursor,
	onToggleVoice,
}: Readonly<CursorVoiceControlProps>) {
	return (
		<div
			className={cn(
				"group relative flex h-9 items-center justify-end overflow-hidden rounded-[8px] transition-[width] duration-medium ease-in-out motion-reduce:transition-none",
				working ? "w-[68px] hover:w-[168px] focus-within:w-[168px]" : "w-[68px]",
			)}
		>
			<span aria-hidden="true" className="absolute inset-0 rounded-[8px] bg-bg-neutral" />
			{/* Team revealed on the light base in the LEFT segment. Clipped to w-0 while
			    collapsed; width grows in step with the rail when working + hovered/focused. */}
			<div
				className={cn(
					"relative z-10 flex h-full items-center overflow-hidden pl-1 transition-[width,opacity] duration-medium ease-in-out motion-reduce:transition-none",
					working
						? "w-0 opacity-0 group-hover:w-[100px] group-hover:opacity-100 group-focus-within:w-[100px] group-focus-within:opacity-100"
						: "w-0 opacity-0",
				)}
			>
				{working ? <CursorWorkingTeam /> : null}
			</div>
			{/* Dark background pinned to the right (voice) button. Turning on cursor mode
			    grows its width leftward so it extends to cover the cursor too. */}
			<span
				aria-hidden="true"
				className={cn(
					"absolute top-0.5 right-0.5 bottom-0.5 rounded-md bg-bg-neutral-bold shadow-sm transition-[width] duration-medium ease-in-out motion-reduce:transition-none",
					clickyActive || working ? "w-16" : "w-8",
				)}
			/>
			<div className="relative z-10 flex h-8 w-16 shrink-0 items-center gap-0">
				<button
					type="button"
					aria-label="Rovo cursor"
					aria-pressed={clickyActive}
					onClick={onToggleCursor}
					className={cn(
						"flex size-8 shrink-0 items-center justify-center rounded-md border border-transparent p-0 outline-none transition-colors hover:opacity-90 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:opacity-80",
						clickyActive ? "text-text-inverse" : "text-icon-subtle",
					)}
				>
					{working ? (
						<RovoCursor state="painting" size={20} />
					) : (
						<RovoCursorTrackingIcon active={clickyActive} />
					)}
				</button>
				<button
					type="button"
					aria-label={voiceActive ? "Stop live voice" : "Start live voice"}
					aria-pressed={voiceActive}
					onClick={onToggleVoice}
					className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md p-0 text-text-inverse outline-none transition-colors hover:opacity-90 focus-visible:ring-3 focus-visible:ring-ring/50 active:opacity-80"
				>
					{voiceActive ? (
						<span className="flex h-full w-4 shrink-0 items-center">
							<LiveWaveform
								active={listening}
								barColor="currentColor"
								barColors={[...ROVO_WAVEFORM_COLOR_CSS_VARS]}
								barCount={4}
								barGap={2}
								barHeightScale={1}
								barOpacityMax={1}
								barOpacityMin={1}
								barWidth={2}
								barRadius={0}
								className="min-h-0 min-w-0 flex-1"
								fadeEdges={false}
								fftSize={512}
								height="100%"
								mediaStream={listening ? micStream : null}
								mode="static"
								processing={voiceActive && !listening}
								sensitivity={2.4}
								smoothingTimeConstant={0.35}
							/>
						</span>
					) : (
						<AudioWaveformIcon label="" />
					)}
				</button>
			</div>
		</div>
	);
}
