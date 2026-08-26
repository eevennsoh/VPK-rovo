import type {
	PulseAnswer,
	PulseEpicScope,
	PulseScope,
	PulseScopeSelection,
	PulseSprintScope,
} from "@/components/blocks/jira-kanban/experimental/pulse/types";

/**
 * Pulse scopes — the epics and sprints the article can be narrowed to.
 *
 * Authored against the `PAY` Payments SDK v2 fixture in `pulse-timeline.ts`:
 * every `workItemKeys` entry is a key that timeline actually contains, so
 * scoping narrows real prose rather than emptying the page.
 *
 * Counts are authored, not derived. A sprint holds more than the sixteen work
 * items the timeline narrates — the narration is the decision points, not the
 * backlog — and an epic's child streams roll up work that never earned a
 * snapshot. Deriving the bars from the narrated slice would draw a picture of
 * the article instead of a picture of the delivery.
 *
 * Every date string is pre-formatted here for the same reason the timeline's
 * are: formatting at render time drifts between server and client.
 */

/* ------------------------------------------------------------------ */
/* Epics                                                                */
/* ------------------------------------------------------------------ */

const EPIC_ADAPTER: PulseEpicScope = {
	kind: "epic",
	id: "epic-pay-90",
	key: "PAY-90",
	name: "Retire LegacyGatewayAdapter",
	goal: "Every payment path runs on the v2 client, and the adapter and the 4,180 lines behind it are deleted.",
	targetDate: "12 Sep 2026",
	targetNote: "three weeks out",
	workItemKeys: ["PAY-101", "PAY-102", "PAY-104", "PAY-105", "PAY-107", "PAY-126", "PAY-128"],
	segments: [
		{ tone: "done", label: "Done", count: 17 },
		{ tone: "progress", label: "In progress", count: 9 },
		{ tone: "todo", label: "Not started", count: 14 },
	],
	children: [
		{
			id: "epic-pay-90-callsites",
			key: "PAY-104",
			name: "Port every call site onto the v2 client",
			segments: [
				{ tone: "done", label: "Done", count: 8 },
				{ tone: "progress", label: "In progress", count: 2 },
				{ tone: "todo", label: "Not started", count: 1 },
			],
		},
		{
			id: "epic-pay-90-retry",
			key: "PAY-107",
			name: "Move retry and backoff into payments-api",
			segments: [
				{ tone: "done", label: "Done", count: 3 },
				{ tone: "progress", label: "In progress", count: 1 },
				{ tone: "todo", label: "Not started", count: 1 },
			],
		},
		{
			id: "epic-pay-90-sandbox",
			key: "PAY-112",
			name: "Reach sandbox parity across all four regions",
			segments: [
				{ tone: "done", label: "Done", count: 1 },
				{ tone: "progress", label: "In progress", count: 2 },
				{ tone: "todo", label: "Not started", count: 4 },
			],
		},
		{
			id: "epic-pay-90-deletion",
			key: "PAY-126",
			name: "Delete the adapter and its dead branches",
			segments: [
				{ tone: "done", label: "Done", count: 0 },
				{ tone: "progress", label: "In progress", count: 1 },
				{ tone: "todo", label: "Not started", count: 2 },
			],
		},
		{
			id: "epic-pay-90-remainder",
			key: "",
			name: "Everything else in the epic",
			segments: [
				{ tone: "done", label: "Done", count: 5 },
				{ tone: "progress", label: "In progress", count: 3 },
				{ tone: "todo", label: "Not started", count: 6 },
			],
		},
	],
};

const EPIC_WEBHOOKS: PulseEpicScope = {
	kind: "epic",
	id: "epic-pay-91",
	key: "PAY-91",
	name: "Webhooks and contract safety",
	goal: "Typed payloads regenerate from the published spec, and the 3-D Secure path is covered before the flag opens.",
	targetDate: "28 Aug 2026",
	targetNote: "one week out",
	workItemKeys: ["PAY-109", "PAY-112", "PAY-113", "PAY-115"],
	segments: [
		{ tone: "done", label: "Done", count: 11 },
		{ tone: "progress", label: "In progress", count: 4 },
		{ tone: "todo", label: "Not started", count: 3 },
	],
	children: [
		{
			id: "epic-pay-91-payloads",
			key: "PAY-109",
			name: "Regenerate typed webhook payloads",
			segments: [
				{ tone: "done", label: "Done", count: 6 },
				{ tone: "progress", label: "In progress", count: 1 },
				{ tone: "todo", label: "Not started", count: 0 },
			],
		},
		{
			id: "epic-pay-91-contract",
			key: "PAY-113",
			name: "Contract tests for the challenge path",
			segments: [
				{ tone: "done", label: "Done", count: 4 },
				{ tone: "progress", label: "In progress", count: 1 },
				{ tone: "todo", label: "Not started", count: 1 },
			],
		},
		{
			id: "epic-pay-91-ledger",
			key: "PAY-115",
			name: "Move ledger-sync onto v2 settlement events",
			segments: [
				{ tone: "done", label: "Done", count: 1 },
				{ tone: "progress", label: "In progress", count: 2 },
				{ tone: "todo", label: "Not started", count: 2 },
			],
		},
	],
};

const EPIC_ROLLOUT: PulseEpicScope = {
	kind: "epic",
	id: "epic-pay-93",
	key: "PAY-93",
	name: "Rollout, kill switch and rollback",
	goal: "The flag ships with per-account targeting, a rehearsed rollback, and decline copy in all nine languages.",
	targetDate: "5 Sep 2026",
	targetNote: "two weeks out",
	workItemKeys: ["PAY-118", "PAY-119", "PAY-121", "PAY-123", "PAY-130"],
	segments: [
		{ tone: "done", label: "Done", count: 6 },
		{ tone: "progress", label: "In progress", count: 5 },
		{ tone: "todo", label: "Not started", count: 9 },
	],
	children: [
		{
			id: "epic-pay-93-flag",
			key: "PAY-121",
			name: "Targeting rules and per-account kill switch",
			segments: [
				{ tone: "done", label: "Done", count: 3 },
				{ tone: "progress", label: "In progress", count: 2 },
				{ tone: "todo", label: "Not started", count: 1 },
			],
		},
		{
			id: "epic-pay-93-rehearsal",
			key: "PAY-119",
			name: "Rollback rehearsal against staging",
			segments: [
				{ tone: "done", label: "Done", count: 2 },
				{ tone: "progress", label: "In progress", count: 0 },
				{ tone: "todo", label: "Not started", count: 1 },
			],
		},
		{
			id: "epic-pay-93-copy",
			key: "PAY-130",
			name: "Decline copy in all nine languages",
			segments: [
				{ tone: "done", label: "Done", count: 1 },
				{ tone: "progress", label: "In progress", count: 2 },
				{ tone: "todo", label: "Not started", count: 6 },
			],
		},
		{
			id: "epic-pay-93-wallet",
			key: "PAY-118",
			name: "Saved wallet UI — cut from this release",
			segments: [
				{ tone: "done", label: "Done", count: 0 },
				{ tone: "progress", label: "In progress", count: 1 },
				{ tone: "todo", label: "Not started", count: 1 },
			],
		},
	],
};

export const PULSE_EPICS: readonly PulseEpicScope[] = [EPIC_ADAPTER, EPIC_WEBHOOKS, EPIC_ROLLOUT];

/* ------------------------------------------------------------------ */
/* Sprints                                                              */
/* ------------------------------------------------------------------ */

/**
 * Sprint 24 opened at 84 points, took on 20 and shed 3, and is five working
 * days from close. The burndown climbs above its own commitment on day three
 * — that is the shape the scope-change read-out under it explains.
 */
const SPRINT_24: PulseSprintScope = {
	kind: "sprint",
	id: "sprint-24",
	key: "Sprint 24",
	name: "Cut over to the v2 client",
	goal: "Every remaining v1 call site moves across, and the flag is ready to open on Monday.",
	rangeLabel: "17 – 28 Aug 2026",
	daysRemaining: 5,
	workItemKeys: [
		"PAY-101", "PAY-102", "PAY-104", "PAY-105", "PAY-107", "PAY-109",
		"PAY-112", "PAY-113", "PAY-115", "PAY-119", "PAY-121", "PAY-123",
		"PAY-126", "PAY-128", "PAY-130",
	],
	segments: [
		{ tone: "done", label: "Done", count: 6 },
		{ tone: "progress", label: "In progress", count: 7 },
		{ tone: "todo", label: "Not started", count: 2 },
	],
	committedPoints: 84,
	scopePoints: 101,
	donePoints: 30,
	burndown: [
		{ label: "17 Aug", remaining: 84 },
		{ label: "18 Aug", remaining: 82 },
		{ label: "19 Aug", remaining: 89 },
		{ label: "20 Aug", remaining: 84 },
		{ label: "21 Aug", remaining: 71 },
		{ label: "24 Aug", remaining: null },
		{ label: "25 Aug", remaining: null },
		{ label: "26 Aug", remaining: null },
		{ label: "27 Aug", remaining: null },
		{ label: "28 Aug", remaining: null },
	],
	scopeChangeNetPoints: 17,
	scopeChange: [
		{ id: "sprint-24-added", label: "Added", points: 20, workItems: 7, tone: "added" },
		{ id: "sprint-24-removed", label: "Removed", points: -3, workItems: 1, tone: "removed" },
		{ id: "sprint-24-modified", label: "Re-estimated", points: 0, workItems: 2, tone: "modified" },
	],
};

/** Sprint 23 is closed. It exists so the picker is a real choice. */
const SPRINT_23: PulseSprintScope = {
	kind: "sprint",
	id: "sprint-23",
	key: "Sprint 23",
	name: "Groundwork for the adapter retirement",
	goal: "Inventory every v1 call site, name an owner for each, and prove the adapter can be deleted outright.",
	rangeLabel: "3 – 14 Aug 2026",
	daysRemaining: 0,
	workItemKeys: ["PAY-101", "PAY-102", "PAY-104", "PAY-109"],
	segments: [
		{ tone: "done", label: "Done", count: 11 },
		{ tone: "progress", label: "In progress", count: 0 },
		{ tone: "todo", label: "Not started", count: 2 },
	],
	committedPoints: 61,
	scopePoints: 57,
	donePoints: 51,
	burndown: [
		{ label: "3 Aug", remaining: 61 },
		{ label: "4 Aug", remaining: 58 },
		{ label: "5 Aug", remaining: 52 },
		{ label: "6 Aug", remaining: 47 },
		{ label: "7 Aug", remaining: 41 },
		{ label: "10 Aug", remaining: 33 },
		{ label: "11 Aug", remaining: 24 },
		{ label: "12 Aug", remaining: 18 },
		{ label: "13 Aug", remaining: 11 },
		{ label: "14 Aug", remaining: 6 },
	],
	scopeChangeNetPoints: -4,
	scopeChange: [
		{ id: "sprint-23-added", label: "Added", points: 2, workItems: 1, tone: "added" },
		{ id: "sprint-23-removed", label: "Removed", points: -6, workItems: 2, tone: "removed" },
		{ id: "sprint-23-modified", label: "Re-estimated", points: 0, workItems: 0, tone: "modified" },
	],
};

export const PULSE_SPRINTS: readonly PulseSprintScope[] = [SPRINT_24, SPRINT_23];

/* ------------------------------------------------------------------ */
/* Resolution                                                           */
/* ------------------------------------------------------------------ */

export function findPulseScope(selection: PulseScopeSelection | null): PulseScope | null {
	if (selection === null) {
		return null;
	}
	const pool: readonly PulseScope[] = selection.kind === "epic" ? PULSE_EPICS : PULSE_SPRINTS;
	return pool.find((scope) => scope.id === selection.id) ?? null;
}

/** Stable key for reading-position resets. Distinct per scope, "" when none. */
export function toPulseScopeKey(scope: PulseScope | null): string {
	return scope === null ? "" : `${scope.kind}:${scope.id}`;
}

/**
 * The one scope the article is narrowed to, read off the board filter.
 *
 * The board filter is multi-select per field — that is right for a board, where
 * two labels mean "either" — but a brief is a single document about a single
 * body of work. There is no honest way to open one page about two sprints, so
 * anything other than exactly one selection across Parent and Sprint resolves
 * to no scope and the article stays the whole week.
 *
 * That also makes the failure legible rather than silent: selecting a second
 * epic closes the brief instead of leaving it showing the first one's numbers
 * under a filter that now says something else.
 */
export function resolvePulseScopeFromSelections(
	selections: Readonly<{ parent: readonly string[]; sprint: readonly string[] }>,
): PulseScope | null {
	const chosen = [
		...selections.parent.map((id) => ({ kind: "epic" as const, id })),
		...selections.sprint.map((id) => ({ kind: "sprint" as const, id })),
	];
	return chosen.length === 1 ? findPulseScope(chosen[0]) : null;
}

/* ------------------------------------------------------------------ */
/* Questions the brief can answer                                       */
/* ------------------------------------------------------------------ */

export interface PulseSuggestedQuestion {
	id: string;
	question: string;
	answer: string;
}

const UNSCOPED_QUESTIONS: readonly PulseSuggestedQuestion[] = [
	{
		id: "q-unscoped-attention",
		question: "What needs a person this week?",
		answer: "Three things. PAY-112 has been blocked on sandbox-eu for two days and nobody owns the ticket with Stripe. PAY-126 is a 4,180-line deletion sitting in review with one approval. And the decline copy for nine languages has not started, five days from the flag opening.",
	},
	{
		id: "q-unscoped-agents",
		question: "What did the agents do overnight?",
		answer: "Review Agent cleared eleven pull requests and rejected two for missing contract tests. Test Author Agent wrote the 3-D Secure challenge coverage that unblocked PAY-113. Release Captain Agent staged the kill switch and left the flag closed, as instructed.",
	},
	{
		id: "q-unscoped-uncaptured",
		question: "What happened outside Jira?",
		answer: "Twelve pieces. The largest is a local Claude session on PAY-101 that changed the release boundary without a work item, and a spike branch that is the only record of why the adapter can be deleted outright.",
	},
];

const SPRINT_QUESTIONS: readonly PulseSuggestedQuestion[] = [
	{
		id: "q-sprint-scope",
		question: "Why did the burndown go up on Wednesday?",
		answer: "Scope moved, not velocity. Seven work items worth 20 points came in on Wednesday morning off the back of the sandbox-eu regression, against 3 points removed. The line above the guideline is that intake, not slipped work.",
	},
	{
		id: "q-sprint-landing",
		question: "Will this sprint land?",
		answer: "Not at the current rate. 71 points remain with five days left; the last four days averaged 6.5 points a day, which lands around 39 points short. The 20 points that came in on Wednesday are the whole of the gap.",
	},
	{
		id: "q-sprint-blocked",
		question: "What is blocking the sprint?",
		answer: "PAY-112. sandbox-eu rejects v2 idempotency keys over 64 characters, which holds the regional parity work and, behind it, the flag. It has been blocked since Tuesday 11:05 and has no owner outside the team.",
	},
];

const EPIC_QUESTIONS: readonly PulseSuggestedQuestion[] = [
	{
		id: "q-epic-risk",
		question: "Is this epic going to hit its target date?",
		answer: "It is tight. Fourteen of the forty items have not started, and the stream furthest behind — sandbox parity — is also the one holding the deletion that closes the epic. The date holds only if parity clears next week.",
	},
	{
		id: "q-epic-slowest",
		question: "Which stream is furthest behind?",
		answer: "Sandbox parity: one of seven items done, four not started. Everything else in the epic is at or above half, and the adapter deletion cannot merge until parity is proven across all four regions.",
	},
	{
		id: "q-epic-remaining",
		question: "What is left before the adapter can be deleted?",
		answer: "Three things, in order: the last call site in ledger-sync, regional parity on sandbox-eu, and a second approval on PAY-126. The deletion pull request itself is already written and green.",
	},
];

export function toPulseSuggestedQuestions(
	scope: PulseScope | null,
): readonly PulseSuggestedQuestion[] {
	if (scope === null) {
		return UNSCOPED_QUESTIONS;
	}
	return scope.kind === "sprint" ? SPRINT_QUESTIONS : EPIC_QUESTIONS;
}

/**
 * What the article says back.
 *
 * A suggestion carries its own answer. Anything typed gets an honest
 * acknowledgement naming the scope it was asked inside — a prototype that
 * invents a specific-sounding answer to an unseen question is worse than one
 * that says plainly what it is holding.
 */
export function toPulseAnswer(
	question: string,
	scope: PulseScope | null,
	suggestions: readonly PulseSuggestedQuestion[],
): PulseAnswer {
	const matched = suggestions.find(
		(suggestion) => suggestion.question.toLocaleLowerCase() === question.trim().toLocaleLowerCase(),
	);
	const scopeLabel = scope === null
		? "the whole timeline"
		: `${scope.key} · ${scope.name}`;

	return {
		id: `answer-${matched?.id ?? question.trim().toLocaleLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}`,
		question: question.trim(),
		answer: matched?.answer
			?? `Reading ${scopeLabel} — seven insights, ${scope?.workItemKeys.length ?? 16} work items and twelve pieces of uncaptured work. There is no answer written for that question in this prototype.`,
	};
}

/**
 * Where a new answer lands in the article.
 *
 * Asking the same question twice moves its answer to the end rather than
 * stacking a duplicate there: the answer is the same, and two identical
 * paragraphs one above the other read as a rendering fault rather than as a
 * record of having asked twice. Kept here as a pure function so the rule is
 * testable — the page only wires it to state.
 */
export function appendPulseAnswer(
	answers: readonly PulseAnswer[],
	answer: PulseAnswer,
): readonly PulseAnswer[] {
	return [...answers.filter((entry) => entry.id !== answer.id), answer];
}
