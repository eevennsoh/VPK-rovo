"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AddIcon from "@atlaskit/icon/core/add";

interface CreateButtonProps {
	/** Collapse to an icon-only button when the nav runs low on horizontal space. */
	collapsed?: boolean;
}

export function CreateButton({ collapsed = false }: Readonly<CreateButtonProps>) {
	return (
		<Button
			variant="default"
			aria-label="Create"
			className={cn("gap-2", collapsed && "size-8 gap-0 px-0")}
		>
			<AddIcon label="" size="small" />
			<span className={cn(collapsed && "hidden")}>Create</span>
		</Button>
	);
}
