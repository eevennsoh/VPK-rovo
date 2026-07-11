export interface GalleryItem {
	id: string;
	title: string;
	description: string;
	size: "tall" | "square" | "wide";
	/** Decorative placeholder face, e.g. "bg-linear-to-br from-purple-200 to-blue-400" (tailwind-theme accents allowed for decorative use). */
	surfaceClassName: string;
}

export const DEMO_GALLERY_ITEMS: readonly GalleryItem[] = [
	{
		id: "aurora-sessions",
		title: "Aurora Sessions",
		description: "A late-night visual mixtape of gradient studies and light leaks.",
		size: "tall",
		surfaceClassName: "bg-linear-to-br from-purple-200 to-blue-400",
	},
	{
		id: "field-notes",
		title: "Field Notes",
		description: "Snapshots and sketches collected on the road this spring.",
		size: "square",
		surfaceClassName: "bg-linear-to-br from-teal-200 to-green-400",
	},
	{
		id: "sunset-reel",
		title: "Sunset Reel",
		description: "A wide cut of golden-hour footage from the coast highway.",
		size: "wide",
		surfaceClassName: "bg-linear-to-br from-orange-200 to-red-400",
	},
	{
		id: "deep-focus",
		title: "Deep Focus",
		description: "Ambient loops built for long, quiet stretches of work.",
		size: "tall",
		surfaceClassName: "bg-linear-to-b from-blue-300 to-purple-500",
	},
	{
		id: "garden-grid",
		title: "Garden Grid",
		description: "Close-ups of leaves, moss, and morning condensation.",
		size: "square",
		surfaceClassName: "bg-linear-to-tr from-lime-200 to-teal-400",
	},
	{
		id: "neon-district",
		title: "Neon District",
		description: "A panoramic sweep through the city after the rain.",
		size: "wide",
		surfaceClassName: "bg-linear-to-br from-pink-200 to-purple-400",
	},
	{
		id: "citrus-studies",
		title: "Citrus Studies",
		description: "Warm still lifes exploring texture, peel, and shadow.",
		size: "tall",
		surfaceClassName: "bg-linear-to-b from-yellow-200 to-orange-400",
	},
	{
		id: "ember-type",
		title: "Ember Type",
		description: "Experimental lettering rendered in molten gradients.",
		size: "square",
		surfaceClassName: "bg-linear-to-br from-red-200 to-orange-400",
	},
	{
		id: "tide-lines",
		title: "Tide Lines",
		description: "A wide horizon study of shifting water and shoreline.",
		size: "wide",
		surfaceClassName: "bg-linear-to-tr from-green-200 to-teal-400",
	},
];
