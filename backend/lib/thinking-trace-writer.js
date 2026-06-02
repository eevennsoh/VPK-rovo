/**
 * Generic writer for `data-thinking-status` + `data-thinking-event` parts.
 *
 * The frontend's `<AssistantThinkingTrace>` (in
 * `components/projects/shared/components/assistant-thinking-trace.tsx`)
 * populates `ChainOfThoughtStep` rows from `data-thinking-event` parts.
 * Any backend path that wants the populated chain-of-thought collapsible
 * just needs to emit start/result pairs in this shape.
 *
 * Originally extracted from the agents-rfp demo trace helpers in
 * `backend/server.js`; see `createAgentsRfpDemoThinkingEventPart` and
 * `writeAgentsRfpDemoTrace` for the source pattern.
 */

const DEFAULT_TOOL_CALL_DELAY_RANGE_MS = Object.freeze({
	min: 1800,
	max: 2800,
});
const DEFAULT_TOOL_CALL_DELAY_MS = Math.round(
	(DEFAULT_TOOL_CALL_DELAY_RANGE_MS.min + DEFAULT_TOOL_CALL_DELAY_RANGE_MS.max) / 2,
);

function waitFor(delayMs, signal) {
	if (typeof delayMs !== "number" || !Number.isFinite(delayMs) || delayMs <= 0) {
		return Promise.resolve();
	}

	return new Promise((resolve) => {
		if (signal?.aborted) {
			resolve();
			return;
		}

		const timer = setTimeout(() => {
			signal?.removeEventListener?.("abort", onAbort);
			resolve();
		}, delayMs);

		const onAbort = () => {
			clearTimeout(timer);
			signal?.removeEventListener?.("abort", onAbort);
			resolve();
		};
		signal?.addEventListener?.("abort", onAbort, { once: true });
	});
}

function createThinkingEventPart(step, phase) {
	const timestamp = new Date().toISOString();
	const part = {
		type: "data-thinking-event",
		id: `${step.toolCallId}-${phase}`,
		data: {
			eventId: `${step.toolCallId}-${phase}`,
			phase,
			toolName: step.toolName,
			label: step.label,
			toolCallId: step.toolCallId,
			timestamp,
		},
	};

	if (phase === "start" && step.input !== undefined) {
		part.data.input = step.input;
	}
	if (phase === "result") {
		part.data.output = step.output ?? step.outputPreview ?? "Completed.";
		if (step.outputPreview) {
			part.data.outputPreview = step.outputPreview;
		}
	}

	return part;
}

function isPositiveFiniteNumber(value) {
	return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function normalizeDelayRange(range) {
	if (!range || typeof range !== "object") {
		return null;
	}

	const min = Number(range.min);
	const max = Number(range.max);
	if (!isPositiveFiniteNumber(min) || !isPositiveFiniteNumber(max)) {
		return null;
	}

	return {
		min: Math.min(min, max),
		max: Math.max(min, max),
	};
}

function getRandomizedDelayMs(range, random = Math.random) {
	const normalizedRange = normalizeDelayRange(range);
	if (!normalizedRange) {
		return DEFAULT_TOOL_CALL_DELAY_MS;
	}

	if (normalizedRange.min === normalizedRange.max) {
		return Math.round(normalizedRange.min);
	}

	const randomValue = typeof random === "function" ? random() : Math.random();
	const clampedRandomValue = Math.min(1, Math.max(0, Number.isFinite(randomValue) ? randomValue : Math.random()));
	return Math.round(normalizedRange.min + (normalizedRange.max - normalizedRange.min) * clampedRandomValue);
}

function resolveToolCallDelayMs(step, options = {}) {
	if (isPositiveFiniteNumber(step?.delayMs)) {
		return step.delayMs;
	}
	if (isPositiveFiniteNumber(options.defaultDelayMs)) {
		return options.defaultDelayMs;
	}

	return getRandomizedDelayMs(
		options.defaultDelayRangeMs ?? DEFAULT_TOOL_CALL_DELAY_RANGE_MS,
		options.random,
	);
}

/**
 * Write a sequence of scripted thinking steps to a UI message stream writer.
 *
 * For each step:
 * 1. Emit `data-thinking-status` (drives the collapsible trigger label).
 * 2. Emit `data-thinking-event` with phase=start (creates the ChainOfThoughtStep row in "running" state).
 * 3. Wait `step.delayMs`, `defaultDelayMs`, or a randomized range — this is the "running" beat.
 * 4. If the step has output, emit `data-thinking-event` with phase=result (transitions the row to "completed").
 *
 * @param {object} writer        — UI message stream writer (must expose `.write()`)
 * @param {Array}  steps         — ordered list of step descriptors
 * @param {object} [options]
 * @param {number} [options.defaultDelayMs]      — exact per-step delay when step.delayMs is unset
 * @param {{min:number,max:number}} [options.defaultDelayRangeMs] — randomized per-step delay range
 * @param {() => number} [options.random]        — random source for tests
 * @param {AbortSignal} [options.signal]         — abort to short-circuit the loop
 */
async function writeThinkingTraceSteps(writer, steps, options = {}) {
	const { signal } = options;

	if (!Array.isArray(steps) || steps.length === 0) {
		return;
	}

	for (const step of steps) {
		if (signal?.aborted) {
			return;
		}

		const toolCallDelayMs = resolveToolCallDelayMs(step, options);
		const hasResult = step.output !== undefined || step.outputPreview;
		const resultDelayMs = hasResult
			? Math.round(toolCallDelayMs * 0.7)
			: toolCallDelayMs;
		const resultHoldDelayMs = hasResult
			? Math.max(0, toolCallDelayMs - resultDelayMs)
			: 0;

		writer.write({
			type: "data-thinking-status",
			id: `${step.toolCallId}-status`,
			data: {
				label: step.label,
				content: step.content,
				activity: "data",
				source: "backend",
				timestamp: new Date().toISOString(),
			},
		});
		writer.write(createThinkingEventPart(step, "start"));
		await waitFor(resultDelayMs, signal);
		if (hasResult && !signal?.aborted) {
			writer.write(createThinkingEventPart(step, "result"));
			if (resultHoldDelayMs > 0) {
				await waitFor(resultHoldDelayMs, signal);
			}
		}
	}
}

module.exports = {
	DEFAULT_TOOL_CALL_DELAY_MS,
	DEFAULT_TOOL_CALL_DELAY_RANGE_MS,
	createThinkingEventPart,
	writeThinkingTraceSteps,
	__internals: {
		getRandomizedDelayMs,
		normalizeDelayRange,
		resolveToolCallDelayMs,
	},
};
