"use client";

import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";

export function BlockPreviewChatRuntimeProvider({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <RovoChatProvider>{children}</RovoChatProvider>;
}
