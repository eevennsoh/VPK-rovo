import { RenderPreviewCategoryPage } from "@/app/preview/_shared/render-preview-category-page";
import { getPreviewStaticParams } from "@/app/preview/_shared/preview-static-params";
import { redirect } from "next/navigation";

interface PreviewUiCustomPageProps {
	params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
	return getPreviewStaticParams("ui-custom");
}

export default async function PreviewUiCustomPage({ params }: PreviewUiCustomPageProps) {
	const { slug } = await params;

	if (slug === "skill-card") {
		redirect("/preview/ui-custom/entity-card");
	}

	return <RenderPreviewCategoryPage slug={slug} category="ui-custom" />;
}
