const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const BLOCK_SOURCE = fs.readFileSync(path.join(__dirname, "index.tsx"), "utf8");
const DEMO_SOURCE = fs.readFileSync(path.join(__dirname, "artifact-details-demo.tsx"), "utf8");
const AGENTS_FIELD_SOURCE = fs.readFileSync(path.join(__dirname, "artifact-agents-field.tsx"), "utf8");
const LABELS_FIELD_SOURCE = fs.readFileSync(path.join(__dirname, "artifact-labels-field.tsx"), "utf8");
const PARENT_FIELD_SOURCE = fs.readFileSync(path.join(__dirname, "artifact-parent-field.tsx"), "utf8");
const PROJECT_FIELD_SOURCE = fs.readFileSync(path.join(__dirname, "artifact-project-field.tsx"), "utf8");
const DATE_FIELD_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "jira-work-item", "experimental", "components", "detail-field-editors.tsx"),
	"utf8",
);
const SUGGESTION_MENU_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "..", "ui-custom", "rich-text-editor", "suggestion-menu.tsx"),
	"utf8",
);
const METADATA_RAIL_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "jira-work-item", "experimental", "components", "metadata-rail.tsx"),
	"utf8",
);
const EXPERIMENTAL_V2_DETAILS_SOURCE = fs.readFileSync(
	path.join(__dirname, "..", "jira-work-item", "experimental-v2", "components", "details-tab.tsx"),
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
	assert.match(BLOCK_SOURCE, /!open && count !== undefined \? \([\s\S]*text-xs font-normal text-text-subtlest">· \{count\}/u);
	assert.match(BLOCK_SOURCE, /new Set\(sections\.filter\(\(section\) => section\.defaultOpen\)/u);
	assert.match(BLOCK_SOURCE, /index > 0 && \(open \|\| previousOpen\) \? \([\s\S]*className="px-3 py-1\.5"[\s\S]*<Separator \/>/u);
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
	assert.match(BLOCK_SOURCE, /focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/u);
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
	assert.match(BLOCK_SOURCE, /className="grid min-h-8 min-w-0[^"]*items-center/u);
	assert.match(BLOCK_SOURCE, /"flex min-h-8 min-w-0 items-center text-text/u);
	assert.doesNotMatch(BLOCK_SOURCE, /(?:grid|flex) (?:h|min-h)-6 min-w-0/u);
	assert.match(BLOCK_SOURCE, /grid-cols-\[16px_84px_minmax\(0,1fr\)\]/u);
	assert.match(BLOCK_SOURCE, /\[&_\[data-slot=avatar\]\]:size-6/u);
	assert.match(BLOCK_SOURCE, /\[&_\[data-slot=avatar-group-count\]\]:size-6/u);
	assert.match(BLOCK_SOURCE, /\[&_\[data-slot=tile\]\]:size-6/u);
	assert.doesNotMatch(BLOCK_SOURCE, /\[&_\[data-slot=(?:avatar|avatar-group-count|tile)\]\]:size-4/u);
	assert.match(BLOCK_SOURCE, /editable[\s\S]*\? "-ml-2 rounded-md transition-colors duration-normal ease-out-practical hover:bg-bg-neutral-subtle-hovered focus-within:bg-bg-neutral-subtle-hovered motion-reduce:transition-none/u);
	assert.doesNotMatch(BLOCK_SOURCE, /editable[\s\S]*\? "-m[xr]-2 rounded-md/u);
	assert.doesNotMatch(BLOCK_SOURCE, /py-0\.5 transition-colors/u);
	assert.match(BLOCK_SOURCE, /\[&>button\]:m-0!/u);
	assert.match(BLOCK_SOURCE, /\[&>button\]:min-h-8!/u);
	assert.match(BLOCK_SOURCE, /\[&>button\]:w-full!/u);
	assert.match(BLOCK_SOURCE, /\[&>button\]:px-2!/u);
});

test("Artifact Pane remains standalone from the Jira work-item metadata rail", () => {
	assert.doesNotMatch(METADATA_RAIL_SOURCE, /components\/blocks\/artifact-pane/u);
	assert.match(METADATA_RAIL_SOURCE, /<Tabs defaultValue="details">/u);
	assert.match(METADATA_RAIL_SOURCE, /<TabsTrigger value="automation">Automation<\/TabsTrigger>/u);
});

test("Jira work-item v2 reuses the Artifact Pane parent-field owner", () => {
	assert.match(EXPERIMENTAL_V2_DETAILS_SOURCE, /import \{ ArtifactParentField \} from "@\/components\/blocks\/artifact-pane\/artifact-parent-field"/u);
	assert.match(EXPERIMENTAL_V2_DETAILS_SOURCE, /<ArtifactParentField onChange=\{\(key\) => onChange\(\{ parent: key \}\)\} value=\{draft\.parent\} \/>/u);
	assert.doesNotMatch(EXPERIMENTAL_V2_DETAILS_SOURCE, /ParentRowField/u);
});

test("Artifact Pane calendars are never narrower than their date triggers", () => {
	assert.match(DATE_FIELD_SOURCE, /className="w-auto min-w-\(--anchor-width\) p-2"/u);
});

test("Artifact Pane demo provides editable, avatar-rich metadata fields", () => {
	assert.match(DEMO_SOURCE, /useState<ArtifactMetadata>\(INITIAL_METADATA\)/u);
	assert.match(DEMO_SOURCE, /<ArtifactPanePropertyRow editable=\{false\}[\s\S]*?label="Status">/u);
	assert.match(DEMO_SOURCE, /import ProjectStatusIcon from "@atlaskit\/icon\/core\/project-status"/u);
	assert.match(DEMO_SOURCE, /icon=\{<ProjectStatusIcon label="" size="small" \/>\} label="Status"/u);
	assert.doesNotMatch(DEMO_SOURCE, /StatusInformationIcon/u);
	assert.match(DEMO_SOURCE, /<StatusPill[\s\S]*<ArtifactProjectField[\s\S]*<PersonRowField/u);
	assert.match(DEMO_SOURCE, /ariaLabel="Change reporter"/u);
	assert.match(DEMO_SOURCE, /import \{ ArtifactPaneAgentsField \} from "@\/components\/blocks\/artifact-pane\/artifact-agents-field"/u);
	assert.match(DEMO_SOURCE, /<ArtifactPaneAgentsField/u);
	assert.match(AGENTS_FIELD_SOURCE, /export function ArtifactPaneAgentsField/u);
	assert.match(AGENTS_FIELD_SOURCE, /trailing: value\.includes\(agent\.id\) \? <CheckIcon[^>]*\/> : undefined/u);
	assert.match(AGENTS_FIELD_SOURCE, /selectedItemIds=\{new Set\(value\)\}/u);
	assert.match(AGENTS_FIELD_SOURCE, /<AvatarGroup[\s\S]*<AgentAvatarVisual[\s\S]*sizePx=\{24\}/u);
	assert.doesNotMatch(AGENTS_FIELD_SOURCE, /sizePx=\{16\}/u);
	assert.match(AGENTS_FIELD_SOURCE, /leadingVisual: \([\s\S]*<AgentAvatarVisual[\s\S]*brandName=\{agent\.brandName\}[\s\S]*sizePx=\{24\}/u);
	assert.doesNotMatch(AGENTS_FIELD_SOURCE, /\? \{ kind: "third-party", name: agent\.brandName \}/u);
	assert.match(SUGGESTION_MENU_SOURCE, /leadingVisual\?: ReactNode;/u);
	assert.match(SUGGESTION_MENU_SOURCE, /aria-multiselectable=\{selectedItemIds \? true : undefined\}/u);
	assert.match(SUGGESTION_MENU_SOURCE, /aria-selected=\{isChosen \?\? isSelected\}/u);
	assert.match(SUGGESTION_MENU_SOURCE, /const visual = item\.leadingVisual \? \([\s\S]*item\.leadingVisual/u);
	assert.doesNotMatch(AGENTS_FIELD_SOURCE, /avatarClassName="[^"]*ring-/u);
	assert.doesNotMatch(AGENTS_FIELD_SOURCE, /label=\{agent\.name\}/u);
	assert.match(DEMO_SOURCE, /<PriorityRowField[\s\S]*<DateRowField[\s\S]*<ArtifactParentField[\s\S]*<ArtifactLabelsField/u);
	assert.match(DEMO_SOURCE, /import \{ ArtifactParentField \} from "@\/components\/blocks\/artifact-pane\/artifact-parent-field"/u);
	assert.match(PARENT_FIELD_SOURCE, /export function ArtifactParentField/u);
	assert.match(PARENT_FIELD_SOURCE, /import \{ Tag \} from "@\/components\/ui\/tag"/u);
	assert.match(PARENT_FIELD_SOURCE, /const ARTIFACT_EPIC_COLORS:[\s\S]*"RFP-100": "purple"[\s\S]*"RFP-102": "blue"[\s\S]*"RFP-103": "green"/u);
	assert.match(PARENT_FIELD_SOURCE, /function ArtifactEpicIcon\(\)[\s\S]*<Icon[\s\S]*aria-hidden[\s\S]*render=\{<EpicIcon color="currentColor" label="" size="medium" spacing="none" \/>\}/u);
	assert.doesNotMatch(PARENT_FIELD_SOURCE, /function ArtifactEpicIcon\(\)[\s\S]*className="size-/u);
	assert.match(PARENT_FIELD_SOURCE, /function ArtifactEpicMenuIcon\(\{ color \}: Readonly<\{ color: ArtifactEpicColor \}>\)[\s\S]*<IconTile[\s\S]*as="span"[\s\S]*icon=\{<ArtifactEpicIcon \/>\}[\s\S]*size="small"[\s\S]*variant=\{color\}/u);
	assert.doesNotMatch(PARENT_FIELD_SOURCE, /function ArtifactEpicMenuIcon\([\s\S]*className="text-current"/u);
	assert.match(PARENT_FIELD_SOURCE, /icon: null,[\s\S]*leadingVisual: <ArtifactEpicMenuIcon color=\{artifactEpicColor\(option\.key\)\} \/>/u);
	assert.match(PARENT_FIELD_SOURCE, /<Tag[\s\S]*className="max-w-full self-center"[\s\S]*color=\{artifactEpicColor\(selected\.key\)\}[\s\S]*elemBefore=\{<ArtifactEpicIcon \/>\}[\s\S]*\{selected\.summary\}/u);
	assert.doesNotMatch(PARENT_FIELD_SOURCE, /\{selected\.key\} \{selected\.summary\}/u);
	assert.match(PARENT_FIELD_SOURCE, /\[&_\.rich-text-command-menu-item:hover\]:bg-bg-neutral-subtle-hovered!/u);
	assert.doesNotMatch(DEMO_SOURCE, /<ParentRowField/u);
	assert.doesNotMatch(DEMO_SOURCE, /<LabelsRowField/u);
	assert.match(DEMO_SOURCE, /METADATA_PEOPLE/u);
	assert.match(AGENTS_FIELD_SOURCE, /BOARD_AGENTS/u);
	assert.match(DEMO_SOURCE, /import \{ ArtifactProjectField \} from "@\/components\/blocks\/artifact-pane\/artifact-project-field"/u);
	assert.match(PROJECT_FIELD_SOURCE, /export function ArtifactProjectField/u);
	assert.match(PROJECT_FIELD_SOURCE, /PROJECT_AVATAR_SRCS[\s\S]*"esm-rfp-response": "\/avatar-project\/rocket\.svg"/u);
	assert.match(PROJECT_FIELD_SOURCE, /<Tile aria-hidden className="p-0" isSnug/u);
	assert.match(PROJECT_FIELD_SOURCE, /<ProjectAvatar name=\{selected\.name\} src=\{selected\.avatarSrc\} \/>/u);
	assert.match(PROJECT_FIELD_SOURCE, /icon: null,[\s\S]*visual: \{ kind: "avatar", shape: "square", src: project\.avatarSrc \}/u);
	assert.match(DEMO_SOURCE, /className="mt-1 self-start text-xs leading-5 text-text-subtle underline-offset-2 hover:underline focus-visible:underline"/u);
	assert.doesNotMatch(DEMO_SOURCE, /self-start[^"]*text-link/u);
	assert.doesNotMatch(DEMO_SOURCE, /See less[\s\S]*text-sm font-medium/u);
});

test("Artifact Pane labels use colored tags in the field and grouped picker", () => {
	assert.match(LABELS_FIELD_SOURCE, /import DeleteIcon from "@atlaskit\/icon\/core\/delete"/u);
	assert.match(LABELS_FIELD_SOURCE, /import \{ Tag, TagGroup, type TagColor \} from "@\/components\/ui\/tag"/u);
	assert.match(LABELS_FIELD_SOURCE, /const LABEL_COLORS = \["blue", "green", "purple", "orange", "teal", "magenta", "yellow"\]/u);
	assert.match(LABELS_FIELD_SOURCE, /const allLabels = Array\.from\(new Set\(\[\.\.\.value, \.\.\.LABEL_OPTIONS\]\)\);/u);
	assert.match(LABELS_FIELD_SOURCE, /const visibleLabels = allLabels\.filter/u);
	assert.match(LABELS_FIELD_SOURCE, /<Tag className="self-center justify-self-start" color=\{labelColor\(label\)\}/u);
	assert.match(LABELS_FIELD_SOURCE, /className="rich-text-command-menu-heading"/u);
	assert.match(LABELS_FIELD_SOURCE, /group\/label-option grid-cols-\[minmax\(0,1fr\)_24px\]!/u);
	assert.match(LABELS_FIELD_SOURCE, /hover:bg-bg-neutral-subtle-hovered! focus-visible:bg-bg-neutral-subtle-hovered!/u);
	assert.match(LABELS_FIELD_SOURCE, /group-hover\/label-option:text-icon-danger group-hover\/label-option:opacity-100/u);
	assert.match(LABELS_FIELD_SOURCE, /group-focus-visible\/label-option:text-icon-danger group-focus-visible\/label-option:opacity-100/u);
	assert.match(LABELS_FIELD_SOURCE, /<DeleteIcon label="" size="small" \/>/u);
	assert.match(LABELS_FIELD_SOURCE, /aria-label=\{selected \? `Remove \$\{label\}` : `Add \$\{label\}`\}/u);
	assert.match(LABELS_FIELD_SOURCE, /aria-multiselectable="true"/u);
	assert.match(LABELS_FIELD_SOURCE, /<PopoverContent[\s\S]*aria-label="Edit labels"/u);
	assert.match(LABELS_FIELD_SOURCE, /aria-label="Search labels"[\s\S]*className="rich-text-command-menu-list"[\s\S]*role="listbox"/u);
	assert.doesNotMatch(LABELS_FIELD_SOURCE, /className="rich-text-command-menu rich-text-command-menu-borderless"[\s\S]{0,80}role="listbox"/u);
	assert.match(LABELS_FIELD_SOURCE, /<DetailValueTrigger aria-label="Edit labels" className="py-1\.5!" \/>/u);
	assert.match(LABELS_FIELD_SOURCE, /heading="Selected"/u);
	assert.match(LABELS_FIELD_SOURCE, /heading="More labels"/u);
	assert.match(LABELS_FIELD_SOURCE, /const canCreateCustomLabel = customLabel\.length > 0/u);
	assert.match(LABELS_FIELD_SOURCE, /heading="New label" labels=\{\[customLabel\]\}/u);
	assert.match(LABELS_FIELD_SOURCE, /else if \(canCreateCustomLabel\) \{[\s\S]*createCustomLabel\(customLabel\);/u);
	assert.doesNotMatch(LABELS_FIELD_SOURCE, /No labels found/u);
	assert.match(LABELS_FIELD_SOURCE, /aria-selected=\{selected\}/u);
});

test("Artifact Pane is registered as a documented block", () => {
	assert.match(readProjectFile("app/data/components.ts"), /blockComponent\("artifact-pane", "Artifact Pane"\)/u);
	assert.match(readProjectFile("app/data/component-manifest.ts"), /blockComponent\("artifact-pane", "Artifact Pane"\)/u);
	assert.match(readProjectFile("app/data/details/blocks.ts"), /"artifact-pane": ARTIFACT_PANE_DETAIL/u);
	assert.match(readProjectFile("components/website/registry/blocks.ts"), /"artifact-pane": dynamic\(/u);
	assert.ok(fs.existsSync(path.join(process.cwd(), "components/website/demos/blocks/artifact-pane-demo.tsx")));
});
