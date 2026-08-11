import type { ChangedFile } from "../data/types";

export function sumChangedFileDiffStats(files: readonly ChangedFile[]) {
	return files.reduce(
		(totals, file) => ({
			additions: totals.additions + file.additions,
			deletions: totals.deletions + file.deletions,
		}),
		{ additions: 0, deletions: 0 },
	);
}
