export function toggleSelectedValue(values: readonly string[], value: string): readonly string[] {
	return values.includes(value)
		? values.filter((current) => current !== value)
		: [...values, value];
}
