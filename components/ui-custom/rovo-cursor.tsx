"use client";

import { memo } from "react";

import MicrophoneIcon from "@atlaskit/icon/core/microphone";

import { Icon } from "@/components/ui/icon";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Rovo brand color wheel as a conic gradient — the exact stops from Figma
 * (saffron → lime → blue → purple, starting at 90°). Painted through SVG masks
 * to produce the rainbow stroke around the cursor arrow and the rainbow ring
 * around the typing badge.
 */
const ROVO_CONIC =
	"conic-gradient(from 90deg, #FCA700 0deg, #FCA700 72.69deg, #6A9A23 72.73deg, #6A9A23 167.9deg, #1868DB 167.93deg, #1868DB 252.67deg, #AF59E1 252.7deg, #AF59E1 360deg)";

/** Pointer-arrow glyph (Figma viewBox 14.7568², centroid-weighted teardrop). */
const ARROW_PATH =
	"M0.5999 2.38246C0.160828 1.26482 1.26482 0.160828 2.38246 0.5999L13.3845 4.92213C14.5955 5.39786 14.5296 7.13348 13.2861 7.51611L8.87375 8.87375L7.51611 13.2861C7.13348 14.5296 5.39786 14.5955 4.92213 13.3845L0.5999 2.38246Z";

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

/**
 * Build a CSS `mask-image` whose visible region is the SVG path *dilated* by a
 * stroke — i.e. the arrow's body plus a halo wide enough to host the rainbow
 * stroke. Stacked behind the charcoal-body mask, only the dilation ring shows
 * through, producing a crisp gradient outline around the arrow.
 */
function maskOfStroke(path: string, w: number, h: number, strokeWidth: number) {
	const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'><path d='${path}' fill='%23000' stroke='%23000' stroke-width='${strokeWidth}' stroke-linejoin='round'/></svg>`;
	return `url("data:image/svg+xml,${svg.replace(/#/g, "%23").replace(/"/g, "'").replace(/\s+/g, " ")}")`;
}

const ARROW_MASK = maskOf(ARROW_PATH, 14.7568, 14.7568);
/** ~10% of glyph width on each side, matching Figma's `inset[-3.64%]` outline. */
const ARROW_STROKE_WIDTH = 1.5;
const ARROW_STROKE_MASK = maskOfStroke(ARROW_PATH, 14.7568, 14.7568, ARROW_STROKE_WIDTH);

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
	 * Animate the rainbow on the `cursor` arrow and `typing` ring (rotating
	 * conic gradient). The blinking caret, loading spinner, and speaking
	 * equalizer always animate regardless of this flag, and motion is suppressed
	 * under `prefers-reduced-motion`. @default true
	 */
	animated?: boolean;
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
 * a charcoal pointer wrapped in a Rovo-gradient stroke (`cursor`), a
 * rainbow-ringed microphone badge over a blinking caret (`typing`), a
 * rainbow indeterminate spinner (`loading`), and a 4-bar brand equalizer
 * (`speaking`). The rainbow on `cursor` and `typing` can rotate (`animated`)
 * or sit static. Motion is pure CSS and honors `prefers-reduced-motion`.
 */
export const RovoCursor = memo(
	({
		state = "cursor",
		size = 16,
		animated = true,
		className,
		...props
	}: Readonly<RovoCursorProps>) => {
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
					{state === "cursor" ? <Cursor scale={scale} animated={animated} /> : null}
					{state === "typing" ? <Typing scale={scale} animated={animated} /> : null}
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
 * Pointer arrow (16×16 at scale 1): charcoal body (`color.icon`) wrapped in a
 * Rovo-brand conic-gradient stroke. The stroke layer uses a dilated SVG mask,
 * the body uses the original mask, and stacking the two leaves a crisp rainbow
 * ring around the arrow.
 */
function Cursor({ scale, animated }: Readonly<{ scale: number; animated: boolean }>) {
	const s = 16 * scale;
	const bodyMask = maskStyle(ARROW_MASK);
	const strokeMask = maskStyle(ARROW_STROKE_MASK);
	return (
		<span style={{ position: "relative", display: "block", width: s, height: s }}>
			{/* Rainbow stroke layer — the dilated mask is fixed; a larger inner
			    span carries the conic gradient and rotates so the rainbow sweeps
			    around the arrow without distorting the outline. */}
			<span
				aria-hidden
				style={{
					position: "absolute",
					inset: 0,
					overflow: "hidden",
					...strokeMask,
				}}
			>
				<span
					className={animated ? "motion-reduce:[animation:none]" : undefined}
					style={{
						position: "absolute",
						inset: "-50%",
						background: ROVO_CONIC,
						animation: animated ? "rovo-cursor-spin 2.4s linear infinite" : undefined,
						willChange: animated ? "transform" : undefined,
					}}
				/>
			</span>
			<span className="bg-icon" style={{ position: "absolute", inset: 0, ...bodyMask }} />
		</span>
	);
}

/**
 * Microphone badge above a blinking caret leg (20×36 at scale 1). The badge
 * wears a Rovo conic-gradient ring rendered with the mask-composite border
 * technique; when `animated` the ring slowly rotates.
 */
function Typing({ scale, animated }: Readonly<{ scale: number; animated: boolean }>) {
	const badge = 20 * scale;
	const icon = 12 * scale;
	const ringWidth = Math.max(1, 1.5 * scale);
	const ringMask: React.CSSProperties = {
		WebkitMask:
			"linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
		mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
		WebkitMaskComposite: "xor",
		maskComposite: "exclude",
	};
	return (
		<span className="inline-flex flex-col items-center" style={{ width: badge }}>
			<span
				className="relative box-border inline-flex items-center justify-center rounded-full bg-[#101214] text-white"
				style={{ width: badge, height: badge, padding: 4 * scale }}
			>
				<span
					aria-hidden
					className="pointer-events-none absolute rounded-full"
					style={{
						inset: 0,
						padding: ringWidth,
						overflow: "hidden",
						...ringMask,
					}}
				>
					<span
						className={animated ? "motion-reduce:[animation:none]" : undefined}
						style={{
							position: "absolute",
							inset: "-50%",
							background: ROVO_CONIC,
							animation: animated ? "rovo-cursor-spin 3.6s linear infinite" : undefined,
							willChange: animated ? "transform" : undefined,
						}}
					/>
				</span>
				<Icon
					aria-hidden
					render={<MicrophoneIcon label="" />}
					className="relative [&_svg]:size-full"
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

/**
 * Indeterminate spinner — delegates to the shared `Spinner` with the `rainbow`
 * variant so the same brand-gradient arc is reused across the design system.
 */
function Loading({ scale }: Readonly<{ scale: number }>) {
	const s = 12 * scale;
	return <Spinner variant="rainbow" className="size-auto" style={{ width: s, height: s }} />;
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
