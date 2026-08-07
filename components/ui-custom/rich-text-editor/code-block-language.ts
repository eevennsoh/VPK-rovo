/**
 * TipTap stores fenced-code languages on `codeBlock` attrs (`language`).
 * Mermaid fences use `mermaid` or the shorter `mmd` alias (same as MessageResponse).
 */
export function isMermaidCodeBlockLanguage(language: unknown): boolean {
	if (typeof language !== "string") {
		return false;
	}
	const normalized = language.trim().toLowerCase();
	return normalized === "mermaid" || normalized === "mmd";
}

export function toMermaidFenceMarkdown(code: string): string {
	return ["```mermaid", code.trim(), "```"].join("\n");
}
