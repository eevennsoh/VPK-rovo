"use client";

import { useMemo, useState } from "react";

import { METADATA_PEOPLE } from "@/components/blocks/agent-sessions/data/metadata-people";
import { useAgentSessionsMeta } from "@/components/blocks/agent-sessions/experimental/context-agent-sessions";
import { StatusPill } from "@/components/blocks/agent-sessions/experimental/components/detail-field-editors";
import {
	DetailsTab,
	seedMetadataDraft,
	type MetadataDraft,
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

/**
 * Video-matched work-item Details right column for the experimental variant: a
 * status pill bar, a Details/Automation tabbed card (click-to-add + inline-edit
 * rows, See more), and collapsible Development + Apps sections. All state is
 * local presentation draft keyed by `workItem.code` — it never touches the
 * foundation session model.
 */
export function MetadataRail() {
	const { workItem } = useAgentSessionsMeta();
	const code = workItem.code;
	const [draftByCode, setDraftByCode] = useState<Record<string, MetadataDraft>>({});
	const draft = draftByCode[code] ?? seedMetadataDraft(workItem);
	const people = useMemo(
		() => mergePeople(workItem.assignee, workItem.reporter),
		[workItem.assignee, workItem.reporter],
	);

	const updateDraft = (patch: Partial<MetadataDraft>) => {
		setDraftByCode((previous) => ({
			...previous,
			[code]: { ...(previous[code] ?? seedMetadataDraft(workItem)), ...patch },
		}));
	};

	return (
		<section aria-label="Work item details" className="flex flex-col gap-3">
			<div className="flex items-center">
				<StatusPill onChange={(next) => updateDraft({ status: next })} value={draft.status} />
			</div>

			<div
				className="rounded-lg border border-border p-3"
				style={{ backgroundColor: token("elevation.surface") }}
			>
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
			</div>

			<DevelopmentSection />
			<AppsSection />
		</section>
	);
}
