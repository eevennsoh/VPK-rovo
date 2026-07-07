"use client";

import { token } from "@/lib/tokens";
import { Gallery, DEMO_GALLERY_ITEMS } from "@/components/blocks/gallery";

// ---------------------------------------------------------------------------
// Sample scrollable content
//
// The Gallery pins its own strip + progressive backdrop blur to the bottom of
// the viewport. To make that blur read, we render a few tall sections of
// headings + placeholder paragraph cards behind it so there is real content to
// scroll under the strip.
// ---------------------------------------------------------------------------

const SECTIONS: ReadonlyArray<{ title: string; body: readonly string[] }> = [
	{
		title: "A quiet studio",
		body: [
			"This is placeholder copy behind the gallery. Scroll the page and the strip stays pinned to the bottom while the content slides underneath its progressive blur.",
			"Each paragraph card uses semantic surface and text tokens so it reads correctly in both light and dark themes without any per-mode overrides.",
			"Keep scrolling to see the blur ramp interact with denser blocks of text lower on the page.",
		],
	},
	{
		title: "Field recordings",
		body: [
			"The cards at the bottom magnify toward the cursor like a macOS dock and can be dragged left and right to pan the strip.",
			"Click any card to morph it into a centered detail view over a dimmed scrim; dismiss it with the scrim, Escape, or the close button.",
			"The toggle pill in the corner slides the whole strip out of the way and back.",
		],
	},
	{
		title: "Late edits",
		body: [
			"All of this content is inert filler — it exists only to give the backdrop blur something to blur.",
			"Motion respects reduced-motion preferences: magnification, drag pausing, and the expand morph all collapse to plain fades when the user opts out.",
			"The strip and its overlay are siblings inside the block, so the expand animation is never clipped by the scroll container's edge mask.",
		],
	},
];

export default function Page(): React.ReactElement {
	return (
		<div className="relative min-h-dvh w-full bg-surface">
			<div className="mx-auto flex max-w-3xl flex-col gap-16 px-6 pt-16 pb-80">
				{SECTIONS.map((section) => (
					<section key={section.title} className="flex flex-col gap-6">
						<h2 className="text-text" style={{ font: token("font.heading.large") }}>
							{section.title}
						</h2>
						<div className="flex flex-col gap-4">
							{section.body.map((paragraph, index) => (
								<div
									key={index}
									className="rounded-xl bg-surface-raised p-6 text-sm leading-6 text-text-subtle"
								>
									{paragraph}
								</div>
							))}
						</div>
					</section>
				))}
			</div>

			<Gallery items={DEMO_GALLERY_ITEMS} />
		</div>
	);
}
