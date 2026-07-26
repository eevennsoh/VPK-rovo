"use client";

import type { FileUIPart } from "ai";
import {
	AnimatePresence,
	motion,
	useReducedMotion,
	type Variants,
} from "motion/react";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";

import { createRovoAppUserMessage } from "@/components/projects/rovo-core/lib/rovo-app-user-message";
import { useSidebarResize } from "@/components/projects/rovo-core/hooks/use-sidebar-resize";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import { createId, cn } from "@/lib/utils";

import { JIRA_FOR_YOU_SECTIONS, JIRA_FOR_YOU_TABS } from "./data";
import { JiraForYou } from "./index";
import { JiraForYouWorkItemWorkspace } from "./jira-for-you-work-item-workspace";
import type { JiraForYouItem, JiraForYouSection, JiraForYouTab } from "./jira-for-you-types";
import { JiraForYouConversation } from "./jira-for-you-conversation";
import { JiraForYouDetailPanel } from "./jira-for-you-detail-panel";
import { createJiraForYouWorkspaceData } from "./jira-for-you-workspace-data";

const DETAIL_PANEL_DEFAULT_WIDTH_PX = 360;
const DETAIL_PANEL_MIN_WIDTH_PX = 280;
const DETAIL_PANEL_MAX_WIDTH_PX = 720;
const NARROW_LAYOUT_BREAKPOINT_PX = 1024;
const WIDE_FEED_MIN_WIDTH_PX = 420;
const WIDE_CONVERSATION_PREFERRED_WIDTH_PX = 800;
const WIDE_JIRA_WORK_ITEM_PREFERRED_WIDTH_PX = 1200;
const CONSTRAINED_OVERLAY_VARIANTS: Variants = {
	closed: {
		transform: "translateX(100%)",
		transition: { duration: 0.2, ease: [0.6, 0, 0.8, 0.6] },
	},
	open: {
		transform: "translateX(0%)",
		transition: { duration: 0.25, ease: [0, 0.4, 0, 1] },
	},
};
const STATIC_WORKSPACE_VARIANTS: Variants = {
	closed: { transform: "translateX(0%)", transition: { duration: 0 } },
	open: { transform: "translateX(0%)", transition: { duration: 0 } },
};

type JiraForYouWorkspaceMode =
	| { kind: "feed" }
	| { itemId: string; kind: "assigned-chat" }
	| { itemId: string; kind: "unassigned-agent-session" };

interface JiraForYouWorkspaceViewState {
	isDetailPanelOpen: boolean;
	mode: JiraForYouWorkspaceMode;
}

type JiraForYouWorkspaceViewAction =
	| { type: "close" }
	| { type: "open-assigned"; itemId: string; detailPanelOpen: boolean }
	| { type: "open-unassigned"; itemId: string }
	| { type: "set-detail-panel"; open: boolean }
	| { type: "toggle-detail-panel" };

function reduceWorkspaceView(
	state: JiraForYouWorkspaceViewState,
	action: JiraForYouWorkspaceViewAction,
): JiraForYouWorkspaceViewState {
	switch (action.type) {
		case "close":
			return { isDetailPanelOpen: false, mode: { kind: "feed" } };
		case "open-assigned":
			return {
				isDetailPanelOpen: action.detailPanelOpen,
				mode: { itemId: action.itemId, kind: "assigned-chat" },
			};
		case "open-unassigned":
			return {
				isDetailPanelOpen: false,
				mode: { itemId: action.itemId, kind: "unassigned-agent-session" },
			};
		case "set-detail-panel":
			return { ...state, isDetailPanelOpen: action.open };
		case "toggle-detail-panel":
			return { ...state, isDetailPanelOpen: !state.isDetailPanelOpen };
		default:
			return state;
	}
}

function getWorkspaceModeItemId(mode: JiraForYouWorkspaceMode): string | null {
	switch (mode.kind) {
		case "feed":
			return null;
		case "assigned-chat":
		case "unassigned-agent-session":
			return mode.itemId;
		default: {
			const exhaustiveMode: never = mode;
			return exhaustiveMode;
		}
	}
}

export interface JiraForYouWorkspaceProps {
	className?: string;
	chrome?: "framed" | "plain";
	onItemClick?: (item: JiraForYouItem) => void;
	sections?: readonly JiraForYouSection[];
	tabs?: readonly JiraForYouTab[];
}

export function JiraForYouWorkspace({
	className,
	chrome = "framed",
	onItemClick,
	sections = JIRA_FOR_YOU_SECTIONS,
	tabs = JIRA_FOR_YOU_TABS,
}: Readonly<JiraForYouWorkspaceProps>) {
	const [workspaceNode, setWorkspaceNode] = useState<HTMLDivElement | null>(null);
	const [workspaceWidth, setWorkspaceWidth] = useState(0);
	const isNarrow = workspaceWidth > 0 && workspaceWidth < NARROW_LAYOUT_BREAKPOINT_PX;
	const shouldReduceMotion = useReducedMotion();
	const workspaceVariants =
		isNarrow && !shouldReduceMotion
			? CONSTRAINED_OVERLAY_VARIANTS
			: STATIC_WORKSPACE_VARIANTS;
	const workspaceData = useMemo(
		() => createJiraForYouWorkspaceData(sections),
		[sections],
	);
	const [{ isDetailPanelOpen, mode }, dispatchView] = useReducer(
		reduceWorkspaceView,
		{ isDetailPanelOpen: false, mode: { kind: "feed" } },
	);
	const requestedItemId = getWorkspaceModeItemId(mode);
	if (requestedItemId && !workspaceData.itemsById[requestedItemId]) {
		dispatchView({ type: "close" });
	}
	const [restoringViewButtonItemId, setRestoringViewButtonItemId] = useState<string | null>(null);
	const [selectedAgentByItemId, setSelectedAgentByItemId] = useState<
		Record<string, string>
	>({});
	const [localMessagesBySessionKey, setLocalMessagesBySessionKey] = useState<
		Record<string, RovoUIMessage[]>
	>({});
	const handleDetailPanelCollapse = useCallback(() => {
		dispatchView({ type: "set-detail-panel", open: false });
	}, []);
	const detailPanelResize = useSidebarResize({
		defaultWidth: DETAIL_PANEL_DEFAULT_WIDTH_PX,
		direction: "rtl",
		maxWidth: DETAIL_PANEL_MAX_WIDTH_PX,
		minWidth: DETAIL_PANEL_MIN_WIDTH_PX,
		onCollapse: handleDetailPanelCollapse,
	});
	const rowButtonRefs = useRef(new Map<string, HTMLButtonElement>());
	const viewButtonRefs = useRef(new Map<string, HTMLButtonElement>());
	const focusRestoreControlRef = useRef<"row" | "view">("view");
	const focusRestoreItemIdRef = useRef<string | null>(null);
	const pendingFocusRestoreItemIdRef = useRef<string | null>(null);

	useEffect(() => {
		if (!workspaceNode) {
			return;
		}

		const updateWorkspaceWidth = () => {
			setWorkspaceWidth(workspaceNode.getBoundingClientRect().width);
		};

		updateWorkspaceWidth();

		const resizeObserver = new ResizeObserver((entries) => {
			const nextWidth = entries[0]?.contentRect.width;
			setWorkspaceWidth(nextWidth ?? workspaceNode.getBoundingClientRect().width);
		});

		resizeObserver.observe(workspaceNode);
		return () => resizeObserver.disconnect();
	}, [workspaceNode]);

	const activeItemId = getWorkspaceModeItemId(mode);
	const activeItemData = activeItemId
		? workspaceData.itemsById[activeItemId] ?? null
		: null;
	const assignedItemData = activeItemData?.kind === "assigned"
		? activeItemData
		: null;
	const unassignedItemData = activeItemData?.kind === "unassigned"
		? activeItemData
		: null;
	const selectedAgentId = assignedItemData
		? selectedAgentByItemId[assignedItemData.item.id] ?? assignedItemData.defaultAgentId
		: null;
	const selectedAgentSession = assignedItemData?.agentSessions.find(
		(agentSession) => agentSession.id === selectedAgentId,
	) ?? assignedItemData?.agentSessions[0] ?? null;
	const wideChatWorkspaceStyle = !isNarrow
		? {
			flexBasis:
				WIDE_CONVERSATION_PREFERRED_WIDTH_PX +
				(isDetailPanelOpen ? detailPanelResize.sidebarWidth : 0),
			maxWidth: `calc(100% - ${WIDE_FEED_MIN_WIDTH_PX}px)`,
		}
		: undefined;
	const wideJiraWorkItemWorkspaceStyle = !isNarrow
		? {
			flexBasis: WIDE_JIRA_WORK_ITEM_PREFERRED_WIDTH_PX,
			maxWidth: `calc(100% - ${WIDE_FEED_MIN_WIDTH_PX}px)`,
		}
		: undefined;
	const sessionKey = assignedItemData && selectedAgentSession
		? `${assignedItemData.item.id}:${selectedAgentSession.id}`
		: null;
	const uiMessages = selectedAgentSession && sessionKey
		? [
			...selectedAgentSession.messages,
			...(localMessagesBySessionKey[sessionKey] ?? []),
		]
		: [];

	useEffect(() => {
		if (activeItemId !== null) {
			return;
		}

		const itemId = pendingFocusRestoreItemIdRef.current;
		if (!itemId) {
			return;
		}

		let frameId = 0;
		let attempts = 0;

		const focusWhenReady = () => {
			const button = focusRestoreControlRef.current === "row"
				? rowButtonRefs.current.get(itemId)
				: viewButtonRefs.current.get(itemId);
			if (button) {
				button.focus();
				pendingFocusRestoreItemIdRef.current = null;
				setRestoringViewButtonItemId(null);
				return;
			}

			if (attempts >= 5) {
				setRestoringViewButtonItemId(null);
				return;
			}

			attempts += 1;
			frameId = window.requestAnimationFrame(focusWhenReady);
		};

		frameId = window.requestAnimationFrame(focusWhenReady);
		return () => window.cancelAnimationFrame(frameId);
	}, [activeItemId]);

	const handleCloseWorkspace = useCallback(() => {
		pendingFocusRestoreItemIdRef.current = focusRestoreItemIdRef.current;
		setRestoringViewButtonItemId(
			focusRestoreControlRef.current === "view"
				? focusRestoreItemIdRef.current
				: null,
		);
		dispatchView({ type: "close" });
	}, []);

	const handleItemActivate = useCallback((
		item: JiraForYouItem,
		origin: "row" | "view",
	) => {
		focusRestoreItemIdRef.current = item.id;
		focusRestoreControlRef.current = origin;
		setRestoringViewButtonItemId(null);
		onItemClick?.(item);

		const itemData = workspaceData.itemsById[item.id];
		if (!itemData) {
			return;
		}

		switch (itemData.kind) {
			case "unassigned":
				dispatchView({ type: "open-unassigned", itemId: item.id });
				return;
			case "assigned":
				dispatchView({
					type: "open-assigned",
					itemId: item.id,
					detailPanelOpen: !isNarrow,
				});
				break;
			default: {
				const exhaustiveItemData: never = itemData;
				return exhaustiveItemData;
			}
		}

		setSelectedAgentByItemId((current) => {
			if (current[item.id]) {
				return current;
			}

			return {
				...current,
				[item.id]: itemData.defaultAgentId,
			};
		});
	}, [isNarrow, onItemClick, workspaceData.itemsById]);

	const handleAgentSelect = useCallback((agentId: string) => {
		if (!assignedItemData) {
			return;
		}

		setSelectedAgentByItemId((current) => ({
			...current,
			[assignedItemData.item.id]: agentId,
		}));
	}, [assignedItemData]);

	const handleSubmit = useCallback(async ({ files, text }: { files: FileUIPart[]; text: string }) => {
		const trimmedText = text.trim();
		if (!sessionKey || (!trimmedText && files.length === 0)) {
			return;
		}

		const message = createRovoAppUserMessage({
			createdAt: new Date().toISOString(),
			files,
			id: createId("jira-for-you-user"),
			text: trimmedText,
		});
		setLocalMessagesBySessionKey((current) => ({
			...current,
			[sessionKey]: [...(current[sessionKey] ?? []), message],
		}));
	}, [sessionKey]);

	return (
		<div
			className={cn(
				"relative flex h-full min-h-0 w-full overflow-hidden bg-surface",
				chrome === "framed" ? "rounded-lg border border-border" : "rounded-[inherit]",
				className,
			)}
			data-testid="jira-for-you-workspace"
			ref={setWorkspaceNode}
		>
			<section
				aria-hidden={activeItemData && isNarrow ? true : undefined}
				className={cn(
					"min-h-0 overflow-y-auto",
					activeItemData && !isNarrow
						? "min-w-[420px] flex-1 border-r border-border"
						: "w-full flex-1",
				)}
				data-testid="jira-for-you-feed"
				inert={activeItemData && isNarrow ? true : undefined}
			>
				<div
					className={cn(
						// pb-only keeps the For You header flush at the column top on one
						// line so its 56px band aligns with the chat/detail headers. When
						// the tabs wrap (@max-[28rem]) the header re-adds a top gap via
						// --feed-stack-top, matching the responsive horizontal padding.
						"w-full px-4 pb-4 md:px-5 md:pb-5 [--feed-stack-top:1rem] md:[--feed-stack-top:1.25rem]",
						activeItemData && !isNarrow ? undefined : "mx-auto max-w-3xl",
					)}
				>
					<JiraForYou
						forcedVisibleViewItemId={restoringViewButtonItemId ?? undefined}
						onItemButtonRef={(item, node) => {
							if (node) {
								rowButtonRefs.current.set(item.id, node);
								return;
							}

							rowButtonRefs.current.delete(item.id);
						}}
						onItemClick={(item) => handleItemActivate(item, "row")}
						onView={(item) => handleItemActivate(item, "view")}
						onViewButtonRef={(item, node) => {
							if (node) {
								viewButtonRefs.current.set(item.id, node);
								return;
							}

							viewButtonRefs.current.delete(item.id);
						}}
						selectedItemId={activeItemId ?? undefined}
						sections={sections}
						tabs={tabs}
					/>
				</div>
			</section>

			<AnimatePresence initial={false}>
				{mode.kind === "assigned-chat" &&
				assignedItemData &&
				selectedAgentSession ? (
					<motion.section
						animate="open"
						aria-label={`Chat workspace for ${assignedItemData.item.issueKey}`}
						className={cn(
							"min-h-0 min-w-0 bg-background",
							isNarrow
								? "absolute inset-0 z-10"
								: "relative flex shrink",
						)}
						data-layout={isNarrow ? "overlay" : "split"}
						data-testid="jira-for-you-chat-workspace"
						exit="closed"
						initial="closed"
						style={{
							...wideChatWorkspaceStyle,
							willChange: isNarrow && !shouldReduceMotion ? "transform" : undefined,
						}}
						variants={workspaceVariants}
					>
					<JiraForYouConversation
						detailPanelInsetPx={
							isDetailPanelOpen && !isNarrow
								? detailPanelResize.sidebarWidth
								: 0
						}
						isDetailPanelOpen={isDetailPanelOpen}
						item={assignedItemData.item}
						onBack={handleCloseWorkspace}
						onDetailPanelToggle={() => dispatchView({ type: "toggle-detail-panel" })}
						onSubmit={handleSubmit}
						selectedAgentSession={selectedAgentSession}
						uiMessages={uiMessages}
					/>
					<AnimatePresence initial={false}>
						{isDetailPanelOpen ? (
							<JiraForYouDetailPanel
								agentSessions={assignedItemData.agentSessions}
								details={assignedItemData.details}
								isNarrow={isNarrow}
								item={assignedItemData.item}
								onAgentSelect={handleAgentSelect}
								onClose={() => dispatchView({ type: "set-detail-panel", open: false })}
								resize={detailPanelResize}
								selectedAgentId={selectedAgentSession.id}
							/>
						) : null}
					</AnimatePresence>
					</motion.section>
				) : null}
				{mode.kind === "unassigned-agent-session" &&
				unassignedItemData ? (
					<motion.section
						animate="open"
						aria-label={`Jira Work Item workspace for ${unassignedItemData.item.issueKey}`}
						className={cn(
							"min-h-0 min-w-0 bg-background",
							isNarrow
								? "absolute inset-0 z-10"
								: "relative flex shrink",
						)}
						data-layout={isNarrow ? "overlay" : "split"}
						data-testid="jira-for-you-work-item-container"
						exit="closed"
						initial="closed"
						style={{
							...wideJiraWorkItemWorkspaceStyle,
							willChange: isNarrow && !shouldReduceMotion ? "transform" : undefined,
						}}
						variants={workspaceVariants}
					>
						<JiraForYouWorkItemWorkspace
							onBack={handleCloseWorkspace}
							workItem={unassignedItemData.workItem}
						/>
					</motion.section>
				) : null}
			</AnimatePresence>
		</div>
	);
}
