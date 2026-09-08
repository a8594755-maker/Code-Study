import test from "node:test";
import assert from "node:assert/strict";

// Real HTTP/Express routing, but an in-memory Supabase double: no live accounts
// or production progress are created/modified by this regression test.
test("Playground API authenticates, isolates accounts and exports notes end to end", async () => {
  process.env.NETLIFY = "true";
  process.env.SUPABASE_URL = "https://playground-test.invalid";
  process.env.SUPABASE_ANON_KEY = `test.${Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url")}.test`;
  const realFetch = global.fetch;
  const logs = [];
  let authProbes = 0;
  global.fetch = async (input, options = {}) => {
    const url = new URL(input);
    if (url.origin !== "https://playground-test.invalid") return realFetch(input, options);
    if (url.pathname === "/auth/v1/settings") { authProbes += 1; return Response.json({ external: { email: true } }); }
    const user = options.headers?.Authorization === "Bearer alice" ? "alice" : options.headers?.Authorization === "Bearer bob" ? "bob" : null;
    if (url.pathname === "/auth/v1/user") return Response.json(user ? { id: user } : { error: "Invalid token" }, { status: user ? 200 : 401 });
    const body = options.body ? JSON.parse(options.body) : null;
    if (url.pathname.endsWith("/rpc/sql_playground_execute")) return Response.json({ rows: [{ value: 1 }], row_count: 1, truncated: false });
    if (url.pathname.endsWith("/sql_playground_query_logs")) {
      const selected = logs.filter((log) => log.user_id === user && (!url.searchParams.has("id") || url.searchParams.get("id") === `eq.${log.id}`));
      if (options.method === "POST") { const log = { ...body, id: `log-${logs.length}`, created_at: new Date().toISOString() }; logs.push(log); return Response.json([log]); }
      if (options.method === "PATCH") { selected.forEach((log) => Object.assign(log, body)); return Response.json(selected); }
      return Response.json(selected);
    }
    throw new Error(`Unexpected Supabase operation: ${url.pathname}`);
  };
  let server;
  try {
    const { app } = await import("./index.js");
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve) => server.once("listening", resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const request = (path, user, body, method = "POST") => realFetch(origin + path, { method, headers: { ...(user ? { Authorization: `Bearer ${user}` } : {}), "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const configResponse = await request("/api/config", null, null, "GET");
    assert.equal(configResponse.status, 200);
    assert.equal(configResponse.headers.get("cache-control"), "no-store");
    assert.equal((await configResponse.json()).authEnabled, true);
    const health = await (await request("/api/health", null, null, "GET")).json();
    assert.equal(health.authReady, true);
    assert.equal(health.databaseVerified, false);
    assert.equal(authProbes, 1);
    for (const [path, method] of [["/api/project-demo", "GET"], ["/api/project-demo/report", "GET"], ["/api/playground/query", "POST"], ["/api/playground/logs/log-0/note", "PATCH"]]) {
      assert.equal((await request(path, null, null, method)).status, 401);
    }
    assert.equal((await request("/api/playground/query", "bad-token", { sql: "SELECT 1" })).status, 401);
    const catalog = await (await request("/api/project-demo", "alice", null, "GET")).json();
    const step = catalog.steps[0];
    const result = await request("/api/playground/query", "alice", { sql: step.sql, demoStepId: step.id });
    assert.equal(result.status, 200);
    const data = await result.json();
    assert.equal((await request(`/api/playground/logs/${data.logId}/note`, "bob", { note: "not mine" }, "PATCH")).status, 404);
    assert.equal((await request(`/api/playground/logs/${data.logId}/note`, "alice", { note: "資料目錄已驗證" }, "PATCH")).status, 200);
    const history = await (await request("/api/logs", "alice", null, "GET")).json();
    assert.equal(history.logs[0].validation.note, "資料目錄已驗證");
    assert.equal(history.logs[0].score, null);
    const bobHistory = await (await request("/api/logs", "bob", null, "GET")).json();
    assert.equal(bobHistory.logs.length, 0);
    const report = await request("/api/project-demo/report", "alice", null, "GET");
    assert.equal(report.status, 200);
    assert.match(report.headers.get("content-disposition"), /\.md/);
    assert.match(await report.text(), /資料目錄已驗證/);
    const failed = await request("/api/playground/query", "alice", { sql: "SELECT FROM" });
    assert.equal(failed.status, 400);
    assert.equal(logs.at(-1).status, "failed");
    assert.equal(logs.at(-1).score, null);
  } finally {
    global.fetch = realFetch;
    if (server) await new Promise((resolve) => server.close(resolve));
  }
});
