"use client";

// oxlint-disable react-doctor/media-has-caption -- Prototype recordings ship without a caption asset; consumers pass their own <track> via `children` when one exists.

import type { CSSProperties, ReactNode } from "react";

import {
	MediaControlBar,
	MediaController,
	MediaFullscreenButton,
	MediaMuteButton,
	MediaPlayButton,
	MediaTimeDisplay,
	MediaTimeRange,
	MediaVolumeRange,
} from "media-chrome/react";

import { cn } from "@/lib/utils";

export interface VideoPlayerProps {
	/** Video file URL, e.g. `/videos/debug-video.mp4`. */
	src: string;
	/** Accessible name for the media element, e.g. "Guest checkout walkthrough". */
	label: string;
	/** Optional poster frame shown before first play. */
	poster?: string;
	/** MIME type for the source. Defaults to `video/mp4`. */
	mimeType?: string;
	/** Optional `<track>` elements (captions, subtitles, chapters). */
	children?: ReactNode;
	className?: string;
}

/**
 * Colors for chrome that sits *on top of video pixels*, so they deliberately do
 * not follow the app theme — controls must stay legible against the frame in
 * both light and dark mode. The range bar is the one themed value: ADS brand
 * bold reads clearly over video in either theme.
 */
const OVER_MEDIA_STYLE = {
	"--media-background-color": "transparent",
	"--media-button-icon-height": "1rem",
	"--media-button-icon-width": "1rem",
	"--media-control-background": "transparent",
	"--media-control-hover-background": "rgb(255 255 255 / 0.16)",
	"--media-font": "var(--font-sans)",
	"--media-font-size": "0.75rem",
	"--media-icon-color": "rgb(255 255 255)",
	"--media-primary-color": "rgb(255 255 255)",
	"--media-range-bar-color": "var(--color-primary)",
	"--media-range-thumb-background": "rgb(255 255 255)",
	"--media-range-track-background": "rgb(255 255 255 / 0.28)",
	"--media-secondary-color": "rgb(255 255 255 / 0.28)",
	"--media-text-color": "rgb(255 255 255)",
	"--media-tooltip-arrow-display": "none",
	"--media-tooltip-background": "rgb(0 0 0 / 0.82)",
	"--media-tooltip-border-radius": "var(--radius-md)",
	"--media-tooltip-text-shadow": "none",
} as CSSProperties;

/**
 * Bottom scrim so white control chrome stays legible over bright footage. The
 * gradient holds full strength across the 44px control row and only fades over
 * the padding above it — a straight transparent-to-dark ramp lands the buttons
 * mid-fade, where white-on-video contrast drops to roughly 2.4:1.
 */
const CONTROL_BAR_SCRIM = {
	background:
		"linear-gradient(to top, rgb(0 0 0 / 0.78) 0, rgb(0 0 0 / 0.72) 2.75rem, rgb(0 0 0 / 0) 100%)",
} as CSSProperties;

export function VideoPlayer({
	src,
	label,
	poster,
	mimeType = "video/mp4",
	children,
	className,
}: Readonly<VideoPlayerProps>) {
	return (
		<MediaController
			className={cn(
				"block w-full overflow-hidden rounded-lg bg-bg-neutral-bold",
				// media-chrome auto-hides the control bar during playback. Source both
				// halves of that fade from motion tokens (popup-family enter, faster
				// practical exit) instead of its 0.25s/1s defaults.
				"[--media-control-transition-in:opacity_var(--duration-normal)_var(--ease-out-practical)]",
				"[--media-control-transition-out:opacity_var(--duration-fast)_var(--ease-in)]",
				"motion-reduce:[--media-control-transition-in:none] motion-reduce:[--media-control-transition-out:none]",
				className,
			)}
			style={OVER_MEDIA_STYLE}
		>
			<video
				aria-label={label}
				className="h-full w-full"
				playsInline
				poster={poster}
				preload="metadata"
				slot="media"
			>
				<source src={src} type={mimeType} />
				{children}
			</video>
			<MediaControlBar
				className="flex w-full items-center gap-1 px-2 pt-6 pb-1"
				style={CONTROL_BAR_SCRIM}
			>
				<MediaPlayButton />
				<MediaTimeRange className="min-w-0 flex-1" />
				<MediaTimeDisplay className="shrink-0 tabular-nums" showDuration />
				<MediaMuteButton />
				<MediaVolumeRange className="w-16 shrink-0" />
				<MediaFullscreenButton />
			</MediaControlBar>
		</MediaController>
	);
}
