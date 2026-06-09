import { type ReactNode } from "react";
import Image from "next/image";
import PageIcon from "@atlaskit/icon/core/page";
import SearchIcon from "@atlaskit/icon/core/search";

import {
	DEFAULT_KNOWLEDGE_APPS,
	getKnowledgeAppIcon,
} from "@/app/data/directory/knowledge";
import {
	CardDirectoryAgent,
	CardDirectoryAgentExpanded,
	CardDirectoryKnowledge,
	CardDirectorySkill,
	CardDirectoryTemplate,
	CardDirectoryTool,
} from "@/components/ui-custom/card-directory";
import { ConfluenceLogo } from "@/components/ui/logo";

function DemoSection({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
	return (
		<section className="flex w-full flex-col gap-3">
			<h3 className="text-xs font-semibold tracking-wide text-text-subtlest uppercase">{title}</h3>
			{/* CSS columns (masonry-style) instead of a grid so each card keeps its
			    natural height — a grid forces every card in a row to the tallest
			    card's height, which breaks the design. `break-inside-avoid` keeps a
			    card whole within a column. */}
			<div className="w-full columns-1 gap-3 sm:columns-2 [&>*]:mb-3 [&>*]:break-inside-avoid">{children}</div>
		</section>
	);
}

const KNOWLEDGE_DEMO_STATS = [
	{ starCount: 38, verified: true, teammateCount: 6273 },
	{ starCount: 124, verified: false, teammateCount: 18400 },
] as const;

function DemoKnowledgeCard({ index = 0 }: Readonly<{ index?: number }>) {
	const app = DEFAULT_KNOWLEDGE_APPS[index] ?? DEFAULT_KNOWLEDGE_APPS[0];

	if (!app) {
		return null;
	}

	const stats = KNOWLEDGE_DEMO_STATS[index] ?? KNOWLEDGE_DEMO_STATS[0];

	return (
		<CardDirectoryKnowledge
			description={app.description}
			icon={getKnowledgeAppIcon(app)}
			name={app.name}
			onSelect={() => {}}
			publisher={app.providerName}
			starCount={stats.starCount}
			verified={stats.verified}
			teammateCount={stats.teammateCount}
		/>
	);
}

export default function CardDirectoryDemo() {
	return (
		<div className="flex w-full max-w-2xl flex-col gap-8">
			<DemoSection title="Agent (expanded)">
				<CardDirectoryAgentExpanded
					avatarSrc="/avatar-agent/product-agents/feedback-analyzer.svg"
					capabilities={[
						"Surfaces recurring themes from raw customer feedback",
						"Scores sentiment shifts across releases",
						"Clusters verbatims into actionable topics",
						"Flags emerging issues before they escalate",
						"Links findings back to source tickets and pages",
						"Drafts a weekly digest for your team",
					]}
					className="h-[420px]"
					collaboratorOverflow={4}
					collaborators={[
						{ name: "Priya Hansra", src: "/avatar-human/priya-hansra.png" },
						{ name: "Raul Gonzalez", src: "/avatar-human/raul-gonzalez.png" },
						{ name: "Michael Chu", src: "/avatar-human/michael-chu.png" },
						{ name: "Melanie Lee", src: "/avatar-human/melanie-lee.png" },
					]}
					description="Surfaces themes and sentiment from raw customer feedback in seconds."
					name="Feedback analyzer"
					onSelect={() => {}}
					publisher="Atlassian"
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
					stats={[
						{ label: "Remix", value: "1.4K" },
						{ label: "Last update", value: "2 weeks ago" },
					]}
					verified
				/>
				<CardDirectoryAgentExpanded
					avatarSrc="/avatar-agent/dev-agents/code-reviewer.svg"
					capabilities={[
						"Reviews PRs for style and correctness",
						"Catches common security gotchas",
						"Suggests targeted refactors with diffs",
						"Checks tests cover the changed paths",
						"Summarizes the change for reviewers",
						"Flags risky migrations and breaking changes",
					]}
					className="h-[420px]"
					collaboratorOverflow={2}
					collaborators={[
						{ name: "David Hsieh", src: "/avatar-human/david-hsieh.png" },
						{ name: "Aoife Burke", src: "/avatar-human/aoife-burke.png" },
						{ name: "Issac Varghese", src: "/avatar-human/issac-varghese.png" },
					]}
					description="Reviews PRs for style, correctness, and security gotchas."
					name="Code reviewer"
					onSelect={() => {}}
					publisher="Mei Tan"
					skills={[
						{ color: "software", label: "diff-review" },
						{ color: "product", label: "security-scan" },
					]}
					sources={[
						{ id: "bitbucket", label: "Bitbucket", provider: "bitbucket" },
						{ id: "jira", label: "Jira", provider: "jira" },
					]}
					stats={[
						{ label: "Remix", value: "820" },
						{ label: "Last update", value: "3 days ago" },
					]}
				/>
			</DemoSection>

			<DemoSection title="Agent">
				<CardDirectoryAgent
					avatarSrc="/avatar-agent/product-agents/feedback-analyzer.svg"
					chatCount={9400}
					description="Surfaces themes and sentiment from raw customer feedback in seconds."
					feedbackCount={1280}
					name="Feedback analyzer"
					onMoreActions={() => {}}
					onSelect={() => {}}
					publisher="Atlassian"
					rating={4.6}
					verified
				/>
				<CardDirectoryAgent
					avatarSrc="/avatar-agent/dev-agents/code-reviewer.svg"
					chatCount={1500}
					description="Reviews PRs for style, correctness, and security gotchas."
					feedbackCount={340}
					name="Code reviewer"
					onMoreActions={() => {}}
					onSelect={() => {}}
					publisher="Mei Tan"
					rating={4.2}
				/>
			</DemoSection>

			<DemoSection title="Skill">
				<CardDirectorySkill
					description="Create a new formatted, rich text document or page in Confluence."
					icon={<PageIcon label="" />}
					iconVariant="blue"
					name="Create page"
					onMoreActions={() => {}}
					onSelect={() => {}}
					publisher="Atlassian"
					starCount={38}
					teammateCount={6273}
				/>
				<CardDirectorySkill
					description="Find related issues and pages across your team's workspace."
					icon={<SearchIcon label="" />}
					iconVariant="purple"
					name="Find similar work"
					onMoreActions={() => {}}
					onSelect={() => {}}
					publisher="Atlassian"
					starCount={120}
					teammateCount={4100}
				/>
			</DemoSection>

			<DemoSection title="Tool">
				<CardDirectoryTool
					appLogo={<ConfluenceLogo size="medium" />}
					description="Create, search, and update pages across your Confluence sites."
					name="Confluence"
					onMoreActions={() => {}}
					onSelect={() => {}}
					teammateCount={258}
					toolCount={36}
				/>
				<CardDirectoryTool
					appLogo={<Image alt="" aria-hidden height={32} src="/3p/slack/32.svg" width={32} />}
					description="Send messages and search conversations from your workspace."
					name="Slack"
					onMoreActions={() => {}}
					onSelect={() => {}}
					teammateCount={540}
					toolCount={12}
				/>
			</DemoSection>

			<DemoSection title="Knowledge">
				<DemoKnowledgeCard />
				<DemoKnowledgeCard index={1} />
			</DemoSection>

			<DemoSection title="Agent template">
				<CardDirectoryTemplate
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
				<CardDirectoryTemplate
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
			</DemoSection>
		</div>
	);
}
