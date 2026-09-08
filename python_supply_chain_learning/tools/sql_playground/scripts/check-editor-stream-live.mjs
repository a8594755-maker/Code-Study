// Real Preview smoke: exact disposable account, real Supabase error + OpenAI SSE.
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import { readEvents, draftRevision } from "../src/tutor-protocol.js";
dotenv.config({ quiet: true });
const origin = process.argv[2];
if (!/^https:\/\/[a-z0-9-]+--supply-sql-lab-a8594755\.netlify\.app$/.test(origin || "")) throw new Error("Only this site's Preview allowed");
const qa = JSON.parse(execFileSync("node", ["scripts/workflow-qa-account.mjs", "create"], { encoding: "utf8" }));
try {
  const auth = await fetch(process.env.SUPABASE_URL + "/auth/v1/token?grant_type=password", { method: "POST",
    headers: { apikey: process.env.SUPABASE_ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: qa.email, password: qa.password }) });
  assert.equal(auth.status, 200);
  const token = (await auth.json()).access_token;
  async function api(path, body, method = body ? "POST" : "GET") {
    const res = await fetch(origin + path, { method, headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(65000) });
    return { res, data: res.headers.get("content-type")?.includes("application/json") ? await res.json() : null };
  }
  const draft = "SELECT *\nFROM customers_raw\nLIMIT 3;";
  const failed = await api("/api/playground/query", { sql: draft });
  assert.equal(failed.res.status, 400); assert.ok(failed.data.logId);
  const scope = { surface: "playground", id: "free", language: "sql" };
  const request = { requestId: randomUUID(), threadId: randomUUID(), scope, draft, logId: failed.data.logId,
    selection: { from: 9, to: 27 }, message: "請看錯誤，幫我用最小修改修正目前草稿，給可套用的完整版本，說清楚改了哪裡。", mode: "chat" };
  const started = Date.now(), res = (await api("/api/editor-tutor/stream", request)).res;
  assert.equal(res.status, 200); assert.match(res.headers.get("content-type"), /text\/event-stream/);
  let completed, firstDelta = 0, deltaCount = 0;
  await readEvents(res.body, (e) => {
    if (e.type === "error") throw new Error(e.error);
    if (e.type === "answer" && e.text) { firstDelta ||= Date.now() - started; deltaCount++; }
    if (e.type === "done") completed = e;
  });
  assert.ok(completed); assert.equal(completed.message.failed, false, completed.message.content);
  assert.ok(deltaCount > 0);
  assert.ok(completed.message.edit, completed.message.editWarning || "No structured edit returned");
  assert.match(completed.message.edit.code, /olist\.customers_raw/);
  assert.equal(completed.message.edit.baseRevision, draftRevision(draft));
  console.log("PASS real Preview SSE: " + deltaCount + " answer events; first text " + firstDelta + "ms, total " + (Date.now()-started) + "ms; structured revision-bound edit");
  const correct = await api("/api/playground/query", { sql: completed.message.edit.code });
  assert.equal(correct.res.status, 200); assert.equal(correct.data.row_count, 3);
  assert.ok(correct.data.columns?.includes?.("customer_id") || "customer_id" in correct.data.rows[0]);
  const again = (await api("/api/editor-tutor/stream", request)).res;
  let replay; await readEvents(again.body, (e) => { if (e.type === "done") replay = e; });
  assert.equal(replay.replayed, true); assert.equal(replay.message.id, completed.message.id);
  console.log("PASS corrected SQL actually runs; retry replays without another generation");
  const follow = await api("/api/editor-tutor", { ...request, requestId: randomUUID(), draft: completed.message.edit.code, logId: correct.data.logId,
    message: "不用再示範程式。請簡短解釋：為什麼 LIMIT 3 不是全公司的客戶數？", selection: null });
  assert.equal(follow.data.message.failed, false, follow.data.message.content);
  assert.ok(follow.data.message.context.summarized); assert.ok(follow.data.message.context.recentMessages >= 2);
  assert.equal(follow.data.message.edit, null, "explanation should not overwrite editor");
  const history = await api("/api/editor-tutor/history?" + new URLSearchParams({ ...scope, threadId: request.threadId }));
  assert.equal(history.data.messages.length, 4);
  assert.ok(history.data.messages[1].edit);
  const threads = await api("/api/editor-tutor/threads?" + new URLSearchParams(scope));
  assert.ok(threads.data.threads.some((t) => t.id === request.threadId));
  const exported = await api("/api/export?scope=all&format=json");
  assert.ok(exported.data.tutorMessages.every((m) => m.user_id === qa.id));
  assert.equal(exported.data.tutorMessages.length, 4);
  assert.ok(exported.data.tutorMessages.some((m) => m.metadata?.edit?.baseRevision));
  console.log("PASS actual follow-up, stored edit/history, conversation picker data, owner-scoped export; no numeric grading");
} finally {
  execFileSync("node", ["scripts/workflow-qa-account.mjs", "delete", qa.id], { stdio: ["ignore","pipe","pipe"] });
  console.log("CLEANUP exact temporary QA account and cascading records; student data unchanged.");
}
