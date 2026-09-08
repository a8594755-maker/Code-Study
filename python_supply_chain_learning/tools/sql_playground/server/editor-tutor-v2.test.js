import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { packTutorContext, resolveTutorScope, makeContextLookup, requestEditorTutor } from "./editor-tutor.js";
import { applicableTutorCode, canApplyEdit, lineChanges } from "../src/tutor-code.js";
import { draftRevision, partialAnswer, readEvents } from "../src/tutor-protocol.js";
import { createChatHandler } from "../netlify/functions/editor-chat.js";
import { activityTeaching } from "../src/activity-teaching.js";
import { integratedActivities } from "./integrated-catalog.js";

const scope = resolveTutorScope({ surface: "playground", id: "free", language: "sql" });
const schema = [{ table_name: "customers_raw", column_name: "customer_id", data_type: "text" }];
const output = { answer: "修正 schema 即可。\n\n請重新執行驗證。", memory: "仍需重跑", followUps: [], edit: null };
function stream(events, chunks = 7) {
  const bytes = new TextEncoder().encode(events.map((e) => "data: " + JSON.stringify(e) + "\r\n\r\n").join(""));
  let offset = 0;
  return new ReadableStream({ pull(c) { if (offset >= bytes.length) return c.close(); c.enqueue(bytes.slice(offset, offset += chunks)); } });
}
test("SSE handles split UTF-8, CRLF and JSON chunks without corrupting Traditional Chinese", async () => {
  const events = [{ type: "answer", text: "修正這裡\n下一行" }, { type: "done" }], received = [];
  await readEvents(stream(events, 1), (e) => received.push(e));
  assert.deepEqual(received, events);
  assert.equal(partialAnswer('{"answer":"第一行\\n\\u4f60\\'), "第一行\n你");
});
test("context keeps environment, related columns and selected region when history is reduced", () => {
  const draft = "-- 這是一段長註解\n".repeat(1900) + "SELECT * FROM olist.customers_raw;";
  const { context, stats } = packTutorContext({ scope, draft, message: "這一段為何不能跑？", schema,
    selection: { from: draft.length - 35, to: draft.length },
    history: Array.from({ length: 20 }, () => ({ role: "assistant", content: "教材".repeat(3000) })) });
  assert.ok(stats.inputBytes <= 24000);
  assert.equal(context.environment.qualifiedTablesRequired, true);
  assert.ok(context.tableCatalog.includes("olist.customers_raw"));
  assert.ok(context.schema.some((s) => s.name === "olist.customers_raw"));
  assert.match(context.currentDraft, /SELECT/);
  assert.ok(stats.draftTruncated);
});
test("context lookups cannot read arbitrary tables, users, or execute SQL", () => {
  const lookup = makeContextLookup({ schema, draft: "SELECT * FROM olist.customers_raw;", logs: [{ id: "owned", status: "failed", error_message: "READ_ONLY_POLICY" }] });
  assert.equal(lookup({ kind: "schema", table: "olist.customers_raw" }).tables[0].columns[0][0], "customer_id");
  assert.deepEqual(lookup({ kind: "schema", table: "auth.users" }).tables, []);
  assert.ok(lookup({ kind: "execute", sql: "SELECT 1" }).error);
  assert.equal(lookup({ kind: "execution", userId: "someone-else" }).id, "owned");
});
test("parser rejects incomplete SQL/Python, allows harmless literal update and blocks write queries", () => {
  for (const code of ["SELECT * FROM", "SELECT * FROM customers_raw", "DELETE FROM olist.customers_raw;"]) assert.equal(applicableTutorCode("sql", "sql", code), null);
  assert.ok(applicableTutorCode("sql", "sql", "SELECT 'update' AS example;"));
  assert.equal(applicableTutorCode("python", "python", 'result = df['), null);
  assert.equal(applicableTutorCode("python", "python", '...'), null);
});
test("edit acceptance is bound to original revision, including drafts longer than 160 lines", () => {
  assert.notEqual(draftRevision("-- 😀"), draftRevision("-- 😁"));
  const before = Array.from({ length: 250 }, (_, i) => "-- " + i).join("\n") + "\nSELECT 1;";
  const after = before.replace("-- 220\n", "-- changed\n");
  const edit = { language: "sql", code: after, baseRevision: draftRevision(before) };
  assert.equal(canApplyEdit(edit, before), true);
  assert.equal(canApplyEdit(edit, before + " "), false);
  const diff = lineChanges(before, after);
  assert.equal(diff.length, 1); assert.equal(diff[0].beforeLine, 221);
  assert.deepEqual(diff[0].removed, ["-- 220"]);
});
test("streaming provider emits partial answer, supports scoped lookup and counts both rounds", async () => {
  const seen = [], requests = [];
  const result = await requestEditorTutor({ apiKey: "test", endpoint: "https://example.invalid", context: { learnerQuestion: "why" },
    lookup: makeContextLookup({ schema, draft: "", logs: [] }), onEvent: (e) => seen.push(e),
    fetchImpl: async (_url, opts) => {
      requests.push(JSON.parse(opts.body));
      const data = requests.length === 1 ? { output: [{ type: "function_call", name: "inspect_context", call_id: "one", arguments: JSON.stringify({ kind: "schema", table: "olist.customers_raw", start: 0, length: 0 }) }], usage: { input_tokens: 10 } }
        : { id: "r", output: [{ type: "message", role: "assistant", content: [{ type: "output_text", text: JSON.stringify(output) }] }], usage: { input_tokens: 20, output_tokens: 5 } };
      return new Response(stream([...(requests.length === 2 ? [{ type: "response.output_text.delta", delta: JSON.stringify(output) }] : []), { type: "response.completed", response: data }]), { headers: { "Content-Type": "text/event-stream" } });
    } });
  assert.equal(result.usage.input_tokens, 30);
  assert.ok(seen.some((e) => e.type === "answer" && e.text.includes("schema")));
  assert.ok(requests[1].input.some((i) => i.type === "function_call_output" && i.call_id === "one"));
  assert.equal(result.toolTrace[0].table, "olist.customers_raw");
  assert.equal(requests[0].store, false);
});
test("unknown tool calls and incomplete streams fail closed", async () => {
  for (const events of [
    [{ type: "response.completed", response: { output: [{ type: "function_call", name: "execute_sql" }] } }],
    [{ type: "response.output_text.delta", delta: '{"answer":"partial' }],
  ]) await assert.rejects(requestEditorTutor({ apiKey: "test", endpoint: "unused", context: {}, lookup: () => ({}), onEvent() {},
    fetchImpl: async () => new Response(stream(events), { headers: { "Content-Type": "text/event-stream" } }) }));
});
test("native Netlify stream authenticates, saves structured edit, replays, and filters by owner", async () => {
  const records = [], calls = [];
  const supabase = {
    getUser: async (token) => { if (token !== "qa") throw new Error(); return { id: "owned-user" }; },
    select: async (_table, query) => {
      assert.match(query, /user_id=eq.owned-user/);
      const q = new URLSearchParams(query), id = q.get("id");
      if (id) return records.filter((r) => r.id === id.slice(3));
      return [];
    },
    rpc: async () => schema,
    insert: async (_t, row) => { records.push({ ...row, created_at: new Date().toISOString() }); return [records.at(-1)]; },
  };
  const handler = createChatHandler({ supabase, provider: { model: "test" }, requestAI: async (opts) => {
    calls.push(opts); opts.onEvent({ type: "answer", text: "修正…" });
    return { ...output, edit: { code: "SELECT * FROM olist.customers_raw;", reason: "加上 schema", changes: ["FROM 補上 olist."] }, usage: {} };
  } });
  const requestId = randomUUID(), draft = "SELECT * FROM customers_raw;";
  const request = (token = "qa") => new Request("https://example.invalid/api/editor-tutor/stream", { method: "POST", headers: { Authorization: "Bearer " + token }, body: JSON.stringify({ requestId, scope: { surface: "playground", id: "free", language: "sql" }, draft, message: "幫我修改" }) });
  assert.equal((await handler(request("other"))).status, 401);
  const events = []; await readEvents((await handler(request())).body, (e) => events.push(e));
  const done = events.at(-1);
  assert.equal(done.type, "done"); assert.equal(done.message.edit.baseRevision, draftRevision(draft));
  assert.ok(done.message.replyTo); assert.equal(records.length, 2);
  const replay = []; await readEvents((await handler(request())).body, (e) => replay.push(e));
  assert.equal(replay.at(-1).replayed, true); assert.equal(calls.length, 1);
});
test("each CH1 explanation covers its own tool, and catalog question does not teach COUNT as its task", () => {
  const first = integratedActivities.find((a) => a.id === "studio-u1-s1");
  assert.match(activityTeaching(first).join(" "), /information_schema.tables/);
  assert.doesNotMatch(activityTeaching(first).join(" "), /COUNT/);
  for (const a of integratedActivities.filter((a) => a.tool === "python")) {
    assert.ok(activityTeaching(a).length >= 3);
    assert.doesNotMatch(activityTeaching(a).join(" "), /WHERE 像 Excel/);
  }
});
