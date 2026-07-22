import type { Metadata } from "next";
import CodeReviewPage from "@/components/blocks/code-review/page";
import { getPreviewPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getPreviewPageTitle("code-review", "blocks"),
};

export default function CodeReviewPreviewPage() {
	return <CodeReviewPage />;
}
