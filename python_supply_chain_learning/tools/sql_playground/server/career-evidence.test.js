import assert from "node:assert/strict";
import test from "node:test";
import { CareerEvidenceError, validateCareerEvidence } from "./career-evidence.js";
import { getQuestion } from "./course-catalog.js";

test("accepts only a complete milestone evidence record", () => {
  const question = getQuestion("ch01-q06");
  const checks = question.careerLab.evidenceChecks.map((item) => item.id);
  const evidence = validateCareerEvidence(question, {
    checks,
    note: "我建立 ch01_high_value_audit.xlsx，共 12 列；已核對 price 型別、排序、PivotTable 與前三筆稽核註記。",
  });
  assert.equal(evidence.completed, true);
  assert.equal(evidence.tool, "Excel");
  assert.deepEqual(evidence.checks, checks);
});

test("rejects unchecked work and short self-reported evidence", () => {
  const question = getQuestion("ch03-q06");
  assert.throws(
    () => validateCareerEvidence(question, { checks: [], note: "完成" }),
    (error) => error instanceof CareerEvidenceError && error.code === "EVIDENCE_CHECKS_INCOMPLETE",
  );
  assert.throws(
    () => validateCareerEvidence(question, {
      checks: question.careerLab.evidenceChecks.map((item) => item.id),
      note: "完成了",
    }),
    (error) => error instanceof CareerEvidenceError && error.code === "EVIDENCE_NOTE_TOO_SHORT",
  );
});

test("rejects evidence submissions for non-milestone questions", () => {
  assert.throws(
    () => validateCareerEvidence(getQuestion("ch01-q01"), { checks: [], note: "x".repeat(50) }),
    (error) => error instanceof CareerEvidenceError && error.code === "EVIDENCE_NOT_REQUIRED",
  );
});
