import type { Metadata } from "next";
import Agent2Page from "@/components/blocks/agent-2/page";
import { getPreviewPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getPreviewPageTitle("agent-2", "blocks"),
};

export default function Agent2PreviewPage() {
	return <Agent2Page />;
}
