export type QuestionCardPrimaryAction = "skip" | "next" | "submit";

/**
 * Determine the footer primary CTA:
 * - "submit" when every question has an answer, or the current (answered) question is the last one
 * - "next" when the current question has an answer (an option selection or custom input text) and a later question remains
 * - "skip" otherwise (header dismiss owns cancel; the footer never renders a Skip button)
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

export function shouldShowQuestionCardFooterButton(primaryAction: QuestionCardPrimaryAction): boolean {
	switch (primaryAction) {
		case "submit":
		case "next":
			return true;
		case "skip":
			return false;
		default: {
			const _exhaustive: never = primaryAction;
			return _exhaustive;
		}
	}
}

export function shouldShowQuestionCardFooter(
	showCustomInput: boolean,
	primaryAction: QuestionCardPrimaryAction,
): boolean {
	return showCustomInput || shouldShowQuestionCardFooterButton(primaryAction);
}
