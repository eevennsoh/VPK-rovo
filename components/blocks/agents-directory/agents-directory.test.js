const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

function readProjectFile(relativePath) {
	return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("Agents Directory is exposed as a website block and used by Studio", () => {
	assert.match(
		readProjectFile("app/data/components.ts"),
		/blockComponent\("agents-directory", "Agents Directory"\)/u,
	);
	assert.match(
		readProjectFile("app/data/component-manifest.ts"),
		/blockComponent\("agents-directory", "Agents Directory"\)/u,
	);
	assert.match(
		readProjectFile("app/data/details/blocks.ts"),
		/import \{ AgentsDirectoryDialog \} from "@\/components\/blocks\/agents-directory";/u,
	);
	assert.match(
		readProjectFile("components/website/registry.ts"),
		/"agents-directory": dynamic\(\s*\(\) => import\("\.\/demos\/blocks\/agents-directory-demo"\)/u,
	);
	assert.match(
		readProjectFile("components/projects/studio/components/rovo-app-shell.tsx"),
		/import \{ AgentsDirectoryDialog \} from "@\/components\/blocks\/agents-directory";/u,
	);
});

test("Agents Directory docs demo starts closed until the trigger is clicked", () => {
	assert.match(
		readProjectFile("components/blocks/agents-directory/page.tsx"),
		/const \[open, setOpen\] = useState\(false\);/u,
	);
});

test("Agents Directory close button sits in the dialog header", () => {
	const source = readProjectFile("components/blocks/agent-browser/components/agent-browser.tsx");

	assert.match(
		source,
		/import \{ Dialog, DialogClose, DialogContent, DialogTitle \} from "@\/components\/ui\/dialog";/u,
	);
	assert.match(source, /import CrossIcon from "@atlaskit\/icon\/core\/cross";/u);
	assert.match(
		source,
		/<DialogContent[\s\S]*showCloseButton=\{false\}[\s\S]*<div className="flex items-center justify-between px-6 pt-6 pb-4">[\s\S]*<DialogTitle[\s\S]*\{title\}[\s\S]*<\/DialogTitle>[\s\S]*<div className="flex items-center gap-2">[\s\S]*<DialogClose render=\{<Button variant="ghost" size="icon" \/>\}>[\s\S]*<CrossIcon label="" \/>[\s\S]*<span className="sr-only">Close<\/span>[\s\S]*<\/DialogClose>/u,
	);
	assert.doesNotMatch(source, /className="absolute top-4 right-4"/u);
});

test("Agents Directory renders a New agent header action", () => {
	const source = readProjectFile("components/blocks/agent-browser/components/agent-browser.tsx");
	const agentsDirectorySource = readProjectFile("components/blocks/agents-directory/components/agents-directory.tsx");
	const detailsSource = readProjectFile("app/data/details/blocks.ts");

	assert.match(source, /primaryActionLabel\?: string;/u);
	assert.match(source, /onPrimaryAction\?: \(\) => void;/u);
	assert.match(source, /primaryActionLabel \? \([\s\S]*<Button onClick=\{onPrimaryAction\} type="button">[\s\S]*\{primaryActionLabel\}/u);
	assert.match(agentsDirectorySource, /onCreateAgent\?: \(\) => void;/u);
	assert.match(agentsDirectorySource, /primaryActionLabel="New agent"/u);
	assert.match(agentsDirectorySource, /onPrimaryAction=\{onCreateAgent\}/u);
	assert.match(detailsSource, /name: "onCreateAgent"[\s\S]*Optional handler for the New agent action/u);
});

test("Agents Directory includes Agent Templates as a sidebar mode", () => {
	const source = readProjectFile("components/blocks/agent-browser/components/agent-browser.tsx");
	const agentsDirectorySource = readProjectFile("components/blocks/agents-directory/components/agents-directory.tsx");
	const agentTemplatesSource = readProjectFile("components/blocks/agent-templates/components/agent-templates.tsx");
	const studioShellSource = readProjectFile("components/projects/studio/components/rovo-app-shell.tsx");

	assert.match(agentTemplatesSource, /export const AGENT_TEMPLATES_CATEGORIES/u);
	assert.match(source, /AGENT_TEMPLATES_CATEGORIES/u);
	assert.match(source, /type AgentTemplatesCategory/u);
	assert.match(source, /templateCategories\?: readonly AgentTemplatesCategory\[\];/u);
	assert.match(source, /templateAgents\?: readonly AgentTemplatesAgent\[\];/u);
	assert.match(source, /onSelectTemplateAgent\?: \(agent: AgentTemplatesAgent\) => void;/u);
	assert.match(source, /<SidebarTemplateGroup[\s\S]*categories=\{templateCategories\}[\s\S]*onSelectCategory=\{onSelectTemplateCategory\}/u);
	assert.match(source, /Agent templates/u);
	assert.match(source, /<SidebarNavItem[\s\S]*isSelected=\{activeCategory === category\.id\}[\s\S]*label=\{category\.label\}[\s\S]*leading=\{<SidebarTemplateIcon category=\{category\} \/>\}/u);
	assert.match(source, /function SidebarTemplateIcon\(\{ category \}: Readonly<\{ category: AgentTemplatesCategory \}>\)/u);
	assert.match(source, /src=\{category\.iconSrc\}/u);
	assert.match(source, /className=\{cn\("size-6 object-contain", category\.iconClassName\)\}/u);
	assert.match(source, /activeTemplateCategoryOption \? \(/u);
	assert.match(source, /activeTemplateCategoryOption \? \([\s\S]*<AnimatePresence custom=\{templateMotionCustom\} initial=\{false\} mode="wait">[\s\S]*<motion\.div[\s\S]*key=\{`template-title-\$\{activeTemplateCategoryOption\.id\}`\}[\s\S]*variants=\{AGENT_BROWSER_TEMPLATE_TITLE_VARIANTS\}[\s\S]*<TemplateCategoryTitle category=\{activeTemplateCategoryOption\} \/>/u);
	assert.match(source, /:\s*\([\s\S]*<Button variant="outline">[\s\S]*Sort by popularity/u);
	assert.doesNotMatch(source, /key="sort-button"[\s\S]*variants=\{AGENT_BROWSER_TEMPLATE_TITLE_VARIANTS\}/u);
	assert.match(source, /category\.titleLines\[0\]/u);
	assert.match(source, /category\.titleLines\[1\]/u);
	assert.match(source, /No templates match/u);
	assert.match(source, /activeTemplateCategoryOption \? \([\s\S]*<AnimatePresence custom=\{templateMotionCustom\} initial=\{false\} mode="wait">[\s\S]*<motion\.section[\s\S]*aria-label="Agent templates"[\s\S]*key=\{`templates-\$\{activeTemplateCategoryOption\.id\}`\}[\s\S]*variants=\{AGENT_BROWSER_TEMPLATE_GRID_VARIANTS\}[\s\S]*<AgentTemplateSection[\s\S]*onSelectAgent=\{onSelectTemplateAgent\}/u);
	assert.match(source, /CardDirectoryAgentExpanded/u);
	assert.match(source, /className="h-\[400px\] \[will-change:transform,opacity\]"/u);
	assert.match(source, /<ul className="grid grid-cols-1 gap-3 md:grid-cols-2">/u);
	assert.match(source, /AGENT_BROWSER_TEMPLATE_MAX_VISIBLE_AGENTS = 8/u);
	assert.match(source, /AGENT_BROWSER_TEMPLATE_CARD_STAGGER = 0\.05/u);
	assert.match(source, /translateY/u);
	assert.match(source, /const AGENT_BROWSER_TEMPLATE_GRID_VARIANTS = \{[\s\S]*enter: \{ opacity: 1 \},[\s\S]*center: \{ opacity: 1 \}/u);
	assert.doesNotMatch(source, /translateY\(\$\{AGENT_BROWSER_TEMPLATE_DECK_SWAP_OFFSET \* direction\}px\)/u);
	assert.doesNotMatch(source, /translateX\(\$\{motionCustom\.direction \* AGENT_BROWSER_TEMPLATE_CARD_ENTER_OFFSET\}px\)/u);
	assert.match(source, /const handleSelectCategory = \(category: string\) => \{[\s\S]*setActiveTemplateCategory\(null\);[\s\S]*setActiveCategory\(category\);[\s\S]*\};/u);
	assert.match(agentsDirectorySource, /DEMO_AGENT_TEMPLATES/u);
	assert.match(agentsDirectorySource, /DEMO_AGENT_TEMPLATES_SESSION/u);
	assert.match(agentsDirectorySource, /templateAgents = DEMO_AGENT_TEMPLATES/u);
	assert.match(agentsDirectorySource, /sessionTemplateAgents = DEMO_AGENT_TEMPLATES_SESSION/u);
	assert.match(agentsDirectorySource, /onSelectTemplateAgent=\{onSelectTemplateAgent\}/u);
	assert.match(studioShellSource, /onSelectTemplateAgent=\{handleTemplateAgentSelect\}/u);
});

test("Agents Directory sidebar nav uses the shared SidebarNavItem primitive", () => {
	const source = readProjectFile("components/blocks/agent-browser/components/agent-browser.tsx");
	const sidebarNavItemSource = readProjectFile("components/ui-custom/sidebar-nav-item.tsx");

	assert.match(
		source,
		/import \{ SidebarNavItem \} from "@\/components\/ui-custom\/sidebar-nav-item";/u,
	);
	assert.match(source, /import AlignTextLeftIcon from "@atlaskit\/icon\/core\/align-text-left";/u);
	assert.match(source, /import \{ Avatar, AvatarImage \} from "@\/components\/ui\/avatar";/u);
	assert.match(source, /import \{ AtlassianLogo, type AtlassianLogoName \} from "@\/components\/ui\/logo";/u);
	assert.match(source, /import \{ Tile \} from "@\/components\/ui\/tile";/u);
	assert.match(
		source,
		/<SidebarNavItem label=\{label\} isSelected=\{active\} onClick=\{onClick\} \/>/u,
	);
	assert.match(source, /<SidebarNavItem[\s\S]*label=\{item\.label\}[\s\S]*leading=\{<SidebarItemAvatar item=\{item\} \/>\}[\s\S]*onClick=\{agent \? \(\) => onSelectAgent\?\.\(agent\) : undefined\}/u);
	assert.match(source, /function SidebarItemAvatar\(\{ item \}: Readonly<\{ item: AgentBrowserSidebarItem \}>\)/u);
	// Atlassian's transparent brand mark gets a bordered Tile container so company
	// sidebar rows read consistently with the 3p logos (which carry their own tile).
	assert.match(source, /if \(item\.logoName\)[\s\S]*<Tile label=\{item\.label\} variant="transparent" size="small" hasBorder className="shrink-0">[\s\S]*<AtlassianLogo name=\{item\.logoName\} label=\{item\.label\} size="xsmall" themeAware \/>[\s\S]*<\/Tile>/u);
	assert.match(source, /if \(item\.avatarSrc\?\.startsWith\("\/avatar-project\/"\)\)/u);
	assert.match(source, /<span className="flex size-6 shrink-0 items-center justify-center">[\s\S]*<Avatar size="sm" shape="square" label=\{item\.label\} className="size-5">[\s\S]*<AvatarImage alt="" aria-hidden src=\{item\.avatarSrc\} \/>/u);
	assert.match(source, /<Avatar size="sm" shape="square" className="shrink-0 after:border-0">/u);
	assert.match(source, /export interface AgentBrowserSidebarItem/u);
	assert.match(source, /items\?: readonly AgentBrowserSidebarItem\[\];/u);
	assert.match(source, /showAll\?: boolean;/u);
	assert.match(source, /function getSidebarGroupItems/u);
	assert.match(source, /showAll=\{group\.showAll\}/u);
	assert.match(source, /label="Show all"[\s\S]*leading=\{<AlignTextLeftIcon label="" size="small" \/>\}[\s\S]*leadingSize="medium"/u);
	assert.doesNotMatch(source, /className="flex w-full items-center gap-2 rounded-xs px-3 py-1\.5/u);
	assert.doesNotMatch(source, /aria-current=\{active \? "page" : undefined\}/u);
	assert.match(
		sidebarNavItemSource,
		/data-slot="sidebar-nav-item-content" className="min-w-0 flex-1 pl-0\.5"/u,
	);
});

test("Agents Directory uses independent column scrolling without extra content padding", () => {
	const source = readProjectFile("components/blocks/agent-browser/components/agent-browser.tsx");

	assert.match(source, /className="grid h-\[min\(800px,calc\(100svh-2rem\)\)\] max-h-\[calc\(100svh-2rem\)\] grid-rows-\[auto_minmax\(0,1fr\)\] gap-0 overflow-hidden p-0 sm:max-w-\[1200px\]"/u);
	assert.doesNotMatch(source, /max-h-\[85vh\]/u);
	assert.doesNotMatch(source, /className="grid max-h-\[800px\] grid-rows-\[auto_minmax\(0,1fr\)\] gap-0 p-0 sm:max-w-\[1200px\]"/u);
	assert.match(source, /<div className="min-h-0 overflow-hidden">/u);
	assert.match(source, /<div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-\[280px_minmax\(0,1fr\)\]">/u);
	assert.match(source, /import \{ useHasVerticalOverflow \} from "@\/components\/hooks\/use-has-vertical-overflow";/u);
	assert.match(source, /const contentOverflow = useHasVerticalOverflow<HTMLDivElement>\(\);/u);
	assert.match(source, /ref=\{contentOverflow\.ref\}/u);
	assert.match(source, /"flex min-h-0 min-w-0 flex-col gap-5 overflow-y-auto px-6 pb-6 md:pl-4"/u);
	assert.match(source, /contentOverflow\.showTopScrollMask && "scroll-mask-top overscroll-contain"/u);
	assert.match(source, /const sidebarOverflow = useHasVerticalOverflow<HTMLElement>\(\);/u);
	assert.match(source, /aria-label="Agent categories"[\s\S]*sidebarOverflow\.showTopScrollMask && "scroll-mask-top overscroll-contain"[\s\S]*ref=\{sidebarOverflow\.ref\}/u);
	assert.match(readProjectFile("components/hooks/use-has-vertical-overflow.ts"), /scrollHeight - element\.clientHeight > 1/u);
	assert.match(readProjectFile("components/hooks/use-has-vertical-overflow.ts"), /scrollTop > 1/u);
	assert.match(readProjectFile("components/hooks/use-has-vertical-overflow.ts"), /showTopScrollMask: hasVerticalOverflow && hasScrolledFromTop/u);
	assert.match(readProjectFile("app/tailwind-theme.css"), /@utility scroll-mask-top/u);
	assert.doesNotMatch(source, /overflow-y-auto px-6 pt-6 pb-6/u);
	assert.doesNotMatch(source, /overflow-y-auto pl-6 pt-6/u);
	assert.match(source, /<ul className="flex w-64 flex-col">/u);
	assert.doesNotMatch(source, /<ul className="[^"]*gap-0\.5/u);
	assert.match(source, /<div className="flex w-64 flex-col gap-1\.5">/u);
	assert.match(source, /import \{ token \} from "@\/lib\/tokens";/u);
	assert.match(
		source,
		/<p style=\{\{ font: token\("font\.heading\.xxsmall"\) \}\} className="px-1\.5 text-text-subtlest">/u,
	);
	assert.match(source, /<Button variant="outline">\s*Sort by popularity/u);
	assert.doesNotMatch(source, /<Button variant="outline" size=/u);
	assert.doesNotMatch(source, /<Button variant="outline"[^>]*className=/u);
	assert.doesNotMatch(source, /<SidebarNavItem[^>]+className=/u);
	assert.doesNotMatch(source, /Agent categories" className="[^"]*\bpr-\d/u);
	assert.doesNotMatch(source, /<p className="px-3 text-xs font-semibold uppercase leading-4 tracking-wide text-text-subtlest">/u);
	assert.doesNotMatch(source, /text-xs font-semibold uppercase leading-4 tracking-wide text-text-subtlest/u);
	assert.doesNotMatch(source, /<div className="min-h-0 overflow-y-auto px-6 pb-6">/u);
	assert.doesNotMatch(source, /<div className="min-h-0 min-w-0 flex-1 overflow-y-auto pb-6 pr-1">/u);
	assert.doesNotMatch(source, /<div className="flex min-w-0 flex-col gap-5 pr-5">/u);
	assert.doesNotMatch(source, /overflow-y-auto pb-6 pr-1/u);
	assert.doesNotMatch(source, /sticky top-0/u);
});

test("Agents Directory uses one unsegmented results grid and updated sidebar labels", () => {
	const source = readProjectFile("components/blocks/agent-browser/components/agent-browser.tsx");
	const defaultSidebarGroupsSource = readProjectFile("components/blocks/agents-directory/data/sidebar-groups.ts");
	// The agent-browser sidebar groups + directory catalog now live in the unified
	// agents data layer (DEMO_AGENT_BROWSER_SIDEBAR_GROUPS salvaged verbatim there).
	const agentsLoaderSource = readProjectFile("app/data/directory/agents.ts");
	const agentsJson = JSON.parse(readProjectFile("app/data/directory/agents.json"));
	const pageSource = readProjectFile("components/blocks/agents-directory/page.tsx");

	assert.match(source, /<AgentSection agents=\{filtered\} key=\{`agents-\$\{activeCategory\}`\} onSelectAgent=\{onSelectAgent\} \/>/u);
	assert.match(source, /favorite\?: boolean;/u);
	assert.match(source, /label: "Favourite agents"/u);
	assert.match(source, /if \(activeCategory === "favorite-agents" && !agent\.favorite\) return false;/u);
	assert.match(source, /<section aria-label="Agents">/u);
	assert.doesNotMatch(source, /recommendedCount/u);
	assert.doesNotMatch(source, /DEFAULT_RECOMMENDED_COUNT/u);
	assert.doesNotMatch(source, /const recommended = filtered\.slice/u);
	assert.doesNotMatch(source, /const rest = filtered\.slice/u);
	assert.doesNotMatch(source, /title="Recommended"/u);
	assert.doesNotMatch(source, /title="All agents"/u);
	assert.doesNotMatch(source, />\s*\{title\}\s*<\/h2>/u);

	for (const groupsSource of [defaultSidebarGroupsSource, agentsLoaderSource]) {
		assert.doesNotMatch(groupsSource, /title: "Favourites"/u);
		assert.match(groupsSource, /title: "By teams"/u);
		assert.match(groupsSource, /title: "By teams",\n\t\tshowAll: true/u);
		assert.match(groupsSource, /label: "Product Experience"/u);
		assert.match(groupsSource, /avatarSrc: "\/avatar-project\/compass\.svg"/u);
		assert.match(groupsSource, /label: "Platform Engineering"/u);
		assert.match(groupsSource, /avatarSrc: "\/avatar-project\/code\.svg"/u);
		assert.match(groupsSource, /label: "Customer Success"/u);
		assert.match(groupsSource, /avatarSrc: "\/avatar-project\/service-bell\.svg"/u);
		assert.match(groupsSource, /label: "Revenue Operations"/u);
		assert.match(groupsSource, /avatarSrc: "\/avatar-project\/graph\.svg"/u);
		assert.match(groupsSource, /title: "By companies"/u);
		assert.match(groupsSource, /title: "By companies",\n\t\tshowAll: true/u);
		assert.doesNotMatch(groupsSource, /By my teams/u);
		assert.doesNotMatch(groupsSource, /By partners/u);
	}

	assert.match(source, /attributionKind\?: "company" \| "team" \| "person";/u);
	assert.match(source, /rating\?: number;/u);
	assert.match(source, /feedbackCount\?: number;/u);
	assert.match(source, /chatCount\?: number;/u);
	assert.match(source, /verified\?: boolean;/u);
	assert.doesNotMatch(source, /function isVerified/u);
	// The unified catalog carries every attribution kind (company/team/person).
	for (const kind of ["company", "team", "person"]) {
		assert.ok(
			agentsJson.some((agent) => agent.attributionKind === kind),
			`unified catalog should have a ${kind}-attributed agent`,
		);
	}
	for (const agent of agentsJson) {
		assert.equal(typeof agent.rating, "number", `agent ${agent.id} should have rating`);
		assert.equal(typeof agent.feedbackCount, "number", `agent ${agent.id} should have feedbackCount`);
		assert.equal(typeof agent.chatCount, "number", `agent ${agent.id} should have chatCount`);
		assert.equal(typeof agent.verified, "boolean", `agent ${agent.id} should have verified`);
	}
	assert.match(pageSource, /attributionKind: "team"/u);
	assert.match(pageSource, /attributionKind: "person"/u);
	assert.match(pageSource, /by Revenue Operations/u);
	assert.match(pageSource, /by Alex Kim/u);
	// The directory demo page's session agents use descriptive bylines, not generic labels.
	assert.doesNotMatch(pageSource, /Custom agent/u);
});

test("Agents Directory cards render the shared EntityCardAgentCard with overlay elevation", () => {
	const source = readProjectFile("components/blocks/agent-browser/components/agent-browser.tsx");
	const entityAgentSource = readProjectFile("components/ui-custom/entity-card/agent.tsx");

	// Cards are delegated to the shared ui-custom component — no inlined shell duplication.
	assert.match(source, /CardDirectoryAgent,[\s\S]*CardDirectoryAgentExpanded,[\s\S]*from "@\/components\/ui-custom\/card-directory";/u);
	assert.match(source, /function AgentCard\(\{ agent, onSelectAgent, publisher \}: Readonly<AgentCardProps>\)/u);
	assert.match(source, /const \[moreMenuOpen, setMoreMenuOpen\] = useState\(false\);/u);
	assert.match(source, /<CardDirectoryAgent[\s\S]*active=\{moreMenuOpen\}[\s\S]*avatarSrc=\{getDirectoryCardAvatarSrc\(agent\)\}[\s\S]*insetLogo=\{isBorderlessHexagonAgent\(agent\)\}/u);
	assert.match(source, /chatCount=\{agent\.chatCount\}/u);
	assert.match(source, /feedbackCount=\{agent\.feedbackCount\}/u);
	assert.match(source, /rating=\{agent\.rating\}/u);
	assert.match(source, /verified=\{agent\.verified\}/u);
	assert.doesNotMatch(source, /syntheticRating/u);
	assert.doesNotMatch(source, /syntheticChats/u);
	assert.doesNotMatch(source, /syntheticFeedback/u);
	assert.match(source, /className="hover:border-transparent"/u);
	assert.match(source, /onSelect=\{selectAgent\}/u);
	assert.match(source, /<DirectoryCardMoreMenu[\s\S]*onOpenChange=\{setMoreMenuOpen\}[\s\S]*open=\{moreMenuOpen\}/u);
	assert.match(source, /aria-pressed=\{open \|\| undefined\}/u);
	assert.match(entityAgentSource, /logoName\?: AtlassianLogoName;/u);
	assert.match(entityAgentSource, /size=\{logoName === "atlassian" \? "xsmall" : "medium"\}/u);
	assert.doesNotMatch(source, /AgentDirectoryCard/u);
	assert.doesNotMatch(source, /AGENT_CARD_OVERLAY_SHADOW/u);
	assert.match(source, /import \{ AnimatePresence, cubicBezier, motion, useReducedMotion \} from "motion\/react";/u);

	// Self-contained third-party marks render in a borderless hexagon, inset to 16x16.
	assert.match(source, /const BORDERLESS_HEXAGON_AGENT_IDS: ReadonlySet<string> = new Set\(\["google-drive", "slack", "notion"\]\);/u);
	assert.match(source, /function isBorderlessHexagonAgent\(agent: AgentBrowserAgent\): boolean/u);
	assert.match(source, /return BORDERLESS_HEXAGON_AGENT_IDS\.has\(agent\.id\);/u);
	// Borderless agents swap to their purpose-built 16px tile on the card.
	assert.match(source, /function getDirectoryCardAvatarSrc\(agent: AgentBrowserAgent\): string \| undefined/u);
	assert.match(source, /return `\/3p\/\$\{agent\.id\}\/16-borderless\.svg`;/u);

	// The hover/elevation/keyboard contract now lives in the shared shell + agent wrapper.
	const shell = readProjectFile("components/ui-custom/card-directory/card-directory.tsx");
	const interaction = readProjectFile("components/ui-custom/card-directory/use-card-interaction.ts");
	const agentWrapper = readProjectFile("components/ui-custom/card-directory/card-directory-agent.tsx");
	const entityAgent = readProjectFile("components/ui-custom/entity-card/agent.tsx");

	assert.match(interaction, /token\("elevation\.shadow\.overlay"\)/u);
	assert.match(interaction, /boxShadow: OVERLAY_SHADOW/u);
	assert.doesNotMatch(interaction, /scale: 1\.006/u);
	assert.match(interaction, /type: "spring",[\s\S]*bounce: 0\.16,[\s\S]*visualDuration: 0\.22/u);
	assert.match(shell, /group\/card relative flex h-full w-full flex-col gap-3 rounded-md bg-surface p-4/u);
	assert.match(shell, /after:pointer-events-none after:absolute after:inset-0 after:z-20 after:rounded-md after:border after:border-border/u);
	// Focus styling keys off the overlay select button's focus-visible (#709): the shared
	// shell no longer makes the whole card a role="button", so nested controls stay valid.
	assert.match(shell, /has-\[\[data-slot=card-directory-select\]:focus-visible\]:after:border-transparent has-\[\[data-slot=card-directory-select\]:focus-visible\]:ring-3 has-\[\[data-slot=card-directory-select\]:focus-visible\]:ring-ring\/50/u);
	assert.match(shell, /willChange: "transform"/u);
	assert.doesNotMatch(shell, /role="button"/u);
	assert.match(shell, /data-slot="card-directory-select"[\s\S]*type="button"/u);
	assert.match(shell, /whileTap: interactive \? tapAnimation : undefined/u);

	assert.match(agentWrapper, /<CardDirectory active=\{active\} className=\{cn\("gap-4", className\)\}/u);
	assert.match(agentWrapper, /action=\{moreAction\}/u);
	assert.match(agentWrapper, /onMoreActions=\{onMoreActions\}/u);
	assert.match(agentWrapper, /<EntityCard\.Agent/u);
	assert.match(entityAgent, /shape="hexagon"/u);
	assert.match(entityAgent, /<EntityCardMoreButton active=\{active\}/u);
	assert.match(entityAgent, /<div className="flex flex-col gap-2">[\s\S]*<EntityCardHeader[\s\S]*<EntityCardDescription>/u);
	assert.match(entityAgent, /<EntityCardByline/u);
	assert.match(entityAgent, /StarUnstarredIcon/u);
	assert.match(entityAgent, /AiChatIcon/u);

	assert.doesNotMatch(shell, /hover:-translate-y/u);
	assert.doesNotMatch(shell, /hover:shadow-2xl/u);
});
