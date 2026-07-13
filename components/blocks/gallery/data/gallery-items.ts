export interface GalleryItem {
	id: string;
	title: string;
	description: string;
	/** One of three fixed footprints: portrait (tall), landscape (wide), 1x1 (square). */
	size: "portrait" | "landscape" | "1x1";
}

export const DEMO_GALLERY_ITEMS: readonly GalleryItem[] = [
	{
		id: "aurora-sessions",
		title: "Aurora Sessions",
		description: "A late-night visual mixtape of gradient studies and light leaks.",
		size: "portrait",
	},
	{
		id: "field-notes",
		title: "Field Notes",
		description: "Snapshots and sketches collected on the road this spring.",
		size: "1x1",
	},
	{
		id: "sunset-reel",
		title: "Sunset Reel",
		description: "A wide cut of golden-hour footage from the coast highway.",
		size: "landscape",
	},
	{
		id: "deep-focus",
		title: "Deep Focus",
		description: "Ambient loops built for long, quiet stretches of work.",
		size: "portrait",
	},
	{
		id: "garden-grid",
		title: "Garden Grid",
		description: "Close-ups of leaves, moss, and morning condensation.",
		size: "1x1",
	},
	{
		id: "neon-district",
		title: "Neon District",
		description: "A panoramic sweep through the city after the rain.",
		size: "landscape",
	},
	{
		id: "citrus-studies",
		title: "Citrus Studies",
		description: "Warm still lifes exploring texture, peel, and shadow.",
		size: "portrait",
	},
	{
		id: "ember-type",
		title: "Ember Type",
		description: "Experimental lettering rendered in molten gradients.",
		size: "1x1",
	},
	{
		id: "tide-lines",
		title: "Tide Lines",
		description: "A wide horizon study of shifting water and shoreline.",
		size: "landscape",
	},
];
