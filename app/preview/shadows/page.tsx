// oxlint-disable react-doctor/prefer-module-scope-static-value -- These values are intentionally colocated with the component/demo contract for readability and token context.

import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Shadows — Visual Preview",
};

export default function ShadowsPage() {
	const boxShadows = [
		{ className: "shadow-2xs", token: "--ds-shadow-raised" },
		{ className: "shadow-xs", token: "--ds-shadow-raised" },
		{ className: "shadow-sm", token: "--ds-shadow-raised" },
		{ className: "shadow-md", token: "--ds-shadow-raised + perimeter" },
		{ className: "shadow-lg", token: "--ds-shadow-overflow + perimeter" },
		{ className: "shadow-xl", token: "--ds-shadow-overlay + perimeter" },
		{ className: "shadow-2xl", token: "--ds-shadow-overlay" },
	];

	const insetShadows = [
		{ className: "inset-shadow-2xs", token: "inset 0 1px rgb(0 0 0 / 0.05)" },
		{
			className: "inset-shadow-xs",
			token: "inset 0 1px 1px rgb(0 0 0 / 0.05)",
		},
		{
			className: "inset-shadow-sm",
			token: "inset 0 2px 4px rgb(0 0 0 / 0.05)",
		},
	];

	const dropShadows = [
		{ className: "drop-shadow-xs", token: "0 1px 1px rgb(0 0 0 / 0.05)" },
		{ className: "drop-shadow-sm", token: "0 1px 2px rgb(0 0 0 / 0.15)" },
		{ className: "drop-shadow-md", token: "0 3px 3px rgb(0 0 0 / 0.12)" },
		{ className: "drop-shadow-lg", token: "0 4px 4px rgb(0 0 0 / 0.15)" },
		{ className: "drop-shadow-xl", token: "0 9px 7px rgb(0 0 0 / 0.1)" },
		{ className: "drop-shadow-2xl", token: "0 25px 25px rgb(0 0 0 / 0.15)" },
	];

	return (
		<div className="min-h-screen bg-neutral-50 p-8">
			<h1 className="mb-8 text-2xl font-semibold text-text">Shadow Showcase</h1>

			{/* Box Shadows */}
			<section className="mb-12">
				<h2 className="mb-4 text-lg font-medium text-text-subtle">Box Shadows</h2>
				<div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
					{boxShadows.map(({ className, token }) => (
						<div key={className} className="flex flex-col items-center gap-3">
							<div className={`flex h-[120px] w-[160px] items-center justify-center rounded-lg bg-white ${className}`} />
							<div className="text-center">
								<p className="text-sm font-medium text-text">{className}</p>
								<p className="text-xs text-text-subtlest">{token}</p>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Inset Shadows */}
			<section className="mb-12">
				<h2 className="mb-4 text-lg font-medium text-text-subtle">Inset Shadows</h2>
				<div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
					{insetShadows.map(({ className, token }) => (
						<div key={className} className="flex flex-col items-center gap-3">
							<div className={`flex h-[120px] w-[160px] items-center justify-center rounded-lg bg-white ${className}`} />
							<div className="text-center">
								<p className="text-sm font-medium text-text">{className}</p>
								<p className="max-w-[200px] break-words text-xs text-text-subtlest">{token}</p>
							</div>
						</div>
					))}
				</div>
			</section>

			{/* Drop Shadows */}
			<section className="mb-12">
				<h2 className="mb-4 text-lg font-medium text-text-subtle">Drop Shadows</h2>
				<div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
					{dropShadows.map(({ className, token }) => (
						<div key={className} className="flex flex-col items-center gap-3">
							<div className={`flex h-[120px] w-[160px] items-center justify-center rounded-lg bg-white ${className}`} />
							<div className="text-center">
								<p className="text-sm font-medium text-text">{className}</p>
								<p className="max-w-[200px] break-words text-xs text-text-subtlest">{token}</p>
							</div>
						</div>
					))}
				</div>
			</section>
		</div>
	);
}
