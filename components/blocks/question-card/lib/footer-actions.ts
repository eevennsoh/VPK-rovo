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

/** Skip is redundant with the header dismiss control when the custom input row is hidden. */
export function shouldShowQuestionCardSkipAction(
	showCustomInput: boolean,
	primaryAction: QuestionCardPrimaryAction,
	hasDismissControl: boolean,
): boolean {
	if (primaryAction !== "skip") {
		return false;
	}

	return showCustomInput || !hasDismissControl;
}

export function shouldShowQuestionCardFooter(
	showCustomInput: boolean,
	primaryAction: QuestionCardPrimaryAction,
	hasDismissControl: boolean,
): boolean {
	switch (primaryAction) {
		case "submit":
		case "next":
			return true;
		case "skip":
			return shouldShowQuestionCardSkipAction(showCustomInput, primaryAction, hasDismissControl);
		default: {
			const _exhaustive: never = primaryAction;
			return _exhaustive;
		}
	}
}
