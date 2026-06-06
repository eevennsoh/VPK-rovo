"use client";

import { Gauge, chartCssVars } from "@/components/ui-charts";

export function GaugeChartDemoDefault() {
	return (
		<div className="flex h-full min-h-[240px] w-full items-center justify-center p-4">
			<Gauge
				activeFill={chartCssVars.categorical1}
				centerValue={76}
				defaultLabel="Readiness"
				inactiveFill={chartCssVars.ringBackground}
				suffix="%"
				value={76}
			/>
		</div>
	);
}

export default GaugeChartDemoDefault;
