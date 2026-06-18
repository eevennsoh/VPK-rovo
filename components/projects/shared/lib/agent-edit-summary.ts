/**
 * Wire shape for the "agent edit summary" widget — the collapsed generative card
 * the Ask Rovo sidebar shows after a deterministic agent-config edit, instead of
 * a plain "Done — I added …" text reply. Built by demo-agent-builder from the
 * classified intent and rendered by AgentEditSummaryCard via the transcript's
 * widget switch. Kept tiny and presentational (no catalog coupling) so it can be
 * carried on a `data-widget-data` part and parsed defensively on render.
 */

/** The widget `type` carried on the data-widget-data part. */
export const AGENT_EDIT_SUMMARY_WIDGET_TYPE = "agent-edit-summary";

/** One changed field shown as a label → value row in the expanded card body. */
export interface AgentEditSummaryChange {
	label: string;
	value: string;
}

export interface AgentEditSummaryPayload {
	/** The agent that was edited (for the card title). */
	agentName?: string;
	/** Header title, e.g. "Updated RFP Drafter". */
	headline: string;
	/** One-line collapsed summary shown under the title while collapsed. */
	summary: string;
	/** The individual changes, rendered as rows when the card is expanded. */
	changes: AgentEditSummaryChange[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | null {
	return typeof value === "string" && value.trim().length > 0 ? value : null;
}

/**
 * Validate/normalize an unknown widget payload into an {@link AgentEditSummaryPayload}.
 * Returns null when the payload is missing the headline or has no usable changes,
 * so the renderer can fall back gracefully rather than show an empty card.
 */
export function parseAgentEditSummaryPayload(value: unknown): AgentEditSummaryPayload | null {
	if (!isRecord(value)) {
		return null;
	}
	const headline = nonEmptyString(value.headline);
	if (!headline) {
		return null;
	}
	const changesInput = Array.isArray(value.changes) ? value.changes : [];
	const changes: AgentEditSummaryChange[] = [];
	for (const raw of changesInput) {
		if (!isRecord(raw)) {
			continue;
		}
		const label = nonEmptyString(raw.label);
		const changeValue = nonEmptyString(raw.value);
		if (label && changeValue) {
			changes.push({ label, value: changeValue });
		}
	}
	if (changes.length === 0) {
		return null;
	}
	return {
		...(nonEmptyString(value.agentName) ? { agentName: value.agentName as string } : {}),
		headline,
		summary: nonEmptyString(value.summary) ?? changes.map((change) => change.label).join(", "),
		changes,
	};
}
