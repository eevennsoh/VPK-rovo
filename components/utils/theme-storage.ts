// Theme persistence, split out from `theme-wrapper.tsx`.
//
// These are plain functions, not components. Keeping them in the component file
// disqualified it from Fast Refresh state preservation (`only-export-components`),
// and callers that only need to read the stored preference had to import a module
// full of React components to get at it.

export type Theme = "light" | "dark" | "system";

/** Key `ThemeWrapper` persists under unless a surface overrides it. */
export const DEFAULT_THEME_STORAGE_KEY = "ui-theme";

export const isTheme = (value: string | null): value is Theme => {
	return value === "light" || value === "dark" || value === "system";
};

export const getStoredTheme = (storageKey: string): Theme | undefined => {
	if (typeof window === "undefined") {
		return undefined;
	}

	try {
		const storedTheme = window.localStorage.getItem(storageKey);
		return isTheme(storedTheme) ? storedTheme : undefined;
	} catch {
		return undefined;
	}
};

/**
 * Whether the visitor has actually chosen a theme, as opposed to sitting on the
 * `defaultTheme` fallback. Surfaces that want to honour the OS preference need
 * this to tell "chose light" apart from "never chose anything", because ADS
 * tokens are global — a scoped `data-color-mode` does not re-resolve them.
 */
export function hasStoredThemePreference(
	storageKey: string = DEFAULT_THEME_STORAGE_KEY,
): boolean {
	return getStoredTheme(storageKey) !== undefined;
}
