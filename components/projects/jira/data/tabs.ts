import AttachmentIcon from "@atlaskit/icon/core/attachment";
import CalendarIcon from "@atlaskit/icon/core/calendar";
import FormIcon from "@atlaskit/icon/core/form";
import GlobeIcon from "@atlaskit/icon/core/globe";
import PageIcon from "@atlaskit/icon/core/page";
import WorkItemIcon from "@atlaskit/icon/core/work-item";

export interface TabDefinition {
	label: string;
	icon: typeof GlobeIcon;
	hasContent: boolean;
}

export const JIRA_TABS: readonly TabDefinition[] = [
	{ label: "Summary", icon: GlobeIcon, hasContent: false },
	{ label: "Work items", icon: WorkItemIcon, hasContent: true },
	{ label: "Forms", icon: FormIcon, hasContent: false },
	{ label: "Pages", icon: PageIcon, hasContent: false },
	{ label: "Attachments", icon: AttachmentIcon, hasContent: false },
	{ label: "Calendar", icon: CalendarIcon, hasContent: false },
] as const;
