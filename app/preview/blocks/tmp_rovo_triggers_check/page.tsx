"use client";

import Triggers from "@/components/blocks/triggers/page";
import { DEFAULT_CONFIGURED_TRIGGER_VALUES } from "@/components/blocks/triggers/data/trigger-catalog";

export default function TmpRovoTriggersCheckPage() {
	return (
		<div className="mx-auto max-w-xl p-8">
			<Triggers defaultTriggers={DEFAULT_CONFIGURED_TRIGGER_VALUES} />
		</div>
	);
}
