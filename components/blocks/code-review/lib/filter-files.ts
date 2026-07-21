import type { ChangedFile, ChangeSet } from "../data/types";

export function filterBySearch(
	files: readonly ChangedFile[],
	query: string,
): readonly ChangedFile[] {
	const normalizedQuery = query.trim().toLowerCase();
	if (normalizedQuery === "") {
		return files;
	}

	return files.filter((file) => file.path.toLowerCase().includes(normalizedQuery));
}

export function filterByChangeSet(
	files: readonly ChangedFile[],
	changeSet: ChangeSet | null,
): readonly ChangedFile[] {
	if (changeSet === null) {
		return files;
	}

	const includedIds = new Set(changeSet.fileIds);
	return files.filter((file) => includedIds.has(file.id));
}
