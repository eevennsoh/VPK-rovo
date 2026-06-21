"use client";

export type GUIRGBAColor = [number, number, number, number];
export type GUIHSLAColor = [number, number, number, number];

export function clampGUIValue(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function clampUnit(value: number): number {
	return clampGUIValue(value, 0, 1);
}

function clampByte(value: number): number {
	return clampGUIValue(Math.round(value), 0, 255);
}

function normalizeHue(value: number): number {
	const normalized = value % 360;
	return normalized < 0 ? normalized + 360 : normalized;
}

function toHexByte(value: number): string {
	return clampByte(value).toString(16).padStart(2, "0");
}

export function normalizeGUIColorValue(value: string): string {
	return value.trim().toLowerCase();
}

export function isGUIHexColor(value: string): boolean {
	return /^#[0-9a-f]{6}$/iu.test(value.trim());
}

function expandGUIHexToRgbHex(value: string): string | null {
	const clean = value.trim().replace(/^#/u, "");

	if (![3, 4, 6, 8].includes(clean.length) || !/^[0-9a-f]+$/iu.test(clean)) {
		return null;
	}

	const expanded = clean.length === 3 || clean.length === 4
		? clean
				.split("")
				.map((char) => `${char}${char}`)
				.join("")
		: clean;

	return `#${expanded.slice(0, 6)}`.toUpperCase();
}

function parseGUIRgbChannel(value: string): number | null {
	const trimmed = value.trim();
	if (!trimmed) return null;

	if (trimmed.endsWith("%")) {
		const parsed = Number(trimmed.slice(0, -1));
		return Number.isFinite(parsed) ? clampGUIValue(parsed, 0, 100) * 2.55 : null;
	}

	const parsed = Number(trimmed);
	return Number.isFinite(parsed) ? parsed : null;
}

function parseGUIPercentChannel(value: string): number | null {
	const trimmed = value.trim();
	const parsed = Number(trimmed.endsWith("%") ? trimmed.slice(0, -1) : trimmed);
	return Number.isFinite(parsed) ? parsed : null;
}

function parseGUIHue(value: string): number | null {
	const trimmed = value.trim().toLowerCase();
	const unitMatch = trimmed.match(/^(-?\d+(?:\.\d+)?)(deg|turn|rad|grad)?$/u);
	if (!unitMatch) return null;

	const parsed = Number(unitMatch[1]);
	if (!Number.isFinite(parsed)) return null;

	switch (unitMatch[2]) {
		case "turn":
			return parsed * 360;
		case "rad":
			return parsed * (180 / Math.PI);
		case "grad":
			return parsed * 0.9;
		default:
			return parsed;
	}
}

function splitGUIFunctionalColorArgs(value: string, functionName: string): string[] | null {
	const match = value.trim().match(new RegExp(`^${functionName}a?\\((.*)\\)$`, "iu"));
	if (!match) return null;

	const withoutAlpha = match[1]?.split("/")[0] ?? "";
	return withoutAlpha.includes(",")
		? withoutAlpha.split(",").map((part) => part.trim()).filter(Boolean)
		: withoutAlpha.trim().split(/\s+/u).filter(Boolean);
}

export function parseGUIColorToRgbHex(value: string): string | null {
	const hex = expandGUIHexToRgbHex(value);
	if (hex) return hex;

	const rgbParts = splitGUIFunctionalColorArgs(value, "rgb");
	if (rgbParts && rgbParts.length >= 3) {
		const channels = rgbParts.slice(0, 3).map(parseGUIRgbChannel);
		if (channels.every((channel): channel is number => channel !== null)) {
			return `#${channels.map((channel) => toHexByte(channel)).join("")}`.toUpperCase();
		}
	}

	const hslParts = splitGUIFunctionalColorArgs(value, "hsl");
	if (hslParts && hslParts.length >= 3) {
		const hue = parseGUIHue(hslParts[0] ?? "");
		const saturation = parseGUIPercentChannel(hslParts[1] ?? "");
		const lightness = parseGUIPercentChannel(hslParts[2] ?? "");
		if (hue !== null && saturation !== null && lightness !== null) {
			return rgbaUnitToRgbHex(hslaToRgbaUnit(hue, saturation, lightness, 1));
		}
	}

	return null;
}

export function resolveGUIColorPickerValue(value: string, fallback?: string): string {
	const parsed = parseGUIColorToRgbHex(value);
	if (parsed) {
		return parsed;
	}

	const parsedFallback = fallback ? parseGUIColorToRgbHex(fallback) : null;
	if (parsedFallback) {
		return parsedFallback;
	}

	return "#000000";
}

export function areGUIColorListsEqual(
	a: readonly string[],
	b: readonly string[],
): boolean {
	return a.length === b.length
		&& a.every((value, index) => normalizeGUIColorValue(value) === normalizeGUIColorValue(b[index] ?? ""));
}

export function rgbaUnitToRgb255(color: GUIRGBAColor): [number, number, number] {
	return [
		clampByte(color[0] * 255),
		clampByte(color[1] * 255),
		clampByte(color[2] * 255),
	];
}

export function rgbaUnitToHex(color: GUIRGBAColor): string {
	return `#${toHexByte(color[0] * 255)}${toHexByte(color[1] * 255)}${toHexByte(color[2] * 255)}${toHexByte(color[3] * 255)}`.toUpperCase();
}

export function rgbaUnitToRgbHex(color: GUIRGBAColor): string {
	return `#${toHexByte(color[0] * 255)}${toHexByte(color[1] * 255)}${toHexByte(color[2] * 255)}`.toUpperCase();
}

export function rgbaUnitToCss(color: GUIRGBAColor): string {
	const [r, g, b] = rgbaUnitToRgb255(color);
	return `rgba(${r}, ${g}, ${b}, ${color[3].toFixed(3)})`;
}

export function rgbaUnitToHsla(color: GUIRGBAColor): GUIHSLAColor {
	const r = clampUnit(color[0]);
	const g = clampUnit(color[1]);
	const b = clampUnit(color[2]);
	const a = clampUnit(color[3]);

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const delta = max - min;
	const lightness = (max + min) / 2;

	let hue = 0;
	let saturation = 0;

	if (delta !== 0) {
		saturation = delta / (1 - Math.abs(2 * lightness - 1));

		switch (max) {
			case r:
				hue = 60 * (((g - b) / delta) % 6);
				break;
			case g:
				hue = 60 * ((b - r) / delta + 2);
				break;
			default:
				hue = 60 * ((r - g) / delta + 4);
				break;
		}
	}

	return [
		normalizeHue(hue),
		clampGUIValue(saturation * 100, 0, 100),
		clampGUIValue(lightness * 100, 0, 100),
		a,
	];
}

export function hslaToRgbaUnit(h: number, s: number, l: number, a: number): GUIRGBAColor {
	const hue = normalizeHue(h);
	const saturation = clampGUIValue(s, 0, 100) / 100;
	const lightness = clampGUIValue(l, 0, 100) / 100;
	const alpha = clampUnit(a);

	const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
	const huePrime = hue / 60;
	const x = chroma * (1 - Math.abs((huePrime % 2) - 1));

	let rPrime = 0;
	let gPrime = 0;
	let bPrime = 0;

	if (huePrime >= 0 && huePrime < 1) {
		rPrime = chroma;
		gPrime = x;
	} else if (huePrime < 2) {
		rPrime = x;
		gPrime = chroma;
	} else if (huePrime < 3) {
		gPrime = chroma;
		bPrime = x;
	} else if (huePrime < 4) {
		gPrime = x;
		bPrime = chroma;
	} else if (huePrime < 5) {
		rPrime = x;
		bPrime = chroma;
	} else {
		rPrime = chroma;
		bPrime = x;
	}

	const match = lightness - chroma / 2;

	return [
		clampUnit(rPrime + match),
		clampUnit(gPrime + match),
		clampUnit(bPrime + match),
		alpha,
	];
}

export function hexToRgbaUnit(hex: string, fallbackAlpha = 1): GUIRGBAColor | null {
	const clean = hex.trim().replace(/^#/u, "");

	if (![3, 4, 6, 8].includes(clean.length)) {
		return null;
	}

	const expanded =
		clean.length === 3 || clean.length === 4
			? clean
					.split("")
					.map((char) => `${char}${char}`)
					.join("")
			: clean;

	const hasExplicitAlpha = expanded.length === 8;
	const normalized = hasExplicitAlpha
		? expanded
		: `${expanded}${toHexByte(clampUnit(fallbackAlpha) * 255)}`;

	if (!/^[0-9a-fA-F]{8}$/u.test(normalized)) {
		return null;
	}

	return [
		parseInt(normalized.slice(0, 2), 16) / 255,
		parseInt(normalized.slice(2, 4), 16) / 255,
		parseInt(normalized.slice(4, 6), 16) / 255,
		parseInt(normalized.slice(6, 8), 16) / 255,
	];
}

export function rgbaColorsEqual(a: GUIRGBAColor, b: GUIRGBAColor): boolean {
	return a.every((value, index) => value === b[index]);
}
