import { AgentCard } from "@/components/ui-custom/agent-card";

export default function AgentCardDemo() {
	return (
		<div className="w-full max-w-2xl columns-1 gap-3 sm:columns-2 [&>*]:mb-3 [&>*]:break-inside-avoid">
			<AgentCard
				description="Surface customer feedback themes from trusted sources."
				iconSrc="/avatar-agent/teamwork-agents/customer-insights.svg"
				name="Customer Insights"
				onSelect={() => {}}
				skills={[
					{ color: "software", label: "jql-search" },
					{ color: "teamwork", label: "theme-grouping" },
					{ color: "product", label: "confluence-retrieval" },
				]}
				sources={[
					{ id: "jira", label: "Jira", provider: "jira" },
					{ id: "confluence", label: "Confluence", provider: "confluence" },
					{ id: "google-drive", label: "Google Drive", provider: "google-drive" },
				]}
			/>
			<AgentCard
				description="Group Jira work items into clear themes and epics."
				iconSrc="/avatar-agent/dev-agents/code-reviewer.svg"
				name="Jira Theme Analyzer"
				onSelect={() => {}}
				skills={[
					{ color: "software", label: "jql-search" },
					{ color: "teamwork", label: "epic-suggestions" },
				]}
				sources={[
					{ id: "jira", label: "Jira", provider: "jira" },
					{ id: "jira-product-discovery", label: "Jira Product Discovery", provider: "jira-product-discovery" },
				]}
			/>
		</div>
	);
}
