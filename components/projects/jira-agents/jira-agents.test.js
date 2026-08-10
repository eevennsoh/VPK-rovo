const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(process.cwd() + "/scripts/lib/esbuild-cjs-loader.js");

function readProjectFile(relativePath) {
	return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

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
				"jira-agents-hotfix-story-harness.cjs",
			));
	}
	return storyModulePromise;
}

let orchestrationModulePromise;
function loadOrchestrationModule() {
	if (!orchestrationModulePromise) {
		orchestrationModulePromise = esbuild
			.build({
				entryPoints: [path.join(__dirname, "data/orchestration-state.ts")],
				bundle: true,
				format: "cjs",
				loader: { ".css": "empty" },
				platform: "node",
				tsconfig: path.join(process.cwd(), "tsconfig.json"),
				write: false,
			})
			.then((result) => loadCjsModuleFromText(
				result.outputFiles[0].text,
				"jira-agents-orchestration-state-harness.cjs",
			));
	}
	return orchestrationModulePromise;
}

let stateModulePromise;
function loadStateModule() {
	if (!stateModulePromise) {
		stateModulePromise = esbuild
			.build({
				entryPoints: [path.join(process.cwd(), "components/blocks/jira-work-item/data/session-state.ts")],
				bundle: true,
				format: "cjs",
				loader: { ".css": "empty" },
				platform: "node",
				tsconfig: path.join(process.cwd(), "tsconfig.json"),
				write: false,
			})
			.then((result) => loadCjsModuleFromText(
				result.outputFiles[0].text,
				"jira-agents-session-state-harness.cjs",
			));
	}
	return stateModulePromise;
}

test("Jira Agents composes the seven-chapter software delivery story without changing the gallery", () => {
	const pageSource = readProjectFile("components/projects/jira-agents/page.tsx");
	const controlsSource = readProjectFile("components/projects/jira-agents/story-controls.tsx");
	const controllerSource = readProjectFile("components/projects/jira-agents/use-hotfix-story.ts");
	const itemsSource = readProjectFile("components/projects/jira-agents/data/gallery-items.ts");
	const gallerySource = readProjectFile("components/blocks/gallery/components/gallery.tsx");

	assert.match(pageSource, /<JiraAgentsStoryControls controller=\{storyController\} \/>/u);
	assert.match(pageSource, /<ExperimentalV2JiraWorkItem[\s\S]*automationRules=\{JIRA_AGENTS_AUTOMATION_RULES\}[\s\S]*composerAgents=\{JIRA_AGENTS_STORY_COMPOSER_AGENTS\}[\s\S]*composerDelivery="broadcast-active-agents"[\s\S]*initialState=\{controller\.initialState\}[\s\S]*statusPhases=\{JIRA_AGENTS_STATUS_PHASES\}[\s\S]*workItem=\{controller\.workItem\}/u);
	assert.match(pageSource, /onAgentPromptSubmit=\{handleAgentPromptSubmit\}/u);
	assert.match(pageSource, /initialStateRevision=\{controller\.launchId\}/u);
	assert.doesNotMatch(pageSource, /key=\{controller\.launchId\}/u);
	assert.match(pageSource, /selectAgent\(agentId, \{ preserveCurrentThread: true \}\);[\s\S]*openChat\("floating"\);/u);
	assert.match(controlsSource, /JIRA_AGENTS_STORY_CHAPTERS\.map/u);
	assert.match(controlsSource, /aria-label="Open a software delivery story chapter"/u);
	assert.match(controllerSource, /setLaunchId\(\(current\) => current \+ 1\);/u);
	assert.match(controllerSource, /getJiraAgentsStoryChapterForStatus\(storyColumn\)/u);
	assert.equal((itemsSource.match(/\bid:\s*"/gu) ?? []).length, 1);
	assert.match(itemsSource, /id: "work-item"/u);
	assert.doesNotMatch(itemsSource, /Kanban & List|id: "kanban-list"/u);
	assert.doesNotMatch(itemsSource, /Jira For You|id: "for-you"/u);
	assert.doesNotMatch(pageSource, /KanbanListStage|item\.id === "kanban-list"/u);
	assert.doesNotMatch(pageSource, /ForYouStage|item\.id === "for-you"/u);
	assert.doesNotMatch(pageSource, /WorkItemControls|useWorkItemStageController/u);
	// Single-card jira-agents feed relies on shared Gallery collapsing the bottom picker.
	assert.match(gallerySource, /const showCarouselPicker = items\.length >= 2;/u);
	assert.match(gallerySource, /isOpen && showCarouselPicker \?/u);
});

test("submitting the complete @mentioned agent team starts the staged orchestration reveal", async () => {
	const story = await loadStoryModule();
	const pageSource = readProjectFile("components/projects/jira-agents/page.tsx");
	const controllerSource = readProjectFile("components/projects/jira-agents/use-hotfix-story.ts");
	const completeTeam = story.JIRA_AGENTS_STORY_COMPOSER_AGENTS.map((agent) => agent.id);

	assert.equal(story.shouldStartJiraAgentsPlan("brief", completeTeam), true);
	assert.equal(story.shouldStartJiraAgentsPlan("brief", completeTeam.slice(0, 1)), false);
	assert.equal(story.shouldStartJiraAgentsPlan("plan", completeTeam), false);
	assert.match(pageSource, /shouldStartJiraAgentsPlan\(chapter, agentIds\)[\s\S]*startOrchestration\(\)/u);
	assert.doesNotMatch(pageSource, /shouldStartJiraAgentsPlan\(chapter, agentIds\)[\s\S]*selectChapter\("plan"\)/u);
	assert.match(controllerSource, /if \(!active \|\| orchestrationStep === "idle"\) return undefined;/u);
	assert.match(controllerSource, /return \(\) => window\.clearTimeout\(timeoutId\);/u);
});

test("the orchestration reveal acknowledges the prompt, then removes reactions after the A2A reply", async () => {
	const orchestration = await loadOrchestrationModule();
	const steps = [
		"agents-working",
		"comment",
		"reaction-1",
		"reaction-2",
		"lead",
		"consult",
	];
	const states = steps.map((step) => orchestration.createJiraAgentsOrchestrationState(step));

	assert.deepEqual(states.map((state) => state.sessions.length), steps.map(() => 2));
	assert.deepEqual(states.map((state) => state.sessions.filter(
		(session) => session.status !== "completed",
	).length), [2, 2, 2, 2, 2, 1]);
	assert.deepEqual(states.map((state) => {
		const comment = state.comments.find((candidate) => candidate.id === "story-channel-orchestration");
		return comment?.reactions?.[0]?.actorIds.length ?? (comment ? 0 : -1);
	}), [-1, 0, 1, 2, 2, 0]);
	assert.deepEqual(states.map((state) => state.staticEvents.some(
		(event) => event.id === "story-lead-delegated",
	)), [false, false, false, false, true, true]);
});

test("the lead activity shows the custom planner and Claude Code as mention tags", async () => {
	const story = await loadStoryModule();
	const plan = story.createJiraAgentsStoryState("plan");
	const leadActivity = plan.staticEvents.find(
		(event) => event.id === "story-lead-delegated",
	);
	const claudeSession = plan.sessions.find((session) => session.agentId === "claude-code");

	assert.equal(leadActivity.showActor, false);
	assert.equal(leadActivity.showTimestamp, false);
	assert.deepEqual(
		leadActivity.segments.map((segment) => segment.type),
		["agent-mention", "agent-mention", "text"],
	);
	assert.deepEqual(
		leadActivity.segments
			.filter((segment) => segment.type === "agent-mention")
			.map((segment) => segment.text),
		["Claude Code", "Code Planner"],
	);
	assert.equal(leadActivity.segments.at(-1).text, " Started working");
	assert.equal(leadActivity.segments[0].brandName, "claude");
	assert.equal(claudeSession.agentBrandName, "claude");
	assert.equal(
		story.createJiraAgentsStoryState("plan").comments.find(
			(comment) => comment.id === "story-channel-orchestration",
		).content,
		"@Claude Code take the lead on implementing guest checkout. Consult @Code Planner on the secure API and validation contract first, then implement and verify the work.",
	);
});

test("Jira Agents seeds checkout automation rows without changing the shared empty default", () => {
	const pageSource = readProjectFile("components/projects/jira-agents/page.tsx");
	const automationSource = readProjectFile("components/blocks/jira-work-item/experimental-v2/components/automation-tab.tsx");
	const compositionSource = readProjectFile("components/blocks/jira-work-item/experimental-v2/experimental-v2-jira-work-item.tsx");

	assert.match(pageSource, /title: "Reduce storefront checkout abandonment"/u);
	assert.match(pageSource, /title: "Validate guest checkout order totals"/u);
	assert.match(pageSource, /title: "Prevent duplicate payment on retry"/u);
	assert.match(pageSource, /title: "Run guest checkout regression suite"/u);
	assert.match(pageSource, /title: "Run guest checkout regression suite",[\s\S]*lastRunAt: "2m ago"/u);
	assert.deepEqual(
		[...pageSource.matchAll(/iconVariant: "(purple|blue|green)"/gu)].map((match) => match[1]),
		["purple", "purple", "blue", "green"],
	);
	assert.match(compositionSource, /automationRules\?: readonly WorkItemAutomationRule\[\];/u);
	assert.match(
		compositionSource,
		/<MetadataRail[\s\S]*activity=\{\([\s\S]*<ActivityPanel[\s\S]*activitySessionThread=\{activitySessionThread\}[\s\S]*railChromeEnabled=\{selectedPullRequestEntry === null\}[\s\S]*automationRules=\{automationRules\}[\s\S]*borderless[\s\S]*selectedPullRequestEntry=\{selectedPullRequestEntry\}[\s\S]*\/>/u,
	);
	assert.match(automationSource, /rules = \[\]/u);
});

test("the shared Jira Design workspace accepts route-owned board, list, and detail data", () => {
	const stageSource = readProjectFile("components/projects/jira-golden-journeys/components/for-you-stage.tsx");
	const dataSource = readProjectFile("components/projects/jira-golden-journeys/data/jira-design-work-items.ts");

	assert.match(stageSource, /boardColumns\?: readonly JiraKanbanColumnData\[\];/u);
	assert.match(stageSource, /sections\?: readonly JiraForYouSection\[\];/u);
	assert.match(stageSource, /workItemsByKey\.get\(row\.issueKey\)/u);
	assert.match(stageSource, /workItemsByKey\.get\(card\.code\)/u);
	assert.match(stageSource, /sections=\{sections\}/u);
	assert.match(dataSource, /workItemsByKey: ReadonlyMap<string, JiraForYouItem> = JIRA_DESIGN_WORK_ITEMS_BY_KEY/u);
	assert.match(dataSource, /const item = workItemsByKey\.get\(card\.code\);/u);
});

test("the software delivery chapters preserve the scripted status and agent-working progression", async () => {
	const story = await loadStoryModule();
	const chapters = story.JIRA_AGENTS_STORY_CHAPTERS.map((chapter) => chapter.value);

	assert.deepEqual(chapters, ["brief", "plan", "working", "handoff", "fixing", "review", "done"]);
	assert.deepEqual(
		story.JIRA_AGENTS_STORY_COMPOSER_AGENTS.map((agent) => agent.name),
		["Claude Code", "Code Planner"],
	);
	assert.deepEqual(
		chapters.map((chapter) => story.getJiraAgentsStoryStatus(chapter)),
		["To do", "In progress", "In progress", "In progress", "In progress", "In review", "Done"],
	);
	assert.deepEqual(
		chapters.map((chapter) => story.createJiraAgentsStoryState(chapter).sessions.filter(
			(session) => session.status !== "completed",
		).length),
		[0, 2, 1, 1, 1, 1, 0],
	);
	assert.deepEqual(
		chapters.map((chapter) => {
			const comment = story.createJiraAgentsStoryState(chapter).comments.find(
				(candidate) => candidate.id === "story-channel-orchestration",
			);
			return comment?.reactions?.[0]?.actorIds.length ?? 0;
		}),
		[0, 2, 0, 0, 0, 0, 0],
	);
});

test("the Brief starts with an implementation-ready checkout specification before agents begin", async () => {
	const story = await loadStoryModule();
	const brief = story.createJiraAgentsStoryState("brief");
	const description = story.JIRA_AGENTS_STORY_WORK_ITEM_BASE.description;

	assert.match(description, /^Checkout-funnel research/u);
	assert.match(description, /#### User outcome/u);
	assert.match(description, /#### Scope/u);
	assert.match(description, /#### Guest checkout flow/u);
	assert.match(description, /```mermaid[\s\S]*flowchart TD[\s\S]*Continue as guest\?[\s\S]*```/u);
	assert.match(description, /#### Acceptance criteria/u);
	assert.doesNotMatch(description, /\*\*Continue as guest\*\*/u);
	assert.match(description, /Declined payments and recoverable validation errors do not clear safe customer input/u);
	assert.doesNotMatch(description, /## Engineering guardrails|## Out of scope/u);
	assert.equal(brief.sessions.length, 0);
	assert.equal(brief.metadata.status, "To do");
	assert.equal(brief.metadata.atlassianProject, "storefront-platform");
	assert.equal(brief.metadata.parent, "SHOP-4800");
	assert.deepEqual(story.createJiraAgentsStoryWorkItem("brief").parent, {
		code: "SHOP-4800",
		title: "Reduce storefront checkout abandonment",
	});
	assert.deepEqual(brief.comments[0].threadReplies, [{
		id: "story-channel-brief-maya-reply",
		authorName: "Maya Chen",
		authorAvatarSrc: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
		content: "Agreed. If the email already belongs to an account, let the shopper finish as a guest and offer sign-in or account linking only after the order is confirmed. That keeps this release focused and avoids pulling account recovery into checkout.",
		createdAtMs: Date.UTC(2026, 7, 5, 1, 56),
	}]);
	assert.deepEqual(
		brief.contextResources.subtasks.map(({ key, type, status }) => ({ key, type, status })),
		[
			{ key: "SHOP-4824", type: "Task", status: "done" },
			{ key: "SHOP-4822", type: "Task", status: "inprogress" },
			{ key: "SHOP-4823", type: "Story", status: "todo" },
		],
	);
	assert.deepEqual(
		brief.contextResources.linkedItems.map(({ key, type, status }) => ({ key, type, status })),
		[{ key: "SHOP-4760", type: "Task", status: "done" }],
	);
	assert.deepEqual(
		[
			...brief.contextResources.subtasks.map(({ key, assignee }) => ({ key, assignee })),
			...brief.contextResources.linkedItems.map(({ key, assignee }) => ({ key, assignee })),
		],
		[
			{ key: "SHOP-4824", assignee: "Anthony Chen" },
			{ key: "SHOP-4822", assignee: "Priya Hansra" },
			{ key: "SHOP-4823", assignee: "Veronica Rodriguez" },
			{ key: "SHOP-4760", assignee: "Anthony Chen" },
		],
	);
});

test("Jira Agents addresses authored story activity as Venn", async () => {
	const story = await loadStoryModule();
	const plan = story.createJiraAgentsStoryState("plan");
	const orchestrationComment = plan.comments.find(
		(comment) => comment.id === "story-channel-orchestration",
	);

	assert.equal(orchestrationComment.authorName, "Venn");
	assert.equal(plan.sessions[0].messages[0].authorName, "Venn");
});

test("child work-item statuses follow the delivery chapters", async () => {
	const story = await loadStoryModule();
	const chapters = story.JIRA_AGENTS_STORY_CHAPTERS.map((chapter) => chapter.value);

	assert.deepEqual(
		chapters.map((chapter) => story.createJiraAgentsStoryState(chapter).contextResources.subtasks.map((item) => item.status)),
		[
			["done", "inprogress", "todo"],
			["done", "inprogress", "todo"],
			["done", "inprogress", "todo"],
			["done", "done", "inprogress"],
			["done", "done", "inprogress"],
			["done", "done", "inprogress"],
			["done", "done", "done"],
		],
	);
});

test("Claude leads one evolving A2A thread with checklist and design evidence", async () => {
	const story = await loadStoryModule();
	const plan = story.createJiraAgentsStoryState("plan");
	const working = story.createJiraAgentsStoryState("working");
	const handoff = story.createJiraAgentsStoryState("handoff");
	const fixing = story.createJiraAgentsStoryState("fixing");
	const review = story.createJiraAgentsStoryState("review");
	const done = story.createJiraAgentsStoryState("done");
	const planClaude = plan.sessions.find((session) => session.agentId === "claude-code");
	const planPlanner = plan.sessions.find((session) => session.agentId === "code-planner");
	const workingClaude = working.sessions.find((session) => session.agentId === "claude-code");
	const workingPlanner = working.sessions.find((session) => session.agentId === "code-planner");
	const handoffClaude = handoff.sessions.find((session) => session.agentId === "claude-code");
	const fixingClaude = fixing.sessions.find((session) => session.agentId === "claude-code");
	const reviewClaude = review.sessions.find((session) => session.agentId === "claude-code");
	const doneClaude = done.sessions.find((session) => session.agentId === "claude-code");

	assert.equal(plan.sessions[0].agentId, "claude-code");
	assert.equal(planClaude.status, "running");
	assert.equal(planPlanner.status, "running");
	assert.equal(planPlanner.messages[0].authorName, "Claude Code");
	assert.match(planClaude.previewText, /Code Planner, review this work item/u);
	assert.equal(planClaude.progressChecklist.filter((item) => item.completed).length, 0);
	assert.equal(workingClaude.status, "running");
	assert.equal(workingPlanner.status, "completed");
	assert.match(workingPlanner.previewText, /Consultation complete/u);
	assert.equal(workingClaude.progressChecklist.filter((item) => item.completed).length, 1);
	assert.equal(working.comments.find(
		(comment) => comment.id === "story-channel-orchestration",
	).reactions, undefined);
	assert.equal(handoffClaude.status, "running");
	assert.equal(handoffClaude.progressChecklist.filter((item) => item.completed).length, 3);
	assert.deepEqual(handoffClaude.imageAttachment, {
		src: "/illustration/jira-agents/guest-checkout-final.png",
		alt: "Final guest checkout design",
		filename: "guest-checkout-final.png",
	});
	assert.equal(fixingClaude.status, "running");
	assert.equal(fixingClaude.progressChecklist.filter((item) => item.completed).length, 3);
	assert.match(fixingClaude.previewText, /cannot be merged yet[\s\S]*lint-and-typecheck/u);
	const fixingPr = fixing.staticEvents.find((event) => event.id === "story-pr-fixing");
	assert.equal(fixingPr.pullRequest.mergeState, "blocked");
	assert.equal(fixingPr.pullRequest.checks.filter((check) => check.status === "failed").length, 1);
	assert.equal(reviewClaude.status, "running");
	assert.equal(reviewClaude.progressChecklist.filter((item) => item.completed).length, 4);
	const openedPr = review.staticEvents.find((event) => event.id === "story-pr-opened");
	const mergedPr = done.staticEvents.find((event) => event.id === "story-pr-merged");
	assert.ok(openedPr?.pullRequest);
	assert.ok(mergedPr?.pullRequest);
	assert.equal(openedPr.pullRequest.authorName, "Venn");
	assert.equal(mergedPr.pullRequest.authorName, "Venn");
	assert.equal(openedPr.pullRequest.branch, "feature/guest-checkout");
	assert.equal(openedPr.pullRequest.targetBranch, "main");
	assert.equal(mergedPr.pullRequest.targetBranch, "main");
	assert.equal(typeof openedPr.pullRequest.createdAtMs, "number");
	assert.equal(typeof openedPr.pullRequest.updatedAtMs, "number");
	assert.equal(mergedPr.pullRequest.createdAtMs, openedPr.pullRequest.createdAtMs);
	assert.ok(mergedPr.pullRequest.updatedAtMs > mergedPr.pullRequest.createdAtMs);
	assert.equal(doneClaude.progressChecklist.filter((item) => item.completed).length, 5);
	assert.match(doneClaude.previewText, /PR #1847 is merged with all 18 acceptance checks passing/u);
	assert.ok(done.sessions.every((session) => session.status === "completed"));
});

test("the authored artifact and pull-request chronology is complete and renderable", async () => {
	const story = await loadStoryModule();
	const done = story.createJiraAgentsStoryState("done");
	const artifactEvents = done.staticEvents.filter((event) => event.kind === "changed-files");

	assert.deepEqual(
		done.staticEvents
			.filter((event) => [
				"story-changed-files",
				"story-regression-matrix",
				"story-pr-opened",
				"story-pr-merged",
			].includes(event.id))
			.map((event) => event.id),
		[
			"story-changed-files",
			"story-regression-matrix",
			"story-pr-opened",
			"story-pr-merged",
		],
	);
	assert.ok(artifactEvents.every((event) => event.sessionItem));
	assert.deepEqual(
		artifactEvents.flatMap((event) => event.outputs.map((output) => output.title)),
		[
			"Guest checkout implementation",
			"SHOP-4821 acceptance report",
		],
	);
});

test("the orchestration timeline and live broadcasts remain chronological", async () => {
	const [story, stateModel] = await Promise.all([loadStoryModule(), loadStateModule()]);
	const working = story.createJiraAgentsStoryState("working");
	const handoff = story.createJiraAgentsStoryState("handoff");
	const prompt = working.comments.find((comment) => comment.id === "story-channel-orchestration");
	const leadClaim = working.staticEvents.find((event) => event.id === "story-lead-delegated");
	const implementation = handoff.staticEvents.find((event) => event.id === "story-changed-files");
	const claude = working.sessions.find((session) => session.agentId === "claude-code");
	const codePlanner = working.sessions.find((session) => session.agentId === "code-planner");

	assert.ok(prompt.createdAtMs < leadClaim.createdAtMs);
	assert.ok(leadClaim.createdAtMs < claude.startedAtMs);
	assert.ok(claude.startedAtMs < codePlanner.startedAtMs);
	assert.ok(codePlanner.startedAtMs < implementation.createdAtMs);

	const broadcast = stateModel.jiraWorkItemReducer(working, {
		type: "broadcast-comment",
		text: "Keep guest checkout fast and do not create an account before purchase.",
	});
	const events = stateModel.selectActivityEvents(broadcast);
	assert.equal(events.at(-1).kind, "human");
	assert.equal(events.at(-1).content, "Keep guest checkout fast and do not create an account before purchase.");
	assert.equal(
		broadcast.sessions.find((session) => session.agentId === "claude-code").status,
		"running",
	);
});

test("SHOP-4821 is one shared route-owned item across board, list, and detail data", async () => {
	const story = await loadStoryModule();
	const chapters = story.JIRA_AGENTS_STORY_CHAPTERS.map((chapter) => chapter.value);

	for (const chapter of chapters) {
		const columns = story.createJiraAgentsBoardColumns(chapter);
		const expectedStatus = story.getJiraAgentsStoryStatus(chapter);
		const targetColumn = columns.find((column) => column.title === expectedStatus);
		const storyCards = columns.flatMap((column) => column.cards).filter(
			(card) => card.code === "SHOP-4821",
		);
		const sections = story.createJiraAgentsWorkspaceSections(chapter);
		const storyItems = sections.flatMap((section) => section.items).filter(
			(item) => item.issueKey === "SHOP-4821",
		);

		assert.equal(storyCards.length, 1);
		assert.equal(targetColumn.cards[0].code, "SHOP-4821");
		assert.equal(storyItems.length, 1);
		assert.equal(storyItems[0].jiraStatus, expectedStatus);
	}

	assert.equal(story.getJiraAgentsStoryChapterForStatus("To do"), "brief");
	assert.equal(story.getJiraAgentsStoryChapterForStatus("In progress"), "working");
	assert.equal(story.getJiraAgentsStoryChapterForStatus("Review"), "review");
	assert.equal(story.getJiraAgentsStoryChapterForStatus("In review"), "review");
	assert.equal(story.getJiraAgentsStoryChapterForStatus("Done"), "done");

	const working = story.createJiraAgentsBoardColumns("working");
	const unrelatedCard = working.find((column) => column.cards.some((card) => card.code !== "SHOP-4821")).cards.find(
		(card) => card.code !== "SHOP-4821",
	);
	const withLocalEdit = working.map((column) => ({
		...column,
		cards: column.cards.map((card) => card.code === unrelatedCard.code
			? { ...card, title: "Locally edited board card" }
			: card),
	}));
	const review = story.createJiraAgentsBoardColumns("review", withLocalEdit);
	const preserved = review.flatMap((column) => column.cards).find((card) => card.code === unrelatedCard.code);

	assert.equal(preserved.title, "Locally edited board card");
	assert.equal(story.getJiraAgentsStoryColumn(review), "In review");
});

test("agent session copy reads as a full comment, never a truncated preview", async () => {
	const story = await loadStoryModule();
	const chapters = ["brief", "plan", "working", "handoff", "fixing", "review", "done"];

	for (const chapter of chapters) {
		for (const session of story.createJiraAgentsStoryState(chapter).sessions) {
			assert.doesNotMatch(
				session.previewText ?? "",
				/(?:…|\.\.\.)\s*$/u,
				`${chapter}/${session.agentName} preview text is truncated`,
			);
			for (const reply of session.threadReplies ?? []) {
				assert.doesNotMatch(
					reply.content,
					/(?:…|\.\.\.)\s*$/u,
					`${chapter}/${session.agentName} thread reply is truncated`,
				);
			}
		}
	}
});
