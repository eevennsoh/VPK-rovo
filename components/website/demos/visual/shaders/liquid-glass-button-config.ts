import type { LiquidGlassProps } from "./liquid-glass";

export const LIQUID_GLASS_BUTTON_DEFAULT_GLASS_PROPS = {
	borderRadius: 9999,
	borderWidth: 0.05,
	brightness: 50,
	opacity: 0.9,
	blur: 4,
	backgroundOpacity: 0.18,
	saturation: 1,
	distortionScale: -40,
	dispersion: 4,
	borderColor: "var(--ds-border)",
	borderOpacity: 1,
	dropShadow: false,
} satisfies Partial<LiquidGlassProps>;
