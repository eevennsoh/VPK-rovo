const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
	JIRA_LINKING_FULL_DROP_PROFILE,
	JIRA_LINKING_REDUCED_DROP_PROFILE,
	flightsFromLinkingDrop,
	resolveJiraLinkingDropPlayback,
	resolveJiraLinkingDropProfile,
} = require("./drop.ts");

function member(id, name = id) {
	return { id, name };
}

function drop(overrides = {}) {
	return {
		from: overrides.from ?? { x: 10, y: 20 },
		members: overrides.members ?? [member("s1")],
		playback: overrides.playback,
	};
}

test("an unspecified playback is a stagger, so a card drop matches the well", () => {
	assert.equal(resolveJiraLinkingDropPlayback(drop()), "stagger");
	assert.equal(resolveJiraLinkingDropPlayback(drop({ playback: "cohort" })), "cohort");
	assert.equal(resolveJiraLinkingDropPlayback(drop({ playback: "stagger" })), "stagger");
});

test("a four-member stagger receipt is N flights with well-matching delays", () => {
	const flights = flightsFromLinkingDrop(
		drop({
			members: [member("a"), member("b"), member("c"), member("d")],
		}),
		JIRA_LINKING_FULL_DROP_PROFILE,
	);
	assert.equal(flights.length, 4);
	assert.deepEqual(flights.map((flight) => flight.delayMs), [0, 70, 140, 210]);
	assert.deepEqual(
		flights.map((flight) => flight.members.map((item) => item.id)),
		[["a"], ["b"], ["c"], ["d"]],
	);
});

test("a four-member stagger receipt fans launch points", () => {
	const next = drop({
		members: [member("a"), member("b"), member("c"), member("d")],
	});
	const flights = flightsFromLinkingDrop(next, JIRA_LINKING_FULL_DROP_PROFILE);
	assert.deepEqual(
		flights.map((flight) => flight.from.x - next.from.x),
		[-21, -7, 7, 21],
	);
	assert.deepEqual(
		flights.map((flight) => flight.from.y),
		[next.from.y, next.from.y, next.from.y, next.from.y],
	);
});

test("a cohort playback is one flight from the drop origin", () => {
	const next = drop({
		members: [member("a"), member("b"), member("c"), member("d")],
		playback: "cohort",
	});
	const flights = flightsFromLinkingDrop(next, JIRA_LINKING_FULL_DROP_PROFILE);
	assert.equal(flights.length, 1);
	assert.equal(flights[0].delayMs, 0);
	assert.deepEqual(flights[0].from, next.from);
	assert.deepEqual(
		flights[0].members.map((item) => item.id),
		["a", "b", "c", "d"],
	);
});

test("a single member does not fan even when staggering", () => {
	const next = drop();
	const flights = flightsFromLinkingDrop(next, JIRA_LINKING_FULL_DROP_PROFILE);
	assert.equal(flights.length, 1);
	assert.deepEqual(flights[0].from, next.from);
	assert.equal(flights[0].delayMs, 0);
});

test("reduced stagger keeps member flights without delay or spread", () => {
	const next = drop({
		members: [member("a"), member("b")],
	});
	const flights = flightsFromLinkingDrop(next, JIRA_LINKING_REDUCED_DROP_PROFILE);
	assert.equal(flights.length, 2);
	assert.deepEqual(flights.map((flight) => flight.delayMs), [0, 0]);
	assert.deepEqual(flights.map((flight) => flight.from), [next.from, next.from]);
	assert.equal(JIRA_LINKING_REDUCED_DROP_PROFILE.travel, "none");
	assert.equal(JIRA_LINKING_REDUCED_DROP_PROFILE.durationMs, 0);
});

test("the drop profile follows reduced motion the way the well does", () => {
	assert.equal(resolveJiraLinkingDropProfile(true), JIRA_LINKING_REDUCED_DROP_PROFILE);
	assert.equal(resolveJiraLinkingDropProfile(false), JIRA_LINKING_FULL_DROP_PROFILE);
	assert.equal(resolveJiraLinkingDropProfile(null), JIRA_LINKING_FULL_DROP_PROFILE);
});

test("card-drop flights arc clockwise; peak and stagger stay with the well", () => {
	assert.equal(JIRA_LINKING_FULL_DROP_PROFILE.arcPeak, 0.5);
	assert.equal(JIRA_LINKING_FULL_DROP_PROFILE.arcStrength, -0.42);
	assert.equal(JIRA_LINKING_FULL_DROP_PROFILE.durationMs, 400);
	assert.equal(JIRA_LINKING_FULL_DROP_PROFILE.staggerMs, 70);
});

test("flight keys are stable for identical input and unique per member", () => {
	const next = drop({
		members: [member("a"), member("b")],
	});
	const first = flightsFromLinkingDrop(next, JIRA_LINKING_FULL_DROP_PROFILE);
	const second = flightsFromLinkingDrop(next, JIRA_LINKING_FULL_DROP_PROFILE);
	assert.deepEqual(
		first.map((flight) => flight.key),
		second.map((flight) => flight.key),
	);
	assert.notEqual(first[0].key, first[1].key);
});
