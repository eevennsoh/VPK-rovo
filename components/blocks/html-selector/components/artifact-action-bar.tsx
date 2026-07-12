"use client";

import { useCallback } from "react";
import type { RefObject } from "react";
import DownloadIcon from "@atlaskit/icon/core/download";
import PrinterIcon from "@atlaskit/icon/core/printer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
	getHtmlDownloadFileName,
	getJsonErrorMessage,
	getVpkHtmlArtifactApiPath,
} from "@/components/blocks/html-selector/lib/artifact-actions";
import { useArtifactNotes } from "../hooks/use-artifact-notes";
import type { AgentId, HtmlSelectorNotification } from "../lib/types";
import { ArtifactNotesPopover } from "./artifact-notes-popover";
import { ArtifactPublishDialog } from "./artifact-publish-dialog";
import { ArtifactVideoDialog } from "./artifact-video-dialog";

interface ArtifactActionBarProps {
	agent: AgentId;
	className?: string;
	iframeRef: RefObject<HTMLIFrameElement | null>;
	onNotify: (notification: HtmlSelectorNotification) => void;
	pagePath: string;
	repoRoot?: string;
}

async function getAssetErrorMessage(response: Response): Promise<string> {
	try {
		const payload = await response.json() as { error?: unknown; details?: unknown };
		return getJsonErrorMessage(payload, "Failed to download artifact.");
	} catch {
		return "Failed to download artifact.";
	}
}

export function ArtifactActionBar({
	agent,
	className,
	iframeRef,
	onNotify,
	pagePath,
	repoRoot,
}: Readonly<ArtifactActionBarProps>) {
	const isArtifactPage = pagePath !== "srcdoc";
	const notesState = useArtifactNotes(pagePath, onNotify);

	const handlePrint = useCallback(() => {
		try {
			const frameWindow = iframeRef.current?.contentWindow;
			if (!frameWindow) {
				onNotify({ type: "error", message: "Artifact frame is not ready." });
				return;
			}
			frameWindow.focus();
			frameWindow.print();
		} catch (error) {
			onNotify({ type: "error", message: error instanceof Error ? error.message : String(error) });
		}
	}, [iframeRef, onNotify]);

	const handleDownload = useCallback(async () => {
		if (!isArtifactPage) {
			onNotify({ type: "error", message: "Download is available for saved vpk-html artifacts." });
			return;
		}

		try {
			const response = await fetch(getVpkHtmlArtifactApiPath(pagePath), { cache: "no-store" });
			if (!response.ok) {
				throw new Error(await getAssetErrorMessage(response));
			}
			const blob = await response.blob();
			const url = URL.createObjectURL(blob);
			const anchor = document.createElement("a");
			anchor.href = url;
			anchor.download = getHtmlDownloadFileName(pagePath);
			document.body.append(anchor);
			anchor.click();
			anchor.remove();
			URL.revokeObjectURL(url);
			onNotify({ type: "success", message: "Downloaded artifact HTML." });
		} catch (error) {
			onNotify({ type: "error", message: error instanceof Error ? error.message : String(error) });
		}
	}, [isArtifactPage, onNotify, pagePath]);

	return (
		<div
			className={cn(
				"pointer-events-none absolute top-3 right-3 z-[150] flex max-w-[calc(100%-1.5rem)] justify-end",
				className,
			)}
		>
			<div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1 rounded-lg border border-border bg-surface-raised p-1 shadow-lg">
				<Button type="button" variant="ghost" size="compact" onClick={handlePrint} title="Print or save as PDF">
					<PrinterIcon label="" />
					<span>Print / PDF</span>
				</Button>
				<Button
					type="button"
					variant="ghost"
					size="compact"
					onClick={() => {
						void handleDownload();
					}}
					disabled={!isArtifactPage}
					title={isArtifactPage ? "Download current HTML" : "Download is available for saved vpk-html artifacts."}
				>
					<DownloadIcon label="" />
					<span>Download HTML</span>
				</Button>
				<ArtifactNotesPopover
					disabled={!isArtifactPage}
					error={notesState.error}
					isDirty={notesState.isDirty}
					loadNotes={notesState.loadNotes}
					notes={notesState.notes}
					saveNotes={notesState.saveNotes}
					setNotes={notesState.setNotes}
					status={notesState.status}
				/>
				<ArtifactVideoDialog
					agent={agent}
					disabled={!isArtifactPage}
					loadNotes={notesState.loadNotes}
					notes={notesState.notes}
					onNotify={onNotify}
					pagePath={pagePath}
					repoRoot={repoRoot}
				/>
				<ArtifactPublishDialog
					disabled={!isArtifactPage}
					onNotify={onNotify}
					pagePath={pagePath}
				/>
			</div>
		</div>
	);
}
