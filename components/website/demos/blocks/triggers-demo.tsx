"use client";

import type { ReactElement } from "react";
import Triggers from "@/components/blocks/triggers/page";

export default function TriggersDemo(): ReactElement {
	return (
		<div className="flex items-start justify-center p-6">
			<div className="w-full max-w-[34rem]">
				<Triggers />
			</div>
		</div>
	);
}

export function TriggersDemoConfigured(): ReactElement {
	return (
		<div className="flex items-start justify-center p-6">
			<div className="w-full max-w-[34rem]">
				<Triggers />
			</div>
		</div>
	);
}

export function TriggersDemoEmpty(): ReactElement {
	return (
		<div className="flex items-start justify-center p-6">
			<div className="w-full max-w-[34rem]">
				<Triggers hasTrigger={false} />
			</div>
		</div>
	);
}
