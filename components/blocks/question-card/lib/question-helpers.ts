import type { QuestionCardAnswerValue, QuestionCardAnswers, QuestionCardQuestion } from "../types";

export function getQuestionSignature(questions: ReadonlyArray<QuestionCardQuestion>): string {
	return JSON.stringify(questions.map((question) => question.id));
}

export function getSelectedValues(answerValue: QuestionCardAnswerValue | undefined): string[] {
	if (typeof answerValue === "string") {
		return answerValue.trim().length > 0 ? [answerValue] : [];
	}

	return Array.isArray(answerValue) ? answerValue : [];
}

export function getCustomInputValue(question: QuestionCardQuestion, answerValue: QuestionCardAnswerValue | undefined): string {
	if (typeof answerValue !== "string") {
		return "";
	}

	const hasMatchingOption = question.options.some((option) => option.id === answerValue);
	return hasMatchingOption ? "" : answerValue;
}

export function isQuestionAnswered(question: QuestionCardQuestion, answers: QuestionCardAnswers): boolean {
	const answerValue = answers[question.id];
	if (answerValue === undefined) return false;
	if (typeof answerValue === "string") return answerValue.trim().length > 0;
	if (Array.isArray(answerValue)) return answerValue.length > 0;
	return false;
}
