"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { SkillsDirectoryDialog, type SkillsDirectorySkill } from "@/components/blocks/skills-directory";

const DEMO_SESSION_SKILLS: readonly SkillsDirectorySkill[] = [
	{
		id: "audit-accessibility",
		name: "Audit accessibility",
		description: "Review interface structure, keyboard paths, and assistive technology labels before a release.",
		icon: "search",
		iconColor: "text-blue-500",
		publisherName: "Atlassian",
		publisherAvatarSrc: "/1p/atlassian.svg",
		companyId: "atlassian",
		categoryId: "software-development",
		starCount: 18,
		viewCount: 632,
		tools: [{ id: "axe", name: "Axe", icon: "search" }],
		instructions: "Inspect labels, focus order, contrast, landmarks, and keyboard-only completion paths.",
	},
	{
		id: "draft-release-notes",
		name: "Draft release notes",
		description: "Turn a list of merged changes into customer-ready release notes.",
		icon: "edit",
		iconColor: "text-green-500",
		publisherName: "Atlassian",
		publisherAvatarSrc: "/1p/atlassian.svg",
		companyId: "atlassian",
		categoryId: "content-communication",
		starCount: 12,
		viewCount: 410,
		tools: [{ id: "changelog", name: "Changelog", icon: "page" }],
		instructions: "Group shipped changes by customer outcome and write concise release-ready copy.",
	},
];

export default function SkillsDirectoryPage() {
	const [open, setOpen] = useState(false);

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Button onClick={() => setOpen(true)}>Browse skills</Button>
			<SkillsDirectoryDialog
				defaultSelectedSkillIds={[
					"design-landing-page",
					"develop-mobile-app-interface",
					"create-brand-identity",
				]}
				open={open}
				onOpenChange={setOpen}
				sessionSkills={DEMO_SESSION_SKILLS}
			/>
		</div>
	);
}
