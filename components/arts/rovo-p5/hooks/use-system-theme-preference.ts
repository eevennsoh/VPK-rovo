"use client";

import { useEffect } from "react";

import { hasStoredThemePreference } from "@/components/utils/theme-storage";
import { useTheme } from "@/components/utils/theme-wrapper";

/**
 * Opts this surface into the OS colour scheme.
 *
 * VPK's `ThemeWrapper` defaults to `"light"`, and ADS resolves its tokens from
 * a single global `data-color-mode` on `<html>` — a scoped `data-color-mode`
 * on a subtree does not re-resolve them, so a control panel cannot be themed
 * independently of the app. Switching the app to `"system"` is therefore the
 * only way to make the panel follow light/dark.
 *
 * A visitor who has explicitly picked light or dark keeps that choice; only the
 * untouched default is upgraded.
 */
export function useSystemThemePreference() {
	const { theme, setTheme } = useTheme();

	useEffect(() => {
		if (theme === "system") return;
		if (hasStoredThemePreference()) return;
		setTheme("system");
	}, [setTheme, theme]);
}
