import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { NeuralGraphParams } from "./neural-graph/params";
import type { PersonalGraphVisualMode } from "./personal-graph-visual-mode";
import type { VaultExplorer } from "./personal-graph-types";

const PERSONAL_GRAPH_MODE_TRANSITION_MS = 900;
const PERSONAL_GRAPH_REDUCED_MODE_TRANSITION_MS = 180;

export interface PersonalGraphModeTransitionSnapshot {
	explorer: VaultExplorer;
	key: string;
	labelStrategy: "default" | "workflowTree";
	params: NeuralGraphParams;
	visualMode: PersonalGraphVisualMode;
}

interface PersonalGraphModeTransitionState {
	isActive: boolean;
	key: string;
	snapshot: PersonalGraphModeTransitionSnapshot | null;
}

export function usePersonalGraphModeTransition(
	currentSnapshot: PersonalGraphModeTransitionSnapshot | null,
	shouldReduceMotion: boolean,
) {
	const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const previousSnapshotRef = useRef<PersonalGraphModeTransitionSnapshot | null>(null);
	const [transition, setTransition] = useState<PersonalGraphModeTransitionState | null>(null);

	useLayoutEffect(() => {
		const previousSnapshot = previousSnapshotRef.current;
		if (currentSnapshot && previousSnapshot && previousSnapshot.visualMode !== currentSnapshot.visualMode) {
			const key = `${previousSnapshot.visualMode}-${currentSnapshot.visualMode}-${Date.now()}`;
			if (transitionTimerRef.current) {
				clearTimeout(transitionTimerRef.current);
			}
			setTransition({
				isActive: true,
				key,
				snapshot: { ...previousSnapshot, key },
			});
			const completeTransition = () => {
				setTransition((currentTransition) =>
					currentTransition?.key === key
						? { ...currentTransition, isActive: false, snapshot: null }
						: currentTransition,
				);
			};
			transitionTimerRef.current = setTimeout(
				completeTransition,
				shouldReduceMotion ? PERSONAL_GRAPH_REDUCED_MODE_TRANSITION_MS : PERSONAL_GRAPH_MODE_TRANSITION_MS,
			);
		}
		previousSnapshotRef.current = currentSnapshot;
	}, [currentSnapshot, shouldReduceMotion]);

	useEffect(() => {
		return () => {
			if (transitionTimerRef.current) {
				clearTimeout(transitionTimerRef.current);
			}
		};
	}, []);

	return transition;
}
