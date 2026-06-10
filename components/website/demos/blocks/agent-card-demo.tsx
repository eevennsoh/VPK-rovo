"use client";

import { AgentCard } from "@/components/blocks/agent-card";

const SOURCES = [
	{ id: "jira", label: "Jira", provider: "jira" },
	{ id: "jira-product-discovery", label: "Jira Product Discovery", provider: "jira-product-discovery" },
	{ id: "confluence", label: "Confluence", provider: "confluence" },
	{ id: "jira-service-management", label: "Jira Service Management", provider: "jira-service-management" },
	{ id: "teams", label: "Teams", provider: "teams" },
	{ id: "salesforce", label: "Salesforce", provider: "salesforce" },
	{ id: "loom", label: "Loom", provider: "loom" },
] as const;

const SKILLS = [
	{ color: "teamwork", label: "stakeholder-input" },
	{ color: "product", label: "opportunity-sizing" },
	{ color: "software", label: "option-mapping" },
	{ color: "service", label: "risk-spotting" },
	{ label: "context-gap-analysis" },
	{ label: "decision-logging" },
] as const;

/** Expanded variant — cover banner, byline, capabilities feature list, footer. */
export function AgentCardDemoExpanded() {
	return (
		<div className="flex w-full justify-center p-6">
			<AgentCard
				attributionKind="company"
				avatarSrc="/avatar-agent/teamwork-agents/decision-director.svg"
				capabilities={[
					{ icon: "review", label: "Review DACI decisions, close context gaps, and suggest resources" },
					{ icon: "target", label: "Size opportunities against current priorities" },
					{ icon: "list", label: "Map options and trade-offs for each decision" },
					{ icon: "alert", label: "Spot risks before they block a decision" },
					{ icon: "people", label: "Pull the right stakeholders into the conversation" },
				]}
				className="max-h-[400px] w-[420px]"
				collaborators={[
					{ name: "Michael Chu", src: "/avatar-human/michael-chu.png" },
					{ name: "Melanie Lee", src: "/avatar-human/melanie-lee.png" },
					{ name: "David Hsieh", src: "/avatar-human/david-hsieh.png" },
					{ name: "Aoife Burke", src: "/avatar-human/aoife-burke.png" },
				]}
				description="Review DACI decisions, close context gaps, and suggest the next decision-ready resources."
				name="Decision Director"
				onSelect={() => {}}
				publisher="Atlassian"
				skills={SKILLS}
				sources={SOURCES}
				stats={[
					{ label: "Remix", value: "1.8K" },
					{ label: "Last update", value: "2 weeks ago" },
				]}
				variant="expanded"
				verified
			/>
		</div>
	);
}

/** Simple variant — flat icon + name header, description, "Works with", "Skills". */
export function AgentCardDemoSimple() {
	return (
		<div className="flex w-full justify-center p-6">
			<AgentCard
				className="w-[420px]"
				description="Review DACI decisions, close context gaps, and suggest the next decision-ready resources."
				iconSrc="/avatar-agent/teamwork-agents/decision-director.svg"
				name="Decision Director"
				onSelect={() => {}}
				publisher="Atlassian"
				skills={SKILLS}
				sources={SOURCES}
				variant="template"
			/>
		</div>
	);
}

/** Default preview — both variants side by side. */
export default function AgentCardDemo(): React.ReactElement {
	return (
		<div className="flex w-full flex-wrap items-start justify-center gap-10 p-6">
			<div className="flex flex-col gap-3">
				<span className="text-xs font-medium text-text-subtlest">Expanded</span>
				<AgentCardDemoExpanded />
			</div>
			<div className="flex flex-col gap-3">
				<span className="text-xs font-medium text-text-subtlest">Simple</span>
				<AgentCardDemoSimple />
			</div>
		</div>
	);
}
