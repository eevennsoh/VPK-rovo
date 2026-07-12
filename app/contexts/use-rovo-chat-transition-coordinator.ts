"use client";

import { useCallback } from "react";
import { useLazyRef } from "@/lib/use-lazy-ref";
import {
	RovoChatTransitionCoordinator,
	type RovoChatTransitionKind,
	type RovoChatTransitionToken,
} from "@/app/contexts/rovo-chat-transition-coordinator";

interface UseRovoChatTransitionCoordinatorInput {
	isCancellingRef: { current: boolean };
}

export function useRovoChatTransitionCoordinator({
	isCancellingRef,
}: Readonly<UseRovoChatTransitionCoordinatorInput>) {
	const transitionCoordinatorRef = useLazyRef(() => new RovoChatTransitionCoordinator());
	const transitionCoordinator = transitionCoordinatorRef.current;
	const syncTransitionCancellation = useCallback(() => {
		isCancellingRef.current = transitionCoordinator.hasCancellationOwner();
	}, [isCancellingRef, transitionCoordinator]);
	const beginTransition = useCallback(
		(kind: RovoChatTransitionKind) => {
			const token = transitionCoordinator.begin(kind, {
				ownsCancellation: true,
			});
			syncTransitionCancellation();
			return token;
		},
		[syncTransitionCancellation, transitionCoordinator],
	);
	const isCurrentTransition = useCallback(
		(token: RovoChatTransitionToken) => transitionCoordinator.isCurrent(token),
		[transitionCoordinator],
	);
	const finishTransition = useCallback(
		(token: RovoChatTransitionToken) => {
			transitionCoordinator.releaseCancellation(token);
			syncTransitionCancellation();
			return transitionCoordinator.isCurrent(token);
		},
		[syncTransitionCancellation, transitionCoordinator],
	);
	const hasCancellationOwner = useCallback(
		() => transitionCoordinator.hasCancellationOwner(),
		[transitionCoordinator],
	);

	return {
		beginTransition,
		finishTransition,
		hasCancellationOwner,
		isCurrentTransition,
		syncTransitionCancellation,
	};
}
