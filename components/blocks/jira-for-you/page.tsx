"use client";

import { useState } from "react";

import ProductSidebar from "@/components/blocks/product-sidebar/page";
import { JiraSidebar } from "@/components/blocks/product-sidebar/variants/jira";
import TopNavigation from "@/components/blocks/top-navigation/page";

import {
	JiraForYou,
	JiraForYouWorkspace,
	type JiraForYouItem,
} from "./index";

interface JiraForYouPageProps {
	onItemClick?: (item: JiraForYouItem) => void;
	onView?: (item: JiraForYouItem) => void;
	sections?: React.ComponentProps<typeof JiraForYou>["sections"];
	tabs?: React.ComponentProps<typeof JiraForYou>["tabs"];
}

export default function JiraForYouPage({
	onItemClick,
	onView,
	sections,
	tabs,
}: Readonly<JiraForYouPageProps> = {}) {
	return (
		<div className="rounded-lg bg-surface p-4 md:p-5">
			<JiraForYou onItemClick={onItemClick} onView={onView} sections={sections} tabs={tabs} />
		</div>
	);
}

interface JiraForYouShellProps {
	shellHeight?: "parent" | "viewport";
}

/** Full Jira product chrome for the For You workspace. */
export function JiraForYouShell({
	shellHeight = "viewport",
}: Readonly<JiraForYouShellProps>): React.ReactElement {
	const [selectedSidebarItem, setSelectedSidebarItem] = useState("For you");

	return (
		<TopNavigation
			forceShowRovoAction
			product="jira"
			searchAlignment="sidebar"
			shellHeight={shellHeight}
			sidebar={(slot) => (
				<ProductSidebar
					asChromeSlot
					content={(
						<JiraSidebar
							onSelectItem={setSelectedSidebarItem}
							selectedItem={selectedSidebarItem}
						/>
					)}
					headerOffsetPx={slot.headerOffsetPx}
					isResizing={slot.isResizing}
					product="jira"
					resizeHandle={slot.resizeHandle}
					topOffset
				/>
			)}
			variant="shell"
		>
			<main className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-background">
				<JiraForYouWorkspace chrome="plain" className="h-full min-h-0 flex-1" />
			</main>
		</TopNavigation>
	);
}
