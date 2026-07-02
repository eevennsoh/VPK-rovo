import type { Metadata } from "next";
import { getArtPageTitle } from "@/lib/project-page-title";

const title = getArtPageTitle("rovo-fable");

export const metadata: Metadata = {
	title,
	openGraph: {
		title: `${title} — VPK`,
	},
};

export default function RovoFableLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
