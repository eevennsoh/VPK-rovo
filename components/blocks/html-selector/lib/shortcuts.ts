import type { HtmlSelectorShortcuts, SelectorShortcut } from "./types";

export const HTML_SELECTOR_SHORTCUTS: HtmlSelectorShortcuts = {
	activate: { key: "Alt" },
	comment: { key: "c", metaOrCtrl: false, shift: false },
	copyAll: { key: "c", metaOrCtrl: true, shift: true },
	copyElement: { key: "c", metaOrCtrl: true, shift: false },
	send: { key: "Enter", metaOrCtrl: true, shift: true },
	styles: { key: "s", metaOrCtrl: false, shift: false },
};

export function formatShortcut(shortcut: SelectorShortcut): string {
	const parts: string[] = [];
	if (shortcut.metaOrCtrl) {
		parts.push("⌘/Ctrl");
	}
	if (shortcut.shift) {
		parts.push("Shift");
	}
	if (shortcut.alt) {
		parts.push("Alt");
	}
	parts.push(shortcut.key.length === 1 ? shortcut.key.toUpperCase() : shortcut.key);
	return parts.join("+");
}
