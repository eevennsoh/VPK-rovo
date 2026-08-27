"use client";

import { useState } from "react";

import { ArtifactList } from "@/components/ui-custom/artifact-list";

import { VideoPreviewDialog } from "./components/video-preview-dialog";
import {
	findVideoArtifact,
	VIDEO_ARTIFACT_ROWS,
	type VideoArtifact,
} from "./data/sample-videos";

export default function VideoBlock() {
	// Two pieces of state on purpose: `isPreviewOpen` drives the dialog's enter
	// and exit animation, while `activeVideo` owns content lifetime and outlives
	// the close so the popup does not collapse to an empty shell mid-fade.
	const [activeVideo, setActiveVideo] = useState<VideoArtifact | null>(null);
	const [isPreviewOpen, setIsPreviewOpen] = useState(false);

	return (
		<div className="flex min-h-full w-full items-center justify-center bg-background p-4">
			<div className="grid w-full max-w-xl gap-2">
				<h2 className="text-sm font-medium text-text">Recordings</h2>
				<ArtifactList
					items={VIDEO_ARTIFACT_ROWS}
					openLabel="Play"
					openOnRowClick
					onOpen={(item) => {
						const video = findVideoArtifact(item.id);
						if (!video) return;
						setActiveVideo(video);
						setIsPreviewOpen(true);
					}}
				/>
			</div>
			<VideoPreviewDialog
				video={activeVideo}
				open={isPreviewOpen}
				onOpenChange={setIsPreviewOpen}
				onClosed={() => setActiveVideo(null)}
			/>
		</div>
	);
}
