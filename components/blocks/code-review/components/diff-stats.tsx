import { cn } from "@/lib/utils";

const DIFF_STATS_CLASS_NAME =
	"flex shrink-0 items-center gap-1 text-xs font-normal leading-4";

export function DiffStats({
	additions,
	deletions,
	className,
	emphasized = true,
}: Readonly<{
	additions: number;
	deletions: number;
	className?: string;
	emphasized?: boolean;
}>) {
	if (additions <= 0 && deletions <= 0) {
		return null;
	}

	return (
		<span className={cn(DIFF_STATS_CLASS_NAME, className)}>
			<span className="sr-only">
				{additions} additions, {deletions} deletions
			</span>
			<span
				aria-hidden
				className={emphasized ? "text-text-success" : "text-text-subtle"}
			>
				+{additions}
			</span>
			<span
				aria-hidden
				className={emphasized ? "text-text-danger" : "text-text-subtle"}
			>
				-{deletions}
			</span>
		</span>
	);
}
