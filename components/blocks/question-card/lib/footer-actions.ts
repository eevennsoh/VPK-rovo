export type QuestionCardPrimaryAction = "skip" | "next" | "submit";

/**
 * Determine the footer primary CTA:
 * - "submit" when every question has an answer, or the current (answered) question is the last one
 * - "next" when the current question has an answer (an option selection or custom input text) and a later question remains
 * - "skip" otherwise
 */
export function getQuestionCardPrimaryAction(
	allQuestionsAnswered: boolean,
	currentQuestionAnswered: boolean,
	canGoToNextQuestion: boolean,
): QuestionCardPrimaryAction {
	if (allQuestionsAnswered) return "submit";
	if (currentQuestionAnswered) return canGoToNextQuestion ? "next" : "submit";
	return "skip";
}
