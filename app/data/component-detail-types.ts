export interface PropDefinition {
	name: string;
	type: string;
	default?: string;
	required?: boolean;
	description: string;
}

export interface SubComponentDoc {
	name: string;
	description: string;
	props?: PropDefinition[];
}

export interface ExampleDefinition {
	title: string;
	id?: string;
	description?: string;
	demoSlug: string;
	badge?: { label: string; variant: string };
}

export interface ExternalLinkDefinition {
	label: string;
	url: string;
}

export type DemoContentWidth = "fit" | "full";
export type DemoPreviewHeight = "fixed" | "fit" | "default";

export interface DemoLayout {
	previewContentWidth?: DemoContentWidth;
	previewHeight?: DemoPreviewHeight;
	examplesContentWidth?: DemoContentWidth;
}

export interface ComponentDetail {
	description: string;
	importStatement?: string;
	usage?: string;
	props?: PropDefinition[];
	subComponents?: SubComponentDoc[];
	examples?: ExampleDefinition[];
	demoLayout?: DemoLayout;
	adsUrl?: string;
	adsLinks?: ExternalLinkDefinition[];
}
