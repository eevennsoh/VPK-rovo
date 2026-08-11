import type { ChangedFile, CodeReviewCommit } from "../data/types";

export type FixedChangesScope =
	| "all-changes"
	| "uncommitted"
	| "staged"
	| "unstaged"
	| "all-commits";
export type ChangesScope = FixedChangesScope | `commit:${string}`;

export function isFixedChangesScope(scope: ChangesScope): scope is FixedChangesScope {
	return !scope.startsWith("commit:");
}

export function canApplyChangesScope(
	scope: ChangesScope,
	commits: readonly CodeReviewCommit[],
): boolean {
	if (scope === "all-changes") return true;
	if (isFixedChangesScope(scope)) {
		// Staging / uncommitted partitions need file-level git status we do not
		// model yet, so keep these menu rows disabled until that data lands.
		return false;
	}
	const commitId = scope.slice("commit:".length);
	const commit = commits.find((entry) => entry.id === commitId);
	return Boolean(commit?.fileIds && commit.fileIds.length > 0);
}

export function filterChangedFilesByScope(
	files: readonly ChangedFile[],
	commits: readonly CodeReviewCommit[],
	scope: ChangesScope,
): readonly ChangedFile[] {
	if (!canApplyChangesScope(scope, commits) || scope === "all-changes") {
		return files;
	}
	const commitId = scope.slice("commit:".length);
	const commit = commits.find((entry) => entry.id === commitId);
	const fileIds = new Set(commit?.fileIds ?? []);
	return files.filter((file) => fileIds.has(file.id));
}
