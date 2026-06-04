"use client";

import { usePathname } from "next/navigation";
import RovoButtonProjectPage from "@/components/projects/rovo-button/page";
import { useProjectDemoEmbedded } from "./use-project-demo-embedded";

export default function RovoButtonDemo() {
	const embedded = useProjectDemoEmbedded();
	const pathname = usePathname();
	const embeddedHeight = pathname.startsWith("/components/") ? "parent" : "viewport";

	return <RovoButtonProjectPage embedded={embedded} embeddedHeight={embeddedHeight} />;
}
