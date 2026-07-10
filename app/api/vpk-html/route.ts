import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";

export async function GET(request: NextRequest) {
	const search = new URL(request.url).search;

	return proxyToBackend({
		method: "GET",
		path: `/api/vpk-html${search}`,
	});
}
