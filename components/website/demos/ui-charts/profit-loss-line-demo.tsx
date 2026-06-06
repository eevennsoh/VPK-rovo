"use client";

import { ChartTooltip, Grid, LineChart, ProfitLossLine, XAxis, YAxis } from "@/components/ui-charts";
import { profitLossSeries } from "./data";

export function ProfitLossLineDemoDefault() {
	return (
		<div className="h-full min-h-[240px] w-full p-4">
			<LineChart data={profitLossSeries} xDataKey="date">
				<Grid horizontal highlightRowValues={[0]} />
				<ProfitLossLine dataKey="pnl" />
				<XAxis />
				<YAxis />
				<ChartTooltip />
			</LineChart>
		</div>
	);
}

export default ProfitLossLineDemoDefault;
