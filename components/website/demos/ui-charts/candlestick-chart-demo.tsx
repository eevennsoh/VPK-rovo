"use client";

import { Candlestick, CandlestickChart, ChartTooltip, Grid, XAxis, YAxis } from "@/components/ui-charts";
import { ohlcSeries } from "./data";

export function CandlestickChartDemoDefault() {
	return (
		<div className="h-full min-h-[240px] w-full p-4">
			<CandlestickChart data={ohlcSeries} xDataKey="date">
				<Grid horizontal />
				<Candlestick />
				<XAxis />
				<YAxis />
				<ChartTooltip />
			</CandlestickChart>
		</div>
	);
}

export default CandlestickChartDemoDefault;
