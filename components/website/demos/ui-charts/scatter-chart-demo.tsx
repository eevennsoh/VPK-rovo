"use client";

import { ChartTooltip, Grid, Scatter, ScatterChart, XAxis, YAxis, chartCssVars } from "@/components/ui-charts";
import { scatterSeries } from "./data";

export function ScatterChartDemoDefault() {
	return (
		<div className="h-full min-h-[240px] w-full p-4">
			<ScatterChart data={scatterSeries} xDataKey="date">
				<Grid horizontal />
				<Scatter dataKey="throughput" fill={chartCssVars.categorical1} />
				<XAxis />
				<YAxis />
				<ChartTooltip />
			</ScatterChart>
		</div>
	);
}

export default ScatterChartDemoDefault;
