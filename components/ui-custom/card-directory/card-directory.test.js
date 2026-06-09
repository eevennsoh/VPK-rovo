const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const read = (name) => readFileSync(join(__dirname, name), "utf8");

const SHELL_SOURCE = read("card-directory.tsx");
const INTERACTION_SOURCE = read("use-card-interaction.ts");
const PARTS_SOURCE = read("card-directory-parts.tsx");
const AGENT_WRAPPER_SOURCE = read("card-directory-agent.tsx");
const AGENT_EXPANDED_WRAPPER_SOURCE = read("card-directory-agent-expanded.tsx");
const SKILL_WRAPPER_SOURCE = read("card-directory-skill.tsx");
const TOOL_WRAPPER_SOURCE = read("card-directory-tool.tsx");
const TEMPLATE_WRAPPER_SOURCE = read("card-directory-template.tsx");
const KNOWLEDGE_WRAPPER_SOURCE = read("card-directory-knowledge.tsx");
const AGENT_SOURCE = read(join("..", "entity-card", "agent.tsx"));
const AGENT_EXPANDED_SOURCE = read(join("..", "entity-card", "agent-expanded.tsx"));
const SKILL_SOURCE = read(join("..", "entity-card", "skill.tsx"));
const TOOL_SOURCE = read(join("..", "entity-card", "tool.tsx"));
const TEMPLATE_SOURCE = read(join("..", "entity-card", "template.tsx"));
const KNOWLEDGE_SOURCE = read(join("..", "entity-card", "knowledge.tsx"));
const ENTITY_CARD_INDEX_SOURCE = read(join("..", "entity-card", "index.ts"));
const INDEX_SOURCE = read("index.ts");
const SKILL_TAG_SOURCE = read(join("..", "skill-tag.tsx"));
const AGENT_BROWSER_SOURCE = readFileSync(
	join(__dirname, "..", "..", "blocks", "agent-browser", "components", "agent-browser.tsx"),
	"utf8",
);

test("shell preserves the bordered surface and hover-elevation classes", () => {
	assert.match(SHELL_SOURCE, /group\/card/u);
	assert.match(SHELL_SOURCE, /rounded-md bg-surface p-4/u);
	// Focus ring + border fade now key off the overlay select button's focus-visible
	// state (via :has) instead of the article's own focus, since the article is no
	// longer focusable — see the overlay-button regression test below (#709).
	assert.match(SHELL_SOURCE, /has-\[\[data-slot=card-directory-select\]:focus-visible\]:ring-3 has-\[\[data-slot=card-directory-select\]:focus-visible\]:ring-ring\/50/u);
	assert.match(SHELL_SOURCE, /willChange: "transform"/u);
	// The border is an overlay pseudo-element that fades out on hover/focus so only the
	// elevation shadow remains — never a persistent real border that survives hover.
	assert.doesNotMatch(SHELL_SOURCE, /\bborder border-border\b/u);
	assert.match(SHELL_SOURCE, /after:pointer-events-none after:absolute after:inset-0 after:z-20 after:rounded-md after:border after:border-border/u);
	assert.match(SHELL_SOURCE, /hover:after:border-transparent has-\[\[data-slot=card-directory-select\]:focus-visible\]:after:border-transparent/u);
	assert.match(SHELL_SOURCE, /active = false/u);
	assert.match(SHELL_SOURCE, /active && "after:border-transparent"/u);
	assert.match(SHELL_SOURCE, /animate: active \? hoverAnimation : \{ boxShadow: "none" \}/u);
	assert.doesNotMatch(SHELL_SOURCE, /hover:border-border-selected/u);
	assert.doesNotMatch(SHELL_SOURCE, /hover:after:ring-border-selected/u);
});

test("shell uses a dedicated overlay <button> for selection, not a role=button wrapper", () => {
	// Regression for #709: a whole-card role="button" must not wrap nested interactive
	// controls (checkboxes, menu buttons). Selection is a real <button> overlay instead,
	// so nested controls are valid sibling controls rather than focusable descendants.
	assert.doesNotMatch(SHELL_SOURCE, /role="button"/u);
	assert.doesNotMatch(SHELL_SOURCE, /tabIndex=\{0\}/u);
	assert.doesNotMatch(SHELL_SOURCE, /onKeyDown=/u);
	assert.match(SHELL_SOURCE, /<button/u);
	assert.match(SHELL_SOURCE, /data-slot="card-directory-select"/u);
	assert.match(SHELL_SOURCE, /aria-label=\{selectLabel\}/u);
	assert.match(SHELL_SOURCE, /onClick=\{handleSelect\}/u);
	assert.match(SHELL_SOURCE, /type="button"/u);
	// Overlay sits beneath card content so nested controls stay clickable.
	assert.match(SHELL_SOURCE, /absolute inset-0 z-0/u);
	assert.match(SHELL_SOURCE, /\[&>\*\]:relative \[&>\*\]:z-10/u);
	assert.match(SHELL_SOURCE, /whileTap: interactive \? tapAnimation : undefined/u);
	// Focus ring follows the overlay button's focus-visible state, not the article's.
	assert.match(SHELL_SOURCE, /has-\[\[data-slot=card-directory-select\]:focus-visible\]:ring-3/u);
});

test("inert card content lets clicks fall through to the select button", () => {
	// Regression: the content wrapper sits at z-10 above the z-0 select button, so
	// clicks on inert text/logo (most of the card surface) were swallowed and never
	// reached the overlay button — selection felt unreliable and required repeated
	// clicks. Inert content is now pointer-events-none so clicks fall through, while
	// genuinely interactive descendants (menus, links, form controls) re-enable
	// pointer events so they stay clickable.
	assert.match(SHELL_SOURCE, /\[&>\*\]:pointer-events-none/u);
	assert.match(SHELL_SOURCE, /\[&_button\]:pointer-events-auto/u);
	assert.match(SHELL_SOURCE, /\[&_a\]:pointer-events-auto/u);
	assert.match(SHELL_SOURCE, /\[&_\[role=button\]\]:pointer-events-auto/u);
	assert.match(SHELL_SOURCE, /\[&_\[role=menuitem\]\]:pointer-events-auto/u);
	assert.match(SHELL_SOURCE, /\[&_input\]:pointer-events-auto/u);
});

test("interaction hook derives interactivity from onSelect and drops manual key handling", () => {
	assert.match(INTERACTION_SOURCE, /const interactive = Boolean\(onSelect\)/u);
	assert.match(INTERACTION_SOURCE, /useReducedMotion\(\)/u);
	// Native <button> overlay owns Enter/Space, so the hook no longer ships a keydown handler.
	assert.doesNotMatch(INTERACTION_SOURCE, /handleKeyDown/u);
	assert.doesNotMatch(INTERACTION_SOURCE, /event\.key/u);
	assert.match(INTERACTION_SOURCE, /handleSelect/u);
});

test("interaction hook keeps the card border visible while adding hover elevation", () => {
	assert.match(INTERACTION_SOURCE, /boxShadow: OVERLAY_SHADOW/u);
	assert.doesNotMatch(INTERACTION_SOURCE, /TRANSPARENT_BORDER_COLOR/u);
	assert.doesNotMatch(INTERACTION_SOURCE, /borderColor/u);
	assert.doesNotMatch(INTERACTION_SOURCE, /scale: 1\.006/u);
});

test("parts carry data-slot attributes for the shared shell pieces", () => {
	for (const slot of [
		"card-directory-header",
		"card-directory-byline",
		"card-directory-description",
		"card-directory-footer",
		"card-directory-stat",
		"card-directory-section",
		"card-directory-banner",
		"card-directory-capabilities",
	]) {
		assert.match(PARTS_SOURCE, new RegExp(`data-slot="${slot}"`, "u"));
	}
});

test("header leading is optional and only renders the leading span when present", () => {
	assert.match(PARTS_SOURCE, /leading\?: ReactNode/u);
	assert.match(PARTS_SOURCE, /className="flex items-center gap-2"/u);
	assert.match(PARTS_SOURCE, /\{leading \? <span className="inline-flex shrink-0 items-center leading-none">\{leading\}<\/span> : null\}/u);
	assert.doesNotMatch(PARTS_SOURCE, /items-start/u);
});

test("banner part draws the full-bleed cover and hexagon-outlined cover avatar", () => {
	assert.match(PARTS_SOURCE, /relative shrink-0 overflow-hidden bg-surface/u);
	assert.match(PARTS_SOURCE, /backgroundColor: coverColor/u);
	assert.match(PARTS_SOURCE, /getBannerCoverColor/u);
	assert.match(PARTS_SOURCE, /avatarBadge\?: ReactNode/u);
	// The cover avatar art is a full-bleed hexagon, rendered directly with the surface ring
	// drawn over it and centered on the hexagon edge — NOT routed through the Avatar hexagon
	// clip, whose square-viewBox geometry floated the outline off the edge in this non-square
	// box. Art and stroke share one viewBox and default scaling so they stay flush.
	assert.doesNotMatch(PARTS_SOURCE, /shape="hexagon"/u);
	assert.match(PARTS_SOURCE, /group\/avatar absolute top-6 left-4 h-12 w-\[42px\]/u);
	assert.match(PARTS_SOURCE, /data-size="xl"/u);
	assert.match(PARTS_SOURCE, /stroke-surface/u);
});

test("capabilities part renders a borderless icon-tile feature list (no inner scroll)", () => {
	assert.match(PARTS_SOURCE, /@atlaskit\/icon-lab\/core\/ai-model/u);
	assert.match(PARTS_SOURCE, /<ul className="flex flex-col gap-1">/u);
	assert.match(PARTS_SOURCE, /className="flex items-center gap-2"/u);
	assert.doesNotMatch(PARTS_SOURCE, /rounded-xl border border-border bg-bg-input/u);
	assert.doesNotMatch(PARTS_SOURCE, /max-h-44/u);
	assert.doesNotMatch(PARTS_SOURCE, /py-1\.5/u);
});

test("agent variant renders a hexagon avatar with rating and chat stats", () => {
	assert.match(AGENT_SOURCE, /shape="hexagon"/u);
	assert.match(AGENT_SOURCE, /StarUnstarredIcon/u);
	assert.match(AGENT_SOURCE, /AiChatIcon/u);
	assert.match(AGENT_SOURCE, /<EntityCardByline/u);
	assert.match(AGENT_SOURCE, /chats/u);
});

test("expanded agent variant adds a cover banner and scrollable capabilities to the agent layout", () => {
	assert.match(AGENT_EXPANDED_SOURCE, /<EntityCardBanner/u);
	assert.match(AGENT_EXPANDED_SOURCE, /avatarBadge=\{avatarBadge\}/u);
	assert.match(AGENT_EXPANDED_SOURCE, /<EntityCardCapabilities/u);
	assert.match(AGENT_EXPANDED_SOURCE, /capabilities: readonly \(EntityCardCapability \| string\)\[\]/u);
	assert.match(AGENT_EXPANDED_SOURCE, /StarUnstarredIcon/u);
	assert.match(AGENT_EXPANDED_SOURCE, /AiChatIcon/u);
	assert.match(AGENT_EXPANDED_SOURCE, /<EntityCardByline/u);
});

test("expanded agent variant uses stable project-avatar fallbacks for team badges", () => {
	assert.match(AGENT_EXPANDED_SOURCE, /<AvatarProjectBadge>/u);
	assert.match(AGENT_EXPANDED_SOURCE, /const PROJECT_BADGE_AVATAR_SRCS = \[/u);
	assert.match(AGENT_EXPANDED_SOURCE, /function getProjectBadgeAvatarSrc\(seed: string\)/u);
	assert.match(AGENT_EXPANDED_SOURCE, /getProjectBadgeAvatarSrc\(`\$\{publisher\}:\$\{name\}`\)/u);
	assert.match(AGENT_EXPANDED_SOURCE, /publisherLogoSrc \?\? projectBadgeAvatarSrc/u);
	assert.match(AGENT_EXPANDED_SOURCE, /\/avatar-project\/battery\.svg/u);
	assert.match(AGENT_EXPANDED_SOURCE, /\/avatar-project\/loom-record\.svg/u);
	assert.match(AGENT_EXPANDED_SOURCE, /\/avatar-project\/rocket\.svg/u);
	assert.match(AGENT_EXPANDED_SOURCE, /\/avatar-project\/science\.svg/u);
	assert.match(AGENT_EXPANDED_SOURCE, /\/avatar-project\/support-wrench\.svg/u);
	assert.doesNotMatch(AGENT_EXPANDED_SOURCE, /publisherLogoSrc \?\? "\/1p\/rovo\.svg"/u);
	assert.doesNotMatch(AGENT_EXPANDED_SOURCE, /publisherLogoSrc \?\? "\/avatar-project\/group\.svg"/u);
});

test("expanded agent variant renders Works with sources and Skills tags", () => {
	assert.match(AGENT_EXPANDED_SOURCE, /TWGAppstack/u);
	assert.match(AGENT_EXPANDED_SOURCE, /<TWGAppstack animated=\{false\}/u);
	assert.match(AGENT_EXPANDED_SOURCE, /const ENTITY_CARD_SKILLS_MAX_ROWS = 2/u);
	assert.match(AGENT_EXPANDED_SOURCE, /const ENTITY_CARD_SKILLS_GROUP_CLASS_NAME = "h-11 content-start overflow-clip \[overflow-clip-margin:3px\]"/u);
	assert.match(AGENT_EXPANDED_SOURCE, /<SkillTagGroup className=\{ENTITY_CARD_SKILLS_GROUP_CLASS_NAME\} maxRows=\{ENTITY_CARD_SKILLS_MAX_ROWS\}>/u);
	assert.doesNotMatch(AGENT_EXPANDED_SOURCE, /MAX_VISIBLE_SKILLS/u);
	assert.match(AGENT_EXPANDED_SOURCE, /maxVisible=\{8\}/u);
	assert.match(AGENT_EXPANDED_SOURCE, /label="Works with"/u);
	assert.match(AGENT_EXPANDED_SOURCE, /label="Skills"/u);
});

test("expanded agent scroll mask only fades the sticky header edge", () => {
	assert.match(AGENT_EXPANDED_SOURCE, /ENTITY_CARD_SCROLL_MASK_IMAGE/u);
	assert.match(AGENT_EXPANDED_SOURCE, /transparent 0, black var\(--scroll-mask-fade-size\), black 100%/u);
	assert.doesNotMatch(AGENT_EXPANDED_SOURCE, /black calc\(100% - var\(--scroll-mask-fade-size\)\), transparent 100%/u);
});

test("expanded agent variant divides content and renders a metadata + collaborator footer", () => {
	assert.match(AGENT_EXPANDED_SOURCE, /<div className="py-1\.5">\s*<Separator \/>\s*<\/div>/u);
	assert.match(AGENT_EXPANDED_SOURCE, /<AvatarGroup/u);
	assert.match(AGENT_EXPANDED_SOURCE, /AvatarGroupCount/u);
	assert.match(AGENT_EXPANDED_SOURCE, /const MAX_VISIBLE_COLLABORATORS = 4/u);
	assert.match(AGENT_EXPANDED_SOURCE, /collaborators\.slice\(0, MAX_VISIBLE_COLLABORATORS\)/u);
	assert.match(AGENT_EXPANDED_SOURCE, /Math\.max\(collaborators\.length - MAX_VISIBLE_COLLABORATORS, 0\) \+ \(collaboratorOverflow \?\? 0\)/u);
	assert.match(AGENT_EXPANDED_SOURCE, /visibleCollaborators\.length === MAX_VISIBLE_COLLABORATORS && hiddenCollaboratorCount > 0/u);
	assert.match(AGENT_EXPANDED_SOURCE, /showHiddenCollaboratorCount \? \(/u);
	assert.match(AGENT_EXPANDED_SOURCE, /stats\?: ReadonlyArray/u);
	assert.match(AGENT_EXPANDED_SOURCE, /collaborators\?: ReadonlyArray/u);
});

test("expanded agent footer swaps to a Use template outline button on hover", () => {
	assert.match(AGENT_EXPANDED_SOURCE, /import \{ Button \} from "@\/components\/ui\/button"/u);
	assert.match(AGENT_EXPANDED_SOURCE, /event\.stopPropagation\(\);\s*onSelect\?\.\(\);/u);
	assert.match(AGENT_EXPANDED_SOURCE, /group-hover\/card:opacity-0 group-focus-within\/card:opacity-0/u);
	assert.match(AGENT_EXPANDED_SOURCE, /group-hover\/card:pointer-events-auto group-hover\/card:opacity-100/u);
	assert.match(AGENT_EXPANDED_SOURCE, /variant="outline"[\s\S]*Use template/u);
});

test("expanded agent variant pins the header and footer around a scrollable body region", () => {
	assert.match(AGENT_EXPANDED_SOURCE, /data-slot="card-directory-sticky-header"/u);
	assert.match(
		AGENT_EXPANDED_SOURCE,
		/<EntityCardBanner[\s\S]*<div className="px-4 pt-3">[\s\S]*<EntityCardHeader[\s\S]*byline=\{<EntityCardByline publisher=\{publisher\} verified=\{verified\} \/>\}[\s\S]*title=\{name\}[\s\S]*<EntityCardDescription className="mt-1">[\s\S]*description \?\?/u,
	);
	// flex-auto + min-h-0 + overflow-y-auto lets the body hug its content when the card is
	// unbounded, yet shrink + scroll (header/footer pinned) when a height is imposed
	assert.match(AGENT_EXPANDED_SOURCE, /flex min-h-0 flex-auto flex-col gap-3 overflow-y-auto px-4 pt-2/u);
	assert.match(AGENT_EXPANDED_SOURCE, /<div className="pb-4">\s*<EntityCardCapabilities/u);
	// the expanded shell owns clipping while body/footer restore their own padding; the
	// hover-fading after-border now comes from the base shell, so the variant only resets layout
	assert.match(AGENT_EXPANDED_WRAPPER_SOURCE, /gap-0 overflow-clip p-0/u);
	assert.doesNotMatch(AGENT_EXPANDED_SOURCE, /border-0/u);
	assert.match(AGENT_EXPANDED_SOURCE, /shrink-0 overflow-clip border-t border-border bg-surface/u);
	assert.match(AGENT_EXPANDED_SOURCE, /className="justify-between px-4 py-3 transition-opacity/u);
});

test("expanded agent banner lets the parent card radius clip the cover", () => {
	assert.match(PARTS_SOURCE, /className="relative shrink-0 overflow-hidden bg-surface"/u);
	assert.doesNotMatch(PARTS_SOURCE, /rounded-t-md/u);
	assert.doesNotMatch(PARTS_SOURCE, /-mx-4 -mt-4/u);
});

test("capabilities label is optional and omitted when not provided", () => {
	assert.match(PARTS_SOURCE, /label \? <span/u);
	assert.doesNotMatch(PARTS_SOURCE, /label = "What it can do"/u);
});

test("skill variant uses a 32px icon tile, header byline, and a teammate stat", () => {
	assert.match(SKILL_SOURCE, /IconTile/u);
	assert.match(SKILL_SOURCE, /size="medium"/u);
	// Star + "Used by X teammates" stats (people-group icon), not an eye/view count.
	assert.match(SKILL_SOURCE, /@atlaskit\/icon\/core\/star-unstarred/u);
	assert.match(SKILL_SOURCE, /@atlaskit\/icon\/core\/people-group/u);
	assert.match(SKILL_SOURCE, /Used by \{formatCompact\(teammateCount\)\} teammates/u);
	assert.doesNotMatch(SKILL_SOURCE, /@atlaskit\/icon\/core\/eye-open/u);
	assert.match(SKILL_SOURCE, /EntityCardByline/u);
	assert.match(SKILL_SOURCE, /byline=\{publisher \? <EntityCardByline publisher=\{publisher\} verified=\{verified\} \/> : undefined\}/u);
	assert.doesNotMatch(SKILL_SOURCE, /className="justify-between"/u);
	assert.doesNotMatch(SKILL_SOURCE, /publisherLogo \?\? null/u);
});

test("tool variant uses an app-logo tile with tool and teammate counts", () => {
	assert.match(TOOL_SOURCE, /@atlaskit\/icon-lab\/core\/wrench/u);
	assert.match(TOOL_SOURCE, /@atlaskit\/icon\/core\/people-group/u);
	assert.match(TOOL_SOURCE, /active\?: boolean/u);
	assert.match(TOOL_WRAPPER_SOURCE, /moreAction\?: ReactNode/u);
	assert.match(TOOL_WRAPPER_SOURCE, /<CardDirectory active=\{active\}/u);
	assert.match(TOOL_SOURCE, /<EntityCardMoreButton active=\{active\}/u);
	assert.match(TOOL_SOURCE, /tools/u);
	assert.match(TOOL_SOURCE, /teammates/u);
	assert.doesNotMatch(TOOL_SOURCE, /EntityCardByline/u);
});

test("template variant renders Works with sources and Skills tags, no glow or stats", () => {
	assert.match(TEMPLATE_SOURCE, /TWGAppstack/u);
	assert.match(TEMPLATE_SOURCE, /animated=\{false\}/u);
	assert.match(TEMPLATE_SOURCE, /<SkillTagGroup maxRows=\{2\}>/u);
	assert.match(TEMPLATE_SOURCE, /label="Works with"/u);
	assert.match(TEMPLATE_SOURCE, /label="Skills"/u);
	assert.doesNotMatch(TEMPLATE_SOURCE, /CardGlow|card-glow/u);
	assert.doesNotMatch(TEMPLATE_SOURCE, /StarUnstarredIcon|AiChatIcon/u);
});

test("knowledge variant renders app identity, a publisher byline, and star/teammate stats", () => {
	assert.match(KNOWLEDGE_SOURCE, /data-slot="entity-card-knowledge"/u);
	assert.match(KNOWLEDGE_SOURCE, /title=\{name\}/u);
	assert.match(KNOWLEDGE_SOURCE, /<EntityCardDescription>\{description\}<\/EntityCardDescription>/u);
	// Provider attribution moved to a "By {publisher}" byline (with optional
	// verified checkmark), mirroring the agent/skill cards.
	assert.match(KNOWLEDGE_SOURCE, /byline=\{bylinePublisher \? <EntityCardByline publisher=\{bylinePublisher\} verified=\{verified\} \/> : undefined\}/u);
	assert.match(KNOWLEDGE_SOURCE, /const bylinePublisher = publisher \?\? providerName/u);
	// The metadata row shows star + "Used by X teammates" stats (people-group
	// icon), like the tool card — not an eye/view count or the raw provider name.
	assert.match(KNOWLEDGE_SOURCE, /@atlaskit\/icon\/core\/star-unstarred/u);
	assert.match(KNOWLEDGE_SOURCE, /@atlaskit\/icon\/core\/people-group/u);
	assert.match(KNOWLEDGE_SOURCE, /formatCompact\(starCount\)/u);
	assert.match(KNOWLEDGE_SOURCE, /Used by \{formatCompact\(teammateCount\)\} teammates/u);
	assert.doesNotMatch(KNOWLEDGE_SOURCE, /@atlaskit\/icon\/core\/eye-open/u);
	assert.doesNotMatch(KNOWLEDGE_SOURCE, /<EntityCardFooter>[\s\S]*<span>\{providerName\}<\/span>/u);
	assert.match(KNOWLEDGE_WRAPPER_SOURCE, /className=\{cn\("gap-4", className\)\}/u);
	assert.match(KNOWLEDGE_WRAPPER_SOURCE, /<EntityCard\.Knowledge/u);
});

test("skill tag group collapses wrapped rows into the overflow count", () => {
	assert.match(SKILL_TAG_SOURCE, /maxRows\?: number/u);
	assert.match(SKILL_TAG_SOURCE, /calculateVisibleSkillTagCount/u);
	assert.match(SKILL_TAG_SOURCE, /<SkillTagCount count=\{hiddenCount\} \/>/u);
	assert.match(SKILL_TAG_SOURCE, /ResizeObserver/u);
	assert.match(SKILL_TAG_SOURCE, /data-slot="skill-tag-group-measure"/u);
});

test("barrel exports the shell, parts, and variant wrappers", () => {
	for (const symbol of [
		"CardDirectory",
		"CardDirectoryHeader",
		"CardDirectoryFooter",
		"CardDirectoryStat",
		"CardDirectoryBanner",
		"CardDirectoryCapabilities",
		"CardDirectoryAgent",
		"CardDirectoryAgentExpanded",
		"CardDirectorySkill",
		"CardDirectoryTool",
		"CardDirectoryKnowledge",
		"CardDirectoryTemplate",
	]) {
		assert.match(INDEX_SOURCE, new RegExp(`\\b${symbol}\\b`, "u"));
	}
});

test("entity-card namespace owns the visual card variants and parts", () => {
	for (const symbol of [
		"EntityCard",
		"Agent",
		"AgentExpanded",
		"AgentProfile",
		"Knowledge",
		"ObjectTile",
		"Skill",
		"Tool",
		"Template",
		"Header",
		"Description",
		"Footer",
		"Stat",
		"Byline",
		"MoreButton",
		"Section",
		"Banner",
		"Capabilities",
	]) {
		assert.match(ENTITY_CARD_INDEX_SOURCE, new RegExp(`\\b${symbol}\\b`, "u"));
	}
});

test("card-directory variants are shell adapters around entity-card content", () => {
	assert.match(AGENT_WRAPPER_SOURCE, /<CardDirectory active=\{active\}/u);
	assert.match(AGENT_WRAPPER_SOURCE, /<EntityCard\.Agent/u);
	assert.match(AGENT_EXPANDED_WRAPPER_SOURCE, /<CardDirectory[\s\S]*className=\{cn\("gap-0 overflow-clip p-0", className\)\}/u);
	assert.match(AGENT_EXPANDED_WRAPPER_SOURCE, /<EntityCard\.AgentExpanded/u);
	assert.match(SKILL_WRAPPER_SOURCE, /<CardDirectory className=\{className\}/u);
	assert.match(SKILL_WRAPPER_SOURCE, /<EntityCard\.Skill/u);
	assert.match(TOOL_WRAPPER_SOURCE, /<CardDirectory active=\{active\}/u);
	assert.match(TOOL_WRAPPER_SOURCE, /<EntityCard\.Tool/u);
	assert.match(KNOWLEDGE_WRAPPER_SOURCE, /<CardDirectory[\s\S]*selectLabel=\{`Select \$\{name\}`\}/u);
	assert.match(KNOWLEDGE_WRAPPER_SOURCE, /<EntityCard\.Knowledge/u);
	assert.match(TEMPLATE_WRAPPER_SOURCE, /<CardDirectory className=\{className\}/u);
	assert.match(TEMPLATE_WRAPPER_SOURCE, /<EntityCard\.Template/u);
});

test("agent-browser renders the shared CardDirectoryAgent (no inline card duplication)", () => {
	assert.match(AGENT_BROWSER_SOURCE, /import \{[\s\S]*CardDirectoryAgent,[\s\S]*\} from "@\/components\/ui-custom\/card-directory"/u);
	assert.match(AGENT_BROWSER_SOURCE, /<CardDirectoryAgent/u);
	assert.doesNotMatch(AGENT_BROWSER_SOURCE, /AgentDirectoryCard/u);
	assert.doesNotMatch(AGENT_BROWSER_SOURCE, /AGENT_CARD_HOVER_ANIMATION/u);
});
