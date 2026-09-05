import { token } from "@/lib/tokens";

import type { JiraIssueChrome } from "./types";

export interface JiraIssueChromeStyles {
	readonly restClassName: string; // idle border only, no fill
	readonly hoverClassName: string; // :hover for root and subtask
	readonly agentSurfaceHoverClassName: string; // group-hover/jira-issue-card
	readonly boxShadow: string; // raised token, or "none"
}

const RAISED_JIRA_ISSUE_CHROME_STYLES: JiraIssueChromeStyles = Object.freeze({
	restClassName: "border-transparent",
	hoverClassName: "hover:bg-surface-hovered",
	agentSurfaceHoverClassName: "group-hover/jira-issue-card:bg-surface-hovered",
	boxShadow: token("elevation.shadow.raised"),
});

const STROKE_JIRA_ISSUE_CHROME_STYLES: JiraIssueChromeStyles = Object.freeze({
	restClassName: "border-border-disabled",
	hoverClassName: "hover:border-border",
	agentSurfaceHoverClassName: "group-hover/jira-issue-card:border-border",
	boxShadow: "none",
});

const JIRA_ISSUE_CHROME_STYLES: Readonly<Record<JiraIssueChrome, JiraIssueChromeStyles>> = Object.freeze({
	raised: RAISED_JIRA_ISSUE_CHROME_STYLES,
	stroke: STROKE_JIRA_ISSUE_CHROME_STYLES,
});

export function resolveJiraIssueChrome(
	chrome?: JiraIssueChrome,
): JiraIssueChromeStyles {
	return JIRA_ISSUE_CHROME_STYLES[chrome ?? "raised"];
}
