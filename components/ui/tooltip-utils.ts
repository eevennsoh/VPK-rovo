import { createElement, type ReactElement, type ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function withTooltip(trigger: ReactElement, content?: ReactNode): ReactElement {
	if (!content) {
		return trigger;
	}

	return createElement(
		Tooltip,
		null,
		createElement(TooltipTrigger, { render: trigger }),
		createElement(TooltipContent, null, content),
	);
}
