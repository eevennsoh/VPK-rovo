import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";

export default function AsxLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return <RovoChatProvider>{children}</RovoChatProvider>;
}
