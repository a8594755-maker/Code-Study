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

export function preservePassedProgressStatus(previousStatus, bestScore, requestedStatus) {
  if (previousStatus === "completed") return "completed";
  if (previousStatus === "query_passed" || Number(bestScore || 0) >= 100) {
    return "query_passed";
  }
  return requestedStatus;
}
