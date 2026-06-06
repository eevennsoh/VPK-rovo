import type { Metadata } from "next";
import AgentPage from "@/components/blocks/agent/page";
import { getPreviewPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getPreviewPageTitle("agent", "blocks"),
};

export default function AgentPreviewPage() {
	return <AgentPage />;
}
