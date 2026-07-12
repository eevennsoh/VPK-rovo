import type { Metadata } from "next";
import { RovoAppQueueProvider } from "@/app/rovo/rovo-queue-provider";
import { RovoChatProvider } from "@/app/contexts/context-rovo-chat";
import { getProjectPageTitle } from "@/lib/project-page-title";

export const metadata: Metadata = {
	title: getProjectPageTitle("rovo"),
	description: "Rovo interface",
	openGraph: {
		title: `${getProjectPageTitle("rovo")} — VPK`,
		description: "Rovo interface",
	},
};

export default function RovoAppLayout({ children }: { children: React.ReactNode }) {
	return (
		<RovoChatProvider>
			<RovoAppQueueProvider>{children}</RovoAppQueueProvider>
		</RovoChatProvider>
	);
}
