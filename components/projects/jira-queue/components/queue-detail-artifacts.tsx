import Image from "next/image";
import type { ReactNode } from "react";

import { JiraSessionSectionHeading } from "@/components/blocks/product-sidebar/variants/jira-session-flyout";
import {
	SmartLink,
	type SmartLinkItem,
} from "@/components/blocks/smart-link/components/smart-link";
import { SMART_LINK_MODAL_ACTIONS } from "@/components/blocks/smart-link/data/smart-link-actions";
import { AttachmentPreviewCard } from "@/components/ui-custom/attachment-preview-card";
import { FileChartColumnIcon, FileIcon } from "@/components/ui/vpk-icons";
import { token } from "@/lib/tokens";
import type { AsxQueueSession } from "../data/queue-sessions";

const OUTPUT_ILLUSTRATIONS = [
	"accessibility",
	"certification",
	"checklist",
	"content-design",
	"customer",
	"design",
	"develop",
	"guidelines",
	"integration",
	"lightbulb",
	"onboarding",
	"platform",
	"playbook",
	"product-management",
	"project-management",
	"release-phases",
	"resilience",
	"search",
	"software",
	"trust",
] as const;

function OutputIllustration({ name, alt }: Readonly<{ name: string; alt: string }>) {
	return (
		<Image
			alt={alt}
			className="absolute inset-0 m-auto size-16 object-contain"
			height={64}
			src={`/illustration/rich-icon/${name}/standard.svg`}
			width={64}
		/>
	);
}

/** Reusable source builders that mix 1p Atlassian, 3p apps, and website links.
 * Each builder takes an explicit, human-written `title` so recipes can give every
 * session distinct, topic-specific document names rather than the same templated
 * "{Type}: {issueSummary}" string. The primary Jira work item is intentionally
 * omitted here because it already appears in the Details panel's "Work item" row. */
type QueueSourceBuilder = (session: AsxQueueSession, title: string) => SmartLinkItem;

const QUEUE_SOURCE_BUILDERS = {
	confluencePlan: (session, title) => ({
		id: `${session.id}-plan-source`,
		href: `#${session.id}-confluence`,
		title,
		variant: "confluence",
		provider: { name: "Confluence", logo: { kind: "atlassian", name: "confluence" } },
		icon: { kind: "atlassian", name: "confluence" },
		author: { name: "Priya Hansra", src: "/avatar-human/priya-hansra.png" },
		description: "Scope, owners, milestones, and rollout dependencies for this session.",
		date: "Updated today",
		actions: SMART_LINK_MODAL_ACTIONS,
	}),
	loomWalkthrough: (session, title) => ({
		id: `${session.id}-review-source`,
		href: `#${session.id}-review-walkthrough`,
		title,
		variant: "loom",
		provider: { name: "Loom", logo: { kind: "atlassian", name: "loom" } },
		icon: { kind: "atlassian", name: "loom" },
		author: { name: "Olivia Yang", src: "/avatar-human/olivia-yang.png" },
		description: "A short walkthrough of the latest decisions, evidence, and open questions.",
		date: "Recorded today",
		actions: SMART_LINK_MODAL_ACTIONS,
	}),
	driveEvidence: (session, title) => ({
		id: `${session.id}-drive-source`,
		href: `#${session.id}-drive`,
		title,
		variant: "file",
		provider: { name: "Google Drive", logo: { kind: "third-party", name: "google-drive" } },
		icon: { kind: "third-party", name: "google-drive" },
		metadata: [{ label: "Updated 3 hours ago" }],
		description: "Source spreadsheet backing the readiness matrix and supporting evidence.",
		actions: SMART_LINK_MODAL_ACTIONS,
	}),
	slackThread: (session, title) => ({
		id: `${session.id}-slack-source`,
		href: `#${session.id}-slack-thread`,
		title,
		variant: "generic",
		provider: { name: "Slack", logo: { kind: "third-party", name: "slack" } },
		icon: { kind: "third-party", name: "slack" },
		metadata: [{ label: "Last reply 1 hour ago" }],
		description: "Working thread where owners are confirming open items before submission.",
		actions: SMART_LINK_MODAL_ACTIONS,
	}),
	githubPr: (session, title) => ({
		id: `${session.id}-github-source`,
		href: `#${session.id}-github-pr`,
		title,
		variant: "pull-request",
		provider: { name: "GitHub", logo: { kind: "third-party", name: "github" } },
		icon: { kind: "third-party", name: "github" },
		status: { label: "Open", variant: "success" },
		metadata: [{ label: "Opened yesterday" }],
		description: "Pull request carrying the generated response changes for this work item.",
		actions: SMART_LINK_MODAL_ACTIONS,
	}),
	notionBrief: (session, title) => ({
		id: `${session.id}-notion-source`,
		href: `#${session.id}-notion-brief`,
		title,
		variant: "generic",
		provider: { name: "Notion", logo: { kind: "third-party", name: "notion" } },
		icon: { kind: "third-party", name: "notion" },
		author: { name: "Darius Pavri", src: "/avatar-human/darius-pavri.png" },
		date: "Edited 2 days ago",
		description: "Shared brief capturing the customer's security requirements and prior answers.",
		actions: SMART_LINK_MODAL_ACTIONS,
	}),
	zendeskTicket: (session, title) => ({
		id: `${session.id}-zendesk-source`,
		href: `#${session.id}-zendesk-ticket`,
		title,
		variant: "generic",
		provider: { name: "Zendesk", logo: { kind: "third-party", name: "zendesk" } },
		icon: { kind: "third-party", name: "zendesk" },
		metadata: [{ label: "Escalated" }],
		description: "Linked support ticket with the customer's outstanding validation questions.",
		actions: SMART_LINK_MODAL_ACTIONS,
	}),
	salesforceOpportunity: (session, title) => ({
		id: `${session.id}-salesforce-source`,
		href: `#${session.id}-salesforce-opportunity`,
		title,
		variant: "generic",
		provider: { name: "Salesforce", logo: { kind: "third-party", name: "salesforce" } },
		icon: { kind: "third-party", name: "salesforce" },
		metadata: [{ label: "Stage: Proposal" }],
		description: "Deal record with the account, contract value, and non-standard pricing notes.",
		actions: SMART_LINK_MODAL_ACTIONS,
	}),
	websitePage: (session, title) => ({
		id: `${session.id}-web-source`,
		href: `#${session.id}-website`,
		title,
		variant: "article",
		provider: { name: "acme.com", logo: { kind: "text", label: "A", tone: "information" } },
		icon: { kind: "text", label: "A", tone: "information" },
		previewImage: { kind: "brand-panel", title: "acme.com", tone: "information" },
		description: "Public web page referenced while confirming customer details.",
		actions: SMART_LINK_MODAL_ACTIONS,
	}),
	handbookPage: (session, title) => ({
		id: `${session.id}-handbook-source`,
		href: `#${session.id}-handbook`,
		title,
		variant: "article",
		provider: { name: "handbook.acme-corp.com", logo: { kind: "text", label: "H", tone: "discovery" } },
		icon: { kind: "text", label: "H", tone: "discovery" },
		previewImage: { kind: "brand-panel", title: "Handbook", tone: "discovery" },
		description: "Internal handbook page with the applicable policy and required sign-off.",
		actions: SMART_LINK_MODAL_ACTIONS,
	}),
} satisfies Record<string, QueueSourceBuilder>;

type QueueSourceEntry = { builder: keyof typeof QUEUE_SOURCE_BUILDERS; title: string };

// Per-session curated mix (max 5). Keyed by issueKey so each agent chat session
// surfaces a distinct variety of 1p, 3p, and website sources with its own
// topic-specific document names — no two sessions share a source title.
const QUEUE_SOURCE_RECIPES: Record<string, ReadonlyArray<QueueSourceEntry>> = {
	"RFP-101": [
		{ builder: "confluencePlan", title: "Acme onboarding & rollout plan" },
		{ builder: "driveEvidence", title: "Acme readiness evidence workbook" },
	],
	"RFP-102": [
		{ builder: "notionBrief", title: "Northstar security requirements brief" },
		{ builder: "githubPr", title: "PR #482: Northstar evidence sync" },
		{ builder: "slackThread", title: "#northstar-security review thread" },
	],
	"RFP-103": [
		{ builder: "confluencePlan", title: "Security response validation runbook" },
		{ builder: "zendeskTicket", title: "Ticket #7741: outstanding security questions" },
		{ builder: "websitePage", title: "Trust center: certifications & controls" },
	],
	"RFP-104": [
		{ builder: "handbookPage", title: "Discount approval policy" },
		{ builder: "salesforceOpportunity", title: "Opportunity: Acme Q3 renewal" },
		{ builder: "driveEvidence", title: "Q3 pricing exception matrix" },
		{ builder: "slackThread", title: "#deal-desk finance sign-off thread" },
	],
};

const QUEUE_SOURCE_DEFAULT_RECIPE: ReadonlyArray<QueueSourceEntry> = [
	{ builder: "confluencePlan", title: "Session plan & context" },
	{ builder: "driveEvidence", title: "Supporting evidence workbook" },
	{ builder: "loomWalkthrough", title: "Latest review walkthrough" },
];

function getQueueSourceItems(session: AsxQueueSession): SmartLinkItem[] {
	const recipe = QUEUE_SOURCE_RECIPES[session.issueKey] ?? QUEUE_SOURCE_DEFAULT_RECIPE;
	return recipe.slice(0, 5).map(({ builder, title }) => QUEUE_SOURCE_BUILDERS[builder](session, title));
}

function QueueSources({ session }: Readonly<{ session: AsxQueueSession }>) {
	return (
		<ul className="space-y-1">
			{getQueueSourceItems(session).map((source) => (
				<li className="flex min-w-0" key={source.id}>
					<SmartLink align="center" alignOffset={0} className="max-w-full" item={source} side="left" />
				</li>
			))}
		</ul>
	);
}

function pickIllustration(seed: string): string {
	let hash = 0;
	for (let index = 0; index < seed.length; index += 1) {
		hash = (hash * 31 + seed.charCodeAt(index)) | 0;
	}
	const position = Math.abs(hash) % OUTPUT_ILLUSTRATIONS.length;
	return OUTPUT_ILLUSTRATIONS[position];
}

function QueueOutput({ session }: Readonly<{ session: AsxQueueSession }>) {
	const filePrefix = session.issueKey.toLowerCase();
	const outputItems = [
		{
			id: "readiness-report",
			title: `${filePrefix}-readiness-report.pdf`,
			icon: <FileIcon className="size-3 text-icon-subtlest" size={12} />,
		},
		{
			id: "evidence-matrix",
			title: `${filePrefix}-evidence-matrix.xlsx`,
			icon: <FileChartColumnIcon className="size-3 text-icon-subtlest" size={12} />,
		},
		{
			id: "implementation-plan",
			title: `${filePrefix}-implementation-plan.docx`,
			icon: <FileIcon className="size-3 text-icon-subtlest" size={12} />,
		},
	];

	return (
		<div className="grid grid-cols-2 gap-2 px-0.5">
			{outputItems.map((item) => {
				const illustration = pickIllustration(`${session.id}-${item.id}`);
				return (
					<AttachmentPreviewCard
						key={item.id}
						preview={<OutputIllustration alt="" name={illustration} />}
						previewBackgroundColor={token("elevation.surface.sunken")}
						title={item.title}
						trailingVisual={item.icon}
					/>
				);
			})}
		</div>
	);
}

function ArtifactSection({
	children,
	id,
	title,
}: Readonly<{
	children: ReactNode;
	id: string;
	title: string;
}>) {
	return (
		<section aria-labelledby={id} className="flex flex-col gap-2 px-4 pt-4">
			<JiraSessionSectionHeading id={id}>{title}</JiraSessionSectionHeading>
			{children}
		</section>
	);
}

export function QueueDetailArtifacts({ session }: Readonly<{ session: AsxQueueSession }>) {
	return (
		<>
			<ArtifactSection id="asx-queue-sources-heading" title="Sources">
				<QueueSources session={session} />
			</ArtifactSection>
			<ArtifactSection id="asx-queue-output-heading" title="Output">
				<QueueOutput session={session} />
			</ArtifactSection>
		</>
	);
}
