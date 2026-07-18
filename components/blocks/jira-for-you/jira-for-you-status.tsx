import { Lozenge, type LozengeProps } from "@/components/ui/lozenge";

import type { JiraForYouStatus } from "./jira-for-you-types";

const STATUS_VARIANTS: Record<
	JiraForYouStatus,
	NonNullable<LozengeProps["variant"]>
> = {
	"Human review": "warning",
	"In progress": "information",
	"In review": "information",
	"To do": "neutral",
	Done: "success",
};

export function JiraForYouStatusLozenge({
	value,
}: Readonly<{
	value: JiraForYouStatus;
}>) {
	return (
		<Lozenge variant={STATUS_VARIANTS[value]}>{value}</Lozenge>
	);
}
