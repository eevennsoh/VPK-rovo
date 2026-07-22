import type { ChangeSet } from "./types";

export const CHANGE_SETS: readonly ChangeSet[] = [
	{
		id: "unified-middleware",
		title: "Create a unified middleware layer for request parsing, validation, and normalization",
		fileLabel: "UserProfileDialog.ts:12-18",
		fileIds: ["user-profile-dialog"],
		additions: 7,
		deletions: 2,
	},
	{
		id: "error-handling",
		title: "Standardize error handling and API response shape",
		fileLabel: "2 files",
		fileIds: ["photo-uploader", "user-menu"],
		additions: 16,
		deletions: 6,
	},
	{
		id: "request-logging",
		title: "Add request-level logging hooks for later performance measurement",
		fileLabel: "3 files",
		fileIds: ["photo-uploader", "user-menu", "user-profile-dialog"],
		additions: 8,
		deletions: 3,
	},
];
