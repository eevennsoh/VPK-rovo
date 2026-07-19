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
import { cn } from "@/lib/utils";
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
 * One section inside the unified metadata rail. Sections after the first carry a
 * hairline top border so the whole rail reads as a single bordered surface with
 * internal dividers rather than a stack of separate cards.
 */
function MetadataSection({ children, divided = false }: Readonly<{ children: ReactNode; divided?: boolean }>) {
	return <div className={divided ? "border-t border-border p-3" : "p-3"}>{children}</div>;
}

/**
 * Video-matched work-item Details right column for the experimental variant: a
 * single bordered surface holding the Details/Automation tabbed section
 * (click-to-add + inline-edit rows, See more) plus Development and Apps sections,
 * separated by internal dividers. Metadata state lives in the shared block
 * provider so planner decisions and manual edits stay coordinated without
 * changing the public block API.
 */
export function MetadataRail({ borderless = false }: Readonly<{ borderless?: boolean }> = {}) {
	const { workItem } = useAgentSessionsMeta();
	const { metadata: draft } = useAgentSessionsState();
	const actions = useAgentSessionsActions();
	const people = useMemo(
		() => mergePeople(workItem.assignee, workItem.reporter),
		[workItem.assignee, workItem.reporter],
	);

	const updateDraft = actions.updateMetadata;

	return (
		<section
			aria-label="Work item details"
			className={cn(
				"flex flex-col overflow-hidden rounded-lg",
				// The peek overlay leans on its elevation.shadow.overlay to separate
				// from the page, so it drops the hairline border the docked rail uses.
				borderless ? null : "border border-border",
			)}
			style={{ backgroundColor: token("elevation.surface") }}
		>
			<MetadataSection>
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
			</MetadataSection>

			<MetadataSection divided>
				<div className="flex flex-col gap-1">
					<DevelopmentSection />
					<AppsSection />
				</div>
			</MetadataSection>
		</section>
	);
}
