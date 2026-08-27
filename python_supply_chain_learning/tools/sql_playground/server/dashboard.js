import { getChapters, getQuestions } from "./course-catalog.js";

function dateKey(value) {
  return new Date(value).toISOString().slice(0, 10);
}

export function buildDashboard(progressRows = [], logs = []) {
  const chapters = getChapters();
  const questions = getQuestions();
  const progressByQuestion = new Map(progressRows.map((row) => [row.question_id, row]));
  const completed = new Set(
    progressRows.filter((row) => row.status === "completed").map((row) => row.question_id),
  );

  const chapterProgress = chapters.map((chapter) => {
    const total = chapter.questions.length;
    const complete = chapter.questions.filter((item) => completed.has(item.id)).length;
    return {
      id: chapter.id,
      order: chapter.order,
      title: chapter.title,
      subtitle: chapter.subtitle,
      readinessDimension: chapter.readinessDimension,
      completed: complete,
      total,
      percent: Math.round((complete / total) * 100),
      locked: chapter.order > 1 && !chapters
        .filter((candidate) => candidate.order < chapter.order)
        .every((candidate) => candidate.questions.every((item) => completed.has(item.id))),
    };
  });

  const skillMap = new Map();
  for (const item of questions) {
    for (const skill of item.skills) {
      const record = skillMap.get(skill) || { skill, completed: 0, total: 0 };
      record.total += 1;
      if (completed.has(item.id)) record.completed += 1;
      skillMap.set(skill, record);
    }
  }
  const skills = [...skillMap.values()]
    .map((item) => ({ ...item, percent: Math.round((item.completed / item.total) * 100) }))
    .sort((a, b) => b.percent - a.percent || b.total - a.total)
    .slice(0, 12);

  const errorCounts = new Map();
  for (const log of logs) {
    if (log.status !== "failed") continue;
    const code = log.error_code || "QUERY_ERROR";
    errorCounts.set(code, (errorCounts.get(code) || 0) + 1);
  }
  const errorPatterns = [...errorCounts.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const activityMap = new Map();
  for (const log of logs) {
    const key = dateKey(log.created_at);
    activityMap.set(key, (activityMap.get(key) || 0) + 1);
  }
  const activity = Array.from({ length: 14 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (13 - index));
    const key = date.toISOString().slice(0, 10);
    return { date: key, attempts: activityMap.get(key) || 0 };
  });

  let nextQuestion = questions[0];
  for (const item of questions) {
    if (!completed.has(item.id)) {
      nextQuestion = item;
      break;
    }
  }

  const completedCount = questions.filter((item) => completed.has(item.id)).length;
  const readinessScore = Math.round((completedCount / questions.length) * 100);
  const firstAttemptSuccesses = logs.filter(
    (log) => log.attempt_number === 1 && log.score === 100,
  ).length;
  const firstAttempts = logs.filter((log) => log.attempt_number === 1).length;

  return {
    readiness: {
      score: readinessScore,
      status:
        readinessScore === 100
          ? "Entry-Level Ready"
          : readinessScore >= 75
            ? "接近工作模擬標準"
            : readinessScore >= 35
              ? "能力建構中"
              : "基礎建立中",
      completedQuestions: completedCount,
      totalQuestions: questions.length,
      completedSimulations: chapterProgress.find((item) => item.id === "ch05")?.completed || 0,
    },
    chapterProgress,
    skills,
    errorPatterns,
    activity,
    nextQuestion: {
      id: nextQuestion.id,
      chapterId: nextQuestion.chapterId,
      title: nextQuestion.title,
      status: progressByQuestion.get(nextQuestion.id)?.status || "not_started",
    },
    metrics: {
      totalAttempts: logs.length,
      successfulAttempts: logs.filter((log) => log.status === "succeeded").length,
      firstAttemptAccuracy: firstAttempts
        ? Math.round((firstAttemptSuccesses / firstAttempts) * 100)
        : 0,
      activeDays: activity.filter((day) => day.attempts > 0).length,
    },
  };
}
