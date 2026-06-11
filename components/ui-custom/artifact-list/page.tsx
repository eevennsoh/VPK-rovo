"use client";

import { ArtifactList } from "@/components/ui-custom/artifact-list";
import { SAMPLE_ARTIFACT_ITEMS } from "@/components/ui-custom/artifact-list/data/sample-items";

export default function ArtifactListPage() {
	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<ArtifactList
				className="w-full max-w-xl"
				items={SAMPLE_ARTIFACT_ITEMS}
				onOpen={(item) => console.log(item.id)}
			/>
		</div>
	);
}
