import type { LozengeProps } from "@/components/ui/lozenge";
import { createHoverCardHandle } from "@/components/ui/hover-card-handle";
import type { JiraSidebarSessionItem, JiraSidebarSessionStatus } from "./jira";

export function createJiraSessionFlyoutHandle() {
	return createHoverCardHandle<JiraSidebarSessionItem>();
}

export function prStateLozenge(status: JiraSidebarSessionStatus): { label: string; variant: LozengeProps["variant"] } {
	return status === "merged"
		? { label: "Merged", variant: "discovery" }
		: { label: "Open", variant: "success" };
}
