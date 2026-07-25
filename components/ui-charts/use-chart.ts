import {
	useChartHover,
	useChartStable,
	type ChartContextValue,
} from "./chart-context";

/**
 * Merged stable + hover context for consumers that intentionally re-render on
 * pointer movement. Prefer the slice hooks when only one context is needed.
 */
export function useChart(): ChartContextValue {
	return { ...useChartStable(), ...useChartHover() };
}
