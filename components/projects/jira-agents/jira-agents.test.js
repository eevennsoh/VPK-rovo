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

test("Jira Agents composes the eight-stage software delivery story without changing the gallery", () => {
	const pageSource = readProjectFile("components/projects/jira-agents/page.tsx");
	const controlsSource = readProjectFile("components/projects/jira-agents/story-controls.tsx");
	const controllerSource = readProjectFile("components/projects/jira-agents/use-hotfix-story.ts");
	const itemsSource = readProjectFile("components/projects/jira-agents/data/gallery-items.ts");
	const gallerySource = readProjectFile("components/blocks/gallery/components/gallery.tsx");

	assert.match(pageSource, /<JiraAgentsStoryControls controller=\{storyController\} \/>/u);
	assert.match(pageSource, /<ExperimentalV2JiraWorkItem[\s\S]*automationRules=\{JIRA_AGENTS_AUTOMATION_RULES\}[\s\S]*composerAgents=\{JIRA_AGENTS_STORY_COMPOSER_AGENTS\}[\s\S]*composerDelivery="broadcast-active-agents"[\s\S]*initialState=\{controller\.initialState\}[\s\S]*statusPhases=\{JIRA_AGENTS_STATUS_PHASES\}[\s\S]*workItem=\{controller\.workItem\}/u);
	assert.match(pageSource, /onAgentPromptSubmit=\{handleAgentPromptSubmit\}/u);
	assert.match(pageSource, /initialStateRevision=\{controller\.launchId\}/u);
	assert.match(pageSource, /stageKey=\{`\$\{chapter\}:\$\{chapterRevision\}`\}/u);
	assert.doesNotMatch(pageSource, /key=\{controller\.launchId\}/u);
	assert.match(
		pageSource,
		/useEffect\(\(\) => \{[\s\S]*closeChat\(\);[\s\S]*resetChat\(\);[\s\S]*\}, \[chapter, chapterRevision, closeChat, resetChat\]\);/u,
	);
	assert.doesNotMatch(pageSource, /\[chapter, chatSurface,/u);
	assert.match(pageSource, /selectAgent\(agentId\.startsWith\("skill:"\) \? ROVO_AGENT_ID : agentId, \{ preserveCurrentThread: true \}\);[\s\S]*openChat\("floating"\);/u);
	assert.match(pageSource, /onSessionReply=\{handleSessionReply\}/u);
	assert.match(pageSource, /inlineSurface="card-fill"/u);
	assert.match(controlsSource, /JIRA_AGENTS_STORY_CHAPTERS\.map/u);
	assert.match(controlsSource, /aria-label="Open a software delivery story chapter"/u);
	assert.match(controllerSource, /setLaunchId\(\(current\) => current \+ 1\);/u);
	assert.match(controllerSource, /getJiraAgentsStoryChapterForStatus\(storyColumn\)/u);
	const approvePullRequestSource = controllerSource.match(
		/const approvePullRequest = useCallback\([\s\S]*?\}, \[chapter, pullRequestApprovalStates\]\);/u,
	)?.[0] ?? "";
	assert.ok(approvePullRequestSource.length > 0);
	assert.match(
		approvePullRequestSource,
		/setPullRequestApprovalStates\(\(current\) => \(\{ \.\.\.current, \[identity\]: "approved" \}\)\)/u,
	);
	assert.match(approvePullRequestSource, /setLaunchId\(\(current\) => current \+ 1\)/u);
	assert.doesNotMatch(approvePullRequestSource, /setChapterRevision/u);
	assert.match(
		controllerSource,
		/if \(nextChapter === chapter\) \{[\s\S]*setChapterRevision\(\(current\) => current \+ 1\);[\s\S]*\}/u,
	);
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

	assert.equal(story.shouldStartJiraAgentsPlan("intake", completeTeam), false);
	assert.equal(story.shouldStartJiraAgentsPlan("intake", completeTeam, true), true);
	assert.equal(story.shouldStartJiraAgentsPlan("intake", completeTeam.slice(0, 1)), false);
	assert.equal(story.shouldStartJiraAgentsPlan("plan", completeTeam, true), false);
	assert.match(pageSource, /shouldStartJiraAgentsPlan\(chapter, agentIds, descriptionImproved\)[\s\S]*startOrchestration\(\)/u);
	assert.doesNotMatch(pageSource, /shouldStartJiraAgentsPlan\(chapter, agentIds, descriptionImproved\)[\s\S]*selectChapter\("plan"\)/u);
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

	assert.deepEqual(states.map((state) => state.sessions.length), steps.map(() => 3));
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

	assert.deepEqual(chapters, [
		"intake",
		"plan",
		"build",
		"handoff",
		"review",
		"fix",
		"approve",
		"release",
	]);
	assert.deepEqual(
		story.JIRA_AGENTS_STORY_COMPOSER_AGENTS.map((agent) => agent.name),
		["Claude Code", "Code Planner"],
	);
	assert.deepEqual(
		chapters.map((chapter) => story.getJiraAgentsStoryStatus(chapter)),
		["To do", "In progress", "In progress", "In progress", "In review", "In progress", "In review", "Done"],
	);
	assert.deepEqual(
		chapters.map((chapter) => story.createJiraAgentsStoryState(chapter).sessions.filter(
			(session) => session.status !== "completed",
		).length),
		[0, 2, 1, 1, 1, 1, 1, 0],
	);
	assert.deepEqual(
		chapters.map((chapter) => {
			const comment = story.createJiraAgentsStoryState(chapter).comments.find(
				(candidate) => candidate.id === "story-channel-orchestration",
			);
			return comment?.reactions?.[0]?.actorIds.length ?? 0;
		}),
		[0, 2, 0, 0, 0, 0, 0, 0],
	);
});

test("Intake starts useful but unplanned and Improve description waits for confirmation", async () => {
	const story = await loadStoryModule();
	const intake = story.createJiraAgentsStoryState("intake");
	const runningIntake = story.createJiraAgentsStoryState("intake", { descriptionSkillPhase: "running" });
	const waitingIntake = story.createJiraAgentsStoryState("intake", { descriptionSkillPhase: "awaiting-confirmation" });
	const improvedIntake = story.createJiraAgentsStoryState("intake", { descriptionSkillPhase: "applied" });
	const dismissedIntake = story.createJiraAgentsStoryState("intake", { descriptionSkillPhase: "dismissed" });
	const rawDescription = story.JIRA_AGENTS_STORY_WORK_ITEM_BASE.description;
	const description = improvedIntake.contextResources.description;
	const suggestedDescription = waitingIntake.sessions[0].messages.find(
		(message) => message.role === "agent" && message.content.includes("Suggested description"),
	)?.content ?? "";

	assert.match(rawDescription, /^Checkout-funnel research/u);
	assert.match(rawDescription, /#### User outcome/u);
	assert.match(rawDescription, /#### What we know/u);
	assert.match(rawDescription, /#### Initial acceptance criteria/u);
	assert.doesNotMatch(rawDescription, /#### Scope|#### Guest checkout flow|```mermaid/u);
	assert.match(description, /^Checkout-funnel research/u);
	assert.match(description, /#### User outcome/u);
	assert.match(description, /#### Scope/u);
	assert.match(description, /#### Guest checkout flow/u);
	assert.match(description, /```mermaid[\s\S]*flowchart TD[\s\S]*Continue as guest\?[\s\S]*```/u);
	assert.match(description, /```\n\n#### Acceptance criteria/u);
	assert.match(description, /#### Acceptance criteria/u);
	assert.doesNotMatch(description, /\*\*Continue as guest\*\*/u);
	assert.match(description, /Declined payments and recoverable validation errors do not clear safe customer input/u);
	assert.doesNotMatch(description, /## Engineering guardrails|## Out of scope/u);
	assert.equal(intake.sessions.length, 0);
	assert.equal(runningIntake.contextResources.description, rawDescription);
	assert.equal(waitingIntake.contextResources.description, rawDescription);
	assert.equal(dismissedIntake.contextResources.description, rawDescription);
	assert.match(suggestedDescription, /\*\*Suggested description\*\*/u);
	assert.match(suggestedDescription, /```mermaid[\s\S]*flowchart TD[\s\S]*```\n\n#### Acceptance criteria/u);
	assert.match(suggestedDescription, /#### Acceptance criteria/u);
	assert.doesNotMatch(suggestedDescription, /#### Proposed guest flow|Mermaid Error/u);
	assert.deepEqual(
		[runningIntake, waitingIntake, improvedIntake, dismissedIntake].map((state) => ({
			activeSessionId: state.activeSessionId,
			status: state.sessions[0]?.status,
			waitingOn: state.sessions[0]?.waitingOn?.kind ?? null,
		})),
		[
			{ activeSessionId: story.JIRA_AGENTS_DESCRIPTION_SKILL_SESSION_ID, status: "running", waitingOn: null },
			{ activeSessionId: story.JIRA_AGENTS_DESCRIPTION_SKILL_SESSION_ID, status: "waiting", waitingOn: "user" },
			{ activeSessionId: story.JIRA_AGENTS_DESCRIPTION_SKILL_SESSION_ID, status: "completed", waitingOn: null },
			{ activeSessionId: story.JIRA_AGENTS_DESCRIPTION_SKILL_SESSION_ID, status: "completed", waitingOn: null },
		],
	);
	assert.deepEqual(
		improvedIntake.sessions.map(({ agentId, status, title }) => ({ agentId, status, title })),
		[{ agentId: "skill:improve-description", status: "completed", title: "Improve description" }],
	);
	assert.equal(intake.metadata.status, "To do");
	assert.equal(intake.metadata.atlassianProject, "storefront-platform");
	assert.equal(intake.metadata.parent, "SHOP-4800");
	assert.deepEqual(story.createJiraAgentsStoryWorkItem("intake").parent, {
		code: "SHOP-4800",
		title: "Reduce storefront checkout abandonment",
	});
	assert.deepEqual(intake.comments[0].threadReplies, [{
		id: "story-channel-intake-maya-reply",
		authorName: "Maya Chen",
		authorAvatarSrc: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
		content: "Agreed. If the email already belongs to an account, let the shopper finish as a guest and offer sign-in or account linking only after the order is confirmed. That keeps this release focused and avoids pulling account recovery into checkout.",
		createdAtMs: Date.UTC(2026, 7, 5, 1, 56),
	}]);
	assert.deepEqual(intake.contextResources.subtasks, []);
	assert.deepEqual(intake.contextResources.linkedItems, []);
});

test("applying Improve description adds the linked work items, subtasks, and matching description references", async () => {
	const story = await loadStoryModule();
	const intake = story.createJiraAgentsStoryState("intake");
	const waitingIntake = story.createJiraAgentsStoryState("intake", { descriptionSkillPhase: "awaiting-confirmation" });
	const improvedIntake = story.createJiraAgentsStoryState("intake", { descriptionSkillPhase: "applied" });
	const dismissedIntake = story.createJiraAgentsStoryState("intake", { descriptionSkillPhase: "dismissed" });
	const description = improvedIntake.contextResources.description;
	const suggestedDescription = waitingIntake.sessions[0].messages.find(
		(message) => message.role === "agent" && message.content.includes("Suggested description"),
	)?.content ?? "";

	// The work item stays unbroken out until the suggestion is confirmed.
	assert.deepEqual(intake.contextResources.subtasks, []);
	assert.deepEqual(intake.contextResources.linkedItems, []);
	assert.deepEqual(waitingIntake.contextResources.subtasks, []);
	assert.deepEqual(waitingIntake.contextResources.linkedItems, []);
	assert.deepEqual(dismissedIntake.contextResources.subtasks, []);
	assert.deepEqual(dismissedIntake.contextResources.linkedItems, []);

	// Confirming it lands the delivery breakdown in the metadata rail.
	assert.deepEqual(
		improvedIntake.contextResources.subtasks.map((subtask) => subtask.key),
		["SHOP-4824", "SHOP-4822", "SHOP-4823"],
	);
	assert.deepEqual(
		improvedIntake.contextResources.linkedItems.map((linkedItem) => linkedItem.key),
		["SHOP-4760"],
	);

	// Every issue the description links must exist in the rail, and every rail
	// row must be reachable from the description — otherwise the narrative and
	// the details panel drift apart.
	const railItems = [
		...improvedIntake.contextResources.subtasks,
		...improvedIntake.contextResources.linkedItems,
	];
	const linkedKeys = [...description.matchAll(/^- \[(SHOP-\d+) (.+?)\]\(#shop-\d+\) — /gmu)];
	assert.deepEqual(linkedKeys.map((match) => match[1]).sort(), railItems.map((item) => item.key).sort());
	for (const [, key, summary] of linkedKeys) {
		const railItem = railItems.find((item) => item.key === key);
		assert.ok(railItem, `${key} is linked from the description but missing from the rail`);
		assert.equal(summary, railItem.summary);
		assert.match(
			description,
			new RegExp(`^- \\[${key} ${summary.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}\\]\\(#${key.toLowerCase()}\\) — `, "mu"),
		);
	}
	// Text-link references use in-page hash hrefs — never a full browse URL.
	assert.doesNotMatch(description, /\]\(https:\/\//u);
	assert.doesNotMatch(description, /storefront-platform\.atlassian\.net/u);

	assert.match(description, /#### Delivery breakdown/u);
	assert.match(description, /#### Related work/u);
	// The chat's suggested output previews the same reference lines before confirm.
	assert.match(suggestedDescription, /#### Delivery breakdown/u);
	assert.match(
		suggestedDescription,
		/^- \[SHOP-4822 Build guest checkout and order-creation API\]\(#shop-4822\) — /mu,
	);
	assert.doesNotMatch(suggestedDescription, /\]\(https:\/\//u);
	// The un-improved description must not promise work the rail cannot show.
	assert.doesNotMatch(story.JIRA_AGENTS_STORY_WORK_ITEM_BASE.description, /#### Delivery breakdown|SHOP-4822/u);
});

test("Improve description confirmation keeps the answered card in the visible transcript", () => {
	const pageSource = readProjectFile("components/projects/jira-agents/page.tsx");
	// The selected option must render as the shared clarification answer card
	// above Rovo's reply, so the confirmation user message stays visible.
	assert.doesNotMatch(pageSource, /visibility: "hidden"/u);
	assert.match(pageSource, /Done — I added the approved description to SHOP-4821/u);
	assert.match(pageSource, /Understood — I kept the current work item description unchanged/u);
});

test("Jira Agents addresses authored story activity as Venn", async () => {
	const story = await loadStoryModule();
	const plan = story.createJiraAgentsStoryState("plan");
	const orchestrationComment = plan.comments.find(
		(comment) => comment.id === "story-channel-orchestration",
	);

	assert.equal(orchestrationComment.authorName, "Venn");
	assert.equal(
		plan.sessions.find((session) => session.agentId === "claude-code").messages[0].authorName,
		"Venn",
	);
});

test("child work-item statuses follow the delivery chapters", async () => {
	const story = await loadStoryModule();
	const chapters = story.JIRA_AGENTS_STORY_CHAPTERS.map((chapter) => chapter.value);

	assert.deepEqual(
		chapters.map((chapter) => story.createJiraAgentsStoryState(chapter).contextResources.subtasks.map((item) => item.status)),
		[
			[],
			["done", "todo", "todo"],
			["done", "inprogress", "inprogress"],
			["done", "done", "done"],
			["done", "done", "done"],
			["done", "done", "done"],
			["done", "done", "done"],
			["done", "done", "done"],
		],
	);
});

test("Claude leads one evolving A2A thread with checklist and design evidence", async () => {
	const story = await loadStoryModule();
	const plan = story.createJiraAgentsStoryState("plan");
	const build = story.createJiraAgentsStoryState("build");
	const handoff = story.createJiraAgentsStoryState("handoff");
	const review = story.createJiraAgentsStoryState("review");
	const fix = story.createJiraAgentsStoryState("fix");
	const approve = story.createJiraAgentsStoryState("approve");
	const release = story.createJiraAgentsStoryState("release");
	const planClaude = plan.sessions.find((session) => session.agentId === "claude-code");
	const planPlanner = plan.sessions.find((session) => session.agentId === "code-planner");
	const buildClaude = build.sessions.find((session) => session.agentId === "claude-code");
	const buildPlanner = build.sessions.find((session) => session.agentId === "code-planner");
	const handoffClaude = handoff.sessions.find((session) => session.agentId === "claude-code");
	const reviewClaude = review.sessions.find((session) => session.agentId === "claude-code");
	const fixClaude = fix.sessions.find((session) => session.agentId === "claude-code");
	const approveClaude = approve.sessions.find((session) => session.agentId === "claude-code");
	const releaseClaude = release.sessions.find((session) => session.agentId === "claude-code");

	assert.equal(planClaude.agentId, "claude-code");
	assert.equal(planClaude.status, "running");
	assert.equal(planPlanner.status, "running");
	assert.equal(planPlanner.messages[0].authorName, "Claude Code");
	assert.match(planClaude.previewText, /Code Planner, review this work item/u);
	assert.equal(planClaude.progressChecklist.filter((item) => item.completed).length, 0);
	assert.equal(buildClaude.status, "running");
	assert.equal(buildPlanner.status, "completed");
	assert.match(buildPlanner.previewText, /Consultation complete/u);
	assert.equal(buildClaude.progressChecklist.filter((item) => item.completed).length, 1);
	assert.equal(build.comments.find(
		(comment) => comment.id === "story-channel-orchestration",
	).reactions, undefined);
	assert.equal(handoffClaude.status, "running");
	assert.equal(handoffClaude.progressChecklist.filter((item) => item.completed).length, 3);
	assert.deepEqual(handoffClaude.imageAttachment, {
		src: "/illustration/jira-agents/guest-checkout-final.png",
		alt: "Final guest checkout design",
		filename: "guest-checkout-final.png",
	});
	assert.equal(reviewClaude.status, "waiting");
	assert.deepEqual(reviewClaude.waitingOn, {
		kind: "agent",
		agentId: "github-actions",
		agentName: "GitHub Actions",
	});
	assert.equal(reviewClaude.progressChecklist.filter((item) => item.completed).length, 4);
	assert.equal(fixClaude.status, "running");
	assert.equal(fixClaude.progressChecklist.filter((item) => item.completed).length, 5);
	assert.match(fixClaude.previewText, /nullable delivery-address[\s\S]*rerunning the failed lint and typecheck check[\s\S]*unit and browser coverage remain passed/u);
	const fixingPr = fix.staticEvents.find((event) => event.id === "story-pr-fix-rerun");
	assert.equal(fixingPr.pullRequest.mergeState, "blocked");
	assert.equal(fixingPr.pullRequest.checks.filter((check) => check.status === "running").length, 1);
	assert.equal(fixingPr.pullRequest.checks.filter((check) => check.status === "passed").length, 2);
	assert.equal(approveClaude.status, "waiting");
	assert.deepEqual(approveClaude.waitingOn, { kind: "user" });
	assert.equal(approveClaude.progressChecklist.filter((item) => item.completed).length, 6);
	const openedPr = approve.staticEvents.find((event) => event.id === "story-pr-approve");
	const mergedPr = release.staticEvents.find((event) => event.id === "story-pr-merged");
	assert.ok(openedPr?.pullRequest);
	assert.ok(mergedPr?.pullRequest);
	assert.equal(openedPr.pullRequest.authorName, "Claude Code");
	assert.equal(mergedPr.pullRequest.authorName, "Claude Code");
	assert.equal(openedPr.pullRequest.reviewDecision, "review-required");
	assert.ok(openedPr.pullRequest.checks.every((check) => check.status === "passed"));
	assert.equal(openedPr.pullRequest.branch, "feature/shop-4821-guest-checkout");
	assert.equal(openedPr.pullRequest.targetBranch, "main");
	assert.equal(mergedPr.pullRequest.targetBranch, "main");
	assert.equal(typeof openedPr.pullRequest.createdAtMs, "number");
	assert.equal(typeof openedPr.pullRequest.updatedAtMs, "number");
	assert.equal(mergedPr.pullRequest.createdAtMs, openedPr.pullRequest.createdAtMs);
	assert.ok(mergedPr.pullRequest.updatedAtMs > mergedPr.pullRequest.createdAtMs);
	assert.equal(releaseClaude.progressChecklist.filter((item) => item.completed).length, 8);
	assert.match(releaseClaude.previewText, /approved by Venn and merged[\s\S]*feature flag[\s\S]*production smoke checks[\s\S]*healthy telemetry[\s\S]*rollout/u);
	assert.ok(release.sessions.every((session) => session.status === "completed"));
});

test("Review moves deterministically from queued to running to failed and Fix preserves repair evidence", async () => {
	const story = await loadStoryModule();
	const reviewSteps = ["queued", "running", "failed"];
	const reviewStates = reviewSteps.map((reviewStep) => (
		story.createJiraAgentsStoryState("review", { reviewStep })
	));
	const reviewPullRequests = reviewStates.map((state) => (
		state.staticEvents.find(
			(event) => event.id === "story-pr-review",
		)?.pullRequest
	));

	assert.deepEqual(
		reviewPullRequests.map((pullRequest) => pullRequest.checks.map((check) => check.status)),
		[
			["queued", "queued", "queued"],
			["running", "queued", "queued"],
			["failed", "passed", "passed"],
		],
	);
	assert.ok(reviewPullRequests.every((pullRequest) => pullRequest.mergeState === "blocked"));
	assert.ok(reviewPullRequests.every((pullRequest) => pullRequest.reviewDecision === "review-required"));
	assert.deepEqual(
		reviewStates.map((state) => {
			const claude = state.sessions.find((session) => session.agentId === "claude-code");
			return { status: claude.status, waitingOn: claude.waitingOn ?? null };
		}),
		[
			{
				status: "waiting",
				waitingOn: { kind: "agent", agentId: "github-actions", agentName: "GitHub Actions" },
			},
			{
				status: "waiting",
				waitingOn: { kind: "agent", agentId: "github-actions", agentName: "GitHub Actions" },
			},
			{ status: "completed", waitingOn: null },
		],
	);
	const failedReview = story.createJiraAgentsStoryState("review", { reviewStep: "failed" });
	assert.ok(failedReview.staticEvents.some((event) => event.id === "story-ci-failed"));

	const fix = story.createJiraAgentsStoryState("fix");
	const repair = fix.staticEvents.find((event) => event.id === "story-ci-repair");
	const rerun = fix.staticEvents.find((event) => event.id === "story-pr-fix-rerun")?.pullRequest;
	assert.equal(repair.summary, "Repairing the failed CI path");
	assert.match(repair.description, /nullable delivery address[\s\S]*rerunning/u);
	assert.deepEqual(rerun.checks.map((check) => check.status), ["running", "passed", "passed"]);
});

test("Approve requires Venn after green checks and Release records merge, rollout, smoke, and telemetry", async () => {
	const story = await loadStoryModule();
	const available = story.createJiraAgentsStoryState("approve");
	const approved = story.createJiraAgentsStoryState("approve", { pullRequestApproved: true });
	const availablePullRequest = available.staticEvents.find(
		(event) => event.id === "story-pr-approve",
	)?.pullRequest;
	const approvedPullRequest = approved.staticEvents.find(
		(event) => event.id === "story-pr-approve",
	)?.pullRequest;
	const approvedClaude = approved.sessions.find((session) => session.agentId === "claude-code");
	const completedRepair = approved.staticEvents.find((event) => event.id === "story-ci-repair");

	assert.ok(availablePullRequest.checks.every((check) => check.status === "passed"));
	assert.equal(availablePullRequest.reviewDecision, "review-required");
	assert.equal(availablePullRequest.mergeState, "blocked");
	assert.equal(availablePullRequest.authorName, "Claude Code");
	assert.equal(story.JIRA_AGENTS_PULL_REQUEST_IDENTITY, availablePullRequest.url);
	assert.equal(approvedPullRequest.reviewDecision, "approved");
	assert.equal(approvedPullRequest.mergeState, "ready");
	assert.equal(approvedClaude.status, "completed");
	assert.equal(approvedClaude.waitingOn, undefined);
	assert.match(approvedClaude.previewText, /Venn approved PR #1847[\s\S]*ready to merge and release/u);
	assert.match(
		completedRepair.description,
		/reran the failed lint and typecheck check to green[\s\S]*preserving the existing green unit and browser results/u,
	);
	assert.doesNotMatch(completedRepair.description, /reran lint, typecheck, unit, and browser/u);
	assert.ok(approvedClaude.progressChecklist.some(
		(item) => item.label === "Repair the failed path and rerun its failed check to green" && item.completed,
	));
	assert.deepEqual(
		available.staticEvents
			.filter((event) => ["story-ci-repair", "story-pr-fix-rerun", "story-pr-approve"].includes(event.id))
			.map((event) => event.id),
		["story-ci-repair", "story-pr-fix-rerun", "story-pr-approve"],
	);
	assert.ok(approved.staticEvents.some((event) => event.id === "story-venn-approved"));

	const release = story.createJiraAgentsStoryState("release");
	assert.deepEqual(
		release.staticEvents.filter((event) => event.id.startsWith("story-release-")).map((event) => event.id),
		[
			"story-release-feature-flag",
			"story-release-smoke-telemetry",
			"story-release-rollout-complete",
		],
	);
	const mergedPullRequest = release.staticEvents.find(
		(event) => event.id === "story-pr-merged",
	)?.pullRequest;
	assert.ok(mergedPullRequest);
	assert.deepEqual(mergedPullRequest.checks, approvedPullRequest.checks);
	assert.ok(mergedPullRequest.checks.every((check) => check.status === "passed"));
	assert.equal(release.metadata.status, "Done");
});

test("the authored artifact and pull-request chronology is complete and renderable", async () => {
	const story = await loadStoryModule();
	const release = story.createJiraAgentsStoryState("release");
	const artifactEvents = release.staticEvents.filter((event) => event.kind === "changed-files");

	assert.deepEqual(
		release.staticEvents
			.filter((event) => [
				"story-changed-files",
				"story-ci-repair",
				"story-pr-fix-rerun",
				"story-regression-matrix",
				"story-pr-approve",
				"story-pr-merged",
			].includes(event.id))
			.map((event) => event.id),
		[
			"story-changed-files",
			"story-ci-repair",
			"story-pr-fix-rerun",
			"story-regression-matrix",
			"story-pr-approve",
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
	const build = story.createJiraAgentsStoryState("build");
	const handoff = story.createJiraAgentsStoryState("handoff");
	const prompt = build.comments.find((comment) => comment.id === "story-channel-orchestration");
	const leadClaim = build.staticEvents.find((event) => event.id === "story-lead-delegated");
	const implementation = handoff.staticEvents.find((event) => event.id === "story-changed-files");
	const claude = build.sessions.find((session) => session.agentId === "claude-code");
	const codePlanner = build.sessions.find((session) => session.agentId === "code-planner");

	assert.ok(prompt.createdAtMs < leadClaim.createdAtMs);
	assert.ok(leadClaim.createdAtMs < claude.startedAtMs);
	assert.ok(claude.startedAtMs < codePlanner.startedAtMs);
	assert.ok(codePlanner.startedAtMs < implementation.createdAtMs);

	const broadcast = stateModel.jiraWorkItemReducer(build, {
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

	assert.equal(story.getJiraAgentsStoryChapterForStatus("To do"), "intake");
	assert.equal(story.getJiraAgentsStoryChapterForStatus("In progress"), "build");
	assert.equal(story.getJiraAgentsStoryChapterForStatus("Review"), "review");
	assert.equal(story.getJiraAgentsStoryChapterForStatus("In review"), "review");
	assert.equal(story.getJiraAgentsStoryChapterForStatus("Done"), "release");

	const build = story.createJiraAgentsBoardColumns("build");
	const unrelatedCard = build.find((column) => column.cards.some((card) => card.code !== "SHOP-4821")).cards.find(
		(card) => card.code !== "SHOP-4821",
	);
	const withLocalEdit = build.map((column) => ({
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
	const chapters = ["intake", "plan", "build", "handoff", "review", "fix", "approve", "release"];

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
