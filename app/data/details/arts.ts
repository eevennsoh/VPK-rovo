import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ART_DETAILS: Record<string, ComponentDetail> = {
	awake: {
		description:
			"Art study inspired by a Framer reference: four tall capsule pills in a horizontal row on a light background. The first pill is a vertical elastic slider that lets you add and switch between world cities. The remaining three pills show the selected city's live clock, humidity, and temperature with animated weather icons — all backed by holographic shader cards.",
		demoLayout: {
			previewHeight: "fixed",
		},
	},
	cursors: {
		description:
			"An always-visible live-voice + Rovo cursor control (no text composer). Voice runs over the AI Gateway-backed /api/realtime/audio-conversation socket — the same realtime GPT backend the Studio composer uses — and the on-screen Rovo cursor follows your pointer. Turn the cursor on and say something like \"create me a team of agents\": four Rovo-colored agent cursors fan out from the pointer along curved Motion arc() paths, then on the go phrase they fly off to WORK — the cursor button switches to painting mode, and hovering it lets you peek at each agent's thinking traces.",
		demoLayout: {
			previewHeight: "fixed",
		},
	},
	"personal-graph": {
		description:
			"Obsidian-backed Personal Graph inspired by Nicholas Spisak's second-brain, Karpathy's LLM Wiki pattern, and Tobi Lutke's qmd: a live vault graph where raw captures, source notes, entities, concepts, and synthesis pages can be read as one connected workspace.",
		demoLayout: {
			previewHeight: "fixed",
		},
	},
	"rovo-fable": {
		description:
			"HyperFrames archival glyph reel that turns the uploaded Rovo symbol into a rapid Claude Fable-style sequence of botanical, cartographic, scientific, and museum-specimen frames.",
		demoLayout: {
			previewHeight: "fixed",
		},
	},
};
