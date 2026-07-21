"use client";

import { ArtifactList } from "@/components/ui-custom/artifact-list";
import {
	COMPACT_SAMPLE_ARTIFACT_ITEMS,
	SAMPLE_ARTIFACT_ITEMS,
} from "@/components/ui-custom/artifact-list/data/sample-items";

export default function ArtifactListPage() {
	return (
		<div className="flex min-h-screen w-full items-center justify-center p-4">
			<div className="grid w-full max-w-xl gap-6">
				<section className="grid gap-2">
					<h2 className="text-sm font-medium text-text">Default</h2>
					<ArtifactList
						items={SAMPLE_ARTIFACT_ITEMS}
						onOpen={(item) => console.log(item.id)}
					/>
				</section>
				<section className="grid gap-2">
					<h2 className="text-sm font-medium text-text">Compact</h2>
					<ArtifactList
						items={COMPACT_SAMPLE_ARTIFACT_ITEMS}
						onOpen={(item) => console.log(item.id)}
						variant="compact"
					/>
				</section>
			</div>
		</div>
	);
}
