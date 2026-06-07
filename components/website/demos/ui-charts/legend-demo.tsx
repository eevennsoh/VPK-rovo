"use client";

import { Legend, LegendItem, LegendLabel, LegendMarker, LegendProgress, LegendValue, chartCssVars } from "@/components/ui-charts";
import { percent } from "./data";

const legendItems = [
	{ label: "Google Search", value: 70, maxValue: 100, color: chartCssVars.categorical1 },
	{ label: "Display Ads", value: 58, maxValue: 100, color: chartCssVars.categorical4 },
	{ label: "Newsletter", value: 71, maxValue: 100, color: chartCssVars.categorical2 },
	{ label: "Social", value: 58, maxValue: 100, color: chartCssVars.categorical3 },
];

export function LegendDemoDefault() {
	return (
		<div className="flex h-full min-h-[240px] w-full items-center justify-center p-4">
			<Legend
				className="w-full max-w-sm rounded-lg border border-border bg-surface-overlay p-4 shadow-sm"
				items={legendItems}
				title="Campaign Performance"
				titleClassName="text-sm font-semibold text-text"
			>
				<LegendItem className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1">
					<LegendMarker />
					<LegendLabel className="truncate text-sm font-medium" />
					<LegendValue className="justify-end text-sm tabular-nums" formatValue={percent} />
					<div className="col-span-3">
						<LegendProgress />
					</div>
				</LegendItem>
			</Legend>
		</div>
	);
}

export default LegendDemoDefault;
