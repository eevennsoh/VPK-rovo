"use client";

import type { ReactNode } from "react";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DemoSurface({
	children,
	className,
}: Readonly<{ children: ReactNode; className?: string }>) {
	return (
		<div
			className={cn(
				"flex flex-col gap-4 rounded-xl border border-border bg-surface-raised p-4 shadow-sm",
				className,
			)}
		>
			{children}
		</div>
	);
}

export function DemoCard({
	children,
	className,
	contentClassName,
	description,
	title,
}: Readonly<{
	children: ReactNode;
	className?: string;
	contentClassName?: string;
	description?: ReactNode;
	title: ReactNode;
}>) {
	return (
		<Card className={cn("mx-auto w-full max-w-xl gap-6 py-6", className)}>
			<CardHeader className="px-6">
				<CardTitle>{title}</CardTitle>
				{description ? (
					<CardDescription className="text-text-subtle">
						{description}
					</CardDescription>
				) : null}
			</CardHeader>
			<CardContent className={cn("flex flex-col gap-4 px-6", contentClassName)}>
				{children}
			</CardContent>
		</Card>
	);
}
