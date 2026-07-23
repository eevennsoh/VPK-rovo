"use client";

import { JiraForYou, type JiraForYouItem } from "./index";

interface JiraForYouPageProps {
	onItemClick?: (item: JiraForYouItem) => void;
	onView?: (item: JiraForYouItem) => void;
	sections?: React.ComponentProps<typeof JiraForYou>["sections"];
	tabs?: React.ComponentProps<typeof JiraForYou>["tabs"];
}

export default function JiraForYouPage({
	onItemClick,
	onView,
	sections,
	tabs,
}: Readonly<JiraForYouPageProps> = {}) {
	return (
		<div className="rounded-lg bg-surface p-4 md:p-5">
			<JiraForYou onItemClick={onItemClick} onView={onView} sections={sections} tabs={tabs} />
		</div>
	);
}
