import type { AgentSessionItem } from "./agent-session-types";

/**
 * Host port for untracked-work triage.
 *
 * `locateTarget` is the only lookup. `attach` consumes that value so a second
 * `hasWorkItem` then re-resolve path cannot exist.
 */
export interface UntrackedWorkTriage<T = unknown> {
	locateTarget(session: AgentSessionItem, workItemKey: string): T | undefined;
	attach(session: AgentSessionItem, target: T): void;
	createFrom(session: AgentSessionItem): void;
	archive(session: AgentSessionItem): void;
}
