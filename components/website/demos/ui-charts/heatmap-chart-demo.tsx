"use client";

import {
	HeatmapCells,
	HeatmapChart,
	HeatmapInteractionBoundary,
	HeatmapInteractionProvider,
	HeatmapLegend,
	HeatmapTooltip,
	HeatmapXAxis,
	HeatmapYAxis,
} from "@/components/ui-charts";
import { contributionHeatmapSeries } from "./data";

export function HeatmapChartDemoDefault() {
	return (
		<div className="h-full min-h-[260px] w-full p-4">
			<HeatmapInteractionProvider>
				<HeatmapInteractionBoundary className="flex flex-col justify-center gap-3">
					<HeatmapChart data={contributionHeatmapSeries} margin={{ left: 36, right: 12, top: 28, bottom: 0 }}>
						<HeatmapCells />
						<HeatmapXAxis />
						<HeatmapYAxis />
						<HeatmapTooltip />
					</HeatmapChart>
					<HeatmapLegend />
				</HeatmapInteractionBoundary>
			</HeatmapInteractionProvider>
		</div>
	);
}

export default HeatmapChartDemoDefault;
