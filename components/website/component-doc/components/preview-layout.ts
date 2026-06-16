import type { DemoLayout } from "@/app/data/component-detail-types";
import type { DemoCategory } from "@/components/website/demo-registry-loader";

export function shouldUseFullPagePreview(category: DemoCategory, demoLayout?: DemoLayout) {
	return (category === "projects" || category === "blocks") && (demoLayout?.previewHeight === "fixed" || demoLayout?.previewHeight === "fit");
}
