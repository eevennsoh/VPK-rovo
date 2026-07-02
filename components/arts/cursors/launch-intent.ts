// Detects when a spoken phrase tells the Rovo cursor team to head out — the
// trigger for the launch/send-off in the Cursors art. Only meaningful while a
// team is already fanned out (the caller gates on that).
const LAUNCH_PHRASES =
	/\b(let's (go+|roll|ride|move|bounce|cook|do this|get it|get to it)|go go go|here we go|off we go|send it|ship it)\b/;

export function detectLaunchIntent(text: string | null | undefined): boolean {
	if (!text) {
		return false;
	}

	// Normalize curly apostrophes so "let's"/"let's"/"lets" all match.
	const normalized = text.toLowerCase().replace(/[‘’]/g, "'").replace(/\blets\b/g, "let's");
	return LAUNCH_PHRASES.test(normalized);
}
