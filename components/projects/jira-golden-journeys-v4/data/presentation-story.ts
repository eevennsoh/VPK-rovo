export type JiraGoldenJourneysV4PresentationChapter =
	| "track"
	| "learn"
	| "build"
	| "terminal";

export const JIRA_GOLDEN_JOURNEYS_V4_PRESENTATION_CHAPTERS = [
	{ label: "Track", value: "track" },
	{ label: "Learn", value: "learn" },
	{ label: "Build", value: "build" },
	{ label: "Terminal", value: "terminal" },
] as const satisfies readonly {
	label: string;
	value: JiraGoldenJourneysV4PresentationChapter;
}[];

export {
	createJiraGoldenJourneysV4PayBoardColumns,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_BOARD_AGENTS,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_COMPOSER_AGENTS,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_HEADER_ASSIGNEES,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_STATUS_PHASES,
} from "./presentation-board";

export {
	createJiraGoldenJourneysV4Pay101BuildState,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_101_COMMIT_SHA,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_101_PULL_REQUEST_NUMBER,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_101_SESSION_ID,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_101_UNCAPTURED_SESSION_ID,
	JIRA_GOLDEN_JOURNEYS_V4_PAY_101_WORK_ITEM,
} from "./presentation-build";
