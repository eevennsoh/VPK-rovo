const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Agent Card preview uses a direct route instead of the generic dynamic preview loader", () => {
	const source = readProjectFile("app/preview/blocks/agent-card/page.tsx");

	assert.match(
		source,
		/import AgentCardPage from "@\/components\/blocks\/agent-card\/page";/u,
	);
	assert.match(
		source,
		/import \{ getPreviewPageTitle \} from "@\/lib\/project-page-title";/u,
	);
	assert.match(source, /title: getPreviewPageTitle\("agent-card", "blocks"\),/u);
	assert.match(source, /return <AgentCardPage \/>;/u);
	assert.doesNotMatch(source, /RenderPreviewCategoryPage/u);
});

test("Agent Card title actions use chat label and edit icon controls", () => {
	const source = readProjectFile("components/blocks/agent-card/components/agent-card.tsx");
	const entitySource = readProjectFile("components/ui-custom/entity-card/agent-profile.tsx");

	assert.match(source, /<EntityCard\.AgentProfile \{\.\.\.props\} \/>/u);
	assert.match(entitySource, /import EditIcon from "@atlaskit\/icon\/core\/edit";/u);
	assert.doesNotMatch(entitySource, /SwapIcon/u);
	assert.match(entitySource, /editActionLabel\?: string;/u);
	assert.match(entitySource, /onEditAction\?: \(\) => void;/u);
	assert.match(entitySource, /const resolvedSwapActionLabel = swapActionLabel \?\? "Chat with agent";/u);
	assert.match(entitySource, /const resolvedEditActionLabel = editActionLabel \?\? `Edit \$\{name\}`;/u);
	assert.match(
		entitySource,
		/<Button[\s\S]*aria-label=\{resolvedSwapActionLabel\}[\s\S]*size="compact"[\s\S]*>\s*\{resolvedSwapActionLabel\}\s*<\/Button>/u,
	);
	assert.match(
		entitySource,
		/<Button[\s\S]*aria-label=\{resolvedEditActionLabel\}[\s\S]*onClick=\{onEditAction\}[\s\S]*size="icon-compact"[\s\S]*<EditIcon label="" size="small" \/>/u,
	);
});
