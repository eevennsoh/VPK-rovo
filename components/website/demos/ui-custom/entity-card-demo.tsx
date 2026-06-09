"use client";

import Image from "next/image";
import PageIcon from "@atlaskit/icon/core/page";
import SearchIcon from "@atlaskit/icon/core/search";

import {
	DEFAULT_KNOWLEDGE_APPS,
	getKnowledgeAppIcon,
} from "@/app/data/directory/knowledge";
import {
	CardDirectoryAgent,
	CardDirectoryKnowledge,
	CardDirectorySkill,
	CardDirectoryTool,
} from "@/components/ui-custom/card-directory";
import { ConfluenceLogo } from "@/components/ui/logo";

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

export default function EntityCardDemo() {
	return (
		<div className="flex w-full max-w-2xl flex-col gap-8">
			{/* CSS columns (masonry-style) instead of a grid so each card keeps its
			    natural height — a grid forces every card in a row to the tallest
			    card's height, which breaks the design. `break-inside-avoid` keeps a
			    card whole within a column. */}
			<div className="w-full columns-1 gap-3 sm:columns-2 [&>*]:mb-3 [&>*]:break-inside-avoid">
				<CardDirectorySkill
					description="Create a new formatted, rich text document or page in Confluence."
					icon={<PageIcon label="" />}
					iconVariant="blue"
					name="Create page"
					onMoreActions={() => {}}
					onSelect={() => {}}
					publisher="Atlassian"
					starCount={38}
					verified
					teammateCount={6273}
				/>
				<CardDirectoryTool
					appLogo={<ConfluenceLogo size="medium" />}
					description="Create, search, and update pages across your Confluence sites."
					name="Confluence"
					onMoreActions={() => {}}
					onSelect={() => {}}
					teammateCount={258}
					toolCount={36}
				/>
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
				<DemoKnowledgeCard />
			</div>
		</div>
	);
}

export function EntityCardDemoSkills() {
	return (
		<div className="w-full max-w-2xl columns-1 gap-3 sm:columns-2 [&>*]:mb-3 [&>*]:break-inside-avoid">
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
		</div>
	);
}

export function EntityCardDemoTools() {
	return (
		<div className="w-full max-w-2xl columns-1 gap-3 sm:columns-2 [&>*]:mb-3 [&>*]:break-inside-avoid">
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
		</div>
	);
}

export function EntityCardDemoAgents() {
	return (
		<div className="w-full max-w-2xl columns-1 gap-3 sm:columns-2 [&>*]:mb-3 [&>*]:break-inside-avoid">
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
		</div>
	);
}

export function EntityCardDemoKnowledge() {
	return (
		<div className="w-full max-w-2xl columns-1 gap-3 sm:columns-2 [&>*]:mb-3 [&>*]:break-inside-avoid">
			<DemoKnowledgeCard />
			<DemoKnowledgeCard index={1} />
		</div>
	);
}
