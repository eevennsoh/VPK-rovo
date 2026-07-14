export interface GallerySelectionOrigin {
	xPercent: number;
	yPercent: number;
}

export interface GallerySelectionVisual {
	id: string;
	key: number;
	origin: GallerySelectionOrigin;
	phase: "enter" | "settled" | "exit";
}

export const GALLERY_SELECTION_SHADER_EXIT_SECONDS = 0.6; // --duration-slowest
export const GALLERY_SELECTION_SHADER_EXIT_OVERLAP_MS =
	GALLERY_SELECTION_SHADER_EXIT_SECONDS * 1000 + 40;

export const DEFAULT_GALLERY_SELECTION_ORIGIN: GallerySelectionOrigin = {
	xPercent: 50,
	yPercent: 50,
};

export function getGallerySelectionOriginFromPoint(
	width: number,
	height: number,
	clientX: number,
	clientY: number,
	left: number,
	top: number,
): GallerySelectionOrigin {
	const xPercent = ((clientX - left) / width) * 100;
	const yPercent = ((clientY - top) / height) * 100;
	return {
		xPercent: Math.min(100, Math.max(0, xPercent)),
		yPercent: Math.min(100, Math.max(0, yPercent)),
	};
}

export function getGalleryItemSeed(id: string): number {
	let hash = 0;
	for (let index = 0; index < id.length; index += 1) {
		hash = (hash * 31 + id.charCodeAt(index)) % 10000;
	}
	return 100 + hash;
}
