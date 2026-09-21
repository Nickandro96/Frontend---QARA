export function shouldCompleteAudit(input: {
  answeredCount: number;
  totalQuestions: number;
  currentResponseValue?: string | null;
}): boolean {
  const { answeredCount, totalQuestions, currentResponseValue } = input;
  if (totalQuestions <= 0) return false;
  if (answeredCount >= totalQuestions) return true;

  const currentAnswerIsFinal = Boolean(
    currentResponseValue && currentResponseValue !== "in_progress",
  );
  return answeredCount === totalQuestions - 1 && currentAnswerIsFinal;
}
