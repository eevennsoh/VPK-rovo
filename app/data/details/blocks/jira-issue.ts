import type { ComponentDetail } from "@/app/data/component-detail-types";

export const JIRA_ISSUE_DETAIL: ComponentDetail = {
	description:
		"Compact Jira issue card for kanban boards, with summary text, issue key, tags, priority signal, assignee avatar, selected state, and drag affordance.",
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
	props: [
		{ name: "summary", type: "string", required: true, description: "Issue summary shown as the primary card text." },
		{ name: "issueKey", type: "string", required: true, description: "Jira issue key shown beside the issue-type icon." },
		{ name: "tags", type: "readonly JiraIssueTag[]", description: "Tags rendered below the summary." },
		{ name: "priority", type: '"major" | "medium" | "minor"', default: '"major"', description: "Priority icon and color." },
		{ name: "selected", type: "boolean", default: "false", description: "Applies the selected border/background and aria-pressed state." },
		{ name: "dragging", type: "boolean", default: "false", description: "Applies the drag cursor and faded drag state." },
		{ name: "assigneeAvatarSrc", type: "string", description: "Assignee avatar image source." },
		{ name: "assigneeUnassignedKind", type: '"person" | "agent"', description: "Renders the shared unassigned avatar placeholder instead of an assignee image." },
	],
};
