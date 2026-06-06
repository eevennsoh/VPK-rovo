"use client";

import { PieCenter, PieChart, PieSlice } from "@/components/ui-charts";
import { pieSegments } from "./data";

export function PieChartDemoDefault() {
	return (
		<div className="flex h-full min-h-[240px] w-full items-center justify-center p-4">
			<PieChart data={pieSegments} innerRadius={58} size={220}>
				{pieSegments.map((segment, index) => (
					<PieSlice index={index} key={segment.label} />
				))}
				<PieCenter defaultLabel="Total" />
			</PieChart>
		</div>
	);
}

export default PieChartDemoDefault;
