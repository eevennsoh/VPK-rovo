"use client";

import { useMemo, type ReactNode } from "react";

import { METADATA_PEOPLE } from "@/components/blocks/agent-sessions/data/metadata-people";
import {
	useAgentSessionsActions,
	useAgentSessionsMeta,
	useAgentSessionsState,
} from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";
import {
	DetailsTab,
} from "@/components/blocks/agent-sessions/experimental/components/details-tab";
import { AutomationTab } from "@/components/blocks/agent-sessions/experimental/components/automation-tab";
import { AppsSection, DevelopmentSection } from "@/components/blocks/agent-sessions/experimental/components/details-sections";
import type { WorkItemPerson } from "@/app/contexts/context-work-item-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { token } from "@/lib/tokens";

function mergePeople(...seed: readonly (WorkItemPerson | null | undefined)[]): WorkItemPerson[] {
	const byName = new Map<string, WorkItemPerson>();
	for (const person of METADATA_PEOPLE) {
		byName.set(person.name, person);
	}
	for (const person of seed) {
		if (person && !byName.has(person.name)) {
			byName.set(person.name, person);
		}
	}
	return [...byName.values()];
}

/** Shared bordered surface for the metadata rail's stacked cards. */
function MetadataCard({ children }: Readonly<{ children: ReactNode }>) {
	return (
		<div className="rounded-lg border border-border p-3" style={{ backgroundColor: token("elevation.surface") }}>
			{children}
		</div>
	);
}

/**
 * Video-matched work-item Details right column for the experimental variant: a
 * Details/Automation tabbed card (click-to-add + inline-edit rows, See more),
 * and Development + Apps sections each in their own matching card. Metadata state
 * lives in the shared block provider so planner decisions and manual edits stay
 * coordinated without changing the public block API.
 */
export function MetadataRail() {
	const { workItem } = useAgentSessionsMeta();
	const { metadata: draft } = useAgentSessionsState();
	const actions = useAgentSessionsActions();
	const people = useMemo(
		() => mergePeople(workItem.assignee, workItem.reporter),
		[workItem.assignee, workItem.reporter],
	);

	const updateDraft = actions.updateMetadata;

	return (
		<section aria-label="Work item details" className="flex flex-col gap-3">
			<MetadataCard>
				<Tabs defaultValue="details">
					<TabsList className="w-full">
						<TabsTrigger value="details">Details</TabsTrigger>
						<TabsTrigger value="automation">Automation</TabsTrigger>
					</TabsList>
					<TabsContent className="mt-3" value="details">
						<DetailsTab draft={draft} onChange={updateDraft} people={people} />
					</TabsContent>
					<TabsContent className="mt-3" value="automation">
						<AutomationTab />
					</TabsContent>
				</Tabs>
			</MetadataCard>

			<MetadataCard>
				<DevelopmentSection />
			</MetadataCard>
			<MetadataCard>
				<AppsSection />
			</MetadataCard>
		</section>
	);
}
