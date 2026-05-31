"use client";

import { Button } from "@/components/ui/button";
import AddIcon from "@atlaskit/icon/core/add";

export function CreateButton() {
	return (
		<Button
			variant="default"
			aria-label="Create"
			className="gap-2 max-md:size-8 max-md:gap-0 max-md:px-0"
		>
			<AddIcon label="" size="small" />
			<span className="max-md:hidden">Create</span>
		</Button>
	);
}
