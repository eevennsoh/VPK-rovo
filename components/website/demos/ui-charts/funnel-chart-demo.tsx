"use client";

import { FunnelChart, chartCssVars } from "@/components/ui-charts";
import { compactNumber, funnelStages } from "./data";

export function FunnelChartDemoDefault() {
	return (
		<div className="h-full min-h-[240px] w-full p-4">
			<FunnelChart
				color={chartCssVars.categorical1}
				data={funnelStages}
				formatValue={compactNumber}
				grid
				showValues
			/>
		</div>
	);
}

export default FunnelChartDemoDefault;
