"use client";

import { JiraActivity } from "./index";

export default function JiraActivityPage() {
	return (
		<div className="flex w-full justify-center bg-surface p-6">
			<div className="w-full max-w-2xl">
				<JiraActivity />
			</div>
		</div>
	);
}
