import { Button } from "@/components/ui/button";
import { token } from "@/lib/tokens";
import Link from "next/link";

export default function NotFound() {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				minHeight: "100vh",
				gap: token("space.200"),
				padding: token("space.400"),
				backgroundColor: token("elevation.surface"),
			}}
		>
			<h2
				style={{
					fontSize: "48px",
					fontWeight: 700,
					color: token("color.text"),
					letterSpacing: "-0.02em",
				}}
			>
				404
			</h2>
			<p
				style={{
					fontSize: "16px",
					color: token("color.text.subtlest"),
					textAlign: "center",
					maxWidth: "400px",
				}}
			>
				The page you are looking for does not exist.
			</p>
			<Button
				className="no-underline hover:no-underline visited:text-primary-foreground active:text-primary-foreground"
				nativeButton={false}
				render={<Link href="/" />}
				size="default"
			>
				Go home
			</Button>
		</div>
	);
}
