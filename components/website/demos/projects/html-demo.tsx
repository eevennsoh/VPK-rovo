"use client";

const VPK_HTML_INDEX_URL = "/api/vpk-html/index.html";

export default function HtmlDemo() {
	return (
		<iframe
			src={VPK_HTML_INDEX_URL}
			title="vpk-html index"
			className="h-dvh min-h-0 w-full border-0 bg-surface"
		/>
	);
}
