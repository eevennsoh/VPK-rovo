const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

function readProjectFile(relativePath) {
	return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Jira Agents reuses the requested JGP and ASX owner surfaces", () => {
	const pageSource = readProjectFile("components/projects/jira-agents/page.tsx");
	const itemsSource = readProjectFile("components/projects/jira-agents/data/gallery-items.ts");

	assert.match(pageSource, /import \{[\s\S]*ForYouStage,[\s\S]*JiraDesignWorkspaceStage,[\s\S]*\} from "@\/components\/projects\/jira-golden-journeys\/components\/for-you-stage";/u);
	assert.match(pageSource, /import \{[\s\S]*WorkItemStage,[\s\S]*\} from "@\/components\/projects\/asx\/components\/work-item-stage";/u);
	assert.match(pageSource, /if \(item\.id === "for-you"\) return <ForYouStage \/>;/u);
	assert.match(pageSource, /if \(item\.id === "kanban-list"\) return <KanbanListStage \/>;/u);
	assert.match(pageSource, /if \(item\.id === "work-item"\) return <WorkItemStage controller=\{workItemController\} \/>;/u);
	assert.match(pageSource, /<WorkItemControls controller=\{workItemController\} \/>/u);
	assert.match(pageSource, /<RovoChatProvider agentProfiles=\{JGP_CHAT_AGENT_PROFILES\}>/u);
	assert.doesNotMatch(pageSource, /stagePosition="center"/u);
	assert.match(itemsSource, /title: "Jira For You",\s*titleLines: \["Jira For", "You"\]/u);
	assert.match(itemsSource, /title: "Kanban & List",\s*titleLines: \["Kanban", "& List"\]/u);
});
