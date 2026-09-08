// A worked example, not a student's completed assignment or a parallel course.
const scopeWhere = `order_status = 'delivered'
  AND order_purchase_timestamp >= '2018-01-01'
  AND order_purchase_timestamp < '2018-07-01'`;

const orderLevel = `WITH item_totals AS (
  SELECT
    order_id,
    COUNT(*) AS item_count,
    SUM(price) AS item_value
  FROM olist.order_items_raw
  GROUP BY order_id
), order_level AS (
  SELECT
    o.order_id,
    c.customer_state,
    it.item_count,
    it.item_value,
    CASE
      WHEN o.order_delivered_customer_date IS NULL
        OR o.order_estimated_delivery_date IS NULL THEN NULL
      WHEN o.order_delivered_customer_date::date
        > o.order_estimated_delivery_date::date THEN 1
      ELSE 0
    END AS is_late
  FROM olist.orders_raw AS o
  LEFT JOIN olist.customers_raw AS c
    ON o.customer_id = c.customer_id
  LEFT JOIN item_totals AS it
    ON o.order_id = it.order_id
  WHERE o.${scopeWhere.replaceAll('\n  AND ', '\n    AND o.')}
)`;

const steps = [
  {
    id: "inventory", stage: "先認識資料", title: "我剛到職：先看有哪些資料表",
    tags: ["SELECT", "COUNT", "GROUP BY", "資料探索"],
    purpose: "主管問：哪些地區的配送需要優先追查？我還不知道資料長什麼樣，先盤點可用資料，不能直接猜表名開始 JOIN。",
    why: "information_schema 是資料庫的目錄，像 Excel 活頁簿的工作表清單。先看目錄不會讀取大量交易內容。COUNT 在這裡數的是欄位，不是交易筆數。",
    sql: `SELECT
  table_name,
  COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_schema = 'olist'
GROUP BY table_name
ORDER BY table_name
LIMIT 50;`,
    read: "先辨認 orders、customers、order_items 等命名線索；名字只是線索，還不能宣稱每張表各一列代表什麼。",
    verify: "這是目前帳號可看到的表格目錄，不等於公司所有資料。若缺少預期表，先確認權限與來源，不要當成零筆交易。",
    decision: "下一步選 orders、customers、order_items 看欄位與型別，再向資料負責人確認定義。",
  },
  {
    id: "columns", stage: "先認識資料", title: "看欄位、型別，寫下還不知道的定義",
    tags: ["SELECT", "WHERE", "ORDER BY", "資料探索"],
    purpose: "我需要知道怎麼識別訂單、用哪個日期、客戶在哪裡，以及金額存在哪張表。",
    why: "資料字典比猜測可靠。data_type（資料型別）告訴我日期能不能比較、金額能不能加總；ordinal_position 保留原始欄位順序。",
    sql: `SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'olist'
  AND table_name IN ('orders_raw', 'customers_raw', 'order_items_raw')
ORDER BY table_name, ordinal_position
LIMIT 100;`,
    read: "記下 order_id、customer_id、預計／實際送達日期與 price 的位置。is_nullable 是結構允許 NULL，不代表現在真的有缺值。",
    verify: "向負責人確認日期時區、預計日期是截止日還是精確時刻、price 的幣別及是否含稅。不能僅靠欄名推定。",
    decision: "本 Demo 暫定按日期（不是精確時刻）判斷晚到；商品金額不含運費，也不宣稱是淨營收或利潤。",
  },
  {
    id: "sample", stage: "先認識資料", title: "只抽 10 列：把抽象欄位變成具體紀錄",
    tags: ["SELECT", "ORDER BY", "LIMIT", "資料探索"],
    purpose: "像打開新 Excel 先看幾列，我先確認狀態值和日期實際長相。",
    why: "明列欄位讓結果容易讀；LIMIT 限制傳回筆數，ORDER BY 讓同一份資料重跑時容易對照。這不是隨機抽樣。",
    sql: `SELECT
  order_id,
  customer_id,
  order_status,
  order_purchase_timestamp,
  order_delivered_customer_date,
  order_estimated_delivery_date
FROM olist.orders_raw
ORDER BY order_id
LIMIT 10;`,
    read: "看一列能否描述一張訂單，以及 NULL 如何顯示。先記錄長相，不計算這 10 列的延遲率來代表全公司。",
    verify: "抽樣沒看到缺值或重複，不代表全表沒有；後面必須做全表彙總檢查。",
    decision: "接著驗證 grain（資料粒度：一列代表什麼）與資料涵蓋期間。",
  },
  {
    id: "order-grain", stage: "確認能不能信", title: "訂單主表真的是一張訂單一列嗎？",
    tags: ["SELECT", "COUNT", "DISTINCT", "MIN", "MAX", "資料品質"],
    purpose: "如果訂單主表本身重複，之後的訂單數、比例與 JOIN 都可能出錯。",
    why: "COUNT(*) 數所有資料列；COUNT(order_id) 不算 NULL；COUNT(DISTINCT order_id) 數不同且非 NULL 的訂單。三者要分開比較。",
    sql: `SELECT
  COUNT(*) AS row_count,
  COUNT(DISTINCT order_id) AS unique_orders,
  COUNT(*) - COUNT(order_id) AS null_order_ids,
  COUNT(order_id) - COUNT(DISTINCT order_id) AS extra_order_rows,
  COUNT(*) - COUNT(order_purchase_timestamp) AS missing_purchase_dates,
  MIN(order_purchase_timestamp) AS first_purchase,
  MAX(order_purchase_timestamp) AS last_purchase
FROM olist.orders_raw;`,
    read: "先確認 null_order_ids、extra_order_rows 都是 0，再把一列當成一張訂單。用最早／最晚時間確認這是歷史資料，而非即時營運。",
    verify: "若訂單鍵缺漏或重複，停下來查來源與版本，不要用 DISTINCT 把問題蓋掉。最早／最晚日期不能證明中間每天都有完整資料。",
    decision: "若期間涵蓋 2018 上半年，Demo 用這個封閉區間做範例；未涵蓋時應修改範圍，不要硬套。",
  },
  {
    id: "customer-grain", stage: "確認能不能信", title: "JOIN 前先查客戶鍵，避免訂單被複製",
    tags: ["SELECT", "COUNT", "DISTINCT", "資料品質", "JOIN 前檢查"],
    purpose: "orders 要透過 customer_id 找到州別；右表同一個 key 如果有多列，一張訂單就會被放大。",
    why: "主鍵唯一性是 JOIN 的前提。customer_id 與 customer_unique_id 不是同一件事；本專案按訂單外鍵 customer_id 串接，不把它當成不重複的人數。",
    sql: `SELECT
  COUNT(*) AS row_count,
  COUNT(DISTINCT customer_id) AS unique_customer_ids,
  COUNT(*) - COUNT(customer_id) AS null_customer_ids,
  COUNT(customer_id) - COUNT(DISTINCT customer_id) AS extra_customer_rows,
  COUNT(*) - COUNT(customer_state) AS missing_states
FROM olist.customers_raw;`,
    read: "extra_customer_rows 與 null_customer_ids 為 0 才支持目前的串接設計。州別 NULL 要另外揭露，不能默默排除。",
    verify: "即使客戶鍵唯一，也還沒證明每張訂單都找得到客戶；下一階段要查未匹配。",
    decision: "若鍵不唯一，先找出同 key 的多列並確認業務規則，再往後跑報表。",
  },
  {
    id: "status-quality", stage: "確認能不能信", title: "狀態與日期缺漏：先把分母定義清楚",
    tags: ["SELECT", "GROUP BY", "COUNT", "SUM", "CASE", "資料品質"],
    purpose: "取消訂單不應被當成晚到；尚未送達與缺日期也不能被當成準時。",
    why: "GROUP BY 像樞紐分析表，一個狀態一列。CASE 把條件轉成 1 或 0，SUM 就能數出符合條件的資料。",
    sql: `SELECT
  order_status,
  COUNT(*) AS orders,
  SUM(CASE WHEN order_delivered_customer_date IS NULL
    OR order_estimated_delivery_date IS NULL THEN 1 ELSE 0 END) AS missing_delivery_dates,
  SUM(CASE WHEN order_delivered_customer_date < order_purchase_timestamp
    THEN 1 ELSE 0 END) AS delivered_before_purchase
FROM olist.orders_raw
GROUP BY order_status
ORDER BY orders DESC, order_status;`,
    read: "把未完成狀態的缺值與 delivered 狀態的缺值分開看。delivered_before_purchase 是異常線索，不是自動刪除的理由。",
    verify: "若出現送達早於下單，先核對時區或來源。本 Demo 不自動修正或刪除原始資料。",
    decision: "延遲率分母定為已送達且兩個日期完整的訂單；缺日期數另外保留。",
  },
  {
    id: "items-grain", stage: "安全串接", title: "一張訂單有幾個品項？先理解一對多",
    tags: ["SELECT", "GROUP BY", "HAVING", "COUNT", "SUM", "LIMIT", "JOIN 前檢查"],
    purpose: "主管也想看商品金額，但直接把訂單與品項明細串起來，會讓有多個品項的訂單重複出現。",
    why: "GROUP BY 先依 order_id 彙總；HAVING 在彙總後篩選，這裡找出多品項訂單作為一對多的證據。WHERE 是彙總前篩選，兩者不能交換。",
    sql: `SELECT
  order_id,
  COUNT(*) AS item_rows,
  SUM(price) AS item_value
FROM olist.order_items_raw
GROUP BY order_id
HAVING COUNT(*) > 1
ORDER BY item_rows DESC, order_id
LIMIT 20;`,
    read: "item_rows 大於 1 可能是正常訂單結構，不等於髒資料。這裡的商品金額不包含 freight_value。",
    verify: "這只是最多 20 張多品項訂單，不是全體分布；若要檢查明細重複，還要確認 (order_id, order_item_id) 的業務鍵。",
    decision: "後面的金額先用 CTE 彙總成每張訂單一列，再 JOIN 回訂單主表。",
  },
  {
    id: "join-sample", stage: "安全串接", title: "用 LEFT JOIN 保留找不到州別的訂單",
    tags: ["SELECT", "JOIN", "LEFT JOIN", "LIMIT", "資料串接"],
    purpose: "我需要每張訂單的州別，也要知道有沒有找不到對應客戶的訂單。",
    why: "LEFT JOIN 保留左表所有訂單，找不到的右表欄位顯示 NULL。INNER JOIN 會直接排掉未匹配訂單，容易把品質問題藏起來。AS o、AS c 是表格別名。",
    sql: `SELECT
  o.order_id,
  o.customer_id,
  c.customer_state,
  CASE WHEN c.customer_id IS NULL THEN 1 ELSE 0 END AS unmatched_customer
FROM olist.orders_raw AS o
LEFT JOIN olist.customers_raw AS c
  ON o.customer_id = c.customer_id
ORDER BY o.order_id
LIMIT 20;`,
    read: "ON 定義用哪個欄位對接。unmatched_customer 為 1 才表示沒匹配到客戶；州別 NULL 也可能是已匹配但該欄缺值。",
    verify: "先確定第 4、5 步鍵檢查通過。這 20 列看起來正常仍不足以證明全表 JOIN 正確。",
    decision: "下一步對整個分析期間驗證 JOIN 前後列數與未匹配數。",
  },
  {
    id: "join-audit", stage: "安全串接", title: "JOIN 後對帳：沒有放大，也沒有偷偷掉單",
    tags: ["SELECT", "CTE", "JOIN", "LEFT JOIN", "COUNT", "DISTINCT", "CASE", "對帳"],
    purpose: "在報 KPI 以前，證明輸出仍然是一張訂單一列，並揭露找不到州別的資料。",
    why: "CTE（WITH，具名的中繼查詢）先定義同一批訂單，再比較原始範圍與 JOIN 結果。日期用大於等於起日、小於下一期起日，包含 6 月 30 日所有時刻。",
    sql: `WITH scope_orders AS (
  SELECT order_id, customer_id
  FROM olist.orders_raw
  WHERE ${scopeWhere}
)
SELECT
  (SELECT COUNT(*) FROM scope_orders) AS base_orders,
  COUNT(*) AS joined_rows,
  COUNT(DISTINCT o.order_id) AS unique_orders,
  SUM(CASE WHEN c.customer_id IS NULL THEN 1 ELSE 0 END) AS unmatched_customers,
  SUM(CASE WHEN c.customer_state IS NULL THEN 1 ELSE 0 END) AS unknown_states
FROM scope_orders AS o
LEFT JOIN olist.customers_raw AS c
  ON o.customer_id = c.customer_id;`,
    read: "base_orders、joined_rows、unique_orders 應一致；若不同，停止交付。unknown_states 是要披露的品質指標。",
    verify: "LEFT JOIN 沒掉左表資料不代表不會放大，三個計數都需要。若 base_orders 是 0，先檢查期間，不要交付空報表。",
    decision: "只有 grain 檢查成立才進入最終資料集；未匹配州別仍保留在 NULL 組。",
  },
  {
    id: "order-dataset", stage: "從資料到交付", title: "建立訂單層級資料集：先彙總再串接",
    tags: ["SELECT", "CTE", "JOIN", "LEFT JOIN", "GROUP BY", "CASE", "SUM", "資料集"],
    purpose: "把配送狀態、地區與商品金額放在同一張可驗證的訂單層級資料集中。",
    why: "item_totals 先將多筆品項折成一張訂單，再 JOIN。is_late 用 1 表示晚到、0 表示準時、NULL 表示無法判斷。::date 是只比較日期，不比較當天時刻。",
    sql: `${orderLevel}
SELECT
  order_id,
  customer_state,
  item_count,
  item_value,
  is_late
FROM order_level
ORDER BY order_id
LIMIT 100;`,
    read: "這是前 100 列預覽，不是完整分析母體。item_value 的 NULL 表示未找到金額，不應任意改成真實的 0 元。",
    verify: "本範例依賴訂單與客戶鍵已驗證唯一。品項 price 的 NULL 或負值也要另做財務核對；本 Demo 不驗證會計認列。",
    decision: "用完整 order_level 做下一步聚合，不用眼前這 100 列計算全公司 KPI。",
  },
  {
    id: "state-kpi", stage: "從資料到交付", title: "做一張主管能用的州別配送表",
    tags: ["SELECT", "CTE", "JOIN", "GROUP BY", "COUNT", "SUM", "CASE", "KPI"],
    purpose: "同時給主管看延遲率與受影響訂單數，區分『比例高但量小』和『影響人數多』的地區。",
    why: "NULLIF 避免除以 0；100.0 讓比例保留小數。COUNT(is_late) 不包含 NULL，所以 missing_dates 不會被算成準時。先按晚到訂單數排序是追查優先順序的一種選擇，不是唯一答案。",
    sql: `${orderLevel}
SELECT
  customer_state,
  COUNT(*) AS delivered_orders,
  COUNT(is_late) AS measurable_orders,
  COUNT(*) - COUNT(is_late) AS missing_dates,
  SUM(CASE WHEN is_late = 1 THEN 1 ELSE 0 END) AS late_orders,
  ROUND(100.0 * SUM(CASE WHEN is_late = 1 THEN 1 ELSE 0 END)
    / NULLIF(COUNT(is_late), 0), 2) AS late_rate_pct,
  SUM(item_value) AS known_item_value,
  COUNT(*) - COUNT(item_value) AS orders_without_item_value
FROM order_level
GROUP BY customer_state
ORDER BY late_orders DESC, customer_state
LIMIT 50;`,
    read: "一州一列，包含州別未知的 NULL 組。晚到訂單數高值得追查；高比例若分母很小，要降低結論強度。known_item_value 只是已有品項金額的加總。",
    verify: "每列都應 late_orders ≤ measurable_orders ≤ delivered_orders，且 measurable_orders + missing_dates = delivered_orders。若結果被截斷，不可當完整報表。",
    decision: "下載這份州別彙總 CSV，再做下一步總量對帳。先挑一個高影響州查路線／品類／月份，不能直接斷言原因。",
  },
  {
    id: "reconcile", stage: "從資料到交付", title: "交付前最後一次核對，留下可重跑的證據",
    tags: ["SELECT", "CTE", "JOIN", "GROUP BY", "COUNT", "SUM", "CASE", "對帳"],
    purpose: "主管看見的不只是一張圖，還有這張圖為什麼可信、排除了什麼，以及別人如何重跑。",
    why: "使用與報表相同的 order_level，另外拿原始訂單數比較。把分母、缺值、晚到數列出來，方便 Power BI 或 Excel 對帳。",
    sql: `${orderLevel}
SELECT
  (SELECT COUNT(*) FROM olist.orders_raw
    WHERE ${scopeWhere}) AS base_orders,
  COUNT(*) AS dataset_rows,
  COUNT(DISTINCT order_id) AS unique_orders,
  COUNT(is_late) AS measurable_orders,
  COUNT(*) - COUNT(is_late) AS missing_dates,
  SUM(CASE WHEN is_late = 1 THEN 1 ELSE 0 END) AS late_orders,
  SUM(item_value) AS known_item_value
FROM order_level;`,
    read: "三個訂單計數應相同，且可判斷加缺日期等於總數。把州別表各個計數欄加總，應與這裡一致。",
    verify: "對帳只證明彙總一致，不保證來源沒有錯誤、不代表找到了延遲的因果關係。商品金額還需與財務系統獨立對帳。",
    decision: "交付查詢、執行時間、結果與限制；要求資料負責人確認 KPI 定義，再決定是否發布營運報表。",
  },
];

export const projectDemo = {
  id: "olist-delivery-onboarding", title: "新人第一個專案：配送延遲診斷",
  brief: "你剛加入 Olist 營運分析團隊。主管問：哪些地區的配送需要優先追查？你拿到陌生的歷史資料庫，先確認資料可信，再交付州別配送表與驗證紀錄。",
  boundary: "這是家教示範專案，不是你的課程通關作業。可以先看全貌，不要求現在掌握所有進階語法；執行 Demo 不會解鎖章節或增加掌握分數。",
  scope: "範例期間：2018-01-01（含）至 2018-07-01（不含）的已送達訂單；按下單時間選取，依實際與預計送達的日期判定晚到。不是即時業務結論。",
  steps,
  handoff: [
    { title: "哪些分析現在有依據？", text: "訂單規模、日期缺漏、州別晚到數與延遲率可作描述性分析。品類／賣家分群是後續方向，必須新增關聯與 grain 驗證。缺少成本、退貨與退款定義，不能計算利潤；沒有實驗或控制其他因素，不能做因果歸因。" },
    { title: "Excel／Power BI：先交付州別彙總表", text: "第 11 步執行後下載 CSV。匯入後設州別為文字、計數為整數、金額為小數。列數先對 SQL，再對第 12 步各欄總量。畫晚到訂單數長條圖，並並列分母與延遲率；整體延遲率用 SUM(late_orders) ÷ SUM(measurable_orders) × 100，不是各州百分比的平均。" },
    { title: "什麼時候才用 pandas？", text: "本專案可直接用 SQL 完成，不為了展示工具而搬資料。需要合併外部 CSV、特殊清理或統計檢定時才用 pandas，並保留讀檔型別、清理前後列數和可重跑腳本。不要把最多 100 列的預覽當成全體資料。" },
    { title: "什麼時候需要另一個資料庫？", text: "一次性的探索不必複製原始資料庫。定期報表需要排程、固定版本或多人共用時，再與資料工程師討論受治理的資料集／view。本網站只有唯讀權限，不會自動建立新表或寫回來源。" },
    { title: "怎麼對主管說？", text: "用『在什麼期間、什麼分母下，哪個州晚到訂單數較多』描述執行後的證據；補充缺值與樣本量。建議優先切分月份、品類或路線追查，並明說目前不能斷言物流商、賣家或距離是原因。尚未執行時不填造假的數字。" },
  ],
};

export function getDemoStep(id) { return steps.find((step) => step.id === id) || null; }

export function describeDemoResult(id, result) {
  const row = result.rows?.[0];
  if (!row) return "本次查詢成功但沒有資料列。先檢查範圍與權限，不把空結果解讀為公司沒有問題。";
  if (id === "order-grain") return `本次共有 ${row.row_count} 列、${row.unique_orders} 個不同訂單；缺漏鍵 ${row.null_order_ids} 列、額外同鍵列 ${row.extra_order_rows} 列。${Number(row.null_order_ids) === 0 && Number(row.extra_order_rows) === 0 ? "目前計數支持一張訂單一列。" : "鍵檢查未通過，先停止後續 KPI 交付。"}`;
  if (id === "customer-grain") return `本次客戶鍵缺漏 ${row.null_customer_ids} 列、額外同鍵列 ${row.extra_customer_rows} 列。${Number(row.null_customer_ids) === 0 && Number(row.extra_customer_rows) === 0 ? "目前計數支持以 customer_id 做多對一串接。" : "鍵檢查未通過，先處理串接規則。"}`;
  if (id === "join-audit" || id === "reconcile") {
    const rows = row.joined_rows ?? row.dataset_rows;
    const passed = Number(row.base_orders) > 0 && Number(row.base_orders) === Number(rows) && Number(rows) === Number(row.unique_orders);
    return `原始範圍 ${row.base_orders} 單、串接後 ${rows} 列、不同訂單 ${row.unique_orders} 單。${passed ? "列數對帳一致，仍需核對缺值及 KPI 定義。" : "範圍為空或列數不一致，請暫停交付。"}`;
  }
  if (id === "state-kpi") {
    const total = result.rows.reduce((sum, r) => sum + Number(r.delivered_orders || 0), 0);
    return `本次顯示 ${result.rows.length} 個州別群組，合計 ${total} 張已送達訂單。排序第一組為 ${row.customer_state ?? "州別未知"}，晚到 ${row.late_orders} 單、可判斷 ${row.measurable_orders} 單、延遲率 ${row.late_rate_pct ?? "無法計算"}%。這是按晚到數排序，不代表其延遲率最高，更不是因果證據。`;
  }
  return `本次傳回 ${result.row_count} 列${result.truncated ? "（已達顯示上限）" : ""}。${getDemoStep(id)?.read || "請依實際欄位與範圍記錄觀察。"}`;
}

function fence(text) {
  const longest = Math.max(2, ...(String(text || "").match(/`+/g) || []).map((s) => s.length));
  const marker = "`".repeat(longest + 1);
  return `${marker}sql\n${text}\n${marker}`;
}

export function buildDemoReport(logs, now = new Date()) {
  const parts = [`# ${projectDemo.title}`, `匯出時間（UTC）：${now.toISOString()}`, projectDemo.brief, projectDemo.scope,
    "這是家教示範與本帳號的執行證據，不代表學生獨立完成。每步附最近一次帳號執行紀錄；未執行步驟不提供假設結果。紀錄最多搜尋最近 10,000 次查詢；結果預覽最多 20 列，不是完整資料集。"];
  for (const [index, step] of steps.entries()) {
    const log = logs.filter((l) => l.validation?.mode === "project_demo" && l.validation?.demoStepId === step.id)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))[0];
    parts.push(`## ${index + 1}. ${step.title}`, `標籤：${step.tags.join("、")}`, `目的：${step.purpose}`, `為什麼：${step.why}`, fence(step.sql),
      `如何閱讀：${step.read}`, `驗證：${step.verify}`, `下一步：${step.decision}`);
    if (!log) { parts.push("執行紀錄：尚無本帳號的執行證據。"); continue; }
    parts.push(`執行時間（UTC）：${log.created_at}；狀態：${log.status}；Log ID：${log.id}`, "實際執行版本：", fence(log.sql_text),
      `傳回列數：${log.row_count ?? "—"}；耗時：${log.duration_ms ?? "—"} ms；截斷：${log.validation?.truncated ? "是" : "否"}`,
      `錯誤：${log.error_message || "無"}`, `系統觀察：${log.validation?.observation || "無；修改後 SQL 不套用範例結論。"}`,
      `使用者筆記：${log.validation?.note || "未填寫"}`, `結果預覽（最多 20 列）：\n\n${JSON.stringify(log.result_preview || [], null, 2)}`);
  }
  parts.push("## 交付與分析限制", ...projectDemo.handoff.map((item) => `### ${item.title}\n\n${item.text}`));
  return parts.join("\n\n") + "\n";
}
