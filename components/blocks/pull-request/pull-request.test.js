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
	assert.match(TYPES_SOURCE, /export type PullRequestVariant = "compact" \| "spacious"/u);
	assert.match(
		TYPES_SOURCE,
		/export interface PullRequestAuthor \{[\s\S]*name: string;[\s\S]*avatarUrl\?: string;/u,
	);
	assert.match(
		TYPES_SOURCE,
		/export interface PullRequestProps \{[\s\S]*variant\?: PullRequestVariant;[\s\S]*number: number;[\s\S]*title: string;[\s\S]*status: PullRequestStatus;[\s\S]*author\?: PullRequestAuthor;[\s\S]*repository\?: string;[\s\S]*branch\?: string;[\s\S]*targetBranch\?: string;[\s\S]*additions: number;[\s\S]*deletions: number;[\s\S]*filesChanged\?: number;[\s\S]*timestampMs\?: number;[\s\S]*relativeTime\?: string;[\s\S]*selected\?: boolean;[\s\S]*onActivate\?: \(\) => void;/u,
	);
});

test("PullRequest card reuses Avatar, Tag, Lozenge, BrandLogoMark, and ArrowRight", () => {
	assert.match(COMPONENT_SOURCE, /from "@\/components\/ui\/avatar"/u);
	assert.match(COMPONENT_SOURCE, /from "@\/components\/ui\/tag"/u);
	assert.match(COMPONENT_SOURCE, /from "@\/components\/ui\/lozenge"/u);
	assert.match(COMPONENT_SOURCE, /from "@\/components\/ui\/logo-mark"/u);
	assert.match(COMPONENT_SOURCE, /from "@atlaskit\/icon\/core\/arrow-right"/u);
	assert.match(
		COMPONENT_SOURCE,
		/BrandLogoMark[\s\S]*className="dark:invert \[\[data-color-mode=dark\]_&\]:invert"[\s\S]*name="github"/u,
	);
	// Compact keeps the 24px avatar by default; spacious opts down to 16px.
	assert.match(COMPONENT_SOURCE, /function PullRequestAuthorAvatar\([\s\S]*size = "sm",/u);
	assert.match(COMPONENT_SOURCE, /text-text-success">\+\{additions\}/u);
	assert.match(COMPONENT_SOURCE, /text-text-danger">-\{deletions\}/u);
	assert.match(
		COMPONENT_SOURCE,
		/aria-label=\{`\$\{additions\} additions, \$\{deletions\} deletions`\}[\s\S]*role="group"/u,
	);
	assert.match(COMPONENT_SOURCE, /function PullRequestBranchPath/u);
	assert.match(COMPONENT_SOURCE, /ArrowRightIcon/u);
	assert.match(
		COMPONENT_SOURCE,
		/flex min-w-0 flex-nowrap items-center gap-1 overflow-hidden/u,
	);
	// Source/head is the flexible truncating part; target/base never truncates.
	assert.match(
		COMPONENT_SOURCE,
		/function BranchName[\s\S]*min-w-0 truncate(?: text-text)?/u,
	);
	assert.match(
		COMPONENT_SOURCE,
		/targetBranch \? \(\s*<span className="shrink-0 text-text">\{targetBranch\}<\/span>/u,
	);
	assert.doesNotMatch(
		COMPONENT_SOURCE,
		/targetBranch \? \(\s*<span className="truncate text-text">\{targetBranch\}<\/span>/u,
	);
	assert.match(COMPONENT_SOURCE, /shrink-0 text-text-subtlest">#\{number\}/u);
	assert.match(COMPONENT_SOURCE, /case "Open":[\s\S]*return "success"/u);
	assert.match(COMPONENT_SOURCE, /case "Merged":[\s\S]*return "discovery"/u);
	assert.match(COMPONENT_SOURCE, /const _exhaustive: never = status/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /RelativeTime|from "@\/components\/ui\/elapsed-time"|BranchIcon|IconTile/u);
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
	assert.match(COMPONENT_SOURCE, /border border-border px-3 py-1\.5/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /bg-surface-raised/u);
	assert.match(COMPONENT_SOURCE, /items-center gap-2 rounded-lg/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /bg-\[#|text-\[#|purple-500|Open preview modal/u);
});

test("PullRequest spacious variant rearranges the same data into three rows", () => {
	// Density is opt-in: existing compact callsites keep working untouched.
	assert.match(COMPONENT_SOURCE, /variant = "compact"/u);
	assert.match(COMPONENT_SOURCE, /const isSpacious = variant === "spacious"/u);
	assert.match(
		COMPONENT_SOURCE,
		/isSpacious\s*\?\s*"flex-col items-stretch gap-2 rounded-xl border border-border p-3"/u,
	);
	assert.match(COMPONENT_SOURCE, /data-variant=\{variant\}/u);
	// Both densities render through one shared set of leaf parts.
	assert.match(COMPONENT_SOURCE, /function PullRequestCompactBody/u);
	assert.match(COMPONENT_SOURCE, /function PullRequestSpaciousBody/u);
	assert.match(COMPONENT_SOURCE, /function PullRequestStatusLozenge/u);
	assert.match(COMPONENT_SOURCE, /function PullRequestRepositoryTag/u);
	// Spacious leads with a glyph-bearing lozenge and closes with an author footer.
	assert.match(COMPONENT_SOURCE, /from "@atlaskit\/icon\/core\/pull-request"/u);
	assert.match(COMPONENT_SOURCE, /<PullRequestStatusLozenge status=\{status\} withIcon \/>/u);
	assert.match(COMPONENT_SOURCE, /PullRequestAuthorAvatar author=\{author\} size="xs"/u);
	assert.match(COMPONENT_SOURCE, /Created by \{author\.name\}/u);
	assert.match(
		COMPONENT_SOURCE,
		/\{filesChanged\} \{filesChanged === 1 \? "file" : "files"\}/u,
	);
});

test("Pull Request demos include source → target branch paths", () => {
	assert.match(DATA_SOURCE, /targetBranch: "main"/u);
	assert.match(DATA_SOURCE, /branch: "rovo\/rfp-103-response-validation"/u);
	assert.match(DATA_SOURCE, /filesChanged: 6/u);
	assert.doesNotMatch(DATA_SOURCE, /number:\s*902/u);
});

test("Pull Request demo page offers a compact / spacious density toggle", () => {
	assert.match(PAGE_SOURCE, /useState<PullRequestVariant>\("compact"\)/u);
	assert.match(PAGE_SOURCE, /<ToggleGroupItem value="compact">Compact<\/ToggleGroupItem>/u);
	assert.match(PAGE_SOURCE, /<ToggleGroupItem value="spacious">Spacious<\/ToggleGroupItem>/u);
	assert.match(PAGE_SOURCE, /variant=\{variant\}/u);
	assert.match(INDEX_SOURCE, /PullRequestVariant/u);
});

test("Pull Request demo page centers the card list in the preview shell", () => {
	assert.match(
		PAGE_SOURCE,
		/flex h-full min-h-\[360px\] w-full items-center justify-center/u,
	);
	assert.match(PAGE_SOURCE, /flex w-full max-w-xl flex-col gap-3/u);
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
