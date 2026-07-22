"use client";

import type { ChangedFile, DiffLayout } from "../../data/types";
import { EditorDiff } from "./editor-diff";
import { EditorExplorer } from "./editor-explorer";

interface EditorPanelProps {
	file: ChangedFile;
	layout: DiffLayout;
	selectedFileId: string;
	onFileSelect: (fileId: string) => void;
	onLayoutChange: (layout: DiffLayout) => void;
}

export function EditorPanel({
	file,
	layout,
	selectedFileId,
	onFileSelect,
	onLayoutChange,
}: Readonly<EditorPanelProps>) {
	return (
		<section className="grid size-full min-h-0 grid-cols-[240px_minmax(0,1fr)]">
			<EditorExplorer onFileSelect={onFileSelect} selectedFileId={selectedFileId} />
			<EditorDiff file={file} layout={layout} onLayoutChange={onLayoutChange} />
		</section>
	);
}
