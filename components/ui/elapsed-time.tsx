"use client";

import { useEffect, useState, type ComponentProps, type ReactNode } from "react";

import { formatElapsedTime } from "@/lib/elapsed-time";

const ELAPSED_TIME_TICK_MS = 1000;

export interface ElapsedTimeProps extends Omit<ComponentProps<"time">, "children" | "dateTime" | "prefix"> {
	elapsedSeconds?: number;
	prefix?: ReactNode;
	startedAtMs?: number;
}

/** Shared elapsed-time display for static durations and live count-up timers. */
export function ElapsedTime({
	elapsedSeconds = 0,
	prefix,
	startedAtMs,
	...props
}: Readonly<ElapsedTimeProps>) {
	const [nowMs, setNowMs] = useState(() => Date.now());
	const hasLiveStart = typeof startedAtMs === "number" && Number.isFinite(startedAtMs);

	useEffect(() => {
		if (!hasLiveStart) return;

		setNowMs(Date.now());
		const intervalId = window.setInterval(() => setNowMs(Date.now()), ELAPSED_TIME_TICK_MS);
		return () => window.clearInterval(intervalId);
	}, [hasLiveStart, startedAtMs]);

	const resolvedElapsedSeconds = hasLiveStart
		? Math.max(0, Math.floor((nowMs - startedAtMs) / ELAPSED_TIME_TICK_MS))
		: elapsedSeconds;
	const label = formatElapsedTime(resolvedElapsedSeconds);

	if (!label) return null;

	return (
		<>
			{prefix}
			<time dateTime={`PT${Math.max(0, Math.floor(resolvedElapsedSeconds))}S`} {...props}>
				{label}
			</time>
		</>
	);
}
