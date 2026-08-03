import type { ComponentDetail } from "@/app/data/component-detail-types";

export const ARTIFACT_PANE_DETAIL: ComponentDetail = {
	description:
		"Reusable artifact details rail with independently collapsible sections and a shared icon, label, and value property-row pattern. It owns the unified surface, disclosure controls, spacing, and internal dividers while consumers supply domain-specific content.",
	demoLayout: { previewHeight: "fit" },
	importStatement: `import { ArtifactPane } from "@/components/blocks/artifact-pane";`,
	usage: `import { ArtifactPane } from "@/components/blocks/artifact-pane";

<ArtifactPane
  sections={[
    { id: "details", title: "Details", content: <ArtifactDetails />, defaultOpen: true },
    { id: "automation", title: "Automation", content: <ArtifactAutomation /> },
  ]}
/>`,
	props: [
		{
			name: "sections",
			type: "readonly ArtifactPaneSectionItem[]",
			required: true,
			description: "Ordered disclosure sections. Each section supplies a stable id, title, content, and optional defaultOpen state.",
		},
		{
			name: "borderless",
			type: "boolean",
			default: "false",
			description: "Removes the hairline border for elevated overlay presentations.",
		},
		{
			name: "className",
			type: "string",
			description: "Additional classes applied to the pane surface.",
		},
	],
};
