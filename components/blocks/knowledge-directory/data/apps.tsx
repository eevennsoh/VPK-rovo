"use client";

import type { ReactNode } from "react";

import {
	ConfluenceIcon,
	LoomIcon,
} from "@/components/ui/logo";

export type KnowledgeDirectoryMode = "all" | "custom";

export interface KnowledgeDirectoryContent {
	id: string;
	name: string;
	description: string;
}

export interface KnowledgeDirectoryApp {
	id: string;
	name: string;
	description: string;
	providerName: string;
	icon: ReactNode;
	contents: readonly KnowledgeDirectoryContent[];
}

function ThirdPartyLogo({ src }: Readonly<{ src: string }>) {
	return (
		<span
			aria-hidden="true"
			className="block size-5 bg-contain bg-center bg-no-repeat"
			style={{ backgroundImage: `url(${src})` }}
		/>
	);
}

export const DEFAULT_KNOWLEDGE_APPS: readonly KnowledgeDirectoryApp[] = [
	{
		id: "confluence",
		name: "Confluence",
		description: "Create, organize, and reuse rich pages, decisions, and project documentation.",
		providerName: "Atlassian",
		icon: <ConfluenceIcon label="" size="small" />,
		contents: [
			{ id: "product-requirements", name: "Product requirements", description: "Specs, goals, and release criteria across product spaces." },
			{ id: "team-decisions", name: "Team decisions", description: "Decision logs and supporting context from project pages." },
			{ id: "customer-research", name: "Customer research", description: "Interview notes, feedback summaries, and insight reports." },
			{ id: "runbooks", name: "Runbooks", description: "Operational guides and troubleshooting playbooks." },
		],
	},
	{
		id: "google-drive",
		name: "Google Drive",
		description: "Connect shared documents, folders, spreadsheets, and team files from Drive.",
		providerName: "Google",
		icon: <ThirdPartyLogo src="/3p/google-drive/20.svg" />,
		contents: [
			{ id: "strategy-folder", name: "Strategy folder", description: "Planning docs and team strategy materials." },
			{ id: "research-notes", name: "Research notes", description: "Collaborative notes and interview synthesis." },
			{ id: "launch-spreadsheet", name: "Launch spreadsheet", description: "Milestones, owners, and readiness tracking." },
			{ id: "brand-assets", name: "Brand assets", description: "Shared references for campaign and product work." },
		],
	},
	{
		id: "microsoft-teams",
		name: "Microsoft Teams",
		description: "Reuse channel conversations, shared decisions, and collaboration history.",
		providerName: "Microsoft",
		icon: <ThirdPartyLogo src="/3p/microsoft-teams/20.svg" />,
		contents: [
			{ id: "engineering-channel", name: "Engineering channel", description: "Implementation threads and technical decisions." },
			{ id: "support-channel", name: "Support channel", description: "Customer issues, resolutions, and escalation notes." },
			{ id: "weekly-sync", name: "Weekly sync", description: "Team updates, blockers, and follow-up actions." },
			{ id: "sales-enablement", name: "Sales enablement", description: "Field questions and product positioning notes." },
		],
	},
	{
		id: "sharepoint",
		name: "Microsoft SharePoint",
		description: "Connect team sites, policies, and document libraries from SharePoint.",
		providerName: "Microsoft",
		icon: <ThirdPartyLogo src="/3p/microsoft-sharepoint/20.svg" />,
		contents: [
			{ id: "policy-library", name: "Policy library", description: "Governance, security, and compliance documents." },
			{ id: "team-site", name: "Team site", description: "Department resources and operating procedures." },
			{ id: "proposal-library", name: "Proposal library", description: "Reusable sales and procurement responses." },
			{ id: "training-materials", name: "Training materials", description: "Enablement decks, guides, and onboarding docs." },
		],
	},
	{
		id: "github",
		name: "GitHub",
		description: "Connect issues, pull requests, code discussions, and repository documentation.",
		providerName: "GitHub",
		icon: <ThirdPartyLogo src="/3p/github/20.svg" />,
		contents: [
			{ id: "repository-readme", name: "Repository README", description: "Project overview, setup, and contribution guidance." },
			{ id: "open-issues", name: "Open issues", description: "Prioritized bug reports and feature requests." },
			{ id: "pull-requests", name: "Pull requests", description: "Implementation discussion and review context." },
			{ id: "architecture-docs", name: "Architecture docs", description: "Technical decisions and system diagrams." },
		],
	},
	{
		id: "loom",
		name: "Loom",
		description: "Use recorded walkthroughs, async updates, and product demos as knowledge.",
		providerName: "Atlassian",
		icon: <LoomIcon label="" size="small" />,
		contents: [
			{ id: "product-walkthroughs", name: "Product walkthroughs", description: "Recorded feature tours and demo flows." },
			{ id: "customer-demos", name: "Customer demos", description: "Discovery calls and solution walkthroughs." },
			{ id: "team-updates", name: "Team updates", description: "Async status updates and roadmap briefings." },
			{ id: "research-clips", name: "Research clips", description: "Short clips from usability sessions and interviews." },
		],
	},
];
