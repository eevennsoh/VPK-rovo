/**
 * Deterministic skill-invocation interceptor for the Skills project.
 *
 * `ChatPanel` (reused from Sidebar Chat) routes both greeting-starter clicks and
 * typed submits through its `onInterceptSubmit` prop. When this matcher recognises
 * a prompt, it returns a `ChatSubmitInterceptOutcome` whose `assistantParts`
 * include a `data-widget-data` part (rendered as the inline "Skill invoked" card
 * via `renderWidget`) followed by the scripted text reply — so the model is never
 * called and the demo runs identically every time.
 *
 * This module is intentionally free of React/JSX so it can be unit tested through
 * the esbuild CJS harness (see `skill-intercept.test.js`).
 */

import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import { SKILL_INVOCATIONS, type SkillInvocationEntry } from "../data/skill-invocations";

/** Widget type discriminator shared by the interceptor and the renderer. */
export const SKILL_INVOCATION_WIDGET_TYPE = "skill-invocation";

/** Payload carried by the `data-widget-data` part and consumed by the card. */
export interface SkillInvocationPayload {
	skillId: string;
	/** Human-readable description of how the skill fired (manual vs keyword). */
	triggerLabel: string;
	inputSummary: string;
	outputSummary: string;
}

export interface SkillInvocationMatch {
	entry: SkillInvocationEntry;
	triggerLabel: string;
}

function normalize(text: string): string {
	return text.trim().toLowerCase();
}

/** Whole-word (or whole-phrase) keyword test, case-insensitive. */
function containsKeyword(normalizedText: string, keyword: string): boolean {
	const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
	return new RegExp(`(?:^|\\W)${escaped}(?:$|\\W)`, "u").test(normalizedText);
}

/**
 * Resolves a prompt to a scripted skill invocation. Exact starter prompts match
 * first (manual trigger); otherwise the first entry with a matching keyword wins
 * (auto trigger). Returns `null` when nothing matches.
 */
export function matchSkillInvocation(text: string): SkillInvocationMatch | null {
	const normalized = normalize(text);
	if (!normalized) {
		return null;
	}

	const manualEntry = SKILL_INVOCATIONS.find(
		(entry) => normalize(entry.starterPrompt) === normalized,
	);
	if (manualEntry) {
		return { entry: manualEntry, triggerLabel: "Manual — conversation starter" };
	}

	for (const entry of SKILL_INVOCATIONS) {
		const keyword = entry.triggerKeywords.find((candidate) => containsKeyword(normalized, candidate));
		if (keyword) {
			return { entry, triggerLabel: `Auto — matched keyword “${keyword}”` };
		}
	}

	return null;
}

/** Builds the `data-widget-data` + text parts for a matched invocation. */
export function buildSkillInvocationParts(match: SkillInvocationMatch): RovoUIMessage["parts"] {
	const payload: SkillInvocationPayload = {
		skillId: match.entry.skillId,
		triggerLabel: match.triggerLabel,
		inputSummary: match.entry.inputSummary,
		outputSummary: match.entry.outputSummary,
	};

	return [
		{
			type: "data-widget-data",
			data: { type: SKILL_INVOCATION_WIDGET_TYPE, payload },
		},
		{ type: "text", text: match.entry.replyText, state: "done" },
	] as RovoUIMessage["parts"];
}

/**
 * `onInterceptSubmit` implementation for `ChatPanel`. Returns
 * `{ handled: true, assistantParts }` for a recognised prompt (skipping the
 * model), or `{ handled: false }` so the chat falls back to normal behaviour.
 */
export function buildSkillInterceptOutcome(text: string): {
	handled: boolean;
	assistantParts?: RovoUIMessage["parts"];
} {
	const match = matchSkillInvocation(text);
	if (!match) {
		return { handled: false };
	}

	return { handled: true, assistantParts: buildSkillInvocationParts(match) };
}
