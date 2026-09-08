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

test("the five chapters form a complete analyst onboarding journey", () => {
  for (const chapter of getChapters()) {
    assert.ok(chapter.timeline, chapter.id);
    assert.ok(chapter.mission, chapter.id);
    assert.ok(chapter.deliverable, chapter.id);
    assert.ok(chapter.toolFlow, chapter.id);
    assert.ok(chapter.learningMinutes, chapter.id);
    assert.ok(chapter.outcomes.length >= 4, chapter.id);
    assert.ok(chapter.tools.length >= 3, chapter.id);
    assert.ok(chapter.jobCapability, chapter.id);
  }
});

test("the curriculum is exactly fifty planned hours with a complete unit plan", () => {
  const chapters = getChapters();
  assert.deepEqual(chapters.map((chapter) => chapter.learningMinutes), [480, 600, 660, 600, 660]);
  assert.equal(getQuestions().reduce((sum, item) => sum + item.estimatedMinutes, 0), 3000);
  for (const item of getQuestions()) {
    assert.ok(item.estimatedMinutes >= 60, item.id);
    assert.equal(
      item.practicePlan.reduce((sum, step) => sum + step.minutes, 0),
      item.estimatedMinutes,
      item.id,
    );
  }
});

test("question 1.2 teaches row versus entity grain instead of repeating question 1.1", () => {
  const [first, second] = getChapters()[0].questions;
  assert.notEqual(first.title, second.title);
  assert.match(second.referenceSql, /COUNT\(DISTINCT order_id\)/i);
  assert.match(second.referenceSql, /duplicate_review_rows/i);
  assert.match(second.workContext.businessPurpose, /粒度/);
  assert.equal(second.expected, "1 列、3 欄；reviewed_order_count <= review_row_count，差額欄位計算正確。");
});

test("seven milestone questions require cross-tool career evidence", () => {
  const labs = getQuestions().filter((item) => item.careerLab?.requiredEvidence);
  assert.equal(labs.length, 7);
  assert.deepEqual([...new Set(labs.map((item) => item.careerLab.tool))], [
    "Excel",
    "Power Query",
    "Power BI + DAX",
    "Pandas",
    "Portfolio Case",
  ]);
  for (const item of labs) {
    assert.ok(item.careerLab.steps.length >= 4, item.id);
    assert.ok(item.careerLab.evidenceChecks.length >= 3, item.id);
    assert.ok(item.careerLab.evidencePrompt.length >= 20, item.id);
  }
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
    assert.ok(item.workContext?.businessPurpose, item.id);
    assert.ok(item.workContext?.whySql, item.id);
    assert.ok(item.workContext?.delivery?.destination, item.id);
    assert.ok(item.workContext?.toolBoundary?.length >= 4, item.id);
  }
});

test("Chapter 1 is a six-task first-week simulation with specific validation and handoff", () => {
  const questions = getChapters()[0].questions;
  assert.match(questions[0].workContext.workday, /DAY 1/);
  assert.match(questions.at(-1).workContext.workday, /DAY 5/);

  for (const item of questions) {
    assert.ok(item.workContext.team, item.id);
    assert.ok(item.workContext.validationPlan.length >= 3, item.id);
    assert.ok(item.workContext.delivery.label, item.id);
    assert.ok(item.workContext.delivery.reason, item.id);
    assert.deepEqual(
      item.workContext.toolBoundary.map(({ tool }) => tool),
      ["SQL", "Pandas", "Power BI", "Database View"],
      item.id,
    );
    assert.ok(publicQuestion(item).workContext?.whySql, item.id);
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
