"use client";

import { useState } from "react";

import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";
import { JiraForYouWorkspace } from "@/components/blocks/jira-for-you";
import ProductSidebar from "@/components/blocks/product-sidebar/page";
import { JiraSidebar } from "@/components/blocks/product-sidebar/variants/jira";
import TopNavigation from "@/components/blocks/top-navigation/page";

function JiraForYouPreviewShell() {
	const [selectedSidebarItem, setSelectedSidebarItem] = useState("For you");

	return (
		<TopNavigation
			forceShowRovoAction
			product="jira"
			searchAlignment="sidebar"
			variant="shell"
			sidebar={(slot) => (
				<ProductSidebar
					content={(
						<JiraSidebar
							onSelectItem={setSelectedSidebarItem}
							selectedItem={selectedSidebarItem}
						/>
					)}
					product="jira"
					asChromeSlot
					resizeHandle={slot.resizeHandle}
					isResizing={slot.isResizing}
					headerOffsetPx={slot.headerOffsetPx}
					topOffset
				/>
			)}
		>
			<main className="flex min-h-0 min-w-0 flex-1 overflow-hidden bg-background">
				<JiraForYouWorkspace chrome="plain" className="h-full min-h-0 flex-1" />
			</main>
		</TopNavigation>
	);
}

export default function JiraForYouPreviewPage() {
	return (
		<RovoChatProvider>
			<JiraForYouPreviewShell />
		</RovoChatProvider>
	);
}
