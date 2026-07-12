"use client";

import dynamic from "next/dynamic";

const VPK_HTML_INDEX_URL = "/api/vpk-html/index.html";
const HtmlSelectorLazy = dynamic(
	() => import("@/components/blocks/html-selector").then((mod) => ({
		default: mod.HtmlSelector,
	})),
	{ ssr: false },
);

export default function HtmlDemo() {
	return process.env.NODE_ENV === "development" ? (
		<HtmlSelectorLazy src={VPK_HTML_INDEX_URL} title="vpk-html index" />
	) : (
		<iframe
			src={VPK_HTML_INDEX_URL}
			title="vpk-html index"
			className="h-dvh min-h-0 w-full border-0 bg-surface"
		/>
	);
}
