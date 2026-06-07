"use client";

import { SankeyChart, SankeyLink, SankeyNode, SankeyTooltip } from "@/components/ui-charts";
import { sankeyData } from "./data";

export function SankeyChartDemoDefault() {
	return (
		<div className="h-full min-h-[260px] w-full p-4">
			<SankeyChart data={sankeyData} margin={{ left: 116, right: 116 }}>
				<SankeyLink />
				<SankeyNode />
				<SankeyTooltip />
			</SankeyChart>
		</div>
	);
}

export default SankeyChartDemoDefault;
