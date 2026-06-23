const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const SOURCE = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf8");

test("Skills project add menu opens the experimental skills directory", () => {
	const addMenuIndex = SOURCE.indexOf("const addMenuItemsBefore = (");
	const dialogIndex = SOURCE.indexOf("<SkillsDirectoryDialog");
	const createSpaceIndex = SOURCE.indexOf("Create space", addMenuIndex);
	const viewAllSkillsIndex = SOURCE.indexOf("View all skills", addMenuIndex);

	assert.match(SOURCE, /import \{ DEFAULT_SKILLS \} from "@\/app\/data\/directory\/skills";/u);
	assert.match(SOURCE, /import \{ SkillsDirectoryDialog \} from "@\/components\/blocks\/skills-directory";/u);
	assert.match(SOURCE, /import \{ PromptInputActionMenuItem \} from "@\/components\/ui-custom\/prompt-input";/u);
	assert.match(SOURCE, /import FolderAddIcon from "@atlaskit\/icon-lab\/core\/folder-add";/u);
	assert.match(SOURCE, /import SkillIcon from "@atlaskit\/icon-lab\/core\/skill";/u);
	assert.match(SOURCE, /const \[isSkillsDirectoryOpen, setIsSkillsDirectoryOpen\] = useState\(false\);/u);
	assert.match(SOURCE, /const handleViewAllSkills = useCallback\(\(\) => \{[\s\S]*setIsSkillsDirectoryOpen\(true\);[\s\S]*\}, \[\]\);/u);

	assert.ok(addMenuIndex > -1);
	assert.ok(createSpaceIndex > addMenuIndex);
	assert.ok(viewAllSkillsIndex > createSpaceIndex);
	assert.match(SOURCE.slice(addMenuIndex, dialogIndex), /elemBefore=\{<FolderAddIcon label="" \/>\}[\s\S]*Create space/u);
	assert.match(SOURCE.slice(addMenuIndex, dialogIndex), /elemBefore=\{<SkillIcon label="" \/>\}[\s\S]*View all skills/u);
	assert.match(SOURCE, /<ChatPanel[\s\S]*addMenuItemsBefore=\{addMenuItemsBefore\}/u);
	// The directory dialog is shared with the create-skill config view, so its
	// `open` is the combined `isDialogOpen` (which includes isSkillsDirectoryOpen)
	// and it uses the runtime `dialogSkills` list. Still the experimental variant.
	assert.match(SOURCE, /const isDialogOpen = [\s\S]*isSkillsDirectoryOpen/u);
	assert.match(SOURCE.slice(dialogIndex), /open=\{isDialogOpen\}[\s\S]*skills=\{dialogSkills\}[\s\S]*variant="experimental"/u);
});
