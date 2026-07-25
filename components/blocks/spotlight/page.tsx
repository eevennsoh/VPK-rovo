"use client";

import { useState } from "react";
import Image from "next/image";
import ArrowRightIcon from "@atlaskit/icon/core/arrow-right";
import { Button } from "@/components/ui/button";
import {
	SpotlightActions,
	SpotlightBody,
	SpotlightCard,
	SpotlightControls,
	SpotlightDismissControl,
	SpotlightFooter,
	SpotlightHeader,
	SpotlightHeadline,
	SpotlightMedia,
	SpotlightPrimaryAction,
	SpotlightSecondaryAction,
	SpotlightStepCount,
} from "@/components/blocks/spotlight/components/spotlight-card";
import { SpotlightTarget } from "@/components/blocks/spotlight/components/spotlight-target";
import { SPOTLIGHT_PLACEMENTS, type SpotlightPlacement } from "@/components/blocks/spotlight/spotlight-placement";
import { SPOTLIGHT_MEDIA_SRC, SPOTLIGHT_TOUR_STEPS } from "@/components/blocks/spotlight/data/demo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// ---------------------------------------------------------------------------
// Example: focused message
// ---------------------------------------------------------------------------

export function SpotlightBasicExample(): React.ReactElement {
	return (
		<SpotlightCard>
			<SpotlightHeader>
				<SpotlightHeadline>Introducing Rovo agents</SpotlightHeadline>
				<SpotlightControls>
					<SpotlightDismissControl />
				</SpotlightControls>
			</SpotlightHeader>
			<SpotlightBody>
				Your AI teammates can now draft, summarize, and automate work right where you already work.
			</SpotlightBody>
			<SpotlightFooter>
				<span />
				<SpotlightActions>
					<SpotlightPrimaryAction>Got it</SpotlightPrimaryAction>
				</SpotlightActions>
			</SpotlightFooter>
		</SpotlightCard>
	);
}

// ---------------------------------------------------------------------------
// Example: with media
// ---------------------------------------------------------------------------

export function SpotlightMediaExample(): React.ReactElement {
	return (
		<SpotlightCard>
			<SpotlightHeader>
				<SpotlightHeadline>Start a conversation</SpotlightHeadline>
				<SpotlightControls>
					<SpotlightDismissControl />
				</SpotlightControls>
			</SpotlightHeader>
			<SpotlightMedia className="h-[135px] bg-blue-50">
				<Image src={SPOTLIGHT_MEDIA_SRC} alt="" width={320} height={135} className="size-full object-cover" />
			</SpotlightMedia>
			<SpotlightBody>
				Ask Rovo anything about your projects, pages, and issues — it answers with your team&apos;s context.
			</SpotlightBody>
			<SpotlightFooter>
				<span />
				<SpotlightActions>
					<SpotlightSecondaryAction>Maybe later</SpotlightSecondaryAction>
					<SpotlightPrimaryAction>Try it</SpotlightPrimaryAction>
				</SpotlightActions>
			</SpotlightFooter>
		</SpotlightCard>
	);
}

// ---------------------------------------------------------------------------
// Example: multi-step tour
// ---------------------------------------------------------------------------

function useTour() {
	const [step, setStep] = useState(0);
	const total = SPOTLIGHT_TOUR_STEPS.length;
	const isFirst = step === 0;
	const isLast = step === total - 1;
	const back = () => setStep((prev) => Math.max(0, prev - 1));
	const next = () => setStep((prev) => Math.min(total - 1, prev + 1));
	return { step, total, isFirst, isLast, back, next, reset: () => setStep(0) };
}

export function SpotlightTourExample(): React.ReactElement {
	const { step, total, isFirst, isLast, back, next } = useTour();
	const current = SPOTLIGHT_TOUR_STEPS[step];

	return (
		<SpotlightCard>
			<SpotlightHeader>
				<SpotlightHeadline>{current.headline}</SpotlightHeadline>
				<SpotlightControls>
					<SpotlightDismissControl label="Skip tour" />
				</SpotlightControls>
			</SpotlightHeader>
			<SpotlightBody>{current.body}</SpotlightBody>
			<SpotlightFooter>
				<SpotlightStepCount current={step + 1} total={total} />
				<SpotlightActions>
					{isFirst ? null : <SpotlightSecondaryAction onClick={back}>Back</SpotlightSecondaryAction>}
					<SpotlightPrimaryAction onClick={isLast ? undefined : next}>
						{isLast ? "Done" : "Next"}
						{isLast ? null : <ArrowRightIcon label="" size="small" />}
					</SpotlightPrimaryAction>
				</SpotlightActions>
			</SpotlightFooter>
		</SpotlightCard>
	);
}

// ---------------------------------------------------------------------------
// Example: targeted with pulse
// ---------------------------------------------------------------------------

export function SpotlightTargetExample(): React.ReactElement {
	const [open, setOpen] = useState(true);

	return (
		<div className="flex min-h-48 items-center justify-center">
			<SpotlightTarget
				open={open}
				onOpenChange={setOpen}
				side="bottom"
				content={
					<SpotlightCard>
						<SpotlightHeader>
							<SpotlightHeadline>Create your first agent</SpotlightHeadline>
							<SpotlightControls>
								<SpotlightDismissControl onClick={() => setOpen(false)} />
							</SpotlightControls>
						</SpotlightHeader>
						<SpotlightBody>
							Click here whenever you want to spin up a new Rovo agent from a template or from scratch.
						</SpotlightBody>
						<SpotlightFooter>
							<SpotlightStepCount current={1} total={1} />
							<SpotlightActions>
								<SpotlightPrimaryAction onClick={() => setOpen(false)}>Got it</SpotlightPrimaryAction>
							</SpotlightActions>
						</SpotlightFooter>
					</SpotlightCard>
				}
			>
				<Button variant="discovery">Create agent</Button>
			</SpotlightTarget>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Example: placements
// ---------------------------------------------------------------------------

export function SpotlightPlacementsExample(): React.ReactElement {
	const [placement, setPlacement] = useState<SpotlightPlacement>("bottom-center");
	const [open, setOpen] = useState(true);

	return (
		<div className="flex min-h-72 w-full max-w-sm flex-col items-center justify-center gap-6">
			<SpotlightTarget
				open={open}
				onOpenChange={(next, details) => {
					// Keep the spotlight open while interacting with the placement picker.
					if (!next && details.reason === "outside-press") return;
					setOpen(next);
				}}
				placement={placement}
				pulse={false}
				content={
					<SpotlightCard className="w-72">
						<SpotlightHeader>
							<SpotlightHeadline>Headline</SpotlightHeadline>
							<SpotlightControls>
								<SpotlightDismissControl onClick={() => setOpen(false)} />
							</SpotlightControls>
						</SpotlightHeader>
						<SpotlightBody>Brief and direct textual content to elaborate on the intent.</SpotlightBody>
						<SpotlightFooter>
							<span />
							<SpotlightActions>
								<SpotlightPrimaryAction onClick={() => setOpen(false)}>Done</SpotlightPrimaryAction>
							</SpotlightActions>
						</SpotlightFooter>
					</SpotlightCard>
				}
			>
				<Button>Show Spotlight</Button>
			</SpotlightTarget>
			<Select value={placement} onValueChange={(value) => setPlacement(value as SpotlightPlacement)}>
				<SelectTrigger className="w-52">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{SPOTLIGHT_PLACEMENTS.map((option) => (
						<SelectItem key={option} value={option}>
							Placement: {option}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Demo page
// ---------------------------------------------------------------------------

export default function SpotlightPage(): React.ReactElement {
	return (
		<div className="flex w-full flex-col items-center gap-8 p-10">
			<SpotlightBasicExample />
			<SpotlightMediaExample />
			<SpotlightTourExample />
			<SpotlightTargetExample />
			<SpotlightPlacementsExample />
		</div>
	);
}
