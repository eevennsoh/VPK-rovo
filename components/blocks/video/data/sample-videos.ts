import type { ArtifactListItem } from "@/components/ui-custom/artifact-list";

export interface VideoArtifact {
	/** Stable identity, shared with the artifact row that opens it. */
	id: string;
	/** Human title used as the media element's accessible name. */
	title: string;
	/** File name shown as the dialog title. */
	filename: string;
	/** Video file URL under `public/`. */
	src: string;
	/** Metadata line rendered in the artifact row. */
	source: string;
	owner: string;
}

export const SAMPLE_VIDEO_ARTIFACTS: readonly VideoArtifact[] = [
	{
		id: "guest-checkout-walkthrough",
		title: "Guest checkout walkthrough",
		filename: "guest-checkout-walkthrough.mp4",
		src: "/videos/debug-video.mp4",
		source: "Screen recording",
		owner: "Vitafleet Team",
	},
	{
		id: "checkout-regression-repro",
		title: "Checkout regression repro",
		filename: "checkout-regression-repro.mp4",
		src: "/videos/debug-video.mp4",
		source: "Screen recording",
		owner: "Quality Assurance",
	},
	{
		id: "release-demo-cut",
		title: "Release demo cut",
		filename: "release-demo-cut.mp4",
		src: "/videos/debug-video.mp4",
		source: "Screen recording",
		owner: "Design Systems",
	},
];

/**
 * Artifact rows derived from the same records the dialog plays, so a row and
 * its video can never drift apart.
 */
export const VIDEO_ARTIFACT_ROWS: readonly ArtifactListItem[] = SAMPLE_VIDEO_ARTIFACTS.map(
	(video) => ({
		id: video.id,
		title: video.title,
		source: video.source,
		owner: video.owner,
		iconName: "video",
		tileVariant: "purpleSubtle",
		rowActionLabel: "Play",
	}),
);

const VIDEO_ARTIFACTS_BY_ID = new Map(SAMPLE_VIDEO_ARTIFACTS.map((video) => [video.id, video]));

export function findVideoArtifact(id: string): VideoArtifact | null {
	return VIDEO_ARTIFACTS_BY_ID.get(id) ?? null;
}
