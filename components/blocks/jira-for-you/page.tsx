"use client";

import { JiraForYou, type JiraForYouItem } from "./index";

interface JiraForYouPageProps {
	onItemClick?: (item: JiraForYouItem) => void;
}

export default function JiraForYouPage({
	onItemClick,
}: Readonly<JiraForYouPageProps> = {}) {
	return (
		<div className="rounded-lg bg-surface p-4 md:p-5">
			<JiraForYou onItemClick={onItemClick} />
		</div>
	);
}
