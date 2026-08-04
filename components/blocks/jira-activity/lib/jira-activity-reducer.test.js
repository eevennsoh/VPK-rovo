const assert = require("node:assert/strict");
const test = require("node:test");

const {
	jiraActivityReducer,
	createCommentEntry,
	createReply,
	toggleReaction,
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

function reactionState(reactions) {
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
				...(reactions ? { reactions } : {}),
			},
		],
	};
}

function commentIn(state) {
	return state.entries.find((entry) => entry.id === "c1");
}

test("toggle-reaction adds a new emoji with the calling actor", () => {
	const state = reactionState();

	const next = jiraActivityReducer(state, {
		type: "toggle-reaction",
		entryId: "c1",
		emoji: "👍",
		actorId: "u1",
	});

	assert.deepEqual(commentIn(next).reactions, [{ emoji: "👍", actorIds: ["u1"] }]);
	// The input state is not mutated.
	assert.equal(commentIn(state).reactions, undefined);
});

test("toggle-reaction appends a second actor, preserving reaction and actor order", () => {
	const state = reactionState([
		{ emoji: "👍", actorIds: ["u1"] },
		{ emoji: "🎉", actorIds: ["u3"] },
	]);

	const next = jiraActivityReducer(state, {
		type: "toggle-reaction",
		entryId: "c1",
		emoji: "👍",
		actorId: "u2",
	});

	assert.deepEqual(commentIn(next).reactions, [
		{ emoji: "👍", actorIds: ["u1", "u2"] },
		{ emoji: "🎉", actorIds: ["u3"] },
	]);
	// The input reaction list is not mutated.
	assert.deepEqual(commentIn(state).reactions[0].actorIds, ["u1"]);
});

test("toggle-reaction removes only the calling actor", () => {
	const state = reactionState([{ emoji: "👍", actorIds: ["u1", "u2", "u3"] }]);

	const next = jiraActivityReducer(state, {
		type: "toggle-reaction",
		entryId: "c1",
		emoji: "👍",
		actorId: "u2",
	});

	assert.deepEqual(commentIn(next).reactions, [
		{ emoji: "👍", actorIds: ["u1", "u3"] },
	]);
});

test("toggle-reaction prunes the reaction when its last actor leaves", () => {
	const state = reactionState([
		{ emoji: "👍", actorIds: ["u1"] },
		{ emoji: "🎉", actorIds: ["u2"] },
	]);

	const next = jiraActivityReducer(state, {
		type: "toggle-reaction",
		entryId: "c1",
		emoji: "👍",
		actorId: "u1",
	});

	assert.deepEqual(commentIn(next).reactions, [{ emoji: "🎉", actorIds: ["u2"] }]);
});

test("toggle-reaction is a no-op (same reference) when no comment matches the id", () => {
	const state = reactionState();

	const next = jiraActivityReducer(state, {
		type: "toggle-reaction",
		entryId: "missing",
		emoji: "👍",
		actorId: "u1",
	});

	assert.equal(next, state);
});

test("toggle-reaction never attaches to a non-comment entry sharing the id", () => {
	const state = reactionState();

	const next = jiraActivityReducer(state, {
		type: "toggle-reaction",
		entryId: "e1",
		emoji: "👍",
		actorId: "u1",
	});

	assert.equal(next, state);
	assert.equal(state.entries[0].reactions, undefined);
});

test("toggleReaction is pure and returns a fresh list on every branch", () => {
	const reactions = Object.freeze([
		Object.freeze({ emoji: "👍", actorIds: Object.freeze(["u1"]) }),
	]);

	const added = toggleReaction(reactions, "🎉", "u2");
	const joined = toggleReaction(reactions, "👍", "u2");
	const pruned = toggleReaction(reactions, "👍", "u1");

	assert.deepEqual(added, [
		{ emoji: "👍", actorIds: ["u1"] },
		{ emoji: "🎉", actorIds: ["u2"] },
	]);
	assert.deepEqual(joined, [{ emoji: "👍", actorIds: ["u1", "u2"] }]);
	assert.deepEqual(pruned, []);

	// The frozen input is untouched and never handed back.
	assert.deepEqual(reactions, [{ emoji: "👍", actorIds: ["u1"] }]);
	assert.notEqual(added, reactions);
	assert.notEqual(joined, reactions);
	assert.notEqual(pruned, reactions);
});

test("toggleReaction treats a missing reaction list as empty", () => {
	assert.deepEqual(toggleReaction(undefined, "👍", "u1"), [
		{ emoji: "👍", actorIds: ["u1"] },
	]);
});
