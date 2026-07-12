"use client";

import { HtmlSelector } from "./components/html-selector";
import { HTML_SELECTOR_DEMO_DOC } from "./data/demo-doc";

export default function Page() {
	return <HtmlSelector srcDoc={HTML_SELECTOR_DEMO_DOC} title="HTML Selector demo document" />;
}
