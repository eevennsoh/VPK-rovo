const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const { readDetailCategorySource } = require(process.cwd() + "/app/data/details/test-source.cjs");
const { readWebsiteRegistrySource } = require(process.cwd() + "/components/website/registry/test-source.cjs");

const DIR = __dirname;
const COMPONENT_SOURCE = fs.readFileSync(path.join(DIR, "components", "smart-link.tsx"), "utf8");
const TYPES_SOURCE = fs.readFileSync(path.join(DIR, "components", "smart-link-types.ts"), "utf8");
const DATA_SOURCE = fs.readFileSync(path.join(DIR, "data", "demo-smart-links.tsx"), "utf8");
const PULL_REQUEST_HELPER_SOURCE = fs.readFileSync(path.join(DIR, "lib", "pull-request-smart-link.ts"), "utf8");
const DEMO_SOURCE = fs.readFileSync(path.join(process.cwd(), "components", "website", "demos", "blocks", "smart-link-demo.tsx"), "utf8");
const PAGE_SOURCE = fs.readFileSync(path.join(DIR, "page.tsx"), "utf8");
const INDEX_SOURCE = fs.readFileSync(path.join(DIR, "index.ts"), "utf8");
const COMPONENTS_SOURCE = fs.readFileSync(path.join(process.cwd(), "app", "data", "components.ts"), "utf8");
const COMPONENT_MANIFEST_SOURCE = fs.readFileSync(path.join(process.cwd(), "app", "data", "component-manifest.ts"), "utf8");
const NAV_ADS_SOURCE = fs.readFileSync(path.join(process.cwd(), "app", "data", "nav-ads.ts"), "utf8");
const BLOCK_DETAILS_SOURCE = readDetailCategorySource("blocks");
const REGISTRY_SOURCE = readWebsiteRegistrySource();

test("SmartLink is powered by the shared HoverCard primitive", () => {
	assert.match(COMPONENT_SOURCE, /HoverCard, HoverCardContent, HoverCardTrigger/u);
	assert.match(COMPONENT_SOURCE, /<HoverCard[\s\S]*openDelay=\{openDelay\}/u);
	assert.match(COMPONENT_SOURCE, /<HoverCardTrigger[\s\S]*render=\{[\s\S]*<SmartLinkTrigger/u);
	assert.match(COMPONENT_SOURCE, /<HoverCardContent[\s\S]*alignOffset=\{alignOffset\}[\s\S]*positionerClassName=\{positionerClassName\}[\s\S]*<SmartLinkCard/u);
	assert.match(COMPONENT_SOURCE, /aria-describedby=\{open \? `smart-link-card-\$\{item\.id\}` : undefined\}/u);
});

test("SmartLink keeps existing inline consumers as external-link anchors", () => {
	assert.match(COMPONENT_SOURCE, /if \(onActivate\) \{[\s\S]*<button[\s\S]*type="button"[\s\S]*return \([\s\S]*<a[\s\S]*href=\{item\.href\}/u);
	assert.match(COMPONENT_SOURCE, /<SmartLinkCard[\s\S]*appearance="flyout"/u);
	assert.match(COMPONENT_SOURCE, /<a[\s\S]*href=\{item\.href\}[\s\S]*id=\{titleId\}/u);
});

test("SmartLink selectable mode uses a pressed button and closes its preview on activation", () => {
	assert.match(TYPES_SOURCE, /onActivate\?: \(item: SmartLinkItem\) => void;/u);
	assert.match(TYPES_SOURCE, /selected\?: boolean;/u);
	assert.match(COMPONENT_SOURCE, /<button[\s\S]*aria-pressed=\{selected\}[\s\S]*type="button"/u);
	assert.match(COMPONENT_SOURCE, /onActivate &&[\s\S]*selected &&[\s\S]*border-border-selected bg-bg-selected text-text-selected hover:bg-bg-selected-hovered active:bg-bg-selected-pressed/u);
	assert.match(COMPONENT_SOURCE, /const handleActivate = \(\) => \{[\s\S]*handleOpenChange\(false\);[\s\S]*onActivate\?\.\(item\);/u);
	assert.match(COMPONENT_SOURCE, /onActivate=\{onActivate \? handleActivate : undefined\}/u);
});

test("SmartLink supports a card appearance that expands any item into a block card", () => {
	assert.match(TYPES_SOURCE, /export type SmartLinkAppearance = "inline" \| "card"/u);
	assert.match(TYPES_SOURCE, /appearance\?: SmartLinkAppearance;/u);
	assert.match(
		COMPONENT_SOURCE,
		/if \(appearance === "card"\)[\s\S]*<SmartLinkCard[\s\S]*appearance="block"[\s\S]*onActivate=\{onActivate\}[\s\S]*selected=\{selected\}/u,
	);
	assert.match(TYPES_SOURCE, /appearance\?: "block" \| "flyout"/u);
	assert.match(TYPES_SOURCE, /onActivate\?: \(item: SmartLinkItem\) => void;/u);
	assert.match(
		COMPONENT_SOURCE,
		/onActivate \? \([\s\S]*<button[\s\S]*aria-pressed=\{selected\}[\s\S]*onClick=\{\(\) => onActivate\(item\)\}[\s\S]*type="button"[\s\S]*: \([\s\S]*<a className=\{titleClassName\} href=\{item\.href\}/u,
	);
	assert.match(
		COMPONENT_SOURCE,
		/onActivate &&[\s\S]*selected &&[\s\S]*"border-border-selected bg-bg-selected text-text-selected"/u,
	);
	assert.match(
		COMPONENT_SOURCE,
		/isFlyout \? "bg-surface-overlay shadow-2xl" : "border border-border"/u,
	);
	assert.match(COMPONENT_SOURCE, /SmartLinkFooterActions/u);
	assert.match(COMPONENT_SOURCE, /function SmartLinkEngagementRow/u);
	assert.match(COMPONENT_SOURCE, /Created by \{item\.author\.name\}/u);
	assert.match(INDEX_SOURCE, /SmartLinkAppearance/u);
	assert.match(DEMO_SOURCE, /export function SmartLinkDemoCard\(\)/u);
	assert.match(DEMO_SOURCE, /appearance="card"/u);
	assert.match(
		DEMO_SOURCE,
		/export function SmartLinkDemoCard\(\)[\s\S]*appearance="card"[\s\S]*items=\{SMART_LINK_DEMO_ITEMS\}/u,
	);
	assert.match(PAGE_SOURCE, /appearance="card"/u);
	assert.match(PAGE_SOURCE, /items = SMART_LINK_DEMO_ITEMS/u);
});

test("SmartLink card footer shows at most two action buttons and overflows the rest", () => {
	assert.match(COMPONENT_SOURCE, /const FOOTER_VISIBLE_ACTION_COUNT = 2;/u);
	assert.match(COMPONENT_SOURCE, /actions\.slice\(0, FOOTER_VISIBLE_ACTION_COUNT\)/u);
	assert.match(COMPONENT_SOURCE, /actions\.slice\(FOOTER_VISIBLE_ACTION_COUNT\)/u);
	assert.match(COMPONENT_SOURCE, /overflowActions\.length > 0 \?[\s\S]*<DropdownMenu>[\s\S]*aria-label="More actions"/u);
	assert.match(COMPONENT_SOURCE, /ShowMoreHorizontalIcon/u);
	assert.match(COMPONENT_SOURCE, /action\.id !== "copy-link"/u);
	assert.match(DATA_SOURCE, /id: "laptop-refresh"[\s\S]*Summarize with Rovo[\s\S]*View related links/u);
	assert.match(DATA_SOURCE, /id: "project-slingshot"[\s\S]*Summarize with AI/u);
});

test("SmartLink exports the public component and type API", () => {
	for (const source of [PAGE_SOURCE, INDEX_SOURCE]) {
		assert.match(source, /SmartLinkCard/u);
		assert.match(source, /SmartLinkAction/u);
		assert.match(source, /SmartLinkItem/u);
		assert.match(source, /SmartLinkProps/u);
		assert.match(source, /SmartLinkVariant/u);
	}
});

test("demo data covers every required production variant", () => {
	for (const variant of ["confluence", "jira", "team", "goal", "project", "loom", "article", "file", "generic"]) {
		assert.match(DATA_SOURCE, new RegExp(`variant: "${variant}"`, "u"));
	}

	// Pull-request demos are built via the shared mapper (variant lives on the helper).
	assert.match(DATA_SOURCE, /toPullRequestSmartLink/u);
	assert.match(DATA_SOURCE, /variant === "pull-request"/u);
	assert.match(DATA_SOURCE, /"pull-request"/u);
	assert.match(PULL_REQUEST_HELPER_SOURCE, /variant: "pull-request"/u);
	assert.match(DATA_SOURCE, /SMART_LINK_VARIANT_EXAMPLES/u);
	assert.match(DATA_SOURCE, /Existing-assets-only/u);
});

test("catalog details and registry expose smart-link demos", () => {
	assert.match(COMPONENTS_SOURCE, /blockComponent\("smart-link", "Smart Link"\)/u);
	assert.match(COMPONENT_MANIFEST_SOURCE, /blockComponent\("smart-link", "Smart Link"\)/u);
	assert.match(NAV_ADS_SOURCE, /"smart-link"/u);
	assert.match(BLOCK_DETAILS_SOURCE, /"smart-link": \{/u);
	assert.match(BLOCK_DETAILS_SOURCE, /smart-link-demo-rich/u);
	assert.match(BLOCK_DETAILS_SOURCE, /smart-link-demo-article/u);
	assert.match(BLOCK_DETAILS_SOURCE, /smart-link-demo-team/u);
	assert.match(BLOCK_DETAILS_SOURCE, /smart-link-demo-goal/u);
	assert.match(BLOCK_DETAILS_SOURCE, /smart-link-demo-project/u);
	assert.match(BLOCK_DETAILS_SOURCE, /smart-link-demo-loom/u);
	assert.match(BLOCK_DETAILS_SOURCE, /smart-link-demo-generic/u);
	assert.match(BLOCK_DETAILS_SOURCE, /smart-link-demo-pull-request/u);
	assert.match(BLOCK_DETAILS_SOURCE, /smart-link-demo-card/u);
	assert.match(BLOCK_DETAILS_SOURCE, /smart-link-demo-removable-overlay/u);
	assert.match(REGISTRY_SOURCE, /"smart-link": dynamic\(\(\) => import\("\.\/demos\/blocks\/smart-link-demo"\)/u);
	assert.match(REGISTRY_SOURCE, /"smart-link-demo-pull-request"[\s\S]*SmartLinkDemoPullRequest/u);
	assert.match(REGISTRY_SOURCE, /"smart-link-demo-card"[\s\S]*SmartLinkDemoCard/u);
	assert.match(REGISTRY_SOURCE, /"smart-link-demo-removable-overlay"[\s\S]*SmartLinkDemoRemovableOverlay/u);

	for (const exportName of [
		"SmartLinkDemoRich",
		"SmartLinkDemoArticle",
		"SmartLinkDemoTeam",
		"SmartLinkDemoGoal",
		"SmartLinkDemoProject",
		"SmartLinkDemoLoom",
		"SmartLinkDemoGeneric",
		"SmartLinkDemoPullRequest",
		"SmartLinkDemoCard",
		"SmartLinkDemoRemovableOverlay",
	]) {
		assert.match(REGISTRY_SOURCE, new RegExp(exportName, "u"));
	}
});

test("SmartLink owns the pull-request variant with code stats in the flyout", () => {
	assert.match(TYPES_SOURCE, /\| "pull-request"/u);
	assert.match(TYPES_SOURCE, /codeStats\?: \{[\s\S]*additions: number;[\s\S]*deletions: number;/u);
	assert.match(COMPONENT_SOURCE, /function SmartLinkCodeStats/u);
	assert.match(COMPONENT_SOURCE, /text-text-success[\s\S]*\+\{codeStats\.additions\}/u);
	assert.match(COMPONENT_SOURCE, /text-text-danger[\s\S]*-\{codeStats\.deletions\}/u);
	assert.match(INDEX_SOURCE, /toPullRequestSmartLink/u);
	assert.match(DEMO_SOURCE, /export function SmartLinkDemoPullRequest\(\)/u);
});

test("SmartLink owns its removable overlay variant", () => {
	assert.match(TYPES_SOURCE, /onRemove\?: \(\) => void;[\s\S]*removeVariant\?: "overlay";[\s\S]*removeButtonLabel\?: string;/u);
	assert.match(COMPONENT_SOURCE, /group\/smart-link-remove/u);
	assert.match(COMPONENT_SOURCE, /data-smart-link-text/u);
	assert.match(COMPONENT_SOURCE, /data-slot="smart-link-remove-overlay-button"/u);
	assert.match(COMPONENT_SOURCE, /removable &&\s*!status &&\s*"group-hover\/smart-link-remove:\[mask-image:/u);
	assert.match(COMPONENT_SOURCE, /triggerStatusClasses\[size\],[\s\S]*group-hover\/smart-link-remove:\[mask-image:linear-gradient\(to_right,#000_calc\(100%-1\.5rem\),transparent_calc\(100%-1rem\)\)\]/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /group-hover\/smart-link-remove:opacity-0/u);
	assert.match(COMPONENT_SOURCE, /absolute end-0\.5 top-1\/2/u);
	assert.match(COMPONENT_SOURCE, /aria-label=\{removeButtonLabel \?\? `Remove \$\{item\.title\}`\}/u);
	assert.match(COMPONENT_SOURCE, /<CrossIcon label="" size="small" color="currentColor" \/>/u);
	assert.match(DEMO_SOURCE, /export function SmartLinkDemoRemovableOverlay\(\)[\s\S]*onRemove=\{\(\) => setItems[\s\S]*removeVariant="overlay"/u);
	assert.match(DEMO_SOURCE, /SmartLinkDemoRemovableOverlay\(\)[\s\S]*SMART_LINK_STATUS_EXAMPLES\[0\][\s\S]*removeVariant="overlay"[\s\S]*showStatus=\{item\.id === SMART_LINK_STATUS_EXAMPLES\[0\]\.id\}/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /from "@\/components\/ui\/tag"/u);
});

test("SmartLink implementation uses semantic tokens instead of raw ds variable utilities", () => {
	for (const source of [COMPONENT_SOURCE, PAGE_SOURCE]) {
		assert.doesNotMatch(source, /(?:bg|text)-\[var\(--ds-/u);
	}
});

test("SmartLink visual rendering uses shared icon and logo primitives", () => {
	assert.match(COMPONENT_SOURCE, /import \{ IconTile \} from "@\/components\/ui\/icon-tile";/u);
	assert.match(COMPONENT_SOURCE, /import \{ AtlassianLogo, CustomLogo,[\s\S]*type LogoProps \} from "@\/components\/ui\/logo";/u);
	assert.match(COMPONENT_SOURCE, /import \{ BrandLogoMark \} from "@\/components\/ui\/logo-mark";/u);
	assert.match(COMPONENT_SOURCE, /<AtlassianLogo[\s\S]*withUsageBorder/u);
	assert.match(COMPONENT_SOURCE, /<BrandLogoMark frame="chip" src=\{visual\.src\} label=\{visual\.alt\} \/>/u);
	assert.match(COMPONENT_SOURCE, /<CustomLogo src=\{visual\.src\} label=\{visual\.alt\} size=\{logoSize\} \/>/u);
	assert.match(COMPONENT_SOURCE, /if \(visual\.kind === "icon"\)[\s\S]*<IconTile[\s\S]*variant="transparent"/u);
	assert.match(COMPONENT_SOURCE, /<IconTile[\s\S]*size=\{visualIconTileSizes\[size\]\}[\s\S]*variant=\{toneIconTileVariants\[visual\.tone \?\? "neutral"\]\}/u);
	assert.match(COMPONENT_SOURCE, /size: iconSize/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /height=\{imageSize\}/u);
	assert.doesNotMatch(COMPONENT_SOURCE, /width=\{imageSize\}/u);
	assert.match(COMPONENT_SOURCE, /className="flex min-w-0 items-center gap-2"/u);
	assert.match(COMPONENT_SOURCE, /<span className="inline-flex shrink-0 items-center">\{renderVisual\(item\.icon, "card"\)\}<\/span>/u);
});

test("the Jira work-item demo uses a blue work-item icon tile with rich card controls", () => {
	assert.match(DATA_SOURCE, /import WorkItemIcon from "@atlaskit\/icon\/core\/work-item";/u);
	assert.match(DATA_SOURCE, /id: "engineering-whiteboard"[\s\S]*icon: \{ kind: "icon-tile", icon: <WorkItemIcon label="" size="medium" \s*\/>, tone: "information" \}[\s\S]*assignee:[\s\S]*status:[\s\S]*priority:[\s\S]*actions: SMART_LINK_MODAL_ACTIONS/u);
});

test("SmartLink trigger icon tiles render as inline spans", () => {
	assert.match(COMPONENT_SOURCE, /const iconTileElement = size === "trigger" \? "span" : "div";/u);
	assert.equal((COMPONENT_SOURCE.match(/as=\{iconTileElement\}/gu) ?? []).length, 2);
});
