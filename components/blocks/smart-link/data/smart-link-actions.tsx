"use client";

import GrowDiagonalIcon from "@atlaskit/icon/core/grow-diagonal";
import LinkIcon from "@atlaskit/icon/core/link";
import PanelRightIcon from "@atlaskit/icon/core/panel-right";

import type { SmartLinkAction } from "@/components/blocks/smart-link/components/smart-link";

// Reusable smart-link flyout action presets. Both the demo showcase and the
// production surfaces (Jira queue work item + sources) render these so the hover
// card's "flyout menu" is identical everywhere and cannot drift.

/** "Copy link" — the action every smart link exposes. */
export const SMART_LINK_COPY_ACTION = {
	id: "copy-link",
	label: "Copy link",
	icon: <LinkIcon label="" size="medium" />,
} satisfies SmartLinkAction;

/** Preview + copy actions for references that open in a modal (issues, pages, videos). */
export const SMART_LINK_MODAL_ACTIONS = [
	{
		id: "open-preview",
		label: "Open preview modal",
		icon: <GrowDiagonalIcon label="" size="medium" />,
	},
	SMART_LINK_COPY_ACTION,
] satisfies readonly SmartLinkAction[];

/** Preview + copy actions for references that open in a side panel (teams, goals). */
export const SMART_LINK_PANEL_ACTIONS = [
	{
		id: "open-panel",
		label: "Open preview panel",
		icon: <PanelRightIcon label="" size="medium" />,
	},
	SMART_LINK_COPY_ACTION,
] satisfies readonly SmartLinkAction[];
