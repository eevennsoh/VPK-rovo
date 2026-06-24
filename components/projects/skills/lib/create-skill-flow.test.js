const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

async function loadCreateSkillFlowModule() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				export {
					CREATE_SKILL_ID,
					CREATE_SKILL_NAME,
					CREATE_SKILL_QUESTION_TITLE,
					SKILL_CREATION_TRACE_WIDGET_TYPE,
					SKILL_CREATION_RESULT_WIDGET_TYPE,
					hasCreateSkillMention,
					buildSkillMentionText,
					isCreateSkillClarification,
					buildCreateSkillStage1,
					buildCreateSkillStage2,
					deriveSkillFromPrompt,
				} from "./components/projects/skills/lib/create-skill-flow.ts";
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "create-skill-flow-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, "create-skill-flow-harness.js");
}

test("detects the create-skill mention or leading command and builds prefill text", async () => {
	const { hasCreateSkillMention, buildSkillMentionText } = await loadCreateSkillFlowModule();
	// The composer serializes a skill mention as "/<label>", not @[skill:id].
	assert.equal(hasCreateSkillMention("/Create skill summarize my daily standups"), true);
	assert.equal(hasCreateSkillMention("/create-skill summarize my daily standups"), true);
	assert.equal(hasCreateSkillMention("/create skill do a thing"), true);
	assert.equal(hasCreateSkillMention("create skill summarize my daily standups"), true);
	assert.equal(hasCreateSkillMention("create a skill to summarize my daily standups"), true);
	assert.equal(hasCreateSkillMention("create-skill summarize my daily standups"), true);
	assert.equal(hasCreateSkillMention("Create skill do a thing"), true);
	assert.equal(hasCreateSkillMention("/Review a pull request do a thing"), false);
	assert.equal(hasCreateSkillMention("I want to create a skill someday"), false);
	assert.equal(buildSkillMentionText("Standup digest"), "/Standup digest ");
});

test("recognizes the clarification answer turn by title", async () => {
	const { isCreateSkillClarification, CREATE_SKILL_QUESTION_TITLE } = await loadCreateSkillFlowModule();
	const summary = `Here are my clarification answers for "${CREATE_SKILL_QUESTION_TITLE}":\n\n- Goal: Summarize`;
	assert.equal(isCreateSkillClarification(summary), true);
	assert.equal(isCreateSkillClarification("here are my answers for something else"), false);
});

test("stage 1 animates a trace then awaits with a question card", async () => {
	const { buildCreateSkillStage1, SKILL_CREATION_TRACE_WIDGET_TYPE } = await loadCreateSkillFlowModule();
	const ctx = { startedAt: new Date(0) };
	const stage = buildCreateSkillStage1();

	// Pending frame: a trace widget in the "thinking" header state.
	const pending = stage.getPendingAssistantParts(ctx);
	assert.equal(pending[0].type, "data-widget-data");
	assert.equal(pending[0].data.type, SKILL_CREATION_TRACE_WIDGET_TYPE);
	assert.equal(pending[0].data.payload.headerState, "thinking");
	assert.deepEqual(pending[0].data.payload.steps.map((step) => step.id), ["read"]);

	const invokeFrame = stage.assistantPartStages[0].getAssistantParts(ctx)[0];
	assert.deepEqual(invokeFrame.data.payload.steps.map((step) => step.id), ["read", "invoke"]);
	assert.equal(invokeFrame.data.payload.steps[1].skillMention, "create-skill");

	const questionsFrame = stage.assistantPartStages[1].getAssistantParts(ctx)[0];
	assert.deepEqual(questionsFrame.data.payload.steps.map((step) => step.id), ["read", "invoke", "questions"]);

	assert.ok(stage.assistantPartStages.length >= 1);
	const finalParts = stage.assistantPartStages.at(-1).getAssistantParts(ctx);

	// Final frame: the trace marks itself awaiting (header flips to "Awaiting user
	// response") and the docked question card appears.
	const tracePart = finalParts.find(
		(part) => part.type === "data-widget-data" && part.data.type === SKILL_CREATION_TRACE_WIDGET_TYPE,
	);
	assert.ok(tracePart);
	assert.equal(tracePart.data.payload.awaiting, true);

	const questionPart = finalParts.find(
		(part) => part.type === "data-widget-data" && part.data.type === "question-card",
	);
	assert.ok(questionPart);
	assert.equal(questionPart.data.payload.creationMode, "skill");
	assert.equal(questionPart.data.payload.round, 1);
	assert.ok(questionPart.data.payload.maxRounds > questionPart.data.payload.round);
	assert.ok(questionPart.data.payload.questions.length >= 1);
	assert.ok(questionPart.data.payload.questions.length <= 4);
});

test("derives a believable skill from a free-form prompt (deterministic)", async () => {
	const { deriveSkillFromPrompt } = await loadCreateSkillFlowModule();
	const a = deriveSkillFromPrompt("create skill summarize my standups");
	const b = deriveSkillFromPrompt("create skill summarize my standups");
	const c = deriveSkillFromPrompt("create-skill summarize my standups");
	const d = deriveSkillFromPrompt("create a skill to summarize my standups");
	assert.deepEqual(a, b); // deterministic
	assert.deepEqual(a.id, c.id);
	assert.deepEqual(a.id, d.id);

	assert.ok(a.id.length > 0);
	assert.ok(a.name.length > 0);
	assert.ok(!/create.?skill/u.test(a.id)); // mention stripped, not the meta-skill
	assert.equal(a.source, "custom");
	assert.equal(a.collectionId, "custom");
	assert.ok(typeof a.skillMd === "string" && a.skillMd.includes(a.name));
});

test("stage 2 ends with the result card and fires onComplete", async () => {
	const { deriveSkillFromPrompt, buildCreateSkillStage2, SKILL_CREATION_RESULT_WIDGET_TYPE } =
		await loadCreateSkillFlowModule();
	const ctx = { startedAt: new Date(0) };
	const skill = deriveSkillFromPrompt("/Create skill draft release notes");

	let completed = 0;
	const stage = buildCreateSkillStage2(skill, () => {
		completed += 1;
	});

	const pending = stage.getPendingAssistantParts(ctx);
	assert.deepEqual(pending[0].data.payload.steps.map((step) => step.id), ["review"]);

	const draftFrame = stage.assistantPartStages[0].getAssistantParts(ctx)[0];
	assert.deepEqual(draftFrame.data.payload.steps.map((step) => step.id), ["review", "draft"]);

	const wireFrame = stage.assistantPartStages[1].getAssistantParts(ctx)[0];
	assert.deepEqual(wireFrame.data.payload.steps.map((step) => step.id), ["review", "draft", "wire"]);

	const saveFrame = stage.assistantPartStages[2].getAssistantParts(ctx)[0];
	assert.deepEqual(saveFrame.data.payload.steps.map((step) => step.id), ["review", "draft", "wire", "save"]);

	const resultStages = stage.assistantPartStages.filter((candidate) =>
		candidate.getAssistantParts(ctx).some(
			(part) => part.type === "data-widget-data" && part.data.type === SKILL_CREATION_RESULT_WIDGET_TYPE,
		)
	);
	assert.ok(resultStages.length >= 2);

	const firstResultStage = resultStages[0];
	const firstResultParts = firstResultStage.getAssistantParts(ctx);
	const firstTextPart = firstResultParts.find((part) => part.type === "text");
	assert.ok(firstTextPart);
	assert.equal(firstTextPart.state, "streaming");
	assert.match(firstTextPart.text, new RegExp(skill.name, "u"));

	await firstResultStage.onApply();
	assert.equal(completed, 1);

	const finalParts = resultStages.at(-1).getAssistantParts(ctx);
	const resultPart = finalParts.find(
		(part) => part.type === "data-widget-data" && part.data.type === SKILL_CREATION_RESULT_WIDGET_TYPE,
	);
	assert.ok(resultPart);
	assert.equal(resultPart.data.payload.skillId, skill.id);

	const finalTextPart = finalParts.find((part) => part.type === "text");
	assert.ok(finalTextPart);
	assert.equal(finalTextPart.state, "done");
	assert.match(finalTextPart.text, /prefilled the composer/u);
	assert.equal(completed, 1);
});
