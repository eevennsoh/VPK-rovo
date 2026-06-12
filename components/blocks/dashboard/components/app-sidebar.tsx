"use client"

import { NavDocuments } from "./nav-documents"
import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
	SIDEBAR_USER,
	SIDEBAR_NAV_MAIN,
	SIDEBAR_NAV_SECONDARY,
	SIDEBAR_DOCUMENTS,
	SIDEBAR_LOGO_ICON,
} from "../data/sidebar-data"

export function AppSidebar({ ...props }: Readonly<React.ComponentProps<typeof Sidebar>>) {
	const LogoIcon = SIDEBAR_LOGO_ICON

	return (
		<Sidebar collapsible="offcanvas" {...props}>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							render={<a aria-label="Acme Inc." href="#" />}
							className="data-[slot=sidebar-menu-button]:!p-1.5"
						>
							<LogoIcon className="h-5 w-5" />
							<span className="text-base font-semibold">Acme Inc.</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarContent>
				<NavMain items={SIDEBAR_NAV_MAIN} />
				<NavDocuments items={SIDEBAR_DOCUMENTS} />
				<NavSecondary items={SIDEBAR_NAV_SECONDARY} className="mt-auto" />
			</SidebarContent>
			<SidebarFooter>
				<NavUser user={SIDEBAR_USER} />
			</SidebarFooter>
		</Sidebar>
	)
}
