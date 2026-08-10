const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { readDetailCategorySource } = require(process.cwd() + "/app/data/details/test-source.cjs");
const { readWebsiteRegistrySource } = require(process.cwd() + "/components/website/registry/test-source.cjs");

const DIR = __dirname;
const COMPONENT_SOURCE = fs.readFileSync(path.join(DIR, "components", "pull-request.tsx"), "utf8");
const TYPES_SOURCE = fs.readFileSync(path.join(DIR, "components", "pull-request-types.ts"), "utf8");
const DATA_SOURCE = fs.readFileSync(path.join(DIR, "data", "demo-pull-requests.ts"), "utf8");
const PAGE_SOURCE = fs.readFileSync(path.join(DIR, "page.tsx"), "utf8");
const INDEX_SOURCE = fs.readFileSync(path.join(DIR, "index.ts"), "utf8");
const DEMO_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components", "website", "demos", "blocks", "pull-request-demo.tsx"),
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

test("PullRequest exposes the compact card props contract", () => {
	assert.match(TYPES_SOURCE, /export type PullRequestStatus = "Open" \| "Merged"/u);
	assert.match(
		TYPES_SOURCE,
		/export interface PullRequestAuthor \{[\s\S]*name: string;[\s\S]*avatarUrl\?: string;/u,
	);
	assert.match(
		TYPES_SOURCE,
		/export interface PullRequestProps \{[\s\S]*number: number;[\s\S]*title: string;[\s\S]*status: PullRequestStatus;[\s\S]*author\?: PullRequestAuthor;[\s\S]*repository\?: string;[\s\S]*branch\?: string;[\s\S]*additions: number;[\s\S]*deletions: number;[\s\S]*timestampMs\?: number;[\s\S]*relativeTime\?: string;[\s\S]*selected\?: boolean;[\s\S]*onActivate\?: \(\) => void;/u,
	);
});

test("PullRequest card reuses Avatar, Tag, Lozenge, BrandLogoMark, and RelativeTime", () => {
	assert.match(COMPONENT_SOURCE, /from "@\/components\/ui\/avatar"/u);
	assert.match(COMPONENT_SOURCE, /from "@\/components\/ui\/tag"/u);
	assert.match(COMPONENT_SOURCE, /from "@\/components\/ui\/lozenge"/u);
	assert.match(COMPONENT_SOURCE, /from "@\/components\/ui\/logo-mark"/u);
	assert.match(COMPONENT_SOURCE, /from "@\/components\/ui\/elapsed-time"/u);
	assert.match(COMPONENT_SOURCE, /BrandLogoMark[\s\S]*name="github"/u);
	assert.match(COMPONENT_SOURCE, /<RelativeTime/u);
	assert.match(COMPONENT_SOURCE, /text-text-success">\+\{additions\}/u);
	assert.match(COMPONENT_SOURCE, /text-text-danger">-\{deletions\}/u);
	assert.match(
		COMPONENT_SOURCE,
		/aria-label=\{`\$\{additions\} additions, \$\{deletions\} deletions`\}[\s\S]*role="group"/u,
	);
	assert.match(COMPONENT_SOURCE, /branch \? \([\s\S]*BranchIcon/u);
	assert.match(
		COMPONENT_SOURCE,
		/flex min-w-0 flex-nowrap items-center gap-1\.5 overflow-hidden/u,
	);
	assert.match(COMPONENT_SOURCE, /case "Open":[\s\S]*return "information"/u);
	assert.match(COMPONENT_SOURCE, /case "Merged":[\s\S]*return "discovery"/u);
	assert.match(COMPONENT_SOURCE, /const _exhaustive: never = status/u);
});

test("PullRequest selection styling works for read-only and interactive cards", () => {
	assert.match(
		COMPONENT_SOURCE,
		/if \(onActivate\) \{[\s\S]*<button[\s\S]*aria-pressed=\{selected\}[\s\S]*onClick=\{onActivate\}[\s\S]*type="button"/u,
	);
	assert.match(
		COMPONENT_SOURCE,
		/const activeSelected = selected;[\s\S]*activeSelected\s*\?\s*"border-border-selected bg-bg-selected text-text-selected"\s*:\s*null,[\s\S]*onActivate && activeSelected\s*\?\s*"hover:bg-bg-selected-hovered"/u,
	);
	assert.match(
		COMPONENT_SOURCE,
		/<div[\s\S]*aria-current=\{selected \? "true" : undefined\}[\s\S]*data-pull-request=\{number\}[\s\S]*data-selected=\{selected \? "true" : undefined\}[\s\S]*role="group"/u,
	);
	assert.match(COMPONENT_SOURCE, /border border-border bg-surface/u);
	assert.match(
		COMPONENT_SOURCE,
		/selected \? "text-text-selected" : "text-text-subtlest"/u,
	);
	assert.doesNotMatch(COMPONENT_SOURCE, /bg-\[#|text-\[#|purple-500|Open preview modal/u);
});

test("Pull Request block is registered in the website catalog", () => {
	assert.match(INDEX_SOURCE, /export \{ PullRequest \}/u);
	assert.match(INDEX_SOURCE, /DEMO_PULL_REQUESTS/u);
	assert.match(PAGE_SOURCE, /DEMO_PULL_REQUESTS\.map/u);
	assert.match(DATA_SOURCE, /export const DEMO_PULL_REQUESTS/u);
	assert.match(DEMO_SOURCE, /from "@\/components\/blocks\/pull-request\/page"/u);
	assert.match(COMPONENTS_SOURCE, /blockComponent\("pull-request", "Pull Request"\)/u);
	assert.match(COMPONENT_MANIFEST_SOURCE, /blockComponent\("pull-request", "Pull Request"\)/u);
	assert.match(NAV_ADS_SOURCE, /"pull-request"/u);
	assert.match(BLOCK_DETAILS_SOURCE, /PULL_REQUEST_DETAIL|"pull-request": PULL_REQUEST_DETAIL/u);
	assert.match(REGISTRY_SOURCE, /"pull-request": dynamic\(/u);
});
