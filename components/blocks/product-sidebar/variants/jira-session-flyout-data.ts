import type { LozengeProps } from "@/components/ui/lozenge";
import { createHoverCardHandle } from "@/components/ui/hover-card-handle";
import type {
	JiraSidebarSessionChecks,
	JiraSidebarSessionItem,
	JiraSidebarSessionStatus,
} from "./jira";

export function createJiraSessionFlyoutHandle() {
	return createHoverCardHandle<JiraSidebarSessionItem>();
}

/** Stable relative "updated" label per session state (demo data only). */
export const JIRA_SESSION_UPDATED_LABEL: Record<JiraSidebarSessionStatus, string> = {
	"awaiting-input": "2d ago",
	running: "3m ago",
	"pr-open": "1h ago",
	merged: "5h ago",
	stopped: "1d ago",
};

export function prStateLozenge(status: JiraSidebarSessionStatus): { label: string; variant: LozengeProps["variant"] } {
	return status === "merged"
		? { label: "Merged", variant: "discovery" }
		: { label: "Open", variant: "success" };
}

export function formatSessionChecks(checks: JiraSidebarSessionChecks): string {
	const total = checks.passed + checks.failed;
	return checks.failed > 0
		? `${checks.passed}/${total} passed ${checks.failed} failed`
		: `${checks.passed}/${total} passed`;
}
