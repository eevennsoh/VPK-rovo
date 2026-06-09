import type { ListColumn } from "@/components/ui-custom/list"

/** A single piece of information the user has shared directly with Rovo. */
export interface MemoryItem {
	id: string
	text: string
}

/** A section in Rovo's auto-generated observations summary. */
export interface ObservationSection {
	id: string
	title: string
	body: string
}

/** Routes this block's toasts to its own Toaster instance (avoids cross-firing). */
export const MEMORY_TOASTER_ID = "memory-block-toaster"

/** Two columns: memory text flexes, the trailing action stays a fixed width. */
export const MEMORY_COLUMNS: readonly ListColumn[] = [{}, { className: "w-12" }]

/** Static summary shown on the "Rovo's observations about you" tab. */
export const OBSERVATIONS: readonly ObservationSection[] = [
	{
		id: "role",
		title: "Your role and expertise",
		body: "You work on AI-powered product design and agent/skill platforms, focusing on maker and developer experiences and cross-product integration across Search, Chat, Editor, Studio, and Automation. Your skills include product strategy and roadmapping, UX and prototyping workflows, and designing agentic workflows and skills.",
	},
	{
		id: "now",
		title: "What you're working on right now",
		body: "You are leading the Rovo Skills QA rollout and migrating live 1P skills to Anthropic, while advancing Studio strategy for multi-model and BYOM capabilities. You are also consolidating design-system outputs into prototypes for the Future Maker Experience and running early adopter onboarding for NovaClaw and the T2B AI Design Kit.",
	},
	{
		id: "goals",
		title: "Your goals and what success looks like",
		body: "You are focused on growing agent and skill invocations and Studio monthly active users, with targets that include 8.84M invocations and ~66k MAU. Success looks like adoption that compounds across surfaces and a maker experience that gets teams to a working prototype faster.",
	},
]

/** Seeded so the populated list and delete flow are visible by default. */
export const SAMPLE_MEMORIES: readonly MemoryItem[] = [
	{ id: "seed-1", text: "I prefer concise, bulleted summaries over long prose." },
	{ id: "seed-2", text: "My main responsibilities are design systems and prototyping." },
	{ id: "seed-3", text: "I work in the Pacific timezone (PT)." },
]
