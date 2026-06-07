"use client";

import { Area, AreaChart, ChartTooltip, Grid, XAxis, YAxis, chartCssVars } from "@/components/ui-charts";
import { monthlyRevenue } from "./data";

export function AreaChartDemoDefault() {
	return (
		<div className="h-full min-h-[240px] w-full p-4">
			<AreaChart data={monthlyRevenue} xDataKey="date">
				<Grid horizontal />
				<Area dataKey="revenue" fill={chartCssVars.linePrimary} stroke={chartCssVars.linePrimary} />
				<XAxis />
				<YAxis />
				<ChartTooltip />
			</AreaChart>
		</div>
	);
}

export function AreaChartDemoStacked() {
	return (
		<div className="h-full min-h-[240px] w-full p-4">
			<AreaChart data={monthlyRevenue} xDataKey="date">
				<Grid horizontal />
				<Area dataKey="revenue" fill={chartCssVars.categorical1} stroke={chartCssVars.categorical1} />
				<Area dataKey="forecast" fill={chartCssVars.categorical3} stroke={chartCssVars.categorical3} />
				<XAxis />
				<YAxis />
				<ChartTooltip />
			</AreaChart>
		</div>
	);
}

export default AreaChartDemoDefault;
