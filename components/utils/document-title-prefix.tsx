"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { formatDocumentTitleForPath, getDocumentTitlePrefix } from "@/lib/document-title-prefix";

interface DocumentTitlePrefixProps {
	projectNamesBySlug: Readonly<Record<string, string>>;
}

export function DocumentTitlePrefix({ projectNamesBySlug }: Readonly<DocumentTitlePrefixProps>) {
	const pathname = usePathname();

	useEffect(() => {
		const titlePrefix = getDocumentTitlePrefix(window.location);

		if (!titlePrefix) {
			return;
		}

		const applyTitlePrefix = () => {
			const nextTitle = formatDocumentTitleForPath(
				document.title,
				titlePrefix,
				pathname,
				projectNamesBySlug,
			);

			if (document.title !== nextTitle) {
				document.title = nextTitle;
			}
		};

		applyTitlePrefix();

		if (typeof MutationObserver === "undefined" || !document.head) {
			return;
		}

		const observer = new MutationObserver(() => {
			applyTitlePrefix();
		});

		observer.observe(document.head, {
			childList: true,
			characterData: true,
			subtree: true,
		});

		return () => {
			observer.disconnect();
		};
	}, [pathname, projectNamesBySlug]);

	return null;
}
