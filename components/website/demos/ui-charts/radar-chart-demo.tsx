"use client";

import { useMemo, useState } from "react";
import { Legend, LegendItem, LegendLabel, LegendMarker, LegendProgress, LegendValue, RadarArea, RadarAxis, RadarChart, RadarGrid, RadarLabels, chartCssVars } from "@/components/ui-charts";
import { createRadarLegendItems, percent, radarMetrics, radarSeries } from "./data";

const radarPalette = [
	chartCssVars.categorical1,
	chartCssVars.categorical4,
	chartCssVars.categorical2,
	chartCssVars.categorical3,
] as const;

export function RadarChartDemoDefault() {
	const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
	const series = useMemo(
		() =>
			radarSeries.map((item, index) => ({
				...item,
				color: radarPalette[index] ?? chartCssVars.categorical5,
			})),
		[],
	);
	const legendItems = useMemo(() => createRadarLegendItems(series), [series]);

	return (
		<div className="grid h-full min-h-[300px] w-full gap-4 p-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
			<div className="flex min-h-[260px] items-center justify-center">
				<RadarChart data={series} hoveredIndex={hoveredIndex} metrics={radarMetrics} onHoverChange={setHoveredIndex}>
					<RadarGrid />
					<RadarAxis />
					{series.map((item, index) => (
						<RadarArea index={index} key={item.label} />
					))}
					<RadarLabels />
				</RadarChart>
			</div>
			<Legend
				className="rounded-lg border border-border bg-surface-overlay p-3 shadow-sm"
				hoveredIndex={hoveredIndex}
				items={legendItems}
				onHoverChange={setHoveredIndex}
				title="Campaign Performance"
				titleClassName="text-sm font-semibold text-text"
			>
				<LegendItem className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1">
					<LegendMarker />
					<LegendLabel className="truncate text-xs font-medium" />
					<LegendValue className="justify-end text-xs tabular-nums" formatValue={percent} />
					<div className="col-span-3">
						<LegendProgress height="h-1" />
					</div>
				</LegendItem>
			</Legend>
		</div>
	);
}

export default RadarChartDemoDefault;
