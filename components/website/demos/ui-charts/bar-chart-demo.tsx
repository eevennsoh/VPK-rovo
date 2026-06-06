"use client";

import { Bar, BarChart, BarXAxis, ChartTooltip, Grid, YAxis, chartCssVars } from "@/components/ui-charts";
import { categoryVolume } from "./data";

export function BarChartDemoDefault() {
	return (
		<div className="h-full min-h-[240px] w-full p-4">
			<BarChart data={categoryVolume} xDataKey="name">
				<Grid horizontal />
				<Bar dataKey="active" fill={chartCssVars.categorical1} />
				<BarXAxis />
				<YAxis />
				<ChartTooltip />
			</BarChart>
		</div>
	);
}

export function BarChartDemoStacked() {
	return (
		<div className="h-full min-h-[240px] w-full p-4">
			<BarChart data={categoryVolume} stacked xDataKey="name">
				<Grid horizontal />
				<Bar dataKey="active" fill={chartCssVars.categorical1} />
				<Bar dataKey="queued" fill={chartCssVars.categorical3} />
				<BarXAxis />
				<YAxis />
				<ChartTooltip />
			</BarChart>
		</div>
	);
}

export default BarChartDemoDefault;
