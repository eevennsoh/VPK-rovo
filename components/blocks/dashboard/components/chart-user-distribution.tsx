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
	USER_DISTRIBUTION_CHART_CONFIG,
	USER_DISTRIBUTION_DATA,
	formatKpiUserCount,
	getTotalDistributionUsers,
} from "@/app/data/dashboard-kpi-analytics";

const chartConfig = {
	...USER_DISTRIBUTION_CHART_CONFIG,
} satisfies ChartConfig;

export function ChartUserDistribution() {
	const totalUsers = getTotalDistributionUsers();

	return (
		<Card className="@container/card flex flex-col">
			<CardHeader className="items-center pb-0">
				<CardTitle>User Distribution</CardTitle>
				<CardDescription>Breakdown by customer segment</CardDescription>
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
									formatter={(value) => formatKpiUserCount(value as number)}
								/>
							}
						/>
						<Pie
							data={USER_DISTRIBUTION_DATA}
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
													{formatKpiUserCount(totalUsers)}
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
					{formatKpiUserCount(totalUsers)} users across all customer segments
				</div>
			</CardFooter>
		</Card>
	);
}
