"use client";

import { ChartTooltip, ComposedChart, Grid, Line, SeriesBar, XAxis, YAxis, chartCssVars } from "@/components/ui-charts";
import { monthlyRevenue } from "./data";

export function ComposedChartDemoDefault() {
	return (
		<div className="h-full min-h-[240px] w-full p-4">
			<ComposedChart data={monthlyRevenue} xDataKey="date">
				<Grid horizontal />
				<SeriesBar dataKey="revenue" fill={chartCssVars.categorical4} radius={4} />
				<Line dataKey="forecast" stroke={chartCssVars.categorical1} />
				<XAxis />
				<YAxis />
				<ChartTooltip />
			</ComposedChart>
		</div>
	);
}

export default ComposedChartDemoDefault;
