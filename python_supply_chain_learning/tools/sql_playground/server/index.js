import path from "node:path";
import { createHash } from "node:crypto";
import dotenv from "dotenv";
import express from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { buildDashboard } from "./dashboard.js";
import { createAuthReadiness, hasPublicSupabaseConfig } from "./auth-readiness.js";
import { CareerEvidenceError, validateCareerEvidence } from "./career-evidence.js";
import {
  getChapters,
  getQuestion,
  getQuestions,
  publicQuestion,
} from "./course-catalog.js";
import { evaluateResult } from "./evaluator.js";
import { sendLearningExport } from "./exporter.js";
import { classifyQuestionMastery, preservePassedProgressStatus } from "./mastery.js";
import { QueryPolicyError, validateReadOnlySql } from "./query-policy.js";
import { createSupabaseRest, SupabaseHttpError } from "./supabase-rest.js";
import { createPlaygroundNoteHandler, createPlaygroundQueryHandler } from "./playground.js";
import { buildDemoReport, projectDemo } from "./project-demo.js";
import { registerWorkflowRoutes } from "./workflow-api.js";
import { registerIntegratedRoutes } from "./integrated-api.js";
import { registerEditorTutorRoutes, editorAssistanceLevel } from "./editor-tutor.js";
import { editorRuntime } from "./editor-runtime.js";
import { registerDraftRoutes } from "./drafts.js";
import {
  buildAttemptDiagnosis,
  buildFallbackDiagnosticResponse,
  buildFallbackFollowUpResponse,
  buildFallbackTutorResponse,
  requestTutorResponse,
} from "./analyst-tutor.js";

const appRoot = path.resolve(process.cwd());
dotenv.config({ path: path.join(appRoot, ".env"), quiet: true });

const port = Number.parseInt(process.env.PORT ?? "3001", 10);
const host = process.env.RENDER ? "0.0.0.0" : "127.0.0.1";
const isServerless = Boolean(
  process.env.NETLIFY ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT,
);
const schema = process.env.DATABASE_SCHEMA?.trim() || "olist";
const supabaseUrl = process.env.SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();
const openaiApiKey = process.env.OPENAI_API_KEY?.trim();
const tutorProxySecret = process.env.TUTOR_PROXY_SECRET?.trim()
  || (openaiApiKey
    ? createHash("sha256").update(`supply-sql-proxy:${openaiApiKey}`).digest("hex")
    : "");
const tutorModel = process.env.OPENAI_TUTOR_MODEL?.trim() || "gpt-5.6-luna";
const tutorTimeoutMs = Math.min(
  Math.max(Number.parseInt(process.env.OPENAI_TUTOR_TIMEOUT_MS || "8000", 10) || 8_000, 3_000),
  15_000,
);
const tutorEndpoint = tutorProxySecret && supabaseUrl
  ? `${supabaseUrl.replace(/\/$/, "")}/functions/v1/sql-analyst-tutor`
  : "https://api.openai.com/v1/responses";
const tutorConfigured = Boolean(tutorProxySecret || openaiApiKey);
const configured = hasPublicSupabaseConfig(supabaseUrl, supabaseAnonKey);
const checkAuthReadiness = createAuthReadiness({ url: supabaseUrl, key: supabaseAnonKey });
const supabase = configured
  ? createSupabaseRest({ url: supabaseUrl, anonKey: supabaseAnonKey })
  : null;

const app = express();
app.disable("x-powered-by");
if (process.env.RENDER || isServerless) app.set("trust proxy", 1);
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
app.use("/pandas-worker.mjs", (_req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'none'; script-src https://cdn.jsdelivr.net 'unsafe-eval' 'wasm-unsafe-eval'; connect-src https://cdn.jsdelivr.net; worker-src 'none'");
  next();
});

const queryLimiter = rateLimit({
  windowMs: 60_000,
  limit: 30,
  keyGenerator: (request) => request.user?.id || "anonymous",
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "一分鐘內的查詢次數過多，請稍後再試。",
    code: "QUERY_RATE_LIMIT",
  },
});

const tutorLimiter = rateLimit({
  windowMs: 60_000,
  limit: 12,
  keyGenerator: (request) => request.user?.id || "anonymous",
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    error: "AI 家教提問速度太快，請稍等一下再繼續。",
    code: "TUTOR_RATE_LIMIT",
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

async function getTutorRows(token, userId, {
  questionId,
  limit = 200,
  from,
  to,
} = {}) {
  const query = [
    "select=*",
    `user_id=eq.${encodeURIComponent(userId)}`,
    questionId ? `question_id=eq.${encodeURIComponent(questionId)}` : null,
    from ? `created_at=gte.${encodeURIComponent(from)}` : null,
    to ? `created_at=lt.${encodeURIComponent(to)}` : null,
    "order=created_at.asc,id.asc",
  ].filter(Boolean).join("&");
  const capped = Math.min(Math.max(limit, 1), 10_000), collected = [];
  for (let offset = 0; offset < capped; offset += 1000) {
    const page = (await supabase.select("sql_playground_tutor_messages", query, token,
      { Range: `${offset}-${Math.min(offset + 999, capped - 1)}` })) || [];
    collected.push(...page);
    if (page.length < Math.min(1000, capped - offset)) break;
  }
  return collected;
}

async function getLatestPassedLog(token, userId, questionId) {
  const query = [
    "select=id,sql_text,result_preview,validation,score,created_at",
    `user_id=eq.${encodeURIComponent(userId)}`,
    `question_id=eq.${encodeURIComponent(questionId)}`,
    "status=eq.succeeded",
    "score=eq.100",
    "order=created_at.desc",
    "limit=1",
  ].join("&");
  const rows = (await supabase.select("sql_playground_query_logs", query, token)) || [];
  return rows[0] || null;
}

async function getAttemptLog(token, userId, questionId, logId) {
  if (!logId) return null;
  const query = [
    "select=id,sql_text,status,result_preview,validation,score,error_code,error_message,created_at",
    `id=eq.${encodeURIComponent(logId)}`,
    `user_id=eq.${encodeURIComponent(userId)}`,
    `question_id=eq.${encodeURIComponent(questionId)}`,
    "limit=1",
  ].join("&");
  const rows = (await supabase.select("sql_playground_query_logs", query, token)) || [];
  return rows[0] || null;
}

async function insertTutorMessage(request, question, values) {
  const rows = await supabase.insert(
    "sql_playground_tutor_messages",
    {
      user_id: request.user.id,
      question_id: question.id,
      chapter_id: question.chapterId,
      role: values.role,
      mode: values.mode,
      content: String(values.content || "").slice(0, 12_000),
      model: values.model || null,
      input_tokens: values.inputTokens || 0,
      output_tokens: values.outputTokens || 0,
      metadata: values.metadata || {},
    },
    request.accessToken,
  );
  return rows?.[0] || null;
}

function publicTutorMessage(row) {
  return {
    id: row.id,
    role: row.role,
    mode: row.mode,
    content: row.content,
    model: row.model,
    metadata: row.metadata || {},
    createdAt: row.created_at,
  };
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
        mastery: classifyQuestionMastery(progress),
        solutionAvailable: item.chapterId === "ch01" && Boolean(item.solution) && Boolean(progress?.attempts),
        solutionRevealed: (progress?.highest_hint_level || 0) >= 5,
        reflection: progress?.reflection || null,
        reflectionSource: progress?.reflection_source || null,
        careerEvidence: progress?.last_validation?.career_evidence || null,
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
      timeline: chapter.timeline,
      mission: chapter.mission,
      deliverable: chapter.deliverable,
      toolFlow: chapter.toolFlow,
      readinessDimension: chapter.readinessDimension,
      learningMinutes: chapter.learningMinutes,
      outcomes: chapter.outcomes,
      tools: chapter.tools,
      jobCapability: chapter.jobCapability,
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
  const lastValidation = {
    ...(previous?.last_validation || {}),
    ...(values.validation || {}),
  };
  const bestScore = Math.max(previous?.best_score || 0, values.bestScore || 0);
  const status = preservePassedProgressStatus(previous?.status, bestScore, values.status);
  const rows = await supabase.upsert(
    "sql_playground_lesson_progress",
    {
      user_id: request.user.id,
      question_id: question.id,
      chapter_id: question.chapterId,
      unit_id: question.unit,
      status,
      attempts: values.attempts,
      best_score: bestScore,
      highest_hint_level: Math.max(
        previous?.highest_hint_level || 0,
        values.hintLevel || 0,
      ),
      last_sql: values.sql,
      last_validation: lastValidation,
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

app.get("/api/config", async (_request, response) => {
  response.set("Cache-Control", "no-store");
  const auth = await checkAuthReadiness();
  if (!auth.ready) {
    return serviceUnavailable(response, auth.code, auth.error);
  }
  response.json({ authEnabled: true, supabaseUrl, supabaseAnonKey, tutorConfigured });
});

app.get("/api/health", async (_request, response) => {
  response.set("Cache-Control", "no-store");
  const auth = await checkAuthReadiness();
  response.status(auth.ready ? 200 : 503).json({
    configured,
    connected: auth.ready,
    authConfigured: configured,
    authReady: auth.ready,
    authCode: auth.code,
    loggingConfigured: configured,
    tutorConfigured,
    // Auth connectivity does not prove a user's database grants or AI access.
    databaseVerified: false,
    loggingVerified: false,
    tutorVerified: false,
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

registerWorkflowRoutes(app, { supabase, requireUser, queryLimiter, schema });
registerDraftRoutes(app, { supabase, requireUser });
registerIntegratedRoutes(app, { supabase, requireUser, queryLimiter });
registerEditorTutorRoutes(app, { supabase, requireUser, tutorLimiter, provider: editorRuntime().provider });
app.get("/api/project-demo", requireUser, (_request, response) => response.json(projectDemo));
app.post("/api/playground/query", requireUser, queryLimiter, createPlaygroundQueryHandler({ supabase, schema }));
app.patch("/api/playground/logs/:id/note", requireUser, createPlaygroundNoteHandler({ supabase }));
app.get("/api/project-demo/report", requireUser, async (request, response) => {
  try {
    const logs = await getLogRows(request.accessToken, request.user.id, { limit: 10_000 });
    response.setHeader("Content-Type", "text/markdown; charset=utf-8");
    response.setHeader("Content-Disposition", `attachment; filename="olist-delivery-demo_${new Date().toISOString().slice(0, 10)}.md"`);
    response.send(buildDemoReport(logs));
  } catch { response.status(503).json({ error: "無法讀取 Demo 紀錄，請稍後重試。" }); }
});

app.get("/api/tutor/history", requireUser, async (request, response) => {
  const question = getQuestion(request.query.questionId);
  if (!question) {
    return response.status(404).json({ error: "找不到這個題目。", code: "QUESTION_NOT_FOUND" });
  }
  try {
    const rows = await getTutorRows(request.accessToken, request.user.id, {
      questionId: question.id,
      limit: 100,
    });
    return response.json({
      configured: tutorConfigured,
      messages: rows.map(publicTutorMessage),
    });
  } catch (error) {
    return response.status(500).json({ error: error.message, code: "TUTOR_HISTORY_FAILED" });
  }
});

app.post("/api/tutor", requireUser, tutorLimiter, async (request, response) => {
  const question = getQuestion(request.body?.questionId);
  const requestedMode = String(request.body?.mode || "draft");
  const mode = new Set(["draft", "follow_up", "diagnose", "diagnose_follow_up"])
    .has(requestedMode)
    ? requestedMode
    : "draft";
  const diagnosticMode = mode.startsWith("diagnose");
  const followUpMode = mode.endsWith("follow_up");
  const message = String(request.body?.message || "").trim().slice(0, 1_000);
  const logId = String(request.body?.logId || "").trim().slice(0, 100);
  if (!question) {
    return response.status(404).json({ error: "找不到這個題目。", code: "QUESTION_NOT_FOUND" });
  }
  if (followUpMode && message.length < 2) {
    return response.status(400).json({ error: "請輸入想追問的內容。", code: "TUTOR_MESSAGE_REQUIRED" });
  }
  if (diagnosticMode && !logId) {
    return response.status(400).json({ error: "找不到這次執行紀錄。", code: "ATTEMPT_LOG_REQUIRED" });
  }

  try {
    const [progress, history, queryLog] = await Promise.all([
      getProgressRow(request.accessToken, request.user.id, question.id),
      getTutorRows(request.accessToken, request.user.id, {
        questionId: question.id,
        limit: 100,
      }),
      diagnosticMode
        ? getAttemptLog(request.accessToken, request.user.id, question.id, logId)
        : getLatestPassedLog(request.accessToken, request.user.id, question.id),
    ]);
    if (diagnosticMode && !queryLog) {
      return response.status(404).json({
        error: "找不到這次執行紀錄，請重新按一次 Run。",
        code: "ATTEMPT_LOG_NOT_FOUND",
      });
    }
    if (!diagnosticMode && (!progress || progress.best_score < 100)) {
      return response.status(409).json({
        error: "SQL 尚未通過時請使用錯誤診斷家教；通過後才會產生分析師觀點。",
        code: "QUERY_NOT_PASSED",
      });
    }

    const existingDraft = mode === "draft"
      ? history.find((item) => item.role === "assistant" && item.mode === "draft")
      : null;
    if (existingDraft?.metadata?.response) {
      return response.json({
        configured: tutorConfigured,
        reused: true,
        response: existingDraft.metadata.response,
        messages: history.map(publicTutorMessage),
      });
    }

    let workingHistory = history;
    const historyKind = diagnosticMode ? "diagnosis" : "analysis";
    if (followUpMode) {
      await insertTutorMessage(request, question, {
        role: "user",
        mode: "follow_up",
        content: message,
        metadata: { kind: historyKind, logId: diagnosticMode ? logId : null },
      });
      workingHistory = [...history, {
        role: "user",
        content: message,
        metadata: { kind: historyKind, logId: diagnosticMode ? logId : null },
      }];
    }

    let tutorResult;
    let provider = "openai";
    try {
      tutorResult = await requestTutorResponse({
        apiKey: openaiApiKey,
        model: tutorModel,
        question,
        progress,
        queryLog,
        history: workingHistory,
        mode,
        message,
        timeoutMs: tutorTimeoutMs,
        endpoint: tutorEndpoint,
        proxySecret: tutorProxySecret,
        safetyIdentifier: createHash("sha256")
          .update(`supply-sql:${request.user.id}`)
          .digest("hex")
          .slice(0, 32),
      });
    } catch (error) {
      provider = "local-fallback";
      tutorResult = {
        response: diagnosticMode
          ? buildFallbackDiagnosticResponse(question, queryLog)
          : followUpMode
            ? buildFallbackFollowUpResponse(question, message)
            : buildFallbackTutorResponse(question),
        providerResponseId: null,
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0, cachedTokens: 0 },
      };
    }

    const diagnostic = diagnosticMode ? buildAttemptDiagnosis(question, queryLog) : null;

    const assistantMessage = await insertTutorMessage(request, question, {
      role: "assistant",
      mode: mode === "draft" ? "draft" : "follow_up",
      content: tutorResult.response.answer,
      model: provider === "openai" ? tutorModel : provider,
      inputTokens: tutorResult.usage.inputTokens,
      outputTokens: tutorResult.usage.outputTokens,
      metadata: {
        kind: historyKind,
        logId: diagnosticMode ? logId : null,
        diagnostic,
        provider,
        providerResponseId: tutorResult.providerResponseId,
        response: tutorResult.response,
        usage: tutorResult.usage,
      },
    });
    const updatedHistory = await getTutorRows(request.accessToken, request.user.id, {
      questionId: question.id,
      limit: 100,
    });
    return response.json({
      configured: tutorConfigured,
      response: tutorResult.response,
      diagnostic,
      assistantMessage: publicTutorMessage(assistantMessage),
      messages: updatedHistory.map(publicTutorMessage),
    });
  } catch (error) {
    return response.status(503).json({
      error: "AI 家教暫時無法回答，SQL 結果與進度不受影響，請稍後再試。",
      detail: process.env.NODE_ENV === "development" ? error.message : undefined,
      code: "TUTOR_UNAVAILABLE",
    });
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
  if (eventType === "hint_revealed") {
    const hintLevel = Math.min(
      Math.max(numeric(request.body?.payload?.hintLevel), 0),
      question.hints.length,
    );
    const progress = await getProgressRow(request.accessToken, request.user.id, question.id);
    if (progress && hintLevel > progress.highest_hint_level) {
      await supabase.update(
        "sql_playground_lesson_progress",
        `user_id=eq.${encodeURIComponent(request.user.id)}&question_id=eq.${encodeURIComponent(question.id)}`,
        { highest_hint_level: hintLevel, updated_at: new Date().toISOString() },
        request.accessToken,
      );
    }
  }
  await recordEvent(request, eventType, question, request.body?.payload || {});
  response.status(204).end();
});

app.post("/api/solution", requireUser, async (request, response) => {
  const question = getQuestion(request.body?.questionId);
  if (!question || question.chapterId !== "ch01" || !question.solution) {
    return response.status(404).json({
      error: "目前只開放 Chapter 1 的完整教學解答。",
      code: "SOLUTION_NOT_AVAILABLE",
    });
  }

  const progress = await getProgressRow(request.accessToken, request.user.id, question.id);
  if (!progress?.attempts) {
    return response.status(409).json({
      error: "請先在編輯器完成一次真實嘗試並按 Run，再查看完整解答。",
      code: "ATTEMPT_REQUIRED",
    });
  }
  if (progress.highest_hint_level < question.hints.length) {
    return response.status(409).json({
      error: "請先依序查看前四階提示；如果仍然卡住，再開啟完整解答。",
      code: "HINT_LADDER_REQUIRED",
    });
  }

  await supabase.update(
    "sql_playground_lesson_progress",
    `user_id=eq.${encodeURIComponent(request.user.id)}&question_id=eq.${encodeURIComponent(question.id)}`,
    {
      highest_hint_level: Math.max(progress.highest_hint_level || 0, 5),
      updated_at: new Date().toISOString(),
    },
    request.accessToken,
  );
  await recordEvent(request, "hint_revealed", question, {
    hintLevel: 5,
    kind: "full_solution",
    attemptNumber: progress.attempts,
    previousHintLevel: progress.highest_hint_level || 0,
  });

  const sql = question.referenceSql.trim().endsWith(";")
    ? question.referenceSql.trim()
    : `${question.referenceSql.trim()};`;
  return response.json({
    sql,
    ...question.solution,
    masteryImpact: "guided",
  });
});

app.post("/api/query", requireUser, queryLimiter, async (request, response) => {
  const question = getQuestion(request.body?.questionId);
  if (!question) {
    return response.status(404).json({ error: "找不到這個題目。", code: "QUESTION_NOT_FOUND" });
  }

  let progressRows;
  let editorHintLevel = 0;
  try {
    progressRows = await getProgressRows(request.accessToken, request.user.id);
    editorHintLevel = await editorAssistanceLevel(supabase, request.accessToken, request.user.id, question.id);
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
  const maxHintLevel = question.solution ? 5 : question.hints.length;
  const hintLevel = Math.min(
    Math.max(numeric(request.body?.hintLevel), editorHintLevel),
    maxHintLevel,
  );
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
        diagnostic: buildAttemptDiagnosis(question, {
          sql_text: rawSql,
          status: "failed",
          score: 0,
          validation,
          error_code: "READ_ONLY_POLICY",
          error_message: error.message,
        }),
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
      diagnostic: validation.passed
        ? null
        : buildAttemptDiagnosis(question, {
          sql_text: sql,
          status: "succeeded",
          score: validation.score,
          validation,
          result_preview: (studentResult.rows || []).slice(0, 20),
        }),
    });
  } catch (error) {
    const durationMs = Math.round((performance.now() - startedAt) * 10) / 10;
    const publicError = publicQueryError(error);
    const failedValidation = { passed: false, score: 0, checks: [] };
    await completeQueryLog(request, logId, {
      status: "failed",
      duration_ms: durationMs,
      score: 0,
      validation: failedValidation,
      error_code: publicError.code,
      error_message: publicError.error.slice(0, 1000),
    }).catch(() => {});
    await upsertProgress(request, question, previous, {
      status: "in_progress",
      attempts: attemptNumber,
      bestScore: 0,
      hintLevel,
      sql,
      validation: failedValidation,
    }).catch(() => {});
    await recordEvent(request, "query_run", question, {
      attemptNumber,
      status: "failed",
      code: publicError.code,
    });
    response.status(400).json({
      ...publicError,
      durationMs,
      logId,
      validation: failedValidation,
      diagnostic: buildAttemptDiagnosis(question, {
        sql_text: sql,
        status: "failed",
        score: 0,
        validation: failedValidation,
        error_code: publicError.code,
        error_message: publicError.error,
      }),
    });
  }
});

app.post("/api/evidence", requireUser, async (request, response) => {
  const question = getQuestion(request.body?.questionId);
  if (!question) {
    return response.status(404).json({ error: "找不到這個題目。", code: "QUESTION_NOT_FOUND" });
  }

  const progress = await getProgressRow(request.accessToken, request.user.id, question.id);
  if (!progress || progress.best_score < 100) {
    return response.status(409).json({
      error: "請先讓 SQL 通過自動檢查，再完成 Tool Lab。",
      code: "QUERY_NOT_PASSED",
    });
  }

  try {
    const evidence = {
      ...validateCareerEvidence(question, request.body),
      completed_at: new Date().toISOString(),
    };
    await supabase.update(
      "sql_playground_lesson_progress",
      `user_id=eq.${encodeURIComponent(request.user.id)}&question_id=eq.${encodeURIComponent(question.id)}`,
      {
        last_validation: {
          ...(progress.last_validation || {}),
          career_evidence: evidence,
        },
        updated_at: evidence.completed_at,
      },
      request.accessToken,
    );
    return response.json({ evidence });
  } catch (error) {
    if (error instanceof CareerEvidenceError) {
      return response.status(400).json({ error: error.message, code: error.code });
    }
    throw error;
  }
});

app.post("/api/reflection", requireUser, async (request, response) => {
  const question = getQuestion(request.body?.questionId);
  if (!question) {
    return response.status(404).json({ error: "找不到這個題目。", code: "QUESTION_NOT_FOUND" });
  }

  const progress = await getProgressRow(request.accessToken, request.user.id, question.id);
  if (!progress || progress.best_score < 100) {
    return response.status(409).json({
      error: "請先讓查詢通過自動檢查，再完成分析說明。",
      code: "QUERY_NOT_PASSED",
    });
  }

  if (question.careerLab?.requiredEvidence && !progress.last_validation?.career_evidence?.completed) {
    return response.status(409).json({
      error: "請先完成本題的 Tool Lab，儲存交付證據後再完成本題。",
      code: "EVIDENCE_REQUIRED",
    });
  }

  const submittedReflection = String(request.body?.reflection || "").trim();
  const reflection = submittedReflection || buildFallbackTutorResponse(question).suggestedReflection;
  const allowedSources = new Set(["ai_draft", "user_edited", "user", "local_fallback"]);
  const reflectionSource = allowedSources.has(request.body?.reflectionSource)
    ? request.body.reflectionSource
    : submittedReflection ? "user" : "local_fallback";

  const completedAt = new Date().toISOString();
  const completionHintLevel = progress.last_validation?.completion_hint_level
    ?? progress.highest_hint_level
    ?? 0;
  await supabase.update(
    "sql_playground_lesson_progress",
    `user_id=eq.${encodeURIComponent(request.user.id)}&question_id=eq.${encodeURIComponent(question.id)}`,
    {
      status: "completed",
      reflection: reflection.slice(0, 4000),
      reflection_source: reflectionSource,
      last_validation: {
        ...(progress.last_validation || {}),
        completion_hint_level: completionHintLevel,
      },
      completed_at: progress.completed_at || completedAt,
      updated_at: completedAt,
    },
    request.accessToken,
  );
  await recordEvent(request, "reflection_saved", question, {
    characters: reflection.length,
    source: reflectionSource,
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
    const [progress, logs, events, tutorMessages, drafts] = await Promise.all([
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
      getTutorRows(request.accessToken, request.user.id, {
        limit: 10_000,
        from,
        to,
      }),
      (async () => {
        const rows = [];
        for (let offset = 0; offset < 10000; offset += 1000) {
          const query = new URLSearchParams({ select: 'workspace_key,body,revision,updated_at', user_id: `eq.${request.user.id}`, order: 'workspace_key' });
          if (from) query.append('updated_at', `gte.${from}`);
          if (to) query.append('updated_at', `lt.${to}`);
          const page = await supabase.select('sql_playground_drafts', query.toString(), request.accessToken, { Range: `${offset}-${offset + 999}` });
          rows.push(...page.map((draft) => ({ ...draft, evidence: 'unexecuted_draft_not_completion' })));
          if (page.length < 1000) break;
        }
        return rows;
      })(),
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
      tutorMessages,
      drafts,
      dashboard,
    });
  } catch (error) {
    if (!response.headersSent) {
      response.status(500).json({ error: error.message, code: "EXPORT_FAILED" });
    }
  }
});

if (process.env.NODE_ENV === "production" && !isServerless) {
  const distPath = path.join(appRoot, "dist");
  app.use(express.static(distPath));
  app.get(/.*/, (_request, response) => {
    response.sendFile(path.join(distPath, "index.html"));
  });
}

export { app };

if (!isServerless) {
  const server = app.listen(port, host, () => {
    console.log(`Supply SQL Lab ready at http://${host}:${port}`);
  });

  function shutdown() {
    server.close();
  }

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}
