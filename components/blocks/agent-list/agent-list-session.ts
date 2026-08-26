import type {
	JiraSidebarSessionItem,
	JiraSidebarSessionStatus,
} from "@/components/blocks/product-sidebar/variants/jira";

import type { AgentListHost, AgentListItem } from "./agent-list-types";

/**
 * Where a row's session runs. The row field wins; `sessionDetails.host` is the
 * flyout-era fallback so older payloads still resolve without duplicating host
 * onto every consumer.
 */
export function getAgentListHost(item: AgentListItem): AgentListHost {
	return item.host ?? item.sessionDetails?.host ?? "cloud";
}

/** Local sessions surface a device chip instead of a live runtime and agent name. */
export function isLocalAgentListItem(item: AgentListItem): boolean {
	return getAgentListHost(item) === "local";
}

/**
 * Boundary between the agent-session row model (`AgentListItem`) and the
 * canonical Jira session flyout model (`JiraSidebarSessionItem`).
 *
 * The row model is deliberately lean — it only carries what a single-line
 * session row renders. The flyout is the richer surface, so anything it needs
 * that the row does not already know (issue key, repository, pull request,
 * checks, …) arrives through `item.sessionDetails` and everything else is
 * derived here. Keeping the derivation in one pure function means the card
 * never reaches into flyout-shaped fields itself.
 */

/**
 * Derives a Jira-style issue key from an agent-session branch:
 * `rovo/vita-142-vision-deck` → `VITA-142`. Falls back to the raw branch when
 * the pattern does not match, so the flyout still names something real, and to
 * an empty string for rows that carry no branch — those are not agent sessions
 * and never open the session flyout.
 */
export function deriveIssueKeyFromBranch(branch: string | undefined): string {
	if (branch === undefined) {
		return "";
	}
	const match = /^rovo\/([a-z]+)-(\d+)-/.exec(branch);
	return match ? `${match[1].toUpperCase()}-${match[2]}` : branch;
}

/**
 * Row lifecycle → flyout lifecycle. The row model has no dedicated "PR open"
 * state, so a finished session borrows it from `prStatus`; a finished session
 * that never opened a PR reads as `merged` (work item Done) because that is the
 * only terminal-success status the flyout models. `attention` is a
 * notification, not a session, but it still reads as blocked on the viewer.
 */
export function toAgentSessionStatus(item: AgentListItem): JiraSidebarSessionStatus {
	switch (item.state) {
		case "needs-input":
		case "attention":
			return "awaiting-input";
		case "running":
			return "running";
		case "complete":
			return item.prStatus === "created" ? "pr-open" : "merged";
	}
}

/** Maps a session row onto the payload the shared Jira session flyout renders. */
export function toAgentSessionFlyoutItem(item: AgentListItem): JiraSidebarSessionItem {
	const details = item.sessionDetails;

	return {
		...details,
		agentAvatarSrc: item.agent.avatarSrc,
		agentName: item.agent.name,
		branch: details?.branch ?? item.branch,
		completedAtMs: item.completedAtMs,
		completedSecondsAgo: item.completedSecondsAgo,
		host: getAgentListHost(item),
		id: item.id,
		initialElapsedSeconds: item.elapsedSeconds,
		issueKey: details?.issueKey ?? deriveIssueKeyFromBranch(item.branch),
		issueSummary: details?.issueSummary ?? item.title,
		startedAtMs: item.startedAtMs,
		status: toAgentSessionStatus(item),
		title: item.title,
	};
}
