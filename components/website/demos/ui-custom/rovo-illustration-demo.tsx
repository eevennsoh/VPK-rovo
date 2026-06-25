"use client";

import type { ReactNode } from "react";
import { useState } from "react";

import RefreshIcon from "@atlaskit/icon/core/refresh";
import { Button } from "@/components/ui/button";
import {
	ControlledRovoIllustration,
	RovoIllustration,
	SPOT_ILLUSTRATIONS,
} from "@/components/ui-custom/rovo-illustration";

const CONTROLLED_ILLUSTRATION_SIZE = 180;
const COMPACT_CONTROLLED_ILLUSTRATION_SIZE = 72;

function IllustrationStage({
	children,
	compact = false,
	label,
}: Readonly<{
	children: ReactNode;
	compact?: boolean;
	label: string;
	}>) {
	const stageClassName = compact
		? "flex min-h-[156px] flex-col items-center justify-center gap-3 rounded-lg bg-surface p-4"
		: "flex min-h-[280px] flex-col items-center justify-center gap-3 rounded-lg bg-surface p-6";
	const previewClassName = compact
		? "flex min-h-[92px] items-center justify-center"
		: "flex min-h-[220px] items-center justify-center";

	return (
		<div className={stageClassName}>
			<div className={previewClassName}>
				{children}
			</div>
			<p className="text-sm font-medium text-text-subtle">{label}</p>
		</div>
	);
}

export default function RovoIllustrationDemo() {
	const [refreshKey, setRefreshKey] = useState(0);

	return (
		<div className="flex h-[min(760px,calc(100vh-160px))] w-full flex-col overflow-y-auto overscroll-contain">
			<div className="sticky top-0 z-20 flex justify-end bg-surface pb-3">
				<Button
					aria-label="Replay illustration entrance animations"
					onClick={() => setRefreshKey((currentKey) => currentKey + 1)}
					size="default"
					variant="outline"
				>
					<RefreshIcon label="" size="small" />
					Replay
				</Button>
			</div>
			<div key={refreshKey} className="flex flex-col gap-4">
				<div className="grid gap-4">
					<IllustrationStage label="Default loop">
						<RovoIllustration illusIds={SPOT_ILLUSTRATIONS.map((illustration) => illustration.id)} size={220} />
					</IllustrationStage>
				</div>
				<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
					{SPOT_ILLUSTRATIONS.map((illustration) => (
						<IllustrationStage key={illustration.id} label={illustration.label}>
							<ControlledRovoIllustration illusId={illustration.id} size={CONTROLLED_ILLUSTRATION_SIZE} />
						</IllustrationStage>
					))}
				</div>
				<div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-5">
					{SPOT_ILLUSTRATIONS.map((illustration) => (
						<IllustrationStage compact key={`compact-${illustration.id}`} label={`${illustration.label} 72 px`}>
							<ControlledRovoIllustration
								illusId={illustration.id}
								motionSize={CONTROLLED_ILLUSTRATION_SIZE}
								size={COMPACT_CONTROLLED_ILLUSTRATION_SIZE}
							/>
						</IllustrationStage>
					))}
				</div>
			</div>
		</div>
	);
}
