import assert from "node:assert/strict";
import test from "node:test";
import { buildDashboard } from "./dashboard.js";

test("dashboard exposes the fifty-hour roadmap and milestone evidence progress", () => {
  const progress = [{
    question_id: "ch01-q01",
    status: "completed",
    last_validation: {},
  }, {
    question_id: "ch01-q06",
    status: "completed",
    last_validation: { career_evidence: { completed: true } },
  }];
  const dashboard = buildDashboard(progress, []);
  assert.equal(dashboard.readiness.totalMinutes, 3000);
  assert.equal(dashboard.readiness.totalHours, 50);
  assert.equal(dashboard.readiness.completedMinutes, 165);
  assert.equal(dashboard.readiness.completedCareerEvidence, 1);
  assert.equal(dashboard.readiness.totalCareerEvidence, 7);
  assert.equal(dashboard.chapterProgress[0].learningMinutes, 480);
  assert.equal(dashboard.chapterProgress[0].completedMinutes, 165);
  assert.ok(dashboard.careerFramework.sources.length >= 5);
});
