import { integratedCatalog, integratedActivities, getIntegratedActivity } from "./integrated-catalog.js";
import { redact } from "./editor-tutor.js";
import { reviewQueue } from './review-queue.js';

const table = "sql_playground_query_logs";
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const uuid = /^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i;

export function integratedSummary(logs = [], tutorMessages = []) {
  const activities = Object.fromEntries(integratedActivities.map((activity) => {
    const entries = logs.filter((log) => log.validation?.missionId === activity.id);
    const executionMode = activity.tool === "sql" ? "workflow_sql" : activity.tool === "python" ? "workflow_pandas" : "workflow_powerbi";
    const attempts = entries.filter((l) => l.validation.mode === executionMode);
    const helped = entries.some((l) => l.validation.mode === "workflow_support") || tutorMessages.some((m) => m.metadata?.scope?.id === activity.id && m.role === "assistant" && !m.metadata?.failed);
    const matched = attempts.some((l) => l.status === "succeeded" && l.validation.assessment?.state === "matched" && (activity.tool !== "python" || l.validation.assessment.sourceOrigin === "supabase"));
    const latest = [...attempts].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];
    return [activity.id, { attempts: attempts.length, helped, matched,
      state: activity.tool === "powerbi" && attempts.length ? "pending_review" : matched ? "matched" : attempts.length ? "practicing" : "not_started",
      latestLogId: latest?.id || null, lastAssessment: latest?.validation?.assessment || null,
      label: activity.tool === "powerbi" && attempts.length ? "外部成果待審查" : matched ? helped ? "結果符合 · 有協助" : "結果符合 · 待解釋" : attempts.length ? "練習中" : "未開始" }];
  }));
  return { activities, reviewQueue: reviewQueue(logs), matched: Object.values(activities).filter((a) => a.matched).length,
    pendingBi: integratedActivities.filter((a) => a.tool === "powerbi" && activities[a.id].state === "pending_review").length,
    totalExecutable: integratedActivities.filter((a) => a.tool !== "powerbi").length,
    note: "結果核對、提示紀錄和外部審查分開顯示；不以計時、勾選或看過答案判定掌握。" };
}

export function registerIntegratedRoutes(app, { supabase, requireUser, queryLimiter }) {
  const wrap = (fn) => async (req, res) => { res.setHeader("Cache-Control", "no-store"); try { await fn(req, res); } catch (error) { res.status(error.status || 503).json({ error: error.status ? error.message : "紀錄暫時無法同步，請保留目前內容並重試。" }); } };
  const activityFor = (req) => getIntegratedActivity(req.params.id) || fail("找不到整合課程活動。", 404);
  const insert = async (req, activity, text, validation) => {
    const [log] = await supabase.insert(table, { user_id: req.user.id, sql_text: redact(text), question_id: null, chapter_id: null, unit_id: null,
      question_title: `CH1 · ${activity.title}`, lesson_id: `integrated:${activity.id}`, lesson_title: activity.title,
      status: "succeeded", score: null, hint_level: 0, attempt_number: null, completed_at: new Date().toISOString(),
      validation: { ...validation, missionId: activity.id, chapter: "ch01", unit: activity.unitId, studyMode: activity.mode, tags: activity.tags } }, req.accessToken);
    if (!log?.id) fail("紀錄尚未儲存。", 503);
    return log;
  };
  app.get("/api/integrated", requireUser, wrap(async (req, res) => {
    const logs = [];
    for (let offset = 0; offset < 10000; offset += 1000) {
      const page = await supabase.select(table, `select=id,status,created_at,validation&user_id=eq.${req.user.id}&validation->>missionId=like.studio-*&order=created_at.desc,id.desc`, req.accessToken, { Range: `${offset}-${offset + 999}` });
      logs.push(...page); if (page.length < 1000) break;
    }
    const tutorMessages = await supabase.select("sql_playground_tutor_messages", `select=role,metadata&user_id=eq.${req.user.id}&metadata->scope->>id=like.studio-*&role=eq.assistant&order=created_at.desc&limit=1000`, req.accessToken);
    res.json({ ...integratedCatalog, summary: integratedSummary(logs, tutorMessages), summaryWindow: "最近 10,000 筆整合活動及 1,000 則家教回覆；完整歷史仍可匯出。" });
  }));
  app.post("/api/integrated/:id/support", requireUser, queryLimiter, wrap(async (req, res) => {
    const activity = activityFor(req);
    if (!["reference", "unit_example"].includes(req.body?.kind)) fail("無效教學事件。");
    const log = await insert(req, activity, req.body.kind === "reference" ? "查看本題完整答案與解說" : "查看本單元示範", { mode: "workflow_support", language: "markdown", supportKind: req.body.kind });
    res.json({ saved: true, logId: log.id });
  }));
  app.get("/api/integrated/:id/state", requireUser, wrap(async (req, res) => {
    const activity = activityFor(req);
    const logs = await supabase.select(table, `select=*&user_id=eq.${req.user.id}&validation->>missionId=eq.${activity.id}&order=created_at.desc,id.desc&limit=30`, req.accessToken);
    res.json({ logs });
  }));
  app.post("/api/integrated/:id/powerbi", requireUser, queryLimiter, wrap(async (req, res) => {
    const activity = activityFor(req);
    if (activity.tool !== "powerbi") fail("此活動不是 Power BI 實作。");
    const { sourceLogId, totalRows, spRows, artifactName, explanation, environment } = req.body;
    if (!uuid.test(sourceLogId)) fail("請先準備本題的真實 SQL 資料。");
    const [source] = await supabase.select(table, `select=*&id=eq.${sourceLogId}&user_id=eq.${req.user.id}&limit=1`, req.accessToken);
    if (!source || source.status !== "succeeded" || source.validation?.mode !== "workflow_sql" || source.validation.missionId !== activity.id || !source.validation.referenceSql || source.validation.truncated || source.row_count !== source.result_preview?.length || source.row_count > 20) fail("來源不是本題完整快照，請重新準備資料。", 400);
    if (environment !== "desktop_windows") fail("此版本步驟以 Windows Desktop 為準；環境未就緒可稍後回來，不必假裝完成。");
    if (typeof artifactName !== "string" || !artifactName.trim() || artifactName.length > 150) fail("請填入你實際儲存的報表檔名（此處不會上傳檔案）。");
    if (typeof explanation !== "string" || !explanation.trim() || explanation.length > 2000) fail("請簡短說明你實際做的對帳；沒有最低字數。");
    if (!Number.isInteger(totalRows) || totalRows < 0 || totalRows > 1000000 || !Number.isInteger(spRows) || spRows < 0 || spRows > totalRows) fail("請填入報表實際顯示的非負整數列數，SP 不可超過總數。");
    const extra = activity.biKind === "refresh" ? 1 : 0;
    const expectedTotal = source.result_preview.length + extra;
    const expectedSp = source.result_preview.filter((r) => r.seller_state === "SP").length + extra;
    const matched = totalRows === expectedTotal && spRows === expectedSp;
    const assessment = { state: matched ? "numbers_matched_pending_review" : "needs_revision", expectedTotal, expectedSp,
      message: matched ? "填入的數字與來源一致；報表檔案與操作尚未審查，不代表 Power BI 已通過。" : "填入的數字與來源不符。檢查來源檔、Refresh 和切片器；可問旁邊家教，不計零分。" };
    const log = await insert(req, activity, `${activity.title}\n檔案：${artifactName}\n總列數：${totalRows}；SP：${spRows}\n${explanation}`, {
      mode: "workflow_powerbi", language: "powerbi", sourceLogId, artifactName: redact(artifactName), explanation: redact(explanation), environment, totalRows, spRows,
      includesTrainingRow: Boolean(extra), reviewStatus: "pending", executionEvidence: "self_reported_external", fileUploaded: false, assessment,
    });
    res.json({ saved: true, logId: log.id, assessment });
  }));
}
