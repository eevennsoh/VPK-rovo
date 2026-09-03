const { getNonEmptyString } = require("./shared-utils");

function resolveGoogleImageGatewayConfig({
	envVars,
	requestedModel,
	resolveGatewayUrl,
	detectEndpointType,
} = {}) {
	const rawGatewayUrl = getNonEmptyString(envVars?.AI_GATEWAY_URL_GOOGLE)
		|| getNonEmptyString(envVars?.AI_GATEWAY_URL);
	if (!rawGatewayUrl) {
		return {
			ok: false,
			statusCode: 500,
			error: "Image generation is not configured",
			details:
				"Set AI_GATEWAY_URL_GOOGLE to a Google AI Gateway endpoint (or set AI_GATEWAY_URL to a Google endpoint).",
		};
	}

	const resolvedGatewayUrl =
		(typeof resolveGatewayUrl === "function" ? resolveGatewayUrl(rawGatewayUrl) : null)
		|| rawGatewayUrl;
	const endpointType =
		typeof detectEndpointType === "function" ? detectEndpointType(resolvedGatewayUrl) : null;
	if (endpointType !== "google") {
		return {
			ok: false,
			statusCode: 400,
			error: "Provider routing mismatch",
			details:
				'Image generation requires provider "google" to resolve to a Google endpoint in AI_GATEWAY_URL_GOOGLE.',
		};
	}

	const model = getNonEmptyString(requestedModel) || getNonEmptyString(envVars?.GOOGLE_IMAGE_MODEL);
	if (!model) {
		return {
			ok: false,
			statusCode: 500,
			error: "Image model is not configured",
			details:
				"Set GOOGLE_IMAGE_MODEL to an image-capable model (for example: gemini-3-pro-image).",
		};
	}

	return {
		ok: true,
		envVars,
		gatewayUrl: resolvedGatewayUrl,
		model,
	};
}

function toImageWidgetErrorMessage(configResult) {
	if (!configResult || configResult.ok) {
		return null;
	}

	const error = getNonEmptyString(configResult.error) || "Image generation is unavailable.";
	const details = getNonEmptyString(configResult.details);
	return details ? `${error} ${details}` : error;
}

function isUnsupportedModalitiesError(error) {
	const message = error instanceof Error ? error.message : String(error ?? "");
	return /\bmodalit(?:y|ies)\b|response_modalities|unknown field|unrecognized field|invalid argument/i.test(
		message
	);
}

module.exports = {
	resolveGoogleImageGatewayConfig,
	toImageWidgetErrorMessage,
	isUnsupportedModalitiesError,
};
