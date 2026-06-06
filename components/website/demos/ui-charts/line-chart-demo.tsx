"use client";

import { ChartTooltip, Grid, Line, LineChart, XAxis, YAxis, chartCssVars } from "@/components/ui-charts";
import { monthlyRevenue } from "./data";

export function LineChartDemoDefault() {
	return (
		<div className="h-full min-h-[240px] w-full p-4">
			<LineChart data={monthlyRevenue} xDataKey="date">
				<Grid horizontal />
				<Line dataKey="revenue" stroke={chartCssVars.linePrimary} />
				<XAxis />
				<YAxis />
				<ChartTooltip />
			</LineChart>
		</div>
	);
}

export function LineChartDemoMultiple() {
	return (
		<div className="h-full min-h-[240px] w-full p-4">
			<LineChart data={monthlyRevenue} xDataKey="date">
				<Grid horizontal />
				<Line dataKey="revenue" stroke={chartCssVars.categorical1} />
				<Line dataKey="forecast" stroke={chartCssVars.categorical3} />
				<XAxis />
				<YAxis />
				<ChartTooltip />
			</LineChart>
		</div>
	);
}

export default LineChartDemoDefault;
