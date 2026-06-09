"use client"

import { Button } from "@/components/ui/button"
import { TrashIcon } from "@/components/ui/vpk-icons"
import { List } from "@/components/ui-custom/list"

import type { MemoryItem } from "../data/memory-data"

export interface MemoryRowProps {
	memory: MemoryItem
	isConfirming: boolean
	onRequestDelete: (id: string) => void
	onConfirmDelete: (id: string) => void
	onCancelDelete: () => void
}

/**
 * A single memory row. In its normal shape it shows the text plus a trash
 * action; once delete is requested it expands in place into an inline
 * confirmation (the trash never deletes immediately).
 */
export function MemoryRow({
	memory,
	isConfirming,
	onRequestDelete,
	onConfirmDelete,
	onCancelDelete,
}: Readonly<MemoryRowProps>) {
	if (isConfirming) {
		return (
			<List.Row className="h-auto">
				<List.Cell edge="leading" colSpan={2} className="py-3">
					<div className="flex flex-col gap-3">
						<div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text">
							{memory.text}
						</div>
						<div className="flex items-start justify-between gap-4">
							<div className="flex min-w-0 flex-col gap-0.5">
								<p className="text-sm font-semibold text-text">
									Are you sure you want to remove this memory?
								</p>
								<p className="text-sm text-text-subtle">
									Rovo won&apos;t remember this detail when responding in the future. Your chat history won&apos;t be affected.
								</p>
							</div>
							<div className="flex shrink-0 items-center gap-2">
								<Button variant="ghost" onClick={onCancelDelete}>
									Cancel
								</Button>
								<Button variant="warning" onClick={() => onConfirmDelete(memory.id)}>
									Remove
								</Button>
							</div>
						</div>
					</div>
				</List.Cell>
			</List.Row>
		)
	}

	return (
		<List.Row>
			<List.Cell edge="leading">
				<span className="text-sm text-text">{memory.text}</span>
			</List.Cell>
			<List.Cell edge="trailing">
				<div className="flex justify-end">
					<Button
						variant="ghost"
						size="icon"
						aria-label={`Delete memory: ${memory.text}`}
						onClick={() => onRequestDelete(memory.id)}
					>
						<TrashIcon />
					</Button>
				</div>
			</List.Cell>
		</List.Row>
	)
}
