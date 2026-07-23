const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const INDEX_SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const ITEM_SOURCE = readFileSync(join(__dirname, "jira-for-you-item.tsx"), "utf8");
const SECTION_SOURCE = readFileSync(join(__dirname, "jira-for-you-section.tsx"), "utf8");
const TYPES_SOURCE = readFileSync(join(__dirname, "jira-for-you-types.ts"), "utf8");
const WORKSPACE_SOURCE = readFileSync(join(__dirname, "jira-for-you-workspace.tsx"), "utf8");
const WORKSPACE_TYPES_SOURCE = readFileSync(join(__dirname, "jira-for-you-workspace-types.ts"), "utf8");
const WORKSPACE_DATA_SOURCE = readFileSync(join(__dirname, "jira-for-you-workspace-data.ts"), "utf8");
const CONVERSATION_SOURCE = readFileSync(join(__dirname, "jira-for-you-conversation.tsx"), "utf8");
const HEADER_SOURCE = readFileSync(join(__dirname, "jira-for-you-header.tsx"), "utf8");
const DETAIL_PANEL_SOURCE = readFileSync(join(__dirname, "jira-for-you-detail-panel.tsx"), "utf8");
const SESSION_FLYOUT_SOURCE = readFileSync(
	join(process.cwd(), "components/blocks/product-sidebar/variants/jira-session-flyout.tsx"),
	"utf8",
);
const COMPOSER_CARD_SOURCE = readFileSync(
	join(process.cwd(), "components/projects/shared/components/composer-card-body.tsx"),
	"utf8",
);
const SIDEBAR_COMPOSER_SOURCE = readFileSync(
	join(process.cwd(), "components/projects/sidebar-chat/components/chat-composer.tsx"),
	"utf8",
);
const DEMO_SOURCE = readFileSync(
	join(process.cwd(), "components/website/demos/blocks/jira-for-you-demo.tsx"),
	"utf8",
);
const PREVIEW_PAGE_SOURCE = readFileSync(
	join(process.cwd(), "app/preview/blocks/jira-for-you/page.tsx"),
	"utf8",
);
const DETAIL_DOC_SOURCE = readFileSync(
	join(process.cwd(), "app/data/details/blocks/jira-for-you.ts"),
	"utf8",
);

test("Jira For You preserves standalone list callbacks while exposing selected-row state", () => {
	assert.match(TYPES_SOURCE, /id\?: string;/u);
	assert.match(INDEX_SOURCE, /selectedItemId\?: string;/u);
	assert.match(INDEX_SOURCE, /onViewButtonRef\?: \(item: JiraForYouItem, node: HTMLButtonElement \| null\) => void;/u);
	assert.match(SECTION_SOURCE, /isSelected=\{item\.id === selectedItemId\}/u);
	assert.match(ITEM_SOURCE, /aria-current=\{isSelected \? "true" : undefined\}/u);
	assert.match(ITEM_SOURCE, /isSelected && "bg-bg-selected hover:bg-bg-selected-hovered"/u);
	assert.match(ITEM_SOURCE, /onView=\{\(\) => \(onView \?\? onItemClick\)\?\.\(item\)\}/u);
	assert.match(ITEM_SOURCE, /viewButtonRef=\{\(node\) => onViewButtonRef\?\.\(item, node\)\}/u);
});

test("the workspace owns open or close, focus restoration, and local user-message state", () => {
	assert.match(INDEX_SOURCE, /export \{ JiraForYouWorkspace \} from "\.\/jira-for-you-workspace";/u);
	assert.doesNotMatch(WORKSPACE_SOURCE, /useWindowWidth/u);
	assert.match(WORKSPACE_SOURCE, /const \[workspaceNode, setWorkspaceNode\] = useState<HTMLDivElement \| null>\(null\);/u);
	assert.match(WORKSPACE_SOURCE, /const \[workspaceWidth, setWorkspaceWidth\] = useState\(0\);/u);
	assert.match(WORKSPACE_SOURCE, /const isNarrow = workspaceWidth > 0 && workspaceWidth < NARROW_LAYOUT_BREAKPOINT_PX;/u);
	assert.match(WORKSPACE_SOURCE, /const shouldReduceMotion = useReducedMotion\(\);/u);
	assert.match(WORKSPACE_SOURCE, /CONSTRAINED_OVERLAY_VARIANTS/u);
	assert.match(WORKSPACE_SOURCE, /inert=\{activeItemData && isNarrow \? true : undefined\}/u);
	assert.match(WORKSPACE_SOURCE, /data-layout=\{isNarrow \? "overlay" : "split"\}/u);
	assert.match(WORKSPACE_SOURCE, /aria-label=\{`Chat workspace for \$\{assignedItemData\.item\.issueKey\}`\}/u);
	assert.match(WORKSPACE_SOURCE, /const resizeObserver = new ResizeObserver/u);
	assert.match(WORKSPACE_SOURCE, /ref=\{setWorkspaceNode\}/u);
	assert.match(WORKSPACE_SOURCE, /const \[mode, setMode\] = useState<JiraForYouWorkspaceMode>\(\{ kind: "feed" \}\)/u);
	assert.match(WORKSPACE_SOURCE, /const \[isDetailPanelOpen, setIsDetailPanelOpen\] = useState\(false\)/u);
	assert.match(WORKSPACE_SOURCE, /const viewButtonRefs = useRef\(new Map<string, HTMLButtonElement>\(\)\);/u);
	assert.match(
		WORKSPACE_SOURCE,
		/const focusWhenReady = \(\) => \{[\s\S]*focusRestoreControlRef\.current === "row"[\s\S]*rowButtonRefs\.current\.get\(itemId\)[\s\S]*viewButtonRefs\.current\.get\(itemId\);[\s\S]*button\.focus\(\);/u,
	);
	assert.match(WORKSPACE_SOURCE, /setMode\(\{ itemId: item\.id, kind: "assigned-chat" \}\);[\s\S]*setIsDetailPanelOpen\(!isNarrow\);/u);
	assert.match(WORKSPACE_SOURCE, /pendingFocusRestoreItemIdRef\.current = focusRestoreItemIdRef\.current;[\s\S]*setMode\(\{ kind: "feed" \}\);[\s\S]*setIsDetailPanelOpen\(false\);/u);
	assert.match(WORKSPACE_SOURCE, /createRovoAppUserMessage/u);
	assert.match(WORKSPACE_SOURCE, /createId\("jira-for-you-user"\)/u);
	assert.match(WORKSPACE_SOURCE, /const WIDE_FEED_MIN_WIDTH_PX = 420;/u);
	assert.match(WORKSPACE_SOURCE, /const WIDE_CONVERSATION_PREFERRED_WIDTH_PX = 800;/u);
	assert.match(WORKSPACE_SOURCE, /flexBasis:[\s\S]*WIDE_CONVERSATION_PREFERRED_WIDTH_PX[\s\S]*detailPanelResize\.sidebarWidth/u);
	assert.match(WORKSPACE_SOURCE, /maxWidth: `calc\(100% - \$\{WIDE_FEED_MIN_WIDTH_PX\}px\)`/u);
	assert.match(WORKSPACE_SOURCE, /"min-w-\[420px\] flex-1 border-r border-border"/u);
	assert.match(WORKSPACE_SOURCE, /onItemClick=\{\(item\) => handleItemActivate\(item, "row"\)\}/u);
	assert.match(WORKSPACE_SOURCE, /onView=\{\(item\) => handleItemActivate\(item, "view"\)\}/u);
	assert.match(WORKSPACE_SOURCE, /detailPanelInsetPx=\{\s*isDetailPanelOpen && !isNarrow\s*\?\s*detailPanelResize\.sidebarWidth\s*:\s*0\s*\}/u);
});

test("the conversation workspace reuses fullscreen chat primitives and a back path", () => {
	assert.match(CONVERSATION_SOURCE, /import \{ ChatMessages \} from "@\/components\/projects\/shared\/components\/chat-messages";/u);
	assert.match(CONVERSATION_SOURCE, /import \{ RovoAppComposer \} from "@\/components\/projects\/rovo\/components\/rovo-app-composer";/u);
	assert.match(CONVERSATION_SOURCE, /import ArrowLeftIcon from "@atlaskit\/icon\/core\/arrow-left";/u);
	assert.match(CONVERSATION_SOURCE, /aria-label="Back to For you feed"/u);
	assert.match(CONVERSATION_SOURCE, /<Button[\s\S]*aria-label="Back to For you feed"[\s\S]*size="icon"[\s\S]*variant="ghost"/u);
	assert.ok(CONVERSATION_SOURCE.includes('<Icon aria-hidden render={<ArrowLeftIcon label="" />} />'));
	assert.match(CONVERSATION_SOURCE, /aria-label="Open detail panel"/u);
	assert.match(CONVERSATION_SOURCE, /const conversationColumnStyle =\s*detailPanelInsetPx > 0\s*\?\s*\{ maxWidth: `calc\(100% - \$\{detailPanelInsetPx\}px\)` \}\s*:\s*undefined/u);
	assert.match(CONVERSATION_SOURCE, /className="flex min-h-0 min-w-0 flex-1 flex-col"[\s\S]*data-testid="jira-for-you-conversation-pane"[\s\S]*style=\{conversationColumnStyle\}/u);
	assert.ok(CONVERSATION_SOURCE.includes('contentClassName="mx-auto flex min-w-0 w-full max-w-[800px] px-3 md:px-6"'));
	assert.ok(CONVERSATION_SOURCE.includes('className="mx-auto flex min-w-0 w-full max-w-[800px] flex-col px-3 py-3 md:px-6"'));
	assert.match(CONVERSATION_SOURCE, /<p className="truncate text-sm font-semibold text-text">\s*\{selectedAgentSession\.profile\.name\}\s*<\/p>/u);
	assert.match(CONVERSATION_SOURCE, /<p className="sr-only">\s*\{item\.issueKey\}: \{item\.title\}\s*<\/p>/u);
	assert.doesNotMatch(CONVERSATION_SOURCE, /\{isNarrow \? null : <span>Back<\/span>\}/u);
	assert.doesNotMatch(CONVERSATION_SOURCE, /\{item\.issueKey\}: \{item\.title\}[\s\S]*selectedAgentSession\.profile\.name/u);
	assert.match(CONVERSATION_SOURCE, /messageMode="ask"/u);
	assert.match(CONVERSATION_SOURCE, /showFeedbackActions=\{false\}/u);
	assert.match(CONVERSATION_SOURCE, /showFollowUpSuggestions=\{false\}/u);
	assert.doesNotMatch(CONVERSATION_SOURCE, /hideSourceAndModelControls/u);
	assert.match(CONVERSATION_SOURCE, /hideReasoningSelector/u);
	assert.doesNotMatch(CONVERSATION_SOURCE, /showSubmitWhenEmpty/u);
	assert.match(CONVERSATION_SOURCE, /const realtime = useRealtimeVoice\(/u);
	assert.match(CONVERSATION_SOURCE, /onToggleRealtimeVoice=\{handleToggleRealtimeVoice\}/u);
	assert.match(CONVERSATION_SOURCE, /realtimeVoiceActive=\{realtime\.voiceState !== "idle"\}/u);
	assert.match(CONVERSATION_SOURCE, /realtimeVoiceState=\{realtime\.voiceState\}/u);
	assert.match(COMPOSER_CARD_SOURCE, /<RovoComposerSendControls/u);
	assert.match(SIDEBAR_COMPOSER_SOURCE, /<ChatComposerSendControls/u);
	assert.doesNotMatch(CONVERSATION_SOURCE, /PromptInputSubmit|RovoComposerSendControls/u);
	assert.match(CONVERSATION_SOURCE, /data-testid="jira-for-you-composer-region"/u);
	assert.doesNotMatch(CONVERSATION_SOURCE, /shrink-0 border-t border-border bg-background\/90/u);
	assert.match(CONVERSATION_SOURCE, /<Footer \/>/u);
});

test("the header wraps tabs beneath the title when space gets tight without moving the search field into that row", () => {
	assert.match(HEADER_SOURCE, /className="@container flex min-w-0 flex-col gap-4 overflow-x-hidden"/u);
	assert.match(HEADER_SOURCE, /@max-\[28rem\]:flex-col[\s\S]*@max-\[28rem\]:gap-y-4/u);
	assert.match(HEADER_SOURCE, /<h2 className="shrink-0 text-text"/u);
	assert.match(HEADER_SOURCE, /className="min-w-0 max-w-full flex-none @max-\[28rem\]:w-full"/u);
	assert.match(HEADER_SOURCE, /<TabsList className="h-auto w-max max-w-full flex-nowrap justify-start overflow-x-auto @max-\[28rem\]:w-full">/u);
	assert.match(HEADER_SOURCE, /@max-\[28rem\]:flex-\[1_1_auto\]/u);
	assert.match(HEADER_SOURCE, /<span className="min-w-min truncate">\{tab\.label\}<\/span>/u);
	assert.match(HEADER_SOURCE, /<InputGroup className="min-w-0">/u);
});

test("the detail panel includes an Agents selector and agent-specific details content", () => {
	assert.match(DETAIL_PANEL_SOURCE, /import type \{ JiraSidebarSessionStatus \}/u);
	assert.match(DETAIL_PANEL_SOURCE, /JiraAgentSession/u);
	assert.match(DETAIL_PANEL_SOURCE, /type JiraAgentSessionItem/u);
	assert.match(DETAIL_PANEL_SOURCE, /aria-labelledby="jira-for-you-agents-heading"/u);
	assert.match(DETAIL_PANEL_SOURCE, /<JiraSessionSectionHeading id="jira-for-you-agents-heading">Agents<\/JiraSessionSectionHeading>/u);
	assert.match(DETAIL_PANEL_SOURCE, /items=\{sessionItems\}/u);
	assert.match(DETAIL_PANEL_SOURCE, /onView=\{\(sessionItem\) => onAgentSelect\(sessionItem\.id\)\}/u);
	assert.match(DETAIL_PANEL_SOURCE, /selectedItemId=\{selectedAgentId\}/u);
	assert.doesNotMatch(DETAIL_PANEL_SOURCE, /Shimmer|JiraSessionLifecycle|TileAvatar|<Tag/u);
	assert.match(DETAIL_PANEL_SOURCE, /<JiraSessionFlyoutBody[\s\S]*hideAgentRow[\s\S]*session=\{details\.session\}/u);
	assert.match(DETAIL_PANEL_SOURCE, /<DetailArtifacts details=\{details\} \/>/u);
	assert.match(SESSION_FLYOUT_SOURCE, /hideAgentRow = false/u);
	assert.match(SESSION_FLYOUT_SOURCE, /\{hideAgentRow \? null : \(\s*<FlyoutRow[\s\S]*label="Agent"/u);
	assert.match(DETAIL_PANEL_SOURCE, /<SmartLink align="center" alignOffset=\{0\} className="max-w-full" item=\{source\} side="left" \/>/u);
	assert.match(DETAIL_PANEL_SOURCE, /<AttachmentPreviewCard/u);
	assert.doesNotMatch(DETAIL_PANEL_SOURCE, /<Button[\s\S]*variant="outline"/u);
	assert.match(DETAIL_PANEL_SOURCE, /function getPanelVariants\(/u);
	assert.match(DETAIL_PANEL_SOURCE, /const panelVariants = getPanelVariants\(isNarrow, shouldReduceMotion\);/u);
	assert.match(DETAIL_PANEL_SOURCE, /data-testid="jira-for-you-detail-resize-handle"/u);
	assert.match(DETAIL_PANEL_SOURCE, /isNarrow \? "absolute inset-0" : "absolute inset-y-0 right-0"/u);
	const developmentIndex = DETAIL_PANEL_SOURCE.indexOf("<JiraSessionFlyoutBody");
	const agentIndex = DETAIL_PANEL_SOURCE.indexOf("<AgentSection");
	const artifactsIndex = DETAIL_PANEL_SOURCE.indexOf("<DetailArtifacts");
	assert.ok(developmentIndex >= 0 && agentIndex >= 0 && artifactsIndex >= 0);
	assert.ok(developmentIndex < agentIndex);
	assert.ok(agentIndex < artifactsIndex);
});

test("workspace data stays deterministic, supports multi-agent items, and exhaustively maps statuses", () => {
	assert.match(WORKSPACE_DATA_SOURCE, /const WORKSPACE_ITEM_SEEDS/u);
	assert.match(
		WORKSPACE_DATA_SOURCE,
		/"crm-analytics-dashboard":[\s\S]*"readiness-checker":[\s\S]*"code-reviewer":[\s\S]*"feedback-analyzer":/u,
	);
	assert.doesNotMatch(WORKSPACE_DATA_SOURCE, /getFallbackAgents|return \[\{\s*id: rovo\.id/u);
	assert.match(WORKSPACE_DATA_SOURCE, /if \(!item\.agents\?\.length\) \{[\s\S]*kind: "unassigned"/u);
	assert.match(
		WORKSPACE_DATA_SOURCE,
		/const profile = getRovoAgentProfile\(agent\.id\);[\s\S]*return profile;/u,
	);
	assert.doesNotMatch(WORKSPACE_DATA_SOURCE, /avatarSrc: agent\.avatarSrc/u);
	assert.doesNotMatch(WORKSPACE_DATA_SOURCE, /name: agent\.name/u);
	assert.match(WORKSPACE_DATA_SOURCE, /status: agentSeed\?\.status \?\? sidebarStatus/u);
	assert.match(WORKSPACE_DATA_SOURCE, /kind: "assigned"/u);
	assert.match(
		WORKSPACE_DATA_SOURCE,
		/switch \(status\) \{[\s\S]*case "Review":[\s\S]*case "To do":[\s\S]*case "In progress":[\s\S]*case "In review":[\s\S]*case "Done":[\s\S]*const exhaustiveStatus: never = status;/u,
	);
	assert.match(WORKSPACE_DATA_SOURCE, /export function createJiraForYouWorkspaceData/u);
	assert.match(WORKSPACE_DATA_SOURCE, /const items = sections\.flatMap\(\(section\) => section\.items\);/u);
	assert.match(WORKSPACE_TYPES_SOURCE, /JiraForYouWorkspaceItemDetails/u);
	assert.match(WORKSPACE_TYPES_SOURCE, /details: JiraForYouWorkspaceItemDetails;/u);
	assert.doesNotMatch(WORKSPACE_TYPES_SOURCE, /interface JiraForYouWorkspaceAgentSession \{[^}]*outputs:/u);
	assert.doesNotMatch(WORKSPACE_TYPES_SOURCE, /interface JiraForYouWorkspaceAgentSession \{[^}]*sources:/u);
	assert.doesNotMatch(WORKSPACE_TYPES_SOURCE, /interface JiraForYouWorkspaceAgentSession \{[^}]*session:/u);
	assert.match(WORKSPACE_DATA_SOURCE, /details: createWorkspaceItemDetails/u);
});

test("the block demo and docs now present the workspace instead of the list-only surface", () => {
	assert.match(WORKSPACE_SOURCE, /chrome\?: "framed" \| "plain";/u);
	assert.match(WORKSPACE_SOURCE, /chrome === "framed" \? "rounded-lg border border-border" : "rounded-\[inherit\]"/u);
	assert.match(DEMO_SOURCE, /import \{ JiraForYouWorkspace \} from "@\/components\/blocks\/jira-for-you";/u);
	assert.match(DEMO_SOURCE, /const isStandalonePreview = pathname\.startsWith\("\/preview\/"\);/u);
	assert.match(DEMO_SOURCE, /<div className="h-full min-h-0 overflow-hidden rounded-lg border border-border bg-surface">/u);
	assert.match(DEMO_SOURCE, /<JiraForYouWorkspace chrome="plain" className="h-full min-h-0" \/>/u);
	assert.match(DETAIL_DOC_SOURCE, /demoLayout: \{ previewContentWidth: "full", previewHeight: "fixed" \}/u);
	assert.match(DETAIL_DOC_SOURCE, /import \{ JiraForYouWorkspace, JiraForYou \} from "@\/components\/blocks\/jira-for-you";/u);
	assert.match(DETAIL_DOC_SOURCE, /name: "onView",[\s\S]*type: "\(item: JiraForYouItem\) => void"/u);
	assert.match(DETAIL_DOC_SOURCE, /View falls back to onItemClick/u);
});

test("the dedicated preview route owns the Jira shell state for For you selection and Ask Rovo", () => {
	assert.match(PREVIEW_PAGE_SOURCE, /import \{ useState \} from "react";/u);
	assert.match(PREVIEW_PAGE_SOURCE, /forceShowRovoAction/u);
	assert.doesNotMatch(PREVIEW_PAGE_SOURCE, /hideRovoAction/u);
	assert.match(PREVIEW_PAGE_SOURCE, /import \{ JiraSidebar \} from "@\/components\/blocks\/product-sidebar\/variants\/jira";/u);
	assert.match(PREVIEW_PAGE_SOURCE, /const \[selectedSidebarItem, setSelectedSidebarItem\] = useState\("For you"\);/u);
	assert.match(PREVIEW_PAGE_SOURCE, /content=\{\(\s*<JiraSidebar[\s\S]*onSelectItem=\{setSelectedSidebarItem\}[\s\S]*selectedItem=\{selectedSidebarItem\}/u);
});
