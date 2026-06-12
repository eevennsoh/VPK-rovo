import type { TWGAgentSuggestion } from "@/components/blocks/twg-agent-card/components/twg-agent-card";
import type { TwgToolSource } from "@/components/ui-custom/twg-appstack";

export const DEFAULT_TWG_AGENT_CARD_SOURCES = [
	{ id: "twg", label: "Teamwork Graph", provider: "twg" },
	{ id: "jira", label: "Jira", provider: "jira" },
	{ id: "google-drive", label: "Google Drive", provider: "google-drive" },
	{ id: "confluence", label: "Confluence", provider: "confluence" },
	{ id: "jira-service-management", label: "Jira Service Management", provider: "jira-service-management" },
	{ id: "teams", label: "Microsoft Teams", provider: "teams" },
	{ id: "salesforce", label: "Salesforce", provider: "salesforce" },
] as const satisfies readonly TwgToolSource[];

export const DEFAULT_TWG_AGENT_CARD_SUGGESTIONS = [
	{
		id: "life-admin-agent",
		name: "Life Admin Agent",
		description: "Turns loose reminders, forms, and renewals into handled next steps.",
	},
	{
		id: "relationship-rhythm-agent",
		name: "Relationship Rhythm Agent",
		description: "Suggests thoughtful follow-ups from your recent conversations and plans.",
	},
	{
		id: "focus-recovery-agent",
		name: "Focus Recovery Agent",
		description: "Finds recurring distractions and drafts a calmer weekly operating rhythm.",
	},
] as const satisfies readonly TWGAgentSuggestion[];
