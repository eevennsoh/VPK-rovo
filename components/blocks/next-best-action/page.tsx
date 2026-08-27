"use client";

import { NextBestAction } from "@/components/blocks/next-best-action";
import {
	COMPACT_SAMPLE_NEXT_BEST_ACTIONS,
	SAMPLE_NEXT_BEST_ACTIONS,
} from "@/components/blocks/next-best-action/data/sample-items";

export default function NextBestActionPage() {
	return (
		<div className="flex min-h-screen w-full items-center justify-center p-4">
			<div className="grid w-full max-w-xl gap-6">
				<section className="grid gap-2">
					<h2 className="text-sm font-medium text-text">Default</h2>
					<NextBestAction
						items={SAMPLE_NEXT_BEST_ACTIONS}
						onAct={(item) => console.log(item.id)}
					/>
				</section>
				<section className="grid gap-2">
					<h2 className="text-sm font-medium text-text">Compact</h2>
					<NextBestAction
						items={COMPACT_SAMPLE_NEXT_BEST_ACTIONS}
						onAct={(item) => console.log(item.id)}
						variant="compact"
					/>
				</section>
			</div>
		</div>
	);
}
