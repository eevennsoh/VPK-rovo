"use client";

import { Button } from "@/components/ui/button";
import AddIcon from "@atlaskit/icon/core/add";
import { TOP_NAV_OVERFLOW_BREAKPOINT_PX } from "../layout-constants";

interface CreateButtonProps {
	windowWidth: number;
}

export function CreateButton({ windowWidth }: Readonly<CreateButtonProps>) {
	if (windowWidth >= TOP_NAV_OVERFLOW_BREAKPOINT_PX) {
		return (
			<Button className="gap-2" variant="default">
				<AddIcon label="" size="small" />
				Create
			</Button>
		);
	}

	return (
		<Button aria-label="Create" size="icon" variant="default">
			<AddIcon label="" />
		</Button>
	);
}
