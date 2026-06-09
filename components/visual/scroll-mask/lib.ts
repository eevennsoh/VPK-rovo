import type { CSSProperties } from "react";

export const SCROLL_MASK_DEFAULT_FADE_SIZE = "var(--ds-space-400)";
export const SCROLL_MASK_DEFAULT_SCROLLBAR_WIDTH = "10px";

export interface ScrollMaskStyleOptions {
	fadeSize?: number | string;
	scrollbarWidth?: number | string;
}

export interface HorizontalScrollMaskStyleOptions {
	edge?: "start" | "end" | "both";
	endGutterWidth?: number | string;
	fadeSize?: number | string;
}

type ScrollMaskCssProperties = CSSProperties & {
	"--scroll-mask-fade-size": string;
	"--scroll-mask-end-gutter-width"?: string;
};

type VerticalScrollMaskCssProperties = ScrollMaskCssProperties & {
	"--scroll-mask-scrollbar-width": string;
};

function toCssLength(value: number | string): string {
	return typeof value === "number" ? `${value}px` : value;
}

export function buildScrollMaskStyle({
	fadeSize = SCROLL_MASK_DEFAULT_FADE_SIZE,
	scrollbarWidth = SCROLL_MASK_DEFAULT_SCROLLBAR_WIDTH,
}: ScrollMaskStyleOptions = {}): VerticalScrollMaskCssProperties {
	const resolvedFadeSize = toCssLength(fadeSize);
	const resolvedScrollbarWidth = toCssLength(scrollbarWidth);
	const maskImage = [
		"linear-gradient(to bottom, transparent 0, black var(--scroll-mask-fade-size), black calc(100% - var(--scroll-mask-fade-size)), transparent 100%)",
		"linear-gradient(black, black)",
	].join(", ");
	const maskSize = `calc(100% - ${resolvedScrollbarWidth}) 100%, ${resolvedScrollbarWidth} 100%`;

	return {
		"--scroll-mask-fade-size": resolvedFadeSize,
		"--scroll-mask-scrollbar-width": resolvedScrollbarWidth,
		maskImage,
		WebkitMaskImage: maskImage,
		maskPosition: "0 0, 100% 0",
		WebkitMaskPosition: "0 0, 100% 0",
		maskRepeat: "no-repeat, no-repeat",
		WebkitMaskRepeat: "no-repeat, no-repeat",
		maskSize,
		WebkitMaskSize: maskSize,
	};
}

export function buildHorizontalScrollMaskStyle({
	edge = "both",
	endGutterWidth,
	fadeSize = SCROLL_MASK_DEFAULT_FADE_SIZE,
}: HorizontalScrollMaskStyleOptions = {}): ScrollMaskCssProperties {
	const resolvedFadeSize = toCssLength(fadeSize);
	const resolvedEndGutterWidth = endGutterWidth === undefined ? undefined : toCssLength(endGutterWidth);
	const maskImageByEdge = {
		both: "linear-gradient(to right, transparent 0, black var(--scroll-mask-fade-size), black calc(100% - var(--scroll-mask-fade-size)), transparent 100%)",
		end: "linear-gradient(to right, black 0, black calc(100% - var(--scroll-mask-fade-size)), transparent 100%)",
		start: "linear-gradient(to right, transparent 0, black var(--scroll-mask-fade-size), black 100%)",
	} satisfies Record<NonNullable<HorizontalScrollMaskStyleOptions["edge"]>, string>;
	const maskImage = resolvedEndGutterWidth
		? [maskImageByEdge[edge], "linear-gradient(black, black)"].join(", ")
		: maskImageByEdge[edge];
	const maskPosition = resolvedEndGutterWidth ? "0 0, 100% 0" : "0 0";
	const maskRepeat = resolvedEndGutterWidth ? "no-repeat, no-repeat" : "no-repeat";
	const maskSize = resolvedEndGutterWidth
		? `calc(100% - ${resolvedEndGutterWidth}) 100%, ${resolvedEndGutterWidth} 100%`
		: "100% 100%";

	return {
		"--scroll-mask-fade-size": resolvedFadeSize,
		...(resolvedEndGutterWidth ? { "--scroll-mask-end-gutter-width": resolvedEndGutterWidth } : {}),
		maskImage,
		WebkitMaskImage: maskImage,
		maskPosition,
		WebkitMaskPosition: maskPosition,
		maskRepeat,
		WebkitMaskRepeat: maskRepeat,
		maskSize,
		WebkitMaskSize: maskSize,
	};
}
