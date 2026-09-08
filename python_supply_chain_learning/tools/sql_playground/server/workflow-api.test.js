import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";
import { registerWorkflowRoutes, workflowSummary } from "./workflow-api.js";

test("workflow HTTP enforces account ownership, source linkage, terminal state and honest delivery", async () => {
  const logs = [], app = express(); app.use(express.json());
  const filter = (query) => { const params = new URLSearchParams(query); return logs.filter((log) => ["id", "user_id", "status"].every((key) => !params.has(key) || params.get(key) === `eq.${log[key]}`)); };
  const supabase = { select: async (_, query) => filter(query), insert: async (_, value) => { const log = { ...value, id: randomUUID() }; logs.push(log); return [log]; },
    update: async (_, query, values) => { const matched = filter(query); matched.forEach((l) => Object.assign(l, values)); return matched; },
    rpc: async () => ({ rows: [{ value: 1 }], row_count: 1, truncated: false }),
  };
  registerWorkflowRoutes(app, { supabase, schema: "olist", queryLimiter: (req, res, next) => next(), requireUser: (req, res, next) => { const user = req.get("authorization"); if (!user) return res.status(401).end(); req.user = { id: user }; req.accessToken = user; next(); } });
  const server = app.listen(0, "127.0.0.1"); await new Promise((resolve) => server.once("listening", resolve));
  const call = (path, body, user = "alice", method = "POST") => fetch(`http://127.0.0.1:${server.address().port}/api/workflow${path}`, { method, headers: { "Content-Type": "application/json", ...(user ? { authorization: user } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  try {
    assert.equal((await call("", null, null, "GET")).status, 401);
    const sql = await (await call("/day1-map/sql", { sql: "SELECT 1", datasetName: "main", studyMode: "reference" })).json();
    assert.equal(logs[0].validation.mode, "workflow_sql"); assert.equal(logs[0].score, null); assert.equal(logs[0].question_id, null);
    const source = { name: "main", origin: "supabase", logId: sql.logId, digest: sql.resultDigest };
    const body = { code: "result = df.head()", studyMode: "reference", sources: [source] };
    assert.equal((await call("/day1-map/pandas/start", body, "bob")).status, 404);
    assert.equal((await call("/day1-map/pandas/start", { ...body, sources: [{ ...source, digest: "fake" }] })).status, 400);
    const run = await (await call("/day1-map/pandas/start", body)).json();
    assert.equal(logs.at(-1).status, "running");
    assert.equal((await call(`/pandas/${run.logId}`, { status: "succeeded", rows: [], columns: [], rowCount: 0 }, "bob", "PATCH")).status, 404);
    assert.equal((await call(`/pandas/${run.logId}`, { status: "succeeded", rows: [], columns: [], rowCount: 0 }, "alice", "PATCH")).status, 200);
    assert.equal((await call(`/pandas/${run.logId}`, { status: "failed", rows: [] }, "alice", "PATCH")).status, 409);
    assert.equal((await call("/day1-map/delivery", { pandasLogId: run.logId, studyMode: "independent", validated: true })).status, 400);
    assert.equal((await call("/day1-map/delivery", { pandasLogId: run.logId, studyMode: "reference", validated: true })).status, 200);
    assert.equal(logs.at(-1).validation.reviewStatus, "pending"); assert.equal(workflowSummary(logs).submitted, 1);
    const fixture = await (await call("/day1-map/pandas/start", { ...body, sources: [{ name: "main", origin: "fixture" }] })).json();
    await call(`/pandas/${fixture.logId}`, { status: "succeeded", rows: [] }, "alice", "PATCH");
    assert.equal((await call("/day1-map/delivery", { pandasLogId: fixture.logId, studyMode: "reference", validated: true })).status, 400);
    assert.equal((await call("/package?missionId=../../bad", null, "alice", "GET")).status, 404);
    const zip = await call("/package", null, "alice", "GET"); assert.equal(zip.status, 200); assert.equal(Buffer.from(await zip.arrayBuffer()).readUInt16LE(0), 0x4b50);
    const failure = await call("/day1-map/sql", { sql: "DROP TABLE olist.orders_raw", datasetName: "main", studyMode: "reference" }); assert.equal(failure.status, 400); assert.equal(logs.at(-1).score, null);
  } finally { await new Promise((resolve) => server.close(resolve)); }
});
