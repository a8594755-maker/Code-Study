// Authored activities, not a time multiplier or a generated claim of mastery.
import { onboardingActivities, onboardingLessons, onboardingOrder, onboardingStart } from "./sql-onboarding.js";
import { unitOneExtraActivities, unitOneLessons } from './unit-one-upgrade.js';
export const sellersSource = `SELECT seller_id, seller_city, seller_state
FROM olist.sellers_raw
ORDER BY seller_id
LIMIT 20;`;
const ordersSource = `SELECT order_id, order_delivered_customer_date
FROM olist.orders_raw
ORDER BY order_delivered_customer_date NULLS FIRST, order_id
LIMIT 20;`;
const reviewsSource = `SELECT review_id, review_score
FROM olist.order_reviews_raw
ORDER BY review_id, order_id
LIMIT 20;`;
const sellerFixture = [
  { seller_id: "DEMO-S01", seller_city: "sao paulo", seller_state: "SP" },
  { seller_id: "DEMO-S02", seller_city: "rio de janeiro", seller_state: "RJ" },
  { seller_id: "DEMO-S03", seller_city: "campinas", seller_state: "SP" },
  { seller_id: "DEMO-S04", seller_city: "curitiba", seller_state: "PR" },
];
export const integratedSources = [
  { label: "PostgreSQL：表目錄的名稱、類型與可見權限", url: "https://www.postgresql.org/docs/current/infoschema-tables.html" },
  { label: "PostgreSQL：如何從欄位目錄找到欄名與型態", url: "https://www.postgresql.org/docs/current/infoschema-columns.html" },
  { label: "PostgreSQL：查詢、關聯與彙總", url: "https://www.postgresql.org/docs/current/tutorial.html" },
  { label: "pandas：讀取、篩選、合併與整理", url: "https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html" },
  { label: "Power BI：分析師能力範圍", url: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/pl-300" },
  { label: "Power BI Desktop：Windows 環境需求", url: "https://learn.microsoft.com/en-us/power-bi/fundamentals/desktop-get-the-desktop" },
];
export const integratedChapters = [
  { id: "ch01", title: "認識公司資料", status: "pilot", outcome: "完成取數、名單整理、品質檢查與第一份 Power BI 報表。", tools: "SQL 基礎 → pandas 檢查 → Power BI 匯入／對帳", evidence: "資料地圖、查詢紀錄、可重跑 Notebook、報表待審查證據" },
  { id: "ch02", title: "建立可信關聯", status: "planned", outcome: "接對訂單、品項與付款，不重複算金額、不漏掉未匹配資料。", tools: "JOIN／key／grain、merge(validate)、事實表與維度表關係", evidence: "JOIN 前後對帳、孤兒資料清單、Power BI 關係模型" },
  { id: "ch03", title: "建立 KPI 報表", status: "planned", outcome: "把期間、分子分母與指標定義寫清楚，建立可更新報表。", tools: "GROUP BY／CTE／Window、pandas 分組與日期、日期表／DAX", evidence: "SQL 與報表總計一致，篩選後的比率仍正確" },
  { id: "ch04", title: "調查異常與需求", status: "planned", outcome: "面對數字異常先查品質、口徑與分布，再提出可驗證假設。", tools: "分群查詢、pandas 例外處理／統計判讀、Power BI 互動分析", evidence: "根因調查、修正前後比較、限制與非因果說明" },
  { id: "ch05", title: "獨立交付與更新", status: "planned", outcome: "從模糊需求完成一份分析，再用陌生資料確認遷移能力。", tools: "SQL＋Notebook＋Power BI 整合、版本與刷新檢查", evidence: "Olist 主專案、陌生資料小專案、更新重跑及口頭解釋" },
];

export const integratedUnits = [
  { id: "u1", title: "先知道手上有什麼", situation: "入職第一天，主管還沒交辦分析。你要先盤點資料，避免拿錯表回答問題。", purpose: "交付一份能說清楚來源與大小的資料地圖，不急著猜營運好壞。", lesson: [
    "database（資料庫）像公司的工作簿；schema（資料表分組）像分類資料夾；table（資料表）像 Excel 工作表。olist 是分組，sellers_raw 是其中一張表。",
    "row（資料列）是一筆紀錄，column（欄位）是一種屬性。先問一列代表賣家、訂單，還是訂單中的商品；列數不一定等於人數或訂單數。",
    "SELECT 決定輸出；FROM 指定來源；COUNT(*) 數所有資料列；AS 為結果命名。LIMIT 只限制傳回的明細，不代表整張表只有這麼多列。",
    "先看少量欄位與資料，再做全表計數。把看到的事實和推測分開：有多少資料列是事實；是不是完整公司資料仍需確認。",
  ], example: `SELECT table_schema, table_name
FROM information_schema.tables;`, exampleNotes: ["先找目前有權看到的分組與表名，不預設公司怎麼命名。", "目錄來源與欄名由 PostgreSQL 定義；執行結果才是公司實際的名稱。"], handoff: "查目錄 → 查欄位 → 看少量明細 → 確認一列意義與總列數。之後的 pandas 活動才用另行取出的 20 列快照練習列／欄檢查，不是把表名清單直接交給 pandas 或 Power BI。" },
  { id: "u2", title: "交付同事能用的名單", situation: "主管要一份賣家聯絡前的抽查名單，指定欄位名稱與固定排序。", purpose: "讓同事不用猜欄位，也能在重跑時核對同一份清單。", lesson: [
    "不要用 SELECT * 當長期交付格式。指定 seller_id、seller_city、seller_state，讓新增欄位不會突然改變交付。",
    "alias（別名）用 AS 改輸出名稱，不會修改原始資料表。多個欄位用逗號分隔；最後一個欄位後不能多逗號。",
    "ORDER BY 決定排序；ASC 由小到大，DESC 由大到小。LIMIT 之前要有穩定排序，否則『前幾筆』不一定每次相同。",
    "id（識別碼）即使看起來像數字，也通常當文字。不要為了好看轉成數字而丟掉開頭的 0。",
  ], example: `SELECT seller_id AS id, seller_city AS city
FROM olist.sellers_raw
ORDER BY seller_id
LIMIT 5;`, exampleNotes: ["逗號分隔兩個輸出欄位；AS 只改結果欄名。", "先排序，再取 5 列，是可以重跑比較的抽查樣本。"], handoff: "pandas 整理交付欄名；Power BI 用同一份 20 列資料設定文字型態並核對列數。" },
  { id: "u3", title: "把一句需求拆成條件", situation: "營運同事希望按州別、訂單狀態和期間找資料，不想收到全表。", purpose: "確認查詢回答的是同一個範圍，避免 AND／OR 或日期邊界讓數字失真。", lesson: [
    "WHERE 像 Excel 篩選。文字值用單引號，例如 'SP'；欄名 seller_state 不用單引號。",
    "AND 要同時符合，OR 是至少一項。混用時寫括號表達商業分組，不靠猜執行順序。IN ('SP', 'RJ') 表示兩個州其中之一。",
    "時間戳記有時分秒。查 2018 年 1 月，用 >= '2018-01-01' 且 < '2018-02-01'，才不會漏掉 1 月 31 日白天的資料。",
    "LIKE 'sao%' 是文字開頭符合 sao。它不是地理區域定義；城市名稱篩選不能代表整個州。",
  ], example: `SELECT seller_id, seller_city, seller_state
FROM olist.sellers_raw
WHERE seller_state IN ('SP', 'RJ')
ORDER BY seller_id
LIMIT 10;`, exampleNotes: ["WHERE 先縮小資料範圍；IN 不表示兩個條件都要同時成立。", "輸出最多 10 列，不能拿來計算這兩州全部賣家占比。"], handoff: "在小樣本上用 pandas 的 isin 比對篩選結果；資料庫大範圍篩選仍先用 SQL。" },
  { id: "u4", title: "缺值和重複不是同一件事", situation: "同事發現資料列數與不同訂單數不一樣，希望你說明差異。", purpose: "先提供可驗證的品質訊號，不把所有差額直接叫作錯誤資料。", lesson: [
    "NULL 表示缺少值或未知，不是 0，也不等於空字串。用 IS NULL／IS NOT NULL 檢查，不能用 = NULL。",
    "COUNT(*) 數全部列；COUNT(order_id) 忽略 NULL；COUNT(DISTINCT order_id) 數非空且不同的訂單。三者可能不同。",
    "DISTINCT 是讓輸出組合不重複，不會刪除來源資料。查不同州別和查不同賣家是兩個問題。",
    "評論表可能一張訂單有多筆紀錄。列數差額只提示需要調查，不能未查 review_id、版本與業務規則就宣稱重複錯誤。",
  ], example: `SELECT COUNT(*) AS rows,
       COUNT(order_id) AS known_order_ids,
       COUNT(DISTINCT order_id) AS different_orders
FROM olist.order_reviews_raw;`, exampleNotes: ["先同時看總列數、非空鍵、不同鍵，才能拆開缺值與多筆紀錄。", "沒有配送日期不代表一定晚到；晚到要和預計日期比較。"], handoff: "pandas 盤點樣本缺值；Power BI 的列數 measure 在州別篩選後再和樣本對帳。" },
  { id: "u5", title: "把規則寫成可核對的分類", situation: "客服主管要先分出低評分案件，再決定哪些案件值得追查。", purpose: "分類只是工作分流；不能把低評分直接解釋成物流造成。", lesson: [
    "CASE WHEN 像 Excel IF：依序判斷條件，第一個符合就給結果，最後用 ELSE 接住其餘情況，再用 END 結束。",
    "先處理 NULL，再判斷門檻。否則未知分數可能被錯分到一般案件。",
    "::numeric 是 PostgreSQL 的型態轉換。原始 CSV 匯入欄位可能是文字，計算或比較之前要確認型態；不合法值要隔離，不可靜默丟掉。",
    "分類名稱要反映規則，例如 needs_follow_up（需追查），而不是 fraud（詐欺）這種沒有證據的結論。",
  ], example: `SELECT review_id,
       CASE
         WHEN review_score IS NULL THEN 'unknown'
         WHEN review_score::numeric <= 2 THEN 'needs_follow_up'
         ELSE 'normal'
       END AS service_group
FROM olist.order_reviews_raw
ORDER BY review_id, order_id
LIMIT 10;`, exampleNotes: ["NULL 放第一個條件，未知就保持未知。", "分類後抽查門檻兩側的例子，確認 2 分和 3 分落在不同組。"], handoff: "SQL 做資料庫分流；pandas 在抽樣資料上逐列驗證分類規則。" },
  { id: "u6", title: "白紙交付與第一次更新", situation: "你要把取數、整理和報表交給同事，並確認資料更新後還能使用。", purpose: "交付可重跑的成果與限制，不能只交一張看起來合理的截圖。", lesson: [
    "先把需求寫成：來源、欄位、條件、排序、筆數與用途，再選工具。需求沒有說清楚的地方先標待確認。",
    "第一次通過可能只是照著範例。這一單元換成新條件與另一張表，確認你是否真的知道怎麼查。",
    "Notebook（互動筆記本）要能從第一格重跑，不能依靠之前手動改過但沒記錄的變數。下載副本不是已執行證據。",
    "Power BI 更新資料後，要核對來源列數與報表數字。將教材新增測試列與原始 Olist 資料分開，不能把測試列當真實營運。",
  ], example: `SELECT product_id, product_category_name
FROM olist.products_raw
WHERE product_category_name IS NOT NULL
ORDER BY product_id
LIMIT 5;`, exampleNotes: ["這個例子示範處理未知分類；下面的獨立任務條件不同，不能直接照抄。", "新資料表先看欄位，常見概念可以轉移，但商業定義仍要重新確認。"], handoff: "下載目前查詢資料與自己的 Notebook；Power BI 更新練習保留前後列數與檔案證據，等待審查。" },
];

const tasks = [...onboardingActivities];
function add(unit, suffix, tool, kind, title, task, reference, explanation, extra = {}) {
  tasks.push({ id: `studio-${unit}-${suffix}`, chapterId: "ch01", unitId: unit, tool, kind, title, task, reference, explanation,
    mode: kind === "independent" ? "independent" : "practice", ordered: true, ...extra });
}
// Each SQL activity changes the business requirement, failure mode, or source.
add("u1", "s1", "sql", "guided", "先盤點有哪些資料表", "列出 olist 的 BASE TABLE，欄名 table_name，依表名排序。不是數資料列。", `SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'olist'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;`, ["information_schema.tables 是資料表目錄，不是訂單資料。", "schema 與 BASE TABLE 條件排除其他分組及 view（檢視表）。"], { tags: ["SELECT", "schema", "WHERE"] });
add("u1", "s2", "sql", "debug", "五個訂單編號，不是訂單總列數", "主管要訂單主檔全部列數，欄名 order_rows。修正草稿，輸出 1 列 1 欄。", `SELECT COUNT(*) AS order_rows
FROM olist.orders_raw;`, ["明細查詢 LIMIT 5 只拿 5 筆，不是計數。", "COUNT(*) 才把所有列轉成一個總數；這還不是有效或完成訂單數。"], { starter: "SELECT order_id AS order_rows\nFROM olist.orders_raw\nLIMIT 5;", tags: ["COUNT", "LIMIT"] });
add("u1", "s3", "sql", "independent", "陌生來源：商品主檔有多大", "計算 products_raw 全部資料列，欄名 product_rows。自己選完整表名與計數方法。", `SELECT COUNT(*) AS product_rows
FROM olist.products_raw;`, ["換成商品主檔，COUNT(*) 的規則沒有變。", "沒有驗證 product_id 唯一性之前，先稱資料列數。"], { tags: ["COUNT", "grain"] });
add("u2", "s1", "sql", "guided", "主管指定三個交付欄名", "從 sellers_raw 輸出 seller_id AS id、seller_city AS city、seller_state AS state；按 seller_id 排序取前 10 列。", `SELECT seller_id AS id, seller_city AS city, seller_state AS state
FROM olist.sellers_raw
ORDER BY seller_id
LIMIT 10;`, ["AS 是交付欄位契約，不改原始表。", "穩定排序讓下次重跑能比較同一範圍。"], { tags: ["SELECT", "AS", "ORDER BY"] });
add("u2", "s2", "sql", "debug", "修正名單的逗號與排序", "草稿有語法錯誤。輸出 seller_id、seller_city，依 seller_id 由大到小取前 5 列。", `SELECT seller_id, seller_city
FROM olist.sellers_raw
ORDER BY seller_id DESC
LIMIT 5;`, ["SELECT 最後一欄後的逗號會讓 FROM 位置報錯。", "DESC 是需求的一部分；只修語法但排序相反，結果仍不符合。"], { starter: "SELECT seller_id, seller_city,\nFROM olist.sellers_raw\nORDER BY seller_id ASC\nLIMIT 5;", tags: ["SELECT", "ORDER BY", "DESC"] });
add("u2", "s3", "sql", "independent", "客服要一份客戶抽查表", "取 customers_raw 的 customer_id、customer_city、customer_state；依 customer_id 排序取前 8 列，不改欄名。", `SELECT customer_id, customer_city, customer_state
FROM olist.customers_raw
ORDER BY customer_id
LIMIT 8;`, ["賣家與客戶來源不同，不能只改輸出標題。", "8 列是抽查表，不是全部客戶。"], { tags: ["SELECT", "ORDER BY", "LIMIT"] });
add("u3", "s1", "sql", "guided", "找 SP 與 RJ 的賣家", "輸出 seller_id、seller_state，僅限 SP 或 RJ，按 seller_id 排序取前 10 列。", `SELECT seller_id, seller_state
FROM olist.sellers_raw
WHERE seller_state IN ('SP', 'RJ')
ORDER BY seller_id
LIMIT 10;`, ["州碼是文字，要用單引號。", "IN 表示符合清單其中之一，不是同時等於兩州。"], { tags: ["WHERE", "IN"] });
add("u3", "s2", "sql", "debug", "一月份的最後一天漏了嗎", "找 2018 年 1 月、狀態 delivered 的訂單，輸出 order_id、order_purchase_timestamp，按購買時間與 order_id 排序取前 20 列。", `SELECT order_id, order_purchase_timestamp
FROM olist.orders_raw
WHERE order_status = 'delivered'
  AND order_purchase_timestamp >= '2018-01-01'
  AND order_purchase_timestamp < '2018-02-01'
ORDER BY order_purchase_timestamp, order_id
LIMIT 20;`, ["AND 同時要求狀態與期間；OR 會放進其他月份。", "右邊使用下個月起點的 < 條件，包含月底所有時刻。"], { starter: "SELECT order_id, order_purchase_timestamp\nFROM olist.orders_raw\nWHERE order_status = 'delivered'\n   OR order_purchase_timestamp BETWEEN '2018-01-01' AND '2018-01-31'\nORDER BY order_purchase_timestamp, order_id\nLIMIT 20;", tags: ["WHERE", "AND", "date"] });
add("u3", "s3", "sql", "independent", "城市名稱的定向抽查", "找州別 SP，且 seller_city 以 sao 開頭的賣家。輸出 seller_id、seller_city；依 seller_id 排序取前 12 列。", `SELECT seller_id, seller_city
FROM olist.sellers_raw
WHERE seller_state = 'SP'
  AND seller_city LIKE 'sao%'
ORDER BY seller_id
LIMIT 12;`, ["州別與城市開頭都要成立，用 AND。", "LIKE 的 % 表示後面可接其他字；這不是整州賣家的代表抽樣。"], { tags: ["WHERE", "LIKE", "AND"] });
add("u4", "s1", "sql", "guided", "找缺少送達紀錄的訂單", "取 order_delivered_customer_date 為 NULL 的 order_id、order_status，依 order_id 排序取前 10 列。不要先假定它们都是晚到。", `SELECT order_id, order_status
FROM olist.orders_raw
WHERE order_delivered_customer_date IS NULL
ORDER BY order_id
LIMIT 10;`, ["IS NULL 找未知日期；= NULL 不會得到想要的結果。", "狀態可能取消或尚未送達，需要另查才能判定。"], { tags: ["NULL", "WHERE"] });
add("u4", "s2", "sql", "debug", "評論覆蓋率先把單位分清楚", "輸出 1 列：COUNT(*) AS review_rows、非空 order_id 數 AS known_order_ids、不同非空 order_id 數 AS reviewed_orders。", `SELECT COUNT(*) AS review_rows,
       COUNT(order_id) AS known_order_ids,
       COUNT(DISTINCT order_id) AS reviewed_orders
FROM olist.order_reviews_raw;`, ["第三欄要 DISTINCT，否則只是重複計算非空鍵。", "這裡尚未與訂單母表比較，因此不能直接算全公司評論覆蓋率。"], { starter: "SELECT COUNT(*) AS review_rows,\n       COUNT(order_id) AS known_order_ids,\n       COUNT(order_id) AS reviewed_orders\nFROM olist.order_reviews_raw;", tags: ["COUNT", "DISTINCT", "NULL"] });
add("u4", "s3", "sql", "independent", "建立可用的州別選項", "從 customers_raw 列出不同且非空的 customer_state，只輸出這一欄並由小到大排序。", `SELECT DISTINCT customer_state
FROM olist.customers_raw
WHERE customer_state IS NOT NULL
ORDER BY customer_state;`, ["DISTINCT 用於輸出清單，不會刪除原資料。", "排除 NULL，不等同已確認州碼全部合法。"], { tags: ["DISTINCT", "NULL", "ORDER BY"] });
add("u5", "s1", "sql", "guided", "分出需要客服追查的評分", "輸出 review_id、service_group。review_score 為 NULL → unknown；轉為 numeric 後 <= 2 → needs_follow_up；其餘 normal。按 review_id、order_id 排序取前 10 列。", integratedUnits[4].example, ["先接住 NULL，再處理 <= 2 的門檻。", "needs_follow_up 是追查標記，不是原因或責任判定。"], { tags: ["CASE", "NULL", "CAST"] });
add("u5", "s2", "sql", "debug", "未知分類不能叫作已知", "修正商品分類旗標：category_flag 在 product_category_name 為 NULL 時是 unknown，否則 known。輸出 product_id、category_flag，按 product_id 排序取前 10 列。", `SELECT product_id,
       CASE WHEN product_category_name IS NULL THEN 'unknown'
            ELSE 'known' END AS category_flag
FROM olist.products_raw
ORDER BY product_id
LIMIT 10;`, ["把 = NULL 換為 IS NULL。", "反過來標記 unknown 與 known 是商業邏輯錯誤，不只是風格問題。"], { starter: "SELECT product_id,\n       CASE WHEN product_category_name = NULL THEN 'known'\n            ELSE 'unknown' END AS category_flag\nFROM olist.products_raw\nORDER BY product_id\nLIMIT 10;", tags: ["CASE", "NULL"] });
add("u5", "s3", "sql", "independent", "高單價品項抽查", "從 order_items_raw 找 price::numeric >= 1000 的品項，輸出 order_id、order_item_id、ROUND(price::numeric, 2) AS item_price。依 price::numeric 由大到小、order_id、order_item_id 排序取前 10 列。", `SELECT order_id, order_item_id, ROUND(price::numeric, 2) AS item_price
FROM olist.order_items_raw
WHERE price::numeric >= 1000
ORDER BY price::numeric DESC, order_id, order_item_id
LIMIT 10;`, ["這是商品單價，不是含運訂單總額，更不是獲利。", "數值型態排序才不會把字串 '900' 排在 '1000' 前面。"], { tags: ["ROUND", "CAST", "WHERE", "ORDER BY"] });
add("u6", "s1", "sql", "independent", "接手新的產品品質需求", "主管要缺少品類名稱的產品抽查：輸出 product_id、product_category_name，依 product_id 由大到小取前 7 列。自行組合來源與條件。", `SELECT product_id, product_category_name
FROM olist.products_raw
WHERE product_category_name IS NULL
ORDER BY product_id DESC
LIMIT 7;`, ["這次找的是缺少分類，和上方示範的已知分類相反。", "資料品質清單是給資料負責人追查，不應自行刪除。"], { tags: ["NULL", "ORDER BY", "LIMIT"] });
add("u6", "s2", "sql", "independent", "跨天複習：取消訂單的時間範圍", "找 2018 年、狀態 canceled 的訂單，輸出 order_id、order_purchase_timestamp；按時間由新到舊、order_id 由小到大取前 15 列。", `SELECT order_id, order_purchase_timestamp
FROM olist.orders_raw
WHERE order_status = 'canceled'
  AND order_purchase_timestamp >= '2018-01-01'
  AND order_purchase_timestamp < '2019-01-01'
ORDER BY order_purchase_timestamp DESC, order_id
LIMIT 15;`, ["canceled 是資料中的拼字，只有一個 l。", "這是取消案件的抽查清單，沒有全部訂單分母，不能計算取消率。"], { tags: ["WHERE", "date", "ORDER BY"] });
add("u6", "s3", "sql", "independent", "陌生表：付款資料的三個基準", "從 order_payments_raw 輸出 payment_rows（全部列數）、known_order_ids（非空 order_id 數）、paid_orders（不同非空 order_id 數）。一張訂單可能有多次付款。", `SELECT COUNT(*) AS payment_rows,
       COUNT(order_id) AS known_order_ids,
       COUNT(DISTINCT order_id) AS paid_orders
FROM olist.order_payments_raw;`, ["付款列數和訂單數是不同粒度；不能只換標題而沿用評論來源。", "多次付款可能是正常行為，不等於重複錯誤。"], { tags: ["COUNT", "DISTINCT", "grain"] });

add("u1", "p", "python", "guided", "第一次看 DataFrame 的大小", "先載入本題 SQL 的 20 列樣本。用 df 計算 row_count、column_count，輸出 1 列 2 欄的 result。", `result = pd.DataFrame({
    "row_count": [len(df)],
    "column_count": [len(df.columns)]
})`, ["pd 是 pandas 的短名；DataFrame 就像 Excel 工作表。", "len(df) 數資料列，df.columns 是欄名；中括號把一個值包成一欄。", "result 是網站顯示的表格。這裡數的是樣本，不是全表。"], { sourceSql: sellersSource, fixtureRows: sellerFixture, validator: "shape", tags: ["pandas", "DataFrame", "len"] });
add("u2", "p", "python", "guided", "整理同事指定的欄位", "把 df 的 seller_id、seller_state 留下，改名為 id、state；維持原有列順序，指定給 result。", `result = df[["seller_id", "seller_state"]].rename(
    columns={"seller_id": "id", "seller_state": "state"}
)`, ["兩層中括號表示從表格選擇一份欄名清單。", "rename 的對照表是舊名 → 新名，不需要重打每筆資料。", "沒有要篩掉列，所以列數要與來源一致。"], { sourceSql: sellersSource, fixtureRows: sellerFixture, validator: "rename", tags: ["pandas", "rename", "columns"] });
add("u3", "p", "python", "debug", "修正 pandas 的多條件篩選", "只留下 df 中 SP 或 RJ 的 seller_id、seller_state，按 seller_id 排序。修正草稿，不用讀其他檔案。", `result = df.loc[
    df["seller_state"].isin(["SP", "RJ"]),
    ["seller_id", "seller_state"]
].sort_values("seller_id")`, ["isin 逐列測試是否在清單裡，得到 True／False 篩選條件。", "Python 的 or 不適合直接連接兩個 pandas 欄位條件；可以用 isin。", "這只能回答原有 20 列樣本中有哪些符合，不能代表所有 SP／RJ 賣家。"], { sourceSql: sellersSource, fixtureRows: sellerFixture, validator: "filter", starter: 'result = df[(df["seller_state"] == "SP") or (df["seller_state"] == "RJ")]', tags: ["pandas", "isin", "loc", "filter"] });
add("u4", "p", "python", "guided", "缺少日期的樣本有幾筆", "對本題 df 計算 sample_rows（樣本列數）與 missing_delivery（送達日期為空值的列數），輸出 1 列。", `result = pd.DataFrame({
    "sample_rows": [len(df)],
    "missing_delivery": [int(df["order_delivered_customer_date"].isna().sum())]
})`, ["isna() 把空值變 True，再 sum() 數 True 的數量。", "這份 SQL 刻意把 NULL 排前面，是品質調查樣本，不是隨機抽樣；不能估全公司缺值率。", "NULL 和空字串不同；這題只檢查 SQL NULL。"], { sourceSql: ordersSource, fixtureRows: [{ order_id: "DEMO-O1", order_delivered_customer_date: null }, { order_id: "DEMO-O2", order_delivered_customer_date: "2018-01-02" }], validator: "missing", tags: ["pandas", "isna", "sum"] });
add("u5", "p", "python", "guided", "逐列核對客服分類", "用 df 的 review_score 數值分類；輸出 review_id、service_group，規則為 NULL → unknown、<=2 → needs_follow_up、其他 normal，保留來源順序。", `score = pd.to_numeric(df["review_score"], errors="raise")
result = df[["review_id"]].copy()
result["service_group"] = np.select(
    [score.isna(), score.le(2)],
    ["unknown", "needs_follow_up"],
    default="normal"
)`, ["pd.to_numeric 確認可以當數字；errors='raise' 遇到非法文字就明確報錯。", "copy 保留一份結果，np.select 依序使用條件，功能類似 SQL CASE。", "先檢查未知，再比較 2 分門檻；不得把此分類當低評分原因。"], { sourceSql: reviewsSource, fixtureRows: [{ review_id: "DEMO-R1", review_score: 2 }, { review_id: "DEMO-R2", review_score: 3 }, { review_id: "DEMO-R3", review_score: null }], validator: "classify", tags: ["pandas", "to_numeric", "np.select"] });
add("u6", "p", "python", "independent", "交付一份可重跑的賣家清單", "只保留 seller_id、seller_city、seller_state，依 seller_id 由大到小排序，指定 result。執行後下載目前資料與程式 Notebook，確認可從第一格重跑。", `result = df[["seller_id", "seller_city", "seller_state"]].sort_values(
    "seller_id", ascending=False
)`, ["欄位和排序都是交付要求，不自行刪列或填值。", "Notebook 下載是帶走目前版本；本機重跑仍需要你實際執行並檢查。"], { sourceSql: sellersSource, fixtureRows: sellerFixture, validator: "handoff", tags: ["pandas", "sort_values", "export"] });

const biSteps = {
  import: [
    "先確認有可用的 Power BI Desktop（Windows）。若只有 Mac，先保留這題待安排環境；不要勾選已完成。Power BI Service 的權限與可用操作需另行確認，以下步驟以 Desktop 為準。",
    "在下方執行『準備本題資料』，下載 ch1_sellers.csv。這是同一個 Olist 賣家主檔的固定 20 列抽查，不是全表。",
    "開啟 Desktop → Home（常用）→ Get data（取得資料）→ Text/CSV（文字/CSV），選擇 ch1_sellers.csv，再按 Transform Data（轉換資料）。",
    "在 Power Query 選取 seller_id、seller_city、seller_state，將 Data type（資料類型）設為 Text（文字）。保留原欄名，Query 命名為 ch1_sellers。",
    "按 Close & Apply（關閉並套用）。在報表新增 Table（表格）視覺，放入三欄；另建立下方 List Rows measure（量值），放入 Card（卡片）。",
    "先記錄未篩選時的 Card 列數。選取 Card，在 Filters（篩選）窗格的此視覺效果篩選加入 seller_state，只勾 SP，記錄 SP 列數，再清除此篩選。下一單元會改用可互動的切片器。",
    "確認卡片數字和網站來源列數相同。將檔案儲存為 ch1_sellers.pbix；下方填入實際看到的列數和檔案名稱，提交的是待審查證據。",
  ],
  filter: [
    "沿用上一段的 ch1_sellers.pbix；若來源 CSV 不同，先使用下方本題快照替換並 Refresh（重新整理），不要把不同資料的數字混用。",
    "在 Modeling（模型化）→ New measure（新增量值）建立 List Rows = COUNTROWS(ch1_sellers)，將它放進 Card（卡片）。",
    "新增 Slicer（切片器），放入 seller_state。先清除篩選，記錄卡片總列數；再只選 SP，記錄 SP 列數。",
    "新增長條圖：軸放 seller_state，值放 List Rows。確認州別名稱與量值沒有放反，標題寫『抽查樣本賣家列數』。",
    "List Rows 會隨篩選情境改變。不要寫死總數，也不要把 Card 的樣本數說成全公司賣家數。",
    "在下方輸入無篩選列數與 SP 篩選列數，保存 pbix，附上一句你做了什麼對帳。系統只核對輸入數字，尚未讀取你的 Power BI 畫面。",
  ],
  refresh: [
    "先用下方『原始快照 CSV』建立／更新 ch1_sellers 報表，確認 List Rows 與來源列數相同。記住你的 CSV 檔案位置。",
    "下載『更新測試 CSV』。它在原始樣本加上一筆 seller_id=TRAINING-REFRESH、州別 SP 的虛構測試列；明確只用於測試，不能併入真實營運報表。",
    "將這份更新檔另存為原本資料夾的 ch1_sellers.csv，取代的是你自己的教學 CSV 副本，不是資料庫或原始 Olist 檔案。保留原始快照可還原。",
    "回到 Power BI Desktop 按 Home → Refresh；清除切片器，檢查 List Rows 應比原始多 1。只選 SP 後也應比原始 SP 多 1。",
    "若數字不變，檢查來源路徑、是否已儲存 CSV、是否仍有切片器篩選；不要手動改 Card 數字。",
    "另存 ch1_sellers_refresh_test.pbix，標題註明含虛構測試列。填下實際數字與你確認更新成功的方法，保留檔案等候審查。",
  ],
};
for (const [unit, kind, title, task] of [
  ["u2", "import", "把同一份資料交到 Power BI", "匯入真實查詢的抽查 CSV，設定文字型態，建立 Table 與列數 Card，確認沒有丟失識別碼。"],
  ["u4", "filter", "卡片數字為什麼會隨篩選改變", "在 Power BI 建立列數量值、州別切片器及長條圖，核對無篩選與 SP 篩選數字。"],
  ["u6", "refresh", "更新後的報表還對嗎", "用明確標示的新增測試列檢查 Refresh，提交前後列數、報表名稱與對帳說明。"],
]) add(unit, "bi", "powerbi", "practical", title, task, "List Rows =\n    COUNTROWS(ch1_sellers)", ["measure（量值）依目前篩選條件計算；切片器選 SP 後，只數 SP 的列。", "這是 20 列抽查樣本，不能稱為全公司資料。", "Power BI 需在外部真實環境操作；本網站的資料預覽不是 Power BI。"], { sourceSql: sellersSource, fixtureRows: sellerFixture, biKind: kind, steps: biSteps[kind], tags: ["Power BI", "Power Query", "DAX", kind === "refresh" ? "Refresh" : "COUNTROWS"] });

const pandasConcepts = {
  shape: ["網站先把查詢結果放入 df，這是一個 DataFrame（像 Excel 工作表）。pd 是 pandas 的簡稱，已在執行環境載入，不必重新連資料庫。", "df.shape 回傳兩個數字：第 0 個是列數，第 1 個是欄數。Python 的位置從 0 開始；df.shape[0] 不是第 0 列資料。", "pd.DataFrame({...}) 用欄名與值清單建立新表。用 [數字] 表示該欄只有一筆；最後指定給 result，網站才知道要顯示哪張表。"],
  rename: ["df[['seller_id', 'seller_state']] 的外層中括號是選欄，內層清單列出要保留的欄位。選欄不會減少資料列。", "rename(columns={'舊欄名': '新欄名'}) 更改交付欄名，冒號左邊是原名、右邊是新名。它不會更改 Supabase 資料表。", "對帳時同時看列數、欄名與值；只有表格大小相同不能保證內容正確。"],
  filter: ["df['seller_state'].isin(['SP', 'RJ']) 會逐列得到 True／False，意思是是否屬於這兩個州。", "df.loc[條件, 欄位清單] 同時選列與欄；sort_values('seller_id') 固定排序，方便重跑比較。", "這份 df 只是取數樣本；篩選後的比例不是整個公司的州別比例。"],
  missing: ["isna() 對每個值判斷是否缺少，缺值是 True。不能用字串 'NULL' 代替真正空值。", "布林結果的 sum() 會把 True 計為 1、False 計為 0，因此得到缺值數。", "本題來源特意先取缺少配送日期的紀錄，是調查樣本，不是隨機抽樣；不能用它估計全公司缺值率。"],
  classify: ["pd.to_numeric 把評分確認為數字，errors='raise' 表示碰到不合法文字就停下，不靜默改成空值或零。", "np.select 按條件清單的順序選擇標籤，功能像 Excel 多層 IF；先處理未知，再比較 <= 2。", "copy() 建立結果副本；assign(service_group=...) 加入新欄，再選出交付需要的欄。分類不是原因分析。"],
  handoff: ["交付前先確認 source（來源）與 df.columns，再依需求保留欄位；不能把看得到的欄位一股腦交出去。", "sort_values('seller_id', ascending=False) 代表倒序；重新載入相同資料後，結果順序應一致。", "Notebook（可逐格執行的筆記本）下載包含這次資料快照和你的程式；它不會自動重新抓取以後的 Supabase 資料。"],
};
const unitOneOrder = [...onboardingOrder, 'studio-u1-count', 'studio-u1-s2', 'studio-u1-s3', 'studio-u1-p'];
export const integratedActivities = integratedUnits.flatMap((unit) => [...tasks, ...unitOneExtraActivities].filter((task) => task.unitId === unit.id)
  .sort((a, b) => (unitOneOrder.includes(a.id) ? unitOneOrder.indexOf(a.id) : 100) - (unitOneOrder.includes(b.id) ? unitOneOrder.indexOf(b.id) : 100))
  .map((task) => ({ ...task, onboarding: onboardingLessons[task.id] || unitOneLessons[task.id] || null, toolLesson: pandasConcepts[task.validator] || [] })));
export const getIntegratedActivity = (id) => integratedActivities.find((a) => a.id === id) || null;
export const integratedCatalog = {
  id: "analyst-integrated-v2", version: "2026-09-05-foundations", startActivityId: onboardingStart, targetHours: 100,
  title: "分析師工作室", description: "100 小時整合學習是設計目標，不是已備妥或已完成的時數。CH1 先試學驗收，CH2–CH5 依同一標準擴充。",
  chapters: integratedChapters, units: integratedUnits, activities: integratedActivities, sources: integratedSources,
  completion: "SQL 結果符合、pandas 結果對帳與外部 Power BI 待審查證據分開記錄；提示不扣正確性，但有協助不算獨立。",
};

export function getIntegratedMission(id) {
  const a = getIntegratedActivity(id);
  if (!a) return null;
  const u = integratedUnits.find((u) => u.id === a.unitId);
  return { id: a.id, chapterId: "ch01", title: a.title, tags: a.tags, brief: u.situation,
    integrated: true, activity: a, questions: [a.task], checks: a.explanation, why: a.explanation,
    deliverable: a.tool === "powerbi" ? "Power BI 報表與對帳數字，待審查" : "本題結果與驗證紀錄", handoff: a.onboarding?.next || u.handoff,
    practice: a.task, independent: a.task, python: a.tool === "python" ? a.reference : "result = df.head()",
    pythonIntro: "df 是下方資料快照的 DataFrame（資料表），pd 是 pandas，np 是 numpy；最後用 result 顯示表格。",
    fixtureRows: { main: a.fixtureRows || sellerFixture },
    queries: [{ name: "main", label: a.tool === "sql" ? a.title : "本題資料來源", sql: a.sourceSql || a.reference,
      scope: a.tool === "sql" ? a.task : "Olist 固定排序的前 20 列；品質調查／抽查樣本，不代表全公司分布。" }],
  };
}
