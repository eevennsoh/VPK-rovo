export const DISPATCH_ENDPOINT_UNAVAILABLE_MESSAGE =
	"Dispatch endpoint unavailable — restart the dev backend (pnpm run dev:tmux:start).";

export interface DispatchResponsePayload {
	error?: string;
	sessionName?: string;
	windowName?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isDispatchEndpointUnavailableText(message: string): boolean {
	const normalized = message.trim().toLowerCase();
	return normalized.includes("<!doctype html")
		|| normalized.includes("<html")
		|| normalized.includes("cannot post /api/html-selector/dispatch");
}

export function getDispatchErrorMessage(message: string): string {
	return isDispatchEndpointUnavailableText(message)
		? DISPATCH_ENDPOINT_UNAVAILABLE_MESSAGE
		: message;
}

export function parseDispatchResponseBody(body: string): DispatchResponsePayload {
	let parsed: unknown;
	try {
		parsed = JSON.parse(body);
	} catch {
		throw new Error(DISPATCH_ENDPOINT_UNAVAILABLE_MESSAGE);
	}

	if (!isRecord(parsed)) {
		return {};
	}

	const error = typeof parsed.error === "string" ? parsed.error : undefined;
	if (error && isDispatchEndpointUnavailableText(error)) {
		throw new Error(DISPATCH_ENDPOINT_UNAVAILABLE_MESSAGE);
	}

	return {
		error,
		sessionName: typeof parsed.sessionName === "string" ? parsed.sessionName : undefined,
		windowName: typeof parsed.windowName === "string" ? parsed.windowName : undefined,
	};
}
