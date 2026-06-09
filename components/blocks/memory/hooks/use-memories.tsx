"use client"

import * as React from "react"
import { toast } from "sonner"

import { SonnerToast } from "@/components/ui/sonner"

import {
	MEMORY_TOASTER_ID,
	SAMPLE_MEMORIES,
	type MemoryItem,
} from "../data/memory-data"

export interface UseMemoriesResult {
	memories: readonly MemoryItem[]
	filteredMemories: readonly MemoryItem[]
	query: string
	setQuery: (value: string) => void
	isAdding: boolean
	draft: string
	setDraft: (value: string) => void
	confirmingId: string | null
	startAdding: () => void
	cancelAdding: () => void
	addMemory: () => void
	requestDelete: (id: string) => void
	cancelDelete: () => void
	confirmDelete: (id: string) => void
}

/**
 * Local-only memory state for the prototype block: add (with success toast),
 * search filtering, and a two-step delete (request → confirm) so the trash
 * action opens an inline confirmation rather than removing immediately.
 */
export function useMemories(): UseMemoriesResult {
	const [memories, setMemories] = React.useState<readonly MemoryItem[]>(SAMPLE_MEMORIES)
	const [query, setQuery] = React.useState("")
	const [isAdding, setIsAdding] = React.useState(false)
	const [draft, setDraft] = React.useState("")
	const [confirmingId, setConfirmingId] = React.useState<string | null>(null)

	const startAdding = React.useCallback(() => setIsAdding(true), [])

	const cancelAdding = React.useCallback(() => {
		setIsAdding(false)
		setDraft("")
	}, [])

	const addMemory = React.useCallback(() => {
		const text = draft.trim()
		if (!text) return
		setMemories((prev) => [{ id: crypto.randomUUID(), text }, ...prev])
		setDraft("")
		setIsAdding(false)
		toast.custom(
			() => <SonnerToast appearance="success" title="Memory successfully added." />,
			{ toasterId: MEMORY_TOASTER_ID },
		)
	}, [draft])

	const requestDelete = React.useCallback((id: string) => setConfirmingId(id), [])

	const cancelDelete = React.useCallback(() => setConfirmingId(null), [])

	const confirmDelete = React.useCallback((id: string) => {
		setMemories((prev) => prev.filter((memory) => memory.id !== id))
		setConfirmingId(null)
	}, [])

	// Derived render-only value — filter inline, never sync via effect.
	const normalizedQuery = query.trim().toLowerCase()
	const filteredMemories = normalizedQuery
		? memories.filter((memory) => memory.text.toLowerCase().includes(normalizedQuery))
		: memories

	return {
		memories,
		filteredMemories,
		query,
		setQuery,
		isAdding,
		draft,
		setDraft,
		confirmingId,
		startAdding,
		cancelAdding,
		addMemory,
		requestDelete,
		cancelDelete,
		confirmDelete,
	}
}
