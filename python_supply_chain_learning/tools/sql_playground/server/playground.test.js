import test from "node:test";
import assert from "node:assert/strict";
import { createPlaygroundNoteHandler, createPlaygroundQueryHandler, inspectPlaygroundSql } from "./playground.js";
import { buildDemoReport, describeDemoResult, projectDemo } from "./project-demo.js";
import { buildDashboard } from "./dashboard.js";
import { resultCsv } from "../src/download.js";

function fixture({ executeError, insertError, updateError } = {}) {
  const writes = [], calls = [];
  const supabase = {
    async insert(table, row) { if (insertError) throw new Error("offline"); writes.push({ table, row }); return [{ id: "log-1" }]; },
    async update(table, filter, values) { if (updateError) throw new Error("offline"); writes.push({ table, filter, values }); return [values]; },
    async rpc(name, args, token) { calls.push({ name, args, token }); if (executeError) throw executeError; return { rows: [{ value: 1 }], row_count: 1, truncated: false }; },
  };
  const response = { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(data) { this.data = data; return this; } };
  const request = { user: { id: "student" }, accessToken: "user-token", body: { sql: "SELECT 1 AS value;" } };
  return { supabase, writes, calls, response, request };
}

test("all twelve Demo queries parse under the free-query safety policy", () => {
  assert.equal(projectDemo.steps.length, 12);
  assert.equal(new Set(projectDemo.steps.map((s) => s.id)).size, 12);
  for (const step of projectDemo.steps) {
    const { tags } = inspectPlaygroundSql(step.sql);
    assert.ok(tags.includes("SELECT"));
    assert.ok(!tags.includes(undefined));
    assert.ok(step.sql.includes("\n"));
    for (const field of ["purpose", "why", "read", "verify", "decision"]) assert.ok(step[field].length > 20);
    for (const tag of step.tags.filter((s) => /^[A-Z ]+$/.test(s) && s !== "KPI")) assert.ok(tags.includes(tag), `${step.id}: ${tag}`);
  }
});

test("syntax tags come from AST, not comments, literals or Array.join", () => {
  const simple = inspectPlaygroundSql("SELECT 'JOIN' AS label /* GROUP BY */");
  assert.deepEqual(simple.tags, ["SELECT"]);
  assert.ok(inspectPlaygroundSql(projectDemo.steps.find((s) => s.id === "join-sample").sql).tags.includes("JOIN"));
});

test("Playground blocks mutations, stacked statements, private schemas and side effects", () => {
  for (const sql of ["DELETE FROM olist.orders_raw", "SELECT 1; SELECT 2;", "SELECT * FROM auth.users", "SELECT * FROM orders_raw", "SELECT pg_sleep(5)", "SELECT public.count(*) FROM olist.orders_raw", "SELECT custom_function()", "WITH x AS (DELETE FROM olist.orders_raw RETURNING *) SELECT * FROM x", "SELECT * FROM olist.orders_raw FOR UPDATE", "SELECT 1 INTO backup"]) {
    assert.throws(() => inspectPlaygroundSql(sql), undefined, sql);
  }
});

test("free query executes once with the user JWT; writes logs but never grades or progresses", async () => {
  const f = fixture();
  await createPlaygroundQueryHandler(f)(f.request, f.response);
  assert.equal(f.response.statusCode, 200);
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].token, "user-token");
  assert.equal(f.writes[0].row.question_id, null);
  assert.equal(f.writes[0].row.validation.mode, "playground");
  assert.equal(f.writes[1].values.score, null);
  assert.equal(f.writes[1].values.status, "succeeded");
  assert.ok(f.writes.every((w) => w.table === "sql_playground_query_logs"));
  assert.ok(f.response.data.logSaved);
});

test("invalid SQL is logged without a score or database execution", async () => {
  const f = fixture(); f.request.body.sql = "UPDATE olist.orders_raw SET order_status = 'x'";
  await createPlaygroundQueryHandler(f)(f.request, f.response);
  assert.equal(f.response.statusCode, 400);
  assert.equal(f.calls.length, 0);
  assert.equal(f.writes[1].values.status, "failed");
  assert.equal(f.response.data.code, "READ_ONLY_POLICY");
});

test("logging must begin successfully before executing any query", async () => {
  const f = fixture({ insertError: true });
  await createPlaygroundQueryHandler(f)(f.request, f.response);
  assert.equal(f.response.statusCode, 503); assert.equal(f.calls.length, 0);
});

test("DB error is saved and a log-update error does not pretend success", async () => {
  const f = fixture({ executeError: Object.assign(new Error('column "typo" does not exist'), { code: "42703" }) });
  await createPlaygroundQueryHandler(f)(f.request, f.response);
  assert.equal(f.response.data.code, "42703");
  assert.equal(f.writes[1].values.status, "failed");
  const g = fixture({ updateError: true });
  await createPlaygroundQueryHandler(g)(g.request, g.response);
  assert.equal(g.response.statusCode, 200); assert.equal(g.response.data.logSaved, false);
  assert.ok(g.response.data.warning);
});

test("oversized SQL is rejected, retained SQL is capped, and unknown demo IDs fail", async () => {
  const f = fixture(); f.request.body.sql = "SELECT 1" + " ".repeat(50_000);
  await createPlaygroundQueryHandler(f)(f.request, f.response);
  assert.equal(f.response.statusCode, 400); assert.equal(f.writes[0].row.sql_text.length, 50_000); assert.equal(f.calls.length, 0);
  const g = fixture(); g.request.body.demoStepId = "other-project";
  await createPlaygroundQueryHandler(g)(g.request, g.response);
  assert.equal(g.response.statusCode, 400); assert.equal(g.writes.length, 0);
});

test("Demo observations only attach to unchanged reference SQL", async () => {
  const step = projectDemo.steps[0];
  const f = fixture(); f.request.body = { sql: step.sql, demoStepId: step.id };
  await createPlaygroundQueryHandler(f)(f.request, f.response);
  assert.ok(f.response.data.observation);
  assert.equal(f.writes[0].row.validation.mode, "project_demo");
  const g = fixture(); g.request.body.demoStepId = step.id;
  await createPlaygroundQueryHandler(g)(g.request, g.response);
  assert.equal(g.response.data.observation, null);
});

test("observations stop handoff on bad keys or zero/multiplied grain", () => {
  assert.match(describeDemoResult("order-grain", { rows: [{ row_count: 12, unique_orders: 10, null_order_ids: 0, extra_order_rows: 2 }] }), /停止/);
  assert.match(describeDemoResult("join-audit", { rows: [{ base_orders: 0, joined_rows: 0, unique_orders: 0 }] }), /暫停/);
});

test("notes preserve metadata and enforce log ownership with user filter", async () => {
  const f = fixture(); f.request.params = { id: "log-1" }; f.request.body = { note: "我的驗證紀錄" };
  f.supabase.select = async (_table, filter) => { assert.match(filter, /user_id=eq.student/); return [{ validation: { mode: "playground", tags: ["SELECT"], truncated: true } }]; };
  await createPlaygroundNoteHandler(f)(f.request, f.response);
  assert.equal(f.response.statusCode, 200);
  assert.match(f.writes[0].filter, /user_id=eq.student/);
  assert.deepEqual(f.writes[0].values.validation.tags, ["SELECT"]);
  assert.equal(f.writes[0].values.validation.note, "我的驗證紀錄");
  f.supabase.select = async () => [];
  await createPlaygroundNoteHandler(f)(f.request, f.response);
  assert.equal(f.response.statusCode, 404);
});

test("Demo report includes executed SQL, timestamps, notes and missing-evidence labels", () => {
  const report = buildDemoReport([{ id: "example-log", created_at: "2026-08-30T10:00:00Z", status: "succeeded", sql_text: "SELECT 1;", row_count: 1,
    validation: { mode: "project_demo", demoStepId: "inventory", note: "確認範圍", observation: null }, result_preview: [{ value: 1 }] }]);
  for (const value of ["example-log", "SELECT 1;", "確認範圍", "2026-08-30T10:00:00Z", "尚無本帳號的執行證據", "修改後 SQL 不套用範例結論"]) assert.ok(report.includes(value));
});

test("free exploration does not change lesson readiness or first-attempt accuracy", () => {
  const logs = [{ question_id: "ch01-q01", status: "succeeded", score: 100, attempt_number: 1, created_at: new Date().toISOString() }];
  const original = buildDashboard([], logs);
  const mixed = buildDashboard([], [...logs, { question_id: null, status: "failed", score: null, attempt_number: 1, created_at: new Date().toISOString(), validation: { mode: "playground" } }]);
  assert.deepEqual(mixed.readiness, original.readiness);
  assert.equal(mixed.metrics.firstAttemptAccuracy, original.metrics.firstAttemptAccuracy);
});

test("result CSV keeps line breaks/quotes and neutralizes spreadsheet formulas", () => {
  const csv = resultCsv([{ label: '=HYPERLINK("bad")', amount: -2, note: "two\nlines", empty: null }]);
  assert.ok(csv.startsWith("\uFEFF")); assert.ok(csv.includes("'=HYPERLINK")); assert.ok(csv.includes('"-2"')); assert.ok(csv.includes('"two\nlines"'));
});
