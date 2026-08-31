"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

import ChatPanel from "@/components/blocks/chat/page";
import { cn } from "@/lib/utils";

import {
	OMNIBAR_PANEL_ENTER,
	OMNIBAR_PANEL_EXIT,
	resolveOmnibarTransition,
} from "../omnibar-motion";

export interface OmnibarPanelProps {
	/** Defaults to the self-contained `ChatPanel` block. */
	children?: ReactNode;
	onClose: () => void;
	positioning: "container" | "viewport";
	shouldReduceMotion: boolean | null;
}

/**
 * Docked state: positioning and motion only.
 *
 * The panel node supplies its own border, radius, and close affordance — stacking a second
 * border here would double the outline on an already-elevated surface.
 */
export function OmnibarPanel({
	children,
	onClose,
	positioning,
	shouldReduceMotion,
}: Readonly<OmnibarPanelProps>) {
	return (
		<motion.div
			animate={{ opacity: 1, x: 0 }}
			className={cn(
				"z-[520] flex items-stretch",
				positioning === "container" ? "absolute" : "fixed",
				"inset-y-4 right-4",
			)}
			data-slot="omnibar-panel"
			exit={{
				opacity: 0,
				x: 24,
				transition: resolveOmnibarTransition(OMNIBAR_PANEL_EXIT, shouldReduceMotion),
			}}
			initial={{ opacity: 0, x: 24 }}
			style={{ willChange: "transform, opacity" }}
			transition={resolveOmnibarTransition(OMNIBAR_PANEL_ENTER, shouldReduceMotion)}
		>
			{children ?? (
				// ChatPanel sizes itself with an inline `height: 100vh`, which an ordinary class
				// cannot beat — the `!` override keeps it inside the docked inset.
				<div className="flex h-full [&>*]:h-full! [&>*]:max-h-full!">
					<ChatPanel onClose={onClose} />
				</div>
			)}
		</motion.div>
	);
}
