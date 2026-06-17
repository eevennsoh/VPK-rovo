"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
	SkillsDirectoryDialog,
	type SkillsDirectorySkill,
	type SkillsDirectoryVariant,
} from "@/components/blocks/skills-directory";

const DEMO_SESSION_SKILLS: readonly SkillsDirectorySkill[] = [
	{
		id: "audit-accessibility",
		name: "Audit accessibility",
		description: "Review interface structure, keyboard paths, and assistive technology labels before a release.",
		icon: "search",
		collectionId: "software",
		collectionDescription: "Ship high-quality software faster with developer agents, source control, CI/CD, and delivery insights.",
		collectionProducts: ["Rovo Dev", "DX", "Pipelines", "Bitbucket"],
		collectionDocsUrl: "https://www.atlassian.com/collections/software",
		publisherName: "Atlassian",
		companyId: "atlassian",
		categoryId: "software-development",
		starCount: 18,
		teammateCount: 632,
		verified: true,
		tools: [{ id: "axe", name: "Axe", icon: "search" }],
		instructions: "Inspect labels, focus order, contrast, landmarks, and keyboard-only completion paths.",
	},
	{
		id: "demo-draft-release-notes",
		name: "Draft release notes",
		description: "Turn a list of merged changes into customer-ready release notes.",
		icon: "edit",
		collectionId: "teamwork",
		collectionDescription: "Supercharge teamwork across planning, documentation, async updates, and AI-assisted collaboration.",
		collectionProducts: ["Jira", "Confluence", "Loom", "Rovo"],
		collectionDocsUrl: "https://www.atlassian.com/collections/teamwork",
		publisherName: "Atlassian",
		companyId: "atlassian",
		categoryId: "content-and-communication",
		starCount: 12,
		teammateCount: 410,
		verified: true,
		tools: [{ id: "changelog", name: "Changelog", icon: "page" }],
		instructions: "Group shipped changes by customer outcome and write concise release-ready copy.",
	},
];

export default function SkillsDirectoryPage() {
	const [open, setOpen] = useState(false);
	const [variant, setVariant] = useState<SkillsDirectoryVariant>("default");

	function openDirectory(nextVariant: SkillsDirectoryVariant) {
		setVariant(nextVariant);
		setOpen(true);
	}

	return (
		<div className="flex min-h-screen items-center justify-center gap-3 p-4">
			<Button onClick={() => openDirectory("default")} variant="outline">
				Open standard directory
			</Button>
			<Button onClick={() => openDirectory("experimental")}>
				Open experimental directory
			</Button>
			<SkillsDirectoryDialog
				open={open}
				onOpenChange={setOpen}
				sessionSkills={DEMO_SESSION_SKILLS}
				variant={variant}
			/>
		</div>
	);
}

export function SkillsDirectoryExperimentalPage() {
	const [open, setOpen] = useState(false);

	return (
		<SkillsDirectoryPageShell open={open} onOpenChange={setOpen} variant="experimental" />
	);
}

function SkillsDirectoryPageShell({
	open,
	onOpenChange,
	variant,
}: Readonly<{
	open: boolean;
	onOpenChange: (open: boolean) => void;
	variant?: SkillsDirectoryVariant;
}>) {
	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Button onClick={() => onOpenChange(true)}>
				{variant === "experimental" ? "Open experimental directory" : "Open standard directory"}
			</Button>
			<SkillsDirectoryDialog
				open={open}
				onOpenChange={onOpenChange}
				sessionSkills={DEMO_SESSION_SKILLS}
				variant={variant}
			/>
		</div>
	);
}
