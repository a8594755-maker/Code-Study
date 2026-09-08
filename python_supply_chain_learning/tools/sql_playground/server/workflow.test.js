import test from "node:test";
import assert from "node:assert/strict";
import { workflowCatalog as catalog } from "./workflow-catalog.js";
import { buildWorkflowFiles, buildMissionNotebook, missionFixtures, pythonSetup } from "./workflow-notebooks.js";
import { inspectPlaygroundSql } from "./playground.js";
import { workflowSummary } from "./workflow-api.js";

test("15 missions map three work modes to five chapters with exactly 50+50 planned hours", () => {
  assert.equal(catalog.missions.length, 15);
  assert.equal(new Set(catalog.missions.map((m) => m.id)).size, 15);
  assert.equal(catalog.missions.reduce((sum, m) => sum + m.coreMinutes, 0), 3000);
  assert.equal(catalog.missions.reduce((sum, m) => sum + m.extensionMinutes, 0), 3000);
  for (const stage of catalog.stages) {
    const missions = catalog.missions.filter((m) => m.chapterId === stage.id);
    assert.deepEqual(missions.map((m) => m.mode).sort(), ["assigned", "explore", "incident"]);
    assert.equal(missions.reduce((sum, m) => sum + m.coreMinutes, 0), stage.coreMinutes);
    assert.equal(missions.reduce((sum, m) => sum + m.extensionMinutes, 0), stage.extensionMinutes);
    for (const m of missions) {
      assert.equal(m.studyPlan.core.reduce((s, p) => s + p.minutes, 0), m.coreMinutes);
      assert.equal(m.studyPlan.extension.reduce((s, p) => s + p.minutes, 0), m.extensionMinutes);
      for (const key of ["brief", "python", "practice", "independent", "handoff", "deliverable"]) assert.ok(m[key].length > 15, `${m.id}.${key}`);
      for (const q of m.queries) { inspectPlaygroundSql(q.sql); assert.ok(q.scope, `${m.id} scope`); }
    }
  }
});
test("package paths are unique, fixture origins explicit and practice notebooks never prefilled", () => {
  const files = buildWorkflowFiles();
  assert.equal(new Set(files.map((f) => f.name)).size, files.length);
  assert.equal(files.filter((f) => f.name.endsWith(".ipynb")).length, 45);
  for (const mission of catalog.missions) {
    const fixtures = missionFixtures(mission);
    for (const q of mission.queries) assert.equal(fixtures[q.name].origin, "fixture");
    for (const mode of ["reference", "practice", "independent"]) {
      const notebook = buildMissionNotebook(mission, { mode });
      for (const c of notebook.cells.filter((c) => c.cell_type === "code")) { assert.equal(c.execution_count, null); assert.deepEqual(c.outputs, []); }
      assert.equal(notebook.cells.some((c) => c.source.join("").includes(mission.python)), mode === "reference");
    }
  }
  assert.equal(buildWorkflowFiles("unknown").length, 2);
  assert.match(pythonSetup(missionFixtures(catalog.missions[0])), /json.loads/);
});
test("workflow summaries count submissions, not scores, mastery or hours actually learned", () => {
  const summary = workflowSummary([{ status: "succeeded", score: null, validation: { mode: "workflow_delivery", missionId: "day1-map", studyMode: "reference" } }, { status: "failed", validation: { mode: "workflow_pandas", missionId: "day1-map" } }]);
  assert.equal(summary.submitted, 1); assert.equal(summary.pandasRuns, 1);
  assert.equal(summary.missions["day1-map"].extensionSubmitted, false);
  assert.equal(summary.mastery, undefined);
});
