"use client";

import { useCallback, useEffect, useState } from "react";
import type { AgentId } from "../lib/types";

const STORAGE_KEY = "vpk-html-selector:agent";
const AGENTS = new Set<AgentId>(["claude", "codex", "cursor", "rovo"]);

export function useAgentPreference(defaultAgent: AgentId = "codex") {
	const [agent, setAgentState] = useState<AgentId>(defaultAgent);

	useEffect(() => {
		try {
			const stored = window.localStorage.getItem(STORAGE_KEY);
			if (stored && AGENTS.has(stored as AgentId)) {
				setAgentState(stored as AgentId);
			}
		} catch {
			// Ignore localStorage failures in restricted browser contexts.
		}
	}, []);

	const setAgent = useCallback((nextAgent: AgentId) => {
		setAgentState(nextAgent);
		try {
			window.localStorage.setItem(STORAGE_KEY, nextAgent);
		} catch {
			// Ignore localStorage failures in restricted browser contexts.
		}
	}, []);

	return { agent, setAgent };
}
