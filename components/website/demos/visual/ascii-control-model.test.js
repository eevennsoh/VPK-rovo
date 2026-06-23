const assert = require("node:assert/strict");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

let helpers;

test.before(async () => {
	const result = await esbuild.build({
		entryPoints: [path.join(process.cwd(), "components/website/demos/visual/ascii-control-model.ts")],
		bundle: true,
		format: "cjs",
		platform: "node",
		write: false,
	});
	helpers = loadCjsModuleFromText(result.outputFiles[0].text, "ascii-control-model.cjs");
});

test("ASCII control model builds labels from control values", () => {
	const {
		ANIMATION_STYLE_OPTIONS,
		BACKGROUND_MODE_OPTIONS,
		COLOR_OVERLAY_BLEND_OPTIONS,
		SOURCE_MODE_OPTIONS,
		titleizeAsciiOption,
	} = helpers;

	assert.equal(titleizeAsciiOption("color-dodge"), "Color Dodge");
	assert.deepEqual(SOURCE_MODE_OPTIONS, [
		{ value: "field", label: "Field" },
		{ value: "image", label: "Image" },
	]);
	assert.deepEqual(
		ANIMATION_STYLE_OPTIONS.map((option) => option.label),
		["Wave", "Cascade Left -> Right", "Cascade Right -> Left", "Cascade Top -> Bottom", "Reveal", "Pulse"],
	);
	assert.deepEqual(
		BACKGROUND_MODE_OPTIONS.map((option) => option.label),
		["Blurred Image", "Solid Black", "Original Image", "None (Transparent)"],
	);
	assert.ok(COLOR_OVERLAY_BLEND_OPTIONS.some((option) => option.value === "color-dodge"));
});

test("ASCII control model owns defaults used by the demo", () => {
	const {
		DEFAULT_ANIMATION_INTENSITY,
		DEFAULT_ANIMATION_RANDOMNESS,
		DEFAULT_ANIMATION_SPEED_SECONDS,
		DEFAULT_CHARSET_VALUES,
		DEFAULT_COLOR_OVERLAY_OPACITY,
		DEFAULT_DENSITY,
		DEFAULT_PREVIEW_ASPECT_RATIO,
		IMAGE_BACKGROUND_BLUR_RADIUS,
		IMAGE_BACKGROUND_OPACITY,
	} = helpers;

	assert.equal(DEFAULT_DENSITY, 0.82);
	assert.equal(DEFAULT_PREVIEW_ASPECT_RATIO, "16 / 9");
	assert.equal(DEFAULT_ANIMATION_SPEED_SECONDS, 4.3);
	assert.equal(DEFAULT_ANIMATION_INTENSITY, 0.83);
	assert.equal(DEFAULT_ANIMATION_RANDOMNESS, 0.5);
	assert.equal(DEFAULT_COLOR_OVERLAY_OPACITY, 0.3);
	assert.equal(IMAGE_BACKGROUND_OPACITY, 0.61);
	assert.equal(IMAGE_BACKGROUND_BLUR_RADIUS, 60);
	assert.equal(DEFAULT_CHARSET_VALUES.custom, DEFAULT_CHARSET_VALUES.light);
});

test("ASCII control helpers keep preview and animation math deterministic", () => {
	const {
		animationDurationToCycleSpeed,
		getPreviewAspectRatio,
		resolveImageBackgroundDefaults,
	} = helpers;

	assert.equal(animationDurationToCycleSpeed(4, 16), 4);
	assert.equal(animationDurationToCycleSpeed(0, 10), 100);
	assert.equal(getPreviewAspectRatio(undefined), "16 / 9");
	assert.equal(getPreviewAspectRatio({ width: 640, height: 480 }), "640 / 480");
	assert.deepEqual(resolveImageBackgroundDefaults(), {
		backgroundMode: "blurred-image",
		backgroundOpacity: 0.61,
		backgroundBlurRadius: 60,
	});
});
