import { chapterOneTeaching } from "./chapter-one-teaching.js";

const analystSteps = [
  "先把商業需求改寫成明確的輸出。",
  "確認一列資料代表什麼（grain）以及需要哪些表格與欄位。",
  "先跑小範圍查詢，再逐步加入條件。",
  "核對列數、NULL、重複值或總額，確認結果可信。",
  "用一句話說明結果、假設與限制。",
];

const chapterWorkDefaults = {
  ch01: {
    timeline: "入職第一週",
    companyStage: "接手陌生資料庫",
    role: "Marketplace Operations Analyst",
    whySql: "資料已經在 PostgreSQL 裡；SQL 可以直接在資料所在地取得精確結果，不必先下載整張表，也能保留可重跑的查詢紀錄。",
    delivery: {
      label: "資料庫初檢紀錄",
      destination: "Onboarding note／主管的一次性回覆",
      reason: "先證明資料範圍與品質可信，再決定是否值得做固定報表。",
    },
    toolBoundary: [
      { tool: "SQL", timing: "現在使用", reason: "在資料庫內安全取樣、篩選與驗證原始資料。" },
      { tool: "Pandas", timing: "需要時再用", reason: "遇到外部檔案、特殊清理、統計或自動化流程時再導入。" },
      { tool: "Power BI", timing: "暫時不需要", reason: "單次盤點或抽查不必做 Dashboard；固定 KPI 才值得接入。" },
      { tool: "Database View", timing: "重複使用時", reason: "同一份可靠 Query 需要多人或定期使用時，再儲存成受管控的 View。" },
    ],
  },
  ch02: {
    timeline: "入職第二週",
    companyStage: "接到第一份跨部門需求",
    role: "Cross-functional Data Analyst",
    whySql: "訂單、客戶、賣家與商品分散在關聯資料表中；SQL JOIN 能在資料庫內按 key 串接，並保留可稽核的 grain 與列數。",
    delivery: {
      label: "分析可用資料集",
      destination: "Saved Query／Database View",
      reason: "先建立一份 grain 清楚、不會重複放大金額的共享資料集。",
    },
    toolBoundary: [
      { tool: "SQL", timing: "現在使用", reason: "用 key、JOIN 與對帳建立可信的分析資料集。" },
      { tool: "Pandas", timing: "有外部資料時", reason: "串接資料庫外的 Excel、CSV 或 API 資料時使用。" },
      { tool: "Power BI", timing: "資料穩定後", reason: "grain 與關聯確認前不要急著建模型，否則指標可能被重複放大。" },
      { tool: "Database View", timing: "建議交付", reason: "讓後續 KPI 與 Dashboard 複用同一份定義。" },
    ],
  },
  ch03: {
    timeline: "入職第三週",
    companyStage: "建立固定管理報表",
    role: "Reporting Analyst",
    whySql: "KPI 應先在資料庫內定義 grain、分子、分母與時間範圍，產出每期一列的穩定結果，再交給視覺化工具。",
    delivery: {
      label: "KPI 資料表",
      destination: "Database View → Power BI semantic model",
      reason: "讓 Power BI 負責互動與呈現，而不是在圖表裡重複發明指標邏輯。",
    },
    toolBoundary: [
      { tool: "SQL", timing: "現在使用", reason: "彙總、排名、趨勢與 KPI 口徑都保留在可稽核的 Query 中。" },
      { tool: "Pandas", timing: "進階分析時", reason: "預測、統計檢定或特殊資料轉換再使用。" },
      { tool: "Power BI", timing: "下一個交付", reason: "連接已驗證的 KPI 表，建立趨勢圖、篩選器與管理層視圖。" },
      { tool: "Database View", timing: "建議建立", reason: "提供固定 schema 與單一指標定義給報表使用。" },
    ],
  },
  ch04: {
    timeline: "入職第一個月",
    companyStage: "調查營運問題",
    role: "Business Operations Analyst",
    whySql: "問題調查必須留下可重跑的證據鏈；SQL 適合逐層縮小範圍、驗證異常並區分描述性證據與因果推論。",
    delivery: {
      label: "營運調查 Brief",
      destination: "主管摘要＋驗證附錄",
      reason: "結論要同時交付證據、限制與可以採取的下一步。",
    },
    toolBoundary: [
      { tool: "SQL", timing: "核心證據", reason: "抽取、對帳與分層診斷必須可重跑。" },
      { tool: "Pandas", timing: "統計驗證時", reason: "需要相關性、分布、異常偵測或實驗分析時使用。" },
      { tool: "Power BI", timing: "持續監控時", reason: "問題確定為長期管理指標後，才轉成監控 Dashboard。" },
      { tool: "Database View", timing: "口徑穩定後", reason: "固定調查用資料集，避免不同團隊各算一套。" },
    ],
  },
  ch05: {
    timeline: "獨立工作模擬",
    companyStage: "從需求到管理層交付",
    role: "Entry-Level Analyst",
    whySql: "最終交付必須能從原始資料重建；SQL 是資料準備與驗證主幹，其他工具只負責適合自己的後續工作。",
    delivery: {
      label: "完整分析作品",
      destination: "Power BI Dashboard＋主管摘要＋SQL 證據包",
      reason: "同時證明技術、驗證、商業溝通與可重跑能力。",
    },
    toolBoundary: [
      { tool: "SQL", timing: "資料主幹", reason: "建立最終分析資料集與全部驗證 Query。" },
      { tool: "Pandas", timing: "選配", reason: "自動化 QA、統計或作品集 Notebook 需要時使用。" },
      { tool: "Power BI", timing: "正式交付", reason: "把穩定指標變成主管可瀏覽的 Dashboard。" },
      { tool: "Database View", timing: "產品化", reason: "正式環境中作為 Dashboard 與下游分析的受管控來源。" },
    ],
  },
};

const chapterPrograms = {
  ch01: {
    learningMinutes: 480,
    outcomes: ["讀懂 schema、table、column 與資料粒度", "使用基礎 SQL 安全取樣、篩選、排序與分類", "辨認 NULL、重複與資料覆蓋風險", "把查詢結果交付到 Excel 做第一次營運抽查"],
    tools: ["PostgreSQL", "Excel", "CSV"],
    jobCapability: "可以獨立接手陌生資料庫並完成第一輪資料盤點。",
  },
  ch02: {
    learningMinutes: 600,
    outcomes: ["先定義 grain 再選 JOIN key", "辨認 INNER／LEFT JOIN 的列數影響", "使用 COUNT DISTINCT 防止指標被多對多關係放大", "把可信 SQL 結果交給 Power Query 建立可刷新資料集"],
    tools: ["PostgreSQL", "Power Query", "Excel"],
    jobCapability: "可以建立跨表、可對帳、可供下游重複使用的分析資料集。",
  },
  ch03: {
    learningMinutes: 660,
    outcomes: ["定義 KPI 的 grain、分子、分母與期間", "使用 GROUP BY、CTE、Subquery 與 Window Function", "建立月度趨勢與成長率", "在 Power BI 建立視覺與基礎 DAX measure"],
    tools: ["PostgreSQL", "Power BI", "DAX"],
    jobCapability: "可以把臨時查詢轉成可刷新、可解釋的管理報表。",
  },
  ch04: {
    learningMinutes: 600,
    outcomes: ["把模糊商業問題改寫成可驗證假設", "逐層縮小異常範圍並保留證據鏈", "使用 Pandas 做資料品質與統計複核", "分開描述性證據、推論、限制與下一步"],
    tools: ["PostgreSQL", "Pandas", "Jupyter"],
    jobCapability: "可以調查營運問題，提出有證據且不過度推論的建議。",
  },
  ch05: {
    learningMinutes: 660,
    outcomes: ["從需求訪談建立完整分析規格", "建立資料集、驗證表與可刷新語意模型", "以 Power BI／DAX 完成主管 Dashboard", "交付主管摘要、限制、SQL Log 與陌生資料最終 Case"],
    tools: ["PostgreSQL", "Excel", "Power BI", "DAX", "Pandas"],
    jobCapability: "可以在指導下完成 Entry-Level Analyst 的端到端交付。",
  },
};

const careerFramework = {
  reviewedAt: "2026-08-28",
  totalMinutes: 3000,
  promise: "50 小時用來建立可展示的 Entry-Level Analyst 基礎，不宣稱能取代實習、領域經驗或完整 Power BI 認證。",
  pillars: [
    { title: "取得與清理", detail: "SQL、資料型別、NULL、重複、Power Query 與可刷新資料。" },
    { title: "建模與 KPI", detail: "grain、key、關聯、分子分母、CTE、Window Function 與 DAX。" },
    { title: "驗證與治理", detail: "列數對帳、唯一性、控制表、限制、可追溯 Log 與報表檢查。" },
    { title: "視覺與溝通", detail: "Dashboard、主管摘要、行動建議、跨部門說明與作品集 Case。" },
  ],
  sources: [
    { label: "Microsoft PL-300（2026 能力範圍）", url: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/pl-300" },
    { label: "O*NET Business Intelligence Analysts", url: "https://www.onetonline.org/link/summary/15-2051.01" },
    { label: "Google Data Analytics Certificate", url: "https://grow.google/certificates/data-analytics/" },
    { label: "IBM Data Analyst Professional Certificate", url: "https://www.ibm.com/training/badge/data-analyst-professional-certificate" },
    { label: "Amazon Supply Chain Analyst 工作樣本", url: "https://www.amazon.jobs/en/jobs/10444933/supply-chain-analyst-amazon-business-operations" },
  ],
};

const unitMinutes = {
  "ch01-q01": 60, "ch01-q02": 75, "ch01-q03": 75, "ch01-q04": 80, "ch01-q05": 85, "ch01-q06": 105,
  "ch02-q01": 80, "ch02-q02": 90, "ch02-q03": 100, "ch02-q04": 100, "ch02-q05": 110, "ch02-q06": 120,
  "ch03-q01": 90, "ch03-q02": 90, "ch03-q03": 110, "ch03-q04": 110, "ch03-q05": 120, "ch03-q06": 140,
  "ch04-q01": 90, "ch04-q02": 95, "ch04-q03": 95, "ch04-q04": 100, "ch04-q05": 100, "ch04-q06": 120,
  "ch05-q01": 90, "ch05-q02": 100, "ch05-q03": 100, "ch05-q04": 110, "ch05-q05": 120, "ch05-q06": 140,
};

const careerLabs = {
  "ch01-q06": {
    tool: "Excel",
    title: "把高金額抽查做成可交付的 Excel 稽核表",
    purpose: "練習分析師最常見的第一種交付：把已驗證的 SQL 明細交給非技術同事使用。",
    artifact: "ch01_high_value_audit.xlsx",
    steps: ["下載本題 CSV 並用 Excel 開啟。", "轉成 Table，確認 price 與 freight_value 是數值型別。", "依 price 由高到低排序，對 price >= 2000 加上條件格式。", "建立 PivotTable：Rows 放 seller_id、Values 放 Sum of price。", "新增 audit_note 欄，替前三筆寫下要追查的原因。"],
    requiredEvidence: true,
    evidencePrompt: "寫下檔名、總列數、最高金額，以及你如何確認排序和數值型別正確。",
    evidenceChecks: [{ id: "file", label: "已建立 Excel Table" }, { id: "types", label: "已檢查數值型別" }, { id: "pivot", label: "已建立 seller_id PivotTable" }, { id: "audit", label: "已完成排序、標示與稽核註記" }],
  },
  "ch02-q06": {
    tool: "Power Query",
    title: "把高營收賣家結果整理成可刷新的 Query",
    purpose: "將 SQL 的可信結果接到 Excel／Power BI，而不是每次手動複製貼上。",
    artifact: "ch02_seller_revenue_query.xlsx",
    steps: ["下載本題 CSV，從 Excel 的 Data → From Text/CSV 載入 Power Query。", "開啟 Column quality／distribution，記錄空值、唯一值與錯誤。", "把 seller_id、seller_state 設為文字，item_revenue 設為 decimal。", "建立 Reference Query seller_revenue_validation，用 Group By 檢查 seller_id 唯一性。", "命名主 Query 為 seller_revenue，Load To 表格後執行一次 Refresh。"],
    requiredEvidence: true,
    evidencePrompt: "寫下 Query 名稱、載入列數、欄位型別，以及 Refresh 後你做的唯一性檢查。",
    evidenceChecks: [{ id: "query", label: "已建立並命名 Power Query" }, { id: "profile", label: "已執行 Column profiling" }, { id: "types", label: "已設定正確欄位型別" }, { id: "refresh", label: "已用 Reference Query 驗證並 Refresh" }],
  },
  "ch03-q06": {
    tool: "Power BI + DAX",
    title: "建立月營收趨勢與成長率管理頁",
    purpose: "讓 SQL 負責可信月資料，Power BI 負責互動與呈現，DAX 負責報表層 measure。",
    artifact: "ch03_monthly_revenue_report.pbix／Power BI Service report",
    platformNote: "Mac 可使用 Power BI Service（需組織帳號與建模權限）；完整 Desktop 功能需 Windows 環境。",
    steps: ["下載本題 CSV 並匯入 Power BI Service 或 Desktop。", "把 month 設為 Date、revenue 設為 Decimal；建立 Calendar = CALENDAR(MIN(monthly_revenue[month]), MAX(monthly_revenue[month]))。", "建立 Calendar[Date] 到 monthly_revenue[month] 的一對多關聯，確認交叉篩選方向。", "建立 DAX：Total Revenue = SUM(monthly_revenue[revenue])。", "建立月營收折線圖與 KPI 卡，核對第一個月 previous_month_revenue 為空值。"],
    requiredEvidence: true,
    evidencePrompt: "寫下使用的平台、資料列數、建立的 DAX measure、視覺名稱，以及你核對第一個月空值的方法。",
    evidenceChecks: [{ id: "import", label: "已匯入並設定日期／數值型別" }, { id: "model", label: "已建立 Calendar 與一對多關聯" }, { id: "dax", label: "已建立 Total Revenue DAX measure" }, { id: "visual", label: "已建立趨勢圖並核對首月空值" }],
  },
  "ch04-q04": {
    tool: "Pandas",
    title: "用 Pandas 重跑付款唯一性 QA",
    purpose: "將 SQL 的資料品質規則轉成可自動化的 assertion，建立第二層驗證證據。",
    artifact: "ch04_payment_qa.ipynb",
    expectedColumns: ["order_id", "payment_sequential", "duplicate_count"],
    steps: ["下載本題 CSV，在 Jupyter／Colab 使用 pandas.read_csv() 載入。", "印出 columns、shape 與 head()；0 列也要保留欄位結構。", "執行 assert df.empty 或 assert (df['duplicate_count'] > 1).all()。", "寫下 0 列代表目前未發現違反規則，不等於未來永遠沒有問題。"],
    requiredEvidence: true,
    evidencePrompt: "寫下 Notebook 名稱、DataFrame shape、assertion 結果，以及為何 0 列不能被解讀成永久零風險。",
    evidenceChecks: [{ id: "load", label: "已用 Pandas 載入 CSV" }, { id: "assert", label: "已執行資料品質 assertion" }, { id: "limit", label: "已記錄 0 列結果的限制" }],
  },
  "ch05-q04": {
    tool: "Excel",
    title: "建立交付前 KPI 對帳工作表",
    purpose: "模擬正式報表送出前的 control sheet，證明分子、分母與缺漏關係合理。",
    artifact: "ch05_kpi_reconciliation.xlsx",
    steps: ["下載本題 CSV 並轉成 Excel Table。", "新增 check_1：complete_date_orders <= delivered_orders。", "新增 check_2：late_orders <= complete_date_orders。", "使用條件格式標出 FALSE，並記錄是否所有月份通過。"],
    requiredEvidence: true,
    evidencePrompt: "寫下工作表名稱、月份列數、兩個檢查公式，以及是否有任何月份未通過。",
    evidenceChecks: [{ id: "formula", label: "已建立兩個對帳公式" }, { id: "format", label: "已加入失敗條件格式" }, { id: "result", label: "已記錄所有月份的檢查結果" }],
  },
  "ch05-q05": {
    tool: "Power BI + DAX",
    title: "建立主管摘要的語意模型",
    purpose: "把最後查詢轉成清楚命名、可重複使用的商業指標，而不是只放一張靜態表。",
    artifact: "ch05_delivery_model.pbix／Power BI Service semantic model",
    platformNote: "Mac 可使用 Power BI Service（需組織帳號與建模權限）；完整 Desktop 功能需 Windows 環境。",
    steps: ["匯入本題 CSV，設定州別為文字、三個指標為數值。", "建立 DAX：Total Orders = SUM(state_summary[order_count])。", "建立州別表格與 late_rate、avg_review_score 散點圖。", "建立 regional_manager 測試角色，以 customer_state = 'SP' 練習 RLS 並使用 View as role。", "核對 Power BI 列數與 SQL 結果列數一致。"],
    requiredEvidence: true,
    evidencePrompt: "寫下模型／Report 名稱、DAX measure、兩個視覺，以及 SQL 與 Power BI 的列數對帳。",
    evidenceChecks: [{ id: "model", label: "已建立並命名語意模型" }, { id: "dax", label: "已建立 Total Orders DAX" }, { id: "rls", label: "已建立並測試 SP 的 RLS role" }, { id: "reconcile", label: "已完成視覺與列數對帳" }],
  },
  "ch05-q06": {
    tool: "Portfolio Case",
    title: "交付 Entry-Level Analyst 最終作品",
    purpose: "用陌生資料完成從需求、SQL、驗證、Dashboard 到主管摘要的完整證據鏈。",
    artifact: "olist_delivery_performance_portfolio",
    steps: ["下載本題結果與完整 SQL Log，保留錯誤、修正與最終版本。", "完成一頁 Dashboard：營收、遲交率、評分、州別比較。", "寫一頁主管摘要：問題、三個發現、建議、限制與下一步。", "從未先看答案的角度，口頭用 3 分鐘解釋 grain、驗證與商業決策。"],
    requiredEvidence: true,
    evidencePrompt: "寫下作品名稱、三個發現、至少一個限制、主管可採取的下一步，以及你用來防止重複計算的驗證。",
    evidenceChecks: [{ id: "dashboard", label: "已完成一頁 Dashboard" }, { id: "brief", label: "已完成主管摘要與限制" }, { id: "evidence", label: "已保存 SQL Log、驗證與最終資料" }, { id: "explain", label: "已完成 3 分鐘口頭解釋" }],
  },
};

function practicePlan(minutes, hasCareerLab) {
  const understand = Math.round(minutes * 0.15);
  const guided = Math.round(minutes * 0.2);
  const query = Math.round(minutes * 0.35);
  const verify = Math.round(minutes * 0.2);
  const explain = minutes - understand - guided - query - verify;
  return [
    { label: "讀懂需求與資料", minutes: understand },
    { label: "示範、拆解與模仿", minutes: guided },
    { label: "獨立寫 SQL 與除錯", minutes: query },
    { label: hasCareerLab ? "驗證並完成 Tool Lab" : "驗證結果與邊界", minutes: verify },
    { label: "寫分析說明與回顧", minutes: explain },
  ];
}

function question({
  id,
  chapterId,
  unit,
  stage,
  title,
  context,
  task,
  example,
  expected,
  hints,
  skills,
  referenceSql,
  compare = "exact",
  ordered = false,
  readinessDimension,
  workContext = {},
}) {
  const teaching = chapterOneTeaching[id] || null;
  const defaultWork = chapterWorkDefaults[chapterId];
  const estimatedMinutes = unitMinutes[id];
  const careerLab = careerLabs[id] || null;
  const resolvedWorkContext = {
    ...defaultWork,
    ...workContext,
    businessPurpose: workContext.businessPurpose || context,
    whySql: workContext.whySql || defaultWork.whySql,
    delivery: { ...defaultWork.delivery, ...(workContext.delivery || {}) },
    toolBoundary: workContext.toolBoundary || defaultWork.toolBoundary,
    validationPlan: workContext.validationPlan || analystSteps,
  };
  return {
    id,
    chapterId,
    unit,
    stage,
    title,
    context,
    task,
    example,
    expected,
    hints,
    skills,
    referenceSql,
    compare,
    ordered,
    readinessDimension,
    estimatedMinutes,
    practicePlan: practicePlan(estimatedMinutes, Boolean(careerLab)),
    careerLab,
    workContext: resolvedWorkContext,
    lesson: teaching?.lesson || null,
    solution: teaching?.solution || null,
    analystSteps,
    reflectionPrompt:
      "請用自己的話寫下：這個結果回答了什麼商業問題？你做了哪一個驗證？",
  };
}

const chapterSeed = [
  {
    id: "ch01",
    order: 1,
    eyebrow: "CHAPTER 1",
    title: "First Week · Database Onboarding",
    subtitle: "入職第一週：確認資料可信",
    description: "以 Olist 新進分析師的第一週為故事，從資料盤點、安全抽樣、缺值檢查到第一次稽核交付。",
    timeline: "入職第 1 週",
    mission: "接手陌生 PostgreSQL 資料庫，建立可以信任的第一份資料地圖。",
    deliverable: "資料庫初檢紀錄＋第一次營運抽查",
    toolFlow: "PostgreSQL → Onboarding note／CSV",
    readinessDimension: "資料取得與基礎 SQL",
    questions: [
      question({
        id: "ch01-q01",
        chapterId: "ch01",
        unit: "1.1",
        stage: "示範後模仿",
        title: "新到職：確認賣家資料量",
        context: "你剛接手 Olist 資料庫，主管要你先確認賣家主檔的規模。",
        task: "計算 olist.sellers_raw 的總列數，欄位命名為 seller_row_count。",
        workContext: {
          workday: "DAY 1 · 上午",
          team: "Data Onboarding",
          businessPurpose: "建立第一份資料盤點基準，確認賣家主檔不是空表，也知道後續賣家分析的母體規模。",
          whySql: "主管只需要一個資料庫內的精確總數。COUNT(*) 能在 PostgreSQL 直接計算，不必把整張賣家表下載到 Excel 或 Pandas。",
          validationPlan: [
            "結果必須只有 1 列、1 欄，避免誤交明細資料。",
            "欄名必須是 seller_row_count，讓接收者不看 SQL 也知道數字含義。",
            "數值應大於 0；若為 0，要先確認連線、schema 與資料載入狀態。",
          ],
          delivery: {
            label: "Onboarding 資料盤點",
            destination: "個人接手筆記／主管即時回覆",
            reason: "這是一個基準數字，不需要為單次回答建立 Power BI Dashboard。",
          },
        },
        example: "相近例子：SELECT COUNT(*) AS order_row_count FROM olist.orders_raw;",
        expected: "1 列、1 欄；欄名為 seller_row_count。",
        hints: [
          "概念提示：這題只需要把整張表的資料列數出來，不需要先選個別欄位。",
          "表與輸出提示：資料來源是 olist.sellers_raw，結果欄名必須是 seller_row_count。",
          "SQL 骨架：SELECT COUNT(*) AS ______ FROM ______;",
          "接近完成：SELECT COUNT(*) AS seller_row_count FROM olist.______；你只需要補上正確表名。",
        ],
        skills: ["SELECT", "COUNT", "AS", "schema"],
        referenceSql: `SELECT
  COUNT(*) AS seller_row_count
FROM olist.sellers_raw`,
        readinessDimension: "資料取得與基礎 SQL",
      }),
      question({
        id: "ch01-q02",
        chapterId: "ch01",
        unit: "1.2",
        stage: "資料品質變形",
        title: "評論覆蓋與重複風險",
        context: "客服主管不只想知道評論表有幾列，也要確認這些列涵蓋多少訂單，以及同一訂單是否可能出現多筆評論。",
        task: "從 olist.order_reviews_raw 同時輸出總列數 review_row_count、不同訂單數 reviewed_order_count，以及兩者差額 duplicate_review_rows。",
        workContext: {
          workday: "DAY 1 · 下午",
          team: "Customer Experience",
          businessPurpose: "確認評論資料的資料列規模、訂單覆蓋量與潛在重複，避免後續平均評分或評論率被錯誤粒度影響。",
          whySql: "COUNT(*) 與 COUNT(DISTINCT order_id) 能在同一個可重跑 Query 裡比較資料列與商業實體，這是比單純數表格更接近分析師工作的品質檢查。",
          validationPlan: [
            "結果必須只有 1 列、3 欄，並使用題目指定的清楚欄名。",
            "reviewed_order_count 不得大於 review_row_count。",
            "duplicate_review_rows 必須等於總列數減不同訂單數；它表示要調查的粒度差異，不可直接斷言是髒資料。",
          ],
          delivery: {
            label: "評論覆蓋與粒度檢查",
            destination: "Customer Experience 需求紀錄",
            reason: "先釐清一列是否等於一張訂單，再決定評論率、平均分數與後續 JOIN 的正確分母。",
          },
        },
        example: "相近例子：比較付款表 COUNT(*) 與 COUNT(DISTINCT order_id)，確認一張訂單可能有多筆付款。",
        expected: "1 列、3 欄；reviewed_order_count <= review_row_count，差額欄位計算正確。",
        hints: [
          "概念提示：COUNT(*) 數資料列；COUNT(DISTINCT order_id) 數不同訂單，兩者不是同一件事。",
          "輸出提示：三欄都在同一個 SELECT 裡，第三欄用前兩種 COUNT 的差額計算。",
          "SQL 骨架：SELECT COUNT(*) AS review_row_count, COUNT(DISTINCT order_id) AS reviewed_order_count, ... AS duplicate_review_rows FROM ...;",
          "接近完成：第三欄寫 COUNT(*) - COUNT(DISTINCT order_id)，資料來源是 olist.order_reviews_raw。",
        ],
        skills: ["COUNT", "COUNT DISTINCT", "grain", "data quality"],
        referenceSql: `SELECT
  COUNT(*) AS review_row_count,
  COUNT(DISTINCT order_id) AS reviewed_order_count,
  COUNT(*) - COUNT(DISTINCT order_id) AS duplicate_review_rows
FROM olist.order_reviews_raw`,
        readinessDimension: "資料取得與基礎 SQL",
      }),
      question({
        id: "ch01-q03",
        chapterId: "ch01",
        unit: "1.3",
        stage: "條件變形",
        title: "找出最近完成的訂單",
        context: "營運人員要抽查最近送達的訂單，確認資料是否持續更新。",
        task: "從 orders_raw 選出 order_id、order_status、order_purchase_timestamp；只保留 delivered，最新下單時間排前面，取 10 列。",
        workContext: {
          workday: "DAY 2",
          team: "Marketplace Operations",
          businessPurpose: "確認訂單資料仍持續更新，並給營運人員一份最新已送達訂單抽樣。",
          whySql: "SQL 可以同時完成選欄、篩選、排序與安全取樣，只把需要的 10 列帶出資料庫；不應先下載整張訂單表再手動篩選。",
          validationPlan: [
            "每一列 order_status 都必須是 delivered。",
            "order_purchase_timestamp 必須由新到舊，檢查第一列是否為最新時間。",
            "結果最多 10 列，而且只包含需求指定的 3 個欄位。",
          ],
          delivery: {
            label: "最新訂單抽查清單",
            destination: "營運人員的一次性查核／必要時匯出 CSV",
            reason: "一次性抽樣可以直接查看或匯出；若每天都要檢查，才改成 View 或監控報表。",
          },
        },
        example: "相近例子：用 WHERE 選狀態、ORDER BY ... DESC 排最新、LIMIT 控制抽樣。",
        expected: "3 欄、最多 10 列；全部為 delivered 且日期由新到舊。",
        hints: [
          "概念提示：把需求拆成四段：顯示欄位、狀態篩選、最新排序、列數限制。",
          "表與子句提示：orders_raw；WHERE 篩 delivered；ORDER BY 購買時間；LIMIT 10。",
          "SQL 骨架：SELECT 三個欄位 FROM olist.orders_raw WHERE ... ORDER BY ... DESC LIMIT ...;",
          "接近完成：WHERE order_status = 'delivered' ORDER BY order_purchase_timestamp DESC LIMIT 10；你還要補 SELECT 欄位與 FROM。",
        ],
        skills: ["WHERE", "ORDER BY", "DESC", "LIMIT"],
        referenceSql: `SELECT
  order_id,
  order_status,
  order_purchase_timestamp
FROM olist.orders_raw
WHERE order_status = 'delivered'
ORDER BY order_purchase_timestamp DESC
LIMIT 10`,
        ordered: true,
        readinessDimension: "資料取得與基礎 SQL",
      }),
      question({
        id: "ch01-q04",
        chapterId: "ch01",
        unit: "1.4",
        stage: "資料品質",
        title: "找出尚未記錄送達日的訂單",
        context: "客服正在追查沒有實際送達日期的訂單，需要先抽樣確認狀態。",
        task: "選出 order_id、order_status、order_delivered_customer_date；只保留送達日期為 NULL 的資料，依購買時間由新到舊取 15 列。",
        workContext: {
          workday: "DAY 3",
          team: "Customer Operations＋Data Quality",
          businessPurpose: "區分合理的未完成訂單與可能缺漏的送達資料，建立客服後續追查清單。",
          whySql: "NULL 是資料庫層的缺值狀態，必須用 IS NULL 在來源端正確篩選；匯出後才判斷是否需要進一步清理或追蹤。",
          validationPlan: [
            "order_delivered_customer_date 每一列都必須顯示 NULL。",
            "結果不超過 15 列，並且依據購買時間由新到舊。",
            "結合 order_status 解讀：尚未送達可能合理，已送達卻缺日期才更像資料品質問題。",
          ],
          delivery: {
            label: "資料品質 Issue List",
            destination: "客服／資料工程追查清單",
            reason: "先以 SQL 留下異常證據；若需要人工補值或跨檔案比對，再將小範圍結果交給 Pandas 或作業流程。",
          },
        },
        example: "缺少值不能用 = NULL，要使用 IS NULL。",
        expected: "3 欄、最多 15 列；送達日期全部為 NULL。",
        hints: [
          "概念提示：NULL 代表缺少或未知，不能用 = NULL 比較。",
          "表與子句提示：在 orders_raw 使用 order_delivered_customer_date IS NULL。",
          "SQL 骨架：SELECT 三個欄位 FROM ... WHERE ... IS NULL ORDER BY ... DESC LIMIT 15;",
          "接近完成：WHERE order_delivered_customer_date IS NULL ORDER BY order_purchase_timestamp DESC LIMIT 15；你還要補 SELECT 與 FROM。",
        ],
        skills: ["NULL", "IS NULL", "ORDER BY", "validation"],
        referenceSql: `SELECT
  order_id,
  order_status,
  order_delivered_customer_date
FROM olist.orders_raw
WHERE order_delivered_customer_date IS NULL
ORDER BY order_purchase_timestamp DESC
LIMIT 15`,
        ordered: true,
        readinessDimension: "資料取得與基礎 SQL",
      }),
      question({
        id: "ch01-q05",
        chapterId: "ch01",
        unit: "1.5",
        stage: "商業分類",
        title: "把評論分成服務等級",
        context: "客服主管不想逐筆看 1–5 分，希望先分成負面、中立與正面。",
        task: "選出 review_id、review_score，使用 CASE 建立 review_group：1–2 為 negative、3 為 neutral、4–5 為 positive；依 review_score 排序後取 20 列。",
        workContext: {
          workday: "DAY 4",
          team: "Customer Experience",
          businessPurpose: "把原始評分轉換成主管能快速閱讀的服務等級，並先抽樣確認分類規則正確。",
          whySql: "CASE WHEN 可以在資料庫查詢中建立透明、可重跑的商業規則，同時保留原始 review_score 逐列對帳。",
          validationPlan: [
            "1–2 分只能對應 negative，3 分只能對應 neutral，4–5 分只能對應 positive。",
            "保留原始 review_score 與 review_id，確保分類可以逐列追溯。",
            "正式報表前還要檢查是否存在 1–5 以外的異常分數，避免 ELSE 掩蓋髒資料。",
          ],
          delivery: {
            label: "服務等級規則原型",
            destination: "Customer Experience 規則確認",
            reason: "先用明細抽樣確認規則；規則核准後，再按月份或團隊彙總並提供 Power BI 使用。",
          },
        },
        example: "CASE WHEN 像 Excel IF：條件成立就回傳指定分類。",
        expected: "3 欄；review_group 與 review_score 的規則一致。",
        hints: [
          "概念提示：把 Excel IF 的三個分支先寫成人話：1–2、3、其他。",
          "欄位與規則提示：使用 review_score；前兩段是 WHEN，4–5 分交給 ELSE。",
          "SQL 骨架：CASE WHEN review_score <= 2 THEN ... WHEN review_score = 3 THEN ... ELSE ... END AS review_group。",
          "接近完成：CASE WHEN review_score <= 2 THEN 'negative' WHEN review_score = 3 THEN 'neutral' ELSE 'positive' END AS review_group；你還要補其餘 SELECT、FROM、排序與 LIMIT。",
        ],
        skills: ["CASE WHEN", "business rules", "alias"],
        referenceSql: `SELECT
  review_id,
  review_score,
  CASE
    WHEN review_score <= 2 THEN 'negative'
    WHEN review_score = 3 THEN 'neutral'
    ELSE 'positive'
  END AS review_group
FROM olist.order_reviews_raw
ORDER BY review_score, review_id
LIMIT 20`,
        ordered: true,
        readinessDimension: "資料取得與基礎 SQL",
      }),
      question({
        id: "ch01-q06",
        chapterId: "ch01",
        unit: "1.6",
        stage: "章末白紙挑戰",
        title: "高金額訂單明細抽查",
        context: "稽核人員要查看價格至少 1,000 的訂單明細，優先檢查最高金額。",
        task: "從 order_items_raw 選出 order_id、product_id、seller_id、price、freight_value；price >= 1000，依 price 由高到低取 12 列。",
        workContext: {
          workday: "DAY 5 · 週末交付",
          team: "Audit／Marketplace Operations",
          businessPurpose: "完成第一份獨立異常金額抽查，證明你能從需求自行決定輸出、來源、條件、排序與列數。",
          whySql: "所需欄位都在同一張明細表；SQL 是最短、最可稽核的路徑，不需要 JOIN，也不需要先用 Pandas 載入全表。",
          validationPlan: [
            "結果必須正好 5 欄且最多 12 列。",
            "每一列 price 都必須大於或等於 1000，不能漏掉剛好等於門檻的資料。",
            "price 必須由高到低；同價時以 order_id 提供穩定順序。",
          ],
          delivery: {
            label: "高金額稽核抽樣",
            destination: "稽核人员 CSV／Saved Query",
            reason: "一次抽查可匯出 CSV；若每週重複執行，應儲存 Query 或 View 並加入排程，而不是每次手動重做。",
          },
        },
        example: "這是 Chapter 1 綜合題；請自己決定 SELECT、WHERE、ORDER BY 與 LIMIT 的順序。",
        expected: "5 欄、最多 12 列；price 都至少 1,000 且由高到低。",
        hints: [
          "概念提示：先把需求寫成 output、source、filter、sort、limit 五格，不要直接猜完整 SQL。",
          "表與條件提示：所有欄位都在 olist.order_items_raw；price 至少 1000 要使用 >=。",
          "SQL 骨架：SELECT 五個欄位 FROM ... WHERE price ... ORDER BY price ... LIMIT ...;",
          "接近完成：FROM olist.order_items_raw WHERE price >= 1000 ORDER BY price DESC, order_id LIMIT 12；你還要自行列出五個輸出欄位。",
        ],
        skills: ["SELECT", "WHERE", "ORDER BY", "LIMIT", "independent"],
        referenceSql: `SELECT
  order_id,
  product_id,
  seller_id,
  price,
  freight_value
FROM olist.order_items_raw
WHERE price >= 1000
ORDER BY price DESC, order_id
LIMIT 12`,
        ordered: true,
        readinessDimension: "資料取得與基礎 SQL",
      }),
    ],
  },
  {
    id: "ch02",
    order: 2,
    eyebrow: "CHAPTER 2",
    title: "First Request · Build the Dataset",
    subtitle: "入職第二週：完成第一份跨部門資料集",
    description: "從真實需求確認 grain 與 key，串接訂單、客戶、賣家和商品，建立不會重複放大金額的共享資料集。",
    timeline: "入職第 2 週",
    mission: "把分散的公司資料正確串接，讓營運與財務使用同一份可信來源。",
    deliverable: "可重跑的分析資料集／Database View",
    toolFlow: "PostgreSQL JOIN → Database View",
    readinessDimension: "JOIN 與資料粒度",
    questions: [
      question({
        id: "ch02-q01", chapterId: "ch02", unit: "2.1", stage: "示範後模仿", title: "把訂單接到客戶州別",
        context: "營運主管需要知道每張訂單屬於哪個客戶州別。",
        task: "INNER JOIN orders_raw 與 customers_raw，選出 order_id、order_status、customer_state，依 order_id 取前 20 列。",
        example: "SAP 類比：用 customer_id 把訂單抬頭接到客戶主檔。",
        expected: "3 欄、20 列；每列都有 customer_state。",
        hints: ["先決定左表 orders_raw。", "兩表共同 key 是 customer_id。", "使用表別名避免欄名不清楚。"],
        skills: ["INNER JOIN", "key", "table alias", "grain"],
        referenceSql: "SELECT o.order_id, o.order_status, c.customer_state FROM olist.orders_raw o INNER JOIN olist.customers_raw c ON o.customer_id = c.customer_id ORDER BY o.order_id LIMIT 20",
        ordered: true, readinessDimension: "JOIN 與資料粒度",
      }),
      question({
        id: "ch02-q02", chapterId: "ch02", unit: "2.2", stage: "相似題", title: "把訂單明細接到賣家州別",
        context: "採購團隊要抽查高價品項來自哪個賣家州別。",
        task: "JOIN order_items_raw 與 sellers_raw，選出 order_id、product_id、price、seller_state；依 price 由高到低取 20 列。",
        example: "上一題以 customer_id 串接；這題改用 seller_id。",
        expected: "4 欄、20 列；價格由高到低。",
        hints: ["先說出兩張表各一列代表什麼。", "共同 key 是 seller_id。", "排序欄是 order_items_raw.price。"],
        skills: ["INNER JOIN", "seller_id", "ORDER BY", "transfer"],
        referenceSql: "SELECT oi.order_id, oi.product_id, oi.price, s.seller_state FROM olist.order_items_raw oi INNER JOIN olist.sellers_raw s ON oi.seller_id = s.seller_id ORDER BY oi.price DESC, oi.order_id LIMIT 20",
        ordered: true, readinessDimension: "JOIN 與資料粒度",
      }),
      question({
        id: "ch02-q03", chapterId: "ch02", unit: "2.3", stage: "保留缺漏", title: "找出沒有評論的訂單",
        context: "客戶體驗團隊想知道哪些已送達訂單沒有評論。",
        task: "從 delivered 訂單出發，LEFT JOIN reviews，找出 review 的 order_id 為 NULL；輸出訂單 order_id 與購買時間，最新 20 筆。",
        example: "LEFT JOIN 保留左表全部資料，再用右表 key IS NULL 找未配對。",
        expected: "2 欄、最多 20 列；全部是沒有評論配對的 delivered 訂單。",
        hints: ["左表必須是 orders_raw。", "ON 使用 order_id。", "WHERE 同時包含 delivered 與右表 order_id IS NULL。"],
        skills: ["LEFT JOIN", "anti-join", "NULL", "missing records"],
        referenceSql: "SELECT o.order_id, o.order_purchase_timestamp FROM olist.orders_raw o LEFT JOIN olist.order_reviews_raw r ON o.order_id = r.order_id WHERE o.order_status = 'delivered' AND r.order_id IS NULL ORDER BY o.order_purchase_timestamp DESC LIMIT 20",
        ordered: true, readinessDimension: "JOIN 與資料粒度",
      }),
      question({
        id: "ch02-q04", chapterId: "ch02", unit: "2.4", stage: "多表串接", title: "商品品類英文名稱",
        context: "主管看不懂葡萄牙文品類，需要可讀的英文品類抽樣。",
        task: "從 order_items_raw 接 products_raw，再 LEFT JOIN translation；選出 order_id、product_id、product_category_name_english，依 order_id 取 25 列。",
        example: "先用 product_id 接商品，再用 product_category_name 接翻譯對照表。",
        expected: "3 欄、25 列；沒有翻譯的品類仍應保留。",
        hints: ["第一個 JOIN key 是 product_id。", "翻譯表要用 LEFT JOIN。", "第二個 key 是 product_category_name。"],
        skills: ["multiple JOINs", "lookup table", "LEFT JOIN", "COALESCE awareness"],
        referenceSql: "SELECT oi.order_id, oi.product_id, t.product_category_name_english FROM olist.order_items_raw oi INNER JOIN olist.products_raw p ON oi.product_id = p.product_id LEFT JOIN olist.product_category_translation_raw t ON p.product_category_name = t.product_category_name ORDER BY oi.order_id, oi.order_item_id LIMIT 25",
        ordered: true, readinessDimension: "JOIN 與資料粒度",
      }),
      question({
        id: "ch02-q05", chapterId: "ch02", unit: "2.5", stage: "JOIN 驗證", title: "確認 JOIN 後一張訂單變幾列",
        context: "財務報表金額突然變大，你要先證明訂單接明細後會因一對多關係增加列數。",
        task: "JOIN orders_raw 與 order_items_raw，依 order_id 分組，找出 item_row_count > 1 的訂單；輸出 order_id、item_row_count，最多 20 筆，筆數高的在前。",
        example: "JOIN 前先問 grain：orders 一列一單，items 一列一個品項。",
        expected: "2 欄；item_row_count 全部大於 1。",
        hints: ["JOIN 後以 order_id GROUP BY。", "COUNT(*) AS item_row_count。", "群組後條件使用 HAVING。"],
        skills: ["JOIN duplication", "GROUP BY", "HAVING", "reconciliation"],
        referenceSql: "SELECT o.order_id, COUNT(*) AS item_row_count FROM olist.orders_raw o INNER JOIN olist.order_items_raw oi ON o.order_id = oi.order_id GROUP BY o.order_id HAVING COUNT(*) > 1 ORDER BY item_row_count DESC, o.order_id LIMIT 20",
        ordered: true, readinessDimension: "JOIN 與資料粒度",
      }),
      question({
        id: "ch02-q06", chapterId: "ch02", unit: "2.6", stage: "章末白紙挑戰", title: "高營收賣家與所在地",
        context: "供應鏈主管想先看到商品銷售額最高的賣家及所在州。",
        task: "JOIN order_items_raw 與 sellers_raw；依 seller_id、seller_state 分組，計算 SUM(price) 為 item_revenue，取前 10 名。",
        example: "請先寫下 grain、key 與 metric，再開始 SQL。",
        expected: "3 欄、10 列；item_revenue 由高到低。",
        hints: ["一個賣家會有多筆訂單明細。", "以 seller_id、seller_state 分組。", "item_revenue = SUM(price)。"],
        skills: ["JOIN", "aggregation", "grain", "business metric", "independent"],
        referenceSql: "SELECT oi.seller_id, s.seller_state, SUM(oi.price) AS item_revenue FROM olist.order_items_raw oi INNER JOIN olist.sellers_raw s ON oi.seller_id = s.seller_id GROUP BY oi.seller_id, s.seller_state ORDER BY item_revenue DESC, oi.seller_id LIMIT 10",
        ordered: true, readinessDimension: "JOIN 與資料粒度",
      }),
    ],
  },
  {
    id: "ch03", order: 3, eyebrow: "CHAPTER 3", title: "Recurring Reporting · Define KPIs", subtitle: "入職第三週：建立固定管理報表",
    description: "定義 grain、分子、分母與期間，使用彙總、CTE 與 Window Functions 建立 Power BI 可直接使用的 KPI 資料表。",
    timeline: "入職第 3 週", mission: "把臨時查詢轉成每週或每月可重跑的管理指標。", deliverable: "KPI Database View＋Power BI 資料模型", toolFlow: "PostgreSQL KPI View → Power BI", readinessDimension: "分析型 SQL",
    questions: [
      question({id:"ch03-q01",chapterId:"ch03",unit:"3.1",stage:"示範後模仿",title:"付款方式結構",context:"財務想了解各付款方式的交易筆數與金額。",task:"依 payment_type 分組，計算 payment_count 與 total_payment_value；金額由高到低。",example:"GROUP BY 像 Excel 樞紐分析表：每個付款方式一列。",expected:"每種 payment_type 一列，包含筆數與總金額。",hints:["選 payment_type。","COUNT(*) 與 SUM(payment_value)。","GROUP BY payment_type。"],skills:["GROUP BY","COUNT","SUM","metric"],referenceSql:"SELECT payment_type, COUNT(*) AS payment_count, SUM(payment_value) AS total_payment_value FROM olist.order_payments_raw GROUP BY payment_type ORDER BY total_payment_value DESC, payment_type",ordered:true,readinessDimension:"分析型 SQL"}),
      question({id:"ch03-q02",chapterId:"ch03",unit:"3.2",stage:"相似題",title:"訂單狀態分布",context:"營運主管要比較不同訂單狀態的數量與占比前置資料。",task:"依 order_status 分組，計算 order_count；數量由高到低。",example:"沿用付款方式彙總的形狀，改成訂單狀態與 COUNT。",expected:"每個狀態一列，order_count 由高到低。",hints:["一列代表一種 order_status。","使用 COUNT(*)。","GROUP BY 與 ORDER BY。"],skills:["GROUP BY","COUNT","transfer"],referenceSql:"SELECT order_status, COUNT(*) AS order_count FROM olist.orders_raw GROUP BY order_status ORDER BY order_count DESC, order_status",ordered:true,readinessDimension:"分析型 SQL"}),
      question({id:"ch03-q03",chapterId:"ch03",unit:"3.3",stage:"CTE 分步",title:"每月已送達訂單數",context:"營運會議需要月度趨勢，不希望一段查詢難以驗證。",task:"使用 CTE 先取 delivered 訂單與月份，再按 month 分組計算 delivered_order_count，月份由舊到新。",example:"CTE 是具名的中繼步驟，可先單獨檢查。",expected:"每月一列；月份與訂單數由舊到新。",hints:["DATE_TRUNC('month', order_purchase_timestamp)。","CTE 中只保留 delivered。","外層 GROUP BY month。"],skills:["CTE","DATE_TRUNC","GROUP BY","trend"],referenceSql:"WITH delivered_orders AS (SELECT DATE_TRUNC('month', order_purchase_timestamp) AS month FROM olist.orders_raw WHERE order_status = 'delivered') SELECT month, COUNT(*) AS delivered_order_count FROM delivered_orders GROUP BY month ORDER BY month",ordered:true,readinessDimension:"分析型 SQL"}),
      question({id:"ch03-q04",chapterId:"ch03",unit:"3.4",stage:"Subquery",title:"高於平均售價的品項",context:"稽核想抽查價格高於全體平均的訂單品項。",task:"使用 Subquery 計算平均 price，選出高於平均的 order_id、product_id、price；價格由高到低取 20 列。",example:"內層先算一個平均值，外層用它做篩選。",expected:"3 欄、20 列；全部高於全表平均售價。",hints:["WHERE price > (...)。","括號內 SELECT AVG(price)。","最後 ORDER BY price DESC LIMIT 20。"],skills:["Subquery","AVG","comparison"],referenceSql:"SELECT order_id, product_id, price FROM olist.order_items_raw WHERE price > (SELECT AVG(price) FROM olist.order_items_raw) ORDER BY price DESC, order_id LIMIT 20",ordered:true,readinessDimension:"分析型 SQL"}),
      question({id:"ch03-q05",chapterId:"ch03",unit:"3.5",stage:"Window Ranking",title:"各付款方式中的高額付款排名",context:"財務想在每種付款方式內查看最高付款紀錄。",task:"使用 ROW_NUMBER()，依 payment_type 分區、payment_value 由高到低排名；每種付款方式保留前 3 名。",example:"Window Function 不會像 GROUP BY 把明細折疊。",expected:"每個 payment_type 最多 3 列，payment_rank 為 1–3。",hints:["先在 CTE 算 ROW_NUMBER。","PARTITION BY payment_type。","外層 WHERE payment_rank <= 3。"],skills:["ROW_NUMBER","OVER","PARTITION BY","Top N"],referenceSql:"WITH ranked AS (SELECT payment_type, order_id, payment_value, ROW_NUMBER() OVER (PARTITION BY payment_type ORDER BY payment_value DESC, order_id) AS payment_rank FROM olist.order_payments_raw) SELECT payment_type, order_id, payment_value, payment_rank FROM ranked WHERE payment_rank <= 3 ORDER BY payment_type, payment_rank",ordered:true,readinessDimension:"分析型 SQL"}),
      question({id:"ch03-q06",chapterId:"ch03",unit:"3.6",stage:"章末白紙挑戰",title:"月營收與月增率",context:"主管要判斷營收趨勢，並比較每月與上月差異。",task:"以 order_items 的 price 計算月營收；使用 CTE 與 LAG 產出 month、revenue、previous_month_revenue、growth_rate，月份由舊到新。",example:"先得到每月一列，再在下一層使用 LAG。",expected:"每月一列；第一月前期值為 NULL，其後有成長率。",hints:["先把 orders 與 items JOIN。","CTE 內依 DATE_TRUNC 月份 SUM(price)。","growth_rate = (revenue - previous) / previous。"],skills:["CTE","LAG","growth rate","JOIN","independent"],referenceSql:"WITH monthly AS (SELECT DATE_TRUNC('month', o.order_purchase_timestamp) AS month, SUM(oi.price) AS revenue FROM olist.orders_raw o INNER JOIN olist.order_items_raw oi ON o.order_id = oi.order_id GROUP BY 1), compared AS (SELECT month, revenue, LAG(revenue) OVER (ORDER BY month) AS previous_month_revenue FROM monthly) SELECT month, revenue, previous_month_revenue, ROUND((revenue - previous_month_revenue) / NULLIF(previous_month_revenue, 0) * 100, 2) AS growth_rate FROM compared ORDER BY month",ordered:true,readinessDimension:"分析型 SQL"}),
    ],
  },
  {
    id:"ch04",order:4,eyebrow:"CHAPTER 4",title:"Business Investigation · Find What Changed",subtitle:"入職第一個月：調查真實營運問題",description:"從主管的問題出發定義 KPI、縮小異常範圍、驗證候選原因，並清楚分開證據、推論與限制。",timeline:"入職第 1 個月",mission:"調查遲交、低評價與賣家風險，提出有證據且可行動的建議。",deliverable:"營運調查 Brief＋驗證附錄",toolFlow:"SQL evidence → Pandas（需要時）→ 主管 Brief",readinessDimension:"商業分析與驗證",
    questions:[
      question({id:"ch04-q01",chapterId:"ch04",unit:"4.1",stage:"KPI 定義",title:"各州準時交貨率",context:"供應鏈主管要比較客戶州別的 On-Time Delivery。",task:"只看 delivered 且有實際與預計日期的訂單；按 customer_state 計算 delivered_orders 與 on_time_rate，至少 100 單，準時率低的在前。",example:"先定義分母、分子、範圍與日期，再寫 SQL。",expected:"每州一列；on_time_rate 是百分比。",hints:["orders JOIN customers。","準時條件：實際送達 <= 預計送達。","AVG(CASE WHEN ... THEN 1.0 ELSE 0 END) * 100。"],skills:["KPI definition","CASE","AVG","JOIN","scope"],referenceSql:"SELECT c.customer_state, COUNT(*) AS delivered_orders, ROUND(AVG(CASE WHEN o.order_delivered_customer_date <= o.order_estimated_delivery_date THEN 1.0 ELSE 0 END) * 100, 2) AS on_time_rate FROM olist.orders_raw o INNER JOIN olist.customers_raw c ON o.customer_id = c.customer_id WHERE o.order_status = 'delivered' AND o.order_delivered_customer_date IS NOT NULL AND o.order_estimated_delivery_date IS NOT NULL GROUP BY c.customer_state HAVING COUNT(*) >= 100 ORDER BY on_time_rate, c.customer_state",ordered:true,readinessDimension:"商業分析與驗證"}),
      question({id:"ch04-q02",chapterId:"ch04",unit:"4.2",stage:"相似 KPI",title:"賣家層級的遲交風險",context:"營運想找出訂單量夠大、遲交率偏高的賣家。",task:"將 delivered 訂單接 items；依 seller_id 計算 order_count 與 late_rate，至少 50 個不同訂單，遲交率高的前 15 名。",example:"沿用準時率概念，但注意一張訂單可能多個品項，要 COUNT(DISTINCT order_id)。",expected:"3 欄、15 列；order_count 至少 50。",hints:["orders JOIN items。","分母使用 DISTINCT order_id。","遲交條件是實際日期 > 預計日期。"],skills:["KPI","COUNT DISTINCT","JOIN duplication","risk"],referenceSql:"SELECT oi.seller_id, COUNT(DISTINCT o.order_id) AS order_count, ROUND(COUNT(DISTINCT CASE WHEN o.order_delivered_customer_date > o.order_estimated_delivery_date THEN o.order_id END)::numeric / NULLIF(COUNT(DISTINCT o.order_id), 0) * 100, 2) AS late_rate FROM olist.orders_raw o INNER JOIN olist.order_items_raw oi ON o.order_id = oi.order_id WHERE o.order_status = 'delivered' AND o.order_delivered_customer_date IS NOT NULL AND o.order_estimated_delivery_date IS NOT NULL GROUP BY oi.seller_id HAVING COUNT(DISTINCT o.order_id) >= 50 ORDER BY late_rate DESC, order_count DESC, oi.seller_id LIMIT 15",ordered:true,readinessDimension:"商業分析與驗證"}),
      question({id:"ch04-q03",chapterId:"ch04",unit:"4.3",stage:"客戶分析",title:"重複購買客戶與訂單數",context:"Customer team 想知道哪些真實客戶曾多次下單。",task:"JOIN customers 與 orders，依 customer_unique_id 計算 order_count；只保留超過 1 單的客戶，前 20 名。",example:"customer_id 每張訂單不同；跨訂單辨識同一人要使用 customer_unique_id。",expected:"2 欄；order_count 全部大於 1。",hints:["customers 是客戶識別來源。","以 customer_unique_id GROUP BY。","HAVING COUNT(*) > 1。"],skills:["customer grain","HAVING","repeat customer"],referenceSql:"SELECT c.customer_unique_id, COUNT(*) AS order_count FROM olist.customers_raw c INNER JOIN olist.orders_raw o ON c.customer_id = o.customer_id GROUP BY c.customer_unique_id HAVING COUNT(*) > 1 ORDER BY order_count DESC, c.customer_unique_id LIMIT 20",ordered:true,readinessDimension:"商業分析與驗證"}),
      question({id:"ch04-q04",chapterId:"ch04",unit:"4.4",stage:"資料品質",title:"檢查重複付款序號",context:"財務報表前要確認同一訂單的 payment_sequential 是否重複。",task:"依 order_id、payment_sequential 分組，找出 duplicate_count > 1 的組合；重複筆數高的在前。",example:"先定義什麼欄位組合應該唯一，再做 GROUP BY 對帳。",expected:"3 欄；若資料乾淨可能回傳 0 列。",hints:["唯一性組合有兩個欄位。","COUNT(*) AS duplicate_count。","HAVING COUNT(*) > 1。"],skills:["data quality","duplicate","reconciliation"],referenceSql:"SELECT order_id, payment_sequential, COUNT(*) AS duplicate_count FROM olist.order_payments_raw GROUP BY order_id, payment_sequential HAVING COUNT(*) > 1 ORDER BY duplicate_count DESC, order_id, payment_sequential",ordered:true,readinessDimension:"商業分析與驗證"}),
      question({id:"ch04-q05",chapterId:"ch04",unit:"4.5",stage:"洞察與限制",title:"遲交與評論分數",context:"主管懷疑遲交會降低評分，但你需要先提供描述性證據，不能直接宣稱因果。",task:"把 delivered 訂單分成 on_time／late，JOIN reviews，計算每組 review_count 與 avg_review_score。",example:"查詢只能顯示關聯；結論需註明不能證明因果。",expected:"每個 delivery_group 一列，包含評論數與平均分數。",hints:["CASE 建 delivery_group。","orders JOIN reviews。","GROUP BY CASE 結果。"],skills:["insight","assumption","limitation","CASE","AVG"],referenceSql:"SELECT CASE WHEN o.order_delivered_customer_date <= o.order_estimated_delivery_date THEN 'on_time' ELSE 'late' END AS delivery_group, COUNT(*) AS review_count, ROUND(AVG(r.review_score), 2) AS avg_review_score FROM olist.orders_raw o INNER JOIN olist.order_reviews_raw r ON o.order_id = r.order_id WHERE o.order_status = 'delivered' AND o.order_delivered_customer_date IS NOT NULL AND o.order_estimated_delivery_date IS NOT NULL GROUP BY 1 ORDER BY delivery_group",ordered:true,readinessDimension:"商業分析與驗證"}),
      question({id:"ch04-q06",chapterId:"ch04",unit:"4.6",stage:"章末商業 Case",title:"哪些品類帶動已送達營收",context:"主管要知道已送達訂單中營收最高的英文商品品類。",task:"串接 orders、items、products、translation；計算 item_revenue 與 order_count，取前 15 個品類，沒有翻譯以 'untranslated' 顯示。",example:"先寫 KPI 定義：item_revenue 是 SUM(price)，不是 profit。",expected:"3 欄、15 列；item_revenue 由高到低。",hints:["以 orders 過濾 delivered。","translation 使用 LEFT JOIN＋COALESCE。","order_count 用 COUNT(DISTINCT order_id)。"],skills:["business case","multiple JOINs","KPI","COALESCE","validation"],referenceSql:"SELECT COALESCE(t.product_category_name_english, 'untranslated') AS category, SUM(oi.price) AS item_revenue, COUNT(DISTINCT o.order_id) AS order_count FROM olist.orders_raw o INNER JOIN olist.order_items_raw oi ON o.order_id = oi.order_id INNER JOIN olist.products_raw p ON oi.product_id = p.product_id LEFT JOIN olist.product_category_translation_raw t ON p.product_category_name = t.product_category_name WHERE o.order_status = 'delivered' GROUP BY 1 ORDER BY item_revenue DESC, category LIMIT 15",ordered:true,readinessDimension:"商業分析與驗證"}),
    ],
  },
  {
    id:"ch05",order:5,eyebrow:"CHAPTER 5",title:"Independent Delivery · Analyst Simulation",subtitle:"獨立交付：從需求做到 Dashboard",description:"接收模糊需求、確認口徑、建立資料集、驗證、製作 Power BI Dashboard，最後寫主管摘要並保留完整證據。",timeline:"獨立工作模擬",mission:"完成一份可以重跑、可以解釋、可以交給主管使用的分析產品。",deliverable:"Power BI Dashboard＋主管摘要＋SQL 證據包",toolFlow:"SQL dataset → Power BI → Executive summary",readinessDimension:"工作模擬與溝通",
    questions:[
      question({id:"ch05-q01",chapterId:"ch05",unit:"5.1",stage:"需求拆解",title:"Q2 遲交是否增加",context:"主管只說：『Q2 遲交好像增加了，請查一下。』你需要把它改成可驗證的月度問題。",task:"只看 delivered；按月份計算 delivered_orders、late_orders、late_rate，輸出 2018-01 至 2018-06，月份由舊到新。",example:"先明確定義 Q2、遲交、分母與比較期間。",expected:"2018 上半年每月一列，包含完整 KPI 元件。",hints:["日期範圍使用 >= 2018-01-01 且 < 2018-07-01。","COUNT(CASE WHEN ...)。","late_rate 分母是 delivered 訂單。"],skills:["requirement intake","KPI","date scope","validation"],referenceSql:"SELECT DATE_TRUNC('month', order_purchase_timestamp) AS month, COUNT(*) AS delivered_orders, COUNT(CASE WHEN order_delivered_customer_date > order_estimated_delivery_date THEN 1 END) AS late_orders, ROUND(COUNT(CASE WHEN order_delivered_customer_date > order_estimated_delivery_date THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) AS late_rate FROM olist.orders_raw WHERE order_status = 'delivered' AND order_purchase_timestamp >= '2018-01-01' AND order_purchase_timestamp < '2018-07-01' AND order_delivered_customer_date IS NOT NULL AND order_estimated_delivery_date IS NOT NULL GROUP BY 1 ORDER BY month",ordered:true,readinessDimension:"工作模擬與溝通"}),
      question({id:"ch05-q02",chapterId:"ch05",unit:"5.2",stage:"相似診斷",title:"Q2 遲交集中在哪些州",context:"主管看到整體趨勢後，追問問題集中在哪些客戶州別。",task:"計算 2018 Q2 各 customer_state 的 delivered_orders、late_orders、late_rate；至少 100 單，遲交率高的前 10 名。",example:"沿用上一題 KPI，新增 customers JOIN 與州別分組。",expected:"4 欄、最多 10 列；單量至少 100。",hints:["orders JOIN customers。","日期範圍是 2018-04-01 到 2018-07-01 前。","HAVING COUNT(*) >= 100。"],skills:["drill-down","JOIN","KPI transfer","stakeholder follow-up"],referenceSql:"SELECT c.customer_state, COUNT(*) AS delivered_orders, COUNT(CASE WHEN o.order_delivered_customer_date > o.order_estimated_delivery_date THEN 1 END) AS late_orders, ROUND(COUNT(CASE WHEN o.order_delivered_customer_date > o.order_estimated_delivery_date THEN 1 END)::numeric / NULLIF(COUNT(*), 0) * 100, 2) AS late_rate FROM olist.orders_raw o INNER JOIN olist.customers_raw c ON o.customer_id = c.customer_id WHERE o.order_status = 'delivered' AND o.order_purchase_timestamp >= '2018-04-01' AND o.order_purchase_timestamp < '2018-07-01' AND o.order_delivered_customer_date IS NOT NULL AND o.order_estimated_delivery_date IS NOT NULL GROUP BY c.customer_state HAVING COUNT(*) >= 100 ORDER BY late_rate DESC, delivered_orders DESC, c.customer_state LIMIT 10",ordered:true,readinessDimension:"工作模擬與溝通"}),
      question({id:"ch05-q03",chapterId:"ch05",unit:"5.3",stage:"根因候選",title:"高遲交州的賣家風險",context:"你需要把地區發現往可行動的賣家層級拆解。",task:"針對 customer_state = 'SP' 的 2018 Q2 delivered 訂單，依 seller_id 計算 order_count 與 late_rate；至少 20 單，取遲交率前 15 名。",example:"這是診斷候選，不代表賣家一定造成遲交；需在結論寫限制。",expected:"3 欄、最多 15 列；order_count 至少 20。",hints:["orders → customers 與 orders → items。","COUNT(DISTINCT order_id) 防止多品項放大。","分子也要 DISTINCT order_id。"],skills:["root-cause candidate","COUNT DISTINCT","limitation","seller performance"],referenceSql:"SELECT oi.seller_id, COUNT(DISTINCT o.order_id) AS order_count, ROUND(COUNT(DISTINCT CASE WHEN o.order_delivered_customer_date > o.order_estimated_delivery_date THEN o.order_id END)::numeric / NULLIF(COUNT(DISTINCT o.order_id), 0) * 100, 2) AS late_rate FROM olist.orders_raw o INNER JOIN olist.customers_raw c ON o.customer_id = c.customer_id INNER JOIN olist.order_items_raw oi ON o.order_id = oi.order_id WHERE o.order_status = 'delivered' AND c.customer_state = 'SP' AND o.order_purchase_timestamp >= '2018-04-01' AND o.order_purchase_timestamp < '2018-07-01' AND o.order_delivered_customer_date IS NOT NULL AND o.order_estimated_delivery_date IS NOT NULL GROUP BY oi.seller_id HAVING COUNT(DISTINCT o.order_id) >= 20 ORDER BY late_rate DESC, order_count DESC, oi.seller_id LIMIT 15",ordered:true,readinessDimension:"工作模擬與溝通"}),
      question({id:"ch05-q04",chapterId:"ch05",unit:"5.4",stage:"正式驗證",title:"交付前的對帳表",context:"主管摘要送出前，你需要一張按月的對帳表證明分子不超過分母、日期缺漏可見。",task:"按月份輸出 delivered_orders、complete_date_orders、late_orders；涵蓋 2018 上半年。",example:"專業分析師會保留驗證查詢，而不是只留下最後一張漂亮報表。",expected:"每月一列；complete_date_orders <= delivered_orders，late_orders <= complete_date_orders。",hints:["三個 COUNT 使用不同 CASE。","月份來自 order_purchase_timestamp。","只過濾 delivered 與日期範圍，不先排除 NULL。"],skills:["validation","reconciliation","audit trail"],referenceSql:"SELECT DATE_TRUNC('month', order_purchase_timestamp) AS month, COUNT(*) AS delivered_orders, COUNT(CASE WHEN order_delivered_customer_date IS NOT NULL AND order_estimated_delivery_date IS NOT NULL THEN 1 END) AS complete_date_orders, COUNT(CASE WHEN order_delivered_customer_date > order_estimated_delivery_date THEN 1 END) AS late_orders FROM olist.orders_raw WHERE order_status = 'delivered' AND order_purchase_timestamp >= '2018-01-01' AND order_purchase_timestamp < '2018-07-01' GROUP BY 1 ORDER BY month",ordered:true,readinessDimension:"工作模擬與溝通"}),
      question({id:"ch05-q05",chapterId:"ch05",unit:"5.5",stage:"作品集證據",title:"建立可重跑的主管摘要資料集",context:"你要把分析整理成作品集可重跑的核心結果。",task:"使用 CTE 產出 2018 Q2 各州遲交率、平均評論分數與訂單數；至少 100 單，遲交率高的前 10 名。",example:"查詢要分步命名，讓 reviewer 能逐段執行與檢查。",expected:"customer_state、order_count、late_rate、avg_review_score 四欄。",hints:["第一個 CTE 建立訂單層級資料。","reviews 可能缺少，使用 LEFT JOIN。","外層州別彙總。"],skills:["portfolio SQL","CTE","reviewability","executive dataset"],referenceSql:"WITH order_level AS (SELECT o.order_id, c.customer_state, CASE WHEN o.order_delivered_customer_date > o.order_estimated_delivery_date THEN 1 ELSE 0 END AS is_late, r.review_score FROM olist.orders_raw o INNER JOIN olist.customers_raw c ON o.customer_id = c.customer_id LEFT JOIN olist.order_reviews_raw r ON o.order_id = r.order_id WHERE o.order_status = 'delivered' AND o.order_purchase_timestamp >= '2018-04-01' AND o.order_purchase_timestamp < '2018-07-01' AND o.order_delivered_customer_date IS NOT NULL AND o.order_estimated_delivery_date IS NOT NULL) SELECT customer_state, COUNT(DISTINCT order_id) AS order_count, ROUND(AVG(is_late) * 100, 2) AS late_rate, ROUND(AVG(review_score), 2) AS avg_review_score FROM order_level GROUP BY customer_state HAVING COUNT(DISTINCT order_id) >= 100 ORDER BY late_rate DESC, customer_state LIMIT 10",ordered:true,readinessDimension:"工作模擬與溝通"}),
      question({id:"ch05-q06",chapterId:"ch05",unit:"5.6",stage:"Entry-Level 最終模擬",title:"完整供應鏈績效 Case",context:"最終任務：向主管說明 2018 Q2 遲交、營收與評分的交叉情況，並留下可驗證的 SQL。",task:"按 customer_state 產出 order_count、item_revenue、late_rate、avg_review_score；至少 100 單，item_revenue 由高到低取 10 州。",example:"完成後的反思必須分開寫：證據、推論、限制、下一步。",expected:"5 欄、10 列；使用正確 grain 避免 reviews 與 items 造成重複。",hints:["先各自在訂單層級彙總 items 與 reviews，再串回 orders。","一張訂單先變成一列，再做州別 KPI。","最後驗證 order_count 與營收是否合理。"],skills:["job simulation","grain control","multi-CTE","KPI","executive communication","independent"],referenceSql:"WITH item_totals AS (SELECT order_id, SUM(price) AS item_revenue FROM olist.order_items_raw GROUP BY order_id), review_scores AS (SELECT order_id, AVG(review_score) AS review_score FROM olist.order_reviews_raw GROUP BY order_id), order_level AS (SELECT o.order_id, c.customer_state, it.item_revenue, CASE WHEN o.order_delivered_customer_date > o.order_estimated_delivery_date THEN 1 ELSE 0 END AS is_late, rs.review_score FROM olist.orders_raw o INNER JOIN olist.customers_raw c ON o.customer_id = c.customer_id INNER JOIN item_totals it ON o.order_id = it.order_id LEFT JOIN review_scores rs ON o.order_id = rs.order_id WHERE o.order_status = 'delivered' AND o.order_purchase_timestamp >= '2018-04-01' AND o.order_purchase_timestamp < '2018-07-01' AND o.order_delivered_customer_date IS NOT NULL AND o.order_estimated_delivery_date IS NOT NULL) SELECT customer_state, COUNT(*) AS order_count, SUM(item_revenue) AS item_revenue, ROUND(AVG(is_late) * 100, 2) AS late_rate, ROUND(AVG(review_score), 2) AS avg_review_score FROM order_level GROUP BY customer_state HAVING COUNT(*) >= 100 ORDER BY item_revenue DESC, customer_state LIMIT 10",ordered:true,readinessDimension:"工作模擬與溝通"}),
    ],
  },
];

const chapters = chapterSeed.map((chapter) => ({
  ...chapter,
  ...chapterPrograms[chapter.id],
}));

const questions = chapters.flatMap((chapter) => chapter.questions);
const questionById = new Map(questions.map((item) => [item.id, item]));

export function getQuestion(questionId) {
  return questionById.get(questionId) ?? null;
}

export function getQuestions() {
  return questions;
}

export function getChapters() {
  return chapters;
}

export function getCareerFramework() {
  return careerFramework;
}

export function publicQuestion(item) {
  const {
    referenceSql: _referenceSql,
    solution: _solution,
    compare: _compare,
    ordered: _ordered,
    ...safe
  } = item;
  return safe;
}
