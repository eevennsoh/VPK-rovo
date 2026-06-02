import type { AgentBrowserSidebarGroup } from "@/components/blocks/agent-browser";

export const DEFAULT_TOOLS_DIRECTORY_SIDEBAR_GROUPS: readonly AgentBrowserSidebarGroup[] = [
	{
		title: "By companies",
		showAll: true,
		agentIds: ["atlassian", "google-drive", "github-copilot", "slack", "asana"],
	},
];
