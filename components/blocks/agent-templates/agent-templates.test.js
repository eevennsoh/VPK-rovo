const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Agent Templates is exposed as a website block", () => {
	assert.match(
		readProjectFile("app/data/components.ts"),
		/blockComponent\("agent-templates", "Agent Templates"\)/u,
	);
	assert.match(
		readProjectFile("app/data/component-manifest.ts"),
		/blockComponent\("agent-templates", "Agent Templates"\)/u,
	);
	assert.match(
		readProjectFile("app/data/details/blocks.ts"),
		/import \{ AgentTemplatesDialog \} from "@\/components\/blocks\/agent-templates";/u,
	);
	assert.match(
		readProjectFile("components/website/registry.ts"),
		/"agent-templates": dynamic\(\s*\(\) => import\("\.\/demos\/blocks\/agent-templates-demo"\)/u,
	);
});

test("Agent Templates docs demo starts closed until the trigger is clicked", () => {
	assert.match(
		readProjectFile("components/blocks/agent-templates/page.tsx"),
		/const \[open, setOpen\] = useState\(false\);/u,
	);
});

test("Agent Templates renders the strategy dialog layout with card-directory cards", () => {
	const source = readProjectFile("components/blocks/agent-templates/components/agent-templates.tsx");
	const pageSource = readProjectFile("components/blocks/agent-templates/page.tsx");
	const demoAgentsSource = readProjectFile("components/blocks/agent-templates/data/demo-template-agents.ts");
	const defaultSidebarGroupsSource = readProjectFile("components/blocks/agent-templates/data/sidebar-groups.ts");
	const studioShellSource = readProjectFile("components/projects/studio/components/rovo-app-shell.tsx");
	const expandedCardSource = readProjectFile("components/ui-custom/card-directory/card-directory-agent-expanded.tsx");

	assert.doesNotMatch(source, /AgentBrowserDialog/u);
	assert.match(source, /AGENT_TEMPLATES_CATEGORIES/u);
	assert.match(source, /label: "Planning"/u);
	assert.match(source, /label: "Insights"/u);
	assert.match(source, /label: "Operations"/u);
	assert.match(source, /label: "Writing"/u);
	assert.match(source, /label: "Work management"/u);
	assert.match(source, /Turn rough ideas into plans,/u);
	assert.match(source, /and choose the next step\./u);
	assert.match(source, /Pull signal from context,/u);
	assert.match(source, /and turn scattered data into decisions\./u);
	assert.match(source, /Keep routines moving,/u);
	assert.match(source, /and make follow-through easier to trust\./u);
	assert.match(source, /Draft, refine, and adapt writing,/u);
	assert.match(source, /without losing the point\./u);
	assert.match(source, /Track the work that matters,/u);
	assert.match(source, /and keep momentum visible\./u);
	assert.match(source, /activeCategoryOption\.titleLines\[0\]/u);
	assert.match(source, /activeCategoryOption\.titleLines\[1\]/u);
	assert.match(source, /className="mt-6 text-text"/u);
	assert.match(source, /\/illustration\/rich-icon/u);
	assert.match(source, /\/lightbulb\/standard\.svg/u);
	assert.match(source, /\/marketing\/standard\.svg/u);
	assert.match(source, /\/product-management\/standard\.svg/u);
	assert.match(source, /\/illustrations\/standard\.svg/u);
	assert.match(source, /flex flex-wrap justify-start gap-2/u);
	assert.match(source, /relative isolate inline-flex h-8 shrink-0 items-center/u);
	assert.match(source, /aria-pressed=\{active\}/u);
	// Carousel cards now render via the card-directory expanded agent card.
	assert.match(source, /AgentTemplateCard/u);
	assert.match(source, /CardDirectoryAgentExpanded/u);
	assert.match(source, /NOOP_TEMPLATE_MORE_ACTIONS/u);
	assert.match(source, /onMoreActions=\{NOOP_TEMPLATE_MORE_ACTIONS\}/u);
	assert.match(source, /deriveAgentPublisher/u);
	assert.match(source, /AGENT_TEMPLATES_MAX_VISIBLE_AGENTS = 8/u);
	assert.match(source, /agent\.categoryId === activeCategory/u);
	assert.match(source, /visibleAgents\.slice\(0, AGENT_TEMPLATES_MAX_VISIBLE_AGENTS\)/u);
	assert.match(source, /AnimatePresence initial=\{false\}/u);
	assert.match(source, /AgentTemplatesCarouselControl/u);
	assert.match(expandedCardSource, /buildScrollMaskStyle/u);
	assert.match(expandedCardSource, /bodyScrolled \? CARD_DIRECTORY_SCROLL_MASK_STYLE : undefined/u);
	assert.match(expandedCardSource, /\[scrollbar-gutter:stable\]/u);
	assert.match(source, /setCarouselRef/u);
	assert.match(source, /canScrollLeft/u);
	assert.match(source, /canScrollRight/u);
	assert.match(source, /Show previous agent templates/u);
	assert.match(source, /Show next agent templates/u);
	assert.match(source, /bg-surface-overlay text-icon-subtle opacity-100 hover:bg-surface-overlay-hovered active:bg-surface-overlay-pressed/u);
	assert.match(source, /token\("elevation\.shadow\.overlay"\)/u);
	assert.match(source, /scrollBy\(\{/u);
	assert.doesNotMatch(source, /size-12/u);
	assert.doesNotMatch(source, /border border-border bg-surface-raised/u);
	// The page wires the carousel to the block-local rich demo dataset.
	assert.match(pageSource, /DEMO_AGENT_TEMPLATES/u);
	assert.match(pageSource, /DEMO_AGENT_TEMPLATES_SESSION/u);
	assert.match(studioShellSource, /agents=\{DEMO_AGENT_TEMPLATES\}/u);
	assert.match(studioShellSource, /initialCategoryId=\{activeCategory\}/u);
	assert.match(studioShellSource, /sessionAgents=\{DEMO_AGENT_TEMPLATES_SESSION\}/u);
	assert.match(studioShellSource, /function HomeStarterHeroTile[\s\S]*<TWGAppstack[\s\S]*animated=\{false\}/u);
	assert.match(studioShellSource, /mx-auto grid w-full max-w-\[1280px\] grid-cols-1/u);
	assert.match(source, /initialCategoryId\?: AgentTemplatesCategoryId/u);
	assert.match(source, /setActiveCategory\(initialCategoryId\)/u);
	// Demo agents carry the expanded-card detail the cards render.
	assert.match(demoAgentsSource, /capabilities:/u);
	assert.match(demoAgentsSource, /sources:/u);
	assert.match(demoAgentsSource, /skills:/u);
	assert.match(demoAgentsSource, /attributionKind: "team"/u);
	assert.match(demoAgentsSource, /attributionKind: "person"/u);
	assert.match(demoAgentsSource, /name: "Decision Director"/u);
	assert.match(demoAgentsSource, /name: "Customer Insights"/u);
	assert.match(demoAgentsSource, /name: "Service Triage"/u);
	assert.match(demoAgentsSource, /name: "Product Requirements Guide"/u);
	assert.match(demoAgentsSource, /name: "Work Item Planner"/u);
	assert.match(demoAgentsSource, /name: "OKR Generator"[\s\S]*avatarSrc: "\/avatar-agent\/product-agents\/wildcard-2\.svg"/u);
	assert.match(demoAgentsSource, /name: "Jira Theme Analyzer"[\s\S]*avatarSrc: "\/avatar-agent\/dev-agents\/code-reviewer\.svg"/u);
	assert.match(demoAgentsSource, /name: "Transcript Insights Reporter"[\s\S]*avatarSrc: "\/avatar-agent\/strategy-agents\/wildcard-1\.svg"/u);
	assert.match(demoAgentsSource, /name: "Service Request Helper"[\s\S]*avatarSrc: "\/avatar-agent\/strategy-agents\/strategic-insight\.svg"/u);
	assert.match(demoAgentsSource, /name: "Product Requirements Guide"[\s\S]*avatarSrc: "\/avatar-agent\/product-agents\/wildcard-1\.svg"/u);
	assert.match(demoAgentsSource, /name: "Release Notes Drafter"[\s\S]*avatarSrc: "\/avatar-agent\/dev-agents\/deployment-summarizer\.svg"/u);
	assert.match(demoAgentsSource, /name: "Brand Voice Crafter"[\s\S]*avatarSrc: "\/avatar-agent\/strategy-agents\/wildcard-3\.svg"/u);
	assert.match(demoAgentsSource, /name: "Social Media Writer"[\s\S]*avatarSrc: "\/avatar-agent\/service-agents\/wildcard-4\.svg"/u);
	assert.match(demoAgentsSource, /name: "Work Item Planner"[\s\S]*avatarSrc: "\/avatar-agent\/service-agents\/wildcard-2\.svg"/u);
	assert.match(demoAgentsSource, /name: "Bug Report Assistant"[\s\S]*avatarSrc: "\/avatar-agent\/dev-agents\/code-vulnerability-scanner-npm-yarn\.svg"/u);
	assert.match(demoAgentsSource, /name: "Blocker Checker"[\s\S]*avatarSrc: "\/avatar-agent\/strategy-agents\/wildcard-4\.svg"/u);
	assert.match(demoAgentsSource, /name: "Readiness Checker"[\s\S]*avatarSrc: "\/avatar-agent\/product-agents\/feedback-analyzer\.svg"/u);
	assert.equal((demoAgentsSource.match(/categoryId: "brainstorm"/gu) ?? []).length, 8);
	assert.equal((demoAgentsSource.match(/categoryId: "analyze"/gu) ?? []).length, 8);
	assert.equal((demoAgentsSource.match(/categoryId: "review"/gu) ?? []).length, 8);
	assert.equal((demoAgentsSource.match(/categoryId: "summarize"/gu) ?? []).length, 8);
	assert.equal((demoAgentsSource.match(/categoryId: "create"/gu) ?? []).length, 8);
	assert.match(defaultSidebarGroupsSource, /title: "By teams"/u);
	assert.match(defaultSidebarGroupsSource, /title: "By companies"/u);
});
