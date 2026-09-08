import assert from "node:assert/strict";
import test from "node:test";
import { classifyQuestionMastery, preservePassedProgressStatus } from "./mastery.js";

test("classifies untouched and active questions", () => {
  assert.equal(classifyQuestionMastery(null), "not_started");
  assert.equal(
    classifyQuestionMastery({ attempts: 1, status: "in_progress", highest_hint_level: 0 }),
    "practicing",
  );
});

test("only low-hint completion counts as independent", () => {
  assert.equal(
    classifyQuestionMastery({ attempts: 1, status: "completed", highest_hint_level: 1 }),
    "independent",
  );
  assert.equal(
    classifyQuestionMastery({ attempts: 2, status: "completed", highest_hint_level: 2 }),
    "guided",
  );
  assert.equal(
    classifyQuestionMastery({ attempts: 2, status: "completed", highest_hint_level: 5 }),
    "guided",
  );
});

test("viewing a solution after independent completion does not erase mastery evidence", () => {
  assert.equal(
    classifyQuestionMastery({
      attempts: 2,
      status: "completed",
      highest_hint_level: 5,
      last_validation: { completion_hint_level: 0 },
    }),
    "independent",
  );
});

test("a later failed practice run does not erase an earlier passing result", () => {
  assert.equal(
    preservePassedProgressStatus("in_progress", 100, "in_progress"),
    "query_passed",
  );
  assert.equal(
    preservePassedProgressStatus("query_passed", 100, "in_progress"),
    "query_passed",
  );
  assert.equal(
    preservePassedProgressStatus("completed", 100, "in_progress"),
    "completed",
  );
});
