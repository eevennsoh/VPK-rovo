import { RenderPreviewCategoryPage } from "@/app/preview/_shared/render-preview-category-page";
import { getPreviewStaticParams } from "@/app/preview/_shared/preview-static-params";

interface PreviewPageProps {
	params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
	return getPreviewStaticParams("ui-charts");
}

export default async function PreviewUiChartsPage({ params }: PreviewPageProps) {
	const { slug } = await params;

	return <RenderPreviewCategoryPage slug={slug} category="ui-charts" />;
}
