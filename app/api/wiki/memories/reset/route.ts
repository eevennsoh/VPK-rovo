import { proxyToBackend } from "@/app/api/_utils/proxy";

export async function POST() {
	return proxyToBackend({
		method: "POST",
		path: "/api/wiki/memories/reset",
	});
}
