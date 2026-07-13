"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import type { HtmlSelectorNotification } from "../lib/types";

const VPK_HTML_THEME_STORAGE_KEY = "vpk-html-theme";
const ARTIFACT_THEME_CHOICES = ["system", "light", "dark"] as const;
const ARTIFACT_THEME_LABELS = {
	dark: "Dark mode",
	light: "Light mode",
	system: "System",
} as const satisfies Record<ArtifactThemeChoice, string>;

type ArtifactThemeChoice = typeof ARTIFACT_THEME_CHOICES[number];
type ArtifactThemeMode = "light" | "dark";

interface UseArtifactThemeArgs {
	iframeRef: RefObject<HTMLIFrameElement | null>;
	onNotify: (notification: HtmlSelectorNotification) => void;
	onThemeChange?: (themeChoice: ArtifactThemeChoice) => void;
	pagePath: string;
}

function isArtifactThemeChoice(value: string | null): value is ArtifactThemeChoice {
	return ARTIFACT_THEME_CHOICES.some((choice) => choice === value);
}

function getFrameWindow(iframeRef: RefObject<HTMLIFrameElement | null>): Window | null {
	try {
		return iframeRef.current?.contentWindow ?? null;
	} catch {
		return null;
	}
}

function readArtifactThemeChoice(frameWindow: Window | null): ArtifactThemeChoice {
	if (!frameWindow) {
		return "system";
	}
	try {
		const documentChoice = frameWindow.document.documentElement.dataset.vpkThemeChoice ?? null;
		if (isArtifactThemeChoice(documentChoice)) {
			return documentChoice;
		}
		const stored = frameWindow.localStorage.getItem(VPK_HTML_THEME_STORAGE_KEY);
		return isArtifactThemeChoice(stored) ? stored : "system";
	} catch {
		return "system";
	}
}

function systemPrefersDark(frameWindow: Window): boolean {
	return frameWindow.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

// The resolved light/dark mode the artifact is actually rendering (data-theme="dark" is set by
// the artifact's own theme runtime for dark, including system+prefers-dark). Lets the host
// control chrome follow the artifact's theme without touching the VPK app theme.
function readArtifactThemeMode(frameWindow: Window | null): ArtifactThemeMode {
	if (!frameWindow) {
		return "light";
	}
	try {
		return frameWindow.document.documentElement.dataset.theme === "dark" ? "dark" : "light";
	} catch {
		return "light";
	}
}

function applyArtifactThemeChoice(frameWindow: Window, choice: ArtifactThemeChoice): void {
	const root = frameWindow.document.documentElement;
	root.dataset.vpkThemeChoice = choice;
	if (choice === "dark" || (choice === "system" && systemPrefersDark(frameWindow))) {
		root.dataset.theme = "dark";
		return;
	}
	root.removeAttribute("data-theme");
}

function writeArtifactThemeChoice(frameWindow: Window, choice: ArtifactThemeChoice): void {
	try {
		frameWindow.localStorage.setItem(VPK_HTML_THEME_STORAGE_KEY, choice);
	} catch {
		// The visual theme can still update even if storage is unavailable.
	}
	applyArtifactThemeChoice(frameWindow, choice);
}

function getNextArtifactThemeChoice(choice: ArtifactThemeChoice): ArtifactThemeChoice {
	const currentIndex = ARTIFACT_THEME_CHOICES.indexOf(choice);
	return ARTIFACT_THEME_CHOICES[(currentIndex + 1) % ARTIFACT_THEME_CHOICES.length];
}

function hideFrameThemeToggle(frameWindow: Window | null): void {
	try {
		const frameToggle = frameWindow?.document.querySelector<HTMLButtonElement>("[data-vpk-theme-toggle]");
		if (!frameToggle) {
			return;
		}
		frameToggle.hidden = true;
		frameToggle.tabIndex = -1;
		frameToggle.setAttribute("aria-hidden", "true");
		frameToggle.style.setProperty("display", "none", "important");
	} catch {
		// The host action bar still owns theme changes when the frame is readable.
	}
}

export function useArtifactTheme({
	iframeRef,
	onNotify,
	onThemeChange,
	pagePath,
}: Readonly<UseArtifactThemeArgs>) {
	const [themeChoice, setThemeChoice] = useState<ArtifactThemeChoice>("system");
	const [themeMode, setThemeMode] = useState<ArtifactThemeMode>("light");
	const onThemeChangeRef = useRef(onThemeChange);
	const syncThemeChoice = useCallback((frameWindow: Window | null) => {
		const nextThemeChoice = readArtifactThemeChoice(frameWindow);
		hideFrameThemeToggle(frameWindow);
		setThemeChoice(nextThemeChoice);
		setThemeMode(readArtifactThemeMode(frameWindow));
		onThemeChangeRef.current?.(nextThemeChoice);
		return nextThemeChoice;
	}, []);

	useEffect(() => {
		onThemeChangeRef.current = onThemeChange;
	}, [onThemeChange]);

	useEffect(() => {
		const frameWindow = getFrameWindow(iframeRef);
		syncThemeChoice(frameWindow);
		if (!frameWindow) {
			return undefined;
		}

		try {
			const observer = new MutationObserver(() => {
				syncThemeChoice(frameWindow);
			});
			observer.observe(frameWindow.document.documentElement, {
				attributeFilter: ["data-theme", "data-vpk-theme-choice"],
				attributes: true,
			});
			return () => {
				observer.disconnect();
			};
		} catch {
			return undefined;
		}
	}, [iframeRef, pagePath, syncThemeChoice]);

	const cycleTheme = useCallback(() => {
		const frameWindow = getFrameWindow(iframeRef);
		if (!frameWindow) {
			onNotify({ type: "error", message: "Artifact frame is not ready." });
			return;
		}

		try {
			const frameToggle = frameWindow.document.querySelector<HTMLButtonElement>("[data-vpk-theme-toggle]");
			if (frameToggle) {
				frameToggle.click();
				syncThemeChoice(frameWindow);
				return;
			}

			const nextTheme = getNextArtifactThemeChoice(readArtifactThemeChoice(frameWindow));
			writeArtifactThemeChoice(frameWindow, nextTheme);
			syncThemeChoice(frameWindow);
		} catch (error) {
			onNotify({ type: "error", message: error instanceof Error ? error.message : String(error) });
		}
	}, [iframeRef, onNotify, syncThemeChoice]);

	const themeLabel = ARTIFACT_THEME_LABELS[themeChoice];

	return {
		cycleTheme,
		themeChoice,
		themeLabel,
		themeMode,
	};
}
