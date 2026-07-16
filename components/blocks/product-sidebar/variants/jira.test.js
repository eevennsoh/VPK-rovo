const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const JIRA_SIDEBAR_SOURCE = fs.readFileSync(path.join(__dirname, "jira.tsx"), "utf8");
const PRODUCT_LOGOS_SOURCE = fs.readFileSync(
	path.join(__dirname, "../components/product-logos.tsx"),
	"utf8",
);

test("Jira sidebar uses the shared Studio-style side nav row contract", () => {
	assert.match(
		JIRA_SIDEBAR_SOURCE,
		/import \{ SidebarNavItem, SidebarNavItemAction \} from "@\/components\/ui-custom\/sidebar-nav-item";/u,
	);
	assert.match(JIRA_SIDEBAR_SOURCE, /<nav aria-label="Jira" className="flex shrink-0 flex-col gap-3">/u);
	assert.match(
		JIRA_SIDEBAR_SOURCE,
		/className="px-1\.5 text-xs font-semibold leading-4 text-text-subtlest"/u,
	);
	assert.match(JIRA_SIDEBAR_SOURCE, /title="Starred"/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /STARRED_PROJECTS\.map/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /JIRA_EXTERNAL_LINKS\.map/u);
	assert.doesNotMatch(JIRA_SIDEBAR_SOURCE, /NavigationItem/u);
	assert.doesNotMatch(JIRA_SIDEBAR_SOURCE, /NavigationItemWithHoverChevron/u);
	assert.doesNotMatch(JIRA_SIDEBAR_SOURCE, /SectionHeading/u);
	assert.doesNotMatch(JIRA_SIDEBAR_SOURCE, /<Divider/u);
});

test("Jira project marks use the shared square tile avatar", () => {
	assert.match(
		JIRA_SIDEBAR_SOURCE,
		/import \{ Tile, TileAvatar \} from "@\/components\/ui\/tile";/u,
	);
	assert.match(JIRA_SIDEBAR_SOURCE, /<TileAvatar[\s\S]*?shape="square"[\s\S]*?src=\{src\}/u);
	assert.doesNotMatch(JIRA_SIDEBAR_SOURCE, /import Image from "next\/image"/u);
});

test("product sidebar logos use the snug Tile contract for glyph alignment", () => {
	assert.match(PRODUCT_LOGOS_SOURCE, /import \{ Tile \} from "@\/components\/ui\/tile";/u);
	assert.match(
		PRODUCT_LOGOS_SOURCE,
		/<Tile aria-hidden=\{isDecorative \? true : undefined\} label=\{label \|\| "Product logo"\} size="xsmall" variant="transparent" isSnug>/u,
	);
	assert.equal(PRODUCT_LOGOS_SOURCE.match(/<ProductLogoTile label=\{props\.label\}>/gu)?.length, 5);
});

test("Jira sidebar primary navigation matches the requested order", () => {
	const labels = ["For you", "Recent", "Starred", "Apps", "Roadmaps", "Plans", "Spaces"];
	const positions = labels.map((label) => JIRA_SIDEBAR_SOURCE.indexOf(`label="${label}"`));

	assert.ok(positions.every((position) => position >= 0));
	assert.deepEqual(positions, [...positions].sort((left, right) => left - right));
	assert.doesNotMatch(JIRA_SIDEBAR_SOURCE, /label="Sprint Board"/u);
	assert.doesNotMatch(JIRA_SIDEBAR_SOURCE, /label="Projects"/u);
	assert.doesNotMatch(JIRA_SIDEBAR_SOURCE, /label="Analytics"/u);
});

test("Jira sidebar session rows use two-line avatar and issue metadata without timestamps", () => {
	assert.match(JIRA_SIDEBAR_SOURCE, /sessionNavigation\?: JiraSidebarSessionNavigation;/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /description=\{<JiraSessionDescription session=\{session\} \/>\}/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /const issueDescription = `\$\{session\.issueKey\}: \$\{session\.issueSummary\}`;/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /<JiraSessionAvatar session=\{session\} \/>/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /label="Agent avatar" variant="transparent" size="xsmall" isSnug/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /<TileAvatar alt="" aria-hidden shape="hexagon" src=\{session\.agentAvatarSrc\} \/>/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /import TaskIcon from "@atlaskit\/icon\/core\/task";/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /<TaskIcon label="" size="small" color="currentColor" \/>/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /flex min-w-0 items-center gap-1"/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /flex min-w-0 flex-1 items-center gap-0\.5/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /<span className="shrink-0">\{session\.issueKey\}:<\/span>/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /<span className="truncate">\{session\.issueSummary\}<\/span>/u);
	assert.doesNotMatch(JIRA_SIDEBAR_SOURCE, /ml-1 truncate/u);
	assert.doesNotMatch(JIRA_SIDEBAR_SOURCE, /relativeTime/u);
	assert.doesNotMatch(JIRA_SIDEBAR_SOURCE, /max-w-20 shrink truncate/u);
	assert.doesNotMatch(JIRA_SIDEBAR_SOURCE, /leading=\{<JiraSessionAvatar/u);
});

test("Jira session lifecycle metadata reuses the established Rovo visuals", () => {
	assert.match(JIRA_SIDEBAR_SOURCE, /"awaiting-input" \| "running" \| "pr-open" \| "merged" \| "stopped"/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /<Shimmer as="span" duration=\{1\.4\} spread=\{2\}/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /<StatusInformationIcon label="Waiting for your response"/u);
	assert.match(
		JIRA_SIDEBAR_SOURCE,
		/meta=\{\([\s\S]*group-hover\/sidebar-nav-item:hidden[\s\S]*<JiraSessionLifecycle status=\{session\.status\} \/>/u,
	);
	assert.doesNotMatch(
		JIRA_SIDEBAR_SOURCE,
		/<span className="shrink-0" aria-hidden="true">·<\/span>\s*<JiraSessionLifecycle/u,
	);
	assert.match(JIRA_SIDEBAR_SOURCE, /import \{ Spinner \} from "@\/components\/ui\/spinner";/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /return <Spinner label="Running" size="xs" variant="rainbow" \/>/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /text-icon-success[\s\S]*<PullRequestIcon label="Pull request open"/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /text-icon-accent-purple[\s\S]*<MergeSuccessIcon label="Pull request merged"/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /<VideoStopIcon label="Stopped"/u);
});

test("Jira session rows expose pin and lifecycle actions", () => {
	assert.match(JIRA_SIDEBAR_SOURCE, /onTogglePinSession: \(sessionId: string\) => void;/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /onStopSession: \(sessionId: string\) => void;/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /onArchiveSession: \(sessionId: string\) => void;/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /const isArchivable = status === "pr-open" \|\| status === "merged" \|\| status === "stopped";/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /aria-label=\{`\$\{isPinned \? "Unpin" : "Pin"\} \$\{title\}`\}/u);
	assert.equal(
		JIRA_SIDEBAR_SOURCE.match(/group-data-\[selected=true\]\/sidebar-nav-item:text-icon-subtle/g)?.length,
		2,
	);
	assert.match(
		JIRA_SIDEBAR_SOURCE,
		/text-icon-danger group-data-\[selected=true\]\/sidebar-nav-item:text-icon-danger[\s\S]*<VideoStopOverlayIcon label="" size="small" \/>/u,
	);
	assert.match(JIRA_SIDEBAR_SOURCE, /if \(isArchivable\) onArchive\(\);[\s\S]*else onStop\(\);/u);
});

test("manual Queue sorting makes the session row draggable without a handle icon", () => {
	assert.match(JIRA_SIDEBAR_SOURCE, /DndContext,[\s\S]*KeyboardSensor,[\s\S]*PointerSensor/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /useSortable\(\{ disabled: !canReorder, id: session\.id \}\)/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /buttonProps=\{canReorder \? \{[\s\S]*\.\.\.attributes,[\s\S]*\.\.\.listeners,[\s\S]*touchAction: "none"/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /buttonRef=\{setActivatorNodeRef\}/u);
	assert.doesNotMatch(JIRA_SIDEBAR_SOURCE, /DragHandleVerticalIcon/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /sessionNavigation\.sortMode !== "manual"/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /sessionNavigation\.onReorderSession\(activeSessionId, overSessionId\)/u);
	assert.equal(JIRA_SIDEBAR_SOURCE.match(/<SortableContext/g)?.length, 3);
});

test("pinned and flattened sessions render once without project rows", () => {
	assert.match(JIRA_SIDEBAR_SOURCE, /pinnedSessionIds: ReadonlySet<string>;/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /allSessions\.filter\(\(session\) => sessionNavigation\.pinnedSessionIds\.has\(session\.id\)\)/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /title="Pinned"/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /\{pinnedSessions\.map\(renderSessionRow\)\}/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /sessionNavigation\?\.layoutMode === "one-list"/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /\{unpinnedSessions\.map\(renderSessionRow\)\}/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /filter\(\(session\) => !sessionNavigation\?\.pinnedSessionIds\.has\(session\.id\)\)/u);
});

test("Spaces organize menu controls grouping and sorting", () => {
	assert.match(
		JIRA_SIDEBAR_SOURCE,
		/actions=\{sessionNavigation \? \([\s\S]*<JiraSpacesOrganizeAction[\s\S]*<JiraSidebarActions \/>/u,
	);
	assert.match(JIRA_SIDEBAR_SOURCE, /aria-label="Organize spaces"/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /<SortOptionsIcon label="" size="small" \/>/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /<DropdownMenuGroup>[\s\S]*<DropdownMenuLabel>Organize<\/DropdownMenuLabel>[\s\S]*<DropdownMenuRadioGroup/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /value="by-project">By project/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /value="one-list">In one list/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /<DropdownMenuGroup>[\s\S]*<DropdownMenuLabel>Sort by<\/DropdownMenuLabel>[\s\S]*<DropdownMenuRadioGroup/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /value="priority">Priority/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /value="last-updated">Last updated/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /value="manual">Manual order/u);
});

test("session flyovers distinguish cloud and local execution details", () => {
	assert.match(JIRA_SIDEBAR_SOURCE, /host: JiraSidebarSessionHost;/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /<HoverCard closeDelay=\{80\} openDelay=\{240\}>/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /<HoverCardTrigger render=\{<div className="w-full" \/>\}>/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /session\.host === "cloud" \? "Cloud session" : "Local session"/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /session\.status === "awaiting-input" \? \([\s\S]*label="Status"[\s\S]*value="Awaiting user response"/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /label="Repository" value=\{session\.repository\}/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /label="Branch" value=\{session\.branch\}/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /label="Worktree" value=\{session\.worktreePath\}/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /label="Pull request" value=\{`#\$\{session\.pullRequestNumber\}`\}/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /label="Commit" value=\{session\.commit\}/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /label="Checks" value=\{session\.checks\}/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /className="w-80 border-0 bg-surface-overlay p-3 text-text shadow-overlay"/u);
});

test("expanded project session spacing follows the compact queue rhythm", () => {
	assert.match(JIRA_SIDEBAR_SOURCE, /className="flex flex-col gap-0\.5 pl-4"/u);
	assert.match(JIRA_SIDEBAR_SOURCE, /isExpanded && projectIndex < STARRED_PROJECTS\.length - 1 && "mb-3"/u);
	assert.doesNotMatch(JIRA_SIDEBAR_SOURCE, /STARRED_PROJECTS\.length && "mb-3"/u);
});
