"use client";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import RefreshIcon from "@atlaskit/icon/core/refresh";
import VideoPauseIcon from "@atlaskit/icon/core/video-pause";
import VideoPlayIcon from "@atlaskit/icon/core/video-play";

import { ROVO_P5_CYCLE_SECONDS } from "@/components/arts/rovo-p5/lib/rovo-p5-timeline";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface RovoP5TransportProps {
	readonly playing: boolean;
	readonly elapsed: number;
	readonly stageLabel: string;
	readonly disabled: boolean;
	readonly onTogglePlay: () => void;
	readonly onRestart: () => void;
	readonly onSeek: (seconds: number) => void;
	readonly onMinimize: () => void;
	readonly className?: string;
}

function formatClock(seconds: number): string {
	const whole = Math.max(0, Math.floor(seconds));
	return `0:${String(whole).padStart(2, "0")}`;
}

export default function RovoP5Transport({
	playing,
	elapsed,
	stageLabel,
	disabled,
	onTogglePlay,
	onRestart,
	onSeek,
	onMinimize,
	className,
}: RovoP5TransportProps) {
	return (
		<div className={cn("flex items-center gap-3", className)}>
			<Button
				aria-label={playing ? "Pause the cycle" : "Play the cycle"}
				disabled={disabled}
				onClick={onTogglePlay}
				size="icon"
				variant="ghost"
			>
				{playing ? (
					<VideoPauseIcon label="" size="small" />
				) : (
					<VideoPlayIcon label="" size="small" />
				)}
			</Button>

			<Button
				aria-label="Restart the cycle"
				disabled={disabled}
				onClick={onRestart}
				size="icon"
				variant="ghost"
			>
				<RefreshIcon label="" size="small" />
			</Button>

			<Slider
				aria-label="Scrub the cycle"
				className="min-w-0 flex-1"
				disabled={disabled}
				max={ROVO_P5_CYCLE_SECONDS}
				min={0}
				onValueChange={(next) => onSeek(Array.isArray(next) ? (next[0] ?? 0) : next)}
				step={0.05}
				value={Math.min(elapsed, ROVO_P5_CYCLE_SECONDS)}
			/>

			<span className="shrink-0 font-mono text-[11px] tabular-nums text-text-subtlest">
				{formatClock(elapsed)} / {formatClock(ROVO_P5_CYCLE_SECONDS)}
			</span>

			<span className="hidden w-32 shrink-0 truncate text-[11px] text-text-subtle sm:block">
				{disabled ? "Motion reduced" : stageLabel}
			</span>

			{/* Not gated on `disabled`: tucking the bar away is the whole point when
			    capturing the canvas, and that is exactly when the timeline may be
			    off or motion reduced. */}
			<Button
				aria-label="Hide the playback controls"
				className="shrink-0"
				onClick={onMinimize}
				size="icon"
				variant="ghost"
			>
				<ChevronDownIcon label="" size="small" />
			</Button>
		</div>
	);
}
