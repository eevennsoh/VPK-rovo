import type { ComponentDetail } from "@/app/data/component-detail-types";

export const GALLERY_DETAIL: ComponentDetail = {
	description:
		"A bottom-pinned dock carousel: a horizontally scrollable strip of mixed-size cards pinned to the viewport bottom, sitting on a progressive backdrop blur of the page behind it. Cards magnify with cursor proximity (macOS-dock style), click to expand into a centered shared-element morph over a dimmed scrim, and a built-in toggle pill slides the strip in and out. Each card is a light-grey squircle surface whose title auto-scales to fill it.",
	demoLayout: { previewHeight: "fixed", previewContentWidth: "full" },
	importStatement: `import { Gallery, type GalleryItem } from "@/components/blocks/gallery";`,
	usage: `const items: GalleryItem[] = [
  {
    id: "aurora",
    title: "Aurora",
    description: "Northern lights over the fjords.",
    size: "portrait",
  },
  // …more items
];

<Gallery items={items} />

// Controlled visibility
<Gallery items={items} open={open} onOpenChange={setOpen} />`,
	props: [
		{ name: "items", type: "readonly GalleryItem[]", required: true, description: "Cards to render in the dock. Each item has an id, title, description, and size (\"portrait\" | \"landscape\" | \"1x1\")." },
		{ name: "open", type: "boolean", description: "Controlled visibility of the pinned strip. Pair with onOpenChange." },
		{ name: "defaultOpen", type: "boolean", default: "true", description: "Initial visibility when uncontrolled." },
		{ name: "onOpenChange", type: "(open: boolean) => void", description: "Called whenever the strip is shown or hidden (via the toggle pill or controlled prop)." },
		{ name: "className", type: "string", description: "Extra classes merged onto the block root." },
	],
};
