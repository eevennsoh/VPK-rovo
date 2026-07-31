import type { Metadata } from "next";
import { getArtPageTitle } from "@/lib/project-page-title";

const title = getArtPageTitle("rovo-p5");

export const metadata: Metadata = {
	title,
	openGraph: {
		title: `${title} — VPK`,
	},
};

export default function RovoP5Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	return children;
}
