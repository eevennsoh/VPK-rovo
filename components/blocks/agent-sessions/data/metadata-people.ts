/**
 * Seeded people options for the experimental Agent Sessions metadata rail.
 *
 * Presentation-only fixtures for the assignee / reporter pickers — NOT reducer
 * state. Deterministic (no clock / randomness) and shaped as `WorkItemPerson`
 * so the rail can seed directly from `meta.workItem.assignee` / `.reporter`.
 * Type-only import keeps this list free of the work-item modal runtime graph.
 */

import type { WorkItemPerson } from "@/app/contexts/context-work-item-modal";

/** Deterministic roster for the assignee / reporter pickers. */
export const METADATA_PEOPLE: readonly WorkItemPerson[] = [
	{ name: "Maya Chen", avatarUrl: "/avatar-user/andrea-wilson/color/asow-service-yellow.png", role: "Proposal manager" },
	{ name: "Jordan Lee", avatarUrl: "/avatar-user/andrew-park/color/asow-dev-lime.png", role: "Account executive" },
	{ name: "Andrew Park", avatarUrl: "/avatar-user/david-hsieh/color/asow-service-yellow.png", role: "Solutions engineer" },
	{ name: "Priya Narayanan", role: "Deal desk lead" },
	{ name: "Sam Rivera", role: "Security reviewer" },
	// Deliberately long name to exercise label truncation in the picker + trigger.
	{ name: "Alexandra Constantinopoulos", role: "Partner enablement lead" },
];

/** Find a seeded person by name (used to reconcile seeded work-item people). */
export function getMetadataPerson(name: string): WorkItemPerson | undefined {
	return METADATA_PEOPLE.find((person) => person.name === name);
}
