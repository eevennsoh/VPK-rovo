export type DiffLayout = "unified" | "split";
export type FileChangeStatus = "added" | "modified" | "deleted";

export interface CodeReviewWorkItem {
	key: string;
	title: string;
	environment: string;
	repoName: string;
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

export interface ChangeSet {
	id: string;
	title: string;
	fileLabel: string;
	fileIds: readonly string[];
	additions: number;
	deletions: number;
}

export interface ChangesSummary {
	fileCount: number;
	additions: number;
	deletions: number;
}

export interface ExplorerNode {
	id: string;
	name: string;
	kind: "folder" | "file";
	children?: readonly ExplorerNode[];
	fileId?: string;
}

export interface ChatScript {
	agentName: string;
	intro: string;
	thinkingLabel: string;
	thinkingCount: number;
	thinkingSteps: readonly string[];
	summaryMarkdown: string;
	ctaLabel: string;
	composerPlaceholder: string;
	footerNote: string;
}
