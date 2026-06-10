import type { IconTileVariant } from "@/components/ui/icon-tile";

export type AtlassianSkillCollectionId =
	| "teamwork"
	| "strategy"
	| "service"
	| "software"
	| "product";

export type SkillCollectionId =
	| AtlassianSkillCollectionId
	| "platform"
	| "marketplace"
	| "custom"
	| "default";

export interface SkillCollectionMetadata {
	id: SkillCollectionId;
	label: string;
	description: string;
	products: readonly string[];
	docsUrl: string;
	iconClassName: string;
	slashClassName: string;
	iconTileVariant: IconTileVariant;
}

export const ATLASSIAN_SKILL_COLLECTION_IDS: readonly AtlassianSkillCollectionId[] = [
	"teamwork",
	"strategy",
	"service",
	"software",
	"product",
];

export const SKILL_COLLECTIONS: Record<SkillCollectionId, SkillCollectionMetadata> = {
	teamwork: {
		id: "teamwork",
		label: "Teamwork Collection",
		description: "Supercharge teamwork across planning, documentation, async updates, and AI-assisted collaboration.",
		products: ["Jira", "Confluence", "Loom", "Rovo"],
		docsUrl: "https://www.atlassian.com/collections/teamwork",
		iconClassName: "text-icon-accent-blue",
		slashClassName: "bg-border-accent-blue",
		iconTileVariant: "blue",
	},
	strategy: {
		id: "strategy",
		label: "Strategy Collection",
		description: "Turn strategy into outcomes with portfolio planning, prioritization, talent alignment, and decision support.",
		products: ["Focus", "Talent", "Align", "Rovo"],
		docsUrl: "https://www.atlassian.com/collections/strategy",
		iconClassName: "text-icon-accent-orange",
		slashClassName: "bg-border-accent-orange",
		iconTileVariant: "orange",
	},
	service: {
		id: "service",
		label: "Service Collection",
		description: "Deliver high-velocity employee and customer service with connected assets, requests, and operational context.",
		products: ["Jira Service Management", "Customer Service Management", "Assets", "Rovo"],
		docsUrl: "https://www.atlassian.com/collections/service",
		iconClassName: "text-icon-accent-yellow",
		slashClassName: "bg-border-accent-yellow",
		iconTileVariant: "yellow",
	},
	software: {
		id: "software",
		label: "Software Collection",
		description: "Ship high-quality software faster with developer agents, source control, CI/CD, and delivery insights.",
		products: ["Rovo Dev", "DX", "Pipelines", "Bitbucket"],
		docsUrl: "https://www.atlassian.com/collections/software",
		iconClassName: "text-icon-accent-green",
		slashClassName: "bg-border-accent-green",
		iconTileVariant: "green",
	},
	product: {
		id: "product",
		label: "Product Collection",
		description: "Build products with confidence by connecting feedback, discovery, prioritization, roadmaps, and delivery.",
		products: ["Feedback", "Jira Product Discovery", "Rovo"],
		docsUrl: "https://www.atlassian.com/collections/product",
		iconClassName: "text-icon-accent-purple",
		slashClassName: "bg-border-accent-purple",
		iconTileVariant: "purple",
	},
	platform: {
		id: "platform",
		label: "Atlassian Platform",
		description: "Core platform skills for governance, automation, administration, and cross-product system operations.",
		products: ["Atlassian Administration", "Automation", "Rovo"],
		docsUrl: "https://www.atlassian.com/platform",
		iconClassName: "text-icon-accent-gray",
		slashClassName: "bg-border-accent-gray",
		iconTileVariant: "gray",
	},
	marketplace: {
		id: "marketplace",
		label: "Marketplace apps",
		description: "Partner and third-party skills that connect external apps into the Atlassian system of work.",
		products: ["Marketplace", "Third-party apps"],
		docsUrl: "https://marketplace.atlassian.com",
		iconClassName: "text-icon-accent-gray",
		slashClassName: "bg-border-accent-gray",
		iconTileVariant: "gray",
	},
	custom: {
		id: "custom",
		label: "Custom skills",
		description: "User-authored skills tailored to local workflows, teams, and project-specific operating patterns.",
		products: ["Custom"],
		docsUrl: "https://www.atlassian.com/software/rovo",
		iconClassName: "text-icon-accent-gray",
		slashClassName: "bg-border-accent-gray",
		iconTileVariant: "gray",
	},
	default: {
		id: "default",
		label: "General skills",
		description: "General-purpose skills available across many teams and workflows.",
		products: ["Rovo"],
		docsUrl: "https://www.atlassian.com/software/rovo",
		iconClassName: "text-icon-accent-gray",
		slashClassName: "bg-border-accent-gray",
		iconTileVariant: "gray",
	},
};

export function getSkillCollectionMetadata(collectionId: SkillCollectionId): SkillCollectionMetadata {
	return SKILL_COLLECTIONS[collectionId];
}
