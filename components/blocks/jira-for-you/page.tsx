"use client";

import { JiraForYou } from "./index";

export default function JiraForYouPage() {
	return (
		<div className="rounded-lg bg-surface p-4 md:p-5">
			<JiraForYou onItemClick={() => undefined} />
		</div>
	);
}
