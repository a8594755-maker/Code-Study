import { ZipArchive } from "archiver";
import { workflowCatalog, getWorkflowMission } from "./workflow-catalog.js";
import { buildWorkflowFiles } from "./workflow-notebooks.js";
import { createPlaygroundQueryHandler } from "./playground.js";
import { assessIntegratedSql, assessIntegratedPython } from "./integrated-assessment.js";

const table = "sql_playground_query_logs";
const modes = new Set(["reference", "practice", "independent"]);
const owned = (request, id) => `id=eq.${encodeURIComponent(id)}&user_id=eq.${encodeURIComponent(request.user.id)}`;
export function workflowSummary(logs = []) {
  const entries = logs.filter((log) => log.validation?.mode?.startsWith("workflow_") && !log.validation?.missionId?.startsWith("studio-"));
  const missions = Object.fromEntries(workflowCatalog.missions.map((mission) => {
    const attempts = entries.filter((log) => log.validation.missionId === mission.id);
    return [mission.id, {
      sqlRuns: attempts.filter((log) => log.validation.mode === "workflow_sql").length,
      pandasRuns: attempts.filter((log) => log.validation.mode === "workflow_pandas").length,
      submitted: attempts.some((log) => log.validation.mode === "workflow_delivery" && log.status === "succeeded"),
      extensionSubmitted: attempts.some((log) => log.validation.mode === "workflow_delivery" && log.validation.studyMode === "independent" && log.status === "succeeded"),
    }];
  }));
  return { missions, submitted: Object.values(missions).filter((item) => item.submitted).length,
    total: workflowCatalog.missions.length, sqlRuns: entries.filter((l) => l.validation.mode === "workflow_sql").length,
    pandasRuns: entries.filter((l) => l.validation.mode === "workflow_pandas").length,
    note: "交付代表帳號已有 SQL 與瀏覽器回報的 pandas 證據，仍待人工審查；不等於掌握、工作年資或已投入時數。" };
}

export function registerWorkflowRoutes(app, { supabase, requireUser, queryLimiter, schema }) {
  const query = createPlaygroundQueryHandler({ supabase, schema, assessResult: assessIntegratedSql });
  const wrap = (fn) => async (req, res) => { try { await fn(req, res); } catch (error) { res.status(error.status || 503).json({ error: error.status ? error.message : "帳號紀錄暫時無法存取，請保留目前程式與輸出再重試。" }); } };
  const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
  const missionFor = (req) => getWorkflowMission(req.params.id) || fail("找不到這個任務。", 404);
  const modeFor = (req) => modes.has(req.body?.studyMode) ? req.body.studyMode : fail("請選擇示範、陪跑或獨立練習。");
  const logFor = async (req, id) => {
    if (typeof id !== "string" || !/^[a-f\d-]{36}$/i.test(id)) fail("無效紀錄 ID。");
    const [log] = await supabase.select(table, `select=*&${owned(req, id)}&limit=1`, req.accessToken);
    return log || fail("找不到你的執行紀錄。", 404);
  };
  const insert = async (req, mission, code, validation, status = "running") => {
    const [log] = await supabase.insert(table, { user_id: req.user.id, sql_text: code,
      question_id: null, chapter_id: null, unit_id: null, question_title: `工作任務 · ${mission.title}`,
      lesson_id: `workflow:${mission.id}`, lesson_title: mission.title, status, score: null,
      hint_level: 0, attempt_number: null, validation: { ...validation, missionId: mission.id, chapter: mission.chapterId, tags: mission.tags },
      ...(status === "succeeded" ? { completed_at: new Date().toISOString() } : {}),
    }, req.accessToken);
    if (!log?.id) fail("無法建立執行紀錄，尚未執行程式。", 503);
    return log;
  };
  app.get("/api/workflow", requireUser, wrap(async (req, res) => {
    const logs = [];
    for (let offset = 0; offset < 10000; offset += 1000) {
      const page = await supabase.select(table, `select=status,validation&user_id=eq.${req.user.id}&validation->>mode=like.workflow_*&order=created_at.desc,id.desc`, req.accessToken, { Range: `${offset}-${offset + 999}` });
      logs.push(...page);
      if (page.length < 1000) break;
    }
    res.json({ ...workflowCatalog, summary: workflowSummary(logs), summaryWindow: "最近最多 10,000 筆任務紀錄" });
  }));
  app.get("/api/workflow/package", requireUser, wrap(async (req, res) => {
    const id = req.query.missionId;
    if (id && !getWorkflowMission(id)) fail("找不到任務包。", 404);
    if (id && getWorkflowMission(id).integrated) fail("整合課程請從活動下載目前 Notebook；此端點只提供原有情境參考檔。", 400);
    const archive = new ZipArchive({ zlib: { level: 9 } });
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="analyst-sql-pandas_${id || "legacy-reference"}.zip"`);
    archive.on("error", (error) => res.destroy(error));
    archive.pipe(res);
    for (const file of buildWorkflowFiles(id)) archive.append(file.content, { name: file.name });
    await archive.finalize();
  }));
  app.post("/api/workflow/:id/sql", requireUser, queryLimiter, wrap(async (req, res) => {
    const mission = missionFor(req);
    const dataset = mission.queries.find((item) => item.name === req.body.datasetName);
    if (!dataset) fail("請選擇這個任務的查詢資料集。");
    req.workflowContext = { mode: "workflow_sql", missionId: mission.id, datasetName: dataset.name,
      studyMode: modeFor(req), title: `工作任務 · ${mission.title} · ${dataset.label}`,
      referenceSql: req.body.sql?.trim() === dataset.sql.trim(),
      scope: req.body.sql?.trim() === dataset.sql.trim() ? dataset.scope : "自行修改的 SQL；範圍需重新驗證。" };
    req.body.demoStepId = null;
    await query(req, res);
  }));
  app.post("/api/workflow/:id/pandas/start", requireUser, queryLimiter, wrap(async (req, res) => {
    const mission = missionFor(req), studyMode = modeFor(req);
    const code = req.body.code;
    if (typeof code !== "string" || !code.trim() || code.length > 50000) fail("Python 請輸入 1–50,000 個字元。");
    const sources = req.body.sources;
    if (!Array.isArray(sources) || sources.length < 1 || sources.length > 5 || new Set(sources.map((s) => s.name)).size !== sources.length) fail("資料來源不完整或重複。");
    const verified = [];
    for (const source of sources) {
      if (![...mission.queries.map((q) => q.name), ...Object.keys(mission.auxiliary || {})].includes(source.name)) fail("資料集不屬於此任務。");
      if (source.origin === "fixture") { verified.push({ name: source.name, origin: "fixture" }); continue; }
      if (source.origin !== "supabase") fail("未知資料來源。");
      const log = await logFor(req, source.logId);
      if (log.status !== "succeeded" || log.validation?.mode !== "workflow_sql" || log.validation.missionId !== mission.id || log.validation.datasetName !== source.name || log.validation.resultDigest !== source.digest) fail("SQL 證據不符，請重新執行對應資料集。");
      verified.push({ name: source.name, origin: "supabase", logId: log.id, digest: source.digest, truncated: Boolean(log.validation.truncated), scope: log.validation.scope });
    }
    if (!mission.queries.every((q) => verified.some((s) => s.name === q.name))) fail("缺少必要的 SQL 資料集。");
    const log = await insert(req, mission, code, { mode: "workflow_pandas", language: "python", studyMode,
      sources: verified, executionEvidence: "browser_reported", note: "瀏覽器隔離執行、客戶端回報結果；不代表伺服器驗證正確性。" });
    res.json({ logId: log.id });
  }));
  app.patch("/api/workflow/pandas/:logId", requireUser, wrap(async (req, res) => {
    const log = await logFor(req, req.params.logId);
    if (log.validation?.mode !== "workflow_pandas") fail("此紀錄不是 pandas 執行。", 404);
    if (log.status !== "running") fail("這次執行已結束，請勿覆寫歷史。", 409);
    const body = req.body;
    if (!["succeeded", "failed"].includes(body.status)) fail("無效執行狀態。");
    if (!Array.isArray(body.rows) || body.rows.length > 20 || JSON.stringify(body.rows).length > 24000) fail("結果預覽超過限制。");
    const assessment = await assessIntegratedPython({ req, log, body, logFor });
    const values = { status: body.status, completed_at: new Date().toISOString(),
      row_count: Math.min(10000000, Math.max(0, Math.floor(Number(body.rowCount) || 0))),
      duration_ms: Math.min(180000, Math.max(0, Math.round(Number(body.durationMs) || 0))),
      error_code: body.status === "failed" ? "PYTHON_EXECUTION" : null,
      error_message: body.status === "failed" ? String(body.error || "執行未完成").slice(0, 3000) : null,
      result_preview: body.rows, validation: { ...log.validation, ...(assessment ? { assessment } : {}), stdout: String(body.stdout || "").slice(0, 10000), columns: (Array.isArray(body.columns) ? body.columns : []).slice(0, 60).map((v) => String(v).slice(0, 100)), resultTruncated: Boolean(body.truncated) },
    };
    const updated = await supabase.update(table, `${owned(req, log.id)}&status=eq.running`, values, req.accessToken);
    if (!updated?.length) fail("執行紀錄已變更，沒有覆寫。", 409);
    res.json({ saved: true, assessment });
  }));
  app.post("/api/workflow/:id/delivery", requireUser, queryLimiter, wrap(async (req, res) => {
    const mission = missionFor(req), studyMode = modeFor(req);
    const python = await logFor(req, req.body.pandasLogId);
    if (python.validation?.mode !== "workflow_pandas" || python.validation.missionId !== mission.id || python.validation.studyMode !== studyMode || python.status !== "succeeded") fail("先成功執行此任務、此練習模式的 pandas，再交付。");
    if (!mission.queries.every((q) => python.validation.sources.some((s) => s.name === q.name && s.origin === "supabase" && !s.truncated))) fail("交付需使用所有 SQL 查詢的真實、未截斷結果；教材樣本可練習但不能當正式證據。");
    if (req.body.validated !== true) fail("請先核對資料範圍與任務驗證清單。");
    const note = typeof req.body.note === "string" ? req.body.note : "";
    if (note.length > 4000) fail("交付說明最多 4,000 字。");
    const log = await insert(req, mission, note || "已提交執行證據；商業說明尚待補充／審查。", {
      mode: "workflow_delivery", language: "markdown", studyMode, pandasLogId: python.id,
      sources: python.validation.sources, note, selfReportedValidation: true, reviewStatus: "pending", executionEvidence: "browser_reported",
    }, "succeeded");
    res.json({ logId: log.id, message: "已交付，待審查。這不是自動授予掌握或資深資格。" });
  }));
}
