"use client";

import TopNavigation from "@/components/blocks/top-navigation/page";
import { SidebarProvider } from "@/app/contexts/context-sidebar";
import { RovoChatProvider } from "@/app/contexts";

export default function NavigationDemo() {
	return (
		<SidebarProvider>
			<RovoChatProvider>
				<TopNavigation product="studio" forceShowRovoAction />
			</RovoChatProvider>
		</SidebarProvider>
	);
}
