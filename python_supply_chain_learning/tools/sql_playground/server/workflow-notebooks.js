import { workflowCatalog, getWorkflowMission } from "./workflow-catalog.js";

const stateRows = [
  { customer_state: "SP", delivered_orders: 100, measurable_orders: 90, missing_dates: 10, late_orders: 9, late_rate_pct: 10, known_item_value: 12000, orders_without_item_value: 0 },
  { customer_state: "RJ", delivered_orders: 20, measurable_orders: 20, missing_dates: 0, late_orders: 5, late_rate_pct: 25, known_item_value: 1800, orders_without_item_value: 1 },
  { customer_state: null, delivered_orders: 5, measurable_orders: 0, missing_dates: 5, late_orders: 0, late_rate_pct: null, known_item_value: 300, orders_without_item_value: 0 },
];
const orderRows = [
  { order_id: "DEMO-O1", customer_id: "DEMO-C1", order_status: "delivered", order_purchase_timestamp: "2018-01-02", order_delivered_customer_date: "2018-01-09", order_estimated_delivery_date: "2018-01-08" },
  { order_id: "DEMO-O2", customer_id: "DEMO-C2", order_status: "canceled", order_purchase_timestamp: "2018-02-02", order_delivered_customer_date: null, order_estimated_delivery_date: "2018-02-08" },
];
const monthRows = [{ month: "2018-01-01", orders: 100, delivered_orders: 90 }, { month: "2018-02-01", orders: 120, delivered_orders: 110 }, { month: "2018-04-01", orders: 80, delivered_orders: 75 }];
const baseline = [{ base_orders: 125, dataset_rows: 125, unique_orders: 125, measurable_orders: 110, missing_dates: 15, late_orders: 14, known_item_value: 14100 }];
const fixtureRows = {
  "day1-map": { main: [{ table_name: "orders_raw", column_name: "order_id", data_type: "text", ordinal_position: 1 }, { table_name: "orders_raw", column_name: "customer_id", data_type: "text", ordinal_position: 2 }, { table_name: "order_items_raw", column_name: "order_id", data_type: "text", ordinal_position: 1 }] },
  "day1-list": { main: [{ seller_id: "DEMO-S1", seller_city: "sao paulo", seller_state: "SP", seller_zip_code_prefix: 540 }, { seller_id: "DEMO-S2", seller_city: "campinas", seller_state: "SP", seller_zip_code_prefix: 13000 }] },
  "day1-grain": { main: [{ review_rows: 7, nonnull_order_ids: 6, distinct_orders: 4 }] },
  "week1-keys": { main: orderRows, customers: [{ customer_id: "DEMO-C1", customer_unique_id: "DEMO-P1", customer_state: "SP" }, { customer_id: "DEMO-C2", customer_unique_id: "DEMO-P1", customer_state: "RJ" }] },
  "week1-payments": { main: [{ order_id: "DEMO-O1", item_and_freight: 110 }, { order_id: "DEMO-O2", item_and_freight: 80 }], payments: [{ order_id: "DEMO-O1", paid_value: 110 }, { order_id: "DEMO-O3", paid_value: 25 }] },
  "week1-double": { main: [{ order_id: "DEMO-O1", order_item_id: 1, price: 30 }, { order_id: "DEMO-O1", order_item_id: 2, price: 40 }, { order_id: "DEMO-O2", order_item_id: null, price: null }] },
  "month-trends": { main: monthRows },
  "month-ranking": { main: [{ category: "books", item_rows: 20, item_value: 1200, sql_rank: 1 }, { category: "home", item_rows: 10, item_value: 1200, sql_rank: 1 }, { category: null, item_rows: 3, item_value: 200, sql_rank: 2 }] },
  "month-rate": { main: stateRows, baseline },
  "junior-hypothesis": { main: [{ delivery_group: "late", orders: 20, reviewed_orders: 15, low_score_orders: 6 }, { delivery_group: "on_time", orders: 80, reviewed_orders: 70, low_score_orders: 7 }, { delivery_group: "unknown", orders: 5, reviewed_orders: 3, low_score_orders: 1 }] },
  "junior-targets": { main: stateRows },
  "junior-types": { main: orderRows },
  "independent-payments": { main: [{ order_id: "DEMO-O1", payment_sequential: 1, payment_type: "credit_card", payment_installments: 3, payment_value: 100 }, { order_id: "DEMO-O1", payment_sequential: 2, payment_type: "voucher", payment_installments: 1, payment_value: 10 }, { order_id: "DEMO-O2", payment_sequential: 1, payment_type: "boleto", payment_installments: 1, payment_value: 80 }] },
  "independent-brief": { main: stateRows, baseline },
  "independent-refresh": { main: [{ order_rows: 300, earliest_purchase: "2018-01-01", latest_purchase: "2018-04-30" }], monthly: monthRows },
};

export function missionFixtures(mission) {
  return Object.fromEntries(Object.entries({ ...fixtureRows[mission.id], ...mission.fixtureRows, ...Object.fromEntries(Object.entries(mission.auxiliary || {}).map(([key, value]) => [key, value.rows])) })
    .map(([name, rows]) => [name, { rows: structuredClone(rows), columns: Object.keys(rows[0] || {}), origin: "fixture", scope: mission.auxiliary?.[name]?.origin || "教材虛構小樣本；不是 Olist 真實數字，不可當公司結論。", truncated: false }]));
}

export function pythonSetup(datasets) {
  // JSON-encode twice to form a quoted Python string, never executable input.
  return `import json\nimport pandas as pd\nimport numpy as np\n\ndatasets = json.loads(${JSON.stringify(JSON.stringify(datasets))})\ntables = {name: pd.DataFrame(value["rows"], columns=value["columns"]) for name, value in datasets.items()}\ndf = tables["main"].copy()\nfor name, value in datasets.items():\n    print(name, value["origin"], value.get("scope", ""), "rows=", len(value["rows"]))\n`;
}

const cell = (type, source) => ({ cell_type: type, metadata: {}, source: source.split(/(?<=\n)/), ...(type === "code" ? { execution_count: null, outputs: [] } : {}) });
export function buildMissionNotebook(mission, { mode = "reference", datasets = missionFixtures(mission), code = mission.python } = {}) {
  const cells = [
    cell("markdown", `# ${mission.title}\n\n${mission.brief}\n\n${mission.pythonIntro}\n\n本檔是${mode === "current" ? "目前草稿與資料快照" : mode === "reference" ? "示範" : mode === "practice" ? "陪跑練習" : "獨立挑戰"}，不是已執行證據。資料來源與範圍會由第一格程式輸出。\n\n## 先問清楚\n${mission.questions.map((item) => `- ${item}`).join("\n")}\n`),
    cell("markdown", "## 執行方法\n\n以 VS Code／Jupyter 開啟，選擇已安裝 pandas、numpy 的 Python kernel（執行核心），從第一格往下逐格執行。網頁版已備妥 pandas，亦可直接練習。不要填入資料庫密碼或任何 API key。\n\nSQL 在網站的 Supabase 唯讀環境執行；此 Notebook 不直接登入資料庫。要換成真實資料，可從網站下載『目前資料 Notebook』，或以 `pd.read_json`／`pd.read_csv` 讀取經授權的匯出檔，並重新確認型態與範圍。\n"),
    ...mission.queries.map((item) => cell("markdown", `## SQL：${item.label}\n\n${datasets[item.name]?.sql ? "目前資料實際使用的 SQL" : "教材示範 SQL（尚未代表已執行）"}\n\n範圍：${datasets[item.name]?.scope || item.scope}\n\n紀錄：${datasets[item.name]?.logId || "教材樣本，無執行紀錄"}\n\n\`\`\`sql\n${datasets[item.name]?.sql || item.sql}\n\`\`\`\n`)),
    cell("code", pythonSetup(datasets)),
    cell("markdown", `## 第一次寫 Python：先認識這四件事\n\n${workflowCatalog.pythonPrimer.map((item) => `\`\`\`python\n${item.code}\n\`\`\`\n${item.meaning}\n\n常見錯誤：${item.mistake}\n`).join("\n")}`),
    cell("markdown", `## 人的思考順序\n${mission.why.map((item, i) => `${i + 1}. ${item}`).join("\n")}\n`),
    cell("code", ["reference", "current"].includes(mode) ? `${code}\n\nresult\n` : "# 在這裡寫你的 pandas。第一格已載入 tables 與 df。\n# 把要交付的表格指定給 result；這裡不預填答案。\n"),
    cell("markdown", `## ${mode === "independent" ? "獨立挑戰" : "換條件練習"}\n\n${mode === "independent" ? mission.independent : mission.practice}\n\n## 驗證\n${mission.checks.map((item) => `- ${item}`).join("\n")}\n\n## 交付\n${mission.deliverable}\n\n${mission.handoff}\n\n## 我的觀察與限制\n\n請保留你實際看到的數字、驗證與疑問；沒有證據就標待確認。\n`),
  ];
  return { nbformat: 4, nbformat_minor: 5, metadata: { kernelspec: { display_name: "Python 3 (pandas)", language: "python", name: "python3" }, language_info: { name: "python" }, supply_sql_lab: { missionId: mission.id, mode, version: workflowCatalog.version, notExecutionEvidence: true } }, cells: cells.map((item, index) => ({ ...item, id: `cell-${index}` })) };
}

export function missionMarkdown(mission) {
  return `# ${mission.title}\n\n${mission.brief}\n\nCH：${mission.chapterId}；工作模式：${workflowCatalog.modes.find((mode) => mode.id === mission.mode).label}\n核心：${mission.coreMinutes / 60} 小時；延伸：${mission.extensionMinutes / 60} 小時。都是規劃時間，不是完成證明。\n\n## 先確認\n${mission.questions.map((line) => `- ${line}`).join("\n")}\n\n## 怎麼想\n${mission.why.map((line) => `- ${line}`).join("\n")}\n\n## 核心學習安排\n${mission.studyPlan.core.map((item) => `- ${item.label}：${item.minutes} 分鐘`).join("\n")}\n\n## SQL 資料範圍\n${mission.queries.map((item) => `- ${item.name}：${item.scope}`).join("\n")}\n\n## 陪跑\n${mission.practice}\n\n## 獨立挑戰\n${mission.independent}\n\n## 驗證\n${mission.checks.map((line) => `- ${line}`).join("\n")}\n\n## 交付與工具交接\n${mission.deliverable}\n\n${mission.handoff}\n\n資料檔 fixtures.json 為刻意縮小的虛構教學資料，不能與真實 Olist 結果混用。reference.ipynb 提供完整示範；practice.ipynb 與 independent.ipynb 不預填作答。\n`;
}

export function buildWorkflowFiles(missionId) {
  const selected = missionId ? [getWorkflowMission(missionId)].filter(Boolean) : workflowCatalog.missions;
  const files = [{ name: "START_HERE.md", content: `# SQL＋pandas 分析師入職任務包\n\n${workflowCatalog.description}\n\n${workflowCatalog.coreDefinition}\n\n${workflowCatalog.extensionDefinition}\n\n## 開始方式\n1. 網站『工作任務包』選擇階段與任務，讀情境與先問清楚。\n2. 示例資料可立即執行 pandas，但會標示為虛構資料。\n3. 每份 SQL 在網站執行，確認資料範圍，再帶入 pandas。\n4. 選看示範、陪跑或獨立練習，最後對帳並交付。\n5. ZIP 裡的 SQL 不會自行連線或修改任何資料。所有 Notebook 都未執行，不是你的完成證據。\n\n## 本機 Notebook\n在一個專案資料夾建立 Python 虛擬環境，安裝 requirements.txt 的套件，以 VS Code 的 Python／Jupyter 擴充開啟 .ipynb 並選擇該環境的 kernel。逐格執行，不需要 SQL／API 密碼。建議先使用已可執行的網頁 pandas，再下載自己的真實資料 Notebook。\n\n## 學習順序\n${selected.map((mission) => `- ${mission.chapterId} / ${mission.id}：${mission.title}（核心 ${mission.coreMinutes / 60}h＋延伸 ${mission.extensionMinutes / 60}h）`).join("\n")}\n\n來源與版本：\n${workflowCatalog.sources.map((source) => `- ${source.label}: ${source.url}`).join("\n")}\n` }, { name: "requirements.txt", content: "pandas>=2.2,<4\nnumpy>=1.26,<3\nipykernel>=6,<8\n" }];
  for (const mission of selected) {
    const prefix = `${mission.chapterId}/${mission.id}`;
    files.push({ name: `${prefix}/README.md`, content: missionMarkdown(mission) });
    files.push({ name: `${prefix}/fixtures.json`, content: JSON.stringify(missionFixtures(mission), null, 2) });
    for (const item of mission.queries) files.push({ name: `${prefix}/${item.name}.sql`, content: `-- ${item.label}\n-- ${item.scope}\n${item.sql}\n` });
    for (const mode of ["reference", "practice", "independent"]) files.push({ name: `${prefix}/${mode}.ipynb`, content: JSON.stringify(buildMissionNotebook(mission, { mode }), null, 2) });
  }
  for (const file of files.filter((f) => f.name.endsWith(".md"))) {
    file.content = file.content.replace(/^核心：.*$/m, "原有情境參考；不代表已提供或已完成特定學習時數。")
      .replace(/（核心 [\d.]+h＋延伸 [\d.]+h）/g, "")
      .replace(/：[\d.]+ 分鐘/g, "")
      .replace("網站『工作任務包』", "網站『分析師工作室 → 原有工作情境』");
  }
  return files;
}
