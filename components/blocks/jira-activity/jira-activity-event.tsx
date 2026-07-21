import { Lozenge } from "@/components/ui/lozenge";

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
	if (entry.pullRequest) {
		const { additions, deletions, number, status, title } = entry.pullRequest;

		return (
			<div className="flex h-6 min-w-0 items-center gap-2 text-xs leading-4">
				<span className="shrink-0 text-text-subtle">Pull request</span>
				<Lozenge variant={status === "Merged" ? "discovery" : "success"}>{status}</Lozenge>
				<span className="min-w-0 flex-1 truncate text-text" title={`#${number}: ${title}`}>
					#{number}: {title}
				</span>
				<span className="shrink-0 font-mono font-normal text-text-success">+{additions}</span>
				<span className="shrink-0 font-mono font-normal text-text-danger">-{deletions}</span>
			</div>
		);
	}

	return (
		<p className="flex h-6 items-center text-xs leading-4 text-text-subtle">
			<span>
				<span className="font-medium text-text">{entry.actor.name}</span>{" "}
				<JiraActivitySegments segments={entry.segments} />
				<span className="text-text-subtlest"> · {entry.timestamp}</span>
			</span>
		</p>
	);
}
