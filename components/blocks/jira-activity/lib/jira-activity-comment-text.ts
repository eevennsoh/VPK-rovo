import type { JiraActivitySegment } from "../jira-activity-types";

/** Flatten rich activity segments into plain text for chat prompt context. */
export function jiraActivitySegmentsToPlainText(
	segments: readonly JiraActivitySegment[],
): string {
	return segments
		.map((segment) => {
			switch (segment.type) {
				case "text":
				case "code":
				case "link":
				case "user-mention":
				case "agent-mention":
				case "app-mention":
				case "lozenge":
				case "label":
				case "tag":
				case "priority":
					return segment.text;
				case "transition-arrow":
					return "→";
				default: {
					const exhaustive: never = segment;
					return exhaustive;
				}
			}
		})
		.join("")
		.replace(/\s+/gu, " ")
		.trim();
}

export interface ActivityChatCommentContext {
	id: string;
	actorName: string;
	timestamp: string;
	body: string;
}

/** Serialize attached activity comments for one-turn chat `contextDescription`. */
export function serializeActivityCommentsContext(
	workItem: Readonly<{ code: string; title: string }>,
	comments: readonly ActivityChatCommentContext[],
): string {
	if (comments.length === 0) {
		return "";
	}

	const serializedComments = comments.map((comment, index) => [
		`Comment ${index + 1}:`,
		`Author: ${comment.actorName}`,
		`When: ${comment.timestamp}`,
		`Activity comment: ${comment.body}`,
	].join("\n")).join("\n\n");

	return [
		"Activity comments (local prompt context):",
		`Work item: ${workItem.code} ${workItem.title}`,
		"",
		serializedComments,
	].join("\n");
}
