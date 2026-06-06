import type { Metadata } from "next";
import AgentBentoPage from "@/components/blocks/agent-bento/page";
import { getPreviewPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getPreviewPageTitle("agent-bento", "blocks"),
};

export default function AgentBentoPreviewPage() {
	return <AgentBentoPage />;
}
