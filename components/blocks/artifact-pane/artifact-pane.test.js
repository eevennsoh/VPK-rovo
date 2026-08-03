const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const BLOCK_SOURCE = fs.readFileSync(path.join(__dirname, "index.tsx"), "utf8");
const DEMO_SOURCE = fs.readFileSync(path.join(__dirname, "artifact-details-demo.tsx"), "utf8");
const LABELS_FIELD_SOURCE = fs.readFileSync(path.join(__dirname, "artifact-labels-field.tsx"), "utf8");
const SUGGESTION_MENU_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "..", "ui-custom", "rich-text-editor", "suggestion-menu.tsx"),
	"utf8",
);
const METADATA_RAIL_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "jira-work-item", "experimental", "components", "metadata-rail.tsx"),
	"utf8",
);

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Artifact Pane owns independently collapsible sections", () => {
	assert.match(BLOCK_SOURCE, /export function ArtifactPane\(/u);
	assert.match(BLOCK_SOURCE, /sections: readonly ArtifactPaneSectionItem\[\];/u);
	assert.match(BLOCK_SOURCE, /borderless \? null : "border border-border"/u);
	assert.match(BLOCK_SOURCE, /<Collapsible onOpenChange=\{onOpenChange\} open=\{open\}>/u);
	assert.match(BLOCK_SOURCE, /new Set\(sections\.filter\(\(section\) => section\.defaultOpen\)/u);
	assert.match(BLOCK_SOURCE, /index > 0 && \(open \|\| previousOpen\) \? \([\s\S]*className="py-1\.5"[\s\S]*<Separator \/>/u);
	assert.match(BLOCK_SOURCE, /import ChevronRightIcon from "@atlaskit\/icon\/core\/chevron-right"/u);
	assert.match(BLOCK_SOURCE, /import \{ motion, useReducedMotion \} from "motion\/react"/u);
	assert.match(BLOCK_SOURCE, /const prefersReducedMotion = useReducedMotion\(\);/u);
	assert.match(BLOCK_SOURCE, /<motion\.span[\s\S]*animate=\{\{ rotate: open \? 90 : 0 \}\}/u);
	assert.match(BLOCK_SOURCE, /initial=\{false\}/u);
	assert.match(BLOCK_SOURCE, /style=\{\{ willChange: "transform" \}\}/u);
	assert.match(BLOCK_SOURCE, /prefersReducedMotion \? \{ duration: 0 \} : \{ duration: 0\.15, ease: \[0\.4, 1, 0\.6, 1\] \}/u);
	assert.match(BLOCK_SOURCE, /<ChevronRightIcon label="" size="small" \/>/u);
	assert.doesNotMatch(BLOCK_SOURCE, /Chevron(?:Up|Down)Icon/u);
	assert.match(BLOCK_SOURCE, /className="group\/header flex w-full/u);
	assert.match(BLOCK_SOURCE, /opacity-0 group-hover\/header:opacity-100 group-focus-visible\/header:opacity-100/u);
	assert.match(BLOCK_SOURCE, /text-text-subtle group-hover\/header:text-text group-focus-visible\/header:text-text/u);
	assert.doesNotMatch(BLOCK_SOURCE, /hover:bg-surface-hovered/u);
	assert.match(BLOCK_SOURCE, /sections\.map\(\(section, index\) =>/u);
	assert.match(BLOCK_SOURCE, /index === 0 \? "pt-1\.5" : null/u);
	assert.match(BLOCK_SOURCE, /index === sections\.length - 1 \? "pb-1\.5" : null/u);
	assert.doesNotMatch(BLOCK_SOURCE, /gap-3 rounded-md px-3 py-3/u);
	assert.doesNotMatch(BLOCK_SOURCE, /border-b border-border/u);
	assert.doesNotMatch(BLOCK_SOURCE, /index > 0 \? "border-t border-border"/u);
	assert.doesNotMatch(BLOCK_SOURCE, /Tabs|TabTrigger|defaultTab/u);
});

test("Artifact Pane property rows follow the Jira Session Flyout layout pattern", () => {
	assert.match(BLOCK_SOURCE, /export function ArtifactPanePropertyRow\(/u);
	assert.match(BLOCK_SOURCE, /editable = true/u);
	assert.match(BLOCK_SOURCE, /className="grid min-h-6 min-w-0[^"]*items-center/u);
	assert.match(BLOCK_SOURCE, /"flex min-h-6 min-w-0 items-center text-text/u);
	assert.doesNotMatch(BLOCK_SOURCE, /(?:grid|flex) (?:h|min-h)-8 min-w-0/u);
	assert.match(BLOCK_SOURCE, /grid-cols-\[16px_84px_minmax\(0,1fr\)\]/u);
	assert.match(BLOCK_SOURCE, /\[&_\[data-slot=avatar\]\]:size-4/u);
	assert.match(BLOCK_SOURCE, /\[&_\[data-slot=avatar-group-count\]\]:size-4/u);
	assert.match(BLOCK_SOURCE, /\[&_\[data-slot=tile\]\]:size-4/u);
	assert.match(BLOCK_SOURCE, /editable[\s\S]*\? "-ml-2 rounded-md transition-colors duration-normal ease-out-practical hover:bg-bg-neutral-subtle-hovered focus-within:bg-bg-neutral-subtle-hovered motion-reduce:transition-none/u);
	assert.doesNotMatch(BLOCK_SOURCE, /editable[\s\S]*\? "-m[xr]-2 rounded-md/u);
	assert.doesNotMatch(BLOCK_SOURCE, /py-0\.5 transition-colors/u);
	assert.match(BLOCK_SOURCE, /\[&>button\]:m-0!/u);
	assert.match(BLOCK_SOURCE, /\[&>button\]:min-h-6!/u);
	assert.match(BLOCK_SOURCE, /\[&>button\]:w-full!/u);
	assert.match(BLOCK_SOURCE, /\[&>button\]:px-2!/u);
});

test("Artifact Pane remains standalone from the Jira work-item metadata rail", () => {
	assert.doesNotMatch(METADATA_RAIL_SOURCE, /components\/blocks\/artifact-pane/u);
	assert.match(METADATA_RAIL_SOURCE, /<Tabs defaultValue="details">/u);
	assert.match(METADATA_RAIL_SOURCE, /<TabsTrigger value="automation">Automation<\/TabsTrigger>/u);
});

test("Artifact Pane demo provides editable, avatar-rich metadata fields", () => {
	assert.match(DEMO_SOURCE, /useState<ArtifactMetadata>\(INITIAL_METADATA\)/u);
	assert.match(DEMO_SOURCE, /<ArtifactPanePropertyRow editable=\{false\}[\s\S]*?label="Status">/u);
	assert.match(DEMO_SOURCE, /import ProjectStatusIcon from "@atlaskit\/icon\/core\/project-status"/u);
	assert.match(DEMO_SOURCE, /icon=\{<ProjectStatusIcon label="" size="small" \/>\} label="Status"/u);
	assert.doesNotMatch(DEMO_SOURCE, /StatusInformationIcon/u);
	assert.match(DEMO_SOURCE, /<StatusPill[\s\S]*<ProjectField[\s\S]*<PersonRowField/u);
	assert.match(DEMO_SOURCE, /ariaLabel="Change reporter"/u);
	assert.match(DEMO_SOURCE, /<AgentAvatarVisual/u);
	assert.match(DEMO_SOURCE, /<AgentsField/u);
	assert.match(DEMO_SOURCE, /<AvatarGroup[\s\S]*<AgentAvatarVisual[\s\S]*sizePx=\{16\}/u);
	assert.match(DEMO_SOURCE, /leadingVisual: \([\s\S]*<AgentAvatarVisual[\s\S]*brandName=\{agent\.brandName\}[\s\S]*sizePx=\{24\}/u);
	assert.doesNotMatch(DEMO_SOURCE, /\? \{ kind: "third-party", name: agent\.brandName \}/u);
	assert.match(SUGGESTION_MENU_SOURCE, /leadingVisual\?: ReactNode;/u);
	assert.match(SUGGESTION_MENU_SOURCE, /const visual = item\.leadingVisual \? \([\s\S]*item\.leadingVisual/u);
	assert.doesNotMatch(DEMO_SOURCE, /avatarClassName="[^"]*ring-/u);
	assert.doesNotMatch(DEMO_SOURCE, /label=\{agent\.name\}/u);
	assert.match(DEMO_SOURCE, /<PriorityRowField[\s\S]*<DateRowField[\s\S]*<ParentRowField[\s\S]*<ArtifactLabelsField/u);
	assert.doesNotMatch(DEMO_SOURCE, /<LabelsRowField/u);
	assert.match(DEMO_SOURCE, /METADATA_PEOPLE/u);
	assert.match(DEMO_SOURCE, /BOARD_AGENTS/u);
	assert.match(DEMO_SOURCE, /PROJECT_AVATAR_SRCS[\s\S]*"esm-rfp-response": "\/avatar-project\/rocket\.svg"/u);
	assert.match(DEMO_SOURCE, /<Tile aria-hidden className="p-0" isSnug/u);
	assert.match(DEMO_SOURCE, /<ProjectAvatar name=\{selected\.name\} src=\{selected\.avatarSrc\} \/>/u);
	assert.match(DEMO_SOURCE, /icon: null,[\s\S]*visual: \{ kind: "avatar", shape: "square", src: project\.avatarSrc \}/u);
	assert.match(DEMO_SOURCE, /className="mt-1 self-start text-xs leading-5 text-text-subtle underline-offset-2 hover:underline focus-visible:underline"/u);
	assert.doesNotMatch(DEMO_SOURCE, /self-start[^"]*text-link/u);
	assert.doesNotMatch(DEMO_SOURCE, /See less[\s\S]*text-sm font-medium/u);
});

test("Artifact Pane labels use colored tags in the field and grouped picker", () => {
	assert.match(LABELS_FIELD_SOURCE, /import \{ Tag, TagGroup, type TagColor \} from "@\/components\/ui\/tag"/u);
	assert.match(LABELS_FIELD_SOURCE, /const LABEL_COLORS = \["blue", "green", "purple", "orange", "teal", "magenta", "yellow"\]/u);
	assert.match(LABELS_FIELD_SOURCE, /<Tag className="justify-self-start" color=\{labelColor\(label\)\}/u);
	assert.match(LABELS_FIELD_SOURCE, /className="rich-text-command-menu-heading"/u);
	assert.match(LABELS_FIELD_SOURCE, /className="rich-text-command-menu-item grid-cols-1!"/u);
	assert.doesNotMatch(LABELS_FIELD_SOURCE, /hover:bg-bg-neutral-subtle-hovered/u);
	assert.match(LABELS_FIELD_SOURCE, /heading="Selected"/u);
	assert.match(LABELS_FIELD_SOURCE, /heading="More labels"/u);
	assert.match(LABELS_FIELD_SOURCE, /aria-selected=\{selected\}/u);
});

test("Artifact Pane is registered as a documented block", () => {
	assert.match(readProjectFile("app/data/components.ts"), /blockComponent\("artifact-pane", "Artifact Pane"\)/u);
	assert.match(readProjectFile("app/data/component-manifest.ts"), /blockComponent\("artifact-pane", "Artifact Pane"\)/u);
	assert.match(readProjectFile("app/data/details/blocks.ts"), /"artifact-pane": ARTIFACT_PANE_DETAIL/u);
	assert.match(readProjectFile("components/website/registry/blocks.ts"), /"artifact-pane": dynamic\(/u);
	assert.ok(fs.existsSync(path.join(process.cwd(), "components/website/demos/blocks/artifact-pane-demo.tsx")));
});
