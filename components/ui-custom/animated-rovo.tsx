"use client";

/* eslint-disable react-hooks/exhaustive-deps -- These callbacks/effects intentionally read stable refs that bridge external animation, drag, preview, and editor state. */

// oxlint-disable react-doctor/exhaustive-deps -- Effects in this file intentionally coordinate refs, external animation loops, timers, subscriptions, or measured DOM state; dependencies are constrained to avoid restarting those bridges.
// oxlint-disable react-doctor/no-chain-state-updates -- Related state fields are updated together to preserve atomic UI transitions and avoid partial interaction states.
// oxlint-disable react-doctor/no-derived-state -- These components maintain local derived display state for controlled animations, measurements, or draft editing that cannot be represented as render-only values without changing UX.
// oxlint-disable react-doctor/no-initialize-state -- These components intentionally seed local interactive state from props once before user edits take ownership.

// oxlint-disable react-doctor/no-event-handler -- Effects in this file bridge external systems, animation/media state, timers, or parent-controlled state rather than user event handlers.

import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";
import { useEffect, useState, useId, useRef } from "react";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Center of the 16×16 viewBox */
const CX = 8;
const CY = 8;

/** Radius large enough to fully cover the logo from center */
const R = 12;

/** Build a 90° pie-wedge path starting at `startDeg` */
function wedgePath(startDeg: number) {
	const toRad = (d: number) => (d * Math.PI) / 180;
	// Increase radius slightly to prevent sub-pixel antialiasing gaps between wedges
	const endDeg = startDeg + 90.5;
	const x1 = CX + R * Math.cos(toRad(startDeg - 0.5));
	const y1 = CY + R * Math.sin(toRad(startDeg - 0.5));
	const x2 = CX + R * Math.cos(toRad(endDeg));
	const y2 = CY + R * Math.sin(toRad(endDeg));
	return `M ${CX} ${CY} L ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2} Z`;
}

/** Four equal 90° wedges — each color always occupies exactly 25% */
const WEDGES = [
	{ d: wedgePath(270 - 30), fill: "#FCA700" }, // Orange (Top-Right)
	{ d: wedgePath(0 - 30), fill: "#AF59E1" },   // Purple (Bottom-Right)
	{ d: wedgePath(90 - 30), fill: "#6A9A23" },  // Green (Bottom-Left)
	{ d: wedgePath(180 - 30), fill: "#1868DB" }, // Blue (Top-Left)
] as const;

/** Rovo logo silhouette paths */
const LOGO_PATHS = [
	"M7.17342 0.225632C7.72885 -0.0807374 8.40677 -0.0751091 8.9577 0.242517L13.2901 2.74211L14.3175 3.33486C14.8785 3.65826 15.2257 4.25827 15.2257 4.90464V11.0894C15.2257 11.7383 14.8806 12.3357 14.318 12.6589L10.2889 14.9835C10.2978 14.9587 10.3062 14.9338 10.3142 14.9087C10.389 14.6769 10.4286 14.4321 10.4286 14.1818V7.99702C10.4286 7.14738 9.97638 6.36386 9.23877 5.94L8.49458 5.51083L6.23539 4.20798V1.81225C6.23539 1.62347 6.26459 1.43906 6.31986 1.26449C6.45573 0.841996 6.74471 0.476236 7.14004 0.247911L7.14124 0.24722C7.15258 0.240681 7.16336 0.233429 7.17342 0.225632Z",
	"M5.80947 1.01655L1.78046 3.34108C1.21785 3.66432 0.872742 4.26167 0.872742 4.91061V11.0954C0.872742 11.7418 1.21988 12.3417 1.78083 12.6651L2.7361 13.2163L7.14073 15.7575C7.69164 16.0751 8.3696 16.0807 8.925 15.7744C8.93506 15.7666 8.94577 15.7594 8.9571 15.7528C9.35287 15.5247 9.64229 15.1588 9.77837 14.7361C9.83376 14.5614 9.86303 14.3768 9.86303 14.1878V11.792L7.53164 10.4475L6.85983 10.0601C6.12236 9.63624 5.66981 8.85256 5.66981 8.00299V1.81822C5.66981 1.56828 5.70934 1.32375 5.78393 1.09231C5.79202 1.0669 5.80054 1.04164 5.80947 1.01655Z",
	"M7.53164 10.4475L2.7361 13.2163L1.78083 12.6651C1.21988 12.3417 0.872742 11.7418 0.872742 11.0954V4.91061C0.872742 4.26167 1.21785 3.66432 1.78046 3.34108L5.80947 1.01655C5.80054 1.04164 5.79202 1.0669 5.78393 1.09231C5.70934 1.32375 5.66981 1.56828 5.66981 1.81822V8.00299C5.66981 8.85256 6.12236 9.63624 6.85983 10.0601L7.53164 10.4475Z",
	"M8.49458 5.51083L6.23539 4.20798V1.81225C6.23539 1.62347 6.26459 1.43906 6.31986 1.26449C6.45573 0.841996 6.74471 0.476236 7.14004 0.247911L7.14124 0.24722C7.15258 0.240681 7.16336 0.233429 7.17342 0.225632C7.72885 -0.0807374 8.40677 -0.0751091 8.9577 0.242517L13.2901 2.74211L8.49458 5.51083Z",
	"M14.3175 3.33486L13.2901 2.74211L8.49458 5.51083L9.23877 5.94C9.97638 6.36386 10.4286 7.14738 10.4286 7.99702V14.1818C10.4286 14.4321 10.389 14.6769 10.3142 14.9087C10.3062 14.9338 10.2978 14.9587 10.2889 14.9835L14.318 12.6589C14.8806 12.3357 15.2257 11.7383 15.2257 11.0894V4.90464C15.2257 4.25827 14.8785 3.65826 14.3175 3.33486Z",
	"M7.53164 10.4475L2.7361 13.2163L7.14073 15.7575C7.69164 16.0751 8.3696 16.0807 8.925 15.7744C8.93506 15.7666 8.94577 15.7594 8.9571 15.7528C9.35287 15.5247 9.64229 15.1588 9.77837 14.7361C9.83376 14.5614 9.86303 14.3768 9.86303 14.1878V11.792L7.53164 10.4475Z",
] as const;

const FACET_PATHS = {
	left: "M7.53088 10.4476L2.73535 13.2163L1.78016 12.6651C1.21921 12.3417 0.87207 11.7418 0.87207 11.0954V4.91065C0.87207 4.26171 1.21717 3.66436 1.77979 3.34113L5.80879 1.0166C5.79985 1.04169 5.79134 1.06695 5.78324 1.09236C5.70866 1.3238 5.66912 1.56833 5.66912 1.81827V8.00303C5.66912 8.85259 6.12167 9.63627 6.85915 10.0601L7.53088 10.4476Z",
	bottom: "M7.53088 10.4475L2.73535 13.2162L7.13997 15.7575C7.69088 16.075 8.36884 16.0807 8.92424 15.7743C8.9343 15.7665 8.945 15.7593 8.95634 15.7528C9.35211 15.5246 9.64153 15.1587 9.77761 14.7361C9.83299 14.5613 9.86226 14.3767 9.86226 14.1877V11.792L7.53088 10.4475Z",
	right: "M14.318 3.33493L13.2907 2.74219L8.49512 5.5109L9.23931 5.94007C9.97691 6.36392 10.4291 7.14744 10.4291 7.99708V14.1818C10.4291 14.4321 10.3895 14.677 10.3147 14.9087C10.3067 14.9338 10.2983 14.9587 10.2895 14.9835L14.3185 12.659C14.8811 12.3357 15.2262 11.7384 15.2262 11.0895V4.90471C15.2262 4.25833 14.879 3.65833 14.318 3.33493Z",
	top: "M8.49356 5.51082L6.23438 4.20796V1.81225C6.23438 1.62347 6.26358 1.43906 6.31885 1.26449C6.45471 0.841993 6.74369 0.476235 7.13903 0.247911L7.14023 0.247219C7.15156 0.240681 7.16234 0.233429 7.1724 0.225631C7.72783 -0.0807372 8.40575 -0.0751089 8.95668 0.242516L13.2891 2.74211L8.49356 5.51082Z",
} as const;

const FACET_KEYS = ["left", "bottom", "right", "top"] as const;

const REST_COLORS: Record<(typeof FACET_KEYS)[number], string> = {
	left: "#1868DB",
	top: "#FCA700",
	right: "#AF59E0",
	bottom: "#6A9A23",
};

const HALF_STRIPS = {
	left: {
		facets: ["left", "bottom"] as const,
		colors: ["#AF59E0", "#FCA700", "#1868DB", "#6A9A23"] as const,
		gx1: 0,
		gy1: -33.19,
		gx2: 27.7,
		gy2: 14.81,
	},
	right: {
		facets: ["right", "top"] as const,
		colors: ["#6A9A23", "#1868DB", "#FCA700", "#AF59E0"] as const,
		gx1: 0,
		gy1: -37.57,
		gx2: 27.7,
		gy2: 10.43,
	},
} as const;

const GRAD_DX = HALF_STRIPS.left.gx2 - HALF_STRIPS.left.gx1;
const GRAD_DY = HALF_STRIPS.left.gy2 - HALF_STRIPS.left.gy1;
const ROVO_CYCLE_H = (GRAD_DX * GRAD_DX + GRAD_DY * GRAD_DY) / GRAD_DY;

const FULL_CYCLE_DURATION_S = 2.5;
const SHORT_CYCLE_DURATION_S = 0.6;
const SHORT_SWEEP_DISTANCE = ROVO_CYCLE_H * 0.5;

const EASE_OUT_BOLD: [number, number, number, number] = [0, 0.4, 0, 1];
const EASE_IN_OUT_BOLD: [number, number, number, number] = [0.4, 0, 0, 1];

/** Default transition config: linear spin, 2s duration per 360° step */
const DEFAULT_TRANSITION: AnimatedRovoShapeTransition = {
	type: "tween",
	duration: 2,
	ease: "linear",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AnimatedRovoPreset = "short-cycle" | "full-cycle" | "custom";
type AnimatedRovoCyclePreset = Exclude<AnimatedRovoPreset, "custom">;

/** Transition config for the inner color-wheel rotation */
export interface AnimatedRovoShapeTransition {
	type: "spring" | "tween";
	/** Visual duration in seconds */
	duration?: number;
	/** Easing function (for tween) */
	ease?: "linear" | "easeInOut" | "circIn" | "circOut";
	/** Bounce factor (0 = no bounce, 1 = max bounce, only used if type is "spring") */
	bounce?: number;
}

export interface AnimatedRovoShapeProps {
	/** Width and height of the logo in pixels. @default 32 */
	size?: number;
	/** Additional CSS classes applied to the SVG element. */
	className?: string;
	/** Preset color-cycle motion. @default "full-cycle" */
	preset?: AnimatedRovoPreset;
	/** Duration override for the full cycle preset, in seconds. */
	cycleDurationS?: number;
	/** Transition config for the inner color-wheel rotation. */
	transition?: AnimatedRovoShapeTransition;
}

export interface AnimatedRovoRootProps {
	/** Width and height of the logo in pixels. @default 32 */
	size?: number;
	/** Additional CSS classes applied to the outer wrapper. */
	className?: string;
	/** Preset color-cycle motion. @default "full-cycle" */
	preset?: AnimatedRovoPreset;
	/** Duration override for the full cycle preset, in seconds. */
	cycleDurationS?: number;
	/** Transition config forwarded to the inner \`AnimatedRovo.Shape\`. */
	transition?: AnimatedRovoShapeTransition;
	/**
	 * When true, outer pendulum/bounce/spin animations settle to rest
	 * while the inner color wheel keeps rotating.
	 */
	streaming?: boolean;
	/**
	 * Probability (0 to 1) that the next spin cycle is a full 360° rotation.
	 * @default 0.35
	 */
	fullSpinProbability?: number;
	/**
	 * Vertical dance distance as a percentage of component size.
	 * @default 8
	 */
	danceDistancePercent?: number;
	children?: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------

function useShouldAnimate(containerRef: React.RefObject<Element | null>) {
	const reduced = useReducedMotion();
	const [inView, setInView] = useState(false);
	const [tabVisible, setTabVisible] = useState(
		typeof document === "undefined" ? true : document.visibilityState === "visible",
	);

	useEffect(() => {
		const el = containerRef.current;
		if (!el) return;
		const io = new IntersectionObserver(
			([entry]) => setInView(entry.isIntersecting),
			{ rootMargin: "200px" },
		);
		io.observe(el);
		const onVis = () => setTabVisible(document.visibilityState === "visible");
		document.addEventListener("visibilitychange", onVis);
		return () => {
			io.disconnect();
			document.removeEventListener("visibilitychange", onVis);
		};
	}, [containerRef]);

	return !reduced && inView && tabVisible;
}

function getPresetVariant(preset: AnimatedRovoCyclePreset) {
	return preset === "short-cycle" ? "short" : "full";
}

function PresetRovoShape({
	size,
	className,
	preset,
	cycleDurationS,
}: Readonly<{
	size: number;
	className?: string;
	preset: AnimatedRovoCyclePreset;
	cycleDurationS?: number;
}>) {
	const id = useId();
	const containerRef = useRef<SVGSVGElement>(null);
	const shouldAnimate = useShouldAnimate(containerRef);
	const yLeft = useMotionValue(0);
	const yRight = useMotionValue(0);
	const [showGradient, setShowGradient] = useState(false);
	const variant = shouldAnimate ? getPresetVariant(preset) : "rest";

	useEffect(() => {
		if (variant === "rest") {
			setShowGradient(false);
			yLeft.set(0);
			yRight.set(0);
			return;
		}

		if (variant === "full") {
			setShowGradient(true);
			const fullDuration = cycleDurationS ?? FULL_CYCLE_DURATION_S;
			const startL = yLeft.get();
			const startR = yRight.get();
			const c1 = animate(yLeft, startL - ROVO_CYCLE_H, { duration: fullDuration, ease: EASE_IN_OUT_BOLD });
			const c2 = animate(yRight, startR + ROVO_CYCLE_H, { duration: fullDuration, ease: EASE_IN_OUT_BOLD });
			return () => {
				c1.stop();
				c2.stop();
			};
		}

		if (variant === "short") {
			setShowGradient(true);
			const startL = yLeft.get();
			const startR = yRight.get();
			const c1 = animate(yLeft, startL - SHORT_SWEEP_DISTANCE, { duration: SHORT_CYCLE_DURATION_S, ease: EASE_OUT_BOLD });
			const c2 = animate(yRight, startR + SHORT_SWEEP_DISTANCE, { duration: SHORT_CYCLE_DURATION_S, ease: EASE_OUT_BOLD });
			return () => {
				c1.stop();
				c2.stop();
			};
		}
	}, [variant, cycleDurationS, yLeft, yRight]);

	return (
		<svg
			ref={containerRef}
			width={size}
			height={size}
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
		>
			<defs>
				<clipPath id={`${id}-clip`}>
					<rect width="16" height="16" />
				</clipPath>

				{(["left", "right"] as const).map((half) => (
					<mask key={half} id={`${id}-mask-${half}`} maskUnits="userSpaceOnUse">
						<rect width="16" height="16" fill="black" />
						{HALF_STRIPS[half].facets.map((key) => (
							<path key={key} d={FACET_PATHS[key]} fill="white" fillRule="evenodd" clipRule="evenodd" />
						))}
					</mask>
				))}

				{(["left", "right"] as const).map((half) => {
					const strip = HALF_STRIPS[half];
					return (
						<linearGradient
							key={half}
							id={`${id}-grad-${half}`}
							x1={strip.gx1}
							y1={strip.gy1}
							x2={strip.gx2}
							y2={strip.gy2}
							gradientUnits="userSpaceOnUse"
							spreadMethod="repeat"
						>
							{strip.colors.flatMap((color, index, colors) => {
								const start = (index / colors.length) * 100;
								const end = ((index + 1) / colors.length) * 100;
								return [
									<stop key={`${index}-start`} offset={`${start}%`} stopColor={color} />,
									<stop key={`${index}-end`} offset={`${end - 0.001}%`} stopColor={color} />,
								];
							})}
						</linearGradient>
					);
				})}
			</defs>

			<g clipPath={`url(#${id}-clip)`}>
				<g>
					{FACET_KEYS.map((key) => (
						<path
							key={key}
							d={FACET_PATHS[key]}
							fill={REST_COLORS[key]}
							fillRule="evenodd"
							clipRule="evenodd"
						/>
					))}
				</g>

				<g style={{ opacity: showGradient ? 1 : 0 }}>
					{(["left", "right"] as const).map((half) => {
						const yValue = half === "right" ? yRight : yLeft;
						return (
							<g key={half} mask={`url(#${id}-mask-${half})`}>
								<motion.g style={{ y: yValue }}>
									<rect
										x="0"
										y={-ROVO_CYCLE_H}
										width="16"
										height={3 * ROVO_CYCLE_H}
										fill={`url(#${id}-grad-${half})`}
									/>
								</motion.g>
							</g>
						);
					})}
				</g>
			</g>
		</svg>
	);
}

function LegacyAnimatedRovoShape({
	size,
	transition,
	className,
}: Readonly<Required<Pick<AnimatedRovoShapeProps, "size" | "transition">> & Pick<AnimatedRovoShapeProps, "className">>) {
	const maskId = useId();
	const scopeRef = useRef<SVGGElement>(null);
	const containerRef = useRef<SVGSVGElement>(null);
	const cancelledRef = useRef(false);
	const shouldAnimate = useShouldAnimate(containerRef);

	useEffect(() => {
		if (!shouldAnimate || !scopeRef.current) return;
		cancelledRef.current = false;

		async function loop() {
			let angle = 0;
			while (!cancelledRef.current && scopeRef.current) {
				angle += 360;
				await animate(scopeRef.current, { rotate: angle }, transition);
			}
		}

		void loop();

		return () => {
			cancelledRef.current = true;
		};
	}, [transition, shouldAnimate]);

	return (
		<motion.svg
			ref={containerRef}
			width={size}
			height={size}
			viewBox="0 0 16 16"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			className={className}
			style={{ overflow: "visible" }}
		>
			<defs>
				<clipPath id={maskId}>
					{LOGO_PATHS.map((d, i) => (
						<path key={i} d={d} />
					))}
				</clipPath>
			</defs>

			<g clipPath={`url(#${maskId})`}>
				<g ref={scopeRef} style={{ transformOrigin: `${CX}px ${CY}px` }}>
					{WEDGES.map((w) => (
						<path key={w.fill} d={w.d} fill={w.fill} />
					))}
				</g>
			</g>
		</motion.svg>
	);
}

/** Standalone inner SVG shape with preset color-cycle motion. */
export function AnimatedRovoShape({
	size = 32,
	preset = "full-cycle",
	cycleDurationS,
	transition,
	className,
}: Readonly<AnimatedRovoShapeProps>) {
	if (preset === "custom" || transition) {
		return <LegacyAnimatedRovoShape size={size} transition={transition ?? DEFAULT_TRANSITION} className={className} />;
	}

	return <PresetRovoShape size={size} preset={preset} cycleDurationS={cycleDurationS} className={className} />;
}

/** Pendulum wrapper — adds swing + bounce + occasional spin to any children. */
function LegacyAnimatedRovoRoot({
	size = 32,
	transition,
	className,
	streaming = false,
	fullSpinProbability = 0.35,
	danceDistancePercent = 8,
	children,
}: Readonly<AnimatedRovoRootProps>) {
	const [mounted, setMounted] = useState(false);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const shouldAnimate = useShouldAnimate(wrapperRef);

	const normalizedFullSpinProbability = Math.min(1, Math.max(0, fullSpinProbability));
	const normalizedDanceDistancePercent = Math.min(100, Math.max(0, danceDistancePercent));
	const danceOffset = size * (normalizedDanceDistancePercent / 100);

	const [spinAnimation, setSpinAnimation] = useState<{
		rotate: number;
		transition: { duration: number; ease: "linear" | "easeInOut" };
	}>({
		rotate: 0,
		transition: { duration: 3.5, ease: "linear" },
	});

	const generateSpin = (currentRotation: number) => {
		const isRapidSpin = Math.random() < normalizedFullSpinProbability;

		if (isRapidSpin) {
			return {
				rotate: currentRotation + 360,
				transition: {
					duration: 0.5 + Math.random() * 0.5,
					ease: "easeInOut" as const,
				},
			};
		}

		return {
			rotate: currentRotation + (90 + Math.random() * 90),
			transition: {
				duration: 1.0 + Math.random() * 1.5,
				ease: "linear" as const,
			},
		};
	};

	useEffect(() => {
		setMounted(true);
		setSpinAnimation(generateSpin(0));
	}, []);

	// Reset sporadic spin when entering/leaving streaming mode or pausing
	useEffect(() => {
		if (streaming || !shouldAnimate) {
			setSpinAnimation({
				rotate: 0,
				transition: { duration: 0.3, ease: "easeInOut" },
			});
		} else if (mounted) {
			setSpinAnimation(generateSpin(0));
		}
	}, [streaming, mounted, shouldAnimate]);
	// oxlint-enable react-doctor/no-adjust-state-on-prop-change

	const isResting = streaming || danceOffset === 0 || !shouldAnimate;

	return (
		<motion.div
			ref={wrapperRef}
			className={className}
			style={{
				width: size,
				height: size,
				transformOrigin: "50% -50%",
			}}
			animate={
				isResting
					? { rotate: 0, y: 0 }
					: {
							rotate: [15, -15, 15],
							y: [0, -danceOffset, 0, danceOffset, 0],
						}
			}
			transition={
				isResting
					? { duration: 0.3, ease: "easeOut" }
					: { duration: 2, ease: "easeInOut", repeat: Infinity }
			}
		>
			<motion.div
				animate={mounted && shouldAnimate ? spinAnimation : { rotate: 0 }}
				onAnimationComplete={(definition) => {
					if (!streaming && mounted && shouldAnimate && typeof definition === "object" && definition !== null && "rotate" in definition && typeof definition.rotate === "number") {
						setSpinAnimation(generateSpin(definition.rotate));
					}
				}}
				style={{ width: "100%", height: "100%" }}
				className="dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] drop-shadow-[0_0_8px_rgba(0,0,0,0.1)]"
			>
				{children ?? <LegacyAnimatedRovoShape size={size} transition={transition ?? DEFAULT_TRANSITION} />}
			</motion.div>
		</motion.div>
	);
}

function AnimatedRovoRoot({
	size = 32,
	preset,
	cycleDurationS,
	transition,
	className,
	streaming = false,
	fullSpinProbability,
	danceDistancePercent,
	children,
}: Readonly<AnimatedRovoRootProps>) {
	const shouldUseLegacyMotion = preset === "custom" || (!preset && (
		streaming ||
		transition ||
		fullSpinProbability !== undefined ||
		danceDistancePercent !== undefined ||
		children
	));

	if (shouldUseLegacyMotion) {
		return (
			<LegacyAnimatedRovoRoot
				size={size}
				transition={transition}
				className={className}
				streaming={streaming}
				fullSpinProbability={fullSpinProbability}
				danceDistancePercent={danceDistancePercent}
			>
				{children}
			</LegacyAnimatedRovoRoot>
		);
	}

	return (
		<div
			className={className}
			style={{
				width: size,
				height: size,
			}}
		>
			{children ?? (
				<AnimatedRovoShape
					size={size}
					preset={preset ?? "full-cycle"}
					cycleDurationS={cycleDurationS}
					className="dark:drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] drop-shadow-[0_0_8px_rgba(0,0,0,0.1)]"
				/>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Compound namespace
// ---------------------------------------------------------------------------

// react-doctor-disable-next-line react-doctor/only-export-components -- This component module intentionally exports colocated non-component API used by consumers.
export const AnimatedRovo = {
	/** Animated Rovo mark. Defaults to the full-cycle preset. */
	Root: AnimatedRovoRoot,
	/** Standalone inner SVG shape. Defaults to the full-cycle preset. */
	Shape: AnimatedRovoShape,
} as const;
