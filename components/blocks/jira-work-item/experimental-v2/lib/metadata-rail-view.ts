export type MetadataRailView = "details" | "activity" | "pull-requests";

export function isMetadataRailView(value: string | undefined): value is MetadataRailView {
	return value === "details" || value === "activity" || value === "pull-requests";
}
