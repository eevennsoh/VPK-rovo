import type { ComponentDetail } from "@/app/data/component-detail-types";

export const HTML_SELECTOR_DETAIL: ComponentDetail = {
	description:
		"A dev-only point-and-click inspector for plain HTML documents. It injects a portable vanilla overlay into a same-origin iframe, lets reviewers traverse element ancestry, pin scoped comments, preview style edits, and compose the collected notes for an agent session.",
	demoLayout: { previewHeight: "fixed", previewContentWidth: "full" },
	importStatement: `import { HtmlSelector } from "@/components/blocks/html-selector";`,
	usage: `<HtmlSelector src="/api/vpk-html/index.html" />

// Same-origin demo document
<HtmlSelector srcDoc={html} />`,
	props: [
		{ name: "src", type: "string", description: "Same-origin iframe URL to inspect, typically /api/vpk-html/<path>." },
		{ name: "srcDoc", type: "string", description: "Inline HTML document for demos and local fixtures." },
		{ name: "title", type: "string", default: "\"HTML selector preview\"", description: "Accessible title for the preview iframe." },
		{ name: "className", type: "string", description: "Extra classes merged onto the block root." },
	],
};
