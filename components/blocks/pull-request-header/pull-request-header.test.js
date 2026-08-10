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
const VARIANT_SOURCE = fs.readFileSync(
	path.join(DIR, "components", "pull-request-header-variant.ts"),
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
	assert.match(
		TYPES_SOURCE,
		/export type PullRequestHeaderMergeState =[\s\S]*"checks-running"[\s\S]*"merge-conflicts"[\s\S]*"ready"/u,
	);
	assert.match(TYPES_SOURCE, /variant\?: PullRequestHeaderVariant/u);
	assert.match(
		TYPES_SOURCE,
		/scrollContainerRef\?: RefObject<HTMLElement \| null>/u,
	);
	assert.match(TYPES_SOURCE, /collapseOffset\?: number/u);
	assert.match(TYPES_SOURCE, /mergeState\?: PullRequestHeaderMergeState/u);
	assert.match(TYPES_SOURCE, /autoMerge\?: boolean/u);
	assert.match(TYPES_SOURCE, /defaultAutoMerge\?: boolean/u);
	assert.match(TYPES_SOURCE, /onAutoMergeChange\?: \(enabled: boolean\) => void/u);
	assert.match(TYPES_SOURCE, /onChatClick\?: \(\) => void/u);
	assert.match(TYPES_SOURCE, /onMergeClick\?: \(\) => void/u);
	assert.match(TYPES_SOURCE, /onMoreActionsClick\?: \(\) => void/u);
	assert.match(
		TYPES_SOURCE,
		/export interface PullRequestHeaderProps[\s\S]*number: number;[\s\S]*title: string;[\s\S]*status: PullRequestHeaderStatus;[\s\S]*baseBranch\?: string \| null;[\s\S]*headBranch\?: string \| null;[\s\S]*repository: string;/u,
	);
	assert.doesNotMatch(TYPES_SOURCE, /url: string/u);
	assert.doesNotMatch(TYPES_SOURCE, /authorName/u);
	assert.doesNotMatch(TYPES_SOURCE, /additions/u);
	assert.doesNotMatch(TYPES_SOURCE, /updatedTime/u);
});

test("PullRequestHeader resolves controlled and scroll-driven variants", () => {
	assert.match(VARIANT_SOURCE, /export function resolveVariant/u);
	assert.match(VARIANT_SOURCE, /const DEFAULT_COLLAPSE_OFFSET = 16/u);
	assert.match(
		VARIANT_SOURCE,
		/if \(variant\) \{[\s\S]*return variant;[\s\S]*scrollTop[\s\S]*>= collapseOffset[\s\S]*\? "compact"[\s\S]*: "expanded"/u,
	);
	assert.match(
		COMPONENT_SOURCE,
		/from "@\/components\/blocks\/pull-request-header\/components\/pull-request-header-variant"/u,
	);
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
	assert.match(
		COMPONENT_SOURCE,
		/animate=\{\{ opacity: 1, transform: "translateY\(0px\)" \}\}/u,
	);
	assert.match(COMPONENT_SOURCE, /exit=\{\{[\s\S]*opacity: 0,[\s\S]*transform: "translateY\(-4px\)"/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /height:\s*(?:0|"auto")/u);
	assert.match(COMPONENT_SOURCE, /const shouldReduceMotion = useReducedMotion\(\) \?\? false/u);
	assert.match(COMPONENT_SOURCE, /duration: 0\.2,[\s\S]*ease: \[0, 0\.4, 0, 1\]/u);
	assert.match(COMPONENT_SOURCE, /duration: 0\.1,[\s\S]*ease: \[0\.6, 0, 0\.8, 0\.6\]/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /var\(--(?:duration|ease)-/u);
});

test("PullRequestHeader uses a two-row title and meta layout with action group", () => {
	assert.match(COMPONENT_SOURCE, /className=\{cn\("border-b border-border pb-4", className\)\}/u);
	assert.match(COMPONENT_SOURCE, /from "@\/components\/ui\/button"/u);
	assert.match(COMPONENT_SOURCE, /from "@\/components\/ui\/button-group"/u);
	assert.match(COMPONENT_SOURCE, /variant="separated"/u);
	assert.match(
		COMPONENT_SOURCE,
		/<ButtonGroup[\s\S]*variant="separated"[\s\S]*<ButtonGroup>[\s\S]*aria-label="Chat"[\s\S]*<ButtonGroup>[\s\S]*aria-label="Auto merge"[\s\S]*<\/ButtonGroup>[\s\S]*<ButtonGroup>[\s\S]*mergeStateLabel[\s\S]*<\/ButtonGroup>[\s\S]*<ButtonGroup>[\s\S]*aria-label="More actions"/u,
	);
	assert.match(COMPONENT_SOURCE, /from "@\/components\/ui\/toggle"/u);
	assert.match(COMPONENT_SOURCE, /from "@\/components\/ui\/lozenge"/u);
	assert.match(COMPONENT_SOURCE, /from "@\/components\/ui\/tag"/u);
	assert.match(COMPONENT_SOURCE, /from "@\/components\/ui\/logo-mark"/u);
	assert.match(COMPONENT_SOURCE, /BrandLogoMark[\s\S]*name="github"/u);
	assert.match(COMPONENT_SOURCE, /from "@atlaskit\/icon\/core\/comment"/u);
	assert.match(COMPONENT_SOURCE, /from "@atlaskit\/icon\/core\/show-more-horizontal"/u);
	assert.match(COMPONENT_SOURCE, /className="w-full flex-wrap sm:w-auto"/u);
	assert.match(COMPONENT_SOURCE, /disabled=\{!onChatClick\}/u);
	assert.match(COMPONENT_SOURCE, /disabled=\{!onAutoMergeChange\}/u);
	assert.match(
		COMPONENT_SOURCE,
		/disabled=\{!onMergeClick \|\| mergeState !== "ready"\}/u,
	);
	assert.match(COMPONENT_SOURCE, /disabled=\{!onMoreActionsClick\}/u);
	assert.match(COMPONENT_SOURCE, /aria-label="Chat"/u);
	assert.match(COMPONENT_SOURCE, /aria-label="Auto merge"/u);
	assert.match(COMPONENT_SOURCE, /aria-label="More actions"/u);
	assert.match(COMPONENT_SOURCE, /Auto merge/u);
	assert.match(COMPONENT_SOURCE, /defaultPressed: defaultAutoMerge/u);
	assert.match(COMPONENT_SOURCE, /DEFAULT_AUTO_MERGE = true/u);
	assert.match(COMPONENT_SOURCE, /case "checks-running":[\s\S]*return "Checks running"/u);
	assert.match(COMPONENT_SOURCE, /case "merge-conflicts":[\s\S]*return "Merge conflicts"/u);
	assert.match(COMPONENT_SOURCE, /case "ready":[\s\S]*return "Merge"/u);
	assert.match(
		COMPONENT_SOURCE,
		/resolvedVariant === "compact" \? "text-sm" : "text-base"/u,
	);
	assert.match(
		COMPONENT_SOURCE,
		/transition-\[font-size\] duration-medium ease-in-out motion-reduce:transition-none/u,
	);
	assert.match(COMPONENT_SOURCE, /case "Open":[\s\S]*return "success"/u);
	assert.match(COMPONENT_SOURCE, /case "Merged":[\s\S]*return "discovery"/u);
	assert.match(COMPONENT_SOURCE, /const _exhaustive: never = status/u);
	assert.match(COMPONENT_SOURCE, /sm:items-center sm:justify-between/u);
	assert.match(
		COMPONENT_SOURCE,
		/function BranchName[\s\S]*lastIndexOf\("\/"\)[\s\S]*text-text-subtlest/u,
	);
	assert.match(
		COMPONENT_SOURCE,
		/<BranchName name=\{branchPair\.headBranch\} \/>[\s\S]*→[\s\S]*<BranchName name=\{branchPair\.baseBranch\} \/>/u,
	);
	assert.doesNotMatch(COMPONENT_SOURCE, /Open in GitHub/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /ExternalLinkIcon/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /from "@\/components\/ui\/avatar"/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /GithubLogo/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /additions/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /Updated \{updatedTime\}/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /data-jira-work-item-pull-request-detail-header/u);
});

test("Pull Request Header demo shows controlled and scroll-driven modes", () => {
	assert.match(DATA_SOURCE, /number: 1847/u);
	assert.match(DATA_SOURCE, /baseBranch: "main"/u);
	assert.match(DATA_SOURCE, /headBranch: "feature\/guest-checkout"/u);
	assert.match(DATA_SOURCE, /mergeState: "ready"/u);
	assert.match(DATA_SOURCE, /defaultAutoMerge: true/u);
	assert.doesNotMatch(DATA_SOURCE, /url:/u);
	assert.doesNotMatch(DATA_SOURCE, /authorName/u);
	assert.doesNotMatch(DATA_SOURCE, /additions/u);
	assert.doesNotMatch(DATA_SOURCE, /updatedTime/u);
	assert.match(
		PAGE_SOURCE,
		/h-full min-h-\[360px\] w-full overflow-y-auto/u,
	);
	assert.match(PAGE_SOURCE, /DEMO_PULL_REQUEST_HEADER/u);
	assert.match(PAGE_SOURCE, />Merge</u);
	assert.match(PAGE_SOURCE, /value=\{\[variant\]\}/u);
	assert.match(PAGE_SOURCE, /mergeState="ready"/u);
	assert.match(PAGE_SOURCE, /mergeState="checks-running"/u);
	assert.match(PAGE_SOURCE, /mergeState="merge-conflicts"/u);
	assert.match(PAGE_SOURCE, /Checks running/u);
	assert.match(PAGE_SOURCE, /Merge conflicts/u);
	assert.doesNotMatch(PAGE_SOURCE, /Merge button label/u);
	assert.doesNotMatch(PAGE_SOURCE, /Pull request merge state/u);
	assert.doesNotMatch(PAGE_SOURCE, /mergeState=\{mergeState\}/u);
	assert.match(PAGE_SOURCE, /Scroll-driven variant/u);
	assert.match(PAGE_SOURCE, /scrollContainerRef=\{scrollContainerRef\}/u);
});

test("Pull Request Header block is registered in the website catalog", () => {
	assert.match(INDEX_SOURCE, /export \{ PullRequestHeader \}/u);
	assert.match(INDEX_SOURCE, /PullRequestHeaderMergeState/u);
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
	assert.match(BLOCK_DETAILS_SOURCE, /mergeState/u);
	assert.match(BLOCK_DETAILS_SOURCE, /defaultAutoMerge/u);
	assert.match(BLOCK_DETAILS_SOURCE, /onMoreActionsClick/u);
	assert.doesNotMatch(BLOCK_DETAILS_SOURCE, /Open in GitHub/u);
	assert.doesNotMatch(BLOCK_DETAILS_SOURCE, /authorName/u);
	assert.match(REGISTRY_SOURCE, /"pull-request-header": dynamic\(/u);
});
