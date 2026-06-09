"use client";

import { SmartLink } from "@/components/blocks/smart-link/components/smart-link";
import { SMART_LINK_DEMO_ITEMS } from "@/components/blocks/smart-link/data/demo-smart-links";

export interface SmartLinkPageProps {
	items?: typeof SMART_LINK_DEMO_ITEMS;
}

export default function SmartLinkPage({
	items = SMART_LINK_DEMO_ITEMS,
}: Readonly<SmartLinkPageProps>): React.ReactElement {
	return (
		<div className="min-h-[560px] w-full bg-surface px-8 py-16 text-text">
			<div className="mx-auto max-w-5xl">
				<div className="space-y-5 text-xl leading-9">
					<p>
						<SmartLink item={items[0]} /> keeps planning work connected to source context while updates flow through related references.
					</p>
					<p>
						Research references include <SmartLink item={items[1]} /> and internal notes such as <SmartLink item={items[2]} />.
					</p>
					<p>
						Review with <SmartLink item={items[3]} /> before sharing the motion goal: <SmartLink item={items[4]} />.
					</p>
					<p>
						Watch <SmartLink item={items[5]} /> and compare it with supporting files like <SmartLink item={items[6]} /> or <SmartLink item={items[7]} />.
					</p>
				</div>
			</div>
		</div>
	);
}

export { SmartLink, SmartLinkCard } from "@/components/blocks/smart-link/components/smart-link";
export type {
	SmartLinkAction,
	SmartLinkAvatar,
	SmartLinkItem,
	SmartLinkMetadata,
	SmartLinkPreviewImage,
	SmartLinkProps,
	SmartLinkProvider,
	SmartLinkVariant,
	SmartLinkVisual,
} from "@/components/blocks/smart-link/components/smart-link";
