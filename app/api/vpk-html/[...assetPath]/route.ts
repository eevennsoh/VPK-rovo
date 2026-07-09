import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";

interface VpkHtmlRouteContext {
	params: Promise<{
		assetPath: string[];
	}>;
}

export async function GET(request: NextRequest, { params }: VpkHtmlRouteContext) {
	const { assetPath } = await params;
	const encodedAssetPath = assetPath.map((part) => encodeURIComponent(part)).join("/");
	const search = new URL(request.url).search;

	return proxyToBackend({
		method: "GET",
		path: `/api/vpk-html/${encodedAssetPath}${search}`,
	});
}
