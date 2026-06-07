"use client";

import { useEffect, useRef } from "react";

import { ROVO_AGENT_ID } from "@/app/data/directory/agents";
import { getAgentIdFromSearch, withAgentParam } from "@/lib/agent-route-sync";

/**
 * Keeps the agent the surface is *editing* in sync with the `?agent=` query
 * param so an opened/created agent is deep-linkable, survives reload, and
 * participates in browser back/forward — mirroring the per-thread URL identity
 * the chat surfaces already have. Works on any surface (studio, rovo, …).
 *
 * Important: this tracks the *edited* agent, NOT the chat-selected agent. In the
 * studio the right-hand "Ask Rovo" panel stays pointed at the default Rovo agent
 * while you edit a custom agent (it is a build helper, not the agent itself), so
 * URL identity must follow `activeAgentConfig`, not `selectedAgentId`. Conflating
 * the two caused the config pane to flip the panel onto the custom agent on
 * re-select/reload (a visible "swap").
 *
 * Opt-in per surface: call this inside a chat surface shell. It must NOT live in
 * the global `RovoChatProvider`, or `?agent=` would leak onto docs/demo routes
 * that mount their own provider.
 *
 * Reconciliation rules:
 * - The default agent is represented as "no param", so it never writes
 *   `?agent=rovo-dev`.
 * - URL writes use the History API (matching how thread routing already works);
 *   explicit edits `pushState` (so Back returns to the prior agent), while
 *   load-time seeding never writes.
 *
 * Pass `enabled: false` to disable all syncing (e.g. embedded surfaces that must
 * not mutate the host page URL).
 *
 * `editingAgentId` is the agent currently open in the surface's per-agent view
 * (or `null` for none / the default landing). `selectableAgentIds` is the set of
 * ids the surface can resolve, used to ignore a stale/unknown `?agent=` seed.
 *
 * `onAgentRestored` fires whenever the edited agent is reconciled *from the URL*
 * — the one-shot mount seed and every back/forward `popstate` — with the restored
 * agent id (or `null` for none). Surfaces that open a per-agent view (e.g. the
 * studio config pane) use this to restore that view on reload and deep links.
 * In-page selections do not fire it (those surfaces set their own view state
 * directly). The callback must NOT select the agent for chat.
 */
export function useAgentUrlSync({
	enabled = true,
	editingAgentId = null,
	selectableAgentIds,
	onAgentRestored,
}: {
	enabled?: boolean;
	editingAgentId?: string | null;
	selectableAgentIds: readonly string[];
	onAgentRestored?: (agentId: string | null) => void;
}) {
	// Mirror live values into refs so the once-attached popstate handler reads
	// current state without re-subscribing when these churn.
	const editingAgentIdRef = useRef(editingAgentId);
	editingAgentIdRef.current = editingAgentId;
	const selectableAgentIdsRef = useRef(selectableAgentIds);
	selectableAgentIdsRef.current = selectableAgentIds;
	const onAgentRestoredRef = useRef(onAgentRestored);
	onAgentRestoredRef.current = onAgentRestored;

	// The agent id the URL was last reconciled to (either direction); guards the
	// write effect from echoing a change that originated from the URL.
	const lastReconciledAgentIdRef = useRef<string | null>(null);
	// A one-shot seed captured from the mount URL, applied once the named agent
	// is resolvable (session agents rehydrate from storage *after* this child
	// effect runs) — and abandoned if the user selects something first.
	const pendingSeedAgentIdRef = useRef<string | null>(null);
	// Skip the first write-effect run: on mount the URL is authoritative and
	// state always starts at the default agent.
	const hasRunWriteEffectRef = useRef(false);

	// Capture the mount URL seed and handle browser back/forward.
	useEffect(() => {
		if (!enabled) {
			return;
		}

		const rawUrlAgentId = getAgentIdFromSearch(window.location.search);
		const urlAgentId = rawUrlAgentId === ROVO_AGENT_ID ? null : rawUrlAgentId;
		pendingSeedAgentIdRef.current = urlAgentId;

		function handlePopState() {
			// A history navigation is authoritative and discrete (no competing
			// in-flight user selection), so reconcile state directly.
			pendingSeedAgentIdRef.current = null;
			const rawId = getAgentIdFromSearch(window.location.search);
			const nextAgentId = rawId === ROVO_AGENT_ID ? null : rawId;

			if (nextAgentId) {
				const isKnown = selectableAgentIdsRef.current.includes(nextAgentId);
				if (isKnown) {
					lastReconciledAgentIdRef.current = nextAgentId;
					// Restore the per-agent view (e.g. config pane). This must not
					// select the agent for chat — the surface keeps its own chat
					// identity (in studio, the Ask Rovo build helper).
					onAgentRestoredRef.current?.(nextAgentId);
				}
				return;
			}

			lastReconciledAgentIdRef.current = null;
			onAgentRestoredRef.current?.(null);
		}

		window.addEventListener("popstate", handlePopState);
		return () => window.removeEventListener("popstate", handlePopState);
	}, [enabled]);

	// Apply the pending mount seed once the agent roster can resolve it.
	useEffect(() => {
		if (!enabled) {
			return;
		}

		const seedAgentId = pendingSeedAgentIdRef.current;
		if (!seedAgentId) {
			return;
		}

		// The user opened a different agent before the seed resolved — let them
		// win (the write effect will reconcile the URL to their choice).
		if (editingAgentId && editingAgentId !== seedAgentId) {
			pendingSeedAgentIdRef.current = null;
			return;
		}

		if (selectableAgentIds.includes(seedAgentId)) {
			pendingSeedAgentIdRef.current = null;
			lastReconciledAgentIdRef.current = seedAgentId;
			// Restore the per-agent view (e.g. studio config pane) for the
			// deep-linked / reloaded agent. Chat identity is untouched.
			onAgentRestoredRef.current?.(seedAgentId);
		}
	}, [enabled, selectableAgentIds, editingAgentId]);

	// Reflect the edited agent into the URL.
	useEffect(() => {
		if (!enabled) {
			return;
		}

		if (!hasRunWriteEffectRef.current) {
			hasRunWriteEffectRef.current = true;
			return;
		}

		const desiredAgentId = editingAgentId;
		if (desiredAgentId === lastReconciledAgentIdRef.current) {
			return;
		}

		const rawCurrent = getAgentIdFromSearch(window.location.search);
		const currentAgentId = rawCurrent === ROVO_AGENT_ID ? null : rawCurrent;
		lastReconciledAgentIdRef.current = desiredAgentId;
		if (currentAgentId === desiredAgentId) {
			return;
		}

		const relativeUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
		window.history.pushState(null, "", withAgentParam(relativeUrl, desiredAgentId));
	}, [enabled, editingAgentId]);
}
