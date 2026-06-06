"use client";

import { StatCardLine } from "@/components/ui-charts/stat-card-line-01";

export function StatCardLine01DemoDefault() {
	return (
		<div className="flex h-full min-h-[220px] w-full items-center justify-center p-4">
			<div className="w-full max-w-sm">
				<StatCardLine />
			</div>
		</div>
	);
}

export default StatCardLine01DemoDefault;
