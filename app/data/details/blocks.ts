import type { ComponentDetail } from "@/app/data/component-detail-types";

export const BLOCK_DETAILS: Record<string, ComponentDetail> = {
	agent: {
		description:
			"A structured agent strategy/configuration surface with an app header, cover area, compact section navigation, section block wrappers, knowledge controls, and instructions composer.",
		importStatement: `import {
  Agent,
  AgentHeader,
  AgentContent,
  AgentConfigFields,
} from "@/components/blocks/agent";`,
		usage: `import {
  Agent,
  AgentHeader,
  AgentContent,
  AgentConfigFields,
} from "@/components/blocks/agent";

<Agent>
  <AgentHeader name="Policy Checker" model="Draft" />
  <AgentContent>
    <AgentConfigFields
      config={agentConfig}
      idPrefix="agent-config"
      onTextChange={handleTextChange}
      onListItemChange={updateListItem}
      onRemoveListItem={removeListItem}
      onAppendListItem={appendListItem}
    />
  </AgentContent>
</Agent>`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the outer container.",
			},
		],
		subComponents: [
			{ name: "AgentHeader", description: "Top app bar with agent avatar, name, status lozenge, and Configure/Test tabs (override via the `actions` prop)." },
			{ name: "AgentContent", description: "Body container for the agent configuration surface." },
			{ name: "AgentConfigFields", description: "Shared Figma-style agent strategy surface used by the catalog preview and Studio panel." },
			{ name: "AgentCompactHeaderNav", description: "Compact section navigation for Insights, Surfaces, Evaluation, Users, and Access." },
			{ name: "AgentCompactInsightsPanel", description: "Wrapper around the Agent Insights block for compact agent layouts." },
			{ name: "AgentCompactSurfacesPanel", description: "Wrapper around the Agent Surfaces block for compact agent layouts." },
			{ name: "AgentCompactEvaluationPanel", description: "Wrapper around the Agent Evaluation block for compact agent layouts." },
			{ name: "AgentCompactUsersPanel", description: "Wrapper around the Agent Users block for compact agent layouts." },
			{ name: "AgentCompactAccessPanel", description: "Wrapper around the Agent Access block for compact agent layouts." },
			{ name: "AgentInstructions", description: "Instruction text block with label." },
			{ name: "AgentTools", description: "Accordion container for tool definitions." },
			{ name: "AgentTool", description: "Individual tool item with expandable JSON schema." },
			{ name: "AgentOutput", description: "Output schema display with syntax highlighting." },
		],
		examples: [
			{ title: "Filled agent", description: "Agent strategy surface after configuration fields have been populated.", demoSlug: "agent-demo-full" },
			{ title: "Empty agent", description: "Default setup state with quick configuration links and Operations prompt starters before details are populated.", demoSlug: "agent-demo-empty" },
		],
	},
	"agent-bento": {
		description: "Two Rovo agent prompt-starter bentos: a tabbed landing variant with an auto-cycling category bar, a hero tile (\"Works with\" sources + \"Skills\"), and a \"Browse all\" pill; and a minimal five-tile \"Start with these agent templates\" row. Both use an avatar-colored hover glow and collapse from their desktop grid to a horizontal carousel below the lg breakpoint.",
		importStatement: `import { HomeStarterBento, AgentCompactOperationsBento } from "@/components/blocks/agent-bento";`,
		usage: `import {
  HomeStarterBento,
  AgentCompactOperationsBento,
} from "@/components/blocks/agent-bento";

// Full landing bento (tabs + hero tile + responsive carousel)
<HomeStarterBento
  onSelect={(prompt) => console.log(prompt)}
  onBrowseTemplates={(category) => console.log(category)}
  onDismiss={() => undefined}
/>

// Minimal "Start with these agent templates" row
<AgentCompactOperationsBento onDismiss={() => undefined} />`,
		demoLayout: { previewHeight: "fit" },
		props: [
			{
				name: "onSelect",
				type: "(prompt: string) => void",
				description: "HomeStarterBento: called when a tile is clicked, with its prompt. Defaults to a no-op.",
			},
			{
				name: "onBrowseTemplates",
				type: "(category: HomeStarterCategory) => void",
				description: "HomeStarterBento: called when the \"Browse all\" pill is clicked, with the active category. Defaults to a no-op.",
			},
			{
				name: "onPreviewStart",
				type: "(prompt: string) => void",
				description: "HomeStarterBento: called when a tile is hovered or focused, with its prompt. Defaults to a no-op.",
			},
			{
				name: "onPreviewEnd",
				type: "() => void",
				description: "HomeStarterBento: called when a tile preview should stop. Defaults to a no-op.",
			},
			{
				name: "onDismiss",
				type: "() => void",
				description: "Called when the \"Dismiss\" (HomeStarterBento) or \"Not now\" (AgentCompactOperationsBento) control is clicked. Defaults to a no-op.",
			},
		],
	},
	"editor-palette": {
		description: "Showcase of the rich text editor's suggestion menus across two layouts. The \"nested\" layout shows each top-level section (People and team, Subagents, Skills, Tools, Knowledge, Format) as a single list you click into; the \"flat\" layout expands every section inline, capped at five items with a \"Browse all\" footer (search icon) for sections backed by a directory and a \"View more\" footer (chevron) that expands the rest inline for the others. Both include a live editor where typing \"@\" or \"/\" opens the real popups.",
		importStatement: `import EditorPalette from "@/components/blocks/editor-palette/page";`,
		usage: `import EditorPalette from "@/components/blocks/editor-palette/page";

<EditorPalette variant="flat" />`,
		demoLayout: { previewHeight: "fit" },
		props: [
			{
				name: "mentionSources",
				type: "RichTextMentionSources",
				description: "Skill catalog that drives the live editor's \"/\" Skills submenu counts.",
			},
			{
				name: "variant",
				type: `"nested" | "flat"`,
				default: `"nested"`,
				description: "Showcase layout. \"nested\" shows each section as a single list you click into; \"flat\" expands every section inline with a \"Browse all\" / \"View more\" footer.",
			},
			{
				name: "showLiveEditor",
				type: "boolean",
				default: "true",
				description: "Render a live editor where typing \"@\" or \"/\" opens the real menus.",
			},
		],
		examples: [
			{ title: "Nested", description: "Each top-level section is a single list you click into to reveal its children.", demoSlug: "editor-palette-nested" },
			{ title: "Flat", description: "Every section is expanded inline, capped at five items with a \"Browse all\" or \"View more\" footer.", demoSlug: "editor-palette-flat" },
		],
	},
	"editor-toolbar": {
		description: "Reusable rich text editor toolbar with text style, formatting, list, alignment, link, add-content, rendered/Markdown mode tabs, and slot controls for Tiptap editor surfaces.",
		importStatement: `import { EditorToolbar } from "@/components/blocks/editor-toolbar";`,
		usage: `import { EditorToolbar } from "@/components/blocks/editor-toolbar";
import type { Editor } from "@tiptap/react";

function FormattingToolbar({ editor }: { editor: Editor }) {
  return <EditorToolbar editor={editor} />;
}`,
		demoLayout: { previewHeight: "default" },
		props: [
			{
				name: "editor",
				type: "Editor",
				required: true,
				description: "Tiptap editor instance that receives formatting commands and reports active selection state.",
			},
			{
				name: "className",
				type: "string",
				description: "Optional class names applied to the toolbar root.",
			},
			{
				name: "controlsClassName",
				type: "string",
				description: "Optional class names applied to the inner controls row.",
			},
			{
				name: "leadingSlot",
				type: "ReactNode",
				description: "Optional content rendered before the toolbar controls.",
			},
			{
				name: "endSlot",
				type: "ReactNode",
				description: "Optional content rendered at the end of the toolbar before the rendered/Markdown mode tabs.",
			},
			{
				name: "isMarkdownMode",
				type: "boolean",
				default: "false",
				description: "Marks the toolbar as controlling a Markdown source editor instead of the rendered Tiptap document.",
			},
			{
				name: "onToggleMarkdownMode",
				type: "() => void",
				description: "Called when the rendered/Markdown mode tabs request a mode change. When omitted, the mode tabs are hidden.",
			},
			{
				name: "onMarkdownFormat",
				type: "(kind: MarkdownFormatKind) => void",
				description: "Called for formatting actions while Markdown source mode is active.",
			},
		],
	},
	"agent-card": {
		description: "Figma-matched Rovo agent profile card with cover art, avatar attribution, partner byline, description, title actions, and an AI input affordance.",
		importStatement: `import { AgentCard } from "@/components/blocks/agent-card";`,
		usage: `import { AgentCard } from "@/components/blocks/agent-card";

<AgentCard
  name="Task Improver"
  partnerName="Atlassian"
  description="Proactively assists by automatically suggesting subtasks when you start adding one and providing comment summaries."
/>`,
		props: [
			{
				name: "name",
				type: "string",
				default: '"Task Improver"',
				description: "Agent name shown in the card header.",
			},
			{
				name: "partnerName",
				type: "string",
				default: '"Atlassian"',
				description: "Partner or creator name shown below the agent name.",
			},
			{
				name: "description",
				type: "string",
				description: "Agent summary copy shown in the body.",
			},
			{
				name: "avatarSrc",
				type: "string",
				default: '"/avatar-agent/teamwork-agents/blocker-checker.svg"',
				description: "Agent avatar asset.",
			},
			{
				name: "coverSrc",
				type: "string",
				description: "Cover artwork asset. Defaults to the avatar asset.",
			},
			{
				name: "inputPlaceholder",
				type: "string",
				default: '"Ask, @mention, or / for actions"',
				description: "Placeholder copy shown in the AI input affordance.",
			},
			{
				name: "inputActionLabel",
				type: "string",
				description: "Accessible label for the input affordance when it is actionable.",
			},
			{
				name: "swapActionLabel",
				type: "string",
				default: '"Chat with agent"',
				description: "Visible label for the compact header chat action.",
			},
			{
				name: "editActionLabel",
				type: "string",
				description: "Accessible label for the edit icon action.",
			},
			{
				name: "onInputAction",
				type: "() => void",
				description: "Called when the input affordance is selected.",
			},
			{
				name: "onSwapAction",
				type: "() => void",
				description: "Called when the compact header chat action is selected.",
			},
			{
				name: "onEditAction",
				type: "() => void",
				description: "Called when the edit icon action is selected.",
			},
			{
				name: "onMoreAction",
				type: "() => void",
				description: "Called when the more-actions icon button is selected.",
			},
			{
				name: "onVoiceInput",
				type: "() => void",
				description: "Called when the waveform icon button is selected.",
			},
		],
	},
	"agents-directory": {
		description: "Dialog-based agents directory for browsing recommended, team, partner, and session-created agents.",
		importStatement: `import { AgentsDirectoryDialog } from "@/components/blocks/agents-directory";`,
		usage: `import { AgentsDirectoryDialog } from "@/components/blocks/agents-directory";
import type { AgentsDirectoryAgent, AgentsDirectoryTemplateAgent } from "@/components/blocks/agents-directory";

const agents: AgentsDirectoryAgent[] = [
  {
    id: "feedback-analyzer",
    name: "Feedback Analyzer",
    byline: "Product agent by Atlassian",
    avatarSrc: "/avatar-agent/product-agents/feedback-analyzer.svg",
    description: "Clusters customer feedback and surfaces themes.",
  },
];

const templates: AgentsDirectoryTemplateAgent[] = [];

<AgentsDirectoryDialog
  open={open}
  onOpenChange={setOpen}
  agents={agents}
  templateAgents={templates}
  onCreateAgent={() => console.log("Create agent")}
  onSelectAgent={(agent) => console.log(agent.id)}
  onSelectTemplateAgent={(template) => console.log(template.id)}
/>`,
		demoLayout: { previewHeight: "fixed" },
		props: [
			{
				name: "agents",
				type: "readonly AgentsDirectoryAgent[]",
				required: true,
				description: "Base catalog agents shown in the directory.",
			},
			{
				name: "sessionAgents",
				type: "readonly AgentsDirectoryAgent[]",
				description: "Runtime-created agents appended to the catalog.",
			},
			{
				name: "templateAgents",
				type: "readonly AgentsDirectoryTemplateAgent[]",
				description: "Template catalog entries shown under the Agent templates sidebar section.",
			},
			{
				name: "sessionTemplateAgents",
				type: "readonly AgentsDirectoryTemplateAgent[]",
				description: "Runtime-created template entries appended to the template catalog.",
			},
			{
				name: "open",
				type: "boolean",
				required: true,
				description: "Controlled dialog open state.",
			},
			{
				name: "onOpenChange",
				type: "(open: boolean) => void",
				required: true,
				description: "Called when the dialog requests an open-state change.",
			},
			{
				name: "onCreateAgent",
				type: "() => void",
				description: "Optional handler for the New agent action in the modal header.",
			},
			{
				name: "onSelectAgent",
				type: "(agent: AgentsDirectoryAgent) => void",
				description: "Called when an agent card or sidebar agent is selected.",
			},
			{
				name: "onSelectTemplateAgent",
				type: "(agent: AgentsDirectoryTemplateAgent) => void",
				description: "Called when an agent template tile is selected.",
			},
			{
				name: "sidebarGroups",
				type: "readonly AgentsDirectorySidebarGroup[]",
				description: "Optional sidebar grouping override. Defaults to the Studio directory grouping.",
			},
			{
				name: "title",
				type: "string",
				description: "Optional dialog title. Defaults to the underlying browser dialog title.",
			},
		],
	},
	"agent-templates": {
		description: "Strategy-style dialog for browsing personal agent templates with category controls and a horizontal template carousel.",
		importStatement: `import { AgentTemplatesDialog } from "@/components/blocks/agent-templates";`,
		usage: `import { AgentTemplatesDialog } from "@/components/blocks/agent-templates";
import type { AgentTemplatesAgent } from "@/components/blocks/agent-templates";

// Cards render via CardDirectoryAgentExpanded. The detail fields below are
// optional — omit them and the card falls back to identity + a derived publisher.
const agents: AgentTemplatesAgent[] = [
  {
    id: "feedback-analyzer",
    name: "Feedback Analyzer",
    byline: "Product agent by Atlassian",
    avatarSrc: "/avatar-agent/product-agents/feedback-analyzer.svg",
    description: "Clusters customer feedback and surfaces themes.",
    verified: true,
    capabilities: [
      "Surfaces recurring themes from raw feedback",
      "Scores sentiment shifts across releases",
      "Drafts a weekly digest for your team",
    ],
    sources: [
      { id: "jira", label: "Jira", provider: "jira" },
      { id: "confluence", label: "Confluence", provider: "confluence" },
    ],
    skills: [
      { color: "software", label: "jql-search" },
      { color: "teamwork", label: "theme-grouping" },
    ],
    stats: [
      { label: "Remix", value: "1.4K" },
      { label: "Last update", value: "2 weeks ago" },
    ],
  },
];

<AgentTemplatesDialog
  open={open}
  onOpenChange={setOpen}
  agents={agents}
  onSelectAgent={(agent) => console.log(agent.id)}
/>`,
		demoLayout: { previewHeight: "fixed" },
		props: [
			{
				name: "agents",
				type: "readonly AgentTemplatesAgent[]",
				required: true,
				description: "Base template cards shown in the carousel.",
			},
			{
				name: "sessionAgents",
				type: "readonly AgentTemplatesAgent[]",
				description: "Runtime-created templates appended to the catalog.",
			},
			{
				name: "open",
				type: "boolean",
				required: true,
				description: "Controlled dialog open state.",
			},
			{
				name: "onOpenChange",
				type: "(open: boolean) => void",
				required: true,
				description: "Called when the dialog requests an open-state change.",
			},
			{
				name: "onSelectAgent",
				type: "(agent: AgentTemplatesAgent) => void",
				description: "Called when a template card is selected.",
			},
			{
				name: "sidebarGroups",
				type: "readonly AgentTemplatesSidebarGroup[]",
				description: "Accepted for compatibility; ignored by this layout because it has no sidebar.",
			},
			{
				name: "title",
				type: "string",
				description: "Optional dialog heading. Defaults to the Strategy heading copy.",
			},
		],
	},
	"tools-directory": {
		description: "Figma-matched tools directory for browsing app categories, inspecting a tool, and adding or removing it from an agent.",
		importStatement: `import { ToolsDirectoryDialog } from "@/components/blocks/tools-directory";`,
		usage: `import { ToolsDirectoryDialog } from "@/components/blocks/tools-directory";
import type { ToolsDirectoryTool } from "@/components/blocks/tools-directory";

const tools: ToolsDirectoryTool[] = [
  {
    id: "atlassian",
    name: "Atlassian",
    byline: "Collaboration tools by Atlassian",
    categoryId: "project-management",
    description: "Specializes in collaboration tools designed primarily for software development and project management.",
    logoName: "atlassian",
    publisherName: "Atlassian",
    toolCount: 36,
    teammateCount: 258,
    verified: true,
  },
];

<ToolsDirectoryDialog
  open={open}
  onOpenChange={setOpen}
  tools={tools}
  defaultAddedToolIds={["atlassian"]}
  onSelectTool={(tool) => console.log(tool.id)}
/>`,
		demoLayout: { previewHeight: "fixed" },
		props: [
			{
				name: "tools",
				type: "readonly ToolsDirectoryTool[]",
				required: true,
				description: "Base catalog tools shown in the directory.",
			},
			{
				name: "sessionTools",
				type: "readonly ToolsDirectoryTool[]",
				description: "Runtime-created tools appended to the catalog.",
			},
			{
				name: "addedToolIds",
				type: "readonly string[]",
				description: "Controlled list of tool IDs already added to the current agent.",
			},
			{
				name: "defaultAddedToolIds",
				type: "readonly string[]",
				description: "Initial uncontrolled list of tool IDs already added to the current agent.",
			},
			{
				name: "onAddedToolIdsChange",
				type: "(toolIds: readonly string[]) => void",
				description: "Called after Add to agent or Remove changes the selected tool's added state.",
			},
			{
				name: "onCreateTool",
				type: "() => void",
				description: "Optional handler for the New tool action in the modal header.",
			},
			{
				name: "open",
				type: "boolean",
				required: true,
				description: "Controlled dialog open state.",
			},
			{
				name: "onOpenChange",
				type: "(open: boolean) => void",
				required: true,
				description: "Called when the dialog requests an open-state change.",
			},
			{
				name: "onSelectTool",
				type: "(tool: ToolsDirectoryTool) => void",
				description: "Called when a tool card or sidebar tool is selected.",
			},
			{
				name: "sidebarGroups",
				type: "readonly ToolsDirectorySidebarGroup[]",
				description: "Optional legacy sidebar groups rendered below the category list.",
			},
			{
				name: "title",
				type: "string",
				description: "Optional dialog title. Defaults to the tools directory title.",
			},
		],
	},
	"skills-directory": {
		description: "Skill-specific directory modal with multi-select cards, bulk selected-skill actions, and a learn-more detail view for each skill.",
		importStatement: `import { SkillsDirectoryDialog } from "@/components/blocks/skills-directory";`,
		usage: `import { SkillsDirectoryDialog } from "@/components/blocks/skills-directory";
import type { SkillsDirectorySkill } from "@/components/blocks/skills-directory";

const skills: SkillsDirectorySkill[] = [
  {
    id: "design-landing-page",
    name: "Design landing page",
    description: "Create high-converting, visually distinctive landing pages.",
    icon: "paint-palette",
    iconColor: "text-purple-500",
    publisherName: "By you",
    publisherAvatarSrc: "/avatar-human/maia-ma.png",
    categoryId: "content-and-communication",
    companyId: "you",
    starCount: 38,
    viewCount: 6273,
    tools: [{ id: "tool-1", name: "Tool1", icon: "page" }],
    instructions: "# Design landing page\\n\\nCreate a distinctive landing page.",
  },
];

<SkillsDirectoryDialog
  open={open}
  onOpenChange={setOpen}
  skills={skills}
  onSelectedSkillIdsChange={(skillIds) => console.log(skillIds)}
  onAddSkills={(skillIds) => console.log("add", skillIds)}
  onCreateSkill={() => console.log("new skill")}
/>`,
		demoLayout: { previewHeight: "fixed" },
		props: [
			{
				name: "skills",
				type: "readonly SkillsDirectorySkill[]",
				description: "Skill catalog rendered in the grid. Defaults to the bundled demo skills.",
			},
			{
				name: "sessionSkills",
				type: "readonly SkillsDirectorySkill[]",
				description: "Runtime-created skills appended after the catalog.",
			},
			{
				name: "selectedSkillIds",
				type: "readonly string[]",
				description: "Controlled multi-select state for selected skill cards.",
			},
			{
				name: "defaultSelectedSkillIds",
				type: "readonly string[]",
				description: "Initial uncontrolled selected skill ids.",
			},
			{
				name: "open",
				type: "boolean",
				required: true,
				description: "Controlled dialog open state.",
			},
			{
				name: "onOpenChange",
				type: "(open: boolean) => void",
				required: true,
				description: "Called when the dialog requests an open-state change.",
			},
			{
				name: "onSelectSkill",
				type: "(skill: SkillsDirectorySkill) => void",
				description: "Called when a skill card toggles selection.",
			},
			{
				name: "onSelectedSkillIdsChange",
				type: "(skillIds: readonly string[]) => void",
				description: "Called whenever the selected skill ids change.",
			},
			{
				name: "onAddSkills",
				type: "(skillIds: readonly string[], skills: readonly SkillsDirectorySkill[]) => void",
				description: "Called by the selected-skills toolbar Add skills action.",
			},
			{
				name: "onCreateShareLink",
				type: "(skillIds: readonly string[], skills: readonly SkillsDirectorySkill[]) => void",
				description: "Called by the selected-skills toolbar share action.",
			},
			{
				name: "onFavoriteSkills",
				type: "(skillIds: readonly string[], skills: readonly SkillsDirectorySkill[]) => void",
				description: "Called by the selected-skills toolbar favorite action.",
			},
			{
				name: "onDownloadSkills",
				type: "(skillIds: readonly string[], skills: readonly SkillsDirectorySkill[]) => void",
				description: "Called by the selected-skills toolbar download action.",
			},
			{
				name: "onOpenSkill",
				type: "(skill: SkillsDirectorySkill) => void",
				description: "Called by the skill info page Open split button.",
			},
			{
				name: "onTryInChat",
				type: "(skill: SkillsDirectorySkill) => void",
				description: "Called by the skill info page Try in chat action.",
			},
			{
				name: "onCreateSkill",
				type: "() => void",
				description: "Called by the New skill button.",
			},
			{
				name: "primaryItems",
				type: "readonly SkillsDirectoryPrimaryItem[]",
				description: "Sectionless nav rows above the category group (All skills, Favourite skills, Your skills).",
			},
			{
				name: "sidebarGroups",
				type: "readonly SkillsDirectorySidebarGroup[]",
				description: "Optional left-nav grouping override. Defaults to Category and By companies groups.",
			},
			{
				name: "title",
				type: "string",
				description: "Optional dialog title. Defaults to “Browse all”.",
			},
			{
				name: "agents / sessionAgents / onSelectAgent",
				type: "compatibility aliases",
				description: "Legacy Agents Directory-style props are still accepted and normalized into skill records.",
			},
		],
	},
	"knowledge-directory": {
		description: "Knowledge directory block for connecting external knowledge apps, choosing all content, or narrowing to selected content rows.",
		importStatement: `import { KnowledgeDirectoryDialog } from "@/components/blocks/knowledge-directory";`,
		usage: `import { KnowledgeDirectoryDialog } from "@/components/blocks/knowledge-directory";
import { ConfluenceIcon } from "@/components/ui/logo";
import type { KnowledgeDirectoryApp } from "@/components/blocks/knowledge-directory";

const apps: KnowledgeDirectoryApp[] = [
  {
    id: "confluence",
    name: "Confluence",
    description: "Create, organize, and reuse rich pages and decisions.",
    providerName: "Atlassian",
    icon: <ConfluenceIcon label="" size="small" />,
    contents: [
      {
        id: "product-requirements",
        name: "Product requirements",
        description: "Specs, goals, and release criteria.",
      },
    ],
  },
];

<KnowledgeDirectoryDialog
  open={open}
  onOpenChange={setOpen}
  apps={apps}
  onBrowseFiles={() => console.log("browse files")}
  onAddKnowledge={(payload) => console.log("add knowledge", payload)}
/>`,
		demoLayout: { previewHeight: "fixed" },
		props: [
			{
				name: "apps",
				type: "readonly KnowledgeDirectoryApp[]",
				description: "Knowledge connector apps rendered in the app grid. Defaults to the bundled demo connectors.",
			},
			{
				name: "selectedAppId",
				type: "string | null",
				description: "Controlled selected connector id. When null, the dialog shows the app list.",
			},
			{
				name: "defaultSelectedAppId",
				type: "string | null",
				description: "Initial uncontrolled connector id.",
			},
			{
				name: "selectedMode",
				type: "\"all\" | \"custom\"",
				description: "Controlled content scope mode.",
			},
			{
				name: "defaultSelectedMode",
				type: "\"all\" | \"custom\"",
				description: "Initial uncontrolled content scope mode. Defaults to \"all\".",
			},
			{
				name: "selectedContentIds",
				type: "readonly string[]",
				description: "Controlled selected content ids for custom content mode.",
			},
			{
				name: "defaultSelectedContentIds",
				type: "readonly string[]",
				description: "Initial uncontrolled selected content ids for custom content mode.",
			},
			{
				name: "open",
				type: "boolean",
				required: true,
				description: "Controlled dialog open state.",
			},
			{
				name: "onOpenChange",
				type: "(open: boolean) => void",
				required: true,
				description: "Called when the dialog requests an open-state change.",
			},
			{
				name: "onBrowseFiles",
				type: "() => void",
				description: "Optional file browser callback for the upload-zone button.",
			},
			{
				name: "onSelectApp",
				type: "(app: KnowledgeDirectoryApp) => void",
				description: "Called when a connector app is selected.",
			},
			{
				name: "onSelectedAppIdChange",
				type: "(appId: string | null) => void",
				description: "Called whenever the selected connector id changes.",
			},
			{
				name: "onSelectMode",
				type: "(mode: KnowledgeDirectoryMode) => void",
				description: "Called when the user chooses all content or custom content.",
			},
			{
				name: "onSelectedContentIdsChange",
				type: "(contentIds: readonly string[]) => void",
				description: "Called whenever custom selected content ids change.",
			},
			{
				name: "onAddKnowledge",
				type: "(payload: { appId: string; mode: KnowledgeDirectoryMode; contentIds: \"all\" | readonly string[] }) => void",
				description: "Called by the Add button with the selected app and content scope.",
			},
			{
				name: "title",
				type: "string",
				description: "Optional dialog title. Defaults to “Browse knowledge”.",
			},
		],
	},
	"agent-users": {
		description: "Users screen for managing who has access to a Rovo agent. Shows an access settings card (Owner, Author display name, and an Open-to-all-users switch) plus a selectable People table with role lozenges, and an Add user dialog for granting access at a chosen role.",
		importStatement: `import { AgentUsers, AddUserDialog } from "@/components/blocks/agent-users";`,
		usage: `import { AgentUsers } from "@/components/blocks/agent-users";

<AgentUsers
  defaultOpenToAll
  learnMoreHref="https://support.atlassian.com/rovo/"
/>`,
		props: [
			{
				name: "owner",
				type: "AgentPerson",
				description: "Person shown in the Owner row. Defaults to the sample owner.",
			},
			{
				name: "authorDisplay",
				type: "AgentPerson",
				description: "Person or team shown in the Author display name row.",
			},
			{
				name: "people",
				type: "readonly AgentPerson[]",
				description: "Initial people list rendered in the table. The block manages additions locally.",
			},
			{
				name: "defaultOpenToAll",
				type: "boolean",
				description: "Initial state of the User access switch. Defaults to true.",
			},
			{
				name: "learnMoreHref",
				type: "string",
				description: "Destination for the “More about Rovo agent users and permissions” link.",
			},
		],
	},
	"conversation-starters": {
		description: "Modal for editing an agent's conversation starters: a fixed set of up to maxStarters (default 3) rows you can reorder by dragging, give each its own icon, clear, or fill all at once with “Generate for me”.",
		importStatement: `import { ConversationStartersDialog } from "@/components/blocks/conversation-starters";`,
		usage: `import { ConversationStartersDialog } from "@/components/blocks/conversation-starters";
import type { ConversationStarter } from "@/components/blocks/conversation-starters";

const [open, setOpen] = useState(false);
const [starters, setStarters] = useState<readonly ConversationStarter[]>([
  { id: "s1", text: "Summarize this project's status", icon: "ai-sparkle" },
  { id: "s2", text: "What are the open risks?", icon: "question-circle" },
]);

<ConversationStartersDialog
  open={open}
  onOpenChange={setOpen}
  starters={starters}
  maxStarters={3}
  onSave={setStarters}
  onGenerate={async () => fetchSuggestedStarters()}
/>`,
		demoLayout: { previewHeight: "fixed" },
		props: [
			{
				name: "open",
				type: "boolean",
				required: true,
				description: "Controlled dialog open state.",
			},
			{
				name: "onOpenChange",
				type: "(open: boolean) => void",
				required: true,
				description: "Called when the dialog requests an open-state change (Cancel, close, or after Save).",
			},
			{
				name: "starters",
				type: "readonly ConversationStarter[]",
				description: "Controlled starter list. The dialog seeds an internal draft from this each time it opens.",
			},
			{
				name: "defaultStarters",
				type: "readonly ConversationStarter[]",
				description: "Initial uncontrolled starter list when `starters` is omitted.",
			},
			{
				name: "onSave",
				type: "(starters: readonly ConversationStarter[]) => void",
				description: "Called by the primary (Add) button with the trimmed, non-empty starters.",
			},
			{
				name: "onStartersChange",
				type: "(starters: readonly ConversationStarter[]) => void",
				description: "Called alongside save with the committed starters; use for uncontrolled persistence.",
			},
			{
				name: "onGenerate",
				type: "() => readonly ConversationStarter[] | Promise<readonly ConversationStarter[]>",
				description: "Backs the “Generate for me” button. When omitted, a built-in sample set is used. The button shows a loading state while awaiting an async result.",
			},
			{
				name: "maxStarters",
				type: "number",
				description: "Number of starter rows always shown. Defaults to 3.",
			},
			{
				name: "iconOptions",
				type: "readonly StarterIconOption[]",
				description: "Override the icon set shown in the per-starter picker. Defaults to STARTER_ICON_OPTIONS.",
			},
			{
				name: "title",
				type: "string",
				description: "Optional dialog title. Defaults to “Conversation starters”.",
			},
			{
				name: "saveLabel",
				type: "string",
				description: "Optional primary button label. Defaults to “Add”.",
			},
			{
				name: "placeholder",
				type: "string",
				description: "Optional input placeholder. Defaults to “Write a new conversation starter”.",
			},
		],
	},
	"agent-access": {
		description:
			"Agent “Access” settings screen: choose whether an agent acts as the requesting user or via its own account (with a confirmation warning that switching to the agent account exposes its data to all users), plus Atlassian app-access and connected-app summaries shown for the agent-account mode.",
		importStatement: `import { AgentAccess } from "@/components/blocks/agent-access";`,
		usage: `import { AgentAccess } from "@/components/blocks/agent-access";
import type { AgentAccessMode } from "@/components/blocks/agent-access";

const [mode, setMode] = useState<AgentAccessMode>("requesting-user");

<AgentAccess
  value={mode}
  onValueChange={setMode}
  onGoToAgentDetails={() => navigate("/agent/details")}
/>`,
		demoLayout: { previewHeight: "fixed" },
		props: [
			{
				name: "value",
				type: '"requesting-user" | "agent-account"',
				description: "Controlled selected access mode.",
			},
			{
				name: "defaultValue",
				type: '"requesting-user" | "agent-account"',
				default: '"requesting-user"',
				description: "Initial mode for uncontrolled usage.",
			},
			{
				name: "onValueChange",
				type: "(value: AgentAccessMode) => void",
				description: "Fires after a mode change is confirmed (post-warning for the agent account).",
			},
			{
				name: "atlassianApps",
				type: "readonly AtlassianAppAccess[]",
				description: "Atlassian apps the agent account has been granted/denied access to. Defaults to a Confluence row.",
			},
			{
				name: "connectedApps",
				type: "readonly ConnectedApp[]",
				description: "Third-party apps available once connected. Empty renders the empty state.",
			},
			{
				name: "onGoToAgentDetails",
				type: "() => void",
				description: "Invoked by the connected-apps empty-state action.",
			},
		],
	},
	"agent-evaluation": {
		description:
			"Agent “Evaluation” screen for compact agent sections. Builders create datasets (CSV prompts/responses) to simulate agent responses, then configure and run evaluations that score how consistently the agent performs.",
		importStatement: `import { AgentEvaluation } from "@/components/blocks/agent-evaluation";`,
		usage: `import { AgentEvaluation } from "@/components/blocks/agent-evaluation";

<AgentEvaluation
  datasets={datasets}
  agents={agents}
  evaluationTypes={evaluationTypes}
  completedEvaluations={completedEvaluations}
/>`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{ name: "agents", type: "AgentEvaluationAgentOption[]", description: "Agents (and versions) available to evaluate, shown in the agent select." },
			{ name: "datasets", type: "AgentEvaluationDatasetOption[]", description: "Datasets available to evaluate against. Empty renders the dataset empty state." },
			{ name: "evaluationTypes", type: "AgentEvaluationTypeOption[]", description: "Evaluation strategies (e.g. Response Accuracy, Resolution Rate, Manual Testing)." },
			{ name: "completedEvaluations", type: "AgentEvaluationCompletedRow[]", description: "Rows for the completed evaluations table. Empty renders the empty-state row." },
			{ name: "className", type: "string", description: "Additional classes applied to the outer container." },
		],
		examples: [
			{ title: "Empty state", description: "Default Evaluation screen before any datasets or evaluations exist.", demoSlug: "agent-evaluation" },
			{ title: "With data", description: "Datasets present and a completed evaluation listed in the results table.", demoSlug: "agent-evaluation-demo-filled" },
		],
	},
	"agent-insights": {
		description:
			"Agent “Insights” screen for reviewing adoption, answer quality, feedback mix, top topics, and recommended improvements for an agent.",
		importStatement: `import { AgentInsights } from "@/components/blocks/agent-insights";`,
		usage: `import { AgentInsights } from "@/components/blocks/agent-insights";

<AgentInsights />`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{ name: "className", type: "string", description: "Additional classes applied to the outer container." },
		],
	},
	"agent-surfaces": {
		description:
			"Agent “Surfaces” screen for choosing where an agent appears across Atlassian apps and connected channels, including default surfaces and extended channel entry points.",
		importStatement: `import { AgentSurfaces } from "@/components/blocks/agent-surfaces";`,
		usage: `import { AgentSurfaces } from "@/components/blocks/agent-surfaces";

<AgentSurfaces />`,
		demoLayout: { previewHeight: "fixed" },
		props: [
			{ name: "className", type: "string", description: "Additional classes applied to the outer container." },
		],
	},
	"mermaid-diagram": {
		description: "Dedicated Mermaid diagram block rendered through Streamdown’s Mermaid plugin so fenced mermaid content becomes an interactive SVG diagram instead of a plain code block.",
		usage: `import MermaidDiagram from "@/components/blocks/mermaid-diagram/page";

<MermaidDiagram />`,
	},
	cursor: {
		description: "AI-powered IDE layout with a file tree sidebar, syntax-highlighted code editor, integrated terminal, and an AI chat panel featuring plans, task queues, message streaming, and checkpoints.",
	},
	"agent-progress": {
		description: "ADS-style agent progress tracker with expandable task status groups, live elapsed timer, and agent attribution.",
		usage: `import AgentsProgress from "@/components/blocks/agent-progress/page";

<AgentsProgress />
<AgentsProgress runStatus="completed" defaultCollapsed />
<AgentsProgress runStatus="failed" />`,
		props: [
			{
				name: "planTitle",
				type: "string",
				default: '"Flexible Friday Plan"',
				description: "Title displayed in the progress header.",
			},
			{
				name: "planVisualIdentity",
				type: '{ iconName: string; tileVariant: "gray" | "blue" | "teal" | "green" | "lime" | "yellow" | "orange" | "red" | "magenta" | "purple" }',
				description: "Icon tile identity shown in the progress header.",
			},
			{
				name: "taskStatusGroups",
				type: "ProgressStatusGroups",
				description: "Object with done, inReview, inProgress, failed, and todo task arrays.",
			},
			{
				name: "runStatus",
				type: '"running" | "completed" | "failed"',
				default: '"running"',
				description: "Current execution status of the run.",
			},
			{
				name: "runCreatedAt",
				type: "string | null",
				description: "ISO timestamp when the run started. Used for elapsed time calculation.",
			},
			{
				name: "runCompletedAt",
				type: "string | null",
				description: "ISO timestamp when the run finished. Stops the elapsed timer.",
			},
			{
				name: "runCount",
				type: "number",
				default: "1",
				description: "Number of runs displayed in the status bar.",
			},
			{
				name: "agentCount",
				type: "number",
				default: "10",
				description: "Number of agents shown in the running status text.",
			},
			{
				name: "defaultCollapsed",
				type: "boolean",
				default: "false",
				description: "When true, hides the task list and status bar, showing only the header.",
			},
		],
		examples: [
			{ title: "Running", description: "Default running state with mixed task progress.", demoSlug: "agent-progress-demo-running" },
			{ title: "Completed", description: "Completed run with all tasks done.", demoSlug: "agent-progress-demo-completed" },
			{ title: "Failed", description: "Failed run with remaining tasks.", demoSlug: "agent-progress-demo-failed" },
			{ title: "Collapsed", description: "Compact header-only view for completed runs.", demoSlug: "agent-progress-demo-collapsed" },
			{ title: "Collapsed (running)", description: "Compact header-only view while still running.", demoSlug: "agent-progress-demo-collapsed-running" },
			{ title: "With agents", description: "Tasks with agent attribution badges.", demoSlug: "agent-progress-demo-with-agents" },
			{ title: "Early progress", description: "Run just started with mostly todo tasks.", demoSlug: "agent-progress-demo-early-progress" },
			{ title: "Multiple runs", description: "Progress tracker showing multiple run count.", demoSlug: "agent-progress-demo-multiple-runs" },
			{ title: "All states", description: "Running, completed, and failed states side by side.", demoSlug: "agent-progress-demo-all-states" },
		],
	},
	"agent-selector": {
		description: "Searchable command-list selector for assigning AI agents, with selected agents pinned first, optional selected-agent actions, and optional browse/create actions.",
		importStatement: `import { AgentSelector } from "@/components/blocks/agent-selector";`,
		usage: `import { AgentSelector } from "@/components/blocks/agent-selector";
import type { AgentSelectorAgent } from "@/components/blocks/agent-selector";

const agents: AgentSelectorAgent[] = [
  {
    id: "github-copilot",
    name: "GitHub Copilot",
    byline: "Agent by GitHub",
    avatarSrc: "/3p/github/24.svg",
  },
];

<AgentSelector
  agents={agents}
  selectedAgentIds={["github-copilot"]}
  onAgentToggle={(agentId) => console.log(agentId)}
  onBrowseAgents={() => console.log("browse agents")}
  onCreateAgent={() => console.log("create agent")}
/>`,
		demoLayout: { previewHeight: "fixed" },
		examples: [
			{ title: "Selected agent actions", description: "Top actions for a selected custom agent before switching to another agent.", demoSlug: "agent-selector-demo-selected-agent-actions" },
		],
		props: [
			{
				name: "agents",
				type: "readonly AgentSelectorAgent[]",
				required: true,
				description: "Agents to render in the selector.",
			},
			{
				name: "selectedAgentIds",
				type: "readonly string[]",
				description: "Selected agent ids. Selected agents remain pinned above unselected agents when there is no active search, and matching selected agents stay first while filtering.",
			},
			{
				name: "onAgentToggle",
				type: "(agentId: string) => void",
				description: "Called when an agent row is selected.",
			},
			{
				name: "onBrowseAgents",
				type: "() => void",
				description: "Shows the footer browse action and runs when Browse agents is selected.",
			},
			{
				name: "onCreateAgent",
				type: "() => void",
				description: "Shows the footer action and runs when Create agent is selected.",
			},
			{
				name: "query",
				type: "string",
				description: "Controlled search value.",
			},
			{
				name: "onQueryChange",
				type: "(query: string) => void",
				description: "Called when the search input changes.",
			},
			{
				name: "selectionMode",
				type: '"multiple" | "single"',
				default: '"multiple"',
				description: "Controls whether selected rows render with multi-select checkbox semantics and checkmarks.",
			},
			{
				name: "selectedAgentActions",
				type: "readonly AgentSelectorAction[]",
				description: "Optional actions rendered above the switch-agent list for the currently selected agent.",
			},
		],
	},
	"task-progress": {
		description: "ADS-style agent progress tracker with expandable task status groups, live elapsed timer, and agent attribution.",
		usage: `import TaskProgress from "@/components/blocks/task-progress/page";

<TaskProgress />
<TaskProgress runStatus="completed" defaultCollapsed />
<TaskProgress runStatus="failed" />`,
		props: [
			{
				name: "planTitle",
				type: "string",
				default: '"Flexible Friday Plan"',
				description: "Title displayed in the progress header.",
			},
			{
				name: "planVisualIdentity",
				type: '{ iconName: string; tileVariant: "gray" | "blue" | "teal" | "green" | "lime" | "yellow" | "orange" | "red" | "magenta" | "purple" }',
				description: "Icon tile identity shown in the progress header.",
			},
			{
				name: "taskStatusGroups",
				type: "ProgressStatusGroups",
				description: "Object with done, inReview, inProgress, failed, and todo task arrays.",
			},
			{
				name: "runStatus",
				type: '"running" | "completed" | "failed"',
				default: '"running"',
				description: "Current execution status of the run.",
			},
			{
				name: "runCreatedAt",
				type: "string | null",
				description: "ISO timestamp when the run started. Used for elapsed time calculation.",
			},
			{
				name: "runCompletedAt",
				type: "string | null",
				description: "ISO timestamp when the run finished. Stops the elapsed timer.",
			},
			{
				name: "runCount",
				type: "number",
				default: "1",
				description: "Number of runs displayed in the status bar.",
			},
			{
				name: "agentCount",
				type: "number",
				default: "10",
				description: "Number of agents shown in the running status text.",
			},
			{
				name: "defaultCollapsed",
				type: "boolean",
				default: "false",
				description: "When true, hides the task list and status bar, showing only the header.",
			},
		],
		examples: [
			{ title: "Running", description: "Default running state with mixed task progress.", demoSlug: "task-progress-demo-running" },
			{ title: "Completed", description: "Completed run with all tasks done.", demoSlug: "task-progress-demo-completed" },
			{ title: "Failed", description: "Failed run with remaining tasks.", demoSlug: "task-progress-demo-failed" },
			{ title: "Collapsed", description: "Compact header-only view for completed runs.", demoSlug: "task-progress-demo-collapsed" },
			{ title: "Collapsed (running)", description: "Compact header-only view while still running.", demoSlug: "task-progress-demo-collapsed-running" },
			{ title: "With agents", description: "Tasks with agent attribution badges.", demoSlug: "task-progress-demo-with-agents" },
			{ title: "Early progress", description: "Run just started with mostly todo tasks.", demoSlug: "task-progress-demo-early-progress" },
			{ title: "Multiple runs", description: "Progress tracker showing multiple run count.", demoSlug: "task-progress-demo-multiple-runs" },
			{ title: "All states", description: "Running, completed, and failed states side by side.", demoSlug: "task-progress-demo-all-states" },
		],
	},
	triggers: {
		description:
			"Agent automation trigger editor. Starts from an add-trigger affordance, supports a searchable nested trigger picker, configured trigger rows, compact parameter menus, remove controls, and UI-only connection states.",
		usage: `import Triggers from "@/components/blocks/triggers/page";
import { DEFAULT_CONFIGURED_TRIGGER_VALUES } from "@/components/blocks/triggers/data/trigger-catalog";

<Triggers />
<Triggers defaultPickerOpen />
<Triggers defaultTriggers={DEFAULT_CONFIGURED_TRIGGER_VALUES} />`,
		props: [
			{
				name: "triggers",
				type: "readonly AgentTriggerValue[]",
				description: "Controlled trigger definitions.",
			},
			{
				name: "defaultTriggers",
				type: "readonly AgentTriggerValue[]",
				description: "Initial trigger definitions for uncontrolled usage.",
			},
			{
				name: "defaultPickerOpen",
				type: "boolean",
				default: "false",
				description: "Opens the picker on first render for demos and visual state coverage.",
			},
			{
				name: "addTriggerLabel",
				type: "string",
				default: '"Add Trigger"',
				description: "Label for the add-trigger affordance.",
			},
			{
				name: "onTriggersChange",
				type: "(triggers: readonly AgentTriggerValue[]) => void",
				description: "Invoked whenever trigger definitions change.",
			},
			{
				name: "onConnectTrigger",
				type: "(trigger: AgentTriggerValue) => void",
				description: "Invoked when a connection CTA is pressed.",
			},
			{
				name: "hasTrigger",
				type: "boolean",
				description: "Legacy compatibility only. Explicit true seeds configured demo triggers.",
			},
		],
		examples: [
			{ title: "Empty", description: "Add-only state with no trigger configured.", demoSlug: "triggers-demo-empty" },
			{ title: "Picker", description: "Searchable provider picker with nested event menus.", demoSlug: "triggers-demo-picker" },
			{ title: "Configured", description: "Scheduled and repository event triggers with compact parameters.", demoSlug: "triggers-demo-configured" },
			{ title: "Multiple", description: "Multiple configured triggers with connector rhythm.", demoSlug: "triggers-demo-multiple" },
			{ title: "Needs connection", description: "Connection-required trigger with inline connect CTA.", demoSlug: "triggers-demo-needs-connection" },
		],
	},
	"app-sidebar": {
		description: "Application sidebar with main navigation, documents, secondary nav, and user menu.",
	},
	"answer-card": {
		description: "Displays captured question/answer pairs as a compact summary card. Typically rendered after a user submits answers to a QuestionCard.",
		demoLayout: { previewHeight: "default" },
		usage: `import { AnswerCard } from "@/components/blocks/answer-card/page";
import type { AnswerCardRow } from "@/components/blocks/answer-card/page";

const rows: AnswerCardRow[] = [
  { question: "What type of data?", answer: "Product metrics" },
  { question: "Which chart types?", answer: "Line and bar" },
];

<AnswerCard rows={rows} />
<AnswerCard label="Your answers" rows={rows} />`,
		props: [
			{
				name: "rows",
				type: "ReadonlyArray<AnswerCardRow>",
				required: true,
				description: "Ordered list of question/answer pairs to display.",
			},
			{
				name: "label",
				type: "string",
				default: '"Your answers"',
				description: "Header label displayed in the card header.",
			},
			{
				name: "defaultCollapsed",
				type: "boolean",
				default: "false",
				description: "Whether the card starts in a collapsed state.",
			},
		],
	},
	"rovo-canvas": {
		description: "Full-screen Rovo canvas chrome extracted as a VPK-native shell: per-kind artefact tabs, code artefact toolbar controls, version history, select mode, and the shared VPK sidebar chat rail without kg-prototyping generation state or demo content.",
		importStatement: `import { RovoCanvas } from "@/components/blocks/rovo-canvas/page";`,
		usage: `import { RovoCanvas } from "@/components/blocks/rovo-canvas/page";

<RovoCanvas
  open={open}
  onOpenChange={setOpen}
  kind="dashboard"
  title="Canvas draft"
/>`,
		props: [
			{
				name: "open",
				type: "boolean",
				description: "Controlled open state for the canvas dialog.",
			},
			{
				name: "defaultOpen",
				type: "boolean",
				default: "false",
				description: "Initial open state when the component is uncontrolled.",
			},
			{
				name: "onOpenChange",
				type: "(open: boolean) => void",
				description: "Called when the dialog opens or closes.",
			},
			{
				name: "kind",
				type: "RovoCanvasArtefactKind",
				default: '"dashboard"',
				description: "Chooses the default tab set and landing view: dashboard/report/app/integration, script, agent, or automation.",
			},
			{
				name: "status",
				type: "RovoCanvasStatus",
				default: '"ready"',
				description: "Controls loading and edit shimmer states for planning, executing, editing, ready, idle, and error states.",
			},
			{
				name: "title",
				type: "string",
				default: '"Canvas draft"',
				description: "Title rendered in the canvas header.",
			},
			{
				name: "primaryActionLabel",
				type: "string",
				default: '"Save"',
				description: "Header primary action label.",
			},
			{
				name: "onPrimaryAction",
				type: "() => void",
				description: "Optional handler for the header primary action.",
			},
			{
				name: "views",
				type: "ReadonlyArray<RovoCanvasView>",
				description: "Optional artefact tabs and content slots. Omit to use chrome-only defaults for the selected kind.",
			},
			{
				name: "viewId",
				type: "string",
				description: "Controlled active canvas view id.",
			},
			{
				name: "defaultViewId",
				type: "string",
				description: "Initial active view when the component is uncontrolled.",
			},
			{
				name: "onViewChange",
				type: "(viewId: string) => void",
				description: "Called when the active Plan, Preview, HTML, Details, Surfaces, Setup, Rule, or Code view changes.",
			},
			{
				name: "artefactLabel",
				type: "string",
				description: "Primary label shown in the left-card artefact identity block. Defaults to Code artefact, Agent artefact, or Automation rule.",
			},
			{
				name: "artefactMetadata",
				type: "string",
				description: "Optional secondary metadata shown below the artefact label.",
			},
			{
				name: "rightRail",
				type: "ReactNode",
				description: "Optional replacement for the default shared VPK sidebar ChatPanel rail.",
			},
			{
				name: "footer",
				type: "ReactNode",
				description: "Optional footer slot. Defaults to the AI verification footer.",
			},
			{
				name: "feedbackBanner",
				type: "ReactNode",
				description: "Optional banner slot rendered below the header.",
			},
			{
				name: "versionHistory",
				type: "ReadonlyArray<RovoCanvasVersion>",
				description: "Version drawer rows used by the Preview and HTML/Code toolbar history action.",
			},
			{
				name: "onRefresh",
				type: "(viewId: string) => void",
				description: "Optional handler for the toolbar refresh action.",
			},
			{
				name: "onCopy",
				type: "(view: RovoCanvasView) => void",
				description: "Optional handler for source-view Copy code.",
			},
			{
				name: "onSelectModeChange",
				type: "(isSelectMode: boolean) => void",
				description: "Optional handler for the preview select-element toggle.",
			},
		],
	},
	dashboard: {
		description: "A full dashboard layout with sidebar navigation, charts, and data tables.",
	},
	"sidebar-01": {
		description: "Basic sidebar navigation layout.",
	},
	"sidebar-02": {
		description: "Sidebar with grouped navigation items and icons.",
	},
	"sidebar-03": {
		description: "Collapsible sidebar with toggle control.",
	},
	"sidebar-04": {
		description: "Sidebar with floating variant and rounded styling.",
	},
	"sidebar-05": {
		description: "Sidebar with secondary navigation rail.",
	},
	"sidebar-06": {
		description: "Sidebar with nested sub-navigation items.",
	},
	"sidebar-07": {
		description: "Sidebar with icon-only collapsed state.",
	},
	"sidebar-08": {
		description: "Sidebar with inset content area layout.",
	},
	"sidebar-09": {
		description: "Sidebar with controlled open/close state.",
	},
	"sidebar-10": {
		description: "Sidebar with header, search, and footer sections.",
	},
	"sidebar-11": {
		description: "Sidebar with collapsible grouped sections.",
	},
	"sidebar-12": {
		description: "Sidebar with user avatar and account switcher.",
	},
	"sidebar-13": {
		description: "Sidebar with right-aligned secondary panel.",
	},
	"sidebar-14": {
		description: "Sidebar with tabbed content sections.",
	},
	"sidebar-15": {
		description: "Sidebar with notification badges and indicators.",
	},
	"sidebar-16": {
		description: "Sidebar with drag-and-drop reorderable items.",
	},
	"login-01": {
		description: "Simple centered login form with email and password.",
	},
	"login-02": {
		description: "Login form with social authentication providers.",
	},
	"login-03": {
		description: "Split-screen login with illustration panel.",
	},
	"login-04": {
		description: "Login form embedded within a card layout.",
	},
	"login-05": {
		description: "Login form with two-column responsive layout.",
	},
	chatgpt: {
		description: "ChatGPT-style prompt form with model selector, group chat dialog, and project creation.",
	},
	"chat-timeline": {
		description: "Chat transcript with a floating prompt navigator that previews earlier user messages and jumps to them in place.",
		usage: `import ChatTimeline, { type ChatTimelineMessage } from "@/components/blocks/chat-timeline/page";

const messages: ChatTimelineMessage[] = [
  { id: "u1", role: "user", timestamp: "9:14 AM", text: "Can you summarize the handoff?" },
  { id: "a1", role: "assistant", timestamp: "9:15 AM", text: "Here is the condensed handoff..." },
];

<ChatTimeline messages={messages} />`,
		props: [
			{
				name: "messages",
				type: "ReadonlyArray<ChatTimelineMessage>",
				default: "CHAT_TIMELINE_DEMO_MESSAGES",
				description: "Ordered transcript used for the message thread and navigator snippets.",
			},
			{
				name: "className",
				type: "string",
				description: "Optional className applied to the outer block container.",
			},
		],
	},
	subagents: {
		description: "Agent builder surface for one base parent agent with conditional subagent prompt copies selected from a floating mini-map switcher.",
		usage: `import Subagents, { type SubagentPrompt, type SubagentsBaseAgent } from "@/components/blocks/subagents/page";

const baseAgent: SubagentsBaseAgent = {
  id: "policy-checker",
  config: { name: "Policy Checker", subagents: [] },
};

const subagents: SubagentPrompt[] = [
  {
    id: "benefits-question",
    triggerName: "Benefits question",
    condition: "Use this prompt for benefits eligibility questions.",
    config: { instructions: "Summarize benefits rules for the base agent." },
  },
];

<Subagents initialBaseAgent={baseAgent} initialSubagents={subagents} />`,
		props: [
			{
				name: "initialBaseAgent",
				type: "SubagentsBaseAgent",
				default: "DEFAULT_SUBAGENTS_BASE_AGENT",
				description: "Base parent agent identity and shared config used for every prompt copy.",
			},
			{
				name: "initialSubagents",
				type: "ReadonlyArray<SubagentPrompt>",
				default: "SUBAGENTS_DEMO_PROMPTS",
				description: "Conditional prompt copies owned by the base agent. Rows are labeled by trigger name.",
			},
			{
				name: "initialActiveSubagentId",
				type: "string",
				description: "Optional subagent prompt id selected when the block first renders.",
			},
			{
				name: "className",
				type: "string",
				description: "Optional className applied to the outer block container.",
			},
		],
		examples: [
			{
				title: "No subagents",
				description: "Base parent agent only, showing an empty subagent prompt list and create-subagent action.",
				demoSlug: "subagents-demo-empty",
			},
		],
	},
	"terminal-switch": {
		description: "A switchable interface that toggles between Rovo Chat and a Rovo CLI terminal, demonstrating dual-mode AI interaction.",
	},
	"data-table": {
		description: "Data table with sortable columns, status indicators, and reviewer assignments.",
	},
	"generative-card": {
		description:
			"A collapsible AI result card for generated artifacts, with branded source media, summary metadata, preview content, dense collapsed companions, and footer actions.",
		usage: `import {
  GenerativeCard,
  GenerativeCardHeader,
  GenerativeCardBody,
  GenerativeCardContent,
  GenerativeCardFooter,
} from "@/components/blocks/generative-card";
import { Tile } from "@/components/ui/tile";
import { Button } from "@/components/ui/button";
import { SheetIcon } from "@/components/ui/vpk-icons";

<GenerativeCard className="max-w-[420px]">
  <GenerativeCardHeader
    title="Apple Inc.: A Comprehensive Overview"
    description="Created sheet"
    leading={(
      <Tile label="Sheet" size="medium" variant="greenSubtle">
        <SheetIcon className="size-4" />
      </Tile>
    )}
  />
  <GenerativeCardBody>
    <GenerativeCardContent>
      <div className="rounded-md bg-surface p-4">Artifact preview</div>
    </GenerativeCardContent>
    <GenerativeCardFooter>
      <Button variant="outline">Open sheet</Button>
    </GenerativeCardFooter>
  </GenerativeCardBody>
</GenerativeCard>`,
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		props: [
			{
				name: "defaultExpanded",
				type: "boolean",
				default: "true",
				description: "Initial expanded state when used uncontrolled.",
			},
			{
				name: "expanded",
				type: "boolean",
				description: "Controlled expanded state.",
			},
			{
				name: "onExpandedChange",
				type: "(expanded: boolean) => void",
				description: "Callback fired when expand/collapse state changes.",
			},
			{
				name: "animate",
				type: "boolean",
				default: "false",
				description: "When true, plays a one-shot WebGL bulge distortion entrance animation with Rovo color fringe glow and shimmer border.",
			},
			{
				name: "animateDuration",
				type: "number",
				default: "2000",
				description: "Duration of the entrance animation in milliseconds.",
			},
			{
				name: "animateDistortionScale",
				type: "number",
				default: "100",
				description: "Maximum WebGL displacement scale used by the sweep effect. Increase for a stronger distortion.",
			},
			{
				name: "animateBlur",
				type: "number",
				default: "8",
				description: "Maximum blur amount applied inside the moving distortion band.",
			},
			{
				name: "animateRadius",
				type: "number",
				default: "0.4",
				description: "Distortion radius mapped to moving band height (0-1). Higher values distort a thicker region.",
			},
			{
				name: "animateSpeed",
				type: "number",
				default: "1.35",
				description: "Sweep playback speed multiplier. Higher values move the distortion band from top to bottom faster.",
			},
			{
				name: "animateScaleSmoothing",
				type: "number",
				default: "0.5",
				description: "Smoothing factor (0-1) for displacement scale changes. Higher values react faster.",
			},
			{
				name: "animateSweepSmoothing",
				type: "number",
				default: "0.5",
				description: "Smoothing factor (0-1) for vertical sweep movement. Higher values react faster.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes applied to the card root.",
			},
			{
				name: "borderEffect",
				type: '"shimmer" | "trace" | false',
				default: "false",
				description: "Border effect style: \"shimmer\" fills the border uniformly, \"trace\" shows a concentrated arc comet traveling the perimeter with an interior mesh gradient glow.",
			},
			{
				name: "borderEffectDuration",
				type: "number",
				description: "Duration of the border effect cycle in milliseconds. Defaults to 1750 for shimmer, 2400 for trace.",
			},
			{
				name: "borderEffectArcWidth",
				type: "number",
				default: "90",
				description: "Trace only — angular width of the visible arc in degrees.",
			},
		],
		subComponents: [
			{ name: "GenerativeCardHeader", description: "Header row with leading media, title, description, optional action, and built-in collapse toggle." },
			{ name: "GenerativeCardBody", description: "Animated collapsible container for card details." },
			{ name: "GenerativeCardContent", description: "Body content section with default paddings for previews." },
			{ name: "GenerativeCardPreview", description: "Preview placeholder surface for generated output." },
			{ name: "GenerativeCardFooter", description: "Footer actions row aligned to the end. Accepts an optional `action` prop for a primary action button." },
		],
		examples: [
			{ title: "Artifact preview", description: "Expanded inline artifact card with a content excerpt and explicit open CTA.", demoSlug: "generative-card-demo-artifact" },
			{ title: "Artifact collapsed", description: "Dense collapsed companion state for the same artifact card, with a header CTA and expandable body.", demoSlug: "generative-card-demo-artifact-collapsed" },
			{ title: "3P source", description: "Generative card with third-party source branding.", demoSlug: "generative-card-demo-3p" },
			{ title: "Atlassian source", description: "Generative card with Atlassian product branding.", demoSlug: "generative-card-demo-1p" },
			{ title: "Icon source", description: "Generative card with a semantic icon tile source.", demoSlug: "generative-card-demo-icon" },
			{ title: "With action", description: "Footer with a primary action button (e.g. Send) alongside the preview button.", demoSlug: "generative-card-demo-action" },
			{ title: "Distortion effect", description: "One-shot WebGL bulge distortion entrance with Rovo color fringe glow and shimmer border.", demoSlug: "generative-card-demo-animated" },
			{ title: "Border trace", description: "One-shot gradient comet tracing the card perimeter with a smooth fade-out and replay control.", demoSlug: "generative-card-demo-trace" },
			{ title: "Inner glow", description: "Contained CSS mesh-like inner edge glow without the border trace effect.", demoSlug: "generative-card-demo-inner-glow" },
		],
	},
	"top-navigation": {
		description: "Studio-style application shell with a resizable, collapsible pinned side-nav and a top navigation bar (full-width search, create, and contextual actions).",
	},
	"chat-gallery": {
		description: "Standalone clone of the prompt gallery block for separate chat-focused iteration with quick chips, hover previews, and discover-more examples.",
	},
	"prompt-gallery": {
		description: "ADS prompt gallery block with quick chips, hover previews, and discover-more examples.",
	},
	"chat-configuration": {
		description: "Chat configuration panel with reasoning mode selection and data source toggles for web results and company knowledge.",
	},
	"settings-dialog": {
		description: "Settings dialog with configurable options and preferences.",
	},
	"product-sidebar": {
		description: "ADS-style product sidebar with Jira and Confluence navigation variants.",
	},
	"sidebar-rail": {
		description: "Pinned/hover sidebar rail block with header controls and responsive sidebar reveal behavior.",
	},
	"signup-01": {
		description: "Simple centered signup form with name, email, and password.",
	},
	"signup-02": {
		description: "Two-column signup with cover image and split layout.",
	},
	"signup-03": {
		description: "Signup form with social authentication providers on muted background.",
	},
	"signup-04": {
		description: "Signup form embedded within a card with image panel.",
	},
	"signup-05": {
		description: "Signup form with two-column social providers and branding.",
	},
	"work-item-widget": {
		description: "Embeddable ADS work-items widget with status rows and insert actions.",
	},
	"work-item-detail": {
		description: "Comprehensive work item detail view with description, comments, linked items, and activity history.",
	},
	"visual-waveform": {
		description: "Standalone Rovo live-voice demo using the exact composer, gradient waveform, and GPT Realtime hook without the thread-persistence backend dependency.",
		importStatement: `import VisualWaveform from "@/components/blocks/visual-waveform/page";`,
		usage: `import VisualWaveform from "@/components/blocks/visual-waveform/page";

<VisualWaveform />`,
		demoLayout: { previewHeight: "default" },
	},
	"question-card": {
		description: "ADS-style question card with single-select (numbered) and multi-select (checkbox) options, keyboard navigation, question pagination, and free-form custom input.",
		usage: `import { QuestionCard } from "@/components/blocks/question-card/page";
import type { QuestionCardQuestion } from "@/components/blocks/question-card/page";

const questions: QuestionCardQuestion[] = [
  {
    id: "deploy",
    label: "Which deployment strategy?",
    kind: "single-select",
    options: [
      { id: "blue-green", label: "Blue-green" },
      { id: "staged-rollout", label: "Staged rollout" },
    ],
  },
];

<QuestionCard
  questions={questions}
  onSubmit={(answers) => console.log(answers)}
  onDismiss={() => {}}
/>`,
		props: [
			{
				name: "questions",
				type: "ReadonlyArray<QuestionCardQuestion>",
				required: true,
				description: "Ordered list of questions to present. Each question defines its selection mode via the kind field.",
			},
			{
				name: "onSubmit",
				type: "(answers: QuestionCardAnswers) => void",
				required: true,
				description: "Called with the collected answers when the user completes all questions or clicks Submit.",
			},
			{
				name: "onDismiss",
				type: "() => void",
				description: "Called when the user dismisses the card. When omitted the dismiss button is hidden.",
			},
			{
				name: "isSubmitting",
				type: "boolean",
				default: "false",
				description: "Disables all interactions and shows a loading state on the submit button.",
			},
			{
				name: "maxVisibleOptions",
				type: "number",
				default: "4",
				description: "Maximum number of pre-defined options to show per question. Additional options are truncated.",
			},
			{
				name: "customInputPlaceholder",
				type: "string",
				default: '"Tell Rovo what to do..."',
				description: "Placeholder text for the free-form custom input row.",
			},
			{
				name: "showCustomInput",
				type: "boolean",
				default: "true",
				description: "Whether to show the free-form custom input row after the option list.",
			},
			{
				name: "defaultAnswers",
				type: "QuestionCardAnswers",
				default: "{}",
				description: "Pre-populated answers keyed by question ID. Useful for restoring previous selections.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional CSS classes merged onto the root container.",
			},
		],
		subComponents: [
			{
				name: "QuestionCardQuestion",
				description: "Shape of each question in the questions array.",
				props: [
					{ name: "id", type: "string", required: true, description: "Unique identifier for the question." },
					{ name: "label", type: "string", required: true, description: "Question text displayed as a heading." },
					{
						name: "kind",
						type: '"single-select" | "multi-select" | "text"',
						required: true,
						description: "Selection mode. single-select shows numbered options and auto-advances. multi-select shows checkboxes on the right and allows multiple picks.",
					},
					{ name: "options", type: "ReadonlyArray<QuestionCardOption>", required: true, description: "Pre-defined answer options." },
				],
			},
			{
				name: "QuestionCardOption",
				description: "Shape of each option within a question.",
				props: [
					{ name: "id", type: "string", required: true, description: "Unique identifier for the option." },
					{ name: "label", type: "string", required: true, description: "Display label for the option." },
					{ name: "description", type: "string", description: "Optional secondary description shown below the label." },
				],
			},
		],
		examples: [
			{ title: "Single-select", description: "Numbered options with auto-advance on selection.", demoSlug: "question-card-demo-single-select" },
			{ title: "Multi-select", description: "Checkbox indicators on the right allow multiple selections.", demoSlug: "question-card-demo-multi-select" },
			{ title: "Text only", description: "Single free-form text input with no pre-defined options.", demoSlug: "question-card-demo-text-only" },
			{ title: "Mixed flow", description: "Multi-question flow combining single-select and multi-select with pagination.", demoSlug: "question-card-demo-mixed" },
			{ title: "Without custom input", description: "Custom input row hidden via showCustomInput={false}.", demoSlug: "question-card-demo-no-custom-input" },
			{ title: "Custom placeholder", description: "Custom placeholder text for the free-form input.", demoSlug: "question-card-demo-custom-placeholder" },
			{ title: "Pre-populated answers", description: "Answers pre-selected via defaultAnswers prop.", demoSlug: "question-card-demo-pre-populated" },
		],
	},
	"approval-card": {
		description: "ADS-style approval card for plan acceptance with ranked options and a custom input.",
		demoLayout: { previewHeight: "default" },
	},
	"tool-approval": {
		description: "Approval surface that docks above the prompt input when an AI tool invocation needs explicit user approval before continuing.",
		importStatement: `import { ToolApproval } from "@/components/blocks/tool-approval";`,
		usage: `import { ToolApproval } from "@/components/blocks/tool-approval";
import type { ToolApprovalPayload } from "@/lib/rovo-ui-messages";

const toolApproval: ToolApprovalPayload = {
  approvalId: "approval-1",
  items: [
    {
      id: "edit-1",
      toolCallId: "call-edit",
      toolName: "find_and_replace_code",
      title: "Edit file",
      description: "Update the release notes draft before the run continues.",
      targetPath: "docs/release-notes/q2-launch.md",
      riskLevel: "medium",
      permissionScenario: "workspace-write",
    },
  ],
};

<ToolApproval
  toolApproval={toolApproval}
  onSubmit={(payload, decisions) => console.log(payload, decisions)}
/>`,
		props: [
			{
				name: "toolApproval",
				type: "ToolApprovalPayload",
				required: true,
				description: "Normalized approval payload describing the blocked tool call or batch of tool calls.",
			},
			{
				name: "onSubmit",
				type: "(toolApproval: ToolApprovalPayload, decisions: ToolApprovalSubmitDecision[]) => Promise<void> | void",
				required: true,
				description: "Called once every visible tool step has an explicit Approve or Deny decision.",
			},
			{
				name: "isSubmitting",
				type: "boolean",
				default: "false",
				description: "Locks the controls and shows the pending submission state.",
			},
			{
				name: "className",
				type: "string",
				description: "Additional classes merged onto the root section wrapper.",
			},
		],
		subComponents: [
			{
				name: "ToolApprovalSubmitDecision",
				description: "Decision shape returned to onSubmit for each tool call in the batch.",
				props: [
					{ name: "toolCallId", type: "string", required: true, description: "The paused tool call being approved or denied." },
					{ name: "approved", type: "boolean", required: true, description: "Whether the tool call should resume." },
					{ name: "denyMessage", type: "string", description: "Optional deny message passed back when a tool is rejected." },
				],
			},
		],
		examples: [
			{ title: "Single tool", description: "Default composer dock with one blocked workspace edit above the prompt input.", demoSlug: "tool-approval" },
			{ title: "Batch review", description: "Sequentially review multiple tool invocations before the run continues.", demoSlug: "tool-approval-demo-batch" },
			{ title: "Submitting state", description: "Locked state while the approval submission is already in flight.", demoSlug: "tool-approval-demo-submitting" },
		],
		demoLayout: { previewHeight: "default" },
	},
	chatbot: {
		description: "Full-featured AI chatbot with conversation, messages, reasoning, suggestions, and model selector.",
	},
	ide: {
		description: "IDE-style coding agent with file tree, code editor, terminal, and AI chat panel with tool calls.",
	},
	"kanban-board": {
		description: "Enterprise RFP kanban board with drag-and-drop work-item cards, agent assignment controls, tags, priority signals, and avatar ownership.",
	},
	generative: {
		description: "v0-style generative UI with prompt input, artifact container, and preview/code toggle.",
	},
	workflow: {
		description: "Multi-step agentic workflow with agent configuration, plan rendering, tool calls, and confirmation dialogs.",
	},
};
