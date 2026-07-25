export type CardGlowTheme = "system" | "light" | "dark";

export interface CardGlowConfig {
	theme: CardGlowTheme;
	iconBlur: number;
	iconSaturate: number;
	iconBrightness: number;
	iconContrast: number;
	iconScale: number;
	iconOpacity: number;
	borderSpread: number;
	borderWidth: number;
	borderBlur: number;
	borderSaturate: number;
	borderBrightness: number;
	borderContrast: number;
	exclude: boolean;
	css: boolean;
}

export const CARD_GLOW_DEFAULT_CONFIG: CardGlowConfig = {
	theme: "light",
	iconBlur: 28,
	iconSaturate: 5,
	iconBrightness: 1.3,
	iconContrast: 1.4,
	iconScale: 3.4,
	iconOpacity: 0.25,
	borderSpread: 120,
	borderWidth: 1,
	borderBlur: 0,
	borderSaturate: 4.2,
	borderBrightness: 2.5,
	borderContrast: 2.5,
	exclude: false,
	css: true,
};
