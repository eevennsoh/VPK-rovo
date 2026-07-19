"use client";

import { useRef, useState, type CSSProperties } from "react";
import { AnimatePresence, motion, useReducedMotion, type Transition } from "motion/react";

import { token } from "@/lib/tokens";
import { ContextEditableTitle } from "@/components/blocks/agent-sessions/experimental/components/context-editable-header";
import { ContextTitleActions } from "@/components/blocks/agent-sessions/experimental/components/context-title-actions";
import { usePanelLayout } from "@/components/blocks/agent-sessions/experimental/context-panel-layout";

const ACTIONS_ENTER_TRANSITION: Transition = {
	duration: 0.1,
	ease: [0.4, 1, 0.6, 1], // duration-fast + ease-out-practical
};
const ACTIONS_EXIT_TRANSITION: Transition = {
	duration: 0.05,
	ease: [0.6, 0, 0.8, 0.6], // duration-xxshort + ease-in
};

interface AnimatedContextTitleActionsProps {
	collapsed: boolean;
	hideForToggle: boolean;
	isLayoutSettled: boolean;
	onToggleExitComplete: () => void;
	shouldReduceMotion: boolean;
}

function AnimatedContextTitleActions({
	collapsed,
	hideForToggle,
	isLayoutSettled,
	onToggleExitComplete,
	shouldReduceMotion,
}: Readonly<AnimatedContextTitleActionsProps>) {
	const didCompleteToggleExit = useRef(false);
	const [isAnimating, setIsAnimating] = useState(false);
	const isInteractive = !hideForToggle && isLayoutSettled && !isAnimating;

	return (
		<motion.div
			animate={
				hideForToggle
					? {
							opacity: 0,
							scale: 0.96,
							transition: shouldReduceMotion ? { duration: 0 } : ACTIONS_EXIT_TRANSITION,
						}
					: isLayoutSettled
					? { opacity: 1, scale: 1, transition: ACTIONS_ENTER_TRANSITION }
					: { opacity: 0, scale: 0.96, transition: { duration: 0 } }
			}
			aria-hidden={isInteractive ? undefined : true}
			exit={{ opacity: 0, scale: 0.96, transition: { duration: 0 } }}
			inert={isInteractive ? undefined : true}
			initial={shouldReduceMotion || isLayoutSettled ? false : { opacity: 0, scale: 0.96 }}
			onAnimationComplete={() => {
				setIsAnimating(false);
				if (hideForToggle && !didCompleteToggleExit.current) {
					didCompleteToggleExit.current = true;
					onToggleExitComplete();
				}
			}}
			onAnimationStart={() => setIsAnimating(true)}
			style={{
				transformOrigin: "right center",
				willChange: isAnimating ? "transform, opacity" : undefined,
			}}
		>
			<ContextTitleActions collapsed={collapsed} />
		</motion.div>
	);
}

/**
 * Full-width title band beneath the breadcrumb header: the editable work-item
 * title (left) and the visual action cluster (right). Spanning the whole dialog
 * — rather than living inside the left content column — keeps the actions aligned
 * to the modal's right edge (under the breadcrumb controls) and above the
 * two-column body, so they can never collide with the metadata rail.
 */
export function ContextTitleBar() {
	const {
		completeMetadataToggle,
		metadataCollapsed,
		metadataTogglePending,
	} = usePanelLayout();
	const shouldReduceMotion = useReducedMotion();
	const [settledMetadataCollapsed, setSettledMetadataCollapsed] = useState(metadataCollapsed);
	const isActionLayoutSettled = shouldReduceMotion || settledMetadataCollapsed === metadataCollapsed;
	const contentColumnStyle = {
		maxWidth: metadataCollapsed ? "800px" : "100%",
		transition: shouldReduceMotion
			? undefined
			: metadataCollapsed
				? "max-width var(--duration-medium) var(--ease-in)"
				: "max-width var(--duration-slow) var(--ease-in-out)",
	} as CSSProperties;

	return (
		<div style={{ paddingBottom: token("space.200") }}>
			<div
				className="mx-auto flex w-full items-center justify-between gap-3 px-6 motion-reduce:transition-none"
				data-agent-sessions-title-column
				onTransitionEnd={(event) => {
					if (event.currentTarget === event.target && event.propertyName === "max-width") {
						setSettledMetadataCollapsed(metadataCollapsed);
					}
				}}
				style={contentColumnStyle}
			>
				<div className="min-w-0 flex-1">
					<ContextEditableTitle />
				</div>
				<AnimatePresence initial={false} mode="popLayout">
					<AnimatedContextTitleActions
						key={metadataCollapsed ? "metadata-collapsed" : "metadata-expanded"}
						collapsed={metadataCollapsed}
						hideForToggle={metadataTogglePending}
						isLayoutSettled={isActionLayoutSettled}
						onToggleExitComplete={completeMetadataToggle}
						shouldReduceMotion={shouldReduceMotion}
					/>
				</AnimatePresence>
			</div>
		</div>
	);
}
