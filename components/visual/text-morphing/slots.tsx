"use client";

import {
	AnimatePresence,
	animate,
	MotionConfig,
	motion,
	type Transition,
	useIsPresent,
	useMotionValue,
	useTransform,
} from "motion/react";
import { useEffect, useRef, useState } from "react";

import { isDigit, mod, reconcileDigitKeys, splitGraphemes } from "./lib";

/** Depth of the soft edge at the top and bottom of the slot window. */
const FADE_HEIGHT_EM = 0.25;
const FADE_HEIGHT = `${FADE_HEIGHT_EM}em`;
const FADE_MASK = `linear-gradient(to bottom, transparent 0%, black ${FADE_HEIGHT}, black calc(100% - ${FADE_HEIGHT}), transparent 100%)`;

/**
 * One of the ten stacked glyphs in a slot column; its offset tracks `current`.
 *
 * A neighbour parks one full glyph height away, which puts its trailing edge
 * exactly on the window's content edge — i.e. *inside* the fade band, where the
 * mask is already opaque. Nine idle digits stacked there smear into a permanent
 * grey bar above and below the number. Parking `FADE_HEIGHT` further out puts
 * them fully clear of the masked box, so the band only ever paints a digit that
 * is genuinely travelling through it.
 */
function DigitNum({ n, current }: { n: number; current: ReturnType<typeof useMotionValue<number>> }) {
	const y = useTransform(current, (c) => {
		let offset = mod(n - c, 10);
		if (offset > 5) offset -= 10;
		const clamped = Math.max(-1, Math.min(1, offset));
		// Percentage of the glyph's own height plus the em-based fade depth, so
		// the clearance holds at any line-height rather than at one font size.
		return `calc(${-clamped * 100}% - ${clamped * FADE_HEIGHT_EM}em)`;
	});

	return (
		<motion.span
			aria-hidden
			style={{ position: "absolute", top: 0, left: "50%", x: "-50%", display: "inline-block", whiteSpace: "pre", y }}
		>
			{n}
		</motion.span>
	);
}

const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

/** A single rolling digit column. Spins the cumulative offset toward `digit`. */
function SlotColumn({
	digit,
	direction,
	transition,
	delay,
	animateIn,
}: {
	digit: number;
	direction: number;
	transition: Transition;
	delay: number;
	animateIn: boolean;
}) {
	const isPresent = useIsPresent();
	const spinIn = Math.max(digit, 1);
	const startValue = animateIn ? digit - spinIn * (direction || 1) : digit;
	const current = useMotionValue(startValue);
	const [digitState, setDigitState] = useState({ cumulative: digit, digit });
	const initialRef = useRef(true);

	if (digit !== digitState.digit) {
		const old = digitState.digit;
		let diff: number;

		if (direction > 0) {
			diff = digit >= old ? digit - old : 10 - old + digit;
		} else if (direction < 0) {
			diff = old >= digit ? -(old - digit) : -(10 - digit + old);
		} else {
			diff = digit - old;
		}

		setDigitState({ cumulative: digitState.cumulative + diff, digit });
	}

	useEffect(() => {
		if (!isPresent) {
			const spinOut = Math.max(digit, 1);
			animate(current, digitState.cumulative + spinOut * (direction || 1), { ...transition });
			return;
		}

		if (initialRef.current) {
			initialRef.current = false;
			if (!animateIn) return;
		}

		animate(current, digitState.cumulative, { ...transition, delay });
	});

	return (
		<span style={{ display: "inline-block", position: "relative", verticalAlign: "top" }}>
			<span style={{ visibility: "hidden", whiteSpace: "pre", display: "inline-block" }}>0</span>
			{digits.map((n) => (
				<DigitNum key={n} n={n} current={current} />
			))}
		</span>
	);
}

/**
 * Slot-machine number morphing, ported from Calligraph's `SlotsRenderer`. Each
 * digit is a fixed-width column of 0–9 that spins to its target value behind a
 * soft top/bottom fade mask; non-digits slide via layout.
 */
export function SlotsRenderer({
	text,
	transition,
	stagger,
	animateInitial,
	className,
	style,
}: {
	text: string;
	transition: Transition;
	stagger: number;
	animateInitial: boolean;
	className?: string;
	style?: React.CSSProperties;
}) {
	const chars = splitGraphemes(text);

	const [renderState, setRenderState] = useState(() => ({
		digitKeys: chars.map((_, index) => index),
		direction: 1,
		nextId: chars.length,
		text,
	}));
	const mountedRef = useRef(false);

	useEffect(() => {
		mountedRef.current = true;
	}, []);

	if (text !== renderState.text) {
		const result = reconcileDigitKeys(
			renderState.text,
			text,
			renderState.digitKeys,
			renderState.nextId,
		);
		setRenderState({
			digitKeys: result.keys,
			direction: result.direction,
			nextId: result.nextId,
			text,
		});
	}

	const dir = renderState.direction;
	const prefixLen = (() => {
		const idx = chars.findIndex((c) => isDigit(c));
		return idx === -1 ? chars.length : idx;
	})();

	const digitCount = chars.filter((c) => isDigit(c)).length;
	let digitIndex = 0;

	return (
		<MotionConfig transition={transition}>
			<span
				aria-label={text}
				className={className}
				style={{ display: "inline-flex", position: "relative", ...style }}
			>
				<span
					style={{
						display: "inline-flex",
						paddingTop: FADE_HEIGHT,
						paddingBottom: FADE_HEIGHT,
						marginTop: `calc(-1 * ${FADE_HEIGHT})`,
						marginBottom: `calc(-1 * ${FADE_HEIGHT})`,
						maskImage: FADE_MASK,
						WebkitMaskImage: FADE_MASK,
						// The mask is the window: it both softens the two edges and hides
						// the nine off-screen digits. That only works as one tile —
						// `mask-repeat` defaults to `repeat`, which paints the gradient
						// again every ~1lh and lets the neighbouring digits bleed back in
						// above and below the number as grey smudges.
						maskRepeat: "no-repeat",
						WebkitMaskRepeat: "no-repeat",
					}}
				>
					<AnimatePresence mode="popLayout" initial={animateInitial}>
						{chars.map((char, i) => {
							const isPrefix = i < prefixLen;
							const outerKey = isPrefix ? `pre-${i}` : `col-${chars.length - 1 - i}`;

							if (isPrefix || !isDigit(char)) {
								return (
									<motion.span
										key={outerKey}
										layout="position"
										initial={false}
										exit={isPrefix ? undefined : { opacity: 0 }}
										style={{ display: "inline-block", whiteSpace: "pre" }}
									>
										{char}
									</motion.span>
								);
							}

							const delay = (digitCount - 1 - digitIndex) * stagger;
							digitIndex++;

							return (
								<motion.span key={outerKey} layout="position" initial={false} exit={{ opacity: 0 }} style={{ display: "inline-block" }}>
									<SlotColumn
										digit={Number(char)}
										direction={dir}
										transition={transition}
										delay={delay}
										animateIn={mountedRef.current || animateInitial}
									/>
								</motion.span>
							);
						})}
					</AnimatePresence>
				</span>
			</span>
		</MotionConfig>
	);
}
