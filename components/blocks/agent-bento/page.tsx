"use client";

import {
	AgentCompactOperationsBento,
	HomeStarterBento,
} from "@/components/blocks/agent-bento";

export default function AgentBentoPage() {
	return (
		<div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col gap-16 px-4 py-12">
			<section className="flex flex-col gap-4">
				<header className="flex flex-col gap-1">
					<h2 className="text-base font-semibold leading-6 text-text">Landing agent bento</h2>
					<p className="text-sm leading-5 text-text-subtle">
						Tabbed prompt-starter bento with an auto-cycling category bar and a hero
						tile. The desktop grid collapses to a horizontal carousel below the
						<code className="mx-1 rounded-xs bg-bg-neutral px-1 py-0.5 text-xs">lg</code>
						breakpoint — resize the viewport to see the responsive version.
					</p>
				</header>
				<HomeStarterBento />
			</section>

			<section className="flex flex-col gap-4">
				<header className="flex flex-col gap-1">
					<h2 className="text-base font-semibold leading-6 text-text">Minimal agent bento</h2>
					<p className="text-sm leading-5 text-text-subtle">
						Compact &ldquo;Start with these agent templates&rdquo; row of five
						prompt-starter tiles. Also collapses to a horizontal carousel on smaller
						viewports.
					</p>
				</header>
				<AgentCompactOperationsBento />
			</section>
		</div>
	);
}
