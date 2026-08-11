import { Lozenge } from "@/components/ui/lozenge";
import { cn } from "@/lib/utils";

import { mentionSegmentForActor } from "./jira-activity-actor-mention";
import { JiraActivitySegments } from "./jira-activity-segments";
import type { JiraActivityEventEntry } from "./jira-activity-types";

/**
 * Compact event row: actor mention chip, the action segments, then a middot
 * and relative timestamp. Rendered inside the timeline's content column,
 * beside the spine node.
 *
 * Use `min-h-6` (not fixed `h-6`) so editor mention Tags (`h-5`) and wrapped
 * multi-line copy stay fully visible — a fixed 24px track clips chip tops.
 * `py-0.5` keeps chips off the row edge; `leading-5` matches the 20px chip
 * line box. The spine glyph stays on the node's separate `h-6` icon track.
 */
export function JiraActivityEvent({
	entry,
	onOpenPullRequest,
}: Readonly<{
	entry: JiraActivityEventEntry;
	/** Opens the in-app pull-request detail for this activity PR row. */
	onOpenPullRequest?: (entry: JiraActivityEventEntry) => void;
}>) {
	if (entry.pullRequest) {
		const { additions, deletions, number, status, title } = entry.pullRequest;
		const titleLabel = `#${number}: ${title}`;

		return (
			<div className="flex min-h-6 min-w-0 items-center gap-2 py-0.5 text-xs leading-5">
				<Lozenge variant={status === "Merged" ? "discovery" : "success"}>{status}</Lozenge>
				<span className="flex min-w-0 items-center gap-1">
					{onOpenPullRequest ? (
						<button
							type="button"
							className={cn(
								"min-w-0 truncate rounded-[3px] text-left text-text",
								"no-underline decoration-current outline-none hover:underline focus-visible:underline",
								"focus-visible:ring-3 focus-visible:ring-ring/50",
							)}
							title={titleLabel}
							onClick={() => onOpenPullRequest(entry)}
						>
							{titleLabel}
						</button>
					) : (
						<span className="min-w-0 truncate text-text" title={titleLabel}>
							{titleLabel}
						</span>
					)}
					<span className="flex shrink-0 items-center gap-1">
						<span className="text-text-success">+{additions}</span>
						<span className="text-text-danger">-{deletions}</span>
					</span>
				</span>
			</div>
		);
	}

	return (
		<p className="flex min-h-6 min-w-0 items-center py-0.5 text-xs leading-5 text-text-subtle">
			<span className="min-w-0">
				{entry.showActor === false ? null : (
					<>
						<JiraActivitySegments segments={[mentionSegmentForActor(entry.actor)]} />{" "}
					</>
				)}
				<JiraActivitySegments segments={entry.segments} />
				{entry.showTimestamp === false ? null : (
					<span className="ml-1.5 inline-flex items-center gap-1.5 text-text-subtlest">
						<span aria-hidden>·</span>
						<span>{entry.timestamp}</span>
					</span>
				)}
			</span>
		</p>
	);
}
