import type { TagColor } from "@/components/ui/tag";

/** Raised elevation is the default card chrome. Stroke is a 1px border with no shadow. */
export type JiraIssueChrome = "raised" | "stroke";
export type JiraIssuePriority = "major" | "medium" | "minor";
export type JiraIssuePullRequestStatus = "open" | "failed" | "merged";
export type JiraIssueVariant = "default" | "uncaptured-work";

export interface JiraIssueTag {
	text: string;
	color: TagColor;
}
