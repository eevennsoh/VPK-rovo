"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode, RefObject } from "react";

import type { GalleryItem } from "../data/gallery-items";

const ENTER_EASE = [0.4, 1, 0.6, 1] as const; // --ease-out-practical
const EXIT_EASE = [0.6, 0, 0.8, 0.6] as const; // --ease-in
const LAYOUT_EASE = [0.4, 0, 0, 1] as const; // --ease-in-out

export interface GallerySelectedStageProps {
	item: GalleryItem;
	stageRef: RefObject<HTMLElement | null>;
	renderSelectedItem: (item: GalleryItem) => ReactNode;
}

export function GallerySelectedStage({
	item,
	stageRef,
	renderSelectedItem,
}: Readonly<GallerySelectedStageProps>) {
	const shouldReduceMotion = useReducedMotion();

	return (
		<motion.section
			ref={stageRef}
			layout={shouldReduceMotion ? false : true}
			aria-live="polite"
			className="mx-auto flex min-h-[calc(100dvh-12rem)] w-full max-w-3xl items-center px-6 pt-20 pb-80"
			transition={shouldReduceMotion ? { duration: 0 } : { layout: { duration: 0.2, ease: LAYOUT_EASE } }}
			style={{ willChange: "transform" }}
		>
			<AnimatePresence initial={false} mode="wait">
				<motion.div
					key={item.id}
					initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
					animate={{ opacity: 1, y: 0 }}
					exit={
						shouldReduceMotion
							? { opacity: 0 }
							: {
									opacity: 0,
									y: -12,
									transition: { duration: 0.1, ease: EXIT_EASE },
								}
					}
					transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.15, ease: ENTER_EASE }}
					className="w-full"
					style={{ willChange: "transform, opacity" }}
				>
					{renderSelectedItem(item)}
				</motion.div>
			</AnimatePresence>
		</motion.section>
	);
}
