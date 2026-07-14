const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const SOURCE = readFileSync(join(__dirname, "components", "jira-epic.tsx"), "utf8");
const PAGE_SOURCE = readFileSync(join(__dirname, "page.tsx"), "utf8");
const DEMO_SOURCE = readFileSync(join(process.cwd(), "components/website/demos/blocks/jira-epic-demo.tsx"), "utf8");
const DETAILS_SOURCE = readFileSync(join(process.cwd(), "app", "data", "details", "blocks", "jira-epic.ts"), "utf8");
const DETAILS_INDEX_SOURCE = readFileSync(join(process.cwd(), "app", "data", "details", "blocks.ts"), "utf8");
const COMPONENTS_SOURCE = readFileSync(join(process.cwd(), "app", "data", "components.ts"), "utf8");
const MANIFEST_SOURCE = readFileSync(join(process.cwd(), "app", "data", "component-manifest.ts"), "utf8");
const REGISTRY_SOURCE = readFileSync(join(process.cwd(), "components", "website", "registry", "blocks.ts"), "utf8");

test("JiraEpic renders a Tag-backed dropdown trigger", () => {
	assert.match(SOURCE, /import \{ Tag \} from "@\/components\/ui\/tag";/);
	assert.match(SOURCE, /import \{ IconTile \} from "@\/components\/ui\/icon-tile";/);
	assert.match(SOURCE, /import EpicIcon from "@atlaskit\/icon\/core\/epic";/u);
	assert.match(SOURCE, /<DropdownMenuTrigger[\s\S]*<Tag[\s\S]*<ChevronDownIcon/u);
	assert.match(SOURCE, /function EpicGlyph\(\{ className \}: Readonly<\{ className\?: string \}>\): ReactElement/u);
	assert.match(SOURCE, /render=\{<EpicIcon label="" size="medium" spacing="none" color="currentColor" \/>\}/u);
	assert.match(SOURCE, /function EpicTagIcon\(\): ReactElement \{[\s\S]*<IconTile[\s\S]*as="span"[\s\S]*className="text-current"[\s\S]*icon=\{<EpicGlyph \/>\}[\s\S]*iconSize="medium"[\s\S]*size="xxsmall"[\s\S]*variant="transparent"/u);
	assert.match(SOURCE, /elemBefore=\{selectedEpic \? <EpicTagIcon \/> : null\}/u);
	assert.match(SOURCE, /aria-label=\{triggerLabel\}/u);
	assert.doesNotMatch(SOURCE, /portalled=\{false\}/u);
	assert.doesNotMatch(SOURCE, /EpicSwatch/u);
	assert.doesNotMatch(SOURCE, /EPIC_COLOR_CLASSES/u);
	assert.doesNotMatch(SOURCE, /block size-4 rounded-sm/u);
});

test("JiraEpic exposes parent actions and selectable epics", () => {
	assert.match(SOURCE, /onEpicSelect\?: \(epicId: string, epic: JiraEpicOption\) => void;/u);
	assert.match(SOURCE, /selectedEpicId\?: string \| null;/u);
	assert.match(SOURCE, /function handleRemoveParent\(\)[\s\S]*setInternalSelectedEpicId\(null\);[\s\S]*onRemoveParent\?\.\(\);/u);
	assert.match(SOURCE, /\{addParentLabel\}/u);
	assert.match(SOURCE, /\{viewParentLabel\}/u);
	assert.match(SOURCE, /\{removeParentLabel\}/u);
	assert.match(SOURCE, /selected=\{epic\.id === selectedEpic\?\.id\}/u);
	assert.match(SOURCE, /const EPIC_ICON_COLOR_CLASSES: Record<JiraEpicColor, string> = \{[\s\S]*purple: "text-icon-accent-purple"[\s\S]*magenta: "text-icon-accent-magenta"[\s\S]*blue: "text-icon-accent-blue"[\s\S]*sky: "text-icon-information"[\s\S]*green: "text-icon-accent-green"/u);
	assert.match(SOURCE, /elemBefore=\{<EpicMenuIcon color=\{epic\.color\} \/>\}/u);
	assert.match(PAGE_SOURCE, /function handleRemoveParent\(\)[\s\S]*setSelectedEpicId\(null\);/u);
});

test("JiraEpic block has a page and website demo", () => {
	assert.match(PAGE_SOURCE, /<JiraEpic/u);
	assert.match(DEMO_SOURCE, /<JiraEpicPage \/>/u);
});

test("JiraEpic block is wired into docs detail, demo registry, and catalogs", () => {
	assert.match(DETAILS_SOURCE, /export const JIRA_EPIC_DETAIL/u);
	assert.match(DETAILS_INDEX_SOURCE, /import \{ JIRA_EPIC_DETAIL \} from "\.\/blocks\/jira-epic";/u);
	assert.match(DETAILS_INDEX_SOURCE, /"jira-epic": JIRA_EPIC_DETAIL/u);
	assert.match(COMPONENTS_SOURCE, /blockComponent\("jira-epic", "Jira epic"\)/u);
	assert.match(MANIFEST_SOURCE, /blockComponent\("jira-epic", "Jira epic"\)/u);
	assert.match(REGISTRY_SOURCE, /"jira-epic": dynamic\(\(\) => import\("\.\.\/demos\/blocks\/jira-epic-demo"\), \{\s*ssr: false,\s*\}\)/u);
});
