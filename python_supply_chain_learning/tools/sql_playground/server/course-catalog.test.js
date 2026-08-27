import assert from "node:assert/strict";
import test from "node:test";
import { getChapters, getQuestions, publicQuestion } from "./course-catalog.js";
import { validateReadOnlySql } from "./query-policy.js";

test("contains five sequential chapters and thirty graded questions", () => {
  const chapters = getChapters();
  assert.equal(chapters.length, 5);
  assert.deepEqual(chapters.map((chapter) => chapter.order), [1, 2, 3, 4, 5]);
  assert.equal(getQuestions().length, 30);
  assert.ok(chapters.every((chapter) => chapter.questions.length === 6));
});

test("never exposes reference SQL in the public question payload", () => {
  const item = getQuestions()[0];
  assert.ok(item.referenceSql);
  assert.ok(item.solution);
  assert.equal("referenceSql" in publicQuestion(item), false);
  assert.equal("solution" in publicQuestion(item), false);
});

test("every question has an analyst workflow, hints, and a hidden reference query", () => {
  for (const item of getQuestions()) {
    assert.ok(item.analystSteps.length >= 5, item.id);
    assert.ok(item.hints.length >= 3, item.id);
    assert.match(item.referenceSql, /^(SELECT|WITH)/, item.id);
  }
});

test("Chapter 1 has detailed teaching, four hints, and a gated solution", () => {
  const chapter = getChapters()[0];
  for (const item of chapter.questions) {
    assert.equal(item.hints.length, 4, item.id);
    assert.ok(item.lesson?.plainLanguage, item.id);
    assert.ok(item.lesson?.workedExample?.sql, item.id);
    assert.ok(item.lesson?.workedExample?.lineByLine.length >= 3, item.id);
    assert.ok(item.lesson?.commonMistakes.length >= 3, item.id);
    assert.ok(item.solution?.lineByLine.length >= 3, item.id);
    assert.ok(item.solution?.verify.length >= 3, item.id);
    assert.equal(publicQuestion(item).lesson?.concept, item.lesson.concept);
  }
});

test("Chapters 2 through 5 keep their current three-hint assessment mode", () => {
  for (const chapter of getChapters().slice(1)) {
    for (const item of chapter.questions) {
      assert.equal(item.hints.length, 3, item.id);
      assert.equal(item.lesson, null, item.id);
      assert.equal(item.solution, null, item.id);
    }
  }
});

test("all thirty hidden reference queries pass the same SQL safety parser as learners", () => {
  for (const item of getQuestions()) {
    assert.doesNotThrow(
      () => validateReadOnlySql(item.referenceSql),
      `reference query rejected for ${item.id}`,
    );
  }
});
