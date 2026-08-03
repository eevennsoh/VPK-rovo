const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

function readProjectFile(relativePath) {
	return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Jira Agents reuses the requested gallery surfaces with the experimental v2 work item", () => {
	const pageSource = readProjectFile("components/projects/jira-agents/page.tsx");
	const itemsSource = readProjectFile("components/projects/jira-agents/data/gallery-items.ts");

	assert.match(pageSource, /import \{[\s\S]*ForYouStage,[\s\S]*JiraDesignWorkspaceStage,[\s\S]*\} from "@\/components\/projects\/jira-golden-journeys\/components\/for-you-stage";/u);
	assert.match(pageSource, /import \{ ExperimentalV2JiraWorkItem \} from "@\/components\/blocks\/jira-work-item\/experimental-v2\/experimental-v2-jira-work-item";/u);
	assert.match(pageSource, /import \{[\s\S]*useWorkItemStageController,[\s\S]*WorkItemControls,[\s\S]*type WorkItemStageController,[\s\S]*\} from "@\/components\/projects\/asx\/components\/work-item-stage";/u);
	assert.match(pageSource, /if \(item\.id === "for-you"\) return <ForYouStage \/>;/u);
	assert.match(pageSource, /if \(item\.id === "kanban-list"\) return <KanbanListStage \/>;/u);
	assert.match(pageSource, /if \(item\.id === "work-item"\) return <JiraAgentsWorkItemStage controller=\{workItemController\} \/>;/u);
	assert.match(pageSource, /<ExperimentalV2JiraWorkItem[\s\S]*initialPreset=\{controller\.preset\}[\s\S]*presentation="inline"/u);
	assert.match(pageSource, /<WorkItemControls controller=\{workItemController\} \/>/u);
	assert.match(pageSource, /<RovoChatProvider agentProfiles=\{JGP_CHAT_AGENT_PROFILES\}>/u);
	assert.doesNotMatch(pageSource, /stagePosition="center"/u);
	assert.match(itemsSource, /title: "Jira For You",\s*titleLines: \["Jira For", "You"\]/u);
	assert.match(itemsSource, /title: "Kanban & List",\s*titleLines: \["Kanban", "& List"\]/u);
});
