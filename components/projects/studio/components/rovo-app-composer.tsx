"use client";

import {
	RovoAppComposer as SharedRovoAppComposer,
	type RovoAppComposerProps as SharedRovoAppComposerProps,
} from "@/components/projects/shared/components/rovo-app-composer";

// Studio renders the shared composer with the "floating" chrome (FloatingComposer
// layout, send-only action button, and the hover-revealed template/scratch links).
export type RovoAppComposerProps = Omit<SharedRovoAppComposerProps, "chrome">;

export function RovoAppComposer(props: Readonly<RovoAppComposerProps>) {
	return <SharedRovoAppComposer {...props} chrome="floating" />;
}
