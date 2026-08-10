export type MetadataRailView = "details" | "activity";

export function isMetadataRailView(value: string | undefined): value is MetadataRailView {
	return value === "details" || value === "activity";
}
