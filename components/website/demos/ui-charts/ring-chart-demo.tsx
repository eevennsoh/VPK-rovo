"use client";

import { Ring, RingCenter, RingChart } from "@/components/ui-charts";
import { ringSeries } from "./data";

export function RingChartDemoDefault() {
	return (
		<div className="flex h-full min-h-[240px] w-full items-center justify-center p-4">
			<RingChart data={ringSeries} size={220}>
				{ringSeries.map((series, index) => (
					<Ring index={index} key={series.label} />
				))}
				<RingCenter defaultLabel="Total" />
			</RingChart>
		</div>
	);
}

export default RingChartDemoDefault;
