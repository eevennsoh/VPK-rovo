"use client";

import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";

export function UtilityPreviewChatRuntimeProvider({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <RovoChatProvider>{children}</RovoChatProvider>;
}
