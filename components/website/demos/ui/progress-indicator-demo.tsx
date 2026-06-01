"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ProgressIndicator } from "@/components/ui/progress-indicator";

export default function ProgressIndicatorDemo() {
	return (
		<div className="flex flex-col gap-4">
			<ProgressIndicator steps={5} currentStep={2} />
		</div>
	);
}

export function ProgressIndicatorDemoDefault() {
	return <ProgressIndicator steps={5} currentStep={2} />;
}

export function ProgressIndicatorDemoAppearances() {
	return (
		<div className="flex flex-col gap-4">
			<ProgressIndicator steps={3} currentStep={0} variant="default" />
			<ProgressIndicator steps={3} currentStep={0} variant="primary" />
			<ProgressIndicator steps={3} currentStep={0} variant="discovery" />
			<div className="rounded-md bg-bg-neutral-bold p-4">
				<ProgressIndicator steps={3} currentStep={0} variant="inverted" />
			</div>
		</div>
	);
}

export function ProgressIndicatorDemoSizes() {
	return (
		<div className="flex flex-col items-start gap-4">
			<ProgressIndicator steps={5} currentStep={1} size="sm" />
			<ProgressIndicator steps={5} currentStep={1} size="md" />
			<ProgressIndicator steps={5} currentStep={1} size="lg" />
		</div>
	);
}

export function ProgressIndicatorDemoInteraction() {
	const [step, setStep] = useState(0);
	const total = 5;

	return (
		<div className="flex flex-col items-center gap-4">
			<ProgressIndicator steps={total} currentStep={step} />
			<div className="flex gap-2">
				<Button variant="outline" size="default" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
					Previous
				</Button>
				<Button variant="outline" size="default" onClick={() => setStep((s) => Math.min(total - 1, s + 1))} disabled={step === total - 1}>
					Next
				</Button>
			</div>
		</div>
	);
}

export function ProgressIndicatorDemoStart() {
	return <ProgressIndicator steps={4} currentStep={0} />;
}

export function ProgressIndicatorDemoComplete() {
	return <ProgressIndicator steps={4} currentStep={3} />;
}

export function ProgressIndicatorDemoThreeSteps() {
	return <ProgressIndicator steps={3} currentStep={1} />;
}
