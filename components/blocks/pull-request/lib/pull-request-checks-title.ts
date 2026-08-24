import type { PullRequestCheck } from "@/components/blocks/pull-request/components/pull-request-checks-list";

export function pullRequestChecksTitleState(checks: readonly PullRequestCheck[]) {
	const passed = checks.filter((check) => check.status === "passed").length;
	return {
		inProgress: checks.some((check) => check.status === "running" || check.status === "queued"),
		passed,
		total: checks.length,
	};
}
