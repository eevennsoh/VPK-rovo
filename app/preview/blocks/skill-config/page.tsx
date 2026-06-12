import type { Metadata } from "next";
import SkillConfigPage from "@/components/blocks/skill-config/page";
import { getPreviewPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getPreviewPageTitle("skill-config", "blocks"),
};

export default function SkillConfigPreviewPage() {
	return <SkillConfigPage />;
}
