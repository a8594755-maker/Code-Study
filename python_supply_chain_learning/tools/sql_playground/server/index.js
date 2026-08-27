import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { buildDashboard } from "./dashboard.js";
import {
  getChapters,
  getQuestion,
  getQuestions,
  publicQuestion,
} from "./course-catalog.js";
import { evaluateResult } from "./evaluator.js";
import { sendLearningExport } from "./exporter.js";
import { QueryPolicyError, validateReadOnlySql } from "./query-policy.js";
import { createSupabaseRest, SupabaseHttpError } from "./supabase-rest.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
dotenv.config({ path: path.join(appRoot, ".env"), quiet: true });

const port = Number.parseInt(process.env.PORT ?? "3001", 10);
const host = process.env.RENDER ? "0.0.0.0" : "127.0.0.1";
const schema = process.env.DATABASE_SCHEMA?.trim() || "olist";
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();
const configured = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseAnonKey !== "replace_with_supabase_anon_key",
);
const supabase = configured
  ? createSupabaseRest({ url: supabaseUrl, anonKey: supabaseAnonKey })
  : null;

const app = express();
app.disable("x-powered-by");
if (process.env.RENDER) app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        connectSrc: ["'self'", ...(supabaseUrl ? [supabaseUrl] : [])],
      },
    },
  }),
);
app.use(express.json({ limit: "96kb" }));

const queryLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "一分鐘內的查詢次數過多，請稍後再試。",
    code: "QUERY_RATE_LIMIT",
  },
});

function serviceUnavailable(response, code, error) {
  return response.status(503).json({ code, error });
}

function numeric(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeProgress(rows = []) {
  return rows.map((row) => ({
    ...row,
    attempts: numeric(row.attempts),
    best_score: numeric(row.best_score),
    highest_hint_level: numeric(row.highest_hint_level),
  }));
}

function normalizeLogs(rows = []) {
  return rows.map((row) => ({
    ...row,
    attempt_number: numeric(row.attempt_number, 1),
    hint_level: numeric(row.hint_level),
    score: row.score === null ? null : numeric(row.score),
    row_count: row.row_count === null ? null : numeric(row.row_count),
    duration_ms: row.duration_ms === null ? null : numeric(row.duration_ms),
  }));
}

async function requireUser(request, response, next) {
  if (!supabase) {
    return serviceUnavailable(
      response,
      "SUPABASE_NOT_CONFIGURED",
      "網站管理者尚未完成 Supabase 設定。",
    );
  }

  const authorization = request.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
  if (!token) {
    return response.status(401).json({
      error: "請先登入後再使用 SQL 練習場。",
      code: "AUTH_REQUIRED",
    });
  }

  try {
    const user = await supabase.getUser(token);
    if (!user?.id) throw new Error("User missing.");
    request.user = user;
    request.accessToken = token;
    next();
  } catch {
    return response.status(401).json({
      error: "登入狀態已失效，請重新登入。",
      code: "INVALID_ACCESS_TOKEN",
    });
  }
}

async function getProgressRows(token, userId) {
  const query = [
    "select=*",
    `user_id=eq.${encodeURIComponent(userId)}`,
    "order=updated_at.desc",
    "limit=200",
  ].join("&");
  return normalizeProgress(
    (await supabase.select("sql_playground_lesson_progress", query, token)) || [],
  );
}

async function getProgressRow(token, userId, questionId) {
  const query = [
    "select=*",
    `user_id=eq.${encodeURIComponent(userId)}`,
    `question_id=eq.${encodeURIComponent(questionId)}`,
    "limit=1",
  ].join("&");
  const rows = normalizeProgress(
    (await supabase.select("sql_playground_lesson_progress", query, token)) || [],
  );
  return rows[0] || null;
}

async function getLogRows(token, userId, { limit = 50, from, to } = {}) {
  const cappedLimit = Math.min(Math.max(limit, 1), 10_000);
  const base = [
    "select=*",
    `user_id=eq.${encodeURIComponent(userId)}`,
    from ? `created_at=gte.${encodeURIComponent(from)}` : null,
    to ? `created_at=lt.${encodeURIComponent(to)}` : null,
    "order=created_at.desc",
  ].filter(Boolean);

  const rows = [];
  const pageSize = Math.min(cappedLimit, 1000);
  for (let offset = 0; offset < cappedLimit; offset += pageSize) {
    const page =
      (await supabase.select(
        "sql_playground_query_logs",
        base.join("&"),
        token,
        { Range: `${offset}-${Math.min(offset + pageSize - 1, cappedLimit - 1)}` },
      )) || [];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return normalizeLogs(rows.slice(0, cappedLimit));
}

async function getEventRows(token, userId, { limit = 10_000, from, to } = {}) {
  const cappedLimit = Math.min(Math.max(limit, 1), 10_000);
  const base = [
    "select=id,question_id,chapter_id,event_type,payload,created_at",
    `user_id=eq.${encodeURIComponent(userId)}`,
    from ? `created_at=gte.${encodeURIComponent(from)}` : null,
    to ? `created_at=lt.${encodeURIComponent(to)}` : null,
    "order=created_at.desc",
  ].filter(Boolean);
  const rows = [];
  const pageSize = Math.min(cappedLimit, 1000);
  for (let offset = 0; offset < cappedLimit; offset += pageSize) {
    const page =
      (await supabase.select(
        "sql_playground_learning_events",
        base.join("&"),
        token,
        { Range: `${offset}-${Math.min(offset + pageSize - 1, cappedLimit - 1)}` },
      )) || [];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows.slice(0, cappedLimit);
}

function buildCourse(progressRows) {
  const allQuestions = getQuestions();
  const progressByQuestion = new Map(progressRows.map((row) => [row.question_id, row]));
  const completed = new Set(
    progressRows.filter((row) => row.status === "completed").map((row) => row.question_id),
  );
  const unlocked = new Set();
  for (let index = 0; index < allQuestions.length; index += 1) {
    if (index === 0 || completed.has(allQuestions[index - 1].id)) {
      unlocked.add(allQuestions[index].id);
    }
  }

  return getChapters().map((chapter) => {
    const questions = chapter.questions.map((item) => {
      const progress = progressByQuestion.get(item.id);
      return {
        ...publicQuestion(item),
        locked: !unlocked.has(item.id) && progress?.status !== "completed",
        status: progress?.status || "not_started",
        attempts: progress?.attempts || 0,
        bestScore: progress?.best_score || 0,
        highestHintLevel: progress?.highest_hint_level || 0,
        reflection: progress?.reflection || null,
      };
    });
    const completedCount = questions.filter((item) => item.status === "completed").length;
    return {
      id: chapter.id,
      order: chapter.order,
      eyebrow: chapter.eyebrow,
      title: chapter.title,
      subtitle: chapter.subtitle,
      description: chapter.description,
      readinessDimension: chapter.readinessDimension,
      locked: questions.every((item) => item.locked),
      completed: completedCount,
      total: questions.length,
      percent: Math.round((completedCount / questions.length) * 100),
      questions,
    };
  });
}

function isQuestionUnlocked(questionId, progressRows) {
  const item = buildCourse(progressRows)
    .flatMap((chapter) => chapter.questions)
    .find((question) => question.id === questionId);
  return item && !item.locked;
}

async function recordEvent(request, eventType, question, payload = {}) {
  try {
    await supabase.insert(
      "sql_playground_learning_events",
      {
        user_id: request.user.id,
        question_id: question?.id || null,
        chapter_id: question?.chapterId || null,
        event_type: eventType,
        payload,
      },
      request.accessToken,
    );
  } catch (error) {
    console.error("Learning event write failed:", error.message);
  }
}

async function createQueryLog(request, question, attemptNumber, sqlText, hintLevel) {
  const rows = await supabase.insert(
    "sql_playground_query_logs",
    {
      user_id: request.user.id,
      sql_text: String(sqlText || "").slice(0, 50_000),
      chapter_id: question.chapterId,
      unit_id: question.unit,
      question_id: question.id,
      question_title: question.title,
      question_version: 1,
      attempt_number: attemptNumber,
      hint_level: hintLevel,
      lesson_id: question.id,
      lesson_title: question.title,
      status: "running",
    },
    request.accessToken,
  );
  return rows?.[0]?.id;
}

async function completeQueryLog(request, logId, values) {
  if (!logId) return;
  await supabase.update(
    "sql_playground_query_logs",
    `id=eq.${encodeURIComponent(logId)}&user_id=eq.${encodeURIComponent(request.user.id)}`,
    { ...values, completed_at: new Date().toISOString() },
    request.accessToken,
  );
}

async function upsertProgress(request, question, previous, values) {
  const rows = await supabase.upsert(
    "sql_playground_lesson_progress",
    {
      user_id: request.user.id,
      question_id: question.id,
      chapter_id: question.chapterId,
      unit_id: question.unit,
      status: previous?.status === "completed" ? "completed" : values.status,
      attempts: values.attempts,
      best_score: Math.max(previous?.best_score || 0, values.bestScore || 0),
      highest_hint_level: Math.max(
        previous?.highest_hint_level || 0,
        values.hintLevel || 0,
      ),
      last_sql: values.sql,
      last_validation: values.validation || {},
      ...(values.queryPassedAt ? { query_passed_at: values.queryPassedAt } : {}),
      updated_at: new Date().toISOString(),
    },
    request.accessToken,
    "user_id,question_id",
  );
  return normalizeProgress(rows || [])[0] || null;
}

function publicQueryError(error) {
  if (error instanceof SupabaseHttpError) {
    return {
      error: error.payload?.message || error.message || "資料庫查詢失敗。",
      code: error.payload?.code || "DATABASE_ERROR",
      hint: error.payload?.hint || null,
      position: error.payload?.position || null,
    };
  }
  return {
    error: error.message || "資料庫查詢失敗。",
    code: error.code || "DATABASE_ERROR",
    hint: null,
    position: null,
  };
}

app.get("/api/config", (_request, response) => {
  if (!configured) {
    return serviceUnavailable(
      response,
      "SUPABASE_NOT_CONFIGURED",
      "網站管理者尚未完成 Supabase 設定。",
    );
  }
  response.json({ authEnabled: true, supabaseUrl, supabaseAnonKey });
});

app.get("/api/health", (_request, response) => {
  response.json({
    configured,
    connected: configured,
    authConfigured: configured,
    loggingConfigured: configured,
    executionMode: "supabase-authenticated-rest",
    schema,
  });
});

app.get("/api/course", requireUser, async (request, response) => {
  try {
    const progress = await getProgressRows(request.accessToken, request.user.id);
    response.json({ chapters: buildCourse(progress) });
  } catch (error) {
    response.status(500).json({ error: error.message, code: "COURSE_LOAD_FAILED" });
  }
});

app.get("/api/schema", requireUser, async (request, response) => {
  try {
    const rows = (await supabase.rpc("sql_playground_schema", {}, request.accessToken)) || [];
    const tables = [];
    for (const row of rows) {
      let table = tables.at(-1);
      if (!table || table.name !== row.table_name) {
        table = { name: row.table_name, columns: [] };
        tables.push(table);
      }
      table.columns.push({ name: row.column_name, type: row.data_type });
    }
    response.json({ schema, tables });
  } catch (error) {
    response.status(500).json({ ...publicQueryError(error), code: "SCHEMA_LOAD_FAILED" });
  }
});

app.get("/api/logs", requireUser, async (request, response) => {
  try {
    const requestedLimit = Number.parseInt(request.query.limit ?? "50", 10);
    const logs = await getLogRows(request.accessToken, request.user.id, {
      limit: Math.min(Math.max(requestedLimit || 50, 1), 200),
    });
    response.json({ logs });
  } catch (error) {
    response.status(500).json({ error: error.message, code: "LOG_READ_FAILED" });
  }
});

app.get("/api/dashboard", requireUser, async (request, response) => {
  try {
    const [progress, logs] = await Promise.all([
      getProgressRows(request.accessToken, request.user.id),
      getLogRows(request.accessToken, request.user.id, { limit: 1000 }),
    ]);
    response.json(buildDashboard(progress, logs));
  } catch (error) {
    response.status(500).json({ error: error.message, code: "DASHBOARD_LOAD_FAILED" });
  }
});

app.post("/api/events", requireUser, async (request, response) => {
  const allowed = new Set(["lesson_opened", "hint_revealed"]);
  const eventType = request.body?.eventType;
  const question = getQuestion(request.body?.questionId);
  if (!allowed.has(eventType) || !question) {
    return response.status(400).json({ error: "無效的學習事件。", code: "INVALID_EVENT" });
  }
  await recordEvent(request, eventType, question, request.body?.payload || {});
  response.status(204).end();
});

app.post("/api/query", queryLimiter, requireUser, async (request, response) => {
  const question = getQuestion(request.body?.questionId);
  if (!question) {
    return response.status(404).json({ error: "找不到這個題目。", code: "QUESTION_NOT_FOUND" });
  }

  let progressRows;
  try {
    progressRows = await getProgressRows(request.accessToken, request.user.id);
  } catch (error) {
    return response.status(500).json({ error: error.message, code: "PROGRESS_READ_FAILED" });
  }
  if (!isQuestionUnlocked(question.id, progressRows)) {
    return response.status(403).json({
      error: "請先完成前一題的查詢與分析說明。",
      code: "QUESTION_LOCKED",
    });
  }

  const previous = progressRows.find((row) => row.question_id === question.id) || null;
  const attemptNumber = (previous?.attempts || 0) + 1;
  const hintLevel = Math.min(Math.max(numeric(request.body?.hintLevel), 0), 3);
  const rawSql = typeof request.body?.sql === "string" ? request.body.sql : "";
  let logId;

  try {
    logId = await createQueryLog(request, question, attemptNumber, rawSql, hintLevel);
  } catch {
    return serviceUnavailable(
      response,
      "LOG_WRITE_FAILED",
      "無法先建立帳號執行紀錄，因此查詢不會執行。",
    );
  }

  let sql;
  try {
    sql = validateReadOnlySql(rawSql, {
      allowedSchemas: [schema, "information_schema"],
    });
  } catch (error) {
    if (error instanceof QueryPolicyError) {
      const validation = {
        passed: false,
        score: 0,
        checks: [{ id: "read_only", label: "唯讀安全", passed: false, detail: error.message }],
      };
      await completeQueryLog(request, logId, {
        status: "failed",
        score: 0,
        validation,
        error_code: "READ_ONLY_POLICY",
        error_message: error.message.slice(0, 1000),
      });
      await upsertProgress(request, question, previous, {
        status: "in_progress",
        attempts: attemptNumber,
        bestScore: 0,
        hintLevel,
        sql: rawSql,
        validation,
      });
      await recordEvent(request, "query_run", question, {
        attemptNumber,
        status: "failed",
        code: "READ_ONLY_POLICY",
      });
      return response.status(400).json({
        error: error.message,
        code: "READ_ONLY_POLICY",
        validation,
        logId,
      });
    }
    throw error;
  }

  const startedAt = performance.now();
  try {
    const [studentResult, referenceResult] = await Promise.all([
      supabase.rpc("sql_playground_execute", { query_text: sql }, request.accessToken),
      supabase.rpc(
        "sql_playground_execute",
        { query_text: question.referenceSql },
        request.accessToken,
      ),
    ]);
    const durationMs = Math.round((performance.now() - startedAt) * 10) / 10;
    const validation = evaluateResult(question, studentResult, referenceResult, sql);
    const nextStatus = validation.passed ? "query_passed" : "in_progress";
    const queryPassedAt = validation.passed ? new Date().toISOString() : null;

    await completeQueryLog(request, logId, {
      status: "succeeded",
      row_count: studentResult.row_count,
      duration_ms: durationMs,
      score: validation.score,
      validation,
      result_preview: (studentResult.rows || []).slice(0, 20),
      error_code: null,
      error_message: null,
    });
    await upsertProgress(request, question, previous, {
      status: nextStatus,
      attempts: attemptNumber,
      bestScore: validation.score,
      hintLevel,
      sql,
      validation,
      queryPassedAt,
    });
    await recordEvent(request, "query_run", question, {
      attemptNumber,
      status: "succeeded",
      score: validation.score,
    });
    if (validation.passed) {
      await recordEvent(request, "query_passed", question, {
        attemptNumber,
        hintLevel,
      });
    }

    response.json({
      ...studentResult,
      durationMs,
      validation,
      passed: validation.passed,
      requiresReflection: validation.passed && previous?.status !== "completed",
      logId,
    });
  } catch (error) {
    const durationMs = Math.round((performance.now() - startedAt) * 10) / 10;
    const publicError = publicQueryError(error);
    await completeQueryLog(request, logId, {
      status: "failed",
      duration_ms: durationMs,
      score: 0,
      validation: { passed: false, score: 0, checks: [] },
      error_code: publicError.code,
      error_message: publicError.error.slice(0, 1000),
    }).catch(() => {});
    await upsertProgress(request, question, previous, {
      status: "in_progress",
      attempts: attemptNumber,
      bestScore: 0,
      hintLevel,
      sql,
      validation: { passed: false, score: 0, checks: [] },
    }).catch(() => {});
    await recordEvent(request, "query_run", question, {
      attemptNumber,
      status: "failed",
      code: publicError.code,
    });
    response.status(400).json({ ...publicError, durationMs, logId });
  }
});

app.post("/api/reflection", requireUser, async (request, response) => {
  const question = getQuestion(request.body?.questionId);
  const reflection = String(request.body?.reflection || "").trim();
  if (!question) {
    return response.status(404).json({ error: "找不到這個題目。", code: "QUESTION_NOT_FOUND" });
  }
  if (reflection.length < 20) {
    return response.status(400).json({
      error: "請至少用 20 個字說明商業結果與一個驗證動作。",
      code: "REFLECTION_TOO_SHORT",
    });
  }

  const progress = await getProgressRow(request.accessToken, request.user.id, question.id);
  if (!progress || progress.best_score < 100) {
    return response.status(409).json({
      error: "請先讓查詢通過自動檢查，再完成分析說明。",
      code: "QUERY_NOT_PASSED",
    });
  }

  const completedAt = new Date().toISOString();
  await supabase.update(
    "sql_playground_lesson_progress",
    `user_id=eq.${encodeURIComponent(request.user.id)}&question_id=eq.${encodeURIComponent(question.id)}`,
    {
      status: "completed",
      reflection: reflection.slice(0, 4000),
      completed_at: progress.completed_at || completedAt,
      updated_at: completedAt,
    },
    request.accessToken,
  );
  await recordEvent(request, "reflection_saved", question, {
    characters: reflection.length,
  });
  await recordEvent(request, "lesson_completed", question, {
    attempts: progress.attempts,
    bestScore: progress.best_score,
  });

  const questions = getQuestions();
  const index = questions.findIndex((item) => item.id === question.id);
  response.json({
    completed: true,
    nextQuestionId: questions[index + 1]?.id || null,
  });
});

app.get("/api/export", requireUser, async (request, response) => {
  try {
    const scope = request.query.scope === "today" ? "today" : "all";
    const format = new Set(["zip", "csv", "json"]).has(request.query.format)
      ? request.query.format
      : "zip";
    const from = scope === "today" ? request.query.from : null;
    const to = scope === "today" ? request.query.to : null;
    const [progress, logs, events] = await Promise.all([
      getProgressRows(request.accessToken, request.user.id),
      getLogRows(request.accessToken, request.user.id, {
        limit: 10_000,
        from,
        to,
      }),
      getEventRows(request.accessToken, request.user.id, {
        limit: 10_000,
        from,
        to,
      }),
    ]);
    const dashboard = buildDashboard(progress, logs);
    await recordEvent(request, "export_downloaded", null, {
      scope,
      format,
      attempts: logs.length,
    });
    return sendLearningExport(response, {
      format,
      scope,
      logs,
      progress,
      events,
      dashboard,
    });
  } catch (error) {
    if (!response.headersSent) {
      response.status(500).json({ error: error.message, code: "EXPORT_FAILED" });
    }
  }
});

if (process.env.NODE_ENV === "production") {
  const distPath = path.join(appRoot, "dist");
  app.use(express.static(distPath));
  app.get(/.*/, (_request, response) => {
    response.sendFile(path.join(distPath, "index.html"));
  });
}

const server = app.listen(port, host, () => {
  console.log(`Supply SQL Lab ready at http://${host}:${port}`);
});

function shutdown() {
  server.close();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
