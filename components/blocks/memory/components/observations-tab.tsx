"use client"

import { Button } from "@/components/ui/button"
import { ExternalLinkIcon } from "@/components/ui/vpk-icons"

import { OBSERVATIONS } from "../data/memory-data"

export interface ObservationsTabProps {
	onUpdate?: () => void
}

/** Tab 1: Rovo's auto-generated, read-only summary of the user. */
export function ObservationsTab({ onUpdate }: Readonly<ObservationsTabProps>) {
	return (
		<div className="flex flex-col gap-4 pt-4">
			<div className="flex flex-col gap-4">
				{OBSERVATIONS.map((section) => (
					<div key={section.id} className="flex flex-col gap-1">
						<h3 className="text-sm font-semibold text-text">{section.title}</h3>
						<p className="text-sm/relaxed text-text-subtle">{section.body}</p>
					</div>
				))}
			</div>
			<div className="flex justify-end pt-1">
				<Button variant="default" onClick={onUpdate}>
					Update Rovo&apos;s observations
					<ExternalLinkIcon />
				</Button>
			</div>
		</div>
	)
}
