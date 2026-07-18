"use client";

import type { ReactElement } from "react";

import SkillSelectorPage from "@/components/blocks/skill-selector/page";

export default function SkillSelectorDemo(): ReactElement {
	return (
		<div className="flex items-center justify-center p-6">
			<div className="w-full max-w-80">
				<SkillSelectorPage />
			</div>
		</div>
	);
}

export function SkillSelectorDemoStandalone(): ReactElement {
	return (
		<div className="flex min-h-[32rem] w-full items-start justify-center p-6 pt-8">
			<SkillSelectorPage presentation="standalone" />
		</div>
	);
}
