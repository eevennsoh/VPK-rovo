import type { PullRequestFixProps } from "@/components/blocks/pull-request-fix/components/pull-request-fix-types";

/**
 * Mirrors the failing-check state a reviewer reaches when staging a CI fix:
 * the check name in the badge, ready to pick a coding agent.
 */
export const DEMO_PULL_REQUEST_FIX: Pick<
	PullRequestFixProps,
	"checkName" | "placeholder" | "title"
> = {
	title: "Fix",
	checkName: "Lint and typecheck",
	placeholder: "write your instruction...",
};
