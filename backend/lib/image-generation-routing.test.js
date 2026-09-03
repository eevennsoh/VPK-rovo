const test = require("node:test");
const assert = require("node:assert/strict");

const {
	resolveGoogleImageGatewayConfig,
	toImageWidgetErrorMessage,
	isUnsupportedModalitiesError,
} = require("./image-generation-routing");

test("resolveGoogleImageGatewayConfig fails when gateway URL is missing", () => {
	const result = resolveGoogleImageGatewayConfig({
		envVars: {},
		resolveGatewayUrl: (value) => value,
		detectEndpointType: () => "google",
	});

	assert.equal(result.ok, false);
	assert.equal(result.statusCode, 500);
	assert.equal(result.error, "Image generation is not configured");
});

test("resolveGoogleImageGatewayConfig fails when endpoint is not google", () => {
	const result = resolveGoogleImageGatewayConfig({
		envVars: {
			AI_GATEWAY_URL_GOOGLE: "https://example.com/v1/openai/chat/completions",
			GOOGLE_IMAGE_MODEL: "gemini-3-pro-image",
		},
		resolveGatewayUrl: (value) => value,
		detectEndpointType: () => "openai",
	});

	assert.equal(result.ok, false);
	assert.equal(result.statusCode, 400);
	assert.equal(result.error, "Provider routing mismatch");
});

test("resolveGoogleImageGatewayConfig fails when model is missing", () => {
	const result = resolveGoogleImageGatewayConfig({
		envVars: {
			AI_GATEWAY_URL_GOOGLE: "https://example.com/v1/google/chat/completions",
		},
		resolveGatewayUrl: (value) => value,
		detectEndpointType: () => "google",
	});

	assert.equal(result.ok, false);
	assert.equal(result.statusCode, 500);
	assert.equal(result.error, "Image model is not configured");
});

test("resolveGoogleImageGatewayConfig prefers requested model override", () => {
	const result = resolveGoogleImageGatewayConfig({
		envVars: {
			AI_GATEWAY_URL_GOOGLE: "https://example.com/v1/google/chat/completions",
			GOOGLE_IMAGE_MODEL: "gemini-3-pro-image",
		},
		requestedModel: "gemini-3-custom-image",
		resolveGatewayUrl: (value) => value,
		detectEndpointType: () => "google",
	});

	assert.equal(result.ok, true);
	assert.equal(result.model, "gemini-3-custom-image");
});

test("toImageWidgetErrorMessage combines error and details", () => {
	const result = toImageWidgetErrorMessage({
		ok: false,
		error: "Provider routing mismatch",
		details: "Point AI_GATEWAY_URL_GOOGLE to a Google endpoint.",
	});

	assert.equal(
		result,
		"Provider routing mismatch Point AI_GATEWAY_URL_GOOGLE to a Google endpoint."
	);
});

test("isUnsupportedModalitiesError detects payload schema errors", () => {
	assert.equal(
		isUnsupportedModalitiesError(
			new Error('AI Gateway Google error 400: Unrecognized field "modalities"')
		),
		true
	);
	assert.equal(
		isUnsupportedModalitiesError(new Error("AI Gateway Google error 503: backend unavailable")),
		false
	);
});
