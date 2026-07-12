import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";

export default function SidebarChatLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <RovoChatProvider>{children}</RovoChatProvider>;
}
