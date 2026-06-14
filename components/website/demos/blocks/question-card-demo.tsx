"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QuestionCard } from "@/components/blocks/question-card/components/question-card";
import type { QuestionCardQuestion, QuestionCardAnswers } from "@/components/blocks/question-card/components/question-card";
import {
	QUESTION_CARD_DEMO_QUESTIONS,
	QUESTION_CARD_SINGLE_SELECT_DEMO,
	QUESTION_CARD_MULTI_SELECT_DEMO,
	QUESTION_CARD_MULTI_STEP_MULTI_SELECT_DEMO,
	QUESTION_CARD_TEXT_ONLY_DEMO,
} from "@/components/blocks/question-card/data/questions";

function useQuestionCardDemo() {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [key, setKey] = useState(0);
	const submitTimeoutRef = useRef<number | null>(null);

	useEffect(
		() => () => {
			if (submitTimeoutRef.current !== null) {
				window.clearTimeout(submitTimeoutRef.current);
			}
		},
		[],
	);

	const submitAnswers = useCallback(() => {
		if (isSubmitting) return;

		setIsSubmitting(true);
		if (submitTimeoutRef.current !== null) {
			window.clearTimeout(submitTimeoutRef.current);
		}
		submitTimeoutRef.current = window.setTimeout(() => {
			setIsSubmitting(false);
			submitTimeoutRef.current = null;
		}, 600);
	}, [isSubmitting]);

	const handleDismiss = useCallback(() => {
		if (submitTimeoutRef.current !== null) {
			window.clearTimeout(submitTimeoutRef.current);
			submitTimeoutRef.current = null;
		}
		setIsSubmitting(false);
		setKey((previous) => previous + 1);
	}, []);

	return { key, isSubmitting, submitAnswers, handleDismiss };
}

function DemoWrapper({
	questions,
	maxVisibleOptions,
	customInputPlaceholder,
	showCustomInput,
	defaultAnswers,
}: Readonly<{
	questions: ReadonlyArray<QuestionCardQuestion>;
	maxVisibleOptions?: number;
	customInputPlaceholder?: string;
	showCustomInput?: boolean;
	defaultAnswers?: QuestionCardAnswers;
}>) {
	const { key, isSubmitting, submitAnswers, handleDismiss } = useQuestionCardDemo();

	return (
		<div className="flex items-center justify-center p-6">
			<QuestionCard
				key={key}
				questions={questions}
				isSubmitting={isSubmitting}
				onSubmit={submitAnswers}
				onDismiss={handleDismiss}
				maxVisibleOptions={maxVisibleOptions}
				customInputPlaceholder={customInputPlaceholder}
				showCustomInput={showCustomInput}
				defaultAnswers={defaultAnswers}
			/>
		</div>
	);
}

// Default overview demo
export default function QuestionCardDemo() {
	const { key, isSubmitting, submitAnswers, handleDismiss } = useQuestionCardDemo();

	return (
		<div className="flex items-center justify-center p-6">
			<QuestionCard key={key} questions={QUESTION_CARD_DEMO_QUESTIONS} isSubmitting={isSubmitting} onSubmit={submitAnswers} onDismiss={handleDismiss} />
		</div>
	);
}

// --- Named variant exports ---

export function QuestionCardDemoSingleSelect() {
	return <DemoWrapper questions={QUESTION_CARD_SINGLE_SELECT_DEMO} />;
}

export function QuestionCardDemoMultiSelect() {
	return <DemoWrapper questions={QUESTION_CARD_MULTI_SELECT_DEMO} />;
}

export function QuestionCardDemoMultiStepMultiSelect() {
	return <DemoWrapper questions={QUESTION_CARD_MULTI_STEP_MULTI_SELECT_DEMO} />;
}

export function QuestionCardDemoMixed() {
	return <DemoWrapper questions={QUESTION_CARD_DEMO_QUESTIONS} />;
}

export function QuestionCardDemoTextOnly() {
	return <DemoWrapper questions={QUESTION_CARD_TEXT_ONLY_DEMO} showCustomInput={true} />;
}

export function QuestionCardDemoNoCustomInput() {
	return <DemoWrapper questions={QUESTION_CARD_SINGLE_SELECT_DEMO} showCustomInput={false} />;
}

export function QuestionCardDemoCustomPlaceholder() {
	return <DemoWrapper questions={QUESTION_CARD_MULTI_SELECT_DEMO} customInputPlaceholder="Type your own answer..." />;
}

export function QuestionCardDemoPrePopulated() {
	return <DemoWrapper questions={QUESTION_CARD_MULTI_SELECT_DEMO} defaultAnswers={{ "notification-channels": ["email", "in-app"] }} />;
}
