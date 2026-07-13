"use client";

import { useRef } from "react";
import { motion, useReducedMotion } from "motion/react";

import { token } from "@/lib/tokens";

import { useAgentSessionsMeta } from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";
import { FloatingSessionHeader } from "@/components/blocks/agent-sessions/experimental/components/floating-session-header";
import { FloatingSessionTranscript } from "@/components/blocks/agent-sessions/experimental/components/floating-session-transcript";
import { FloatingSessionComposer } from "@/components/blocks/agent-sessions/experimental/components/floating-session-composer";
import type { AgentSession } from "@/components/blocks/agent-sessions/data/session-state";

// Mirrors rovo-floating-chat's entrance (fade + 8px rise), with an asymmetric,
// faster exit. Motion can't read var() tokens — values are the resolved tokens.
const PANEL_ENTER = { duration: 0.2, ease: [0, 0.4, 0, 1] as const }; // duration-medium + ease-out (bold)
const PANEL_EXIT = { duration: 0.15, ease: [0.6, 0, 0.8, 0.6] as const }; // duration-normal + ease-in (practical exit)

/**
 * Local floating panel mirroring the RovoFloatingChat chrome geometry, composed
 * entirely from block-local pieces (no global Rovo chat). Enter/exit is guarded
 * by `useReducedMotion`. Returns null when there is no active session — except
 * during the exit transition, where the last session is kept so the animation
 * can play (activeSession is already null by then).
 */
export function FloatingSessionPanel() {
	const { activeSession } = useAgentSessionsMeta();
	const shouldReduceMotion = useReducedMotion();
	const lastSessionRef = useRef<AgentSession | null>(activeSession);
	if (activeSession) {
		lastSessionRef.current = activeSession;
	}
	const session = activeSession ?? lastSessionRef.current;
	if (!session) return null;

	const initial = shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 };
	const animate = shouldReduceMotion
		? { opacity: 1, transition: { duration: 0 } }
		: { opacity: 1, y: 0, transition: PANEL_ENTER };
	const exit = shouldReduceMotion
		? { opacity: 0, transition: { duration: 0 } }
		: { opacity: 0, y: 8, transition: PANEL_EXIT };

	return (
		<motion.div
			key="floating-session-panel"
			role="dialog"
			aria-label={`Chat with ${session.agentName}`}
			initial={initial}
			animate={animate}
			exit={exit}
			className="fixed right-6 bottom-6 z-[510] flex max-h-[min(720px,calc(100dvh-96px))] w-[400px] max-w-[calc(100vw-48px)] flex-col overflow-hidden rounded-2xl bg-surface-overlay motion-reduce:transition-none"
			style={{ boxShadow: token("elevation.shadow.overlay"), willChange: "transform, opacity" }}
		>
			<FloatingSessionHeader session={session} />
			<FloatingSessionTranscript session={session} />
			<FloatingSessionComposer session={session} />
		</motion.div>
	);
}
