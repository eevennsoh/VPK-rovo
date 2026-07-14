"use client";

import { Gallery, DEMO_GALLERY_ITEMS } from "@/components/blocks/gallery";

export default function Page(): React.ReactElement {
	return (
		<div className="relative min-h-dvh w-full bg-surface">
			<Gallery
				items={DEMO_GALLERY_ITEMS}
				renderSelectedItem={(item) => (
					<h1 className="text-center font-semibold text-4xl tracking-tight text-text sm:text-6xl">
						{item.title}
					</h1>
				)}
			/>
		</div>
	);
}
