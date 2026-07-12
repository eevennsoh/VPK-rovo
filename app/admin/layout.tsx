import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";

export const metadata: Metadata = {
	title: "Administration",
	description: "Administration settings and configuration",
};

export default function AdminLayout({
	children,
}: Readonly<{
	children: ReactNode;
}>) {
	return <RovoChatProvider>{children}</RovoChatProvider>;
}
