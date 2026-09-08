import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { randomUUID } from "node:crypto";
import { integratedCatalog, integratedActivities, getIntegratedMission } from "./integrated-catalog.js";
import { compareRows, expectedPython, assessIntegratedSql } from "./integrated-assessment.js";
import { integratedSummary, registerIntegratedRoutes } from "./integrated-api.js";
import { registerWorkflowRoutes } from "./workflow-api.js";
import { inspectPlaygroundSql } from "./playground.js";
import { resolveTutorScope, logMatches, packTutorContext } from "./editor-tutor.js";
import { buildDashboard } from "./dashboard.js";
import { buildMissionNotebook, missionFixtures } from "./workflow-notebooks.js";

test("CH1 has 35 authored activities including count scaffolding and three transfer reviews; future chapters are plans", () => {
  assert.equal(integratedCatalog.units.length, 6);
  assert.equal(integratedActivities.length, 35);
  assert.equal(new Set(integratedActivities.map((a) => a.id)).size, 35);
  assert.equal(integratedActivities.filter((a) => a.tool === "sql").length, 26);
  assert.equal(integratedActivities.filter((a) => a.tool === "python").length, 6);
  assert.equal(integratedActivities.filter((a) => a.tool === "powerbi").length, 3);
  assert.ok(integratedCatalog.chapters.slice(1).every((c) => c.status === "planned"));
  for (const activity of integratedActivities) {
    assert.ok(activity.task.length > 20 && activity.explanation.length >= 2);
    assert.ok(!("coreMinutes" in activity), "No time multiplier masquerading as authored content");
    inspectPlaygroundSql(activity.sourceSql || activity.reference);
    assert.ok(getIntegratedMission(activity.id));
    if (activity.kind === "debug") assert.notEqual(activity.starter, activity.reference);
    if (activity.tool === "python") assert.equal(activity.toolLesson.length, 3);
  }
});
test("integrated result evidence is visible on Dashboard without inflating legacy progress or hours", () => {
  const dashboard = buildDashboard([], [{ created_at: new Date().toISOString(), status: "succeeded", score: null, validation: { mode: "workflow_sql", missionId: "studio-u1-s1", assessment: { state: "matched" } } }]);
  assert.equal(dashboard.integrated.matched, 1);
  assert.equal(dashboard.workflow.sqlRuns, 0);
  assert.equal(dashboard.readiness.completedQuestions, 0);
  assert.equal(dashboard.readiness.completedMinutes, 0);
});
test("integrated Notebook preserves the actual draft and explicit dataset origin", () => {
  const mission = getIntegratedMission("studio-u1-p"), code = "result = df.head(2)";
  const notebook = buildMissionNotebook(mission, { mode: "current", datasets: missionFixtures(mission), code });
  assert.equal(notebook.metadata.supply_sql_lab.notExecutionEvidence, true);
  const cells = notebook.cells.filter((c) => c.cell_type === "code").map((c) => c.source.join(""));
  assert.ok(cells[0].includes("fixture"));
  assert.ok(cells.some((cell) => cell.startsWith(code)));
  assert.ok(!cells.some((cell) => cell.includes(mission.python)));
});
test("result comparison checks columns, cardinality, values, ordering, nulls and truncation without scoring", () => {
  const expected = { rows: [{ id: "001", amount: 2 }, { id: "002", amount: null }] };
  assert.equal(compareRows(expected, expected).state, "matched");
  for (const actual of [{ rows: [{ id: "001", amount: 2 }] }, { rows: [{ id: "001", amount: 2 }, { id: "002", amount: 0 }] }, { rows: [...expected.rows].reverse() }, { rows: [{ wrong: 1 }, { wrong: 2 }] }, { ...expected, truncated: true }]) assert.equal(compareRows(actual, expected).state, "needs_revision");
  assert.equal(compareRows({ rows: [...expected.rows].reverse() }, expected, false).state, "matched");
  assert.equal(compareRows({ rows: [] }, { rows: [] }).state, "needs_review");
  assert.equal(compareRows(expected, expected).score, undefined);
});
test("all six pandas validators derive expected output from the source, not hard-coded Olist counts", () => {
  for (const activity of integratedActivities.filter((a) => a.tool === "python")) {
    const mission = getIntegratedMission(activity.id);
    const expected = expectedPython(activity, mission.fixtureRows.main);
    assert.ok(expected.length > 0);
    assert.equal(compareRows({ rows: expected }, { rows: expected }).state, "matched");
  }
  assert.deepEqual(expectedPython({ validator: "shape" }, [{ a: 1 }, { a: 2 }]), [{ row_count: 2, column_count: 1 }]);
});
test("reference checker failure does not relabel successful SQL as a student execution error", async () => {
  const assessment = await assessIntegratedSql({ request: { workflowContext: { missionId: "studio-u1-s2" } }, result: { rows: [{ order_rows: 1 }] }, supabase: { rpc: async () => { throw new Error("offline"); } } });
  assert.equal(assessment.state, "unavailable");
});
test("summary never converts fixtures, support clicks, failed attempts or external self-report into mastery", () => {
  const logs = [
    { status: "succeeded", validation: { missionId: "studio-u1-s1", mode: "workflow_sql", assessment: { state: "matched" } } },
    { status: "succeeded", validation: { missionId: "studio-u1-s1", mode: "workflow_support" } },
    { status: "succeeded", validation: { missionId: "studio-u1-p", mode: "workflow_pandas", assessment: { state: "matched", sourceOrigin: "fixture" } } },
    { status: "succeeded", validation: { missionId: "studio-u2-bi", mode: "workflow_powerbi", assessment: { state: "numbers_matched_pending_review" } } },
  ];
  const summary = integratedSummary(logs);
  assert.equal(summary.matched, 1); assert.equal(summary.pendingBi, 1);
  assert.equal(summary.activities["studio-u1-s1"].label, "結果符合 · 有協助");
  assert.equal(summary.activities["studio-u1-p"].matched, false);
  assert.equal(summary.hours, undefined); assert.equal(summary.mastery, undefined);
});
test("Power BI tutor receives task and external evidence boundaries; other lesson scopes reject it", () => {
  const scope = resolveTutorScope({ surface: "workflow", id: "studio-u6-bi", language: "powerbi", studyMode: "practice" });
  assert.ok(scope.task.powerBiSteps.length >= 6);
  assert.match(scope.reference, /COUNTROWS/);
  assert.throws(() => resolveTutorScope({ surface: "workflow", id: "day1-map", language: "powerbi" }));
  const log = { validation: { mode: "workflow_powerbi", missionId: "studio-u6-bi", studyMode: "practice" } };
  assert.equal(logMatches(scope, log), true);
  assert.equal(logMatches(scope, { validation: { ...log.validation, missionId: "studio-u2-bi" } }), false);
  const packed = packTutorContext({ scope, draft: "Card still shows old rows", logs: [log], message: "為何不更新", mode: "debug" });
  assert.equal(packed.context.lastExecution.origin, "self_reported_external");
});

test("integrated HTTP isolates accounts, checks pandas sources, preserves attempts and keeps BI review pending", async () => {
  const logs = [], messages = [], app = express(); app.use(express.json());
  const select = (table, query) => {
    const p = new URLSearchParams(query), all = table === "sql_playground_tutor_messages" ? messages : logs;
    return all.filter((l) => ["id", "user_id", "status"].every((key) => !p.has(key) || p.get(key) === `eq.${l[key]}`))
      .filter((l) => !p.has("validation->>missionId") || (p.get("validation->>missionId").startsWith("eq.") ? l.validation?.missionId === p.get("validation->>missionId").slice(3) : l.validation?.missionId?.startsWith("studio-")))
      .reverse().slice(0, Number(p.get("limit") || 10000));
  };
  const source = getIntegratedMission("studio-u1-p").fixtureRows.main;
  const supabase = { select: async (t, q) => select(t, q), insert: async (t, row) => { const log = { ...row, id: randomUUID(), created_at: new Date().toISOString() }; (t === "sql_playground_tutor_messages" ? messages : logs).push(log); return [log]; },
    update: async (t, q, values) => { const selected = select(t, q); selected.forEach((l) => Object.assign(l, values)); return selected; },
    rpc: async () => ({ rows: source, row_count: source.length, truncated: false }),
  };
  const deps = { supabase, schema: "olist", queryLimiter: (q, s, next) => next(), requireUser: (req, res, next) => { if (!req.get("authorization")) return res.sendStatus(401); req.user = { id: req.get("authorization") }; req.accessToken = req.user.id; next(); } };
  registerWorkflowRoutes(app, deps); registerIntegratedRoutes(app, deps);
  const server = app.listen(0, "127.0.0.1"); await new Promise((r) => server.once("listening", r));
  const call = (path, body, user = "alice", method = "POST") => fetch(`http://127.0.0.1:${server.address().port}${path}`, { method, headers: { "Content-Type": "application/json", ...(user ? { authorization: user } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  try {
    assert.equal((await call("/api/integrated", null, null, "GET")).status, 401);
    const id = "studio-u1-p", mission = getIntegratedMission(id);
    const sql = await (await call(`/api/workflow/${id}/sql`, { sql: mission.queries[0].sql, datasetName: "main", studyMode: "practice" })).json();
    const payload = { code: mission.python, studyMode: "practice", sources: [{ name: "main", origin: "supabase", logId: sql.logId, digest: sql.resultDigest }] };
    assert.equal((await call(`/api/workflow/${id}/pandas/start`, payload, "bob")).status, 404);
    const start = await (await call(`/api/workflow/${id}/pandas/start`, payload)).json();
    const output = { status: "succeeded", rows: [{ row_count: 4, column_count: 3 }], rowCount: 1, columns: ["row_count", "column_count"] };
    const saved = await (await call(`/api/workflow/pandas/${start.logId}`, output, "alice", "PATCH")).json();
    assert.equal(saved.assessment.state, "matched"); assert.equal(saved.assessment.sourceOrigin, "supabase");
    assert.equal((await call(`/api/workflow/pandas/${start.logId}`, output, "alice", "PATCH")).status, 409);
    const other = await (await call(`/api/integrated/${id}/state`, null, "bob", "GET")).json(); assert.equal(other.logs.length, 0);
    const biId = "studio-u2-bi", biMission = getIntegratedMission(biId);
    const biSql = await (await call(`/api/workflow/${biId}/sql`, { sql: biMission.queries[0].sql, datasetName: "main", studyMode: "practice" })).json();
    const evidence = { sourceLogId: biSql.logId, environment: "desktop_windows", totalRows: 4, spRows: 2, artifactName: "qa.pbix", explanation: "教學 API 測試，未操作真實 Power BI" };
    assert.equal((await call(`/api/integrated/${biId}/powerbi`, evidence, "bob")).status, 400);
    const report = await (await call(`/api/integrated/${biId}/powerbi`, evidence)).json();
    assert.equal(report.assessment.state, "numbers_matched_pending_review");
    assert.equal(logs.at(-1).validation.fileUploaded, false); assert.equal(logs.at(-1).validation.reviewStatus, "pending");
    const wrong = await (await call(`/api/integrated/${biId}/powerbi`, { ...evidence, totalRows: 9 })).json(); assert.equal(wrong.assessment.state, "needs_revision");
    assert.equal((await call(`/api/integrated/${biId}/powerbi`, { ...evidence, environment: "" })).status, 400);
    assert.equal((await call(`/api/integrated/${id}/support`, { kind: "reference" })).status, 200);
    const overview = await (await call("/api/integrated", null, "alice", "GET")).json(); assert.equal(overview.summary.matched, 1);
    assert.equal(logs.every((l) => l.score === null), true);
  } finally { await new Promise((r) => server.close(r)); }
});
