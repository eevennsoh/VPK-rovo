"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SkillsDirectoryDialog, type SkillsDirectorySkill } from "@/components/blocks/skills-directory";

const DEMO_SESSION_SKILLS: readonly SkillsDirectorySkill[] = [
	{
		id: "draft-release-notes",
		name: "Draft release notes",
		description: "Turn a list of merged changes into customer-ready release notes.",
		icon: "edit",
		iconColor: "text-blue-500",
		publisher: "Atlassian",
		publisherLogoSrc: "/1p/atlassian.svg",
		starCount: 12,
		viewCount: 410,
		category: "software-development",
	},
	{
		id: "triage-incident",
		name: "Triage incident",
		description: "Gather signals, assign severity, and page the right responders.",
		icon: "search",
		iconColor: "text-red-500",
		publisher: "Atlassian",
		publisherLogoSrc: "/1p/atlassian.svg",
		starCount: 18,
		viewCount: 632,
		category: "software-development",
	},
];

export default function SkillsDirectoryPage() {
	const [open, setOpen] = useState(false);

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Button onClick={() => setOpen(true)}>Browse skills</Button>
			<SkillsDirectoryDialog
				open={open}
				onOpenChange={setOpen}
				sessionSkills={DEMO_SESSION_SKILLS}
			/>
		</div>
	);
}
