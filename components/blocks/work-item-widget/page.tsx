"use client";

// oxlint-disable react-doctor/prefer-module-scope-pure-function -- These helpers are intentionally local to the component/demo because they depend on the surrounding interaction contract.

import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import { JiraIcon } from "@/components/ui/logo";
import { WorkItemRow } from "./components/work-item";
import type { WorkItem, WorkItemsData } from "./lib/types";
import CopyIcon from "@atlaskit/icon/core/copy";

interface WorkItemsWidgetProps {
	data: WorkItemsData;
	onInsert?: () => void;
	showInsertMenu?: boolean;
	moreMenu?: React.ReactNode;
}

const styles = {
	container: {
		backgroundColor: token("elevation.surface"),
		borderRadius: token("radius.large"),
		overflow: "hidden",
		boxShadow: token("elevation.shadow.raised"),
	},
	header: {
		padding: token("space.150"),
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		borderBottom: `1px solid ${token("color.border")}`,
	},
	headerContent: {
		display: "flex",
		alignItems: "center",
		gap: token("space.100"),
	},
	headerTitle: {
		font: token("font.body"),
		color: token("color.text"),
	},
	insertSeparator: {
		height: token("space.200"),
		borderBottom: `1px solid ${token("color.border")}`,
	},
	insertActions: {
		padding: `${token("space.100")} ${token("space.150")} ${token("space.150")}`,
		display: "flex",
		gap: token("space.100"),
	},
	errorState: {
		padding: token("space.150"),
		color: token("color.text.danger"),
	},
} as const;

export default function WorkItemsWidget({ data, onInsert, showInsertMenu, moreMenu }: Readonly<WorkItemsWidgetProps>) {
	if (!data || !data.items || !Array.isArray(data.items)) {
		return <div style={styles.errorState}>Error: Invalid widget data</div>;
	}

	const handleWorkItemClick = (item: WorkItem) => {
		void item;
		// Click handler - implement navigation or modal as needed
	};

	const showInsertActions = showInsertMenu ?? Boolean(onInsert);

	return (
		<div style={styles.container}>
			<div style={styles.header}>
				<div style={styles.headerContent}>
					<JiraIcon label="Jira" size="xsmall" />
					<div style={styles.headerTitle}>
						{data.assignedTo ? `Work items assigned to ${data.assignedTo}` : "Work Items"}
					</div>
				</div>
				{moreMenu}
			</div>

			{data.items.map((item, index) => (
				<WorkItemRow
					key={item.key}
					item={item}
					isLast={index === data.items.length - 1}
					onClick={handleWorkItemClick}
				/>
			))}

			{showInsertActions && onInsert && (
				<>
					<div style={styles.insertSeparator} />
					<div style={styles.insertActions}>
						<Button variant="secondary" onClick={onInsert}>
							Insert in page
						</Button>
						<Button aria-label="Copy" size="icon" variant="ghost">
							<CopyIcon label="" />
						</Button>
					</div>
				</>
			)}
		</div>
	);
}
