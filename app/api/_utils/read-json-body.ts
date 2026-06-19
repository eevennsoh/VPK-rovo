import { NextResponse } from "next/server";

export const DEFAULT_JSON_BODY_LIMIT_BYTES = 12 * 1024 * 1024;
export const BACKEND_FALLBACK_JSON_BODY_LIMIT_BYTES = 50 * 1024 * 1024;

interface ReadJsonBodyResult<T> {
	body: T | null;
	errorResponse: NextResponse | null;
}

interface ReadJsonBodyOptions<T> {
	defaultBody?: T;
	maxBytes?: number;
	required?: boolean;
}

class RequestBodyTooLargeError extends Error {
	readonly limitBytes: number;

	constructor(limitBytes: number) {
		super("Request body exceeds the configured byte limit.");
		this.name = "RequestBodyTooLargeError";
		this.limitBytes = limitBytes;
	}
}

function resolveMaxBytes(maxBytes: number | undefined): number {
	if (maxBytes === undefined) {
		return DEFAULT_JSON_BODY_LIMIT_BYTES;
	}

	if (!Number.isSafeInteger(maxBytes) || maxBytes < 0) {
		throw new TypeError("readJsonBody maxBytes must be a non-negative safe integer.");
	}

	return maxBytes;
}

function getDeclaredContentLength(request: Request): number | null {
	const contentLength = request.headers.get("content-length");
	if (contentLength === null) {
		return null;
	}

	const parsedLength = Number(contentLength);
	if (!Number.isSafeInteger(parsedLength) || parsedLength < 0) {
		return null;
	}

	return parsedLength;
}

async function readTextWithLimit(request: Request, maxBytes: number): Promise<string> {
	const declaredLength = getDeclaredContentLength(request);
	if (declaredLength !== null && declaredLength > maxBytes) {
		throw new RequestBodyTooLargeError(maxBytes);
	}

	if (!request.body) {
		return "";
	}

	const decoder = new TextDecoder();
	const reader = request.body.getReader();
	const chunks: string[] = [];
	let bytesRead = 0;

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}

			bytesRead += value.byteLength;
			if (bytesRead > maxBytes) {
				await reader.cancel().catch(() => undefined);
				throw new RequestBodyTooLargeError(maxBytes);
			}

			chunks.push(decoder.decode(value, { stream: true }));
		}

		chunks.push(decoder.decode());
		return chunks.join("");
	} finally {
		reader.releaseLock();
	}
}

function requestBodyTooLargeResponse(error: RequestBodyTooLargeError): NextResponse {
	return NextResponse.json(
		{
			error: "Request payload is too large.",
			reason: "payload_too_large",
			limitBytes: error.limitBytes,
		},
		{ status: 413 },
	);
}

export async function readJsonBody<T = unknown>(
	request: Request,
	options: Readonly<ReadJsonBodyOptions<T>> = {},
): Promise<ReadJsonBodyResult<T>> {
	let rawBody: string;
	try {
		rawBody = await readTextWithLimit(request, resolveMaxBytes(options.maxBytes));
	} catch (error) {
		if (error instanceof RequestBodyTooLargeError) {
			return {
				body: null,
				errorResponse: requestBodyTooLargeResponse(error),
			};
		}

		throw error;
	}

	if (!rawBody.trim()) {
		if (options.required === false) {
			return {
				body: options.defaultBody ?? null,
				errorResponse: null,
			};
		}

		return {
			body: null,
			errorResponse: NextResponse.json(
				{ error: "Request body is required." },
				{ status: 400 },
			),
		};
	}

	try {
		return {
			body: JSON.parse(rawBody) as T,
			errorResponse: null,
		};
	} catch {
		return {
			body: null,
			errorResponse: NextResponse.json(
				{ error: "Invalid JSON request body." },
				{ status: 400 },
			),
		};
	}
}
