"use client";

import {
	SidebarGroup,
	SidebarMenu,
	SidebarMenuItem,
	SidebarMenuButton,
} from "@/components/ui/sidebar";
import { NAV_ITEMS } from "../data/sidebar-data";

export function NavMain() {
	return (
		<SidebarGroup>
			<SidebarMenu>
				{NAV_ITEMS.map((item) => (
					<SidebarMenuItem key={item.title}>
						<SidebarMenuButton
							tooltip={item.title}
							isActive={"isActive" in item && item.isActive}
							render={<a aria-label={item.title} href={item.url} />}
						>
							<item.icon label="" />
							<span>{item.title}</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				))}
			</SidebarMenu>
		</SidebarGroup>
	);
}
