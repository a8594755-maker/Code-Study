import { getDemoStep } from "./project-demo.js";
import { getIntegratedMission } from "./integrated-catalog.js";

export const workModes = [
  { id: "explore", label: "主動探索", description: "沒有交辦時，累積可重用的資料認識與值得調查的問題。" },
  { id: "assigned", label: "主管交辦", description: "先確認決策、範圍與交付，再取數、驗證與說明。" },
  { id: "incident", label: "異常調查", description: "先重現、縮小範圍，分清資料、查詢與定義問題。" },
];
export const workStages = [
  { id: "ch01", title: "第一天｜認識資料", coreMinutes: 360, extensionMinutes: 240, outcome: "能安全看資料，說明一列代表什麼，留下待確認問題。" },
  { id: "ch02", title: "第一週｜把資料接對", coreMinutes: 600, extensionMinutes: 480, outcome: "能用 SQL JOIN 與 pandas merge 串接，並檢查掉單與金額膨脹。" },
  { id: "ch03", title: "第一個月｜建立固定報表", coreMinutes: 600, extensionMinutes: 600, outcome: "能定義指標、比較期間、排名，將結果交接到 Excel／Power BI。" },
  { id: "ch04", title: "Junior｜獨立處理需求", coreMinutes: 720, extensionMinutes: 840, outcome: "能拆解模糊問題、合併外部資料，並區分發現、假設與限制。" },
  { id: "ch05", title: "獨立交付｜接受資深審查", coreMinutes: 720, extensionMinutes: 840, outcome: "能完成陌生任務、交接可重跑成果、排查更新異常；不是 Senior 資格認證。" },
];

const query = (name, label, sql, scope = "完整彙總；若執行結果被截斷，就停止交付。") => ({ name, label, sql, scope });
const demo = (id, name = "main") => query(name, getDemoStep(id).title, getDemoStep(id).sql, "2018-01-01 起、2018-07-01 前購買且已送達的訂單；按州彙總／全體對帳，保留日期與州別缺值。");
const orders = `SELECT order_id, customer_id, order_status, order_purchase_timestamp,
  order_delivered_customer_date, order_estimated_delivery_date
FROM olist.orders_raw
ORDER BY order_id
LIMIT 200;`;
const monthly = `SELECT DATE_TRUNC('month', order_purchase_timestamp)::date AS month,
  COUNT(*) AS orders,
  SUM(CASE WHEN order_status = 'delivered' THEN 1 ELSE 0 END) AS delivered_orders
FROM olist.orders_raw
WHERE order_purchase_timestamp IS NOT NULL
GROUP BY DATE_TRUNC('month', order_purchase_timestamp)::date
ORDER BY month;`;
const intro = "DataFrame（表格物件）像 Excel 工作表；df 是網站把 main 查詢結果載入後的變數。result 是要顯示／下載的成果表。Notebook（互動筆記本）可以逐格執行並保留說明。";
export const pythonPrimer = [
  { code: "result = df.head(5)", meaning: "等號 = 是把右邊結果指定給左邊名稱；不是 SQL 的比較。head(5) 取前五列，像先看 Excel 前五列。", mistake: "result 的小寫拼字固定，不能寫成 Result；這只預覽資料，不是隨機抽樣。" },
  { code: "print(df.columns)\nprint(df.dtypes)\nprint(df.shape)", meaning: "print 顯示文字輸出；columns 是欄名、dtypes 是每欄型態、shape 是（列數, 欄數）。先確認輸入，才做計算。", mistake: "columns、dtypes、shape 不加括號；head(5) 是執行動作，所以要括號。" },
  { code: 'result = df[["column_name"]].copy()', meaning: "引號內是欄名文字；兩層中括號保留表格，copy 建立工作副本。把 column_name 換成目前資料裡真的存在的欄位。", mistake: "SQL 常用單引號寫字串；Python 單、雙引號都可以，但要成對。欄名不對會出現 KeyError。" },
  { code: "assert len(result) <= len(df)", meaning: "assert 是驗證，條件不成立就停下來；這個例子適用於篩選，不適用所有 JOIN 或重新展開資料。# 開頭則是註解。", mistake: "驗證失敗時先查原因，不要刪掉檢查硬過關。每個練習使用新環境，不能依靠上次偷偷留下的變數。" },
];

const missions = [
  {
    id: "day1-map", chapterId: "ch01", mode: "explore", title: "沒有交辦：建立第一份資料地圖", coreMinutes: 120, extensionMinutes: 60,
    tags: ["SELECT", "information_schema", "groupby", "資料盤點"],
    brief: "你剛加入 Olist 營運團隊，尚未拿到分析需求。今天先整理公司有哪些資料、你還需要向誰確認什麼，不能把欄名猜測當成正式定義。",
    questions: ["哪些資料反映訂單、商品、付款與配送？", "一列是訂單、商品明細還是付款？", "資料負責人、更新頻率與可使用範圍，哪些還未確認？"],
    queries: [query("main", "列出資料表與欄位", `SELECT table_name, column_name, data_type, ordinal_position
FROM information_schema.columns
WHERE table_schema = 'olist'
ORDER BY table_name, ordinal_position;`)],
    python: `result = df.groupby("table_name", dropna=False).agg(
    column_count=("column_name", "size"),
    fields=("column_name", lambda values: ", ".join(values))
).reset_index()
print("這是結構盤點，不是各表資料筆數。")`,
    why: ["information_schema 是資料庫的欄位目錄，不必先知道九張表的內容。", "groupby 像樞紐分析表，先把同一張表的欄位整理在一起。", "這一步交付資料地圖與疑問，不猜營運結論。"],
    checks: ["表名與網站左側資料表列表核對。", "欄位數不等於資料列數；另用 COUNT(*) 才能盤點筆數。"],
    practice: "只盤點 orders_raw 與 order_items_raw；在 pandas 比較兩張表共有與各自獨有的欄位。",
    independent: "換成付款與評論資料，自行找表、整理欄位，列出兩個目前不能靠欄名確認的商業定義。",
    deliverable: "資料地圖、來源／更新頻率待確認清單，以及一個有商業用途的後續問題。",
    handoff: "Excel：下載欄位盤點 CSV，以文字型態開啟表名／欄名，加上定義、負責人、確認狀態三欄；未知就寫待確認。列數要對回 SQL，不發布成正式資料字典。",
  },
  {
    id: "day1-list", chapterId: "ch01", mode: "assigned", title: "主管要一份賣家清單", coreMinutes: 120, extensionMinutes: 120,
    tags: ["SELECT", "WHERE", "LIMIT", "sort_values", "清單交付"],
    brief: "主管要先查看 SP 州的賣家資料。你要確認欄位、排序、是否需要全量，而不是直接 SELECT * 下載整個資料庫。",
    questions: ["只是確認格式，還是要完整名單？", "需要城市、州別或郵遞區號嗎？", "排序與截取前幾筆是否會影響用途？"],
    queries: [query("main", "SP 州賣家格式預覽", `SELECT seller_id, seller_city, seller_state, seller_zip_code_prefix
FROM olist.sellers_raw
WHERE seller_state = 'SP'
ORDER BY seller_id
LIMIT 200;`, "SP 州按 ID 排序前 200 列，非隨機樣本、非完整賣家名單。")],
    python: `result = df[["seller_id", "seller_city", "seller_state", "seller_zip_code_prefix"]].copy()
result["seller_zip_code_prefix"] = result["seller_zip_code_prefix"].astype("string").str.zfill(5)
result = result.sort_values(["seller_city", "seller_id"])
assert result["seller_state"].eq("SP").all(), "有不屬於 SP 的賣家"
print("只交付格式預覽，不能宣稱這是完整名單。")`,
    why: ["WHERE 把主管的地區限制寫清楚，SELECT 只取交付需要的欄位。", "copy 建立工作副本；astype('string') 保留郵遞區號的識別碼性質。", "sort_values 決定同事拿到清單後的閱讀順序。"],
    checks: ["seller_id 有沒有缺值或重複？", "SQL 與 pandas 的資料列數一致，郵遞區號不是加總用的數字。"],
    practice: "把需求改成 RJ 州，修改 SQL 與 pandas 的州別驗證；只交付賣家 ID、城市與州別。",
    independent: "主管改要 MG 州清單。自己決定欄位、排序、資料型態，並說明目前如何判斷名單是否完整。",
    deliverable: "清單 CSV、資料範圍註記，以及一項實際驗證。",
    handoff: "Excel：用資料匯入把 ID／郵遞區號設成文字，確認前導零未消失。把 SQL 範圍、截取上限與執行時間一起交付；全量需求另由受控匯出處理，不用這 200 列冒充。",
  },
  {
    id: "day1-grain", chapterId: "ch01", mode: "incident", title: "評論列數與訂單數不一樣", coreMinutes: 120, extensionMinutes: 60,
    tags: ["COUNT", "DISTINCT", "isna", "資料粒度"],
    brief: "同事說評論表的筆數就是有評論的訂單數。你發現兩個 COUNT 不一致，需要確認差額由什麼構成。",
    questions: ["一個訂單可以有幾筆評論？", "order_id 有沒有 NULL？", "差額是重複評論、版本紀錄，還是資料錯誤？"],
    queries: [query("main", "比較評論列、非空鍵與不同訂單", `SELECT COUNT(*) AS review_rows,
  COUNT(order_id) AS nonnull_order_ids,
  COUNT(DISTINCT order_id) AS distinct_orders
FROM olist.order_reviews_raw;`)],
    python: `result = df.copy()
result["null_order_ids"] = result["review_rows"] - result["nonnull_order_ids"]
result["extra_nonnull_rows"] = result["nonnull_order_ids"] - result["distinct_orders"]
assert (result["review_rows"] >= result["nonnull_order_ids"]).all()
assert (result["nonnull_order_ids"] >= result["distinct_orders"]).all()
print("差額是調查線索，不等於已證實的髒資料。")`,
    why: ["COUNT(*) 數全部列，COUNT(欄位) 排除 NULL，COUNT(DISTINCT 欄位) 再去重。", "pandas 把差額拆成缺鍵與非空鍵重複，避免混為一談。", "核對定義之前，不直接刪除重複列。"],
    checks: ["全部列 ≥ 非空訂單鍵 ≥ 不同訂單數。", "若要查真正評論覆蓋率，還需要訂單母表作分母。"],
    practice: "改查 orders_raw 的 order_id 三種計數，比較它與評論表的 grain（每列代表的東西）。",
    independent: "自行盤點 customers_raw 的 customer_id 與 customer_unique_id，解釋識別訂單客戶與識別同一個人的差別。",
    deliverable: "三種計數、差額拆解、待向資料負責人確認的問題。",
    handoff: "目前不做 BI。先在 Notebook 留下對帳結果與假設，交給資料負責人確認鍵的定義；未確認之前不把差額當成刪除清單。",
  },
  {
    id: "week1-keys", chapterId: "ch02", mode: "explore", title: "沒有交辦：查清楚訂單與客戶怎麼接", coreMinutes: 180, extensionMinutes: 120,
    tags: ["JOIN", "LEFT JOIN", "merge", "duplicated", "關聯探索"],
    brief: "為下一次地區分析做準備。先取同一批訂單與對應客戶，分別檢查鍵，再練習 SQL 與 pandas 的串接。",
    questions: ["訂單對客戶應該是多對一嗎？", "customer_id 與 customer_unique_id 哪一個是串接鍵？", "找不到客戶的訂單應留下還是消失？"],
    queries: [query("main", "訂單樣本", orders, "按訂單 ID 前 200 列，非全母體。"), query("customers", "同批訂單需要的客戶", `WITH selected_orders AS (
  SELECT customer_id FROM olist.orders_raw ORDER BY order_id LIMIT 200
)
SELECT customer_id, customer_unique_id, customer_state
FROM olist.customers_raw
WHERE customer_id IN (SELECT customer_id FROM selected_orders)
ORDER BY customer_id;`, "只涵蓋 main 的客戶，需檢查缺鍵。")],
    python: `customers = tables["customers"].copy()
assert df["customer_id"].notna().all(), "先調查訂單缺鍵"
assert customers["customer_id"].notna().all(), "先調查客戶缺鍵"
assert not customers["customer_id"].duplicated().any(), "客戶鍵不唯一，先停止串接"
result = df.merge(customers, on="customer_id", how="left", validate="many_to_one", indicator=True)
assert len(result) == len(df), "串接放大了訂單列數"
print(result["_merge"].value_counts().to_string())`,
    why: ["兩份查詢使用同一批鍵，才有可比較的資料範圍。", "merge 的 validate='many_to_one' 宣告關係，意外重複時主動報錯。", "pandas 的空鍵串接行為與 SQL 不同，所以先驗證鍵不為空。"],
    checks: ["串接前後 main 列數一致。", "left_only 是未匹配，不可當成客戶不存在的確證，還要檢查來源範圍。"],
    practice: "改取另一批訂單；比較 how='inner' 與 how='left' 的列數與未匹配鍵。",
    independent: "自己用 SQL LEFT JOIN 產出相同欄位，與 pandas 串接結果按 order_id 對帳。",
    deliverable: "串接鍵說明、關係判定、未匹配清單與前後列數。",
    handoff: "Excel：只匯出 _merge='left_only' 的疑似未匹配清單供同事核對；不要把完整查詢權限或帳號憑證放進檔案。",
  },
  {
    id: "week1-payments", chapterId: "ch02", mode: "assigned", title: "同一張訂單，品項與付款要怎麼對帳？", coreMinutes: 240, extensionMinutes: 180,
    tags: ["CTE", "GROUP BY", "SUM", "merge", "對帳"],
    brief: "財務同事需要一份付款與商品加運費的對照清單。付款和商品明細都有可能一單多列，不能直接串接後加總。",
    questions: ["商品金額是否含運費？", "付款加總是否已扣退款？資料有沒有退款欄？", "對帳容忍誤差與未匹配訂單怎麼處理？"],
    queries: [query("main", "先把品項彙總到訂單", `WITH selected_orders AS (SELECT order_id FROM olist.orders_raw ORDER BY order_id LIMIT 200)
SELECT order_id, SUM(price + freight_value) AS item_and_freight
FROM olist.order_items_raw
WHERE order_id IN (SELECT order_id FROM selected_orders)
GROUP BY order_id ORDER BY order_id;`, "前 200 張訂單的品項彙總，不是全公司財務結算。"), query("payments", "付款也先彙總到訂單", `WITH selected_orders AS (SELECT order_id FROM olist.orders_raw ORDER BY order_id LIMIT 200)
SELECT order_id, SUM(payment_value) AS paid_value
FROM olist.order_payments_raw
WHERE order_id IN (SELECT order_id FROM selected_orders)
GROUP BY order_id ORDER BY order_id;`, "同批訂單的已記錄付款，不能宣稱是退款後淨收入。")],
    python: `result = df.merge(tables["payments"], on="order_id", how="outer", validate="one_to_one", indicator=True)
for column in ["item_and_freight", "paid_value"]:
    result[column] = pd.to_numeric(result[column], errors="coerce")
result["difference"] = result["paid_value"] - result["item_and_freight"]
result["needs_review"] = result["_merge"].ne("both") | result["difference"].isna() | result["difference"].abs().gt(0.01)
print(result["needs_review"].value_counts().to_string())`,
    why: ["GROUP BY 把兩邊都收斂成一單一列，避免多對多倍增。", "outer merge 保留任一邊有的訂單；缺值不擅自補 0。", "0.01 是練習假設的容忍誤差，正式交付需請財務確認。"],
    checks: ["兩邊 order_id 都唯一。", "有差額只標記待調查，不直接推斷漏收款。"],
    practice: "把樣本提高到 300 張，整理只在其中一邊存在與金額不一致的兩份清單。",
    independent: "改取另一個期間的訂單，自己定義範圍、金額欄位與待確認項目，交付可重跑對帳。",
    deliverable: "訂單層級對帳表、例外清單、容忍誤差與退款資料限制。",
    handoff: "Excel：匯出 result，只把 difference 設為金額格式；按 needs_review 篩選，由財務核對。筆數、兩個金額總和先對回 Notebook，未匹配金額不能消失。",
  },
  {
    id: "week1-double", chapterId: "ch02", mode: "incident", title: "報表訂單數翻倍：找出 JOIN 放大", coreMinutes: 180, extensionMinutes: 180,
    tags: ["JOIN", "COUNT", "DISTINCT", "groupby", "重複檢查"],
    brief: "模擬事件：同事把訂單接到品項後，直接用列數當訂單數。你要重現差異，不能為了數字好看就隨便 drop_duplicates。",
    questions: ["兩份報表期間一致嗎？", "現在一列代表訂單還是品項？", "明細仍要保留嗎？哪些指標只能按訂單算？"],
    queries: [query("main", "重現一對多串接", `WITH selected_orders AS (SELECT order_id FROM olist.orders_raw ORDER BY order_id LIMIT 100)
SELECT o.order_id, i.order_item_id, i.price
FROM selected_orders AS o
LEFT JOIN olist.order_items_raw AS i ON o.order_id = i.order_id
ORDER BY o.order_id, i.order_item_id
LIMIT 500;`, "前 100 張訂單的品項明細，最多 500 列；如果被截斷，停止對帳。")],
    python: `result = df.groupby("order_id", dropna=False).agg(
    joined_rows=("order_id", "size"), item_count=("order_item_id", "count")
).reset_index()
print("串接列數：", len(df), "；不同訂單：", df["order_id"].nunique())
print("不能把明細列數當訂單數，也不能刪掉合法品項。")`,
    why: ["先用小範圍重現，避免在全表上追查每個欄位。", "nunique 對應不同值數量，size 是列數，count 排除缺值。", "修正的是指標粒度，不是直接刪除來源資料。"],
    checks: ["按訂單彙總後 joined_rows 的總和等於串接列數。", "NULL 的 order_item_id 代表未匹配，不是 1 件商品。"],
    practice: "另用 SQL COUNT(*) 和 COUNT(DISTINCT order_id) 重現同樣差異。",
    independent: "把第二張表改成付款明細，自己判斷要如何保留分期／多支付方式而不重複計算訂單。",
    deliverable: "問題重現、錯誤原因、修正查詢與防重犯檢查。",
    handoff: "先交付給報表負責人：記錄哪個指標受到影響、修正前後定義與對帳。確認新資料集一單一列後才替換 Power BI 的來源，不只在圖表上改成 DISTINCTCOUNT 掩蓋其他重複金額。",
  },
  {
    id: "month-trends", chapterId: "ch03", mode: "explore", title: "沒有交辦：看看資料涵蓋哪些月份", coreMinutes: 180, extensionMinutes: 180,
    tags: ["GROUP BY", "DATE_TRUNC", "reindex", "pct_change", "時間覆蓋"],
    brief: "準備建立月報前，你先確認歷史期間、缺月與邊界月份。某月數字低，可能是資料只涵蓋半個月，不一定是生意下滑。",
    questions: ["按下單日還是送達日分月？", "最早與最晚月份是否完整？", "缺一個月份，應補 0 還是標示未知？"],
    queries: [query("main", "按下單月盤點", monthly)],
    python: `result = df.copy()
result["month"] = pd.to_datetime(result["month"])
result = result.sort_values("month").set_index("month")
calendar = pd.date_range(result.index.min(), result.index.max(), freq="MS")
result = result.reindex(calendar).rename_axis("month")
result["missing_month"] = result["orders"].isna()
result["mom_pct"] = result["orders"].pct_change(fill_method=None) * 100
result = result.reset_index()
print("缺月保留 NaN；邊界月份未確認完整前，不下成長結論。")`,
    why: ["DATE_TRUNC 把日期收斂到月份，先盤點時間範圍。", "reindex 補出日曆上的缺月，但不自動宣稱沒有訂單。", "pct_change 是與前期比較；日期排序和缺月處理先於計算。"],
    checks: ["每個月只有一列，月份按時間排序。", "第一月與缺月後的成長率可為空；不可隨意補 0。"],
    practice: "加入取消訂單數，檢查取消占比，不把數量變化直接當成比例變化。",
    independent: "用 SQL LAG 計算同樣的月增率，說明有缺月時與日曆補齊後的差異。",
    deliverable: "月份覆蓋表、缺月／邊界警告、候選分析期間。",
    handoff: "Power BI：先確認完整月份，再建立日期表與一對多關係；month 設日期，orders 設整數。折線圖加上期間限制說明，總訂單數先對回 SQL。",
  },
  {
    id: "month-ranking", chapterId: "ch03", mode: "assigned", title: "主管要品類排名，但不能叫它利潤", coreMinutes: 240, extensionMinutes: 240,
    tags: ["JOIN", "GROUP BY", "DENSE_RANK", "rank", "商品分析"],
    brief: "主管想知道哪些品類的商品金額較高。你先說清楚這是已記錄的品項價格總和，不含成本、退款或利潤。",
    questions: ["只看已送達訂單嗎？", "品類未知是否保留？", "同金額的品類要並列排名嗎？"],
    queries: [query("main", "已送達訂單的品類金額", `WITH category_totals AS (
SELECT p.product_category_name AS category,
  COUNT(*) AS item_rows, SUM(i.price) AS item_value
FROM olist.order_items_raw AS i
JOIN olist.orders_raw AS o ON i.order_id = o.order_id
LEFT JOIN olist.products_raw AS p ON i.product_id = p.product_id
WHERE o.order_status = 'delivered'
GROUP BY p.product_category_name
)
SELECT category, item_rows, item_value,
  DENSE_RANK() OVER (ORDER BY item_value DESC) AS sql_rank
FROM category_totals
ORDER BY sql_rank, category;`)],
    python: `result = df.copy()
result["item_value"] = pd.to_numeric(result["item_value"], errors="coerce")
result["value_rank"] = result["item_value"].rank(method="dense", ascending=False)
assert result["value_rank"].eq(result["sql_rank"]).all(), "SQL 與 pandas 排名不一致"
total = result["item_value"].sum(min_count=1)
result["share_pct"] = result["item_value"] / total * 100 if total > 0 else float("nan")
result = result.sort_values(["value_rank", "category"], na_position="last")
print("item_value 不是利潤，也不是退款後淨收入。")`,
    why: ["先固定已送達範圍與品項粒度，才能解釋 SUM(price)；WITH 把彙總命名成 category_totals 方便下一段使用。", "DENSE_RANK() OVER (...) 是視窗函數，在彙總後的各品類加排名，不會再次合併資料列；同金額並列，下一名不跳號。pandas rank(method='dense') 用來對帳。", "先計算完整品類分母，再挑 Top N；不能在 Top N 裡算全體占比。"],
    checks: ["未知品類列沒有被 dropna 預設行為丟掉。", "品類總金額與同範圍商品明細總額一致。"],
    practice: "改以 item_rows 排名，說明交易量排名與商品金額排名有何不同。",
    independent: "按年度分開產出各年前五品類，自己選 SQL 視窗函數或 pandas 分組排名並對帳。",
    deliverable: "排名表、金額定義、對帳 SQL 與不能推論的限制。",
    handoff: "Excel／Power BI：使用品類長條圖，標籤明寫『已送達訂單商品金額』；保留未知品類。讓使用者看得到期間與狀態，不把圖表標成獲利排行榜。",
  },
  {
    id: "month-rate", chapterId: "ch03", mode: "incident", title: "各州百分比平均，為什麼不是整體晚到率？", coreMinutes: 180, extensionMinutes: 180,
    tags: ["CTE", "CASE", "SUM", "to_numeric", "分母檢查"],
    brief: "模擬月報錯誤：同事平均了各州的 late_rate_pct，卻與 SQL 全體數字不同。你要用分子分母說明原因。",
    questions: ["每個州的訂單量一樣嗎？", "缺日期的訂單放在哪裡？", "儀表板總計是在平均百分比，還是在重算分母？"],
    queries: [demo("state-kpi"), demo("reconcile", "baseline")],
    python: `for column in ["late_orders", "measurable_orders", "delivered_orders", "missing_dates"]:
    df[column] = pd.to_numeric(df[column], errors="raise")
assert (df["late_orders"] <= df["measurable_orders"]).all()
assert (df["measurable_orders"] + df["missing_dates"] == df["delivered_orders"]).all()
denominator = df["measurable_orders"].sum()
weighted = 100 * df["late_orders"].sum() / denominator if denominator > 0 else float("nan")
unweighted = pd.to_numeric(df["late_rate_pct"], errors="coerce").mean()
assert df["delivered_orders"].sum() == tables["baseline"]["base_orders"].iloc[0]
result = pd.DataFrame({"method": ["ratio_of_sums", "mean_of_state_rates"], "rate_pct": [weighted, unweighted]})`,
    why: ["整體比率用分子總和除以分母總和，不是平均地區百分比。", "measurable_orders 排除不能判定是否晚到的訂單。", "baseline 是另一條總量查詢，用來交叉核對分組報表。"],
    checks: ["州別 delivered_orders 加總等於 baseline 的 base_orders。", "分母為 0 時顯示未知，不回傳假 0%。"],
    practice: "排除一個州後重新計算兩種方法，觀察差異；清楚註記範圍已改變。",
    independent: "自己用 SQL 直接算全體晚到率，與 pandas 分組重組結果對帳，說明 rounding（四捨五入）的影響。",
    deliverable: "錯誤公式、修正公式、分母說明與 SQL／pandas 對帳。",
    handoff: "Power BI：匯入 main 州別表（不是 method 比較表），建立 Measure（量值）Late Rate = DIVIDE(SUM(main[late_orders]), SUM(main[measurable_orders]))，設為百分比。驗證總計及單州篩選；不要再平均 late_rate_pct。",
  },
  {
    id: "junior-hypothesis", chapterId: "ch04", mode: "explore", title: "沒有交辦：找出值得追查的客服問題", coreMinutes: 240, extensionMinutes: 240,
    tags: ["CTE", "JOIN", "CASE", "groupby", "假設與因果"],
    brief: "你想研究送達延遲與低評分是否同時出現。先做描述性比較，不能看見關聯就斷言晚到造成低評分。",
    questions: ["沒有評論的訂單是否被排除？", "一單多評論如何彙總？", "地區、品類或期間是否是其他可能解釋？"],
    queries: [query("main", "按配送狀態彙總評論", `WITH reviews AS (
  SELECT order_id, AVG(review_score) AS average_score
  FROM olist.order_reviews_raw GROUP BY order_id
), classified AS (
  SELECT o.order_id, r.average_score,
    CASE WHEN o.order_delivered_customer_date IS NULL OR o.order_estimated_delivery_date IS NULL THEN 'unknown'
      WHEN o.order_delivered_customer_date::date > o.order_estimated_delivery_date::date THEN 'late' ELSE 'on_time' END AS delivery_group
  FROM olist.orders_raw AS o LEFT JOIN reviews AS r ON o.order_id = r.order_id
  WHERE o.order_status = 'delivered'
)
SELECT delivery_group, COUNT(*) AS orders, COUNT(average_score) AS reviewed_orders,
  SUM(CASE WHEN average_score <= 2 THEN 1 ELSE 0 END) AS low_score_orders
FROM classified GROUP BY delivery_group ORDER BY delivery_group;`)],
    python: `result = df.copy()
for column in ["orders", "reviewed_orders", "low_score_orders"]:
    result[column] = pd.to_numeric(result[column], errors="raise")
result["review_coverage_pct"] = result["reviewed_orders"].div(result["orders"].replace(0, float("nan"))) * 100
result["low_score_pct"] = result["low_score_orders"].div(result["reviewed_orders"].replace(0, float("nan"))) * 100
assert (result["low_score_orders"] <= result["reviewed_orders"]).all()
print("有評論的人可能不是全部買家的代表；目前只描述關聯。")`,
    why: ["先把評論彙總成一單一列，避免多評論訂單被加權更多次。", "低分定義採訂單平均評分 ≤2，是需確認的分析選擇。", "同時呈現評論覆蓋率，避免忽略未評分訂單。"],
    checks: ["每組 低評分訂單 ≤ 已評分訂單 ≤ 全部訂單。", "unknown 配送狀態與未評論者不能偷偷當成準時或好評。"],
    practice: "把低分定義改為平均評分 ≤3，說明結果為何可能改變。",
    independent: "選一個期間或州別作分層比較，提出一個可被資料推翻的假設與還缺的證據。",
    deliverable: "候選問題、描述性比較、偏差與下一項調查建議。",
    handoff: "先向客服主管確認問題的價值與定義。得到確認後再做 Power BI 分組比較；圖表上同時保留分母和覆蓋率，不發布因果標題。",
  },
  {
    id: "junior-targets", chapterId: "ch04", mode: "assigned", title: "主管給了外部目標表：哪些州要先追查？", coreMinutes: 240, extensionMinutes: 300,
    tags: ["JOIN", "merge", "isna", "外部資料", "優先順序"],
    brief: "模擬主管交付 targets 資料表，要求把實際晚到率與目標相比。目標是教材假設，不是 Olist 真實公司的政策。",
    questions: ["目標是百分點、百分比還是訂單數？", "沒有目標的州怎麼處理？", "優先順序要看差距還是受影響訂單量？"],
    queries: [demo("state-kpi")],
    auxiliary: { targets: { rows: [{ customer_state: "SP", target_rate_pct: 8 }, { customer_state: "RJ", target_rate_pct: 10 }, { customer_state: "MG", target_rate_pct: 7 }], origin: "教材虛構的主管目標；不是 Olist 事實。" } },
    python: `targets = tables["targets"].copy()
assert targets["customer_state"].notna().all()
assert not targets["customer_state"].duplicated().any(), "目標表一州只能一列"
result = df.merge(targets, on="customer_state", how="left", validate="one_to_one", indicator=True)
result["late_rate_pct"] = pd.to_numeric(result["late_rate_pct"], errors="coerce")
result["gap_percentage_points"] = result["late_rate_pct"] - result["target_rate_pct"]
result["target_missing"] = result["target_rate_pct"].isna()
result = result.sort_values(["late_orders", "gap_percentage_points"], ascending=False)
print("沒有目標不等於達標；所有 target 值都是模擬政策。")`,
    why: ["SQL 負責一致的實際指標，pandas 接入另一份受控目標資料。", "先驗證目標表唯一性，再 merge，避免一州多個目標造成重複。", "比率相減是百分點，不是相對百分比變化。"],
    checks: ["合併後州別列數與 main 一致。", "沒有匹配目標的州仍保留，不能補 0 後當成嚴重超標。"],
    practice: "修改一個模擬目標，比較按差距與按晚到訂單數排序的不同。",
    independent: "自行設計一份有版本、適用期間、負責人的目標 CSV，說明如何驗證單位與範圍後才合併。",
    deliverable: "優先調查清單、模擬政策版本、缺目標清單與建議。",
    handoff: "Excel：下載 targets 為 CSV，使用文字州碼和數值百分點。Power BI：若要持續管理目標，建立州別／期間關係，核對結果與 pandas 一致；不要把教材目標當正式 SLA。",
  },
  {
    id: "junior-types", chapterId: "ch04", mode: "incident", title: "匯出後日期變文字：保留問題，不直接刪掉", coreMinutes: 240, extensionMinutes: 300,
    tags: ["SELECT", "to_datetime", "to_numeric", "資料型態", "異常隔離"],
    brief: "模擬檔案交接事故：日期欄混入無法解析的字串。你要辨識原本缺值與新增解析失敗，不用 dropna 一口氣刪掉證據。",
    questions: ["來源本來是空值，還是匯出後才壞掉？", "日期格式、時區和欄位名稱是否改變？", "哪些記錄應隔離並回報？"],
    queries: [query("main", "取得只讀訂單樣本", orders, "前 200 列樣本；接下來只修改記憶體副本，絕不寫回 Supabase。")],
    python: `working = df.copy()
if not working.empty:
    working.loc[working.index[0], "order_purchase_timestamp"] = "SIMULATED_BAD_DATE"
raw = working["order_purchase_timestamp"].copy()
parsed = pd.to_datetime(raw, errors="coerce", format="mixed")
result = working.copy()
result["source_missing"] = raw.isna()
result["parse_failed"] = raw.notna() & parsed.isna()
result["parsed_purchase_date"] = parsed
assert len(result) == len(df), "檢查不能偷偷刪掉資料"
print("只在副本注入一筆教材錯誤，並非真實來源異常。")`,
    why: ["copy 避免改寫原始 df，保留調查起點。", "errors='coerce' 把不能解析的日期轉成缺值，但要另外保留失敗旗標。", "同時保留原值、解析結果與原因，才有可交接的例外清單。"],
    checks: ["原始 df 不變，列數未下降。", "parse_failed 與 source_missing 分開統計，模擬標記明確。"],
    practice: "在副本加入一筆空日期與一筆格式不同但合法的日期，比較分類結果。",
    independent: "改用金額欄混入非數字的模擬輸入，自己設計轉型、隔離、前後總額對帳與問題回報。",
    deliverable: "原值／解析值／失敗原因對照、影響範圍與來源修復建議。",
    handoff: "Excel：匯出隔離清單供資料負責人確認，原始字串保留文字型態。Power BI 更新前先確認型態修復與列數對帳，不用忽略錯誤把整批資料靜默丟掉。",
  },
  {
    id: "independent-payments", chapterId: "ch05", mode: "explore", title: "接手不熟悉的付款資料", coreMinutes: 240, extensionMinutes: 240,
    tags: ["SELECT", "COUNT", "groupby", "describe", "陌生資料"],
    brief: "你以前主要看配送，現在要認識付款表。先自行推測 grain 再驗證；payment_installments 是記錄的分期數，不等於多筆實際扣款。",
    questions: ["order_id 和 payment_sequential 合起來能識別一列嗎？", "一單多支付方式如何保留？", "付款金額是否能代表退款後淨收入？"],
    queries: [query("main", "付款欄位抽樣", `SELECT order_id, payment_sequential, payment_type, payment_installments, payment_value
FROM olist.order_payments_raw
ORDER BY order_id, payment_sequential
LIMIT 200;`, "按鍵前 200 列，不適合推論全體支付偏好。")],
    python: `result = df.groupby("payment_type", dropna=False).agg(
    payment_rows=("order_id", "size"),
    distinct_orders=("order_id", "nunique"),
    known_payment_value=("payment_value", lambda values: pd.to_numeric(values, errors="coerce").sum(min_count=1))
).reset_index()
assert not df.duplicated(["order_id", "payment_sequential"]).any(), "付款鍵有重複，先調查"
print("只描述目前樣本；不能把分期數乘上已記錄付款金額。")`,
    why: ["先看欄位與實際資料再決定粒度，不照搬訂單表假設。", "同一訂單可能在不同支付類型重複出現，各組不同訂單數不能直接加成全體唯一訂單。", "複合鍵要用兩個欄位一起檢查。"],
    checks: ["複合鍵無重複，不代表 order_id 單独唯一。", "payment_value 型態可轉數字，缺值與負值另做核對。"],
    practice: "另外用 SQL 對全表按付款方式彙總，與樣本比較，說明樣本限制。",
    independent: "不使用範例程式，改接手 products_raw：提出資料盤點問題、檢查商品鍵和缺值，整理一個可分析與一個不可分析的問題。",
    deliverable: "新資料接手筆記、複合鍵驗證與分析可行性判斷。",
    handoff: "Notebook：交付可從頭執行的盤點與來源說明。若要支付方式 Dashboard，先用全表 SQL 彙總；樣本圖只能標示探索，不能當公司報表。",
  },
  {
    id: "independent-brief", chapterId: "ch05", mode: "assigned", title: "交給主管一份可採取行動的配送分析", coreMinutes: 240, extensionMinutes: 300,
    tags: ["CTE", "JOIN", "CASE", "sort_values", "主管交付"],
    brief: "主管只有五分鐘：請你建議先調查哪個地區的配送問題。你要整合 SQL、pandas、對帳、限制與交付，不再只貼 Query。",
    questions: ["優先降低受影響訂單數，還是處理最高晚到率？", "資料期間與業務關心期間一致嗎？", "你的建議是調查方向還是已有足夠因果證據的措施？"],
    queries: [demo("state-kpi"), demo("reconcile", "baseline")],
    python: `result = df.copy()
for column in ["late_orders", "measurable_orders", "delivered_orders", "late_rate_pct"]:
    result[column] = pd.to_numeric(result[column], errors="coerce")
assert result["delivered_orders"].sum() == tables["baseline"]["base_orders"].iloc[0]
result["small_denominator"] = result["measurable_orders"].lt(100)
result = result.sort_values(["late_orders", "late_rate_pct"], ascending=False)
print("先查看高影響地區，分母不足時降低結論強度；100 是教材篩查門檻，不是統計顯著性。")`,
    why: ["交付前先用獨立總量查詢對帳，而非只相信一張圖。", "同時看影響數與比率，避免只有少量訂單的地區排第一就過度反應。", "Notebook 留下分析選擇與限制，主管摘要只保留最重要的決策資訊。"],
    checks: ["分組總量等於基準，期間／狀態／缺值處理一致。", "摘要每個數字能回到 SQL 或 Notebook 的實際輸出。"],
    practice: "把交付對象換成客服主管，重寫優先順序與需要的明細，不只換圖表顏色。",
    independent: "自己選一個未做過的期間與一個業務問題，完成需求說明、SQL、pandas、對帳和五分鐘口頭說明；回答兩個資深審查追問。",
    deliverable: "可重跑 SQL＋Notebook、對帳表、管理摘要、資料限制與下一步。",
    handoff: "Power BI：匯入州別 main、對帳 baseline；設定文字州碼、整數訂單量與數值比率。先驗證總量，再做晚到數長條圖與率的指標卡。Excel：另交付例外明細。交接時寫明更新頻率、來源負責人與失敗聯絡人。",
  },
  {
    id: "independent-refresh", chapterId: "ch05", mode: "incident", title: "交付後更新失敗：建立最後一道檢查", coreMinutes: 240, extensionMinutes: 300,
    tags: ["MIN", "MAX", "COUNT", "assert", "報表維護"],
    brief: "模擬事件：排程結果突然是空表。你要阻止錯誤結果覆蓋既有報表、比較來源與查詢範圍，並留下可供同事接手的調查紀錄。",
    questions: ["來源沒更新、條件改錯、權限失效，還是檔案未讀到？", "Olist 是歷史資料，不能拿今天日期當資料應更新到的日期。", "哪一種情況應停止發布並通知誰？"],
    queries: [query("main", "確認來源期間與數量", `SELECT COUNT(*) AS order_rows,
  MIN(order_purchase_timestamp) AS earliest_purchase,
  MAX(order_purchase_timestamp) AS latest_purchase
FROM olist.orders_raw;`), query("monthly", "報表月份基準", monthly)],
    python: `monthly = tables["monthly"].copy()
required = {"month", "orders", "delivered_orders"}
def validate_report(frame):
    assert not frame.empty, "報表是空表"
    assert required.issubset(frame.columns), "報表缺必要欄位"
    assert not frame["month"].duplicated().any(), "月份重複"

validate_report(monthly)
empty_blocked = False
try:
    validate_report(monthly.iloc[:0])
except AssertionError:
    empty_blocked = True

checks = {
    "source_has_rows": bool(df["order_rows"].iloc[0] > 0),
    "report_not_empty": not monthly.empty,
    "required_columns_present": required.issubset(monthly.columns),
    "unique_months": not monthly["month"].duplicated().any(),
    "simulated_empty_export_is_blocked": empty_blocked
}
result = pd.DataFrame({"check": checks.keys(), "passed": checks.values()})
assert result["passed"].all(), "停止發布：先修復失敗檢查"
print("這是歷史快照的更新模擬，不代表 Olist 現在仍持續營運更新。")`,
    why: ["先確認來源基準，再判斷空報表是資料還是流程問題。", "assert 是可執行的驗證，不只是寫一句『已檢查』。", "模擬空表只在副本進行，保留原始來源與最後成功的成果。"],
    checks: ["必要欄位、列數、時間範圍與唯一鍵都要驗證。", "失敗時停止交付，不能以空表蓋掉最後成功報表。"],
    practice: "在 monthly 副本刪除 orders 欄，確認你的檢查會失敗，再修復並重跑。",
    independent: "自行注入重複月份或期間變更的模擬事故，重現、定位、修正，留下影響範圍與預防措施；不修改原始資料。",
    deliverable: "更新檢查程式、事故紀錄、修正證據、交接與回復方法。",
    handoff: "交接給報表維護人：記錄查詢版本、資料快照日期、最後成功執行時間、驗證門檻與聯絡人。Power BI 只在檢查通過後更新；真實排程／通知的部署由管理者另行設定，本教材不假裝已自動化。",
  },
];

export const workflowCatalog = {
  id: "analyst-sql-pandas-v1", version: "2026-08-30", title: "分析師入職任務包", coreHours: 50, totalHours: 100,
  description: "以 SQL＋pandas 完成主動探索、主管交辦與異常調查；沿用 CH1–CH5 能力地圖。時間是學習規劃，不是已完成時數或職級保證。",
  stages: workStages, modes: workModes, introduction: intro,
  pythonPrimer,
  sessions: ["先讀情境與確認問題", "看示範並分段執行", "自己改條件與修錯", "對帳、交接與回顧"],
  coreDefinition: "這是原有情境參考，不是已備妥的 100 小時整合課程。舊分鐘欄位僅為歷史規劃值，不代表學習負荷或掌握。",
  extensionDefinition: "新版以 SQL＋pandas＋Power BI 交錯學習，從分析師工作室 CH1 試學；依實作、修錯與独立解釋擴充，不依計時授予職級。",
  sources: [
    { label: "分析師職責：需求、報表、驗證、交付與維護", url: "https://www.onetonline.org/link/summary/15-2051.01" },
    { label: "pandas 與 SQL 的操作對照", url: "https://pandas.pydata.org/docs/getting_started/comparison/comparison_with_sql.html" },
    { label: "pandas merge：關係驗證與空鍵差異", url: "https://pandas.pydata.org/docs/reference/api/pandas.merge.html" },
    { label: "Power BI 分析師能力框架", url: "https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/pl-300" },
  ],
  missions: missions.map((mission) => ({ ...mission, pythonIntro: intro,
    studyPlan: { core: [{ label: "理解情境與需求", minutes: mission.coreMinutes / 6 }, { label: "SQL＋pandas 示範與陪跑", minutes: mission.coreMinutes / 2 }, { label: "驗證、交付與回顧", minutes: mission.coreMinutes / 3 }], extension: [{ label: "變形與獨立任務", minutes: mission.extensionMinutes * 2 / 3 }, { label: "修錯、重跑與口頭審查", minutes: mission.extensionMinutes / 3 }] },
  })),
};
export function getWorkflowMission(id) { return workflowCatalog.missions.find((mission) => mission.id === id) || getIntegratedMission(id); }
