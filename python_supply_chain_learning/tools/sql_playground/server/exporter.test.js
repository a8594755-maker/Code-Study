import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import test from "node:test";

import { sendLearningExport } from "./exporter.js";

const fixture = {
  scope: "all",
  logs: [
    {
      created_at: "2026-08-27T17:00:00.000Z",
      chapter_id: "ch01",
      unit_id: "unit-01",
      question_id: "ch01-q01",
      question_title: "檢查訂單資料",
      attempt_number: 1,
      status: "succeeded",
      score: 100,
      hint_level: 0,
      sql_text: "select * from olist.orders limit 5",
      row_count: 5,
      duration_ms: 18,
      validation: { passed: true },
      completed_at: "2026-08-27T17:00:00.018Z",
    },
  ],
  progress: [
    {
      chapter_id: "ch01",
      unit_id: "unit-01",
      question_id: "ch01-q01",
      status: "completed",
      attempts: 1,
      best_score: 100,
    },
  ],
  events: [
    {
      created_at: "2026-08-27T16:59:00.000Z",
      chapter_id: "ch01",
      question_id: "ch01-q01",
      event_type: "question_opened",
      payload: { source: "dashboard" },
    },
  ],
  tutorMessages: [
    {
      created_at: "2026-08-27T17:01:00.000Z",
      chapter_id: "ch01",
      question_id: "ch01-q01",
      role: "assistant",
      mode: "draft",
      content: "這份結果確認了訂單資料量。",
      model: "gpt-5.6-luna",
      input_tokens: 120,
      output_tokens: 80,
      metadata: { provider: "openai" },
    },
  ],
  dashboard: { readiness: { score: 3 } },
};

function responseDouble() {
  const headers = new Map();
  return {
    headers,
    body: null,
    setHeader(name, value) {
      headers.set(name, value);
    },
    send(body) {
      this.body = body;
      return body;
    },
  };
}

test("CSV export includes the timestamp, question, SQL, and outcome", () => {
  const response = responseDouble();
  sendLearningExport(response, { ...fixture, format: "csv" });

  assert.equal(response.headers.get("Content-Type"), "text/csv; charset=utf-8");
  assert.match(response.body, /timestamp_utc/);
  assert.match(response.body, /檢查訂單資料/);
  assert.match(response.body, /select \* from olist\.orders limit 5/);
  assert.match(response.body, /succeeded/);
});

test("JSON export includes dashboard, progress, events, tutor messages, and attempts", () => {
  const response = responseDouble();
  sendLearningExport(response, { ...fixture, format: "json" });
  const data = JSON.parse(response.body);

  assert.equal(data.dashboard.readiness.score, 3);
  assert.equal(data.progress.length, 1);
  assert.equal(data.events[0].event_type, "question_opened");
  assert.equal(data.tutorMessages[0].mode, "draft");
  assert.equal(data.attempts[0].question_id, "ch01-q01");
});

test("CSV exposes Playground tags/notes and safely quotes spreadsheet formulas", () => {
  const response = responseDouble();
  sendLearningExport(response, { ...fixture, format: "csv", logs: [{
    sql_text: "=1+1", score: null, validation: { mode: "playground", tags: ["SELECT", "JOIN"], note: "對帳通過" },
  }] });
  assert.match(response.body, /analyst_note/);
  assert.match(response.body, /playground/);
  assert.match(response.body, /SELECT \| JOIN/);
  assert.match(response.body, /對帳通過/);
  assert.match(response.body, /'=1\+1/);
});

test("ZIP export contains reports and a separate SQL file for every attempt", async () => {
  const response = new PassThrough();
  const headers = new Map();
  response.setHeader = (name, value) => headers.set(name, value);
  const chunks = [];
  response.on("data", (chunk) => chunks.push(chunk));
  const finished = new Promise((resolve, reject) => {
    response.on("end", resolve);
    response.on("error", reject);
  });

  sendLearningExport(response, { ...fixture, format: "zip" });
  await finished;

  const archive = Buffer.concat(chunks);
  const directoryText = archive.toString("latin1");
  assert.equal(headers.get("Content-Type"), "application/zip");
  assert.equal(archive.subarray(0, 2).toString("latin1"), "PK");
  assert.match(directoryText, /attempts\.csv/);
  assert.match(directoryText, /progress\.csv/);
  assert.match(directoryText, /learning_events\.csv/);
  assert.match(directoryText, /tutor_conversations\.csv/);
  assert.match(directoryText, /learning_report\.json/);
  assert.match(directoryText, /queries\/ch01_ch01-q01_attempt-1_/);
});

test("workflow export preserves Python output, evidence and .py extension", async () => {
  const log = { ...fixture.logs[0], id: "qa-python", question_id: null, score: null, sql_text: "result = df.head()", result_preview: [{ value: 1 }], validation: { mode: "workflow_pandas", language: "python", missionId: "day1-map", studyMode: "reference", stdout: "example output", executionEvidence: "browser_reported" } };
  const csv = responseDouble(); sendLearningExport(csv, { ...fixture, logs: [log], format: "csv" });
  assert.match(csv.body, /example output/); assert.match(csv.body, /python/); assert.match(csv.body, /browser_reported/);
  const response = new PassThrough(); response.setHeader = () => {}; const chunks = [];
  response.on("data", (chunk) => chunks.push(chunk)); const ended = new Promise((r, reject) => { response.on("end", r); response.on("error", reject); });
  sendLearningExport(response, { ...fixture, logs: [log], format: "zip" }); await ended;
  const zip = Buffer.concat(chunks).toString("latin1"); assert.match(zip, /qa-python\.py/); assert.match(zip, /workflow-evidence\//);
});

test("Power BI self-reported evidence exports as Markdown, never executable SQL or fake pbix", async () => {
  const log = { ...fixture.logs[0], id: "qa-bi", sql_text: "QA report note, pending external review", validation: { mode: "workflow_powerbi", language: "powerbi", fileUploaded: false, reviewStatus: "pending" } };
  const response = new PassThrough(); response.setHeader = () => {}; const chunks = [];
  response.on("data", (chunk) => chunks.push(chunk));
  const ended = new Promise((resolve, reject) => { response.on("end", resolve); response.on("error", reject); });
  sendLearningExport(response, { ...fixture, logs: [log], format: "zip" }); await ended;
  const directory = Buffer.concat(chunks).toString("latin1");
  assert.match(directory, /qa-bi\.md/); assert.doesNotMatch(directory, /qa-bi\.sql|qa-bi\.pbix/);
  assert.match(directory, /workflow-evidence\//);
});
