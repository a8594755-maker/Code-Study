// Opt-in real-provider evaluation. Does not run during build or use a student account.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import dotenv from "dotenv";
import { onboardingOrder } from "../server/sql-onboarding.js";
import { getIntegratedActivity } from "../server/integrated-catalog.js";
import { readEvents } from "../src/tutor-protocol.js";
dotenv.config({ quiet: true });
const origin = process.argv[2];
if (!/^https?:\/\/(127\.0\.0\.1:\d+|[a-z0-9-]+--supply-sql-lab-a8594755\.netlify\.app)$/.test(origin || "")) throw new Error("Only local or this site's Preview allowed");
const qa = JSON.parse(execFileSync("node", ["scripts/workflow-qa-account.mjs", "create"], { encoding: "utf8" }));
try {
  const auth = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: process.env.SUPABASE_ANON_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email: qa.email, password: qa.password }) });
  assert.equal(auth.status, 200);
  const token = (await auth.json()).access_token;
  async function api(path, body, expected = 200) {
    const res = await fetch(origin + path, { method: body ? "POST" : "GET", headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(65000) });
    assert.equal(res.status, expected, path);
    if (res.headers.get("content-type")?.includes("text/event-stream")) {
      let done, deltas = 0;
      await readEvents(res.body, (event) => { if (event.type === "error") throw new Error(event.error); if (event.type === "done") done = event; if (event.type === "answer" && event.text) deltas++; });
      assert.ok(done && deltas > 0, "actual streamed provider response");
      return done;
    }
    return res.json();
  }
  const logs = new Map();
  for (const id of onboardingOrder) {
    const a = getIntegratedActivity(id);
    const result = await api(`/api/workflow/${id}/sql`, { sql: a.reference, datasetName: "main", studyMode: "practice" });
    assert.equal(result.assessment.state, "matched", JSON.stringify(result.assessment));
    assert.equal(result.truncated, false); assert.equal(result.logSaved, true);
    logs.set(id, result.logId);
    console.log(`PASS real onboarding SQL ${id}: ${result.row_count} rows, ${Object.keys(result.rows[0]).join(", ")}`);
  }
  const scope = { surface: "workflow", id: "studio-u1-s1", language: "sql", datasetName: "main", studyMode: "practice" };
  const threadId = randomUUID();
  const turn = (message, extra = {}) => api("/api/editor-tutor/stream", { scope, threadId, requestId: randomUUID(), mode: "chat", draft: "", message, ...extra });
  if (process.argv.includes("--ai")) {
    const first = await turn("我沒有 SQL 基礎，剛入職，連公司資料叫什麼都不知道。我怎麼知道第一步要寫什麼？先教通用寫法再帶我做一小步，不要讓我猜 WHERE。");
    assert.equal(first.message.failed, false, first.message.content);
    assert.match(first.message.content, /```text/);
    assert.match(first.message.content, /SELECT\s+table_schema,\s*table_name\s+FROM\s+information_schema\.tables/i);
    assert.match(first.message.content, /權限|可見|看得到/);
    assert.equal(first.message.edit, null);
    console.log("REAL ANSWER — unknown names:\n" + first.message.content);
    const follow = await turn("所以每個 SELECT 都要用 table_name 嗎？information_schema.tables、table_name、olist，哪些是固定的，哪些是我要替換的？BASE TABLE 每個資料庫都有嗎？不用再貼整題解答。");
    assert.equal(follow.message.failed, false, follow.message.content);
    assert.equal(follow.message.edit, null); assert.ok(follow.message.context.summarized);
    assert.match(follow.message.content, /目錄/);
    console.log("REAL ANSWER — names follow-up:\n" + follow.message.content);
    const next = await turn("現在表名已查到。我下一步要做什麼？是不是直接丟進 pandas 或 Power BI？先教下一個小步驟。", { draft: getIntegratedActivity(scope.id).reference, logId: logs.get(scope.id) });
    assert.equal(next.message.failed, false, next.message.content);
    assert.match(next.message.content, /information_schema\.columns|欄位/);
    console.log("REAL ANSWER — next step:\n" + next.message.content);
    const failed = await api(`/api/workflow/${scope.id}/sql`, { sql: "SELECT * FROM sellers_raw LIMIT 5;", datasetName: "main", studyMode: "practice" }, 400);
    const corrected = await turn("請看目前錯誤，幫我最小修正這個草稿，說明改了哪裡。不要換成目錄驗收的答案。", { draft: "SELECT * FROM sellers_raw LIMIT 5;", logId: failed.logId });
    assert.equal(corrected.message.failed, false, corrected.message.content);
    assert.ok(corrected.message.edit, corrected.message.editWarning || corrected.message.content);
    assert.match(corrected.message.edit.code, /olist\.sellers_raw/);
    const ran = await api(`/api/workflow/${scope.id}/sql`, { sql: corrected.message.edit.code, datasetName: "main", studyMode: "practice" });
    assert.equal(ran.row_count, 5); assert.equal(ran.assessment.state, "needs_revision", "valid exploration does not pass a different inventory task");
    console.log("PASS requested minimal edit actually runs; mismatched task is not falsely passed");
    const exported = await api("/api/export?scope=all&format=json");
    assert.equal(exported.tutorMessages.length, 8);
    assert.ok(exported.tutorMessages.every((m) => m.user_id === qa.id));
  }
  const summary = (await api("/api/integrated")).summary;
  assert.equal(summary.matched, 5);
  console.log("PASS original inventory progress retained; new step results logged separately, no mastery or hours awarded");
} finally {
  execFileSync("node", ["scripts/workflow-qa-account.mjs", "delete", qa.id], { stdio: ["ignore", "pipe", "pipe"] });
  console.log("CLEANUP exact temporary QA account and test records; student account untouched.");
}
