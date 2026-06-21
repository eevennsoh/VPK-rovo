"use client";

import Heading from "@/components/ui/heading";

const HEADING_SIZES = [
	"xxlarge",
	"xlarge",
	"large",
	"medium",
	"small",
	"xsmall",
	"xxsmall",
] as const;

export default function HeadingDemo() {
	return <HeadingDemoScale />;
}

export function HeadingDemoScale() {
	return (
		<div className="mx-auto grid w-full max-w-[560px] gap-4">
			{HEADING_SIZES.map((size) => (
				<div key={size} className="grid gap-1 border-b border-border pb-3 last:border-b-0 last:pb-0">
					<span className="text-text-subtle text-xs uppercase">{size}</span>
					<Heading size={size}>Build visible shared UI primitives</Heading>
				</div>
			))}
		</div>
	);
}

export function HeadingDemoSemantics() {
	return (
		<div className="mx-auto grid w-full max-w-[560px] gap-4">
			<Heading as="h1" size="xlarge">Project overview</Heading>
			<Heading as="h2" size="large">Recent activity</Heading>
			<Heading as="h3" size="small" className="text-text-subtle">Shared utilities</Heading>
			<Heading as="p" size="xxsmall" className="text-text-subtlest">
				The rendered element changes independently from the visual heading token.
			</Heading>
		</div>
	);
}
