"use client";

import { type Ref } from "react";

import { MetalFx as UpstreamMetalFx } from "./vendor/metal-fx/src/MetalFx";
import type {
	MetalFxPreset,
	MetalFxProps,
	MetalFxTheme,
	MetalFxVariant,
} from "./vendor/metal-fx/src/types";

export interface LiquidMetalProps extends MetalFxProps {
	ref?: Ref<HTMLDivElement>;
}

export function LiquidMetal({ ref, ...props }: Readonly<LiquidMetalProps>) {
	return <UpstreamMetalFx ref={ref} {...props} />;
}

export const MetalFx = UpstreamMetalFx;

export {
	PRESETS,
	hexToRgb,
	type Preset,
	type PresetMode,
	type PresetName,
	type PresetTheme,
} from "./vendor/metal-fx/src/engine/presets";

export {
	createInstance,
	destroyInstance,
	pauseShared,
	resumeShared,
	setSharedPreset,
	updateInstance,
} from "./vendor/metal-fx/src/engine/renderer/loop";

export type { MetalFxInstance } from "./vendor/metal-fx/src/engine/renderer/core";

export type {
	MetalFxPreset,
	MetalFxProps,
	MetalFxTheme,
	MetalFxVariant,
};

export {
	DEFAULT_LIQUID_METAL_CONFIG,
	LIQUID_METAL_BOOLEAN_OPTIONS,
	LIQUID_METAL_CONTROL_RANGES,
	LIQUID_METAL_DEMO_SURFACE_OPTIONS,
	LIQUID_METAL_DISABLE_GLOW_OPTIONS,
	LIQUID_METAL_NORMALIZE_HOST_STYLES_OPTIONS,
	LIQUID_METAL_PAUSED_OPTIONS,
	LIQUID_METAL_PRESET_OPTIONS,
	LIQUID_METAL_REFLECTION_TARGET_MODE_OPTIONS,
	LIQUID_METAL_SOURCE_METADATA,
	LIQUID_METAL_THEME_OPTIONS,
	LIQUID_METAL_VARIANT_OPTIONS,
	type LiquidMetalControlConfig,
	type LiquidMetalDemoSurface,
	type LiquidMetalOption,
	type LiquidMetalOptionalRange,
	type LiquidMetalRange,
	type LiquidMetalReflectionTargetsMode,
} from "./data";

export default LiquidMetal;
