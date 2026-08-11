export type DiffLayout = "unified" | "split";
export type FileChangeStatus = "added" | "modified" | "deleted";

export interface CodeReviewWorkItem {
	key: string;
	title: string;
	environment: string;
	repoName: string;
	localBranchName: string;
	branchName: string;
}

export interface ChangedFile {
	id: string;
	path: string;
	status: FileChangeStatus;
	language: string;
	oldContents: string;
	newContents: string;
	additions: number;
	deletions: number;
	defaultExpanded: boolean;
	explorerPath?: string;
	hunkHeader?: string;
	inExplorer?: boolean;
}

/** Slim commit row for the changes-picker Commits submenu (matches PR rail shape). */
export interface CodeReviewCommit {
	id: string;
	shortSha: string;
	title: string;
	additions: number;
	deletions: number;
	/** When set, selecting this commit filters the editor to these file ids. */
	fileIds?: readonly string[];
}

export interface ExplorerNode {
	id: string;
	name: string;
	kind: "folder" | "file";
	children?: readonly ExplorerNode[];
	fileId?: string;
}
