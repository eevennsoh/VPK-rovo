import type { HeatmapColumn, LegendItemData, SankeyData } from "@/components/ui-charts";

export const monthlyRevenue = [
	{ date: new Date("2026-01-01"), revenue: 42, forecast: 36, cost: 24, margin: 18 },
	{ date: new Date("2026-02-01"), revenue: 48, forecast: 41, cost: 27, margin: 21 },
	{ date: new Date("2026-03-01"), revenue: 44, forecast: 46, cost: 29, margin: 15 },
	{ date: new Date("2026-04-01"), revenue: 56, forecast: 50, cost: 31, margin: 25 },
	{ date: new Date("2026-05-01"), revenue: 63, forecast: 58, cost: 34, margin: 29 },
	{ date: new Date("2026-06-01"), revenue: 71, forecast: 65, cost: 38, margin: 33 },
];

export const categoryVolume = [
	{ name: "Search", active: 42, queued: 12 },
	{ name: "Rovo", active: 58, queued: 18 },
	{ name: "Studio", active: 46, queued: 9 },
	{ name: "Graph", active: 34, queued: 14 },
	{ name: "Voice", active: 25, queued: 7 },
];

export const ohlcSeries = [
	{ date: new Date("2026-01-01"), open: 84, high: 98, low: 80, close: 93 },
	{ date: new Date("2026-01-02"), open: 93, high: 101, low: 88, close: 90 },
	{ date: new Date("2026-01-03"), open: 90, high: 106, low: 89, close: 104 },
	{ date: new Date("2026-01-04"), open: 104, high: 112, low: 99, close: 108 },
	{ date: new Date("2026-01-05"), open: 108, high: 111, low: 96, close: 99 },
	{ date: new Date("2026-01-06"), open: 99, high: 118, low: 97, close: 115 },
];

export const profitLossSeries = [
	{ date: new Date("2026-01-01"), pnl: 12 },
	{ date: new Date("2026-02-01"), pnl: 18 },
	{ date: new Date("2026-03-01"), pnl: -8 },
	{ date: new Date("2026-04-01"), pnl: 9 },
	{ date: new Date("2026-05-01"), pnl: -4 },
	{ date: new Date("2026-06-01"), pnl: 22 },
];

const LIVE_LINE_POINT_COUNT = 32;

export function getLiveLineValue(index: number) {
	return 58 + Math.sin(index / 2.2) * 14 + Math.cos(index / 5) * 5;
}

export function createLiveLineSeries(nowSeconds = Math.floor(Date.now() / 1000)) {
	return Array.from({ length: LIVE_LINE_POINT_COUNT }, (_, index) => ({
		time: nowSeconds - (LIVE_LINE_POINT_COUNT - 1 - index),
		value: getLiveLineValue(index),
	}));
}

export const liveLineSeries = createLiveLineSeries();

export const pieSegments = [
	{ label: "Build", value: 38 },
	{ label: "Review", value: 24 },
	{ label: "Ship", value: 18 },
	{ label: "Support", value: 20 },
];

export const radarMetrics = [
	{ key: "awareness", label: "Awareness" },
	{ key: "engagement", label: "Engagement" },
	{ key: "conversion", label: "Conversion" },
	{ key: "retention", label: "Retention" },
	{ key: "efficiency", label: "Efficiency" },
];

export const radarSeries = [
	{ label: "Google Search", values: { awareness: 74, engagement: 68, conversion: 71, retention: 69, efficiency: 68 } },
	{ label: "Display Ads", values: { awareness: 78, engagement: 55, conversion: 45, retention: 52, efficiency: 60 } },
	{ label: "Newsletter", values: { awareness: 62, engagement: 74, conversion: 76, retention: 73, efficiency: 70 } },
	{ label: "Social", values: { awareness: 66, engagement: 70, conversion: 54, retention: 48, efficiency: 52 } },
];

export function averageRadarValue(series: (typeof radarSeries)[number]) {
	const values = Object.values(series.values);
	return values.reduce((total, value) => total + value, 0) / values.length;
}

export function createRadarLegendItems(
	series: Array<(typeof radarSeries)[number] & { color: string }>,
): LegendItemData[] {
	return series.map((item) => ({
		label: item.label,
		value: averageRadarValue(item),
		maxValue: 100,
		color: item.color,
	}));
}

export const ringSeries = [
	{ label: "Adoption", value: 72, maxValue: 100 },
	{ label: "Coverage", value: 58, maxValue: 100 },
	{ label: "Velocity", value: 84, maxValue: 100 },
];

export const scatterSeries = [
	{ date: new Date("2026-01-01"), defects: 12, throughput: 38 },
	{ date: new Date("2026-02-01"), defects: 9, throughput: 44 },
	{ date: new Date("2026-03-01"), defects: 14, throughput: 42 },
	{ date: new Date("2026-04-01"), defects: 7, throughput: 55 },
	{ date: new Date("2026-05-01"), defects: 6, throughput: 63 },
	{ date: new Date("2026-06-01"), defects: 4, throughput: 71 },
];

export const funnelStages = [
	{ label: "Ideas", value: 920 },
	{ label: "Scoped", value: 540 },
	{ label: "Built", value: 310 },
	{ label: "Validated", value: 190 },
	{ label: "Shipped", value: 128 },
];

export const sankeyData: SankeyData = {
	nodes: [
		{ name: "Requests", category: "source" },
		{ name: "Templates", category: "landing" },
		{ name: "Custom agents", category: "landing" },
		{ name: "Automations", category: "landing" },
		{ name: "Resolved", category: "outcome" },
		{ name: "Escalated", category: "outcome" },
	],
	links: [
		{ source: 0, target: 1, value: 34 },
		{ source: 0, target: 2, value: 28 },
		{ source: 0, target: 3, value: 18 },
		{ source: 1, target: 4, value: 29 },
		{ source: 2, target: 4, value: 21 },
		{ source: 3, target: 4, value: 14 },
		{ source: 2, target: 5, value: 7 },
		{ source: 3, target: 5, value: 4 },
	],
};

const HEATMAP_WEEK_COUNT = 18;
const HEATMAP_DAYS_PER_WEEK = 7;
const HEATMAP_START_DATE = Date.UTC(2026, 0, 4);

export const contributionHeatmapSeries: HeatmapColumn[] = Array.from(
	{ length: HEATMAP_WEEK_COUNT },
	(_, columnIndex) => ({
		bin: columnIndex,
		bins: Array.from({ length: HEATMAP_DAYS_PER_WEEK }, (_, rowIndex) => {
			const date = new Date(HEATMAP_START_DATE);
			date.setUTCDate(date.getUTCDate() + columnIndex * HEATMAP_DAYS_PER_WEEK + rowIndex);

			const wave = Math.sin((columnIndex + rowIndex) / 2.4);
			const cadence = (columnIndex * 3 + rowIndex * 2) % 5;
			const count = Math.max(0, Math.min(5, Math.round(wave * 2 + cadence)));

			return {
				bin: rowIndex,
				count,
				date,
			};
		}),
	}),
);

export function compactNumber(value: number) {
	return Intl.NumberFormat("en-US", { notation: "compact" }).format(value);
}

export function percent(value: number) {
	return `${Math.round(value)}%`;
}
