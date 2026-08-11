// Pure feed-state transitions for the Jira Activity timeline. Kept free of
// runtime `@/` imports (type-only imports below) so `node --test` can
// `require("./jira-activity-reducer.ts")` directly. All non-determinism (ids,
// timestamps) is injected by the caller, mirroring
// `components/blocks/task-progress/lib/progress-bar-state.ts`.

import type {
	JiraActivityActor,
	JiraActivityCommentEntry,
	JiraActivityEntry,
	JiraActivityReaction,
	JiraActivityReply,
} from "../jira-activity-types";

export interface JiraActivityState {
	entries: readonly JiraActivityEntry[];
}

export type JiraActivityAction =
	| { type: "add-comment"; entry: JiraActivityCommentEntry }
	| { type: "add-reply"; entryId: string; reply: JiraActivityReply }
	| { type: "toggle-reaction"; entryId: string; emoji: string; actorId: string }
	| { type: "toggle-resolved"; entryId: string };

/**
 * Adds or removes `actorId` from the `emoji` reaction, preserving reaction and
 * actor order. A reaction whose last actor leaves is pruned, so an empty list
 * and `undefined` render identically. Pure: the input is never mutated.
 */
export function toggleReaction(
	reactions: readonly JiraActivityReaction[] | undefined,
	emoji: string,
	actorId: string,
): readonly JiraActivityReaction[] {
	const current = reactions ?? [];
	const index = current.findIndex((reaction) => reaction.emoji === emoji);

	if (index === -1) {
		return [...current, { emoji, actorIds: [actorId] }];
	}

	const existing = current[index];
	const next = [...current];

	if (!existing.actorIds.includes(actorId)) {
		next[index] = { ...existing, actorIds: [...existing.actorIds, actorId] };
		return next;
	}

	const actorIds = existing.actorIds.filter((id) => id !== actorId);
	if (actorIds.length === 0) {
		// Prune the emptied reaction rather than leaving a zero-count pill.
		return [...current.slice(0, index), ...current.slice(index + 1)];
	}

	next[index] = { ...existing, actorIds };
	return next;
}

export function jiraActivityReducer(
	state: JiraActivityState,
	action: JiraActivityAction,
): JiraActivityState {
	switch (action.type) {
		case "add-comment":
			return { entries: [...state.entries, action.entry] };
		case "add-reply": {
			let changed = false;
			const entries = state.entries.map((entry) => {
				if (entry.id !== action.entryId || entry.kind !== "comment") {
					return entry;
				}
				changed = true;
				return { ...entry, replies: [...(entry.replies ?? []), action.reply] };
			});
			// Return the same reference on a miss so React can bail out of the update.
			return changed ? { entries } : state;
		}
		case "toggle-reaction": {
			let changed = false;
			const entries = state.entries.map((entry) => {
				if (entry.id !== action.entryId || entry.kind !== "comment") {
					return entry;
				}
				changed = true;
				return {
					...entry,
					reactions: toggleReaction(entry.reactions, action.emoji, action.actorId),
				};
			});
			// Return the same reference on a miss so React can bail out of the update.
			return changed ? { entries } : state;
		}
		case "toggle-resolved": {
			let changed = false;
			const entries = state.entries.map((entry) => {
				if (
					entry.id !== action.entryId
					|| entry.kind !== "comment"
					|| !entry.allowResolve
				) {
					return entry;
				}
				changed = true;
				return { ...entry, resolved: !entry.resolved };
			});
			return changed ? { entries } : state;
		}
		default: {
			const _exhaustive: never = action;
			return _exhaustive;
		}
	}
}

interface ComposerPayload {
	id: string;
	actor: JiraActivityActor;
	timestamp: string;
	body: string;
}

/** Builds a comment entry from a submitted composer draft (plain-text body). */
export function createCommentEntry(
	params: Readonly<ComposerPayload>,
): JiraActivityCommentEntry {
	return {
		id: params.id,
		kind: "comment",
		actor: params.actor,
		timestamp: params.timestamp,
		body: [{ type: "text", text: params.body }],
		allowReply: true,
	};
}

/** Builds a reply from a submitted reply-composer draft. */
export function createReply(params: Readonly<ComposerPayload>): JiraActivityReply {
	return {
		id: params.id,
		actor: params.actor,
		timestamp: params.timestamp,
		body: params.body,
	};
}
