const assert = require("node:assert/strict");
const path = require("node:path");
const { test } = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(process.cwd() + "/scripts/lib/esbuild-cjs-loader.js");

let storyModulePromise;
function loadStoryModule() {
	if (!storyModulePromise) {
		storyModulePromise = esbuild
			.build({
				entryPoints: [path.join(__dirname, "data/hotfix-story.ts")],
				bundle: true,
				format: "cjs",
				loader: { ".css": "empty" },
				platform: "node",
				tsconfig: path.join(process.cwd(), "tsconfig.json"),
				write: false,
			})
			.then((result) => loadCjsModuleFromText(
				result.outputFiles[0].text,
				"jira-golden-journeys-v3-story-harness.cjs",
			));
	}
	return storyModulePromise;
}

function pullRequestFor(state) {
	return state.staticEvents.find((event) => event.id === "story-pr-review")?.pullRequest;
}

test("the story exposes the six Terminal-to-Release chapters", async () => {
	const story = await loadStoryModule();
	assert.deepEqual(
		story.JIRA_GOLDEN_JOURNEYS_V3_STORY_CHAPTERS.map(({ label, value }) => [label, value]),
		[
			["Terminal", "terminal"],
			["Build", "build"],
			["Review", "review"],
			["Fix", "fix"],
			["Approve", "approve"],
			["Release", "release"],
		],
	);
});

test("every Jira chapter continues one stable Claude session", async () => {
	const story = await loadStoryModule();
	for (const chapter of ["build", "review", "fix", "approve", "release"]) {
		const state = story.createJiraGoldenJourneysV3StoryState(chapter, {
			approvalStep: chapter === "approve" || chapter === "release" ? 2 : 0,
			ciStatus: chapter === "approve" || chapter === "release" ? "passed" : "failed",
			fixStep: chapter === "fix" ? "complete" : "failed",
			pullRequestMerged: chapter === "release",
			reviewStep: "failed",
		});
		assert.deepEqual(state.sessions.map((session) => session.agentId), ["claude-code"]);
		assert.equal(state.sessions[0].id, "story-session-claude-code");
		assert.equal(state.sessions[0].scriptId, "shop-4821-claude-delivery");
	}
});

test("Build starts with linked PR #1847, running CI, and Claude's handoff", async () => {
	const story = await loadStoryModule();
	const build = story.createJiraGoldenJourneysV3StoryState("build", { ciStatus: "running" });
	const pullRequest = pullRequestFor(build);
	assert.equal(pullRequest.number, 1847);
	assert.equal(pullRequest.status, "Open");
	assert.equal(pullRequest.branch, "feature/shop-4821-guest-checkout");
	assert.deepEqual(pullRequest.checks.map((check) => check.status), ["running", "queued", "queued"]);
	assert.match(build.comments[0].content, /PR #1847 is open[\s\S]*CI is running[\s\S]*Priya Narayanan[\s\S]*Jordan Lee/u);
});

test("Claude Code activity actors use the brand mark, not the coding-agent template", async () => {
	const story = await loadStoryModule();
	const build = story.createJiraGoldenJourneysV3StoryState("build", { ciStatus: "running" });
	assert.equal(build.sessions[0].agentBrandName, "claude");
	assert.equal(build.sessions[0].agentAvatarSrc, undefined);
	assert.equal(build.comments[0].authorBrandName, "claude");
	assert.equal(build.comments[0].authorAvatarSrc, undefined);
	assert.doesNotMatch(JSON.stringify(build), /basic-coding-agent-template/u);

	const claudeStaticActors = build.staticEvents
		.filter((event) => event.actor.name === "Claude Code")
		.map((event) => event.actor);
	assert.ok(claudeStaticActors.length > 0);
	for (const actor of claudeStaticActors) {
		assert.equal(actor.brandName, "claude");
		assert.equal(actor.avatarSrc, undefined);
	}
});

test("Review deterministically ends with one lint and typecheck failure", async () => {
	const story = await loadStoryModule();
	const steps = ["queued", "running", "unit-passed", "settling", "failed"];
	const statuses = steps.map((reviewStep) => pullRequestFor(
		story.createJiraGoldenJourneysV3StoryState("review", { reviewStep }),
	).checks.map((check) => check.status));
	assert.deepEqual(statuses, [
		["running", "queued", "queued"],
		["running", "running", "queued"],
		["running", "passed", "running"],
		["running", "passed", "passed"],
		["failed", "passed", "passed"],
	]);
	const failed = story.createJiraGoldenJourneysV3StoryState("review", { reviewStep: "failed" });
	assert.equal(failed.staticEvents.filter((event) => event.id === "story-ci-failed").length, 1);
	assert.match(failed.sessions[0].previewText, /Auto-merge is blocked/u);
});

test("Fix stays failed until auto-fix, then the same Claude session repairs and reaches green", async () => {
	const story = await loadStoryModule();
	const failed = story.createJiraGoldenJourneysV3StoryState("fix", {
		autoFixEnabled: false,
		ciStatus: "failed",
		fixStep: "failed",
	});
	const repairing = story.createJiraGoldenJourneysV3StoryState("fix", {
		autoFixEnabled: true,
		ciStatus: "repairing",
		fixStep: "repairing",
	});
	const complete = story.createJiraGoldenJourneysV3StoryState("fix", {
		autoFixEnabled: true,
		ciStatus: "passed",
		fixStep: "complete",
	});
	assert.deepEqual([failed, repairing, complete].map((state) => state.sessions[0].id), [
		"story-session-claude-code",
		"story-session-claude-code",
		"story-session-claude-code",
	]);
	assert.match(failed.sessions[0].previewText, /Enable Auto-fix CI & address comments/u);
	assert.deepEqual(pullRequestFor(repairing).checks.map((check) => check.status), ["running", "passed", "passed"]);
	assert.deepEqual(pullRequestFor(complete).checks.map((check) => check.status), ["passed", "passed", "passed"]);
	assert.ok(complete.staticEvents.some((event) => event.id === "story-ci-repair"));
	assert.ok(complete.staticEvents.some((event) => event.id === "story-ci-passed"));
});

test("Approve stages Priya before Jordan and never advances while CI is not green", async () => {
	const story = await loadStoryModule();
	assert.deepEqual(
		[0, 1, 2].map((approvalStep) => story.createJiraGoldenJourneysV3ReviewerApprovals(approvalStep)
			.map(({ name, approved }) => [name, approved])),
		[
			[["Priya Narayanan", false], ["Jordan Lee", false]],
			[["Priya Narayanan", true], ["Jordan Lee", false]],
			[["Priya Narayanan", true], ["Jordan Lee", true]],
		],
	);
	const blocked = story.createJiraGoldenJourneysV3StoryState("approve", {
		approvalStep: 0,
		ciStatus: "failed",
	});
	assert.match(blocked.sessions[0].previewText, /CI must be green/u);
	assert.equal(pullRequestFor(blocked).reviewDecision, "review-required");
	const partial = story.createJiraGoldenJourneysV3StoryState("approve", {
		approvalStep: 1,
		ciStatus: "passed",
	});
	assert.deepEqual(
		pullRequestFor(partial).reviewers.map(({ name, status }) => [name, status]),
		[["Priya Narayanan", "approved"], ["Jordan Lee", "pending"]],
	);
	const approved = story.createJiraGoldenJourneysV3StoryState("approve", {
		approvalStep: 2,
		ciStatus: "passed",
	});
	assert.deepEqual(
		approved.staticEvents.filter((event) => event.id.endsWith("-approved")).map((event) => event.actor.name),
		["Priya Narayanan", "Jordan Lee"],
	);
	assert.equal(pullRequestFor(approved).reviewDecision, "approved");
	const mergedInApprove = story.createJiraGoldenJourneysV3StoryState("approve", {
		approvalStep: 2,
		ciStatus: "passed",
		pullRequestMerged: true,
	});
	assert.equal(pullRequestFor(mergedInApprove).status, "Merged");
	assert.equal(pullRequestFor(mergedInApprove).mergeState, "merged");
	assert.ok(mergedInApprove.staticEvents.some((event) => event.id === "story-pr-merged"));
});

test("merge evaluation requires green CI and two approvals", async () => {
	const story = await loadStoryModule();
	assert.deepEqual(story.evaluateJiraGoldenJourneysV3MergeGate("failed", 2), {
		ciPassed: false,
		approvalsSatisfied: true,
		canMerge: false,
		blocker: "ci",
	});
	assert.deepEqual(story.evaluateJiraGoldenJourneysV3MergeGate("passed", 1), {
		ciPassed: true,
		approvalsSatisfied: false,
		canMerge: false,
		blocker: "approvals",
	});
	assert.deepEqual(story.evaluateJiraGoldenJourneysV3MergeGate("passed", 2), {
		ciPassed: true,
		approvalsSatisfied: true,
		canMerge: true,
		blocker: null,
	});
	assert.equal(story.resolveJiraGoldenJourneysV3MergeStatus({
		approvalCount: 2,
		autoMergeEnabled: false,
		ciStatus: "passed",
		pullRequestMerged: false,
	}), "disabled");
	assert.equal(story.resolveJiraGoldenJourneysV3MergeStatus({
		approvalCount: 1,
		autoMergeEnabled: true,
		ciStatus: "passed",
		pullRequestMerged: false,
	}), "blocked");
	assert.equal(story.resolveJiraGoldenJourneysV3MergeStatus({
		approvalCount: 2,
		autoMergeEnabled: true,
		ciStatus: "passed",
		pullRequestMerged: false,
	}), "queued");
});

test("Release only reveals persisted merge state and never invents a merge", async () => {
	const story = await loadStoryModule();
	const notMerged = story.createJiraGoldenJourneysV3StoryState("release", {
		approvalStep: 2,
		autoMergeEnabled: true,
		ciStatus: "passed",
		pullRequestMerged: false,
	});
	assert.equal(pullRequestFor(notMerged).status, "Open");
	assert.equal(pullRequestFor(notMerged).mergeState, "ready");
	assert.equal(story.createJiraGoldenJourneysV3StoryWorkItem("release", {
		pullRequestMerged: false,
	}).status, "In review");
	assert.match(notMerged.sessions[0].previewText, /Release is showing the current rule state without changing it/u);

	const merged = story.createJiraGoldenJourneysV3StoryState("release", {
		approvalStep: 2,
		autoMergeEnabled: true,
		ciStatus: "passed",
		pullRequestMerged: true,
	});
	assert.equal(pullRequestFor(merged).status, "Merged");
	assert.equal(pullRequestFor(merged).mergeState, "merged");
	assert.equal(story.createJiraGoldenJourneysV3StoryWorkItem("release", {
		pullRequestMerged: true,
	}).status, "Done");
	assert.ok(merged.staticEvents.some((event) => event.id === "story-pr-merged"));
	assert.equal(merged.staticEvents.find((event) => event.id === "story-changed-files").tag.text, "PR #1847 merged");
	assert.doesNotMatch(merged.sessions[0].previewText, /deploy|feature flag|telemetry|production/u);
});
