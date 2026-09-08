// Manual opt-in QA: real OpenAI calls, confirmed temporary account, no student writes.
import { execFileSync } from "node:child_process";
import { randomUUID, randomBytes } from "node:crypto";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import { getQuestions } from "../server/course-catalog.js";
dotenv.config({ quiet: true });
const origin = process.argv[2];
if (!/^https?:\/\/(127\.0\.0\.1:\d+|[a-z0-9-]+--supply-sql-lab-a8594755\.netlify\.app)\/?$/.test(origin || "")) throw new Error("QA allows only local or this site's Preview, never production");
const root = process.env.SUPABASE_URL, anon = process.env.SUPABASE_ANON_KEY;
if (new URL(root).hostname !== "ylmuvsdegmpoiygbtipi.supabase.co") throw new Error("Unexpected QA target");
const keys = JSON.parse(execFileSync("/opt/homebrew/bin/supabase", ["projects", "api-keys", "--project-ref", "ylmuvsdegmpoiygbtipi", "--output", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
const admin = keys.find((k) => k.name === "service_role")?.api_key;
if (!admin) throw new Error("Authorized CLI required");
async function request(url, { body, token = anon, key = anon, method = "GET", acceptError = false } = {}) {
  const res = await fetch(url, { method, headers: { apikey: key, Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(40000) });
  const data = await res.json();
  if (!acceptError && !res.ok) throw new Error(`QA HTTP ${res.status}: ${data.error || data.message || "unknown"}`);
  return data;
}
let id;
try {
  const email = `editor-tutor-qa-${randomUUID()}@example.invalid`, password = randomBytes(24).toString("base64url");
  const user = await request(`${root}/auth/v1/admin/users`, { key: admin, token: admin, method: "POST", body: { email, password, email_confirm: true, user_metadata: { purpose: "temporary_editor_tutor_qa" } } });
  id = user.id; assert.match(id, /^[a-f\d-]{36}$/i);
  const session = await request(`${root}/auth/v1/token?grant_type=password`, { method: "POST", body: { email, password } });
  const token = session.access_token;
  const api = (path, body, method = "POST", acceptError = false) => request(`${origin}${path}`, { token, body, method, acceptError });
  const scope = { surface: "playground", id: "free", language: "sql" };
  const sql = "SELECT missing_qa_column\nFROM olist.sellers_raw\nLIMIT 1;";
  const failed = await api("/api/playground/query", { sql }, "POST", true);
  assert.ok(failed.logId);
  const turn = { scope, draft: sql, logId: failed.logId, requestId: randomUUID(), mode: "debug", message: "請解釋 missing_qa_column 錯在哪裡，給我最小可執行修正，再教我驗證列數。" };
  const result = await api("/api/editor-tutor", turn);
  assert.equal(result.message.failed, false, result.message.content);
  assert.match(result.message.content, /```sql\n/);
  assert.ok(result.memory?.length);
  console.log("PASS real Playground error coaching: full SQL + explanation + durable memory");
  const replay = await api("/api/editor-tutor", turn);
  assert.equal(replay.replayed, true); assert.equal(replay.message.id, result.message.id);
  const next = await api("/api/editor-tutor", { ...turn, requestId: randomUUID(), mode: "hint", message: "我剛剛想請你教的驗證是什麼？請承接上文，只說下一個小步驟。" });
  assert.equal(next.message.failed, false, next.message.content);
  assert.equal(next.message.context.summarized, true);
  assert.ok(next.message.context.recentMessages >= 2);
  console.log("PASS real follow-up carries previous summary and conversation; duplicate request replays without another call");
  const py = await api("/api/workflow/day1-map/pandas/start", { code: "result = df['missing_qa_column']", studyMode: "reference", sources: [{ name: "main", origin: "fixture" }] });
  await api(`/api/workflow/pandas/${py.logId}`, { status: "failed", error: "KeyError: missing_qa_column (QA browser-reported fixture)", rows: [] }, "PATCH");
  const python = await api("/api/editor-tutor", { scope: { surface: "workflow", id: "day1-map", studyMode: "reference", language: "python" }, draft: "result = df['missing_qa_column']", logId: py.logId, mode: "debug", message: "我是初學者，請解釋我的 KeyError，給完整修正版，說清楚目前資料是真實還是教材。", requestId: randomUUID() });
  assert.equal(python.message.failed, false, python.message.content);
  assert.match(python.message.content, /```python\n/); assert.match(python.message.content, /教材|虛構|樣本/);
  console.log("PASS real pandas tutor diagnoses KeyError and distinguishes fixtures; does not grade");
  for (const target of [{ surface: "learn", id: getQuestions()[0].id, language: "sql" }, { surface: "workflow", id: "day1-map", language: "sql", datasetName: "main", studyMode: "reference" }]) {
    const reply = await api("/api/editor-tutor", { scope: target, draft: "", mode: "hint", message: "還没開始寫，這個分析師任務的第一小步是什麼？請簡短指導。", requestId: randomUUID() });
    assert.equal(reply.message.failed, false, reply.message.content);
    console.log(`PASS real ${target.surface} SQL tutor available before first attempt`);
  }
  const history = await api(`/api/editor-tutor/history?${new URLSearchParams(scope)}`, undefined, "GET");
  assert.equal(history.messages.length, 4);
  const graded = await api("/api/query", { questionId: getQuestions()[0].id, sql: getQuestions()[0].referenceSql, hintLevel: 0 });
  assert.equal(graded.passed, true);
  const accountLogs = await api("/api/logs", undefined, "GET");
  assert.equal(accountLogs.logs.find((l) => l.id === graded.logId).hint_level, 2);
  console.log("PASS tutor help marks guided practice without lowering SQL correctness");
  const exported = await api("/api/export?scope=all&format=json", undefined, "GET");
  assert.equal(exported.tutorMessages.filter((m) => m.metadata?.harness === "editor-tutor-v2").length, 10);
  assert.ok(exported.tutorMessages.every((m) => m.user_id === id));
  console.log("PASS all four editor surfaces, persisted history, account export (10 tutor messages)");
} finally {
  if (id) {
    await request(`${root}/auth/v1/admin/users/${id}`, { key: admin, token: admin, method: "DELETE" });
    console.log("CLEANUP exact temporary tutor QA account and cascading records; student data untouched.");
  }
}
