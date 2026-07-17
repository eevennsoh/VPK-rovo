export type JiraForYouIssueType = "task" | "bug" | "subtask" | "epic" | "story";
export type JiraForYouStatus = "Human review" | "In progress" | "In review" | "To do" | "Done";

export interface JiraForYouAgent {
	/** Display name, used for the avatar accessible label. */
	name: string;
	/** Absolute path to the agent avatar SVG under `public/`. */
	avatarSrc: string;
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
	/** When true, the hover actions include a "Stop" control. */
	isRunning?: boolean;
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
