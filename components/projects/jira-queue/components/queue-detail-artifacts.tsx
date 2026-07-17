import Image from "next/image";
import type { ReactNode } from "react";

import {
	SmartLink,
	type SmartLinkItem,
} from "@/components/blocks/smart-link/components/smart-link";
import { AttachmentPreviewCard } from "@/components/ui-custom/attachment-preview-card";
import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
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

const JIRA_STATUS_VARIANTS = {
	"To do": "neutral",
	"In progress": "information",
	"In review": "information",
	Done: "success",
} as const;

function getQueueSourceItems(session: AsxQueueSession): SmartLinkItem[] {
	return [
		{
			id: `${session.id}-jira-source`,
			href: `#${session.issueKey.toLowerCase()}`,
			title: `${session.issueKey}: ${session.issueSummary}`,
			variant: "jira",
			provider: { name: "Jira", logo: { kind: "atlassian", name: "jira" } },
			icon: { kind: "atlassian", name: "jira" },
			description: `Primary work item for ${session.title}.`,
			status: {
				label: session.jiraColumn,
				variant: JIRA_STATUS_VARIANTS[session.jiraColumn],
			},
		},
		{
			id: `${session.id}-plan-source`,
			href: `#${session.id}-implementation-plan`,
			title: `Implementation plan: ${session.issueSummary}`,
			variant: "confluence",
			provider: { name: "Confluence", logo: { kind: "atlassian", name: "confluence" } },
			icon: { kind: "atlassian", name: "confluence" },
			description: "Scope, owners, milestones, and rollout dependencies for this session.",
			date: "Updated today",
		},
		{
			id: `${session.id}-review-source`,
			href: `#${session.id}-review-walkthrough`,
			title: `Review walkthrough: ${session.issueSummary}`,
			variant: "loom",
			provider: { name: "Loom", logo: { kind: "atlassian", name: "loom" } },
			icon: { kind: "atlassian", name: "loom" },
			description: "A short walkthrough of the latest decisions, evidence, and open questions.",
			date: "Recorded today",
		},
	];
}

function QueueSources({ session }: Readonly<{ session: AsxQueueSession }>) {
	return (
		<ul className="space-y-1">
			{getQueueSourceItems(session).map((source) => (
				<li className="flex min-w-0" key={source.id}>
					<SmartLink align="end" className="max-w-full" item={source} side="left" />
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
		<section aria-labelledby={id} className="space-y-2 px-4 py-6">
			<Heading as="h3" id={id} size="xxsmall">
				{title}
			</Heading>
			{children}
		</section>
	);
}

export function QueueDetailArtifacts({ session }: Readonly<{ session: AsxQueueSession }>) {
	return (
		<>
			<Separator className="mx-4 data-horizontal:w-auto" />
			<ArtifactSection id="asx-queue-sources-heading" title="Sources">
				<QueueSources session={session} />
			</ArtifactSection>
			<Separator className="mx-4 data-horizontal:w-auto" />
			<ArtifactSection id="asx-queue-output-heading" title="Output">
				<QueueOutput session={session} />
			</ArtifactSection>
		</>
	);
}
