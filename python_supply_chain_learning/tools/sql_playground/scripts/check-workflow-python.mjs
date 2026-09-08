import { spawnSync } from "node:child_process";
import { workflowCatalog } from "../server/workflow-catalog.js";
import { missionFixtures, pythonSetup, buildMissionNotebook } from "../server/workflow-notebooks.js";
const cases = workflowCatalog.missions.map((mission) => ({ id: mission.id, setup: pythonSetup(missionFixtures(mission)), code: mission.python,
  notebook: buildMissionNotebook(mission) }));
const result = spawnSync("python3", ["-c", `
import sys, json, ast
cases = json.load(sys.stdin)
for case in cases:
    for cell in case['notebook']['cells']:
        if cell['cell_type'] == 'code': ast.parse(''.join(cell['source']))
    namespace = {}
    exec(case['setup'], namespace)
    exec(case['code'], namespace)
    result = namespace['result']
    assert hasattr(result, 'to_json'), case['id']
    json.loads(result.to_json(orient='records', date_format='iso'))
    print('PASS', case['id'], result.shape)
`], { input: JSON.stringify(cases), encoding: "utf8" });
process.stdout.write(result.stdout || ""); process.stderr.write(result.stderr || ""); process.exitCode = result.status || (result.error ? 1 : 0);
