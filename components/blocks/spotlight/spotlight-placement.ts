export type SpotlightSide = "top" | "bottom" | "left" | "right";
export type SpotlightAlign = "start" | "center" | "end";

export type SpotlightPlacement =
	| "top-start"
	| "top-center"
	| "top-end"
	| "bottom-start"
	| "bottom-center"
	| "bottom-end"
	| "left-start"
	| "left-end"
	| "right-start"
	| "right-end";

export const SPOTLIGHT_PLACEMENT_CONFIG: Record<SpotlightPlacement, { side: SpotlightSide; align: SpotlightAlign }> = {
	"top-start": { side: "top", align: "start" },
	"top-center": { side: "top", align: "center" },
	"top-end": { side: "top", align: "end" },
	"bottom-start": { side: "bottom", align: "start" },
	"bottom-center": { side: "bottom", align: "center" },
	"bottom-end": { side: "bottom", align: "end" },
	"left-start": { side: "left", align: "start" },
	"left-end": { side: "left", align: "end" },
	"right-start": { side: "right", align: "start" },
	"right-end": { side: "right", align: "end" },
};

export const SPOTLIGHT_PLACEMENTS = Object.keys(SPOTLIGHT_PLACEMENT_CONFIG) as SpotlightPlacement[];
