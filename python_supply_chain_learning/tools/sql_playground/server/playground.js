import { parse } from "pgsql-ast-parser";
import { createHash } from "node:crypto";
import { QueryPolicyError, validateReadOnlySql } from "./query-policy.js";
import { describeDemoResult, getDemoStep } from "./project-demo.js";

// Free-form SQL uses the same policy/RPC as lessons, with an extra function
// allowlist: a syntactic SELECT can otherwise call a side-effecting function.
const analyticalFunctions = new Set("count sum avg min max round abs ceil ceiling floor trunc power sqrt mod coalesce nullif greatest least lower upper length char_length trim btrim ltrim rtrim substring substr replace concat concat_ws split_part left right position date_trunc date_part extract to_char to_date to_timestamp age now current_date row_number rank dense_rank lag lead first_value last_value nth_value ntile percent_rank cume_dist stddev stddev_samp stddev_pop variance var_samp var_pop bool_and bool_or string_agg array_agg".split(" "));

function walk(node, visit) {
  if (!node || typeof node !== "object") return;
  if (!Array.isArray(node)) visit(node);
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) value.forEach((child) => walk(child, visit));
    else if (value && typeof value === "object") walk(value, visit);
  }
}

export function inspectPlaygroundSql(input, schema = "olist") {
  if (typeof input !== "string" || input.length > 50_000) throw new QueryPolicyError("SQL 最多 50,000 個字元。");
  const sql = validateReadOnlySql(input, { allowedSchemas: [schema, "information_schema"] });
  const ast = parse(sql);
  const tags = new Set();
  walk(ast, (node) => {
    if (node.type === "select") tags.add("SELECT");
    if (node.type === "with") tags.add("CTE");
    if (node.type === "case") tags.add("CASE");
    if (node.into || node.for) throw new QueryPolicyError("Playground 不允許建立表格或鎖定資料列。");
    for (const [key, label] of [["where", "WHERE"], ["groupBy", "GROUP BY"], ["having", "HAVING"], ["orderBy", "ORDER BY"], ["limit", "LIMIT"], ["distinct", "DISTINCT"]]) {
      if (node[key]) tags.add(label);
    }
    if (node.join) { tags.add("JOIN"); tags.add(node.join.type); }
    if (node.type === "call") {
      const name = node.function.name.toLowerCase();
      if (!analyticalFunctions.has(name) || (node.function.schema && node.function.schema !== "pg_catalog")) {
        throw new QueryPolicyError(`Playground 尚未開放 ${node.function.schema ? `${node.function.schema}.` : ""}${name}()；只允許已確認的分析函數，不執行自訂或系統管理函數。`);
      }
      tags.add(name.toUpperCase());
    }
  });
  return { sql, tags: [...tags] };
}

function errorInfo(error) {
  return { code: error instanceof QueryPolicyError ? "READ_ONLY_POLICY" : error.code || "DATABASE_ERROR", error: String(error.message || "查詢失敗。").slice(0, 1000) };
}

export function createPlaygroundQueryHandler({ supabase, schema = "olist", assessResult }) {
  return async (request, response) => {
    const rawSql = typeof request.body?.sql === "string" ? request.body.sql : "";
    const step = getDemoStep(request.body?.demoStepId);
    if (request.body?.demoStepId && !step) return response.status(400).json({ code: "DEMO_NOT_FOUND", error: "找不到這個 Demo 步驟。" });
    const metadata = {
      mode: step ? "project_demo" : "playground",
      demoStepId: step?.id || null,
      tags: [],
      note: String(request.body?.note || "").slice(0, 4000),
      purpose: step?.purpose || "自由探索；不評分、不影響課程進度。",
      originalSqlLength: rawSql.length,
      language: "sql",
      ...(request.workflowContext || {}),
    };
    let logId;
    try {
      const rows = await supabase.insert("sql_playground_query_logs", {
        user_id: request.user.id, sql_text: rawSql.slice(0, 50_000),
        question_id: null, chapter_id: null, unit_id: null,
        question_title: request.workflowContext?.title || (step ? `Demo · ${step.title}` : "Playground · 自由查詢"),
        lesson_id: step ? `demo:${step.id}` : "playground",
        lesson_title: step?.title || "自由查詢", status: "running",
        attempt_number: null, hint_level: 0, score: null, validation: metadata,
      }, request.accessToken);
      logId = rows?.[0]?.id;
      if (!logId) throw new Error("Missing log id");
    } catch {
      return response.status(503).json({ code: "LOG_WRITE_FAILED", error: "無法建立帳號紀錄，因此尚未執行 SQL；請稍後重試。" });
    }
    const save = (values) => supabase.update("sql_playground_query_logs",
      `id=eq.${encodeURIComponent(logId)}&user_id=eq.${encodeURIComponent(request.user.id)}`,
      { ...values, completed_at: new Date().toISOString() }, request.accessToken);
    const startedAt = performance.now();
    let result;
    try {
      const inspected = inspectPlaygroundSql(rawSql, schema);
      metadata.tags = inspected.tags;
      result = await supabase.rpc("sql_playground_execute", { query_text: inspected.sql }, request.accessToken);
      if (!result || !Array.isArray(result.rows)) throw new Error("資料庫沒有傳回有效結果。");
      metadata.truncated = Boolean(result.truncated);
      metadata.resultDigest = createHash("sha256").update(JSON.stringify(result.rows)).digest("hex");
      // Never describe a learner's modified query as if it were the reference.
      metadata.referenceUnchanged = Boolean(step && inspected.sql === step.sql.trim().replace(/;\s*$/, ""));
      metadata.observation = metadata.referenceUnchanged ? describeDemoResult(step.id, result) : null;
    } catch (error) {
      const info = errorInfo(error);
      let logSaved = true;
      try { await save({ status: "failed", error_code: info.code, error_message: info.error, duration_ms: Math.round(performance.now() - startedAt), validation: metadata }); }
      catch { logSaved = false; }
      return response.status(400).json({ ...info, logId, logSaved,
        hint: "不會給零分。先檢查表格／欄位拼字與完整表名；每次只執行一個 SELECT 或 WITH ... SELECT。", note: metadata.note });
    }
    const durationMs = Math.round(performance.now() - startedAt);
    if (assessResult) metadata.assessment = await assessResult({ request, result, supabase });
    let logSaved = true;
    try {
      await save({ status: "succeeded", row_count: result.row_count, duration_ms: durationMs, score: null,
        validation: metadata, result_preview: result.rows.slice(0, 20), error_code: null, error_message: null });
    } catch { logSaved = false; }
    return response.json({ ...result, durationMs, logId, logSaved, tags: metadata.tags, resultDigest: metadata.resultDigest,
      observation: metadata.observation, note: metadata.note, assessment: metadata.assessment || null,
      warning: logSaved ? null : "SQL 執行成功，但結果紀錄同步失敗；原始 SQL 紀錄仍在帳號中。請保留本次結果，稍後檢查 Query Log。" });
  };
}

export function createPlaygroundNoteHandler({ supabase }) {
  return async (request, response) => {
    const note = request.body?.note;
    if (typeof note !== "string" || note.length > 4000) return response.status(400).json({ error: "筆記最多 4,000 個字元。" });
    const filters = `id=eq.${encodeURIComponent(request.params.id)}&user_id=eq.${encodeURIComponent(request.user.id)}`;
    try {
      const logs = await supabase.select("sql_playground_query_logs", `select=*&${filters}&limit=1`, request.accessToken);
      const log = logs?.[0];
      if (!log || !["playground", "project_demo"].includes(log.validation?.mode)) return response.status(404).json({ error: "找不到可編輯的 Playground 紀錄。" });
      const updated = await supabase.update("sql_playground_query_logs", filters,
        { validation: { ...log.validation, note, noteUpdatedAt: new Date().toISOString() } }, request.accessToken);
      if (!updated?.length) return response.status(404).json({ error: "紀錄已不存在。" });
      return response.json({ saved: true, note });
    } catch { return response.status(503).json({ error: "筆記儲存失敗，請保留文字並稍後再試。" }); }
  };
}
