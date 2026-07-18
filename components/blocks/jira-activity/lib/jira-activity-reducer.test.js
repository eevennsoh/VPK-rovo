const assert = require("node:assert/strict");
const test = require("node:test");

const {
	jiraActivityReducer,
	createCommentEntry,
	createReply,
} = require("./jira-activity-reducer.ts");

const ACTOR = { id: "u1", name: "Priya Hansra", kind: "person" };

function baseState() {
	return {
		entries: [
			{ id: "e1", kind: "event", actor: ACTOR, timestamp: "1m", segments: [] },
			{
				id: "c1",
				kind: "comment",
				actor: ACTOR,
				timestamp: "1m",
				body: [],
				replies: [],
			},
		],
	};
}

test("add-comment appends a comment entry to the end of the feed", () => {
	const state = baseState();
	const entry = createCommentEntry({
		id: "c2",
		actor: ACTOR,
		timestamp: "now",
		body: "Looks good",
	});

	const next = jiraActivityReducer(state, { type: "add-comment", entry });

	assert.equal(next.entries.length, 3);
	assert.equal(next.entries.at(-1).id, "c2");
	assert.equal(next.entries.at(-1).kind, "comment");
	// The input state is not mutated.
	assert.equal(state.entries.length, 2);
});

test("add-reply nests a reply under the matching comment", () => {
	const state = baseState();
	const reply = createReply({
		id: "r1",
		actor: ACTOR,
		timestamp: "now",
		body: "On it",
	});

	const next = jiraActivityReducer(state, {
		type: "add-reply",
		entryId: "c1",
		reply,
	});

	const comment = next.entries.find((entry) => entry.id === "c1");
	assert.equal(comment.replies.length, 1);
	assert.equal(comment.replies[0].body, "On it");
	// The original comment's replies are untouched.
	assert.equal(state.entries.find((entry) => entry.id === "c1").replies.length, 0);
});

test("add-reply is a no-op (same reference) when no comment matches the id", () => {
	const state = baseState();
	const reply = createReply({
		id: "r1",
		actor: ACTOR,
		timestamp: "now",
		body: "x",
	});

	const next = jiraActivityReducer(state, {
		type: "add-reply",
		entryId: "missing",
		reply,
	});

	assert.equal(next, state);
});

test("add-reply never attaches to a non-comment entry sharing the id", () => {
	const state = baseState();
	const reply = createReply({
		id: "r1",
		actor: ACTOR,
		timestamp: "now",
		body: "x",
	});

	const next = jiraActivityReducer(state, {
		type: "add-reply",
		entryId: "e1",
		reply,
	});

	assert.equal(next, state);
});
