"use client";

import {
	animate,
	motion,
	useMotionValue,
	useReducedMotion,
	useTransform,
} from "motion/react";
import { useEffect, useMemo, type JSX, type RefObject } from "react";

import LiquidGradient from "@/components/visual/liquid-gradient";

import { getGalleryItemSeed, type GallerySelectionVisual } from "../lib/gallery-selection";
import { GalleryTitleLines } from "./gallery-title-lines";

const ENTER_EASE = [0.45, 0, 0.55, 1] as const; // Deliberately even ink spread.
const EXIT_EASE = [0.6, 0, 0.8, 0.6] as const; // --ease-in
const DUR_ENTER = 1.4; // Deliberately slow organic reveal.
const DUR_EXIT = 0.1; // --duration-fast
const MASK_FEATHER_PX = 18;
const MASK_DIAMETER_SCALE = 2.6;
const BLUE_PALETTE: string[] = ["#0747A6", "#0C66E4", "#1D7AFC", "#579DFF"];

function createSeededRandom(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state += 0x6d2b79f5;
		let value = state;
		value = Math.imul(value ^ (value >>> 15), value | 1);
		value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
		return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
	};
}

function createInkMaskImage(seed: number): string {
	const random = createSeededRandom(seed);
	const turbulenceSeed = 1 + Math.floor(random() * 999);
	const frequencyX = 0.012 + random() * 0.014;
	const frequencyY = 0.016 + random() * 0.016;
	const displacement = 34 + random() * 22;
	const blur = 3.5 + random() * 2.5;
	const svg = `
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
			<defs>
				<filter id="ink" x="-35%" y="-35%" width="170%" height="170%">
					<feTurbulence
						type="fractalNoise"
						baseFrequency="${frequencyX.toFixed(4)} ${frequencyY.toFixed(4)}"
						numOctaves="3"
						seed="${turbulenceSeed}"
						result="noise"
					/>
					<feDisplacementMap
						in="SourceGraphic"
						in2="noise"
						scale="${displacement.toFixed(2)}"
						xChannelSelector="R"
						yChannelSelector="G"
						result="displaced"
					/>
					<feGaussianBlur in="displaced" stdDeviation="${blur.toFixed(2)}" />
				</filter>
			</defs>
			<circle cx="128" cy="128" r="88" fill="white" filter="url(#ink)" />
		</svg>
	`;
	return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

export interface GallerySelectedSurfaceProps {
	itemId: string;
	title: string;
	width: number;
	height: number;
	visual: GallerySelectionVisual;
	highlightTextRef: RefObject<HTMLSpanElement | null>;
}

export function GallerySelectedSurface({
	itemId,
	title,
	width,
	height,
	visual,
	highlightTextRef,
}: Readonly<GallerySelectedSurfaceProps>): JSX.Element {
	const shouldReduceMotion = useReducedMotion() ?? false;
	const revealRadius = Math.hypot(width, height) + MASK_FEATHER_PX;
	const seed = getGalleryItemSeed(itemId);
	const inkMaskSeed = seed + visual.key * 7919;
	const inkMaskImage = useMemo(() => createInkMaskImage(inkMaskSeed), [inkMaskSeed]);
	const isExitPhase = visual.phase === "exit";
	const phaseDuration = isExitPhase ? DUR_EXIT : DUR_ENTER;
	const phaseEase = isExitPhase ? EXIT_EASE : ENTER_EASE;
	const originX = (width * visual.origin.xPercent) / 100;
	const originY = (height * visual.origin.yPercent) / 100;
	const radius = useMotionValue(
		shouldReduceMotion || visual.phase !== "enter" ? revealRadius : 0,
	);
	const maskSize = useTransform(() => {
		const currentRadius = radius.get();
		const diameter = Math.max(1, currentRadius * MASK_DIAMETER_SCALE);
		return `${diameter}px ${diameter}px`;
	});
	const maskPosition = useTransform(() => {
		const currentRadius = radius.get();
		const offset = Math.max(0.5, (currentRadius * MASK_DIAMETER_SCALE) / 2);
		return `${originX - offset}px ${originY - offset}px`;
	});

	useEffect(() => {
		const targetRadius = isExitPhase ? 0 : revealRadius;
		if (shouldReduceMotion) {
			radius.set(targetRadius);
			return;
		}
		const animation = animate(radius, targetRadius, {
			duration: phaseDuration,
			ease: phaseEase,
		});
		return () => animation.stop();
	}, [
		isExitPhase,
		phaseDuration,
		phaseEase,
		radius,
		revealRadius,
		shouldReduceMotion,
		visual.key,
	]);

	return (
		<motion.div
			aria-hidden="true"
			className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
			style={{
				maskImage: inkMaskImage,
				WebkitMaskImage: inkMaskImage,
				maskMode: "alpha",
				maskPosition,
				WebkitMaskPosition: maskPosition,
				maskRepeat: "no-repeat",
				WebkitMaskRepeat: "no-repeat",
				maskSize,
				WebkitMaskSize: maskSize,
			}}
		>
			<div
				className="absolute inset-0"
				style={{
					backgroundImage: [
						`radial-gradient(circle at ${visual.origin.xPercent}% ${visual.origin.yPercent}%, ${BLUE_PALETTE[3]} 0%, transparent 52%)`,
						`linear-gradient(140deg, ${BLUE_PALETTE[0]} 0%, ${BLUE_PALETTE[1]} 52%, ${BLUE_PALETTE[2]} 100%)`,
					].join(", "),
				}}
			/>
			<LiquidGradient
				className="absolute inset-0 h-full w-full"
				colors={BLUE_PALETTE}
				seed={seed}
				speed={0.18}
				loop={0}
				scale={0.52}
				turbAmp={0.72}
				turbFreq={0.12}
				turbIter={7}
				waveFreq={3.1}
				distBias={0.08}
				jellify
				ditherMode={1}
				dither={0.03}
				exposure={1.08}
				contrast={1.12}
				saturation={1.04}
			/>
			<div className="absolute inset-0 p-6">
				<div className="flex h-full w-full flex-col justify-end">
					<GalleryTitleLines
						title={title}
						textRef={highlightTextRef}
						className="text-text-inverse"
					/>
				</div>
			</div>
		</motion.div>
	);
}
