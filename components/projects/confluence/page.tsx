"use client";

import dynamic from "next/dynamic";
import { token } from "@/lib/tokens";
import ConfluenceHeader from "./components/confluence-header";
import FloatingConfluenceActions from "./components/floating-confluence-actions";

// Lazy-load the document editor: it pulls in the full @tiptap / ProseMirror
// editor stack. Code-splitting keeps that out of the route's initial chunk; it
// loads when the Confluence view mounts, client-only.
const DocumentEditor = dynamic(() => import("./components/document-editor"), {
	ssr: false,
});

interface ConfluenceViewProps {
	embedded?: boolean;
}

export default function ConfluenceView({
	embedded = false,
}: Readonly<ConfluenceViewProps>) {
	return (
		<div
			style={{
				height: "var(--vpk-project-shell-content-height, calc(100vh - 48px))",
				display: "flex",
				flexDirection: "column",
				overflow: "hidden",
				position: "relative",
			}}
		>
			{/* Fixed Header */}
			<ConfluenceHeader embedded={embedded} />

			{/* Scrollable Content Area */}
			<div
				style={{
					flex: 1,
					overflow: "auto",
					marginTop: "56px", // Height of fixed header
				}}
			>
				<div
					style={{
						padding: `0px ${token("space.300")}`,
						display: "flex",
						justifyContent: "center",
					}}
				>
					<div style={{ maxWidth: "760px", width: "100%" }}>
						<DocumentEditor />
					</div>
				</div>
			</div>

			{/* Floating Confluence Actions */}
			<FloatingConfluenceActions embedded={embedded} />
		</div>
	);
}
