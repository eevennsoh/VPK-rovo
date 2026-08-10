
import type {
	PullRequestHeaderProps,
	PullRequestHeaderVariant,
} from "@/components/blocks/pull-request-header/components/pull-request-header-types";

const DEFAULT_COLLAPSE_OFFSET = 16;

export function resolveVariant({
	variant,
	scrollContainerRef,
	collapseOffset = DEFAULT_COLLAPSE_OFFSET,
}: Pick<
	PullRequestHeaderProps,
	"variant" | "scrollContainerRef" | "collapseOffset"
>): PullRequestHeaderVariant {
	if (variant) {
		return variant;
	}

	return (scrollContainerRef?.current?.scrollTop ?? 0) >= collapseOffset
		? "compact"
		: "expanded";
}

export { DEFAULT_COLLAPSE_OFFSET };
