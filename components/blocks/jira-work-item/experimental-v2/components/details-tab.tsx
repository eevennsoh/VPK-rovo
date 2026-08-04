"use client";

import { useState } from "react";

import CalendarIcon from "@atlaskit/icon/core/calendar";
import EpicIcon from "@atlaskit/icon/core/epic";
import PersonIcon from "@atlaskit/icon/core/person";
import PriorityMediumIcon from "@atlaskit/icon/core/priority-medium";
import ProjectIcon from "@atlaskit/icon/core/project";
import ProjectStatusIcon from "@atlaskit/icon/core/project-status";
import TagIcon from "@atlaskit/icon/core/tag";

import type { WorkItemPerson } from "@/app/contexts/context-work-item-modal";
import { ArtifactPanePropertyRow } from "@/components/blocks/artifact-pane";
import { ArtifactLabelsField } from "@/components/blocks/artifact-pane/artifact-labels-field";
import { ArtifactParentField } from "@/components/blocks/artifact-pane/artifact-parent-field";
import { ArtifactProjectField } from "@/components/blocks/artifact-pane/artifact-project-field";
import type { AgentPlannerMetadata } from "@/components/blocks/jira-work-item/data/planner-state";
import {
	DateRowField,
	PersonReadOnlyValue,
	PersonRowField,
	PriorityRowField,
	StatusPill,
} from "@/components/blocks/jira-work-item/experimental-v2/components/detail-field-editors";
import { Calendar } from "@/components/ui/calendar";

export { seedMetadataDraft } from "@/components/blocks/jira-work-item/data/planner-state";

export type MetadataDraft = AgentPlannerMetadata;

/** The ArtifactPane-aligned Details body for the experimental v2 work item. */
export function DetailsTab({
	draft,
	onChange,
	people,
}: Readonly<{
	draft: MetadataDraft;
	onChange: (patch: Partial<MetadataDraft>) => void;
	people: readonly WorkItemPerson[];
}>) {
	const [showMore, setShowMore] = useState(false);

	return (
		<div className="flex flex-col gap-2">
			<ArtifactPanePropertyRow editable={false} icon={<ProjectStatusIcon label="" size="small" />} label="Status">
				<StatusPill onChange={(next) => onChange({ status: next })} value={draft.status} />
			</ArtifactPanePropertyRow>
			<ArtifactPanePropertyRow icon={<ProjectIcon label="" size="small" />} label="Project">
				<ArtifactProjectField onChange={(id) => onChange({ atlassianProject: id })} value={draft.atlassianProject} />
			</ArtifactPanePropertyRow>
			<ArtifactPanePropertyRow icon={<PersonIcon label="" size="small" />} label="Assignee">
				<PersonRowField
					ariaLabel="Change assignee"
					onChange={(person) => onChange({ assignee: person })}
					people={people}
					placeholder="Unassigned"
					value={draft.assignee}
				/>
			</ArtifactPanePropertyRow>
			<ArtifactPanePropertyRow editable={false} icon={<PersonIcon label="" size="small" />} label="Reporter">
				<PersonReadOnlyValue placeholder="Unassigned" value={draft.reporter} />
			</ArtifactPanePropertyRow>
			{showMore ? (
				<>
					<ArtifactPanePropertyRow icon={<PriorityMediumIcon label="" size="small" />} label="Priority">
						<PriorityRowField onChange={(next) => onChange({ priority: next })} value={draft.priority} />
					</ArtifactPanePropertyRow>
					<ArtifactPanePropertyRow icon={<CalendarIcon label="" size="small" />} label="Start date">
						<DateRowField
							ariaLabel="Change start date"
							CalendarComponent={Calendar}
							onChange={(next) => onChange({ startDate: next })}
							placeholder="Add start date"
							value={draft.startDate}
						/>
					</ArtifactPanePropertyRow>
					<ArtifactPanePropertyRow icon={<CalendarIcon label="" size="small" />} label="Due date">
						<DateRowField
							ariaLabel="Change due date"
							CalendarComponent={Calendar}
							onChange={(next) => onChange({ dueDate: next })}
							placeholder="Add due date"
							value={draft.dueDate}
						/>
					</ArtifactPanePropertyRow>
					<ArtifactPanePropertyRow icon={<EpicIcon label="" size="small" />} label="Parent">
						<ArtifactParentField onChange={(key) => onChange({ parent: key })} value={draft.parent} />
					</ArtifactPanePropertyRow>
					<ArtifactPanePropertyRow icon={<TagIcon label="" size="small" />} label="Labels">
						<ArtifactLabelsField onChange={(next) => onChange({ labels: next })} value={draft.labels} />
					</ArtifactPanePropertyRow>
				</>
			) : null}
			<button
				className="mt-1 self-start text-xs leading-5 text-text-subtle underline-offset-2 hover:underline focus-visible:underline"
				onClick={() => setShowMore((current) => !current)}
				type="button"
			>
				{showMore ? "See less" : "See more"}
			</button>
		</div>
	);
}
