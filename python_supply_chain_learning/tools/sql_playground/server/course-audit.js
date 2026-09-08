// A product coverage audit, never a student score or a claimed number of hours.
export function courseAudit(catalog) {
  const counts = Object.fromEntries(["sql", "python", "powerbi"].map((tool) => [tool, catalog.activities.filter((a) => a.tool === tool).length]));
  return { reviewedAt: "2026-09-06", counts,
    verdict: "尚未符合完整 100 小時、SQL＋pandas＋Power BI 的入門分析師訓練要求。目前是 CH1 試學版本，不是完整課程。",
    criteria: [
      { id: "foundations", title: "零基礎也知道第一步", state: "第一單元試學", present: "第一單元從目錄、欄位、樣本接到計數示範／修錯／變形，以及 pandas 交接；另有三個複習變形題。", gap: "CH1 後五個單元仍需按同樣標準补前置觀念與概念練習鏈，並以學習者實際試學修訂。" },
      { id: "practice", title: "足夠且有變化的練習", state: "不足", present: "SQL 有陪跑、修錯與獨立題，但以單元配置，不是每個概念都有完整練習鏈。", gap: "按核心能力補不同條件、邊界案例、混合需求與隔日複習；pandas 缺少完整修錯／無提示梯度。" },
      { id: "sql", title: "能處理公司的分析問題", state: "未完整", present: "新版主要涵蓋單表探索、篩選、計數、缺值與分類。", gap: "CH2–CH5 的 JOIN／粒度對帳、GROUP BY／CTE／Window、KPI／異常調查及陌生資料專案仍待實作；舊範例不能抵算新版已完成。" },
      { id: "handoff", title: "三種工具有真正交接", state: "僅初步", present: "已有小樣本 SQL → 瀏覽器 pandas、CSV → Power BI 操作與數字對帳。", gap: "pandas 合併／分組／重塑／日期整理；Power Query、關聯模型、日期表／DAX 與更新失敗處理；完整資料口徑對帳及報表審查。" },
      { id: "evidence", title: "能獨立交付，而非照抄", state: "待建立驗收", present: "程式、成功／錯誤、協助與資料來源已有帳號紀錄。", gap: "標準化口頭解釋、無提示新題、可重跑完整專案、跨工具驗證及實際投入量的試學；結果比對與 BI 自報數字不是獨立能力證據。" },
    ] };
}
