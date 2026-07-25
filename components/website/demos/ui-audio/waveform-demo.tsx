"use client";

import { useState, type ReactNode } from "react";
import {
	AudioScrubber,
	ScrollingWaveform,
} from "@/components/ui-audio/waveform";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { WAVEFORM_DATA } from "./demo-data-values";

function WaveformCard({
	title,
	description,
	children,
}: Readonly<{
	title: string;
	description: string;
	children: ReactNode;
}>) {
	return (
		<Card className="mx-auto w-full max-w-xl py-6">
			<CardHeader className="px-6">
				<CardTitle>{title}</CardTitle>
				<CardDescription className="text-text-subtle">
					{description}
				</CardDescription>
			</CardHeader>
			<CardContent className="px-6">{children}</CardContent>
		</Card>
	);
}

function WaveformPreview() {
	return (
		<WaveformCard
			description="Real-time audio visualization with smooth scrolling animation."
			title="Waveform"
		>
			<ScrollingWaveform
				barGap={2}
				barWidth={4}
				className="w-full text-text"
				data={WAVEFORM_DATA}
				height={80}
			/>
		</WaveformCard>
	);
}

function WaveformScrubberPreview() {
	const [time, setTime] = useState(18);

	return (
		<WaveformCard
			description="Draggable waveform review with a highlighted playback position."
			title="Audio Scrubber"
		>
			<AudioScrubber
				currentTime={time}
				data={WAVEFORM_DATA}
				duration={48}
				height={88}
				onSeek={setTime}
			/>
		</WaveformCard>
	);
}

export default function WaveformDemo() {
	return <WaveformPreview />;
}

export function WaveformDemoScrubber() {
	return <WaveformScrubberPreview />;
}

export function WaveformDemoScrolling() {
	return <WaveformPreview />;
}
