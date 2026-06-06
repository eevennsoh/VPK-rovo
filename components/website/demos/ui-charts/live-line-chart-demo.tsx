"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChartTooltip, Grid, LiveLine, LiveLineChart, LiveXAxis, LiveYAxis } from "@/components/ui-charts";
import { createLiveLineSeries, getLiveLineValue } from "./data";

const LIVE_WINDOW_SECONDS = 30;

export function LiveLineChartDemoDefault() {
	const initialSeries = useMemo(() => createLiveLineSeries(), []);
	const nextIndexRef = useRef(initialSeries.length);
	const [series, setSeries] = useState(initialSeries);
	const latest = series.at(-1)?.value ?? 0;

	useEffect(() => {
		const interval = window.setInterval(() => {
			const nowSeconds = Math.floor(Date.now() / 1000);
			const nextIndex = nextIndexRef.current;
			nextIndexRef.current += 1;

			setSeries((currentSeries) => {
				const previousTime = currentSeries.at(-1)?.time ?? nowSeconds - 1;
				const nextPoint = {
					time: Math.max(nowSeconds, previousTime + 1),
					value: getLiveLineValue(nextIndex),
				};
				return [...currentSeries, nextPoint].slice(-LIVE_WINDOW_SECONDS);
			});
		}, 1000);

		return () => window.clearInterval(interval);
	}, []);

	return (
		<div className="h-full min-h-[240px] w-full p-4">
			<LiveLineChart data={series} value={latest} window={LIVE_WINDOW_SECONDS}>
				<Grid horizontal />
				<LiveLine dataKey="value" />
				<LiveXAxis />
				<LiveYAxis />
				<ChartTooltip />
			</LiveLineChart>
		</div>
	);
}

export default LiveLineChartDemoDefault;
