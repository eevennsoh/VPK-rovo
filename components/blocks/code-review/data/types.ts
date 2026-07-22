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
	hunkHeader?: string;
	inExplorer?: boolean;
}

export interface ExplorerNode {
	id: string;
	name: string;
	kind: "folder" | "file";
	children?: readonly ExplorerNode[];
	fileId?: string;
}
