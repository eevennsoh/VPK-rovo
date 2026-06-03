import { type NextRequest } from "next/server";

import { proxyToBackend } from "@/app/api/_utils/proxy";
import { readJsonBody } from "@/app/api/_utils/read-json-body";

export async function POST(request: NextRequest) {
	const { body, errorResponse } = await readJsonBody<Record<string, unknown>>(request);
	if (errorResponse) {
		return errorResponse;
	}

	return proxyToBackend({
		body,
		method: "POST",
		path: "/api/studio/agent-data-flow",
	});
}
