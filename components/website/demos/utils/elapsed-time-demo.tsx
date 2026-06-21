import { formatElapsedTime, getElapsedSeconds, resolveInitialNowMs } from "@/lib/elapsed-time";
import { token } from "@/lib/tokens";

const NOW_MS = Date.parse("2026-06-21T12:08:42.000Z");

const CASES = [
	{
		label: "Running",
		runCreatedAt: "2026-06-21T12:04:03.000Z",
		runCompletedAt: null,
	},
	{
		label: "Completed",
		runCreatedAt: "2026-06-21T11:56:00.000Z",
		runCompletedAt: "2026-06-21T12:01:29.000Z",
	},
	{
		label: "Missing start",
		runCreatedAt: null,
		runCompletedAt: null,
	},
] as const;

export default function ElapsedTimeDemo() {
	return (
		<div className="mx-auto grid w-full max-w-[520px] gap-3">
			{CASES.map((item) => {
				const initialNowMs = resolveInitialNowMs({
					initialNowMs: undefined,
					runCreatedAt: item.runCreatedAt,
					runCompletedAt: item.runCompletedAt,
				});
				const elapsedSeconds = getElapsedSeconds(item.runCreatedAt, item.runCompletedAt, NOW_MS);

				return (
					<div key={item.label} className="rounded-lg border border-border bg-surface p-4">
						<div className="flex items-center justify-between gap-4">
							<div className="min-w-0">
								<p className="text-text" style={{ font: token("font.heading.xxsmall") }}>{item.label}</p>
								<p className="text-text-subtle text-xs">initial now: {initialNowMs}</p>
							</div>
							<span className="rounded-full bg-surface-sunken px-3 py-1 font-mono text-text">
								{formatElapsedTime(elapsedSeconds)}
							</span>
						</div>
					</div>
				);
			})}
		</div>
	);
}
