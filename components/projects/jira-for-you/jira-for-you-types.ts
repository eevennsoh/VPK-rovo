import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";

export type JiraForYouIssueType = "task" | "bug" | "subtask" | "epic" | "story";
export type JiraForYouStatus = "Review" | "In progress" | "In review" | "To do" | "Done";

export interface JiraForYouAgent {
	/** Stable id from the canonical agent directory when used in a workspace. */
	id?: string;
	/** Display name, used for the avatar accessible label. */
	name: string;
	/** Absolute path to the agent avatar SVG under `public/`. */
	avatarSrc?: string;
	/** Third-party brand mark when the agent has no 1P avatar art. */
	brandName?: ThirdPartyLogoName;
}

export interface JiraForYouItem {
	id: string;
	title: string;
	issueType: JiraForYouIssueType;
	/** Jira-style issue key, e.g. "ABC-123". */
	issueKey: string;
	/** Space / project name shown in the metadata row. */
	spaceName: string;
	/** Jira workflow status shown in the row's trailing lozenge. */
	jiraStatus: JiraForYouStatus;
	/** Agents currently working the item; rendered as an overlapping cluster. */
	agents?: readonly JiraForYouAgent[];
	/** Live status copy shown with a shimmer effect (e.g. "In progress"). */
	status?: string;
	/** Elapsed agent run duration shown beside the live status. */
	elapsedSeconds?: number;
	/**
	 * Filter-tab ids this item belongs to (besides "all", which always matches).
	 * Drives which items are shown when a tab other than "All" is selected.
	 */
	tabs?: readonly string[];
}

export interface JiraForYouSection {
	id: string;
	label: string;
	/** Collapsible sections render a chevron trigger; defaults to false. */
	collapsible?: boolean;
	items: readonly JiraForYouItem[];
}

export interface JiraForYouTab {
	id: string;
	label: string;
	/** Optional count rendered as a badge inside the tab. */
	count?: number;
}
