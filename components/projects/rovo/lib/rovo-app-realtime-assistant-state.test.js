const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");

const {
	createRealtimeAssistantTextStreamState,
	finalizeRealtimeAssistantText,
	reduceRealtimeAssistantTextDelta,
} = require("./rovo-app-realtime-assistant-state.ts");
const studioRealtimeAssistantState = require(path.join(
	process.cwd(),
	"components/projects/studio/lib/rovo-app-realtime-assistant-state.ts",
));

const ROUTE_HELPERS = [
	{
		createRealtimeAssistantTextStreamState,
		finalizeRealtimeAssistantText,
		name: "Rovo",
		reduceRealtimeAssistantTextDelta,
	},
	{
		createRealtimeAssistantTextStreamState: studioRealtimeAssistantState.createRealtimeAssistantTextStreamState,
		finalizeRealtimeAssistantText: studioRealtimeAssistantState.finalizeRealtimeAssistantText,
		name: "Studio",
		reduceRealtimeAssistantTextDelta: studioRealtimeAssistantState.reduceRealtimeAssistantTextDelta,
	},
];

test("reduceRealtimeAssistantTextDelta accumulates the full first response", () => {
	let state = createRealtimeAssistantTextStreamState();

	let result = reduceRealtimeAssistantTextDelta(state, {
		delta: "I",
		itemId: "item-1",
		responseId: "response-1",
		source: "text",
	});
	assert.equal(result.shouldEmitStart, true);
	assert.equal(result.messageId, "item-1");
	state = result.state;

	result = reduceRealtimeAssistantTextDelta(state, {
		delta: "'m doing great",
		itemId: "item-1",
		responseId: "response-1",
		source: "text",
	});
	assert.equal(result.shouldEmitStart, false);
	state = result.state;

	result = reduceRealtimeAssistantTextDelta(state, {
		delta: ", thanks for asking!",
		itemId: "item-1",
		responseId: "response-1",
		source: "text",
	});
	state = result.state;

	assert.deepEqual(finalizeRealtimeAssistantText(state), {
		messageId: "item-1",
		text: "I'm doing great, thanks for asking!",
	});
});

test("reduceRealtimeAssistantTextDelta resets when a new response begins", () => {
	let state = createRealtimeAssistantTextStreamState();

	state = reduceRealtimeAssistantTextDelta(state, {
		delta: "First response",
		itemId: "item-1",
		responseId: "response-1",
		source: "text",
	}).state;

	const result = reduceRealtimeAssistantTextDelta(state, {
		delta: "Second response",
		itemId: "item-2",
		responseId: "response-2",
		source: "text",
	});

	assert.equal(result.shouldEmitStart, true);
	assert.deepEqual(finalizeRealtimeAssistantText(result.state), {
		messageId: "item-2",
		text: "Second response",
	});
});

test("reduceRealtimeAssistantTextDelta ignores audio transcript deltas after text deltas", () => {
	let state = createRealtimeAssistantTextStreamState();

	state = reduceRealtimeAssistantTextDelta(state, {
		delta: "Hello there",
		itemId: "item-1",
		responseId: "response-1",
		source: "text",
	}).state;

	const result = reduceRealtimeAssistantTextDelta(state, {
		delta: " ignored transcript",
		itemId: "item-1",
		responseId: "response-1",
		source: "audio_transcript",
	});

	assert.equal(result.shouldEmitStart, false);
	assert.deepEqual(finalizeRealtimeAssistantText(result.state), {
		messageId: "item-1",
		text: "Hello there",
	});
});

test("reduceRealtimeAssistantTextDelta switches to text after audio transcript without duplicating", () => {
	let state = createRealtimeAssistantTextStreamState();

	state = reduceRealtimeAssistantTextDelta(state, {
		delta: "Hello",
		itemId: "item-1",
		responseId: "response-1",
		source: "audio_transcript",
	}).state;

	const result = reduceRealtimeAssistantTextDelta(state, {
		delta: "Hello",
		itemId: "item-1",
		responseId: "response-1",
		source: "text",
	});

	assert.equal(result.shouldEmitStart, false);
	assert.equal(result.shouldReplaceTranscript, true);
	assert.deepEqual(finalizeRealtimeAssistantText(result.state), {
		messageId: "item-1",
		text: "Hello",
	});
});

test("reduceRealtimeAssistantTextDelta preserves audio text when a later text delta continues it", () => {
	for (const helper of ROUTE_HELPERS) {
		let state = helper.createRealtimeAssistantTextStreamState();

		state = helper.reduceRealtimeAssistantTextDelta(state, {
			delta: "Hello ",
			itemId: "item-1",
			responseId: "response-1",
			source: "audio_transcript",
		}).state;

		const result = helper.reduceRealtimeAssistantTextDelta(state, {
			delta: "world",
			itemId: "item-1",
			responseId: "response-1",
			source: "text",
		});

		assert.equal(result.shouldEmitStart, false, helper.name);
		assert.equal(result.shouldReplaceTranscript, true, helper.name);
		assert.deepEqual(helper.finalizeRealtimeAssistantText(result.state), {
			messageId: "item-1",
			text: "Hello world",
		}, helper.name);
	}
});

test("reduceRealtimeAssistantTextDelta ignores replayed text chunks while audio is ahead", () => {
	for (const helper of ROUTE_HELPERS) {
		let state = helper.createRealtimeAssistantTextStreamState();

		state = helper.reduceRealtimeAssistantTextDelta(state, {
			delta: "Hello world",
			itemId: "item-1",
			responseId: "response-1",
			source: "audio_transcript",
		}).state;

		state = helper.reduceRealtimeAssistantTextDelta(state, {
			delta: "Hello",
			itemId: "item-1",
			responseId: "response-1",
			source: "text",
		}).state;

		const result = helper.reduceRealtimeAssistantTextDelta(state, {
			delta: "!",
			itemId: "item-1",
			responseId: "response-1",
			source: "text",
		});

		assert.equal(result.shouldEmitStart, false, helper.name);
		assert.equal(result.shouldReplaceTranscript, true, helper.name);
		assert.deepEqual(helper.finalizeRealtimeAssistantText(result.state), {
			messageId: "item-1",
			text: "Hello world!",
		}, helper.name);
	}
});
