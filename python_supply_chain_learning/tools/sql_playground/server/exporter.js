import { ZipArchive } from "archiver";

function csvCell(value) {
  if (value === null || value === undefined) return "";
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function toCsv(rows, columns) {
  return [
    columns.map((column) => csvCell(column.label)).join(","),
    ...rows.map((row) => columns.map((column) => csvCell(row[column.key])).join(",")),
  ].join("\n");
}

const attemptColumns = [
  { key: "created_at", label: "timestamp_utc" },
  { key: "chapter_id", label: "chapter" },
  { key: "unit_id", label: "unit" },
  { key: "question_id", label: "question_id" },
  { key: "question_title", label: "question" },
  { key: "attempt_number", label: "attempt" },
  { key: "status", label: "status" },
  { key: "score", label: "score" },
  { key: "hint_level", label: "hint_level" },
  { key: "sql_text", label: "sql" },
  { key: "row_count", label: "row_count" },
  { key: "duration_ms", label: "duration_ms" },
  { key: "error_code", label: "error_code" },
  { key: "error_message", label: "error_message" },
  { key: "validation", label: "validation" },
  { key: "completed_at", label: "completed_at_utc" },
];

const progressColumns = [
  { key: "chapter_id", label: "chapter" },
  { key: "unit_id", label: "unit" },
  { key: "question_id", label: "question_id" },
  { key: "status", label: "status" },
  { key: "attempts", label: "attempts" },
  { key: "best_score", label: "best_score" },
  { key: "highest_hint_level", label: "highest_hint_level" },
  { key: "reflection", label: "analyst_reflection" },
  { key: "updated_at", label: "updated_at_utc" },
  { key: "completed_at", label: "completed_at_utc" },
];

const eventColumns = [
  { key: "created_at", label: "timestamp_utc" },
  { key: "chapter_id", label: "chapter" },
  { key: "question_id", label: "question_id" },
  { key: "event_type", label: "event" },
  { key: "payload", label: "details" },
];

function safeFilename(value) {
  return String(value || "query")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "query";
}

export function sendLearningExport(response, { format, scope, logs, progress, events, dashboard }) {
  const date = new Date().toISOString().slice(0, 10);
  const baseName = `supply-sql-learning-log_${scope}_${date}`;
  const attemptsCsv = toCsv(logs, attemptColumns);
  const progressCsv = toCsv(progress, progressColumns);
  const eventsCsv = toCsv(events, eventColumns);

  if (format === "csv") {
    response.setHeader("Content-Type", "text/csv; charset=utf-8");
    response.setHeader("Content-Disposition", `attachment; filename="${baseName}.csv"`);
    return response.send(`\uFEFF${attemptsCsv}`);
  }

  if (format === "json") {
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.setHeader("Content-Disposition", `attachment; filename="${baseName}.json"`);
    return response.send(
      JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          scope,
          dashboard,
          progress,
          events,
          attempts: logs,
        },
        null,
        2,
      ),
    );
  }

  response.setHeader("Content-Type", "application/zip");
  response.setHeader("Content-Disposition", `attachment; filename="${baseName}.zip"`);

  const archive = new ZipArchive({ zlib: { level: 9 } });
  archive.on("error", (error) => response.destroy(error));
  archive.pipe(response);
  archive.append(`\uFEFF${attemptsCsv}`, { name: "attempts.csv" });
  archive.append(`\uFEFF${progressCsv}`, { name: "progress.csv" });
  archive.append(`\uFEFF${eventsCsv}`, { name: "learning_events.csv" });
  archive.append(
    JSON.stringify(
      { exportedAt: new Date().toISOString(), scope, dashboard, progress, events },
      null,
      2,
    ),
    { name: "learning_report.json" },
  );

  for (const log of logs) {
    const timestamp = String(log.created_at || "").replaceAll(":", "-");
    const filename = [
      safeFilename(log.chapter_id),
      safeFilename(log.question_id),
      `attempt-${log.attempt_number || 1}`,
      safeFilename(timestamp),
    ].join("_");
    const header = [
      `-- Question: ${log.question_title || log.question_id || "Unassigned"}`,
      `-- Attempt: ${log.attempt_number || 1}`,
      `-- Timestamp (UTC): ${log.created_at || ""}`,
      `-- Status: ${log.status}`,
      `-- Score: ${log.score ?? ""}`,
      log.error_message ? `-- Error: ${String(log.error_message).replaceAll("\n", " ")}` : null,
    ].filter(Boolean).join("\n");
    archive.append(`${header}\n\n${log.sql_text || ""}\n`, {
      name: `queries/${filename}.sql`,
    });
  }

  archive.finalize();
}
