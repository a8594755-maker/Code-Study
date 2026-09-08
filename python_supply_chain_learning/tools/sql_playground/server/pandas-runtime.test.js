import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { executePandas } from "../src/pandas-runtime.js";

test("cold pandas imports finish before the learner execution timer starts", async () => {
  const worker = await readFile(new URL("../public/pandas-worker.mjs", import.meta.url), "utf8");
  const initialize = worker.indexOf('await runtime.runPythonAsync("import json, pandas as pd, numpy as np, traceback")');
  const running = worker.indexOf('type: "running"');
  const execute = worker.indexOf("exec(payload['code'], namespace)");
  assert.ok(initialize > 0 && initialize < running && running < execute);
});

test("Python has separate startup and execution deadlines; result/cancel ends exactly once", () => {
  const original = { Worker: globalThis.Worker, setTimeout: globalThis.setTimeout, clearTimeout: globalThis.clearTimeout };
  const timers = [], replies = [], statuses = []; let worker;
  globalThis.Worker = class { constructor() { worker = this; this.terminated = 0; } postMessage(data) { this.payload = data; } terminate() { this.terminated++; } };
  globalThis.setTimeout = (_fn, ms) => { timers.push(ms); return timers.length; };
  globalThis.clearTimeout = () => {};
  try {
    const stop = executePandas({ code: "result = df.head()", datasets: { main: { rows: [], columns: [] } }, onStatus: (s) => statuses.push(s), onResult: (r) => replies.push(r) });
    assert.deepEqual(timers, [120000]);
    worker.onmessage({ data: { type: "loading", message: "initializing pandas" } });
    assert.deepEqual(timers, [120000]);
    worker.onmessage({ data: { type: "running", message: "learner code" } });
    assert.deepEqual(timers, [120000, 20000]);
    worker.onmessage({ data: { type: "result", status: "succeeded", rows: [] } });
    stop();
    assert.equal(replies.length, 1); assert.equal(worker.terminated, 1);
    assert.deepEqual(Object.keys(worker.payload), ["code", "datasets"]);
  } finally { Object.assign(globalThis, original); }
});
