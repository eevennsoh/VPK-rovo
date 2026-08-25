import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_ISSUE_DETAIL: ComponentDetail = {
	description:
		"Compact Jira issue card for kanban boards, with summary text, issue key, tags, priority signal, assignee avatar, selected state, drag affordance, subtasks, and parent epic composition.",
	demoLayout: { previewHeight: "fit" },
	importStatement: `import { JiraIssue } from "@/components/blocks/jira-issue";`,
	usage: `import { JiraIssue } from "@/components/blocks/jira-issue";

<JiraIssue
  issueKey="RFP-101"
  summary="Acmecorp: Prepare for bid recommendation for ESM RFP"
  tags={[
    { text: "Acmecorp", color: "discovery" },
    { text: "qualification", color: "blue" },
    { text: "enterprise", color: "discovery" },
  ]}
  priority="major"
  assigneeAvatarSrc="/avatar-user/andrea-wilson/color/asow-service-yellow.png"
/>`,
	examples: [
		{ title: "Experimental", description: "Issue card with the stroke-only visual treatment used by the experimental Jira Kanban.", demoSlug: "jira-issue-demo-experimental" },
		{ title: "Uncaptured work", description: "Work discovered outside Jira, with its source context, involved participants, and a controlled Create work item action.", demoSlug: "jira-issue-demo-uncaptured-work" },
		{ title: "Subtasks collapsed", description: "Issue card with a collapsed nested subtasks row.", demoSlug: "jira-issue-demo-subtasks-collapsed" },
		{ title: "Subtasks expanded", description: "Expanded subtasks with nested issue cards.", demoSlug: "jira-issue-demo-subtasks-expanded" },
		{ title: "Parent epic", description: "Issue card with a parent epic selector embedded through the Jira epic block.", demoSlug: "jira-issue-demo-parent-epic" },
		{ title: "Agent activity states", description: "Interactive issue card states for agents working, awaiting input, and completed work.", demoSlug: "jira-issue-demo-agent-activity-states" },
		{ id: "agent-activity-states-experimental", title: "Agent activity states (experimental)", description: "The same agent activity states rendered with the experimental stroke-only card chrome.", demoSlug: "jira-issue-demo-agent-activity-states-experimental" },
	],
	props: [
		{ name: "variant", type: '"default" | "uncaptured-work"', default: '"default"', description: "Selects the standard Jira issue card or the uncaptured-work presentation." },
		{ name: "summary", type: "string", required: true, description: "Issue summary shown as the primary card text." },
		{ name: "issueKey", type: "string", description: "Jira issue key shown beside the issue-type icon. Required for the default variant." },
		{ name: "sourceLink", type: "SmartLinkItem", description: "Hoverable source reference with provider logo and destination label. Required for the uncaptured-work variant." },
		{ name: "participants", type: "readonly JiraIssueParticipant[]", description: "People and agents involved in uncaptured work. Required for the uncaptured-work variant." },
		{ name: "captured", type: "boolean", default: "false", description: "Controlled completion state for the uncaptured-work create action." },
		{ name: "onCreateWorkItem", type: "() => void", description: "Creates a Jira work item for uncaptured work. When omitted, the action is exposed as unavailable." },
		{ name: "showMoreAction", type: "boolean", default: "true", description: "Shows the hover- and focus-revealed issue actions menu while reserving its title-row space." },
		{ name: "onMoreActionSelect", type: "(action: JiraIssueMoreAction) => void", description: "Called after an item is selected from the built-in issue actions menu." },
		{ name: "tags", type: "readonly JiraIssueTag[]", description: "Tags rendered below the summary." },
		{ name: "parentEpicControl", type: "ReactNode", description: "Optional parent epic selector/control rendered in the issue metadata below the summary." },
		{ name: "subtasks", type: "readonly JiraIssueSubtask[]", description: "Nested subtasks rendered behind the expandable subtasks row." },
		{ name: "subtasksCompleted", type: "number", default: "0", description: "Completed subtask count used for the subtasks badge." },
		{ name: "defaultSubtasksExpanded", type: "boolean", default: "false", description: "Initial uncontrolled expanded state for subtasks." },
		{ name: "priority", type: '"major" | "medium" | "minor"', default: '"major"', description: "Priority icon and color." },
		{ name: "showPriorityIndicator", type: "boolean", default: "true", description: "Controls whether the priority icon is shown in the issue metadata row." },
		{ name: "selected", type: "boolean", default: "false", description: "Applies the selected border/background and aria-pressed state." },
		{ name: "dragging", type: "boolean", default: "false", description: "Applies the drag cursor and faded drag state." },
		{ name: "assigneeAvatarSrc", type: "string", description: "Assignee avatar image source." },
		{ name: "assigneeUnassignedKind", type: '"person" | "agent"', description: "Renders the shared unassigned avatar placeholder instead of an assignee image." },
		{ name: "agentActivities", type: "readonly JiraIssueAgentActivity[]", description: "Agent activity rows rendered in the gray activity backdrop below the issue body." },
		{ name: "agentActivityMode", type: '"none" | "working" | "awaiting-input" | "completed"', default: '"none"', description: "Presentation mode for showing active agent rows or completed-work notification states." },
		{ name: "agentDoneRuns", type: "readonly JiraIssueCompletedAgentRun[]", description: "Completed agent runs shown with the shared Jira Activity output-card design." },
		{ name: "onAgentActivityViewChat", type: "(activity: JiraIssueAgentActivity) => void", description: "Called from the agent activity hover panel when the user selects View." },
		{ name: "onAgentDoneRunView", type: "(run: JiraIssueCompletedAgentRun) => void", description: "Called when View is selected from a completed agent run." },
		{ name: "onAgentDoneRunSubmit", type: "(run: JiraIssueCompletedAgentRun, prompt: string) => void", description: "Receives prompts submitted from a completed run's immediately visible composer." },
		{ name: "generativeAction", type: "JiraIssueGenerativeActionConfig", description: "Optional hover-revealed generative action menu that can submit Ask Rovo, skill, or agent prompts with issue context." },
	],
};
