import { cn } from "@/lib/utils";

interface DiffStatProps {
	additions: number;
	deletions: number;
	className?: string;
}

export function DiffStat({ additions, deletions, className }: Readonly<DiffStatProps>) {
	return (
		<span className={cn("flex items-center gap-1 font-mono text-xs", className)}>
			<span className="text-text-accent-lime">+{additions}</span>
			<span className="text-text-accent-red">-{deletions}</span>
		</span>
	);
}
