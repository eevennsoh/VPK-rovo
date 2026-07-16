"use client";

import { Button } from "@/components/ui/button";
import AddIcon from "@atlaskit/icon/core/add";

// Figma keeps the full "+ Create" label at every breakpoint (1768 → 320), so the
// button never collapses to an icon-only state — it stays a labelled pill even at
// the narrowest viewport.
export function CreateButton() {
	return (
		<Button variant="default" aria-label="Create" className="shrink-0 gap-2">
			<AddIcon label="" />
			<span>Create</span>
		</Button>
	);
}
