"use client";

import { Label, Pie, PieChart } from "recharts";

import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import {
	USER_SEGMENT_CHART_CONFIG,
	USER_SEGMENT_DATA,
	formatUserCount,
	getTotalUsers,
} from "@/app/data/dashboard-product";

const chartConfig = {
	...USER_SEGMENT_CHART_CONFIG,
} satisfies ChartConfig;

export function ChartUserSegments() {
	const totalUsers = getTotalUsers();

	return (
		<Card className="@container/card flex flex-col">
			<CardHeader className="items-center pb-0">
				<CardTitle>User Segments</CardTitle>
				<CardDescription>Distribution by plan type</CardDescription>
			</CardHeader>
			<CardContent className="flex-1 px-2 pt-4 sm:px-6 sm:pt-6">
				<ChartContainer
					config={chartConfig}
					className="mx-auto aspect-square max-h-[280px]"
				>
					<PieChart>
						<ChartTooltip
							cursor={false}
							content={
								<ChartTooltipContent
									hideLabel
									formatter={(value) => formatUserCount(value as number)}
								/>
							}
						/>
						<Pie
							data={USER_SEGMENT_DATA}
							dataKey="users"
							nameKey="segment"
							innerRadius={60}
							strokeWidth={5}
						>
							<Label
								content={({ viewBox }) => {
									if (viewBox && "cx" in viewBox && "cy" in viewBox) {
										return (
											<text
												x={viewBox.cx}
												y={viewBox.cy}
												textAnchor="middle"
												dominantBaseline="middle"
											>
												<tspan
													x={viewBox.cx}
													y={viewBox.cy}
													className="fill-foreground text-3xl font-bold"
												>
													{formatUserCount(totalUsers)}
												</tspan>
												<tspan
													x={viewBox.cx}
													y={(viewBox.cy ?? 0) + 24}
													className="fill-muted-foreground"
												>
													Total Users
												</tspan>
											</text>
										);
									}
									return null;
								}}
							/>
						</Pie>
						<ChartLegend
							content={
								<ChartLegendContent
									nameKey="segment"
									className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
								/>
							}
						/>
					</PieChart>
				</ChartContainer>
			</CardContent>
			<CardFooter className="flex-col gap-2 text-sm">
				<div className="leading-none text-muted-foreground">
					{formatUserCount(totalUsers)} users across all plan types
				</div>
			</CardFooter>
		</Card>
	);
}
