"use client";

import { StatCardArea } from "@/components/ui-charts/stat-card-area-01";

export function StatCardArea01DemoDefault() {
	return (
		<div className="flex h-full min-h-[220px] w-full items-center justify-center p-4">
			<div className="w-full max-w-sm">
				<StatCardArea />
			</div>
		</div>
	);
}

export default StatCardArea01DemoDefault;
