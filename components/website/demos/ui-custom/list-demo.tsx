"use client";

import { List, type ListColumn } from "@/components/ui-custom/list";
import { Lozenge } from "@/components/ui/lozenge";
import { TableCell, TableRow } from "@/components/ui/table";

const BASIC_COLUMNS: readonly ListColumn[] = [{}, { className: "w-[120px]" }];

const STATUS_COLUMNS: readonly ListColumn[] = [
	{},
	{ className: "w-[120px]" },
	{ className: "w-[96px]" },
];

export default function ListDemo() {
	return (
		<List.Root aria-labelledby="list-demo-heading" className="max-w-md">
			<List.Heading id="list-demo-heading">Recent work items</List.Heading>
			<List.Table columns={BASIC_COLUMNS}>
				<TableRow>
					<TableCell>PROJ-123: Add user authentication</TableCell>
					<TableCell className="text-text-subtle">2 days ago</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>PROJ-124: Update dashboard layout</TableCell>
					<TableCell className="text-text-subtle">5 days ago</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>PROJ-125: Fix production error</TableCell>
					<TableCell className="text-text-subtle">1 week ago</TableCell>
				</TableRow>
			</List.Table>
		</List.Root>
	);
}

export function ListDemoBasic() {
	return (
		<List.Root className="max-w-md">
			<List.Table columns={BASIC_COLUMNS}>
				<TableRow>
					<TableCell>Design review</TableCell>
					<TableCell className="text-text-subtle">Sarah Chen</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>API integration</TableCell>
					<TableCell className="text-text-subtle">Alex Kim</TableCell>
				</TableRow>
			</List.Table>
		</List.Root>
	);
}

export function ListDemoWithStatus() {
	return (
		<List.Root aria-labelledby="list-demo-status-heading" className="max-w-md">
			<List.Heading id="list-demo-status-heading">Sprint backlog</List.Heading>
			<List.Table columns={STATUS_COLUMNS}>
				<TableRow>
					<TableCell>PROJ-123: Add user authentication</TableCell>
					<TableCell className="text-text-subtle">Sarah Chen</TableCell>
					<TableCell>
						<Lozenge variant="information">In progress</Lozenge>
					</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>PROJ-124: Update dashboard layout</TableCell>
					<TableCell className="text-text-subtle">Alex Kim</TableCell>
					<TableCell>
						<Lozenge variant="success">Done</Lozenge>
					</TableCell>
				</TableRow>
				<TableRow>
					<TableCell>PROJ-125: Fix production error</TableCell>
					<TableCell className="text-text-subtle">Jordan Lee</TableCell>
					<TableCell>
						<Lozenge variant="danger">Critical</Lozenge>
					</TableCell>
				</TableRow>
			</List.Table>
		</List.Root>
	);
}
