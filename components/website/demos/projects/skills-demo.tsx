"use client";

import SkillsPanel from "@/components/projects/skills/page";

export default function SkillsDemo() {
	return (
		<div className="flex h-dvh min-h-0 w-full items-center justify-center overflow-hidden p-6">
			<div className="h-full max-h-[800px] min-h-0 w-[400px]">
				<SkillsPanel onClose={() => {}} />
			</div>
		</div>
	);
}
