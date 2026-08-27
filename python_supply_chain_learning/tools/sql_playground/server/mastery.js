export function classifyQuestionMastery(progress) {
  if (!progress || !progress.attempts) return "not_started";
  if (progress.status !== "completed") return "practicing";
  const completionHintLevel = Number(
    progress.last_validation?.completion_hint_level
      ?? progress.highest_hint_level
      ?? 0,
  );
  return completionHintLevel <= 1 ? "independent" : "guided";
}
