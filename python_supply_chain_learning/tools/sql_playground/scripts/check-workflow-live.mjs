// Explicit integration QA only: creates one email-confirmed .invalid test user,
// runs read-only Olist queries, and deletes exactly that QA user in finally.
// Credentials remain in memory; no mail, schema change or student progress write.
import { execFileSync, spawnSync } from "node:child_process";
import { randomUUID, randomBytes } from "node:crypto";
import dotenv from "dotenv";
import { workflowCatalog } from "../server/workflow-catalog.js";
import { missionFixtures, pythonSetup } from "../server/workflow-notebooks.js";
import { inspectPlaygroundSql } from "../server/playground.js";
dotenv.config({ quiet: true });
const origin = process.argv[2];
if (!origin || !/^https?:\/\/(127\.0\.0\.1:\d+|[a-z0-9-]+--supply-sql-lab-a8594755\.netlify\.app)\/?$/.test(origin)) throw new Error("Provide a local or this site's Preview URL, never production.");
const url = process.env.SUPABASE_URL, anon = process.env.SUPABASE_ANON_KEY;
if (new URL(url).hostname !== "ylmuvsdegmpoiygbtipi.supabase.co") throw new Error("Unexpected QA target");
const keys = JSON.parse(execFileSync("/opt/homebrew/bin/supabase", ["projects", "api-keys", "--project-ref", "ylmuvsdegmpoiygbtipi", "--output", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
const admin = keys.find((k) => k.name === "service_role")?.api_key;
if (!admin) throw new Error("Authorized CLI admin key unavailable");
async function req(endpoint, { key = anon, token = key, body, method = "GET" } = {}) {
  const res = await fetch(endpoint, { method, headers: { apikey: key, Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(25000) });
  if (!res.ok) { const text = await res.text(); throw new Error(`QA HTTP ${res.status}: ${text.slice(0, 900)}`); }
  return res;
}
let userId;
try {
  const email = `workflow-qa-${randomUUID()}@example.invalid`, password = randomBytes(24).toString("base64url");
  const user = await (await req(`${url}/auth/v1/admin/users`, { key: admin, method: "POST", body: { email, password, email_confirm: true, user_metadata: { purpose: "temporary_workflow_qa" } } })).json();
  userId = user.id; if (!/^[a-f\d-]{36}$/i.test(userId)) throw new Error("Invalid QA account id");
  const session = await (await req(`${url}/auth/v1/token?grant_type=password`, { method: "POST", body: { email, password } })).json();
  const token = session.access_token;
  console.log("PASS QA authentication (temporary account, no email sent)");
  const catalogResponse = await req(`${origin}/api/workflow`, { token });
  const catalog = await catalogResponse.json();
  if (catalog.missions?.length !== 15) throw new Error("Catalog unavailable");
  const cases = [];
  for (const mission of process.argv.includes("--account-only") ? [] : workflowCatalog.missions) {
    const datasets = missionFixtures(mission);
    for (const query of mission.queries) {
      const response = await req(`${url}/rest/v1/rpc/sql_playground_execute`, { token, method: "POST", body: { query_text: inspectPlaygroundSql(query.sql).sql } });
      const result = await response.json();
      if (!Array.isArray(result.rows) || result.truncated) throw new Error(`${mission.id}/${query.name}: invalid or truncated reference result`);
      datasets[query.name] = { rows: result.rows, columns: Object.keys(result.rows[0] || {}), origin: "supabase", scope: query.scope, truncated: false };
      console.log(`PASS SQL ${mission.id}/${query.name}: ${result.rows.length} rows`);
    }
    cases.push({ id: mission.id, setup: pythonSetup(datasets), code: mission.python });
  }
  const python = spawnSync("python3", ["-c", `import sys,json,contextlib,io\nfor case in json.load(sys.stdin):\n ns={}\n with contextlib.redirect_stdout(io.StringIO()):\n  exec(case['setup'],ns)\n  exec(case['code'],ns)\n json.loads(ns['result'].to_json(orient='records',date_format='iso'))\n print('PASS real-data pandas',case['id'],ns['result'].shape)\n`], { input: JSON.stringify(cases), encoding: "utf8" });
  process.stdout.write(python.stdout || ""); if (python.status) throw new Error(python.stderr);
  const mission = workflowCatalog.missions[0];
  const result = await (await req(`${origin}/api/workflow/${mission.id}/sql`, { token, method: "POST", body: { sql: mission.queries[0].sql, datasetName: "main", studyMode: "reference" } })).json();
  if (!result.logSaved) throw new Error("SQL log write failed");
  const run = await (await req(`${origin}/api/workflow/${mission.id}/pandas/start`, { token, method: "POST", body: { code: "result = df.head(1)", studyMode: "reference", sources: [{ name: "main", origin: "supabase", logId: result.logId, digest: result.resultDigest }] } })).json();
  await req(`${origin}/api/workflow/pandas/${run.logId}`, { token, method: "PATCH", body: { status: "succeeded", rows: result.rows.slice(0, 1), rowCount: 1, columns: Object.keys(result.rows[0]), stdout: "QA contract test: client-reported result", durationMs: 1 } });
  await req(`${origin}/api/workflow/${mission.id}/delivery`, { token, method: "POST", body: { pandasLogId: run.logId, studyMode: "reference", validated: true, note: "QA only: tests delivery contract, not student mastery." } });
  const failed = await (await req(`${origin}/api/workflow/${mission.id}/pandas/start`, { token, method: "POST", body: { code: "result = df['missing_qa_column']", studyMode: "practice", sources: [{ name: "main", origin: "fixture" }] } })).json();
  await req(`${origin}/api/workflow/pandas/${failed.logId}`, { token, method: "PATCH", body: { status: "failed", error: "KeyError: missing_qa_column (QA contract fixture)", rows: [] } });
  const history = await (await req(`${origin}/api/logs`, { token })).json();
  if (history.logs.length !== 4 || history.logs.some((l) => l.score !== null)) throw new Error(`Account logs missing or unexpectedly graded: ${history.logs.length} records`);
  const progress = await (await req(`${origin}/api/workflow`, { token })).json();
  if (progress.summary.submitted !== 1) throw new Error("Delivery summary missing");
  const exported = await (await req(`${origin}/api/export?scope=all&format=json`, { token })).json();
  if (exported.attempts.length !== 4) throw new Error("Export missing attempts");
  const zip = Buffer.from(await (await req(`${origin}/api/workflow/package`, { token })).arrayBuffer());
  if (zip.readUInt16LE(0) !== 0x4b50) throw new Error("Invalid package");
  const zipCheck = spawnSync("python3", ["-c", "import sys,io,zipfile; z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())); assert z.testzip() is None; assert len(z.namelist()) == 97; print('PASS ZIP all 97 entries decompress correctly')"], { input: zip });
  process.stdout.write(zipCheck.stdout || "");
  if (zipCheck.status) throw new Error(String(zipCheck.stderr));
  console.log(`PASS real account SQL → pandas log → delivery → summary → export; package ${zip.length} bytes`);
} finally {
  if (userId) {
    await req(`${url}/auth/v1/admin/users/${userId}`, { key: admin, method: "DELETE" });
    console.log("CLEANUP: deleted exactly the temporary QA account and its cascading test records; student accounts untouched.");
  }
}
