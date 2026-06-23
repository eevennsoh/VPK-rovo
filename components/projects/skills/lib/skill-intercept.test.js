const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

async function loadSkillInterceptModule() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				export {
					matchSkillInvocation,
					buildSkillInterceptOutcome,
					buildSkillInvocationParts,
					SKILL_INVOCATION_WIDGET_TYPE,
				} from "./components/projects/skills/lib/skill-intercept.ts";
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "skill-intercept-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, "skill-intercept-harness.js");
}

test("exact starter prompt is a manual trigger and emits a skill-invocation widget", async () => {
	const { buildSkillInterceptOutcome, SKILL_INVOCATION_WIDGET_TYPE } = await loadSkillInterceptModule();

	const outcome = buildSkillInterceptOutcome("Review a pull request");
	assert.equal(outcome.handled, true);
	assert.ok(Array.isArray(outcome.assistantParts));

	const widgetPart = outcome.assistantParts[0];
	assert.equal(widgetPart.type, "data-widget-data");
	assert.equal(widgetPart.data.type, SKILL_INVOCATION_WIDGET_TYPE);
	assert.equal(widgetPart.data.payload.skillId, "review-pull-request");
	assert.match(widgetPart.data.payload.triggerLabel, /Manual/u);

	const textPart = outcome.assistantParts[1];
	assert.equal(textPart.type, "text");
	assert.equal(textPart.state, "done");
	assert.ok(textPart.text.length > 0);
});

test("a keyword in free text is an auto trigger with the matched keyword", async () => {
	const { buildSkillInterceptOutcome } = await loadSkillInterceptModule();

	const outcome = buildSkillInterceptOutcome("there's a bug in checkout");
	assert.equal(outcome.handled, true);
	assert.equal(outcome.assistantParts[0].data.payload.skillId, "create-work-items");
	assert.match(outcome.assistantParts[0].data.payload.triggerLabel, /Auto/u);
	assert.match(outcome.assistantParts[0].data.payload.triggerLabel, /bug/u);
});

test("keyword matching is whole-word (does not match substrings)", async () => {
	const { matchSkillInvocation } = await loadSkillInterceptModule();

	// "debugger" contains "bug" as a substring but is not the word "bug".
	assert.equal(matchSkillInvocation("open the debugger"), null);
});

test("an unrelated prompt is not handled", async () => {
	const { buildSkillInterceptOutcome } = await loadSkillInterceptModule();

	const outcome = buildSkillInterceptOutcome("hello there, how are you?");
	assert.equal(outcome.handled, false);
	assert.equal(outcome.assistantParts, undefined);
});

test("empty input matches nothing", async () => {
	const { matchSkillInvocation } = await loadSkillInterceptModule();

	assert.equal(matchSkillInvocation("   "), null);
});
