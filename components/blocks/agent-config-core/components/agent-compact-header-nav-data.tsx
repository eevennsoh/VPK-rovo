import ChartTrendUpIcon from "@atlaskit/icon/core/chart-trend-up";
import LockLockedIcon from "@atlaskit/icon/core/lock-locked";
import PersonIcon from "@atlaskit/icon/core/person";
import ScorecardIcon from "@atlaskit/icon/core/scorecard";
import ViewsIcon from "@atlaskit/icon-lab/core/views";

import { LayoutDashboardIcon } from "@/components/ui/vpk-icons";

const AGENT_COMPACT_HEADER_NAV_ITEMS = [
	{ icon: <LayoutDashboardIcon size="small" />, label: "Details", value: "details" },
	{ icon: <ChartTrendUpIcon label="" size="small" color="currentColor" />, label: "Insights", value: "insights" },
	{ icon: <ViewsIcon label="" size="small" color="currentColor" />, label: "Surfaces", value: "surfaces" },
	{ icon: <ScorecardIcon label="" size="small" color="currentColor" />, label: "Evaluation", value: "evaluation" },
	{ icon: <PersonIcon label="" size="small" color="currentColor" />, label: "Users", value: "users" },
	{ icon: <LockLockedIcon label="" size="small" color="currentColor" />, label: "Access", value: "access" },
] as const;

export type AgentCompactHeaderSection = (typeof AGENT_COMPACT_HEADER_NAV_ITEMS)[number]["value"];
export type AgentCompactHeaderNavItem = (typeof AGENT_COMPACT_HEADER_NAV_ITEMS)[number];

export const AGENT_COMPACT_HEADER_DEFAULT_NAV_ITEMS = AGENT_COMPACT_HEADER_NAV_ITEMS.filter((item) => item.value !== "details");
export const AGENT_COMPACT_HEADER_DETAILS_NAV_ITEM = AGENT_COMPACT_HEADER_NAV_ITEMS[0];
