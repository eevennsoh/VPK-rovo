"use client";

import { useState } from "react";

import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

import { CHANGE_SETS } from "../data/change-sets";
import { ALL_CHANGES_SUMMARY, CHANGED_FILES, EDITOR_FILE } from "../data/changed-files";
import { CHAT_SCRIPT } from "../data/chat-script";
import { CODE_REVIEW_WORK_ITEM } from "../data/work-item";
import type {
	ChangedFile,
	ChangeSet,
	ChatScript,
	CodeReviewWorkItem,
	DiffLayout,
} from "../data/types";
import { computeChangesSummary, filterByChangeSet, filterBySearch } from "../lib/filter-files";
import { ChatPanel } from "./chat/chat-panel";
import { CodeReviewTopBar } from "./code-review-top-bar";
import { EditorPanel } from "./editor/editor-panel";
import { SummaryPanel } from "./summary/summary-panel";

export interface CodeReviewProps {
	workItem?: CodeReviewWorkItem;
	files?: readonly ChangedFile[];
	changeSets?: readonly ChangeSet[];
	chatScript?: ChatScript;
	defaultScreen?: "summary" | "editor";
	className?: string;
}

export function CodeReview({
	workItem = CODE_REVIEW_WORK_ITEM,
	files = CHANGED_FILES,
	changeSets = CHANGE_SETS,
	chatScript = CHAT_SCRIPT,
	defaultScreen,
	className,
}: Readonly<CodeReviewProps>) {
	const isDefaultFileSet = files === CHANGED_FILES;
	// The bundled EDITOR_FILE ("ipc.mp.test.ts") is a fixture-only demo tab, distinct
	// from the default CHANGED_FILES set; custom `files` drive the editor entirely on their own.
	const editorFiles = isDefaultFileSet ? [...files, EDITOR_FILE] : files;
	const [screen, setScreen] = useState<"summary" | "editor">(defaultScreen ?? "summary");
	const [summaryLayout, setSummaryLayout] = useState<DiffLayout>("unified");
	const [editorLayout, setEditorLayout] = useState<DiffLayout>("split");
	const [selectedChangeSetId, setSelectedChangeSetId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");
	const [editorFileId, setEditorFileId] = useState(
		() => (editorFiles.find((file) => file.inExplorer) ?? editorFiles[0])?.id ?? EDITOR_FILE.id,
	);
	const selectedSet = changeSets.find((set) => set.id === selectedChangeSetId) ?? null;
	const visibleFiles = filterBySearch(filterByChangeSet(files, selectedSet), searchQuery);
	const selectedEditorFile =
		editorFiles.find((file) => file.id === editorFileId) ?? editorFiles[0] ?? EDITOR_FILE;
	const changesSummary = isDefaultFileSet ? ALL_CHANGES_SUMMARY : computeChangesSummary(files);

	return (
		<div className={cn("flex h-full min-h-0 flex-col bg-surface text-text", className)}>
			<CodeReviewTopBar workItem={workItem} screen={screen} onScreenChange={setScreen} />
			<div className="flex min-h-0 flex-1 gap-4 px-4 pb-4">
				<div
					className="min-w-0 flex-1 overflow-hidden rounded-lg border border-border bg-surface-raised"
					style={{ boxShadow: token("elevation.shadow.raised") }}
				>
					{screen === "summary" ? (
						<SummaryPanel
							changesSummary={changesSummary}
							changeSets={changeSets}
							files={visibleFiles}
							layout={summaryLayout}
							onLayoutChange={setSummaryLayout}
							onScreenChange={setScreen}
							onSearchQueryChange={setSearchQuery}
							onSelectedChangeSetIdChange={setSelectedChangeSetId}
							searchQuery={searchQuery}
							selectedChangeSetId={selectedChangeSetId}
							workItem={workItem}
						/>
					) : (
						<EditorPanel
							file={selectedEditorFile}
							layout={editorLayout}
							onFileSelect={setEditorFileId}
							onLayoutChange={setEditorLayout}
							onScreenChange={setScreen}
							selectedFileId={editorFileId}
							workItem={workItem}
						/>
					)}
				</div>
				<ChatPanel script={chatScript} />
			</div>
		</div>
	);
}
