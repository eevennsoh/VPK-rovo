"use client";

import { ChainOfThoughtScenario } from "@/components/ui-custom/chain-of-thought";

import type { AgentSession } from "@/components/blocks/agent-sessions/data/session-state";

/**
 * High-level progress for a session, rendered inline in the transcript.
 *
 * This maps the session's HIGH-LEVEL steps to a ChainOfThoughtScenario — it
 * NEVER exposes hidden reasoning. Step labels are the same short, user-facing
 * labels the sessions rail shows. ChainOfThought owns its own reduced-motion
 * handling, so no extra motion guard is needed here.
 *
 * - running / waiting → "thinking" header (shimmering preview label)
 * - completed         → "completed" header (collapsed summary)
 * - step.status ("complete" | "active" | "pending") maps 1:1 to the scenario.
 */
export function FloatingSessionProgress({ session }: Readonly<{ session: AgentSession }>) {
	const state = session.status === "completed" ? "completed" : "thinking";
	const steps = session.steps.map((step) => ({
		id: step.id,
		label: step.label,
		status: step.status,
	}));

	return (
		<ChainOfThoughtScenario
			state={state}
			steps={steps}
			headerLabel={session.previewText}
		/>
	);
}
