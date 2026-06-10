import type { Metadata } from "next";
import AgentProfileCardPage from "@/components/blocks/agent-profile-card/page";
import { getPreviewPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getPreviewPageTitle("agent-profile-card", "blocks"),
};

export default function AgentProfileCardPreviewPage() {
	return <AgentProfileCardPage />;
}
