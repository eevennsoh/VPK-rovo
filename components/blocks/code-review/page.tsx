"use client";

import { CodeReview } from "./components/code-review";

export default function CodeReviewPage() {
	return (
		<main className="h-screen">
			<CodeReview defaultOpen />
		</main>
	);
}
