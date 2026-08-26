"use client";

import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import type { VideoArtifact } from "../data/sample-videos";
import { VideoPlayer } from "./video-player";

interface VideoPreviewDialogProps {
	/**
	 * Video to show. Stays populated for the duration of the close animation so
	 * the popup does not collapse to an empty shell mid-fade; the owner clears
	 * it from `onClosed`.
	 */
	video: VideoArtifact | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Fired once the close animation has finished and the player can unmount. */
	onClosed: () => void;
}

export function VideoPreviewDialog({
	video,
	open,
	onOpenChange,
	onClosed,
}: Readonly<VideoPreviewDialogProps>) {
	return (
		<Dialog
			open={open}
			onOpenChange={onOpenChange}
			// Base UI fires this after the exit transition settles — and
			// immediately when there is none, so reduced-motion users still get
			// the unmount that stops playback.
			onOpenChangeComplete={(isOpen) => {
				if (!isOpen) onClosed();
			}}
		>
			<DialogContent
				className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-4xl [grid-template-rows:auto_minmax(0,1fr)]"
				size="xl"
			>
				<DialogHeader className="px-4 py-4 sm:px-6">
					<DialogTitle className="pr-10">{video?.filename ?? "Video preview"}</DialogTitle>
					<DialogDescription>Video preview</DialogDescription>
				</DialogHeader>
				<div className="min-h-0 p-4 pt-0 sm:p-6 sm:pt-0">
					{/*
					 * Rendered while closing and unmounted only once `onClosed` runs, so
					 * the frame keeps its size through the fade and no <video> survives
					 * to play audio behind a dismissed dialog.
					 */}
					{video ? (
						<div className="overflow-hidden rounded-lg border border-border bg-surface-sunken">
							<VideoPlayer
								className="aspect-video max-h-[72vh]"
								label={video.title}
								src={video.src}
							/>
						</div>
					) : null}
				</div>
			</DialogContent>
		</Dialog>
	);
}
