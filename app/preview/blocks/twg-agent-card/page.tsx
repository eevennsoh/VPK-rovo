import type { Metadata } from "next";
import TWGAgentCardPage from "@/components/blocks/twg-agent-card/page";
import { getPreviewPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getPreviewPageTitle("twg-agent-card", "blocks"),
};

export default function TWGAgentCardPreviewPage() {
	return <TWGAgentCardPage />;
}
