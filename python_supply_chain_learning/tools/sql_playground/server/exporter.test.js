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

test("JSON export includes dashboard, progress, events, and attempts", () => {
  const response = responseDouble();
  sendLearningExport(response, { ...fixture, format: "json" });
  const data = JSON.parse(response.body);

  assert.equal(data.dashboard.readiness.score, 3);
  assert.equal(data.progress.length, 1);
  assert.equal(data.events[0].event_type, "question_opened");
  assert.equal(data.attempts[0].question_id, "ch01-q01");
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
  assert.match(directoryText, /learning_report\.json/);
  assert.match(directoryText, /queries\/ch01_ch01-q01_attempt-1_/);
});
