import { getIntegratedActivity, getIntegratedMission } from "./integrated-catalog.js";

const equal = (a, b) => a === b || (typeof a === "number" && typeof b === "number" && Math.abs(a - b) <= 1e-8 * Math.max(1, Math.abs(b)));
export function compareRows(actual, expected, ordered = true) {
  if (actual.truncated || expected.truncated) return { state: "needs_revision", message: "資料已截斷，不能用部分結果判定本題符合。" };
  const got = actual.rows || [], want = expected.rows || [];
  const count = actual.row_count ?? actual.rowCount ?? got.length;
  if (count !== want.length || got.length !== want.length) return { state: "needs_revision", message: `目前 ${count} 列；本題應有 ${want.length} 列。先核對範圍、COUNT／DISTINCT 與 LIMIT，不是只改欄名。` };
  if (!want.length) return { state: "needs_review", message: "基準查詢為空，暫不自動判定符合；需確認資料快照與條件。" };
  const columns = Object.keys(want[0]);
  if (got.some((row) => !row || typeof row !== "object" || Object.keys(row).length !== columns.length || columns.some((key) => !(key in row)))) return { state: "needs_revision", message: `請依交付要求輸出欄位：${columns.join("、")}。不需要額外欄位。` };
  const key = (row) => JSON.stringify(columns.map((c) => row[c]));
  const a = ordered ? got : [...got].sort((a, b) => key(a).localeCompare(key(b)));
  const b = ordered ? want : [...want].sort((a, b) => key(a).localeCompare(key(b)));
  for (let i = 0; i < b.length; i++) {
    const col = columns.find((c) => !equal(a[i][c], b[i][c]));
    if (col) return { state: "needs_revision", message: `第 ${i + 1} 列的 ${col} 與本題基準不同。檢查條件、排序與分類邊界；可以向旁邊家教詢問原因。` };
  }
  return { state: "matched", message: "本次結果與題目基準相符。這是結果核對，不代表已能獨立解釋或掌握。", checkedRows: want.length, columns };
}

export function expectedPython(activity, rows) {
  const ascending = (a, b) => a.seller_id < b.seller_id ? -1 : a.seller_id > b.seller_id ? 1 : 0;
  switch (activity.validator) {
    case "shape": return [{ row_count: rows.length, column_count: Object.keys(rows[0] || {}).length }];
    case "rename": return rows.map((r) => ({ id: r.seller_id, state: r.seller_state }));
    case "filter": return rows.filter((r) => ["SP", "RJ"].includes(r.seller_state)).sort(ascending).map((r) => ({ seller_id: r.seller_id, seller_state: r.seller_state }));
    case "missing": return [{ sample_rows: rows.length, missing_delivery: rows.filter((r) => r.order_delivered_customer_date === null).length }];
    case "classify": return rows.map((r) => ({ review_id: r.review_id, service_group: r.review_score === null ? "unknown" : Number(r.review_score) <= 2 ? "needs_follow_up" : "normal" }));
    case "handoff": return [...rows].sort((a, b) => -ascending(a, b)).map((r) => ({ seller_id: r.seller_id, seller_city: r.seller_city, seller_state: r.seller_state }));
    default: throw new Error("Missing authored pandas validator");
  }
}

export async function assessIntegratedSql({ request, result, supabase }) {
  const activity = getIntegratedActivity(request.workflowContext?.missionId);
  if (!activity || activity.tool !== "sql") return null;
  try {
    const reference = await supabase.rpc("sql_playground_execute", { query_text: activity.reference.trim().replace(/;\s*$/, "") }, request.accessToken);
    return { ...compareRows(result, reference, activity.ordered), evidence: "server_result_comparison", activityVersion: "2026-08-31" };
  } catch {
    return { state: "unavailable", message: "你的 SQL 已執行，但基準核對暫時不可用；執行紀錄仍保留，尚未判定符合。" };
  }
}

export async function assessIntegratedPython({ req, log, body, logFor }) {
  const activity = getIntegratedActivity(log.validation.missionId);
  if (!activity || activity.tool !== "python" || body.status !== "succeeded") return null;
  const source = log.validation.sources.find((s) => s.name === "main");
  let rows, origin;
  if (source?.origin === "fixture") {
    rows = getIntegratedMission(activity.id).fixtureRows.main;
    origin = "fixture";
  } else if (source?.origin === "supabase") {
    const original = await logFor(req, source.logId);
    if (!original.validation?.referenceSql) return { state: "needs_review", message: "你修改了本題取數範圍；可以探索，但需重新取得教材指定資料才能自動核對本題。" };
    if (original.validation?.truncated || original.row_count > 20 || original.row_count !== original.result_preview?.length) return { state: "needs_review", message: "來源預覽不完整，不能自動核對 pandas；請重新取得本題 20 列資料。" };
    rows = original.result_preview;
    origin = "supabase";
  } else return { state: "needs_review", message: "缺少可核對的來源快照。" };
  try {
    return { ...compareRows(body, { rows: expectedPython(activity, rows) }), sourceOrigin: origin,
      evidence: "browser_reported_result_compared_to_source", note: "伺服器核對回報的結果值，未在伺服器執行 Python；不能當作防作弊認證。" };
  } catch { return { state: "needs_review", message: "來源欄位與本題資料不符，請先核對來源 SQL。" }; }
}
