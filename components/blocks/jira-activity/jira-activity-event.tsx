import { JiraActivitySegments } from "./jira-activity-segments";
import type { JiraActivityEventEntry } from "./jira-activity-types";

/**
 * Compact single-line event: actor name (emphasized), the action segments, then
 * a middot and relative timestamp. Rendered inside the timeline's content
 * column, beside the spine node.
 */
export function JiraActivityEvent({
	entry,
}: Readonly<{ entry: JiraActivityEventEntry }>) {
	return (
		<p className="text-xs leading-4 text-text-subtle">
			<span className="font-medium text-text">{entry.actor.name}</span>{" "}
			<JiraActivitySegments segments={entry.segments} />
			<span className="text-text-subtlest"> · {entry.timestamp}</span>
		</p>
	);
}
