/** Initials for a person avatar fallback. Shared by row identity and invoker faces. */
export function actorInitials(name: string): string {
	return (
		name
			.split(" ")
			.filter(Boolean)
			.slice(0, 2)
			.map((word) => word[0]?.toUpperCase())
			.join("") || "?"
	);
}
