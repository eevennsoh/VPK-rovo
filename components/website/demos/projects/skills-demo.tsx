"use client";

import SkillsPanel from "@/components/projects/skills/page";

export default function SkillsDemo() {
	return (
		<div className="flex h-full w-full items-center justify-center p-6">
			<div className="h-[800px] w-[400px]">
				<SkillsPanel onClose={() => {}} />
			</div>
		</div>
	);
}
