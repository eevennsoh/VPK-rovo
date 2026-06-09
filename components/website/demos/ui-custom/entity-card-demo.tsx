"use client";

import PageIcon from "@atlaskit/icon/core/page";

import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { EntityCard, type EntityCardSkillProps } from "@/components/ui-custom/entity-card";
import { cn } from "@/lib/utils";

function EntityCardSkillPreview({
	triggerLabel,
	className,
	...skillProps
}: Readonly<EntityCardSkillProps & {
	triggerLabel: string;
}>) {
	return (
		<HoverCard>
			<HoverCardTrigger render={<Button variant="outline" />}>
				{triggerLabel}
			</HoverCardTrigger>
			<HoverCardContent className="w-80 rounded-md bg-surface-overlay p-4 shadow-2xl">
				<EntityCard.Skill
					{...skillProps}
					className={cn(className)}
					density="preview"
				/>
			</HoverCardContent>
		</HoverCard>
	);
}

export default function EntityCardDemo() {
	return (
		<EntityCardSkillPreview
			triggerLabel="Hover to preview"
			name="Create Google Drive document"
			description="Create a document, name it appropriately, and save it to the right folder so teammates can find it."
			iconMeta={{ render: <PageIcon label="" size="small" />, label: "Document" }}
			source={{ type: "app", name: "Google Drive", logoSrc: "/3p/google-drive/16.svg" }}
		/>
	);
}

export function EntityCardDemoAppSource() {
	return (
		<EntityCardSkillPreview
			triggerLabel="App source"
			name="Search confluence pages"
			description="Search and rank Confluence pages by relevance to the active project context."
			iconMeta={{ render: <PageIcon label="" size="small" />, label: "Page" }}
			source={{ type: "app", name: "Confluence" }}
		/>
	);
}

export function EntityCardDemoCustomSource() {
	return (
		<EntityCardSkillPreview
			triggerLabel="Custom source"
			name="Run compliance checklist"
			description="Validate release notes and confirm the launch checklist before deployment."
			source={{ type: "custom", name: "Maia Ma (You)", avatarSrc: "/avatar-user/01.png" }}
		/>
	);
}

export function EntityCardDemoWithoutDescription() {
	return (
		<EntityCardSkillPreview
			triggerLabel="No description"
			name="Trigger CI pipeline"
			source={{ type: "app", name: "Bitbucket" }}
		/>
	);
}
