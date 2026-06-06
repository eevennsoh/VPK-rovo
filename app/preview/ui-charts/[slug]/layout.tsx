import { PreviewCategoryLayout, getCategoryPreviewMetadata, type PreviewLayoutProps } from "@/app/preview/_shared/preview-metadata";

export async function generateMetadata({ params }: PreviewLayoutProps) {
	return getCategoryPreviewMetadata(params, "ui-charts");
}

export default PreviewCategoryLayout;
