export const JIRA_KANBAN_HEADER_FACEPILE_MAX_ITEMS = 7;

/**
 * Seven 24px avatars with six 6px overlaps occupy 132px. Board and Insights
 * share this exact geometry so swapping their rosters cannot move later tools.
 */
export const JIRA_KANBAN_HEADER_FACEPILE_CLASS_NAME =
	"ml-1 w-33 shrink-0 isolate items-center -space-x-1.5 [&>*]:relative [&>*:nth-child(1)]:z-[7] [&>*:nth-child(2)]:z-[6] [&>*:nth-child(3)]:z-[5] [&>*:nth-child(4)]:z-[4] [&>*:nth-child(5)]:z-[3] [&>*:nth-child(6)]:z-[2] [&>*:nth-child(7)]:z-[1]";
