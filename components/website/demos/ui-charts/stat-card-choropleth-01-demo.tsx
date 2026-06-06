"use client";

import { StatCardChoropleth } from "@/components/ui-charts/stat-card-choropleth-01";

export function StatCardChoropleth01DemoDefault() {
	return (
		<div className="flex h-full min-h-[220px] w-full items-center justify-center p-4">
			<div className="w-full max-w-sm">
				<StatCardChoropleth />
			</div>
		</div>
	);
}

export default StatCardChoropleth01DemoDefault;
