const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { readDetailCategorySource } = require(process.cwd() + "/app/data/details/test-source.cjs");
const { readWebsiteRegistrySource } = require(process.cwd() + "/components/website/registry/test-source.cjs");

const DIR = __dirname;
const COMPONENT_SOURCE = fs.readFileSync(
	path.join(DIR, "components", "pull-request-header.tsx"),
	"utf8",
);
const TYPES_SOURCE = fs.readFileSync(
	path.join(DIR, "components", "pull-request-header-types.ts"),
	"utf8",
);
const DATA_SOURCE = fs.readFileSync(
	path.join(DIR, "data", "demo-pull-request-header.ts"),
	"utf8",
);
const PAGE_SOURCE = fs.readFileSync(path.join(DIR, "page.tsx"), "utf8");
const INDEX_SOURCE = fs.readFileSync(path.join(DIR, "index.ts"), "utf8");
const DEMO_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components", "website", "demos", "blocks", "pull-request-header-demo.tsx"),
	"utf8",
);
const COMPONENTS_SOURCE = fs.readFileSync(path.join(process.cwd(), "app", "data", "components.ts"), "utf8");
const COMPONENT_MANIFEST_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "app", "data", "component-manifest.ts"),
	"utf8",
);
const NAV_ADS_SOURCE = fs.readFileSync(path.join(process.cwd(), "app", "data", "nav-ads.ts"), "utf8");
const BLOCK_DETAILS_SOURCE = readDetailCategorySource("blocks");
const REGISTRY_SOURCE = readWebsiteRegistrySource();

test("PullRequestHeader exposes the detail header props contract", () => {
	assert.match(TYPES_SOURCE, /export type PullRequestHeaderStatus = "Open" \| "Merged"/u);
	assert.match(
		TYPES_SOURCE,
		/export type PullRequestHeaderVariant = "expanded" \| "compact"/u,
	);
	assert.match(TYPES_SOURCE, /variant\?: PullRequestHeaderVariant/u);
	assert.match(
		TYPES_SOURCE,
		/scrollContainerRef\?: RefObject<HTMLElement \| null>/u,
	);
	assert.match(TYPES_SOURCE, /collapseOffset\?: number/u);
	assert.match(
		TYPES_SOURCE,
		/export interface PullRequestHeaderProps[\s\S]*number: number;[\s\S]*title: string;[\s\S]*status: PullRequestHeaderStatus;[\s\S]*authorName: string;[\s\S]*authorAvatarSrc\?: string;[\s\S]*baseBranch\?: string \| null;[\s\S]*headBranch\?: string \| null;[\s\S]*repository: string;[\s\S]*additions: number;[\s\S]*deletions: number;[\s\S]*updatedTime: string;[\s\S]*url: string;/u,
	);
});

test("PullRequestHeader resolves controlled and scroll-driven variants", () => {
	assert.match(COMPONENT_SOURCE, /function resolveVariant/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /export function resolveVariant/u);
	assert.match(
		COMPONENT_SOURCE,
		/if \(variant\) \{[\s\S]*return variant;[\s\S]*scrollTop[\s\S]*>= collapseOffset[\s\S]*\? "compact"[\s\S]*: "expanded"/u,
	);
	assert.match(COMPONENT_SOURCE, /const DEFAULT_COLLAPSE_OFFSET = 16/u);
	assert.match(COMPONENT_SOURCE, /useSyncExternalStore/u);
	assert.match(COMPONENT_SOURCE, /addEventListener\("scroll"/u);
});

test("PullRequestHeader animates meta collapse and honors reduced motion", () => {
	assert.match(
		COMPONENT_SOURCE,
		/import \{ AnimatePresence, motion, useReducedMotion \} from "motion\/react"/u,
	);
	assert.match(COMPONENT_SOURCE, /<header[\s\S]*<motion\.div[\s\S]*layout/u);
	assert.match(COMPONENT_SOURCE, /<AnimatePresence initial=\{false\}>/u);
	assert.match(COMPONENT_SOURCE, /animate=\{\{ opacity: 1 \}\}/u);
	assert.match(COMPONENT_SOURCE, /exit=\{\{[\s\S]*opacity: 0/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /(?:animate|initial)=\{\{[^}]*height|height: 0/u);
	assert.match(COMPONENT_SOURCE, /const shouldReduceMotion = useReducedMotion\(\) \?\? false/u);
	assert.match(COMPONENT_SOURCE, /duration: 0\.2,[\s\S]*ease: \[0, 0\.4, 0, 1\]/u);
	assert.match(COMPONENT_SOURCE, /duration: 0\.1,[\s\S]*ease: \[0\.6, 0, 0\.8, 0\.6\]/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /var\(--(?:duration|ease)-/u);
});

test("PullRequestHeader matches the PR detail header design", () => {
	assert.match(COMPONENT_SOURCE, /className=\{cn\("border-b border-border pb-4", className\)\}/u);
	assert.match(COMPONENT_SOURCE, /from "@\/components\/ui\/avatar"/u);
	assert.match(COMPONENT_SOURCE, /from "@\/components\/ui\/button"/u);
	assert.match(COMPONENT_SOURCE, /from "@\/components\/ui\/lozenge"/u);
	assert.match(COMPONENT_SOURCE, /from "@\/components\/ui\/logo-third-party"/u);
	assert.match(COMPONENT_SOURCE, /GithubLogo/u);
	assert.match(COMPONENT_SOURCE, /Open in GitHub/u);
	assert.match(COMPONENT_SOURCE, /aria-label="Open pull request in GitHub"/u);
	assert.match(COMPONENT_SOURCE, /ExternalLinkIcon/u);
	assert.match(COMPONENT_SOURCE, /shrink-0 text-text-subtle">#\{number\}/u);
	assert.match(COMPONENT_SOURCE, /font: token\("font\.heading\.medium"\)/u);
	assert.match(COMPONENT_SOURCE, /case "Open":[\s\S]*return "success"/u);
	assert.match(COMPONENT_SOURCE, /case "Merged":[\s\S]*return "discovery"/u);
	assert.match(COMPONENT_SOURCE, /const _exhaustive: never = status/u);
	assert.match(COMPONENT_SOURCE, /baseBranch && headBranch/u);
	assert.match(COMPONENT_SOURCE, /aria-hidden className="text-text">[\s\S]*←/u);
	assert.match(COMPONENT_SOURCE, /text-text-success">\+\{additions\}/u);
	assert.match(COMPONENT_SOURCE, /text-text-danger">-\{deletions\}/u);
	assert.match(COMPONENT_SOURCE, /Updated \{updatedTime\}/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /data-jira-work-item-pull-request-detail-header/u);
});

test("Pull Request Header demo shows controlled and scroll-driven modes", () => {
	assert.match(DATA_SOURCE, /number: 1847/u);
	assert.match(DATA_SOURCE, /baseBranch: "main"/u);
	assert.match(DATA_SOURCE, /headBranch: "feature\/shop-4821-guest-checkout"/u);
	assert.match(DATA_SOURCE, /additions: 86/u);
	assert.match(DATA_SOURCE, /deletions: 21/u);
	assert.match(DATA_SOURCE, /updatedTime: "20m ago"/u);
	assert.match(
		PAGE_SOURCE,
		/h-full min-h-\[360px\] w-full overflow-y-auto/u,
	);
	assert.match(PAGE_SOURCE, /DEMO_PULL_REQUEST_HEADER/u);
	assert.match(PAGE_SOURCE, /Controlled variant/u);
	assert.match(PAGE_SOURCE, /value=\{\[variant\]\}/u);
	assert.match(PAGE_SOURCE, /Scroll-driven variant/u);
	assert.match(PAGE_SOURCE, /scrollContainerRef=\{scrollContainerRef\}/u);
});

test("Pull Request Header block is registered in the website catalog", () => {
	assert.match(INDEX_SOURCE, /export \{ PullRequestHeader \}/u);
	assert.match(INDEX_SOURCE, /DEMO_PULL_REQUEST_HEADER/u);
	assert.match(DEMO_SOURCE, /from "@\/components\/blocks\/pull-request-header\/page"/u);
	assert.match(
		COMPONENTS_SOURCE,
		/blockComponent\("pull-request-header", "Pull Request Header"\)/u,
	);
	assert.match(
		COMPONENT_MANIFEST_SOURCE,
		/blockComponent\("pull-request-header", "Pull Request Header"\)/u,
	);
	assert.match(NAV_ADS_SOURCE, /"pull-request-header"/u);
	assert.match(
		BLOCK_DETAILS_SOURCE,
		/PULL_REQUEST_HEADER_DETAIL|"pull-request-header": PULL_REQUEST_HEADER_DETAIL/u,
	);
	assert.match(BLOCK_DETAILS_SOURCE, /scrollContainerRef/u);
	assert.match(BLOCK_DETAILS_SOURCE, /collapseOffset/u);
	assert.match(REGISTRY_SOURCE, /"pull-request-header": dynamic\(/u);
});
