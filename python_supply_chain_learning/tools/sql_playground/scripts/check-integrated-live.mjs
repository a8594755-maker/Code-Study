// Explicit QA only. Creates/deletes its own marked account; never touches student
// progress or mutates Olist. Uses local Python to cross-check the browser protocol.
import { execFileSync, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import dotenv from "dotenv";
import { integratedActivities, getIntegratedMission } from "../server/integrated-catalog.js";
import { pythonSetup } from "../server/workflow-notebooks.js";
dotenv.config({ quiet: true });
const origin = process.argv[2];
const aiLanguage = process.argv.find((arg) => arg.startsWith("--ai-language="))?.split("=")[1];
if (aiLanguage && !["sql", "python", "powerbi"].includes(aiLanguage)) throw new Error("Unknown AI QA language");
const runAi = process.argv.includes("--ai") || Boolean(aiLanguage);
const activities = process.argv.includes("--smoke") ? integratedActivities.filter((a) => ["studio-u1-s1", "studio-u1-p", "studio-u2-bi"].includes(a.id)) : integratedActivities;
if (!/^https?:\/\/(127\.0\.0\.1:\d+|[a-z0-9-]+--supply-sql-lab-a8594755\.netlify\.app)\/?$/.test(origin || "")) throw new Error("Only local or this site's Preview allowed");
const qa = JSON.parse(execFileSync("node", ["scripts/workflow-qa-account.mjs", "create"], { encoding: "utf8" }));
try {
  const auth = await fetch(`${process.env.SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST", headers: { apikey: process.env.SUPABASE_ANON_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email: qa.email, password: qa.password }), signal: AbortSignal.timeout(20000),
  });
  assert.equal(auth.status, 200, "QA login");
  const token = (await auth.json()).access_token;
  async function api(path, body, method = body ? "POST" : "GET", expectedStatus) {
    const response = await fetch(`${origin}${path}`, { method, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(60000) });
    const result = await response.json();
    if (expectedStatus) assert.equal(response.status, expectedStatus);
    else assert.ok(response.ok, `${path}: ${response.status} ${result.error || ""}`);
    return result;
  }
  assert.equal((await api("/api/integrated")).activities.length, integratedActivities.length);
  console.log("PASS Preview/local configuration and temporary account authentication");
  const sources = new Map();
  for (const activity of activities) {
    const result = await api(`/api/workflow/${activity.id}/sql`, { sql: activity.sourceSql || activity.reference, datasetName: "main", studyMode: activity.mode });
    assert.ok(result.logSaved, activity.id); assert.equal(result.truncated, false);
    if (activity.tool === "sql") assert.equal(result.assessment?.state, "matched", `${activity.id}: ${JSON.stringify(result.assessment)}`);
    else sources.set(activity.id, result);
    console.log(`PASS real SQL ${activity.id}: ${result.row_count} rows`);
  }
  for (const activity of activities.filter((a) => a.tool === "python")) {
    const source = sources.get(activity.id);
    const datasets = { main: { rows: source.rows, columns: Object.keys(source.rows[0]), origin: "supabase" } };
    const run = spawnSync("python3", ["-c", "import sys,json,contextlib,io\np=json.load(sys.stdin);ns={}\nwith contextlib.redirect_stdout(io.StringIO()):\n exec(p['setup'],ns);exec(p['code'],ns)\nr=ns['result'];print(json.dumps({'status':'succeeded','rows':json.loads(r.to_json(orient='records',date_format='iso')),'columns':list(r.columns),'rowCount':len(r),'stdout':'QA: local Python execution, posted through browser-result protocol'}))"], { input: JSON.stringify({ setup: pythonSetup(datasets), code: activity.reference }), encoding: "utf8" });
    assert.equal(run.status, 0, `${activity.id}: ${run.stderr}`);
    const started = await api(`/api/workflow/${activity.id}/pandas/start`, { code: activity.reference, studyMode: activity.mode, sources: [{ name: "main", origin: "supabase", logId: source.logId, digest: source.resultDigest }] });
    const saved = await api(`/api/workflow/pandas/${started.logId}`, JSON.parse(run.stdout), "PATCH");
    assert.equal(saved.assessment.state, "matched", `${activity.id}: ${JSON.stringify(saved.assessment)}`);
    assert.equal(saved.assessment.sourceOrigin, "supabase");
    console.log(`PASS real-data local pandas + persisted comparison ${activity.id}`);
  }
  for (const activity of activities.filter((a) => a.tool === "powerbi")) {
    const source = sources.get(activity.id), extra = activity.biKind === "refresh" ? 1 : 0;
    const saved = await api(`/api/integrated/${activity.id}/powerbi`, { sourceLogId: source.logId, environment: "desktop_windows", artifactName: "QA-contract-only.pbix", explanation: "QA contract test only; no actual Power BI operation or artifact submitted.", totalRows: source.rows.length + extra, spRows: source.rows.filter((r) => r.seller_state === "SP").length + extra });
    assert.equal(saved.assessment.state, "numbers_matched_pending_review");
    console.log(`PASS Power BI contract only (NOT real Desktop QA), review stays pending: ${activity.id}`);
  }
  const activity = integratedActivities[0];
  const wrong = await api(`/api/workflow/${activity.id}/sql`, { sql: "SELECT COUNT(*) AS wrong_count FROM olist.sellers_raw;", datasetName: "main", studyMode: activity.mode });
  assert.equal(wrong.assessment.state, "needs_revision");
  const error = await api(`/api/workflow/${activity.id}/sql`, { sql: "SELECT missing_qa_column FROM olist.sellers_raw;", datasetName: "main", studyMode: activity.mode }, "POST", 400);
  assert.ok(error.logId);
  await api(`/api/integrated/${activity.id}/support`, { kind: "reference" });
  await api(`/api/workflow/package?missionId=${activity.id}`, undefined, "GET", 400);
  let expectedTutorMessages = 0;
  if (runAi) {
    const scopes = [
      { surface: "workflow", id: activity.id, language: "sql", datasetName: "main", studyMode: activity.mode },
      { surface: "workflow", id: "studio-u1-p", language: "python", studyMode: "practice" },
      { surface: "workflow", id: "studio-u2-bi", language: "powerbi", studyMode: "practice" },
    ];
    for (const scope of scopes.filter((item) => !aiLanguage || item.language === aiLanguage)) {
      const language = scope.language;
      const turn = { scope, requestId: randomUUID(), mode: language === "sql" ? "debug" : "example", draft: language === "sql" ? "SELECT missing_qa_column FROM olist.sellers_raw;" : "",
        ...(language === "sql" ? { logId: error.logId } : { sourceLogIds: [sources.get(scope.id).logId] }),
        message: language === "powerbi" ? "我只有 Mac，還沒實際做 Power BI。請說明我的資料來源、應如何安排環境，再給完整 DAX。不要說我已完成。" : "我是初學者，請依本題解釋原因，给完整可執行答案與一個驗證方法。" };
      const reply = await api("/api/editor-tutor", turn);
      assert.equal(reply.message.failed, false, reply.message.content);
      assert.match(reply.message.content, /```/);
      assert.ok(reply.memory?.length);
      expectedTutorMessages += 2;
      const replay = await api("/api/editor-tutor", turn);
      assert.equal(replay.replayed, true);
      console.log(`PASS real AI ${language}: code, explanation, stored memory, idempotent replay`);
      if (language === "sql") {
        const follow = await api("/api/editor-tutor", { ...turn, requestId: randomUUID(), message: "請延續剛才的問題，只說我應先改哪個地方、為什麼。" });
        assert.equal(follow.message.failed, false); assert.ok(follow.message.context.recentMessages >= 2);
        expectedTutorMessages += 2;
        console.log("PASS real AI follow-up preserves activity conversation");
      }
    }
  }
  const catalog = await api("/api/integrated");
  const executableCount = activities.filter((a) => a.tool !== "powerbi").length;
  const biCount = activities.filter((a) => a.tool === "powerbi").length;
  assert.equal(catalog.summary.matched, executableCount); assert.equal(catalog.summary.pendingBi, biCount);
  assert.equal(catalog.summary.activities[activity.id].helped, true);
  const dashboard = await api("/api/dashboard");
  assert.equal(dashboard.integrated.matched, executableCount); assert.equal(dashboard.workflow.sqlRuns, 0); assert.equal(dashboard.readiness.completedQuestions, 0);
  const exported = await api("/api/export?scope=all&format=json");
  assert.ok(exported.attempts.every((l) => l.user_id === qa.id && l.score === null));
  assert.equal(exported.attempts.filter((l) => l.validation.mode === "workflow_powerbi").length, biCount);
  assert.ok(exported.attempts.some((l) => l.status === "failed"));
  if (runAi) assert.ok(exported.tutorMessages.length >= expectedTutorMessages);
  console.log(`PASS account summary + Dashboard + export (${exported.attempts.length} events); no legacy lesson progress or numeric grading`);
  const zip = await fetch(`${origin}/api/export?scope=all&format=zip`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(45000) });
  assert.ok(zip.ok);
  const check = spawnSync("python3", ["-c", "import sys,zipfile,io\nz=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read()));assert z.testzip() is None\nevidence=[n for n in z.namelist() if n.startswith('queries/') and n.endswith('.md')];assert len(evidence)>=2\nassert not any(n.endswith('.pbix') for n in z.namelist())\nprint('PASS deployed ZIP decompresses; external BI notes are Markdown, not executable SQL or fabricated pbix')"], { input: Buffer.from(await zip.arrayBuffer()), encoding: "utf8" });
  assert.equal(check.status, 0, check.stderr); console.log(check.stdout.trim());
} finally {
  execFileSync("node", ["scripts/workflow-qa-account.mjs", "delete", qa.id], { stdio: ["ignore", "pipe", "pipe"] });
  console.log("CLEANUP exact temporary QA account and its test records; student data untouched");
}
