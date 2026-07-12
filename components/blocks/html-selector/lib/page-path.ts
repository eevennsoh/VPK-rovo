const VPK_HTML_PREFIX = "/api/vpk-html/";

function decodePathSegment(segment: string): string {
	try {
		return decodeURIComponent(segment);
	} catch {
		return segment;
	}
}

export function normalizeVpkHtmlPagePath(pathname: string): string {
	if (pathname === "/api/vpk-html" || pathname === "/api/vpk-html/") {
		return "index.html";
	}

	if (!pathname.startsWith(VPK_HTML_PREFIX)) {
		return pathname === "about:srcdoc" ? "srcdoc" : pathname.replace(/^\/+/u, "") || "srcdoc";
	}

	const stripped = pathname.slice(VPK_HTML_PREFIX.length);
	return stripped
		.split("/")
		.map(decodePathSegment)
		.join("/") || "index.html";
}

export function getDiskPathForPage(pagePath: string): string | undefined {
	if (!pagePath || pagePath === "srcdoc") {
		return undefined;
	}

	return `.agents/skills/vpk-html/${pagePath}`;
}

export function getPageUrlForPin(pagePath: string): string {
	if (!pagePath || pagePath === "srcdoc") {
		return "srcdoc";
	}

	return `/api/vpk-html/${pagePath}`;
}

export function resolveIframePage(
	iframe: HTMLIFrameElement | null,
): { diskPath?: string; pagePath: string; url: string } {
	if (!iframe) {
		return { pagePath: "srcdoc", url: "srcdoc" };
	}

	try {
		const location = iframe.contentWindow?.location;
		if (!location || location.href === "about:srcdoc") {
			return { pagePath: "srcdoc", url: "srcdoc" };
		}

		const pagePath = normalizeVpkHtmlPagePath(location.pathname);
		return {
			diskPath: getDiskPathForPage(pagePath),
			pagePath,
			url: location.href,
		};
	} catch {
		return { pagePath: "srcdoc", url: "srcdoc" };
	}
}
