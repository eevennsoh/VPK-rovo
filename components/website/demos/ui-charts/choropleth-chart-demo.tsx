"use client";

import { ChoroplethChart, ChoroplethFeatureComponent, ChoroplethGraticule, ChoroplethTooltip } from "@/components/ui-charts";
import { getVisitorColor, getVisitorValue } from "@/components/ui-charts/stat-card-choropleth-01/data/visitors";
import { useWorldDataStandalone } from "@/components/ui-charts/stat-card-choropleth-01/lib/use-world-data";

export function ChoroplethChartDemoDefault() {
	const { worldData } = useWorldDataStandalone();

	if (!worldData) {
		return <div className="flex h-full min-h-[240px] items-center justify-center text-sm text-text-subtle">Loading map data</div>;
	}

	return (
		<div className="h-full min-h-[240px] w-full p-4">
			<ChoroplethChart data={worldData} scale={105}>
				<ChoroplethGraticule />
				<ChoroplethFeatureComponent getFeatureColor={getVisitorColor} />
				<ChoroplethTooltip getFeatureValue={getVisitorValue} valueLabel="Visitors" />
			</ChoroplethChart>
		</div>
	);
}

export default ChoroplethChartDemoDefault;
