"use client";

import {
	RovoAppComposer as SharedRovoAppComposer,
	type RovoAppComposerProps as SharedRovoAppComposerProps,
} from "@/components/projects/shared/components/rovo-app-composer";

// Rovo renders the shared composer with the bordered "card" chrome (the default).
export type RovoAppComposerProps = Omit<SharedRovoAppComposerProps, "chrome">;

export function RovoAppComposer(props: Readonly<RovoAppComposerProps>) {
	return <SharedRovoAppComposer {...props} chrome="card" />;
}
