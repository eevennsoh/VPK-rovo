"use client";

import Image from "next/image";
import { type ReactNode } from "react";
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

function DemoSection({ title, children }: Readonly<{ title: string; children: ReactNode }>) {
	return (
		<section className="flex w-full flex-col gap-3">
			<h3 className="text-xs font-semibold tracking-wide text-text-subtlest uppercase">{title}</h3>
			<div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
		</section>
	);
}

function DemoKnowledgeCard({ index = 0 }: Readonly<{ index?: number }>) {
	const app = DEFAULT_KNOWLEDGE_APPS[index] ?? DEFAULT_KNOWLEDGE_APPS[0];

	if (!app) {
		return null;
	}

	return (
		<CardDirectoryKnowledge
			description={app.description}
			icon={getKnowledgeAppIcon(app)}
			name={app.name}
			onSelect={() => {}}
			providerName={app.providerName}
		/>
	);
}

export default function EntityCardDemo() {
	return (
		<div className="flex w-full max-w-2xl flex-col gap-8">
			<DemoSection title="Directory cards">
				<CardDirectorySkill
					description="Create a new formatted, rich text document or page in Confluence."
					icon={<PageIcon label="" />}
					iconVariant="blue"
					name="Create page"
					onMoreActions={() => {}}
					onSelect={() => {}}
					publisher="Atlassian"
					starCount={38}
					viewCount={6273}
				/>
				<CardDirectoryTool
					appLogo={<ConfluenceLogo size="small" />}
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
			</DemoSection>
		</div>
	);
}

export function EntityCardDemoSkills() {
	return (
		<div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
			<CardDirectorySkill
				description="Create a new formatted, rich text document or page in Confluence."
				icon={<PageIcon label="" />}
				iconVariant="blue"
				name="Create page"
				onMoreActions={() => {}}
				onSelect={() => {}}
				publisher="Atlassian"
				starCount={38}
				viewCount={6273}
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
				viewCount={4100}
			/>
		</div>
	);
}

export function EntityCardDemoTools() {
	return (
		<div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
			<CardDirectoryTool
				appLogo={<ConfluenceLogo size="small" />}
				description="Create, search, and update pages across your Confluence sites."
				name="Confluence"
				onMoreActions={() => {}}
				onSelect={() => {}}
				teammateCount={258}
				toolCount={36}
			/>
			<CardDirectoryTool
				appLogo={<Image alt="" aria-hidden height={24} src="/3p/slack/32.svg" width={24} />}
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
		<div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
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
		<div className="grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
			<DemoKnowledgeCard />
			<DemoKnowledgeCard index={1} />
		</div>
	);
}
