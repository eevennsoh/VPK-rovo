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

test("Jira Agents composes the seven-stage software delivery story without changing the gallery", () => {
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
	assert.match(
		controllerSource,
		/if \(!active \|\| orchestrationStep === "idle" \|\| orchestrationStep === "complete"\) \{\s*return undefined;\s*\}/u,
	);
	assert.doesNotMatch(
		controllerSource,
		/if \(orchestrationStep === "complete"\) \{\s*selectChapter\("build"\);/u,
	);
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
		"complete",
	];
	const states = steps.map((step) => orchestration.createJiraAgentsOrchestrationState(step));
	const complete = states.at(-1);
	const completePlanner = complete.sessions.find((session) => session.agentId === "code-planner");
	const completeClaude = complete.sessions.find((session) => session.agentId === "claude-code");

	assert.deepEqual(states.map((state) => state.sessions.length), steps.map(() => 3));
	assert.deepEqual(states.map((state) => state.sessions.filter(
		(session) => session.status !== "completed",
	).length), [2, 2, 2, 2, 2, 1, 1]);
	assert.deepEqual(states.map((state) => {
		const comment = state.comments.find((candidate) => candidate.id === "story-channel-orchestration");
		return comment?.reactions?.[0]?.actorIds.length ?? (comment ? 0 : -1);
	}), [-1, 0, 1, 2, 0, 0, 0]);
	assert.deepEqual(states.map((state) => state.staticEvents.some(
		(event) => event.id === "story-lead-delegated",
	)), [false, false, false, false, true, true, true]);
	// Terminal Plan complete keeps the consult-ready plan snapshot (not Build).
	assert.equal(completePlanner.status, "completed");
	assert.equal(completeClaude.status, "running");
	assert.match(completeClaude.previewText, /confirming the plan handoff before implementation begins in Build/u);
	assert.equal(
		complete.staticEvents.some((event) => event.id === "story-changed-files"),
		false,
	);
	// Once Code Planner's consultation reply is visible, Consult is checked.
	const consult = states[steps.indexOf("consult")];
	const lead = states[steps.indexOf("lead")];
	const leadClaude = lead.sessions.find((session) => session.agentId === "claude-code");
	const consultClaude = consult.sessions.find((session) => session.agentId === "claude-code");
	assert.equal(leadClaude.progressChecklist.filter((item) => item.completed).length, 0);
	assert.equal(consultClaude.progressChecklist.filter((item) => item.completed).length, 1);
	assert.equal(completeClaude.progressChecklist.filter((item) => item.completed).length, 1);
	assert.equal(
		completeClaude.progressChecklist[0]?.label,
		"Consult Code Planner on the secure API and validation contract",
	);
	assert.equal(completeClaude.progressChecklist[0]?.completed, true);
	assert.equal(completeClaude.outputs, undefined);
	assert.equal(completeClaude.imageAttachment, undefined);
});

test("Plan chapter selection starts the staged orchestration and reveals Activity", () => {
	const pageSource = readProjectFile("components/projects/jira-agents/page.tsx");
	const controllerSource = readProjectFile("components/projects/jira-agents/use-hotfix-story.ts");

	assert.match(
		controllerSource,
		/setOrchestrationStep\(nextChapter === "plan" \? "agents-working" : "idle"\)/u,
	);
	assert.match(
		controllerSource,
		/setBuildStep\(nextChapter === "build" \? "ready" : "complete"\)/u,
	);
	assert.match(
		controllerSource,
		/const BUILD_SEQUENCE = \{[\s\S]*ready: \{ next: "implementing", delayMs: 2_500 \}[\s\S]*implementing: \{ next: "verifying", delayMs: 2_200 \}[\s\S]*verifying: \{ next: "complete", delayMs: 2_400 \}/u,
	);
	assert.match(
		controllerSource,
		/if \(!active \|\| chapter !== "build" \|\| buildStep === "complete"\) return undefined;/u,
	);
	assert.match(
		controllerSource,
		/"agents-working": \{ next: "comment"/u,
	);
	assert.match(
		controllerSource,
		/"reaction-2": \{ next: "lead", delayMs: 3_500 \}/u,
	);
	assert.match(
		controllerSource,
		/lead: \{ next: "consult"/u,
	);
	assert.match(
		pageSource,
		/revealActivityKey=\{\s*controller\.orchestrationStep !== "idle"\s*\?\s*`\$\{controller\.orchestrationStep\}:\$\{controller\.launchId\}`\s*:\s*controller\.chapter === "build" && controller\.buildStep !== "complete"\s*\?\s*`\$\{controller\.buildStep\}:\$\{controller\.launchId\}`\s*:\s*null\s*\}/u,
	);
	assert.match(pageSource, /composerDelivery="broadcast-active-agents"/u);
});

test("Build chapter selection stages ready→implement→verify and reveals Claude Activity", () => {
	const pageSource = readProjectFile("components/projects/jira-agents/page.tsx");
	const controllerSource = readProjectFile("components/projects/jira-agents/use-hotfix-story.ts");
	const metadataRailContextSource = readProjectFile(
		"components/blocks/jira-work-item/experimental-v2/context-metadata-rail.tsx",
	);

	// Selecting Build starts from Plan-end hold, then stages implement → verify.
	assert.match(
		controllerSource,
		/setBuildStep\(nextChapter === "build" \? "ready" : "complete"\)/u,
	);
	assert.match(
		controllerSource,
		/ready: \{ next: "implementing", delayMs: 2_500 \}/u,
	);
	assert.match(
		controllerSource,
		/if \(!active \|\| chapter !== "build" \|\| buildStep === "complete"\) return undefined;/u,
	);
	// Activity opens for each build step via revealActivityKey (mirrors Plan
	// orchestration) — unless a PR is selected, which suppresses the panel switch.
	assert.match(
		pageSource,
		/controller\.chapter === "build" && controller\.buildStep !== "complete"\s*\?\s*`\$\{controller\.buildStep\}:\$\{controller\.launchId\}`/u,
	);
	assert.match(
		metadataRailContextSource,
		/if \(suppressActivityPanelRevealRef\.current\) return;/u,
	);
	// Build orients on Claude at ready, then reveals the PR-creation snapshot once
	// Open #1847 exists (implementing / verifying).
	assert.match(
		pageSource,
		/revealActivityEntryId=\{\s*controller\.chapter === "build" && controller\.buildStep !== "complete"\s*\?\s*controller\.buildStep === "ready"[\s\S]*?`activity-\$\{JIRA_AGENTS_LEAD_SESSION_ID\}`[\s\S]*?:\s*"story-pr-review"\s*:\s*null\s*\}/u,
	);
	// Build forces the Claude Code lead-thread View (parent + nested Code Planner).
	assert.match(
		pageSource,
		/if \(controller\.chapter === "build"\) \{\s*return \[JIRA_AGENTS_LEAD_SESSION_ID, \.\.\.JIRA_AGENTS_CHILD_SESSION_IDS\];\s*\}/u,
	);
	// Build collapses the Code Planner reply by default; Plan keeps it expanded.
	assert.match(
		pageSource,
		/\.\.\.\(chapter === "build" \? \{ defaultRepliesExpanded: false \} : \{\}\)/u,
	);
	// Plan reveal remains the primary key while orchestration is active.
	assert.match(
		pageSource,
		/controller\.orchestrationStep !== "idle"\s*\?\s*`\$\{controller\.orchestrationStep\}:\$\{controller\.launchId\}`/u,
	);
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
		/<MetadataRail[\s\S]*activity=\{\([\s\S]*<ActivityPanel[\s\S]*activitySessionThread=\{activitySessionThread\}[\s\S]*onOpenPullRequest=\{handlePullRequestSelect\}[\s\S]*railChromeEnabled=\{selectedPullRequestEntry === null\}[\s\S]*automationRules=\{automationRules\}[\s\S]*borderless[\s\S]*selectedPullRequestEntry=\{selectedPullRequestEntry\}[\s\S]*\/>/u,
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
		["To do", "In progress", "In progress", "In review", "In progress", "In review", "Done"],
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
		[0, 0, 0, 0, 0, 0, 0],
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
			["done", "done", "done"],
			["done", "done", "done"],
			["done", "done", "done"],
			["done", "done", "done"],
			["done", "done", "done"],
		],
	);
	assert.deepEqual(
		story.createJiraAgentsStoryState("build", { buildStep: "ready" })
			.contextResources.subtasks.map((item) => item.status),
		["done", "todo", "todo"],
	);
	assert.deepEqual(
		story.createJiraAgentsStoryState("build", { buildStep: "implementing" })
			.contextResources.subtasks.map((item) => item.status),
		["done", "inprogress", "inprogress"],
	);
});

test("Claude leads one evolving A2A thread with checklist and design evidence", async () => {
	const story = await loadStoryModule();
	const plan = story.createJiraAgentsStoryState("plan");
	const buildReady = story.createJiraAgentsStoryState("build", { buildStep: "ready" });
	const buildImplementing = story.createJiraAgentsStoryState("build", { buildStep: "implementing" });
	const buildVerifying = story.createJiraAgentsStoryState("build", { buildStep: "verifying" });
	const build = story.createJiraAgentsStoryState("build");
	const review = story.createJiraAgentsStoryState("review");
	const fix = story.createJiraAgentsStoryState("fix");
	const approve = story.createJiraAgentsStoryState("approve");
	const release = story.createJiraAgentsStoryState("release");
	const planClaude = plan.sessions.find((session) => session.agentId === "claude-code");
	const planPlanner = plan.sessions.find((session) => session.agentId === "code-planner");
	const buildReadyClaude = buildReady.sessions.find((session) => session.agentId === "claude-code");
	const buildImplementingClaude = buildImplementing.sessions.find((session) => session.agentId === "claude-code");
	const buildVerifyingClaude = buildVerifying.sessions.find((session) => session.agentId === "claude-code");
	const buildClaude = build.sessions.find((session) => session.agentId === "claude-code");
	const buildPlanner = build.sessions.find((session) => session.agentId === "code-planner");
	const reviewClaude = review.sessions.find((session) => session.agentId === "claude-code");
	const fixClaude = fix.sessions.find((session) => session.agentId === "claude-code");
	const approveClaude = approve.sessions.find((session) => session.agentId === "claude-code");
	const releaseClaude = release.sessions.find((session) => session.agentId === "claude-code");

	assert.equal(planClaude.agentId, "claude-code");
	assert.equal(planClaude.status, "running");
	assert.equal(planPlanner.status, "running");
	assert.equal(planPlanner.messages[0].authorName, "Claude Code");
	assert.match(planClaude.previewText, /Code Planner, review this work item/u);
	// Early Plan snapshot: Consult still open (orchestration consult/complete checks it).
	assert.equal(planClaude.progressChecklist.filter((item) => item.completed).length, 0);
	assert.equal(planClaude.outputs, undefined);
	assert.equal(planClaude.imageAttachment, undefined);
	assert.equal(
		plan.staticEvents.some((event) => event.id === "story-pr-review"),
		false,
	);
	// Build starts at Plan end (Consult ✓, no artifacts), then Implement ✓ + PR, then Verify ✓ + screenshot.
	assert.equal(buildReadyClaude.status, "running");
	assert.equal(buildReadyClaude.progressChecklist.filter((item) => item.completed).length, 1);
	assert.equal(buildReadyClaude.progressChecklist[0]?.completed, true);
	assert.equal(buildReadyClaude.progressChecklist[1]?.completed, false);
	assert.equal(buildReadyClaude.outputs, undefined);
	assert.equal(buildReadyClaude.imageAttachment, undefined);
	assert.equal(
		buildReady.staticEvents.some((event) => event.id === "story-pr-review"),
		false,
	);
	assert.equal(buildImplementingClaude.status, "running");
	assert.equal(buildImplementingClaude.progressChecklist.filter((item) => item.completed).length, 2);
	assert.equal(buildImplementingClaude.progressChecklist[0]?.completed, true);
	assert.equal(buildImplementingClaude.progressChecklist[1]?.completed, true);
	assert.equal(buildImplementingClaude.progressChecklist[2]?.completed, false);
	assert.equal(buildImplementingClaude.imageAttachment, undefined);
	assert.equal(buildImplementingClaude.outputs?.[0]?.source, "Pull request");
	assert.equal(
		buildImplementing.staticEvents.some((event) => event.id === "story-changed-files"),
		false,
	);
	assert.equal(buildVerifyingClaude.status, "running");
	assert.equal(buildVerifyingClaude.progressChecklist.filter((item) => item.completed).length, 3);
	assert.equal(buildVerifyingClaude.outputs?.[0]?.source, "Pull request");
	assert.deepEqual(buildVerifyingClaude.imageAttachment, {
		src: "/illustration/jira-agents/guest-checkout-final.png",
		alt: "Final guest checkout design",
		filename: "guest-checkout-final.png",
	});
	assert.equal(
		buildVerifying.staticEvents.some((event) => event.id === "story-changed-files"),
		false,
	);
	assert.equal(buildClaude.status, "running");
	assert.equal(buildPlanner.status, "completed");
	assert.match(buildPlanner.previewText, /Consultation complete/u);
	assert.equal(buildClaude.progressChecklist.filter((item) => item.completed).length, 3);
	assert.equal(build.comments.find(
		(comment) => comment.id === "story-channel-orchestration",
	).reactions, undefined);
	assert.deepEqual(buildClaude.imageAttachment, {
		src: "/illustration/jira-agents/guest-checkout-final.png",
		alt: "Final guest checkout design",
		filename: "guest-checkout-final.png",
	});
	assert.equal(buildClaude.outputs?.[0]?.pullRequest?.number, 1847);
	// Build uses the live Claude session for implementation evidence — do not
	// also surface the redundant changed-files / agent-output handoff card.
	assert.equal(
		build.staticEvents.some((event) => event.id === "story-changed-files"),
		false,
	);
	// PR artifact stages also seed Review's PR-creation Activity snapshot
	// (Open #1847 +86/−21, first check started) plus title-meta / resource chrome.
	const reviewQueuedPr = review.staticEvents.find(
		(event) => event.id === "story-pr-review",
	)?.pullRequest;
	assert.ok(reviewQueuedPr);
	for (const [label, state] of [
		["implementing", buildImplementing],
		["verifying", buildVerifying],
		["complete", build],
	]) {
		const buildPrEvent = state.staticEvents.find((event) => event.id === "story-pr-review");
		const buildPr = buildPrEvent?.pullRequest;
		assert.ok(buildPr, `build ${label} should include story-pr-review`);
		assert.equal(buildPr.number, reviewQueuedPr.number);
		assert.equal(buildPr.status, reviewQueuedPr.status);
		assert.equal(buildPr.title, reviewQueuedPr.title);
		assert.equal(buildPr.additions, reviewQueuedPr.additions);
		assert.equal(buildPr.deletions, reviewQueuedPr.deletions);
		assert.deepEqual(
			buildPr.checks.map((check) => check.status),
			["running", "queued", "queued"],
			`build ${label} keeps the PR-creation checks, not failed CI`,
		);
		assert.equal(
			state.staticEvents.some((event) => event.id === "story-ci-failed"),
			false,
			`build ${label} must not include Review's CI-failure event`,
		);
		assert.equal(state.metadata.status, "In progress", `build ${label} stays In progress`);
		// Place the Open row after the live Claude card (Review's after-agent snapshot).
		const claude = state.sessions.find((session) => session.agentId === "claude-code");
		assert.ok(buildPrEvent.createdAtMs > claude.startedAtMs);
	}
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
	assert.equal(openedPr.pullRequest.authorName, "Venn");
	assert.equal(mergedPr.pullRequest.authorName, "Venn");
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

	// CI picks up the first job as the PR opens, then widens before it fails.
	assert.deepEqual(
		reviewPullRequests.map((pullRequest) => pullRequest.checks.map((check) => check.status)),
		[
			["running", "queued", "queued"],
			["running", "running", "queued"],
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
	assert.equal(availablePullRequest.authorName, "Venn");
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
	const plan = story.createJiraAgentsStoryState("plan");
	const build = story.createJiraAgentsStoryState("build");
	const release = story.createJiraAgentsStoryState("release");
	const intakeComment = build.comments.find((comment) => comment.id === "story-channel-intake");
	const descriptionApplied = build.staticEvents.find(
		(event) => event.id === "story-description-applied",
	);
	const movedInProgress = build.staticEvents.find(
		(event) => event.id === "story-moved-in-progress",
	);
	const prompt = build.comments.find((comment) => comment.id === "story-channel-orchestration");
	const leadClaim = build.staticEvents.find((event) => event.id === "story-lead-delegated");
	const planClaude = plan.sessions.find((session) => session.agentId === "claude-code");
	const planPlanner = plan.sessions.find((session) => session.agentId === "code-planner");
	const buildClaude = build.sessions.find((session) => session.agentId === "claude-code");
	const buildPlanner = build.sessions.find((session) => session.agentId === "code-planner");

	assert.ok(intakeComment.createdAtMs < descriptionApplied.createdAtMs);
	assert.ok(descriptionApplied.createdAtMs < movedInProgress.createdAtMs);
	assert.ok(movedInProgress.createdAtMs < prompt.createdAtMs);
	assert.ok(prompt.createdAtMs < leadClaim.createdAtMs);
	assert.equal(descriptionApplied.actor.name, "Venn");
	assert.equal(movedInProgress.actor.name, "Venn");
	assert.equal(intakeComment.authorName, "Venn");
	assert.equal(
		build.staticEvents.find((event) => event.id === "story-created")?.actor.name,
		"Venn",
	);
	assert.equal(
		build.staticEvents.find((event) => event.id === "story-impact-labelled")?.actor.name,
		"Venn",
	);
	assert.equal(story.JIRA_AGENTS_STORY_WORK_ITEM_BASE.assignee.name, "Venn");
	assert.equal(build.metadata.assignee?.name, "Venn");
	for (const eventId of [
		"story-moved-in-progress",
		"story-moved-review",
		"story-moved-fix",
		"story-moved-approve",
		"story-moved-release",
	]) {
		const statusMove = release.staticEvents.find((event) => event.id === eventId);
		assert.equal(statusMove?.actor.name, "Venn", `${eventId} should credit Venn`);
	}
	// Live plan sessions share a near-now clock and keep start order.
	assert.ok(leadClaim.createdAtMs < planClaude.startedAtMs);
	assert.ok(planClaude.startedAtMs < planPlanner.startedAtMs);
	assert.equal(planClaude.status, "running");
	assert.equal(planPlanner.status, "running");
	// In build, Claude stays live near now while the completed consult remains historical.
	// Open #1847 sits after Claude (no duplicate changed-files handoff card).
	assert.ok(leadClaim.createdAtMs < buildClaude.startedAtMs);
	assert.equal(buildClaude.status, "running");
	assert.equal(buildPlanner.status, "completed");
	assert.ok(buildPlanner.startedAtMs < buildClaude.startedAtMs);
	assert.equal(
		build.staticEvents.some((event) => event.id === "story-changed-files"),
		false,
	);
	const buildPullRequest = build.staticEvents.find((event) => event.id === "story-pr-review");
	assert.ok(buildClaude.startedAtMs < buildPullRequest.createdAtMs);
	const buildActivityIds = stateModel.selectActivityEvents(build).map((event) => event.id);
	const claudeActivityIndex = buildActivityIds.indexOf("activity-story-session-claude-code");
	const prActivityIndex = buildActivityIds.indexOf("story-pr-review");
	assert.ok(claudeActivityIndex >= 0, "Build should include the live Claude session card");
	assert.ok(prActivityIndex >= 0, "Build should include the Open #1847 snapshot");
	assert.ok(
		claudeActivityIndex < prActivityIndex,
		"Open #1847 must render underneath the Claude session card",
	);
	assert.equal(buildActivityIds.includes("story-changed-files"), false);

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

test("live agent activity headers resolve to immediate relative timestamps", async () => {
	const [story, stateModel] = await Promise.all([loadStoryModule(), loadStateModule()]);
	const approve = story.createJiraAgentsStoryState("approve");
	const release = story.createJiraAgentsStoryState("release");

	const liveAgentEvents = stateModel.selectActivityEvents(approve).filter((event) => (
		event.kind === "agent" && event.status !== "completed"
	));
	assert.ok(liveAgentEvents.length > 0);
	for (const event of liveAgentEvents) {
		assert.ok(
			event.elapsedSeconds < 60,
			`${event.agentName} should be under a minute old, got ${event.elapsedSeconds}s`,
		);
		const referenceTimeMs = event.createdAtMs + event.elapsedSeconds * 1000;
		assert.equal(
			stateModel.formatSessionTimestamp(event.createdAtMs, referenceTimeMs),
			"Just now",
		);
	}

	const completedEvents = stateModel.selectActivityEvents(release).filter((event) => (
		event.kind === "agent" && event.status === "completed"
	));
	assert.ok(completedEvents.length > 0);
	for (const event of completedEvents) {
		assert.ok(
			event.elapsedSeconds >= 40 * 60,
			`${event.agentName} should keep a historical completed age, got ${event.elapsedSeconds}s`,
		);
		const referenceTimeMs = event.createdAtMs + event.elapsedSeconds * 1000;
		assert.match(
			stateModel.formatSessionTimestamp(event.createdAtMs, referenceTimeMs),
			/^\d+m ago$/u,
		);
	}
});

test("Improve description stays private in Activity until the output is added", async () => {
	const [story, stateModel] = await Promise.all([loadStoryModule(), loadStateModule()]);
	const running = story.createJiraAgentsStoryState("intake", { descriptionSkillPhase: "running" });
	const waiting = story.createJiraAgentsStoryState("intake", {
		descriptionSkillPhase: "awaiting-confirmation",
	});
	const dismissed = story.createJiraAgentsStoryState("intake", { descriptionSkillPhase: "dismissed" });
	const applied = story.createJiraAgentsStoryState("intake", { descriptionSkillPhase: "applied" });
	const plan = story.createJiraAgentsStoryState("plan");

	for (const state of [running, waiting, dismissed, applied, plan]) {
		const skillSession = state.sessions.find(
			(session) => session.agentId === "skill:improve-description",
		);
		assert.ok(skillSession);
		assert.equal(skillSession.activityVisibility, "private");
		assert.equal(
			stateModel.selectActivityEvents(state).some(
				(event) => event.kind === "agent" && event.sessionId === skillSession.id,
			),
			false,
			"private skill session must not appear as a public Activity card",
		);
	}

	assert.equal(
		stateModel.selectActivityEvents(waiting).some(
			(event) => event.id === "story-description-applied",
		),
		false,
	);
	assert.equal(
		stateModel.selectActivityEvents(dismissed).some(
			(event) => event.id === "story-description-applied",
		),
		false,
	);

	const published = stateModel.selectActivityEvents(applied).find(
		(event) => event.id === "story-description-applied",
	);
	assert.equal(published?.kind, "event");
	assert.equal(published?.actor.name, "Venn");
	assert.equal(published?.actor.kind, "person");
	assert.equal(published?.icon, "description");
	assert.notEqual(published?.showActor, false);
	assert.deepEqual(published?.segments, [
		{ type: "text", text: "updated the description" },
	]);

	const planEvents = stateModel.selectActivityEvents(plan);
	const planIds = planEvents.map((event) => event.id);
	const descriptionIndex = planIds.indexOf("story-description-applied");
	const intakeCommentIndex = planIds.indexOf("story-channel-intake");
	const movedInProgressIndex = planIds.indexOf("story-moved-in-progress");
	const orchestrationIndex = planIds.indexOf("story-channel-orchestration");
	assert.ok(descriptionIndex > intakeCommentIndex);
	assert.ok(descriptionIndex < movedInProgressIndex);
	assert.ok(movedInProgressIndex < orchestrationIndex);
	assert.equal(planEvents[descriptionIndex]?.actor.name, "Venn");
	assert.equal(planEvents[movedInProgressIndex]?.actor.name, "Venn");
	// Resolve story "now" the same way live agent timestamp checks do.
	const planClaudeEvent = planEvents.find(
		(event) => event.kind === "agent" && event.agentId === "claude-code",
	);
	assert.ok(planClaudeEvent);
	const referenceTimeMs = planClaudeEvent.createdAtMs + planClaudeEvent.elapsedSeconds * 1000;
	assert.equal(
		stateModel.formatSessionTimestamp(
			planEvents[descriptionIndex].createdAtMs,
			referenceTimeMs,
		),
		"52m ago",
	);
	assert.ok(
		planEvents.some((event) => event.id === "story-description-applied"),
		"later chapters keep the published description activity",
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
	const chapters = ["intake", "plan", "build", "review", "fix", "approve", "release"];

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
