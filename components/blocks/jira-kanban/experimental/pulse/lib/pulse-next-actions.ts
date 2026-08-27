import type { NextBestActionItem } from "@/components/blocks/next-best-action";

import type { PulseAction } from "../types";

/**
 * Boundary between a Pulse next-best-action and the shared next-best-action row.
 *
 * "Next best actions" is a list of things to do, not a list of people: capture a
 * decision, assign an agent, link evidence. That is exactly what
 * `components/blocks/next-best-action` renders, so the section shows the verb
 * first and the work-item key and rationale become the row's metadata. Keeping
 * the mapping pure and here means the section component stays a renderer and
 * the fixture never learns the row model.
 */

const EMPTY_REQUESTED: ReadonlySet<string> = new Set();
const REQUESTED_LABEL = "Requested";

/** Work-item key when the action has one; otherwise a kind label the row requires. */
export function toPulseNextActionSource(action: PulseAction): string {
	return action.workItemKey ?? "Suggested action";
}

/** The row's own verb, or "Requested" once the reader has already committed it. */
export function toPulseNextActionRowLabel(
	action: PulseAction,
	requestedActionIds: ReadonlySet<string>,
): string {
	return requestedActionIds.has(action.id) ? REQUESTED_LABEL : action.actionLabel;
}

/**
 * Maps one window's actions onto next-best-action rows.
 *
 * Agent-assignment rows take the chat tile so they read as a person to ask;
 * everything else takes the page tile because the work lives on an item.
 * Requested ids change only the verb — the row stays mounted so activating it
 * cannot throw focus to the document body.
 */
export function toPulseNextActionItems(
	actions: readonly PulseAction[],
	requestedActionIds: ReadonlySet<string> = EMPTY_REQUESTED,
): readonly NextBestActionItem[] {
	return actions.map((action) => {
		const isAgentAssignment = action.actionLabel === "Assign agent";

		return {
			id: action.id,
			iconName: isAgentAssignment ? "ai-chat" : "page",
			owner: action.rationale,
			rowActionLabel: toPulseNextActionRowLabel(action, requestedActionIds),
			source: toPulseNextActionSource(action),
			tileVariant: isAgentAssignment ? "purpleSubtle" : "blueSubtle",
			title: action.label,
		} satisfies NextBestActionItem;
	});
}
