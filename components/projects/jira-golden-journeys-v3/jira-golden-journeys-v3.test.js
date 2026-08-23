const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

function readProjectFile(relativePath) {
	return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const CONTROLLER_PATH = "components/projects/jira-golden-journeys-v3/use-hotfix-story.ts";
const MODEL_PATH = "components/projects/jira-golden-journeys-v3/data/story-model.ts";
const STORY_PATH = "components/projects/jira-golden-journeys-v3/data/hotfix-story.ts";
const EVENTS_PATH = "components/projects/jira-golden-journeys-v3/data/hotfix-story-events.ts";

test("the work-item stage mounts experimental-v3 inline, not the v2 shell", () => {
	const pageSource = readProjectFile("components/projects/jira-golden-journeys-v3/page.tsx");
	assert.match(
		pageSource,
		/import \{ ExperimentalV3JiraWorkItem \} from "@\/components\/blocks\/jira-work-item\/experimental-v3\/experimental-v3-jira-work-item"/u,
	);
	assert.match(pageSource, /<ExperimentalV3JiraWorkItem[\s\S]*presentation="inline"/u);
	assert.match(pageSource, /workItem=\{controller\.workItem\}/u);
	assert.match(pageSource, /initialState=\{controller\.initialState\}/u);
	assert.doesNotMatch(pageSource, /ExperimentalV2JiraWorkItem/u);
	assert.doesNotMatch(pageSource, /variant="experimental-v2"/u);
});

test("the route resets chat before mounting each story chapter and keeps the floating launcher absent", () => {
	const pageSource = readProjectFile("components/projects/jira-golden-journeys-v3/page.tsx");
	assert.match(
		pageSource,
		/<RovoChatProvider[\s\S]*key=\{`\$\{storyController\.chapter\}:\$\{storyController\.chapterRevision\}`\}/u,
	);
	assert.doesNotMatch(pageSource, /const \{ closeChat, resetChat \} = useRovoChat\(\)/u);
	assert.doesNotMatch(pageSource, /closeChat\(\);[\s\S]*resetChat\(\);/u);
	assert.match(pageSource, /preserveActiveSessionOnHydration/u);
});

test("the responsive gallery keeps both desktop and compact story controls", () => {
	const pageSource = readProjectFile("components/projects/jira-golden-journeys-v3/page.tsx");
	const controlsSource = readProjectFile("components/projects/jira-golden-journeys-v3/story-controls.tsx");
	assert.match(pageSource, /<JiraGoldenJourneysV3StoryControls[\s\S]*terminalStep=\{terminalStep\}/u);
	assert.match(pageSource, /<JiraGoldenJourneysV3CompactStoryControls controller=\{storyController\} \/>/u);
	assert.match(controlsSource, /aria-label="Jump to chapter"/u);
	assert.match(controlsSource, /aria-label="Previous chapter"/u);
	assert.match(controlsSource, /aria-label="Next chapter"/u);
});

test("every Jira Golden Journeys header scroller reserves the shared focus-ring gutter", () => {
	const focusRingSource = readProjectFile("components/ui/focus-ring.ts");
	assert.match(focusRingSource, /export const FOCUS_RING_CLIP_GUTTER = "-m-1 p-1"/u);

	for (const sourcePath of [
		"components/projects/jira-golden-journeys-v0/components/gallery-header-controls.tsx",
		"components/projects/jira-golden-journeys-v1/components/session-stage.tsx",
		"components/projects/jira-golden-journeys-v2/story-controls.tsx",
		"components/projects/jira-golden-journeys-v3/story-controls.tsx",
	]) {
		const source = readProjectFile(sourcePath);
		assert.match(source, /import \{ FOCUS_RING_CLIP_GUTTER \} from "@\/components\/ui\/focus-ring"/u);
		assert.match(
			source,
			/"scrollbar-none max-w-\[calc\(100vw-12rem\)\] overflow-x-auto",\s*FOCUS_RING_CLIP_GUTTER/u,
			sourcePath,
		);
	}
});

test("the controller starts at Terminal with both automation settings disabled", () => {
	const source = readProjectFile(CONTROLLER_PATH);
	assert.match(source, /useState<JiraGoldenJourneysV3StoryChapter>\("terminal"\)/u);
	assert.match(source, /const \[autoFixEnabled, setAutoFixEnabled\] = useState\(false\)/u);
	assert.match(source, /const \[autoMergeEnabled, setAutoMergeEnabled\] = useState\(false\)/u);
	assert.match(source, /const \[approvalStep, setApprovalStep\] = useState<JiraGoldenJourneysV3ApprovalStep>\(0\)/u);
});

test("Reset owns the full story reset while chapter replay preserves settings", () => {
	const source = readProjectFile(CONTROLLER_PATH);
	const resetStory = source.match(/const resetStory = useCallback\(\(\) => \{[\s\S]*?\n\t\}, \[\]\);/u)?.[0] ?? "";
	const restartChapter = source.match(/const restartChapter = useCallback\([\s\S]*?\n\t\}, \[\]\);/u)?.[0] ?? "";
	assert.match(resetStory, /setChapter\("terminal"\)/u);
	assert.match(resetStory, /setAutoFixEnabled\(false\)/u);
	assert.match(resetStory, /setAutoMergeEnabled\(false\)/u);
	assert.match(resetStory, /setApprovalStep\(0\)/u);
	assert.match(resetStory, /setPullRequestMerged\(false\)/u);
	assert.doesNotMatch(restartChapter, /setAutoFixEnabled|setAutoMergeEnabled/u);
	assert.match(source, /const resetCurrentChapter = useCallback\(\(\) => \{\s*restartChapter\(chapter\);/u);
});

test("Review, Fix, and Approve progression is gated by the correct facts", () => {
	const source = readProjectFile(CONTROLLER_PATH);
	assert.match(source, /chapter !== "review" \|\| reviewStep === "failed"/u);
	assert.match(source, /if \(transition\.next === "failed"\) setCiStatus\("failed"\)/u);
	assert.match(source, /chapter !== "fix" \|\| !autoFixEnabled \|\| fixStep !== "failed"/u);
	assert.match(source, /setFixStep\(shouldReduceMotion \? "complete" : "repairing"\)/u);
	assert.match(source, /setCiStatus\(shouldReduceMotion \? "passed" : "repairing"\)/u);
	assert.match(source, /chapter !== "approve" \|\| ciStatus !== "passed" \|\| approvalStep === 2/u);
	assert.match(source, /setApprovalStep\(\(current\) => current === 0 \? 1 : 2\)/u);
});

test("returning to Fix invalidates later approval and merge evidence", () => {
	const source = readProjectFile(CONTROLLER_PATH);
	const selectChapter = source.match(/const selectChapter = useCallback\([\s\S]*?\n\t\}, \[chapter, ciStatus, restartChapter\]\);/u)?.[0] ?? "";
	assert.match(selectChapter, /else if \(nextChapter === "fix"\)/u);
	assert.match(selectChapter, /setFixStep\(ciStatus === "passed" \? "complete" : "failed"\)/u);
	assert.match(selectChapter, /setApprovalStep\(0\)/u);
	assert.match(selectChapter, /if \(ciStatus !== "passed"\) setCiStatus\("failed"\)/u);
	assert.match(selectChapter, /setPullRequestMerged\(false\)/u);
});

test("auto-merge is global, rules-gated, and independent from Release navigation", () => {
	const source = readProjectFile(CONTROLLER_PATH);
	const releaseCase = source.match(/case "release":\s*\/\/[\s\S]*?\s*break;/u)?.[0] ?? "";
	const mergeEffect = source.match(/useEffect\(\(\) => \{\s*if \(!active \|\| !autoMergeEnabled[\s\S]*?\n\t\}, \[[^\]]+\]\);/u)?.[0] ?? "";
	assert.ok(releaseCase.length > 0);
	assert.doesNotMatch(releaseCase, /setPullRequestMerged|setCiStatus|setApprovalStep/u);
	assert.match(mergeEffect, /!mergeGate\.canMerge \|\| pullRequestMerged/u);
	assert.match(mergeEffect, /setPullRequestMerged\(true\)/u);
	assert.doesNotMatch(mergeEffect.match(/\}, \[[^\]]+\]\);/u)?.[0] ?? "", /chapter/u);
});

test("authored transitions collapse under reduced motion", () => {
	const source = readProjectFile(CONTROLLER_PATH);
	assert.match(source, /if \(shouldReduceMotion\) \{\s*setReviewStep\("failed"\);\s*setCiStatus\("failed"\)/u);
	assert.match(source, /setFixStep\(shouldReduceMotion \? "complete" : "repairing"\)/u);
	assert.match(source, /if \(shouldReduceMotion\) \{\s*setApprovalStep\(2\)/u);
	assert.match(source, /if \(shouldReduceMotion\) \{\s*setPullRequestMerged\(true\)/u);
});

test("v3 source removes the old planning, skill, repair-picker, and deployment narratives", () => {
	const source = [MODEL_PATH, STORY_PATH, EVENTS_PATH, CONTROLLER_PATH]
		.map(readProjectFile)
		.join("\n");
	assert.doesNotMatch(source, /Code Planner|descriptionSkill|Improve description|PullRequestFix|fixAgentId|CI_REPAIR_SESSION/u);
	assert.doesNotMatch(source, /feature-flag rollout|production smoke|healthy telemetry|PR #1848/u);
	assert.doesNotMatch(source, /basic-coding-agent-template/u);
	assert.equal((source.match(/id: "claude-code"/gu) ?? []).length, 1);
});
