"use client";

import SmartLinkPage from "@/components/blocks/smart-link/page";
import { SmartLink, type SmartLinkSize } from "@/components/blocks/smart-link/components/smart-link";
import {
	SMART_LINK_STATUS_EXAMPLES,
	SMART_LINK_VARIANT_EXAMPLES,
} from "@/components/blocks/smart-link/data/demo-smart-links";

function SmartLinkExampleSet({
	items,
}: Readonly<{ items: (typeof SMART_LINK_VARIANT_EXAMPLES)[keyof typeof SMART_LINK_VARIANT_EXAMPLES] }>) {
	return (
		<div className="min-h-[260px] w-full bg-surface px-6 py-12 text-text">
			<div className="mx-auto flex max-w-3xl flex-col gap-5 text-xl leading-9">
				{items.map((item) => (
					<p key={item.id}>
						<SmartLink item={item} />
					</p>
				))}
			</div>
		</div>
	);
}

export default function SmartLinkDemo() {
	return <SmartLinkPage />;
}

export function SmartLinkDemoRich() {
	return <SmartLinkExampleSet items={SMART_LINK_VARIANT_EXAMPLES.rich} />;
}

export function SmartLinkDemoArticle() {
	return <SmartLinkExampleSet items={SMART_LINK_VARIANT_EXAMPLES.article} />;
}

export function SmartLinkDemoTeam() {
	return <SmartLinkExampleSet items={SMART_LINK_VARIANT_EXAMPLES.team} />;
}

export function SmartLinkDemoGoal() {
	return <SmartLinkExampleSet items={SMART_LINK_VARIANT_EXAMPLES.goal} />;
}

export function SmartLinkDemoLoom() {
	return <SmartLinkExampleSet items={SMART_LINK_VARIANT_EXAMPLES.loom} />;
}

export function SmartLinkDemoGeneric() {
	return <SmartLinkExampleSet items={SMART_LINK_VARIANT_EXAMPLES.generic} />;
}

function SmartLinkStatusSet({
	items,
	size,
}: Readonly<{ items: typeof SMART_LINK_STATUS_EXAMPLES; size?: SmartLinkSize }>) {
	return (
		<div className="flex min-h-[220px] w-full flex-col items-start gap-4 bg-surface px-6 py-12 text-text">
			{items.map((item) => (
				<SmartLink item={item} key={item.id} showStatus size={size} />
			))}
		</div>
	);
}

export function SmartLinkDemoStatus() {
	return <SmartLinkStatusSet items={SMART_LINK_STATUS_EXAMPLES} size="large" />;
}

export function SmartLinkDemoSizes() {
	const [item] = SMART_LINK_STATUS_EXAMPLES;

	return (
		<div className="flex min-h-[220px] w-full flex-col items-start gap-8 bg-surface px-6 py-12 text-text">
			<div className="flex flex-col items-start gap-2">
				<span className="text-xs font-medium leading-4 text-text-subtlest">Small · 12px</span>
				<SmartLink item={item} showStatus size="small" />
			</div>
			<div className="flex flex-col items-start gap-2">
				<span className="text-xs font-medium leading-4 text-text-subtlest">Large · 16px</span>
				<SmartLink item={item} showStatus size="large" />
			</div>
		</div>
	);
}
