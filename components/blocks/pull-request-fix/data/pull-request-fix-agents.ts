import type { PullRequestFixAgentId } from "@/components/blocks/pull-request-fix/components/pull-request-fix-types";

/**
 * Coding agents available from the fix composer dropdown. Labels and ids live
 * here so the picker module exports only a component (Fast Refresh).
 */
export const PULL_REQUEST_FIX_AGENTS: ReadonlyArray<{
	id: PullRequestFixAgentId;
	label: string;
}> = [
	{ id: "claude-code", label: "Claude" },
	{ id: "codex", label: "Codex" },
	{ id: "cursor", label: "Cursor" },
	{ id: "gemini", label: "Gemini" },
	{ id: "github-copilot", label: "GitHub Copilot" },
	{ id: "rovo-cli", label: "Rovo" },
];

export const DEFAULT_PULL_REQUEST_FIX_AGENT_ID: PullRequestFixAgentId =
	"codex";
