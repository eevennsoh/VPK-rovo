import type { AtlassianLogoName } from "@/components/ui/logo";

import toolsData from "./tools.json";
import type { DirectoryVisual } from "./types";
import { avatarVisualFromSrc } from "./visual";

/** Stable category ids, shared with the other directory verticals. */
export type ToolCategory =
	| "project-management"
	| "administrative-tools"
	| "content-and-communication"
	| "data-and-analytics"
	| "software-development"
	| "it-support-and-service"
	| "design-and-diagramming"
	| "security-and-compliance"
	| "hr-and-team-building"
	| "sales-and-customer-relations";

/**
 * A single read-only / write-delete permission row shown in a tool's detail
 * view. Mirrors the component-layer `ToolsDirectoryPermission` so the data can
 * be authored here without importing the UI module.
 */
export interface ToolsDirectoryPermission {
	id: string;
	name: string;
	description: string;
	enabled?: boolean;
	disabled?: boolean;
}

/**
 * Data-shape mirror of the component-layer `ToolsDirectoryTool` (which extends
 * `AgentBrowserAgent`). Owned here so JSON data and loaders never depend on the
 * UI module. The directory UI relies on `avatarSrc`/`logoName` to render the
 * brand mark, so both are preserved verbatim.
 */
export interface ToolsDirectoryTool {
	id: string;
	name: string;
	byline: string;
	attributionKind?: "company" | "team" | "person";
	avatarSrc?: string;
	/** When set, renders the ADS brand logo instead of an `avatarSrc` image. */
	logoName?: AtlassianLogoName;
	description?: string;
	favorite?: boolean;
	categoryId?: string;
	lastUpdatedLabel?: string;
	logoSrc?: string;
	publisherName?: string;
	readOnlyTools?: readonly ToolsDirectoryPermission[];
	teammateCount?: number;
	toolCount?: number;
	verified?: boolean;
	writeDeleteTools?: readonly ToolsDirectoryPermission[];
}

/**
 * The tools directory catalog is sourced from `tools.json` as the single source
 * of truth. The JSON uses a two-array shape — `{ tools, sessionTools }` — so the
 * always-available company/team tools stay distinguishable from the
 * session-scoped tools without a per-item flag. We assert the types here so
 * callers get full typing without re-declaring the data inline.
 */
interface ToolsData {
	tools: readonly ToolsDirectoryTool[];
	sessionTools: readonly ToolsDirectoryTool[];
}

const data = toolsData as ToolsData;

/** Always-available tools shown in the directory list. */
export const DEMO_TOOLS: readonly ToolsDirectoryTool[] = data.tools;

/** Session-scoped tools (team-published) appended to the directory list. */
export const DEMO_SESSION_TOOLS: readonly ToolsDirectoryTool[] = data.sessionTools;

/**
 * Derives the JSON-serializable mention-token visual for a tool: a `logoName`
 * resolves to the ADS brand mark; an `avatarSrc` under `/avatar-agent/` is a
 * hexagon agent avatar, otherwise a square image. Shares one resolver with
 * agents (see {@link avatarVisualFromSrc}) so the two never diverge.
 */
export function getToolDirectoryVisual(tool: ToolsDirectoryTool): DirectoryVisual | undefined {
	return avatarVisualFromSrc(tool.logoName, tool.avatarSrc);
}

/** Convenience lookup across both tool groups. */
export function getToolById(id: string): ToolsDirectoryTool | undefined {
	return DEMO_TOOLS.find((tool) => tool.id === id) ?? DEMO_SESSION_TOOLS.find((tool) => tool.id === id);
}
