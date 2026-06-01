"use client";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function PageHeaderDemo() {
	return (
		<PageHeader
			title="Page title"
			description="A short description of the page content."
		/>
	);
}

export function PageHeaderDemoDefault() {
	return <PageHeader title="Projects" />;
}

export function PageHeaderDemoWithDescription() {
	return (
		<PageHeader
			title="Team settings"
			description="Manage your team members and their permissions."
		/>
	);
}

export function PageHeaderDemoWithActions() {
	return (
		<PageHeader
			title="Issues"
			description="Track and manage issues across your projects."
			actions={
				<>
					<Button variant="outline" size="default">Export</Button>
					<Button size="default">Create issue</Button>
				</>
			}
		/>
	);
}

export function PageHeaderDemoWithBreadcrumbs() {
	return (
		<PageHeader
			title="Sprint board"
			description="Current sprint tasks and progress."
			breadcrumbs={
				<nav className="flex items-center gap-1.5 text-sm text-text-subtle">
					<a href="#" className="hover:text-text hover:underline">Projects</a>
					<span>/</span>
					<a href="#" className="hover:text-text hover:underline">My project</a>
					<span>/</span>
					<span className="text-text">Sprint board</span>
				</nav>
			}
			actions={<Button size="default">Complete sprint</Button>}
		/>
	);
}

export function PageHeaderDemoTitleOnly() {
	return <PageHeader title="Dashboard" />;
}
