"use client";

import { memo } from "react";

import MicrophoneIcon from "@atlaskit/icon/core/microphone";

import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Rovo brand color wheel as a conic gradient — the exact stops from Figma
 * (saffron → lime → blue → purple, starting at 90°). Shared by the pointer
 * arrow (`cursor`) and the spinner (`loading`).
 */
const ROVO_CONIC =
	"conic-gradient(from 39deg, #FCA700 0deg, #FCA700 72.69deg, #6A9A23 72.73deg, #6A9A23 167.9deg, #1868DB 167.93deg, #1868DB 252.67deg, #AF59E1 252.7deg, #AF59E1 360deg)";

/** Pointer-arrow glyph (Figma viewBox 14.7568², centroid-weighted teardrop). */
const ARROW_PATH =
	"M0.5999 2.38246C0.160828 1.26482 1.26482 0.160828 2.38246 0.5999L13.3845 4.92213C14.5955 5.39786 14.5296 7.13348 13.2861 7.51611L8.87375 8.87375L7.51611 13.2861C7.13348 14.5296 5.39786 14.5955 4.92213 13.3845L0.5999 2.38246Z";

/** Spinner arc glyph (Figma viewBox 11.1662 × 11.88, open ~300° ring with rounded caps). */
const SPINNER_PATH =
	"M9.95645 3.25339L10.3912 3.00646L9.95645 3.25339ZM10.6658 5.99772L11.1658 6.00302L10.6658 5.99772ZM9.89838 8.72637L10.3278 8.98247L9.89838 8.72637ZM7.86242 10.6985L7.62012 10.2612L7.86242 10.6985ZM5.22615 0.5V1C6.09923 1 6.95671 1.23139 7.71127 1.6706L7.96279 1.23847L8.21432 0.806345C7.30702 0.278227 6.27596 0 5.22615 0V0.5ZM7.96279 1.23847L7.71127 1.6706C8.46582 2.10981 9.0905 2.74115 9.52168 3.50032L9.95645 3.25339L10.3912 3.00646C9.87276 2.09361 9.12163 1.33446 8.21432 0.806345L7.96279 1.23847ZM9.95645 3.25339L9.52168 3.50032C9.95286 4.2595 10.1751 5.11938 10.1659 5.99241L10.6658 5.99772L11.1658 6.00302C11.177 4.95327 10.9097 3.91931 10.3912 3.00646L9.95645 3.25339ZM10.6658 5.99772L10.1659 5.99241C10.1566 6.86544 9.91614 7.72042 9.46895 8.47027L9.89838 8.72637L10.3278 8.98247C10.8655 8.08082 11.1547 7.05277 11.1658 6.00302L10.6658 5.99772ZM9.89838 8.72637L9.46895 8.47027C9.02176 9.22013 8.38382 9.83807 7.62012 10.2612L7.86242 10.6985L8.10473 11.1359C9.02303 10.6272 9.7901 9.88412 10.3278 8.98247L9.89838 8.72637ZM7.86242 10.6985L7.62012 10.2612C6.85641 10.6843 5.99421 10.8974 5.12133 10.8789L5.11072 11.3788L5.10012 11.8787C6.14969 11.9009 7.18642 11.6447 8.10473 11.1359L7.86242 10.6985ZM5.11072 11.3788L5.12133 10.8789C4.24845 10.8604 3.39608 10.6108 2.65101 10.1557L2.39037 10.5824L2.12972 11.0091C3.02562 11.5563 4.05054 11.8564 5.10012 11.8787L5.11072 11.3788ZM2.39037 10.5824L2.65101 10.1557C1.90594 9.70059 1.2948 9.05614 0.879823 8.28799L0.439912 8.52564L0 8.76329C0.498977 9.68694 1.23383 10.4618 2.12972 11.0091L2.39037 10.5824Z";

/** Speaking equalizer bars — exact Figma heights + Primary palette colors, left→right. */
const SPEAKING_BARS = [
	{ height: 6, color: "#1868DB", delay: "0s" }, // Blue 700
	{ height: 16, color: "#82B536", delay: "0.15s" }, // Lime 500
	{ height: 12, color: "#BF63F3", delay: "0.3s" }, // Purple 500
	{ height: 4, color: "#FCA700", delay: "0.45s" }, // Saffron 400
] as const;

const KEYFRAMES = `
@keyframes rovo-cursor-spin { to { transform: rotate(360deg); } }
@keyframes rovo-cursor-blink { 0%, 45% { opacity: 1; } 50%, 95% { opacity: 0; } 100% { opacity: 1; } }
@keyframes rovo-cursor-eq { 0%, 100% { transform: scaleY(0.35); } 50% { transform: scaleY(1); } }
`;

/** Build a CSS `mask-image` value from an SVG path so a gradient can be clipped to its shape. */
function maskOf(path: string, w: number, h: number) {
	const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'><path d='${path}' fill='%23000'/></svg>`;
	return `url("data:image/svg+xml,${svg.replace(/#/g, "%23").replace(/"/g, "'").replace(/\s+/g, " ")}")`;
}

const ARROW_MASK = maskOf(ARROW_PATH, 14.7568, 14.7568);
const SPINNER_MASK = maskOf(SPINNER_PATH, 11.1662, 11.88);

/** Inline style that clips an element's paint (background/gradient) to an SVG mask shape. */
function maskStyle(image: string) {
	return {
		WebkitMaskImage: image,
		maskImage: image,
		WebkitMaskRepeat: "no-repeat",
		maskRepeat: "no-repeat",
		WebkitMaskSize: "contain",
		maskSize: "contain",
		WebkitMaskPosition: "center",
		maskPosition: "center",
	} as const;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RovoCursorState = "cursor" | "typing" | "loading" | "speaking";

export interface RovoCursorProps {
	/** Which state to render. @default "cursor" */
	state?: RovoCursorState;
	/**
	 * Base glyph unit in pixels (the `cursor` arrow's edge). Every state scales
	 * proportionally from this; defaults to the Figma values. @default 16
	 */
	size?: number;
	/**
	 * Accessible label. When provided the glyph is `role="img"`; otherwise it is
	 * `aria-hidden` (decorative, sitting alongside visible text).
	 */
	"aria-label"?: string;
	/** Additional CSS classes applied to the wrapper. */
	className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * RovoCursor — an inline agent-presence indicator that swaps glyph per state:
 * a charcoal pointer with a Rovo-gradient glow (`cursor`), a microphone badge
 * over a blinking caret (`typing`), a spinning brand arc (`loading`), and a
 * 4-bar equalizer (`speaking`). Motion is pure CSS and honors
 * `prefers-reduced-motion`.
 */
export const RovoCursor = memo(
	({ state = "cursor", size = 16, className, ...props }: Readonly<RovoCursorProps>) => {
		const label = props["aria-label"];
		const a11y = label
			? ({ role: "img", "aria-label": label } as const)
			: ({ "aria-hidden": true } as const);
		const scale = size / 16;

		return (
			<>
				<style dangerouslySetInnerHTML={{ __html: KEYFRAMES }} />
				<span
					data-slot="rovo-cursor"
					data-state={state}
					className={cn("inline-flex shrink-0 items-center justify-center", className)}
					{...a11y}
				>
					{state === "cursor" ? <Cursor scale={scale} /> : null}
					{state === "typing" ? <Typing scale={scale} /> : null}
					{state === "loading" ? <Loading scale={scale} /> : null}
					{state === "speaking" ? <Speaking scale={scale} /> : null}
				</span>
			</>
		);
	},
);

RovoCursor.displayName = "RovoCursor";

// ---------------------------------------------------------------------------
// State glyphs
// ---------------------------------------------------------------------------

/**
 * Pointer arrow (16×16 at scale 1): a theme-aware charcoal body (`color.icon`)
 * wearing a fixed Rovo-brand gradient glow. Static.
 */
function Cursor({ scale }: Readonly<{ scale: number }>) {
	const s = 16 * scale;
	const mask = maskStyle(ARROW_MASK);
	return (
		<span style={{ position: "relative", display: "block", width: s, height: s }}>
			<span
				style={{
					position: "absolute",
					inset: 0,
					background: ROVO_CONIC,
					filter: `blur(${Math.max(1.5, s * 0.16)}px)`,
					...mask,
				}}
			/>
			<span className="bg-icon" style={{ position: "absolute", inset: 0, ...mask }} />
		</span>
	);
}

/** Microphone badge (black, saffron ring) above a blinking caret leg (20×36 at scale 1). */
function Typing({ scale }: Readonly<{ scale: number }>) {
	const badge = 20 * scale;
	const icon = 12 * scale;
	return (
		<span className="inline-flex flex-col items-center" style={{ width: badge }}>
			<span
				className="box-border inline-flex items-center justify-center rounded-full border-solid border-[#fca700] bg-[#101214] text-white"
				style={{ width: badge, height: badge, padding: 4 * scale, borderWidth: Math.max(1, 1.5 * scale) }}
			>
				<Icon
					aria-hidden
					render={<MicrophoneIcon label="" />}
					className="[&_svg]:size-full"
					style={{ width: icon, height: icon }}
				/>
			</span>
			<span
				className="motion-reduce:animate-none rounded-full bg-icon"
				style={{
					width: Math.max(1, scale),
					height: 16 * scale,
					animation: "rovo-cursor-blink 1.1s steps(1, end) infinite",
					willChange: "opacity",
				}}
			/>
		</span>
	);
}

/** Indeterminate spinner — Rovo-gradient arc rotating (12×12 at scale 1). */
function Loading({ scale }: Readonly<{ scale: number }>) {
	return (
		<span
			className="motion-reduce:animate-none"
			style={{
				display: "block",
				width: 12 * scale,
				height: 12 * scale,
				background: ROVO_CONIC,
				animation: "rovo-cursor-spin 0.8s linear infinite",
				willChange: "transform",
				...maskStyle(SPINNER_MASK),
			}}
		/>
	);
}

/** Four brand-colored bars pulsing their height out of phase (14×16 at scale 1). */
function Speaking({ scale }: Readonly<{ scale: number }>) {
	return (
		<span className="inline-flex items-center" style={{ height: 16 * scale, gap: 2 * scale }}>
			{SPEAKING_BARS.map((bar) => (
				<span
					key={bar.color}
					className="motion-reduce:animate-none"
					style={{
						width: 2 * scale,
						height: bar.height * scale,
						borderRadius: 8 * scale,
						backgroundColor: bar.color,
						transformOrigin: "center",
						animation: "rovo-cursor-eq 0.9s ease-in-out infinite",
						animationDelay: bar.delay,
						willChange: "transform",
					}}
				/>
			))}
		</span>
	);
}
