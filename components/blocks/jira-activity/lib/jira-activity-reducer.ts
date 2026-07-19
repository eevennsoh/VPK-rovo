// Pure feed-state transitions for the Jira Activity timeline. Kept free of
// runtime `@/` imports (type-only imports below) so `node --test` can
// `require("./jira-activity-reducer.ts")` directly. All non-determinism (ids,
// timestamps) is injected by the caller, mirroring
// `components/blocks/task-progress/lib/progress-bar-state.ts`.

import type {
	JiraActivityActor,
	JiraActivityCommentEntry,
	JiraActivityEntry,
	JiraActivityReply,
} from "../jira-activity-types";

export interface JiraActivityState {
	entries: readonly JiraActivityEntry[];
}

export type JiraActivityAction =
	| { type: "add-comment"; entry: JiraActivityCommentEntry }
	| { type: "add-reply"; entryId: string; reply: JiraActivityReply };

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
		default:
			return state;
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
