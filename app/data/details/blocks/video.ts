import type { ComponentDetail } from "@/app/data/component-detail-types";

export const VIDEO_DETAIL: ComponentDetail = {
	description:
		"Simple video player block. Artifact rows list the available recordings and opening one launches a modal dialog with a media-chrome player — play/pause, scrub, time, mute, volume, and fullscreen — styled with ADS tokens.",
	usage: `import VideoBlock from "@/components/blocks/video/page";

<VideoBlock />

// Or use the player on its own:
import { VideoPlayer } from "@/components/blocks/video";

<VideoPlayer label="Guest checkout walkthrough" src="/videos/debug-video.mp4" />`,
};
