"use client";

import SmartLinkPage from "@/components/blocks/smart-link/page";
import { SmartLink } from "@/components/blocks/smart-link/components/smart-link";
import { SMART_LINK_VARIANT_EXAMPLES } from "@/components/blocks/smart-link/data/demo-smart-links";

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
