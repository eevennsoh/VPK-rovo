import type { Metadata } from "next";
import TriggerConfigPage from "@/components/blocks/trigger-config/page";
import { getPreviewPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getPreviewPageTitle("trigger-config", "blocks"),
};

export default function TriggerConfigPreviewPage() {
	return <TriggerConfigPage />;
}
