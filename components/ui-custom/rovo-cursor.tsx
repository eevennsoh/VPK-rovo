"use client";

// oxlint-disable react-doctor/prefer-module-scope-static-value -- These values are intentionally colocated with the component/demo contract for readability and token context.

import { memo } from "react";

import MicrophoneIcon from "@atlaskit/icon/core/microphone";
import { motion, useReducedMotion } from "motion/react";

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
	{ height: 6, color: "#1868DB", delay: 0 }, // Blue 700
	{ height: 16, color: "#82B536", delay: 0.15 }, // Lime 500
	{ height: 12, color: "#BF63F3", delay: 0.3 }, // Purple 500
	{ height: 4, color: "#FCA700", delay: 0.45 }, // Saffron 400
] as const;

/** Looping equalizer oscillation — value animation, not a physical pop, so it
 * stays easing-based. Per-bar phase is set via `delay` at the call site. */
const SPEAKING_LOOP_TRANSITION = {
	duration: 0.9,
	repeat: Infinity,
	ease: "easeInOut",
} as const;

/** Mount-in spring used both when starting the loop and when reduced motion is
 * preferred (the bars settle to a steady mid-height instead of looping). */
const SPEAKING_MOUNT_TRANSITION = {
	type: "spring",
	bounce: 0.2,
	visualDuration: 0.4,
} as const;

const KEYFRAMES = `
@keyframes rovo-cursor-spin { to { transform: rotate(360deg); } }
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
 *
 * The `pad` parameter expands the SVG `viewBox` on every side so the stroke
 * can render fully without being clipped by the viewBox edge. The caller is
 * responsible for stretching the painted span by the same factor so the
 * stroked path lines up pixel-perfect with the unpadded body mask.
 */
function maskOfStroke(path: string, w: number, h: number, strokeWidth: number, pad: number) {
	const vb = `${-pad} ${-pad} ${w + 2 * pad} ${h + 2 * pad}`;
	const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${vb}'><path d='${path}' fill='%23000' stroke='%23000' stroke-width='${strokeWidth}' stroke-linejoin='round'/></svg>`;
	return `url("data:image/svg+xml,${svg.replace(/#/g, "%23").replace(/"/g, "'").replace(/\s+/g, " ")}")`;
}

const ARROW_VIEWBOX = 14.7568;
const ARROW_MASK = maskOf(ARROW_PATH, ARROW_VIEWBOX, ARROW_VIEWBOX);
/** ~10% of glyph width on each side, matching Figma's `inset[-3.64%]` outline. */
const ARROW_STROKE_WIDTH = 1.5;
/** Padding (in viewBox units) added around the stroke mask so the dilated arrow
 * isn't clipped by the SVG viewBox; ½ stroke width plus a comfortable margin. */
const ARROW_STROKE_PAD = 1;
const ARROW_STROKE_MASK = maskOfStroke(
	ARROW_PATH,
	ARROW_VIEWBOX,
	ARROW_VIEWBOX,
	ARROW_STROKE_WIDTH,
	ARROW_STROKE_PAD,
);
/** Linear scale from body-mask coordinates to stroke-mask coordinates. The
 * stroke layer span is multiplied by this so 1 stroke-viewBox unit lines up
 * with 1 body-viewBox unit pixel-for-pixel inside the wrapper. */
const ARROW_STROKE_SCALE = (ARROW_VIEWBOX + 2 * ARROW_STROKE_PAD) / ARROW_VIEWBOX;

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

export type RovoCursorState = "cursor" | "typing" | "telepointer" | "loading" | "speaking";

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
	 * conic gradient). The loading spinner and speaking equalizer always animate
	 * regardless of this flag, and motion is suppressed under
	 * `prefers-reduced-motion`. @default true
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
 * rainbow-ringed microphone badge above a static caret stick (`typing`), a
 * blue text-insertion caret with a rainbow-bordered "Rovo" name pill
 * (`telepointer`), a rainbow indeterminate spinner (`loading`), and a 4-bar
 * brand equalizer (`speaking`). The rainbow on `cursor`, `typing`, and
 * `telepointer` can rotate (`animated`) or sit static. Motion is pure CSS and
 * honors `prefers-reduced-motion`.
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
					{state === "telepointer" ? <Telepointer scale={scale} animated={animated} /> : null}
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
	// The stroke mask uses a viewBox padded by ARROW_STROKE_PAD on each side so
	// the dilated arrow can render without being clipped. We compensate by
	// scaling the painted span up by the same factor (and inset it negatively)
	// so the stroke aligns with the body mask pixel-for-pixel.
	const strokeSpan = s * ARROW_STROKE_SCALE;
	const strokeOffset = (s - strokeSpan) / 2;
	return (
		<span
			style={{
				position: "relative",
				display: "block",
				width: s,
				height: s,
				overflow: "visible",
			}}
		>
			{/* Rainbow stroke layer — the dilated mask sits in a span larger than
			    the wrapper; a still-larger inner span carries the conic gradient
			    and rotates so the rainbow sweeps around the arrow. */}
			<span
				aria-hidden
				style={{
					position: "absolute",
					top: strokeOffset,
					left: strokeOffset,
					width: strokeSpan,
					height: strokeSpan,
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
 * Microphone badge wearing a Rovo conic-gradient ring above a static caret
 * stick (20×36 at scale 1, mic icon `size="small"` = 12px). The ring uses the mask-composite border technique
 * and rotates when `animated`; the caret stick below the badge is a plain
 * rectangle (no radius, no animation) marking the typing insertion point.
 */
function Typing({ scale, animated }: Readonly<{ scale: number; animated: boolean }>) {
	// 20u badge with a 12u small-sized microphone icon centered inside (4u
	// padding per side). The icon uses `@atlaskit/icon`'s `size="small"`
	// (12px) so its intrinsic size stays constant.
	const badge = 20 * scale;
	const padding = 4 * scale;
	const ringWidth = Math.max(1, 0.6 * scale);
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
				style={{ width: badge, height: badge, padding }}
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
					render={<MicrophoneIcon label="" size="small" />}
					className="relative"
				/>
			</span>
			<span
				aria-hidden
				className="bg-icon"
				style={{ width: 1, height: 16 }}
			/>
		</span>
	);
}

/**
 * Text-insertion telepointer (Figma "Rovo telepointer", 32×28 at scale 1): a
 * solid blue caret (`Primary/Blue 700` #1868DB, 1×24) with a dark `color.text`
 * "Rovo" name pill hanging off its top-right. The pill is rounded on the right
 * corners only (square where it meets the caret) and wears the Rovo
 * conic-gradient (rainbow) border via the mask-composite technique, rotating
 * when `animated`. Represents Rovo actively typing *text*, as opposed to the
 * mic `typing` badge (voice input).
 */
function Telepointer({ scale, animated }: Readonly<{ scale: number; animated: boolean }>) {
	const caretWidth = Math.max(1, scale); // 1u caret, scaled
	const caretHeight = 24 * scale;
	const headHeight = 16 * scale;
	const radius = 4 * scale;
	const borderWidth = Math.max(1, 0.6 * scale);
	// Same XOR mask-composite trick as the Typing ring: a content-box mask minus
	// a border-box mask leaves only the padding ring, so the conic gradient shows
	// through as a border that follows the pill's right-rounded corners.
	const ringMask: React.CSSProperties = {
		WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
		mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
		WebkitMaskComposite: "xor",
		maskComposite: "exclude",
	};
	return (
		<span className="relative inline-flex items-start" style={{ height: caretHeight }}>
			{/* "Rovo" name pill */}
			<span
				className="relative box-border inline-flex items-center justify-center bg-[#292A2E] text-white"
				style={{
					height: headHeight,
					paddingInline: 4 * scale,
					borderTopRightRadius: radius,
					borderBottomRightRadius: radius,
				}}
			>
				<span
					aria-hidden
					className="pointer-events-none absolute inset-0"
					style={{
						padding: borderWidth,
						overflow: "hidden",
						borderTopRightRadius: radius,
						borderBottomRightRadius: radius,
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
				<span
					className="relative font-semibold"
					style={{
						fontSize: 10 * scale,
						lineHeight: `${9 * scale}px`,
						letterSpacing: -0.084 * scale,
					}}
				>
					Rovo
				</span>
			</span>
			{/* Blue insertion caret, sitting over the pill's left edge and extending below */}
			<span
				aria-hidden
				className="absolute top-0 left-0 shrink-0"
				style={{ width: caretWidth, height: caretHeight, backgroundColor: "#1868DB" }}
			/>
		</span>
	);
}

/**
 * Indeterminate spinner — delegates to the shared `Spinner` with the `rainbow`
 * variant so the same brand-gradient arc is reused across the design system.
 */
function Loading({ scale }: Readonly<{ scale: number }>) {
	const s = 16 * scale;
	return <Spinner variant="rainbow" className="size-auto" style={{ width: s, height: s }} />;
}

/**
 * Four brand-colored bars pulsing their height out of phase, centered in a
 * 16×16 box at scale 1 so all states share the same default footprint.
 * Driven by Motion so each bar grows in from `height: 0` on mount —
 * avoiding the instant jump the previous CSS-keyframe approach caused when
 * the demo flipped to `state="speaking"` — and then loops through the
 * easing-based equalizer oscillation. We animate `height` directly (rather
 * than `scaleY`) so the min height can be floored at `barWidth`, guaranteeing
 * every bar always renders at least as tall as it is wide: with
 * `borderRadius: barWidth / 2`, that means a uniform pill cap on every bar at
 * every animation phase. Under `prefers-reduced-motion` the bars settle to a
 * steady mid-height with no loop.
 */
function Speaking({ scale }: Readonly<{ scale: number }>) {
	const reduced = useReducedMotion();
	const barWidth = 2 * scale;
	return (
		<span
			className="inline-flex items-center justify-center"
			style={{ width: 16 * scale, height: 16 * scale, gap: 2 * scale }}
		>
			{SPEAKING_BARS.map((bar) => {
				const maxH = bar.height * scale;
				// Clamp the bar's minimum animated height to its own width so it
				// never collapses below a circle — the squashed-oval look on the
				// shortest (saffron) bar at low `scaleY` was the radius bug.
				const minH = Math.max(barWidth, maxH * 0.35);
				return (
					<motion.span
						key={bar.color}
						style={{
							width: barWidth,
							borderRadius: barWidth / 2,
							backgroundColor: bar.color,
						}}
						initial={{ height: 0 }}
						animate={reduced ? { height: (minH + maxH) / 2 } : { height: [minH, maxH, minH] }}
						transition={
							reduced
								? SPEAKING_MOUNT_TRANSITION
								: { ...SPEAKING_LOOP_TRANSITION, delay: bar.delay }
						}
					/>
				);
			})}
		</span>
	);
}
