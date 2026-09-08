# PROGRESS.md — 唯一進度紀錄

這是全 repo 唯一的進度檔：狀態只住這裡。歷史區塊為唯讀原文保存，永不改寫。

## 現在位置（≤10 行，每次上課後整段覆寫；git diff 就是它的歷史）

- 產品目標：100 小時整合 SQL＋pandas＋Power BI，以入職情境／工作任務交錯學工具；100h 是設計預算，不是已上線或實測時數。
- 2026-09-06 課程：CH1 26 題 SQL、6 題 pandas、3 段 BI 外部實作。第一單元 9 個主線活動＋3 個跨來源複習；其餘單元梯度、CH2–CH5 與完整專案尚未補齊。
- 第一單元從環境／目錄／欄位／樣本接全表計數、訂單修錯、商品變形與 pandas 快照對帳；每步解釋目的、名称出處、通用骨架、示範與下一步。未成功紀錄可觸發隔日變形複習，不代表 AI 已診斷誤解。
- 四頁共用介面維持；SQL／pandas／BI 草稿與未送出問題新增帳號同步、離線備份及版本衝突比較。保存不執行、不送 AI；目前草稿不是逐鍵永久版本，亦非完成證據。
- 家教驗收涵蓋最小修正／題目交付邊界、COUNT 與 LIMIT、NULL 與重複；示意或不符本站限制的 SQL 區塊明標不可執行。送出時讀取草稿／指定紀錄，仍不背景監看或自動改寫。
- 本人仍在 Chapter 1 / Unit 1.2；產品 QA 不增加學生掌握、題數或時數；白紙債 `unit01_3_challenge.sql` 未做，既有學生檔案／紀錄未改。
- 2026-09-07 依本人明確授權正式發布 c7cc269：https://supply-sql-lab-a8594755.netlify.app/；production 部署 6a9f6d145a5ea6fc8d974eb6，版本 2026.09.07-c7cc269。此次未建立 Preview，日後仍預設 Preview。
- 本輪正式站驗證：130 項測試、build、Auth、帳號隔離／409 衝突、4 題 SQL、複習與草稿匯出及 3 輪真實 AI 追問通過；已閱讀家教回答，臨時 QA 帳號與紀錄均已清除。pandas UI 未重跑。
- 本輪 Mac 鎖定，未重新操作瀏覽器；前輪桌面 1470×745 已測、手機 viewport 未生效仍待複測。未再改 Supabase 資料／權限；大型共享 bundle 警告仍待改善。
- 下一步：本人先試第一單元；補手機複測及其餘 CH1 教學梯度，再擴充後續三工具工作情境。未宣稱完整 100h、主動式家教或 Power BI 檔案審查已完成。

## 概念表（五級量尺；原 40 列完整保留，2026-08-25 起新增五章 SQL 追蹤列；Next Check 欄 = 暖身題庫 + 正式詞彙表）

Status scale（狀態量尺）:

```text
Not Started -> Introduced -> Practiced -> Can Explain -> Independent
（未開始 → 已接觸 → 已練習 → 能解釋 → 能獨立）
```

- `Introduced`: you have seen the concept and heard the explanation.（已接觸：看過這個概念、聽過解釋。）
- `Practiced`: you used it in code or SQL.（已練習：在程式碼或 SQL 裡用過。）
- `Can Explain`: you can explain it in your own words.（能解釋：能用自己的話說明。）
- `Independent`: you can use it from a blank page without hints.（能獨立：白紙狀態、不用提示就能寫出來。）

### Python Concepts（Python 概念）

| Concept（概念） | Meaning（意思） | Status（狀態） | First Lesson（首次課程） | Practice Example（練習範例） | Next Check（下次檢查） |
| --- | --- | --- | --- | --- | --- |
| `print()` | output function（輸出函數） | Practiced | Inventory Cost Calculator | `print("Product:", product_name)` | Explain what appears on screen and why |
| `variable` | 變數 | Practiced | Inventory Cost Calculator | `unit_price = 45` | Explain name vs value |
| `string` | 文字 | Introduced | Inventory Cost Calculator | `"Keyboard"` | Explain why quotation marks are needed |
| `integer` | 整數 | Introduced | Inventory Cost Calculator | `45`, `30` | Explain why numbers do not need quotation marks |
| `=` | assignment operator（指定/賦值運算子） | Introduced | Inventory Cost Calculator | `unit_price = 45` | Explain right side goes into left name |
| `*` | multiplication operator（乘法運算子） | Practiced | Inventory Cost Calculator | `unit_price * units_sold` | Use it in another calculator |
| `NameError` | name lookup error（名稱錯誤） | Practiced | Sales Revenue Calculator | `units_price` vs `unit_price` | Fix one variable-name error |
| Terminal | 終端機 | Practiced | Sales Revenue Calculator | `python3 01_lessons/week_01_basics/day2_sales_revenue/1_example.py`（該檔現位於 `90_archive/python_week01/day2_sales_revenue/1_example.py`） | Run a file without help |
| `cd` | change directory（切換資料夾） | Practiced | Sales Revenue Calculator | `cd python_supply_chain_learning` | Explain current folder |
| `pwd` | print working directory（顯示目前資料夾） | Practiced | Sales Revenue Calculator | `pwd` | Use it before running Python |

### Pandas / Notebook Concepts（Pandas / Notebook 概念）

| Concept（概念） | Meaning（意思） | Status（狀態） | First Lesson（首次課程） | Practice Example（練習範例） | Next Check（下次檢查） |
| --- | --- | --- | --- | --- | --- |
| Jupyter Notebook / `.ipynb` | 一格一格執行 Python 的分析工作區 | Introduced | Week 05 pandas | Open a notebook in VS Code | Create a valid blank notebook without help |
| kernel | notebook 使用的 Python 執行環境 | Introduced | Week 05 pandas | Select `Python 3.14` / `.venv` | Explain why notebook needs a kernel |
| code cell | notebook 裡可執行的一格程式 | Practiced | Week 05 pandas | Run `import pandas as pd` | Run cells from top to bottom |
| `Shift + Enter` | 執行目前 cell 並移到下一格 | Practiced | Week 05 pandas | Run first pandas cell | Use it without reminder |
| pandas | Python 的表格資料分析工具 | Introduced | Week 05 pandas | `import pandas as pd` | Explain pandas vs Python |
| `pd.read_csv()` | 讀取 CSV 成為 DataFrame | Practiced | Week 05 pandas | `pd.read_csv(data_file)` | Read a CSV from a fresh notebook |
| DataFrame / `df` | pandas 裡像 Excel 表格的資料物件 | Introduced | Week 05 pandas | `df = pd.read_csv(data_file)` | Explain rows, columns, and values |
| `Path` | Python 的檔案路徑工具 | Introduced | Week 05 pandas | `data_file = Path(...)` | Explain why full paths are temporary |
| `.exists()` | 檢查檔案路徑是否存在 | Practiced | Week 05 pandas | `data_file.exists()` | Diagnose `True` vs `False` |
| `df.head()` | 查看前幾筆資料 | Practiced | Week 05 pandas | `df.head()` | Explain why analysts inspect first rows |
| `df.shape` | 查看資料列數和欄位數 | Practiced | Week 05 pandas | `df.shape` | Interpret `(10800, 21)` |
| `df.columns.tolist()` | 查看欄位名稱 | Practiced | Week 05 pandas | `df.columns.tolist()` | Use columns to form analysis questions |

### SQL Concepts（SQL 概念）

| Concept（概念） | Meaning（意思） | Status（狀態） | First Lesson（首次課程） | Practice Example（練習範例） | Next Check（下次檢查） |
| --- | --- | --- | --- | --- | --- |
| table | 資料表 | Introduced | Olist First SQL Practice | `olist.orders_raw` | Explain what one table represents |
| row | 資料列 | Introduced | Olist First SQL Practice | one order in `orders_raw` | Explain what one row means in business terms |
| column | 欄位 | Introduced | Olist First SQL Practice | `order_id`, `order_status` | Explain why analysts select specific columns |
| `SELECT` | select columns（選取欄位） | Introduced | Olist First SQL Practice | `SELECT order_id, order_status` | Choose columns for a simple order check |
| `FROM` | from table（從哪張表） | Introduced | Olist First SQL Practice | `FROM olist.orders_raw` | Explain table source |
| `LIMIT` | limit rows（限制資料列數） | Introduced | Olist First SQL Practice | `LIMIT 10` | Explain why preview queries use small row counts |
| `WHERE` | filter rows（篩選資料列） | Introduced | Olist First SQL Practice | `WHERE order_status = 'delivered'` | Filter one business status |
| `ORDER BY` | sort rows（排序資料列） | Introduced | Olist First SQL Practice | `ORDER BY order_purchase_timestamp DESC` | Sort newest orders first |
| schema | database namespace（資料庫裡的表格分組） | Introduced | Olist First SQL Practice | `olist` | Explain why table names include `olist.` |
| `information_schema` | database metadata catalog（資料庫目錄資訊） | Introduced | Olist First SQL Practice | `information_schema.tables` | Use it to find available tables |
| row count | number of rows（資料列數量） | Introduced | Olist First SQL Practice | `COUNT(*)` by table | Explain why analysts check table sizes first |
| SQL statement | complete SQL instruction（完整 SQL 指令） | Introduced | Olist Student First SELECT Workbench | `SELECT current_user;` | Explain why one query is one complete instruction |
| semicolon `;` | statement terminator（SQL 指令結束符號） | Introduced | Olist Student First SELECT Workbench | `SELECT current_user;` | Explain why a query ends with `;` |
| `AS` | alias keyword（欄位別名關鍵字） | Introduced | Olist Student First SELECT Workbench | `current_database() AS database_name` | Rename one result column |
| SQL function | built-in database command（資料庫內建函數） | Introduced | Olist Student First SELECT Workbench | `current_database()` | Explain what value the function returns |
| `AND` | combine filter conditions（合併篩選條件） | Introduced | Olist Student First SELECT Workbench | `condition_1 AND condition_2` | Explain why both conditions must be true |
| `NOT LIKE` | text pattern exclusion（排除文字模式） | Introduced | Olist Student First SELECT Workbench | `schema_name NOT LIKE 'pg_%'` | Explain what pattern is being excluded |
| `<>` | not equal operator（不等於運算子） | Introduced | Olist Student First SELECT Workbench | `schema_name <> 'information_schema'` | Use it to filter out one value |
| Primary Key | 主鍵：唯一識別一列的欄位 | Not Started | Chapter 1 Unit 6 | `orders_raw.order_id` | Explain why a primary key should identify one row |
| Foreign Key | 外鍵：指向另一張表主鍵的欄位 | Not Started | Chapter 1 Unit 6 | `order_items_raw.order_id` | Explain how it connects order items to orders |
| data type | 資料型別：文字、數字、日期等值的種類 | Not Started | Chapter 1 Unit 2 | timestamp vs numeric | Explain why a date and text behave differently |
| `NULL` / `IS NULL` | 缺少或未知的值／檢查空值 | Not Started | Chapter 1 Unit 4 | `WHERE delivered_at IS NULL` | Explain why `= NULL` does not work |
| `DISTINCT` | 移除結果中的重複組合 | Not Started | Chapter 1 Unit 4 | distinct order statuses | Explain what is being made unique |
| `IN` / `BETWEEN` / `LIKE` | 清單、範圍與文字模式篩選 | Not Started | Chapter 1 Unit 3 | status list / date range / text pattern | Choose the right filter for three needs |
| `OR` / `NOT` | 任一條件成立／反向條件 | Not Started | Chapter 1 Unit 3 | status A OR status B | Explain AND vs OR without code |
| `CASE WHEN` | 條件分類，類似 Excel IF | Not Started | Chapter 1 Unit 5 | classify delivery status | Build one business category |
| date / string / numeric functions | 日期、文字、數字函數 | Not Started | Chapter 1 Unit 5 | `DATE_TRUNC`, `LOWER`, `ROUND` | Explain input and output of one function |
| SQL logical order | SQL 邏輯執行順序 | Not Started | Chapter 1 Unit 6 | FROM → WHERE → SELECT → ORDER BY → LIMIT | Explain why an alias may not work in WHERE |
| debugging | 除錯：縮小問題並讀懂錯誤訊息 | Not Started | Chapter 1 Unit 6 | run one clause at a time | Diagnose one real SQL error |
| grain | 資料粒度：一列在商業上代表什麼 | Not Started | Chapter 2 Unit 1 | one order vs one order item | Explain why grain matters before JOIN |
| relationship cardinality | 表格關係數量：一對一、一對多、多對多 | Not Started | Chapter 2 Unit 1 | orders to order_items | Identify one-to-many in Olist |
| `INNER JOIN` | 只保留兩邊成功配對的列 | Not Started | Chapter 2 Unit 2 | orders ↔ customers | Explain which rows disappear |
| `LEFT JOIN` | 保留左表全部列，再接右表 | Not Started | Chapter 2 Unit 2 | orders → reviews | Explain why it finds missing matches |
| RIGHT / FULL / Self Join | 其他 JOIN 方向與同表串接 | Not Started | Chapter 2 Unit 4 | small interview examples | Choose when each is appropriate |
| Multiple Joins | 串接三張以上資料表 | Not Started | Chapter 2 Unit 3 | customers → orders → items → products | State each JOIN key before writing |
| JOIN duplication | JOIN 後因粒度不同造成列數／金額放大 | Not Started | Chapter 2 Unit 5 | order joined to many items | Reconcile row counts before and after JOIN |
| anti-join | 找出沒有配對紀錄的方法 | Not Started | Chapter 2 Unit 5 | `LEFT JOIN ... IS NULL` | Find one type of missing relationship |
| aggregate functions | 彙總函數：COUNT、SUM、AVG、MIN、MAX | Not Started | Chapter 3 Unit 1 | total payment value | Match one business metric to a function |
| `GROUP BY` | 分組彙總，類似 Excel 樞紐分析表 | Not Started | Chapter 3 Unit 1 | revenue by payment type | Explain one result row per group |
| `HAVING` | 在彙總後篩選群組 | Not Started | Chapter 3 Unit 1 | groups above a threshold | Explain WHERE vs HAVING |
| Subquery | 放在另一個查詢中的子查詢 | Not Started | Chapter 3 Unit 2 | values above average | Explain inner result and outer use |
| CTE / `WITH` | 具名的中繼查詢步驟 | Not Started | Chapter 3 Unit 3 | monthly_sales | Split one analysis into testable steps |
| Window Function / `OVER` | 不折疊資料列的分析計算 | Not Started | Chapter 3 Unit 4 | ranking within category | Explain window result vs GROUP BY result |
| `PARTITION BY` | 在 Window Function 內分組重算 | Not Started | Chapter 3 Unit 4 | rank per category | Explain where ranking restarts |
| `ROW_NUMBER` / `RANK` / `DENSE_RANK` | 排名函數 | Not Started | Chapter 3 Unit 4 | Top 3 products per category | Explain how ties differ |
| `LAG` / `LEAD` | 取得前一列／下一列的值 | Not Started | Chapter 3 Unit 5 | previous month revenue | Explain why LAG supports growth analysis |
| running total / moving average | 累計／移動平均 | Not Started | Chapter 3 Unit 5 | cumulative revenue / 3-month average | Explain the window frame in business terms |
| KPI / metric definition | 關鍵績效指標／指標定義 | Not Started | Chapter 4 Case 1 | on-time delivery rate | State numerator, denominator, scope, and date |
| validation / reconciliation | 驗證／對帳 | Not Started | Chapter 4 Case 4 | totals, NULLs, duplicates | Name three checks before reporting |
| insight / assumption / limitation | 洞察／假設／限制 | Not Started | Chapter 4 Case 5 | executive summary | Separate evidence from inference |

## 學習日誌（append-only（只增不改），新條目在上，繁中模板）

### 2026-09-07 — 明確授權的 Netlify 正式發布
- 目標：依本人要求將已驗證版本發布正式站，本次不使用 Preview；不改學生掌握或完成紀錄。
- 變更：c7cc269 加入正式版標示／入口及 production QA 明確開關；正式環境補齊新版家教代理 Secret，未顯示或提交金鑰。
- 發布：僅執行一次 --prod --context production；部署 6a9f6d145a5ea6fc8d974eb6，正式入口 https://supply-sql-lab-a8594755.netlify.app/，遠端資產版本核對成功。
- 驗證：130 測試與 build 通過；正式 Auth、4 題 SQL、草稿隔離／衝突、匯出與 3 輪 AI 真實追問通過；逐段讀取回答，精確清除臨時帳號及測試紀錄。
- 待辦：本輪未重跑瀏覽器／pandas UI；手機複測、共享 bundle 與完整 100h 內容仍待改善，白紙債及本人進度不變。

### 2026-09-07 — 推送 main 並部署 Netlify Preview
- 今天做了：依本人明確要求，將 105 個產品程式／教材／文件變更整理為 251c581 並推送 origin/main；掃描未發現金鑰，環境檔、私密文件及建置產物未提交。
- 商業情境：把已驗證的改版保存到 GitHub，將同一份應用程式发布為非正式預覽；Netlify 未連接 Git 自動部署，沒有觸發或執行正式發布。
- 我現在會：本次是版本維護，不增加學生能力。128 項測試、建置與部署後 Auth、四題真實 SQL、草稿／衝突／RLS／複習／匯出驗證通過；測試帳號與紀錄已清除。
- 還不懂：Mac 鎖定使本輪瀏覽器畫面複測未執行；未將前輪 AI／pandas 實測冒充本輪結果。手機與大型 bundle、未完成課程內容仍列待辦。
- 下次：開啟固定 Preview，版次 2026.09.07-251c581；不可變網址 https://6a9f6930f7daab4ef29fa218--supply-sql-lab-a8594755.netlify.app/ 。本人 Unit 1.2 與白紙債保持。

### 2026-09-06 — 帳號草稿、第一單元補強與家教驗收
- 今天做了：新增按帳號保存草稿與未送出問題、衝突比較／備份；第一單元補計數、修錯、變形與 pandas 交接說明及三個複習題；版本提示與固定 Preview 入口更新，AGENTS.md 記錄部署 context 陷阱。
- 商業情境：新人從未知資料找到來源、抽查與盤點，再按需交接 pandas；中途離開不丟草稿，失敗後隔日換來源練習。保存、執行、結果核對與獨立掌握分開。
- 我現在會：此為產品 QA，不增加本人能力。128 項測試與建置、Preview 登入／SQL／pandas／AI 自由追問、RLS、草稿還原與衝突、ZIP 下載解壓通過；真實 AI 三輪答案已人工閱讀，不能把字串檢查當教學認證。臨時 QA 帳號與測試紀錄已精確清除，測試下載移至垃圾桶。
- 還不懂：第一單元補強不等於全部 CH1 或 100h；手機 viewport 工具未生效，本輪手機尚待複測。首次 alias 部署缺設定已用明確 draft 修復；未碰正式站、Olist 或學生作答。
- 下次：從固定 Preview 試學新手探索→計數→修錯→變形，依本人回饋補其餘 CH1；最終可重現網址 https://6a9d1b7fc78652a2f4b25011--supply-sql-lab-a8594755.netlify.app/ ，既有 Unit 1.2 與白紙債保持。

### 2026-09-05 — 統一四頁產品邏輯並重審課程
- 今天做了：總覽／工作室／自由查詢／紀錄共用主題與導覽；自由查詢改用共用工具列、資料表抽屜與旁邊家教，切頁保留工作狀態，歷史帶回原錯誤／結果預覽。總覽改用整合課程摘要並明示缺口，更新 AGENTS.md 一致性規則。
- 商業情境：總覽找到下一步 → 工作室學／做／問 → 自由查詢探索 → 紀錄回看／帶回／下載；同一份結果與學習證據跨頁一致，不要求使用者重新理解四套操作。
- 我現在會：此輪為產品 QA，不增加本人能力或完成量。119 項測試、build、真實 SQL／筆記／錯誤回帶／ZIP 下載與 Preview 登入、SQL、AI 追問通過；桌面及手機四頁無水平溢出，臨時帳號及測試紀錄已精確清除。
- 還不懂：課程目前仍是 CH1 試學樣板，缺後續 JOIN／KPI／異常專案、pandas 合併分組等梯度、Power BI 模型／DAX／報表審查及陌生資料驗收；不以 31 個活動或 100h 標籤冒稱足夠。
- 下次：從 Preview 6a9c63a2264b65bcee9369e6 試用同一套四頁流程，依 01_sql/README.md 的符合性重審擴充內容；正式站未改，學生 Unit 1.2／白紙債保留。

### 2026-09-05 — 零基礎入職探索與家教更正
- 今天做了：新增發現名稱、選分組、查欄位與看樣本 4 個活動，銜接原目錄題；先白話目的與通用骨架，再最小完整 PostgreSQL。同步修正 AGENTS.md 的提示限制、Notebook 前置、執行環境及維護範圍。
- 商業情境：剛入職、沒有 SQL 基礎時，先確認系統與唯讀權限，再從目錄發現名稱；記錄查詢、可見範圍與待確認定義，而不是猜公司名稱或查完表名就轉工具。
- 我現在會：本次是產品 QA，學生能力／題數／時數不變。117 項測試與建置、5 個真實 SQL 查詢、4 輪家教情境及 Preview 登入／SQL／2 輪追問通過；測試帳號及其紀錄已清除，未改本人作答。
- 還不懂：需本人試學確認前置說明是否足夠；此輪不宣稱完整 100h 或 CH2–CH5 已完成。首次真實家教驗收仍重貼進階答案，經服務端前置情境橋接與指令調整後重測通過；保留回歸案例防止再次偏離。
- 下次：開啟 Preview 6a9c4cd055b3f5a029485cf7，從「不知道表名，先查目錄」理解 SELECT／FROM 與名稱來源，再依結果走下一小步；正式站不變，既有 Unit 1.2 與白紙債保留。

### 2026-09-05 — 試學回饋：缺少從零開始發現資料的教學
- 今天做了：讀取本人貼上的家教對話；確認連續追問名稱來源與固定／替換部分時，家教仍反覆貼出同一個完整目錄查詢。
- 商業情境：剛入職、沒有 SQL 基礎，也不知道資料庫／分組／表名；需要先取得環境與權限資訊，再從目錄查詢逐步發現資料。
- 我現在會：本次沒有新的執行結果或獨立解釋證據，概念狀態、完成題數及學習時數不變。
- 還不懂：SELECT 後面為何填 table_name、哪些名稱是系統提供、哪些應從查詢結果取得；這是概念提問，不造假成執行錯誤。
- 下次：教學先提供白話目的、不可直接執行的通用骨架、可執行的最小 PostgreSQL 目錄查詢，以及結果如何決定下一步；網站教材／家教行為尚未實作此輪修正，Preview 不變。

### 2026-09-05 — 重做工作室空間分配與完整高度聊天

- 本次：依使用者指出的章節橫幅與小聊天窗重構；取消固定課程欄，頂部兩列共 96px，新增結果頁與專心對話模式；不增加教材或學生掌握狀態。
- 驗證：113 項測試、build；真實瀏覽器 1366×768／1280×720／390×844，長篇串流、獨立捲動、Esc／焦點返回、切頁草稿保留與來源展開；SQL 9 表及 pandas 結果 row_count=20、column_count=3。
- 線上：只發布 Preview 6a9c429dc0a81fa041ae97c1；check:auth、真實登入、重新執行 SQL、依最後紀錄追問通過，瀏覽器無 console error。未正式發布，未改 Supabase 家教服務。
- 修正：放大聊天後點已選取的程式頁籤也能返回；錯誤／復原提示隨對話捲動，非額外固定橫幅；教材樣本不再一律標成 20 列真實快照。
- 下次：請使用者從新 Preview 試用閱讀、寫程式及長篇追問；此次為產品 QA，不計學習時數。測試帳號採獨立目的標記並在驗收後精確清除，本人 Unit 1.2／白紙債不變。

### 2026-09-05 — 工作室與家教 v2 完成瀏覽器驗收
- 今天做了：使用獨立臨時帳號在真實 Chrome 驗收；定位舊 CSS 的全域 `!important` 蓋過淺色 CodeMirror，縮限舊樣式。修正提案支援 Markdown 理由、完整多行版本與複製，已套用不再誤標過期，提示不冒稱已執行。資料目錄教學明確區分 information_schema 與 olist，單元交接不冒稱本題可直接轉交。
- 商業情境：完整走過失敗查詢 → AI 根據錯誤給最小修改 → 比較 → 套用／復原 → 學生按執行驗證；只問概念時直接回答，選取 `FROM information_schema.tables` 後家教正確只解釋該行。
- 我現在會：此為產品 QA，不增加學生掌握、完成題數或時數。SQL 查出 9 張表；真實 20 列樣本在瀏覽器 Python 得到 20／3，KeyError 保存及 pandas 提案套用後重跑通過。左欄捲動 0→499 時編輯器／聊天／頁面位置不變，家教收合 410→51px、課程收合 239→57px，900／390px 用頁籤切換，手機無頁面水平溢出且輸入框可見。歷史切回 4 則保留，複製不改草稿，手改後舊提案失效。
- 修正與測試：原 SQL 結尾 `; -- 我的新備註` 在 RPC 誤判為多條指令；執行前使用解析器提供的註解位置移除註解再去尾分號，原始草稿仍留在 Log，多指令／修改指令仍拒絕。最終 Preview 同一份原草稿重跑成功。112 項自動測試、建置通過，npm ci audit 0；未更動資料庫權限或正式 RPC。
- 已知邊界：目前 SQL parser 對中文區塊註解仍有既有限制，可使用中文 `--` 單行註解；RPC 對字串中的部分管理詞仍保守限制。共享 bundle 仍有大小警告。此輪未完成新版 CH2–5 教材，也未驗收外部 Power BI 報表，不宣稱 100h 已備齊。
- 下次：本輪 Goal 可結案，再討論主動式家教的觸發與打擾界線；正式站保持原版。最終 Preview 為 6a9c2a3a3508f4d19b68213a，已登出並清除唯一臨時 QA 帳號與其紀錄，學生 Unit 1.2／白紙債不變。

### 2026-09-05 — 工作室與家教 v2 Goal 實作，待解鎖目視驗收
- 今天做了：重整主導覽、編輯中心工作區、收合／調寬與逐題講解；導入自由 SSE Chat、受控上下文補查、結構化修正提案、版本保護／差異／復原、多對話與正確失敗配對。新增 Netlify 原生串流函式與獨立 Supabase v2 代理，未改正式舊代理；文件說明與 AGENTS 合約同步。
- 商業情境：初學者不必先答對或選模式，能用當下草稿和真實錯誤問家教；看懂修改理由，再確認套用並用查詢結果驗證，避免 AI 範例覆蓋新寫的內容。
- 我現在會：這是產品 QA，不增加學生題數、能力或時數。111 項自動測試含 React DOM 的套用／復原、過期、自由提問、IME、失敗配對與對話切換；最新 Preview 真實 SSE 317 段、首字約 4.3 秒、約 7.1 秒完成，修正未限定 schema 的草稿後實際查出 3 列，追問／去重／匯出成功。
- 還不懂：Mac 兩次回報鎖定，不能目視驗收新 UI 或真實瀏覽器 Python。前候選版跨工具 API、真實資料本機 pandas 與 ZIP 通過，但不算瀏覽器或外部 Power BI 驗收；本機全家教腳本完成五次 AI 後被部署 npm ci 中斷，改用 Preview 端到端測試且臨時帳號均清除。建置仍有共享 bundle 大小警告。
- 下次：解鎖 Mac，從最新 Preview 完成桌面／窄螢幕、獨立捲動、自由提問、選取、差異套用／復原與 Python 實際操作；通過才完成 Goal，然後討論主動式家教是否值得實作。正式站未發布，學生仍在 Unit 1.2、白紙債不變。

### 2026-09-05 — 分析師工作室 UI／UX 與家教 review
- 今天做了：讀取工作室、導覽、教材與家教前後端；在目前 Preview 檢查 SQL／pandas 畫面及家教收合，重跑 17 項家教測試並用合成輸入重現上下文縮減與套用判斷缺口。
- 商業情境：讓學習者在同一個工作區理解任務、寫程式、看結果並自由追問；家教建議必須對應真正的草稿版本、資料來源與錯誤。
- 我現在會：本次是產品審查，不新增學生能力、完成題數或時數；確認桌面左右區域已有獨立 overflow，但家教收合仍留整欄，教材與目錄任務有落差。
- 還不懂：尚未實作修正或新一輪真實 AI 回覆驗收；合成壓力檢查證明欄位可被整份移除，不代表先前每一次錯答都由同一原因造成。
- 下次：先修上下文保留與受控補查、版本化修改／復原及 Chat 互動，再統一版面和逐題教材，以完整修錯流程做 Preview 驗收；不發布正式站。

### 2026-09-03 — 發布家教審查套用 Deploy Preview
- 今天做了：把家教逐行差異與確認套用功能發布為 Netlify Deploy Preview，並以部署後網址檢查公開設定、Supabase Auth key、Email 登入能力與 readiness。
- 商業情境：先把尚未由本人驗收的產品變更隔離在免費 Preview，不覆蓋正式網站；登入入口先通過實際 Auth 接受測試，再交給本人試學。
- 我現在會：本次是產品發布，沒有新增學生能力；101 項測試與建置通過，Auth readiness 通過，未建立測試帳號或寫入資料庫。
- 還不懂：尚未由本人在登入後實際操作「查看修改並套用」；Auth readiness 不等於 SQL、Log 或 AI 端到端測試，也不代表 AI 修正版一定正確。
- 下次：本人登入最新 Preview，在 Unit 1.2 檢視 schema 修正差異、確認套用並親自執行，回報畫面或錯誤後再調整。

### 2026-09-03 — 編輯器家教可審查後套用修正版
- 今天做了：產品層新增「複製到剪貼簿」與「查看修改並套用」兩條路；完整 SQL／pandas 先顯示原行、新行及增刪，再由本人確認寫入目前編輯器。
- 商業情境：分析師採用 AI 建議前先做 code review，清楚知道 schema、條件或欄位改了什麼；套用與執行分開，避免把建議誤當成功證據。
- 我現在會：本次是產品 QA，101 項測試、正式建置與 diff 檢查通過；沒有新增學生能力、完成題數或學習時數。
- 還不懂：AI 仍可能提供不正確的完整程式；家教只在送出時取得草稿與執行證據，不在背景持續監看。本機瀏覽器受網址政策阻擋，因此沒有冒充完成目視驗收。
- 下次：在 Unit 1.2 實際檢視家教把 `customers_raw` 改成 `olist.customers_raw` 的差異，確認套用後由本人按執行，以真實結果判定是否修正成功。

### 2026-09-02 — 釐清完整表名與家教可見範圍
- 今天做了：本人執行 `FROM customers_raw` 後收到 `READ_ONLY_POLICY`；家教先修正拼字，第二次才補上 `olist.`，但編輯器仍是未限定 schema 的原草稿。
- 商業情境：分析師在多個 schema 的資料庫工作時，使用 `olist.customers_raw` 指明資料位置，避免讀到同名表或被唯讀政策擋下。
- 我現在會：本次只完成錯誤診斷，尚未有修正版成功執行證據，因此不調整 SQL 能力等級或完成題數。
- 還不懂：家教會收到送出當下的草稿、欄位目錄與被指定的最後執行錯誤；「已複製」只放進剪貼簿，不會自動套用。第一則漏掉 schema 是家教回答錯誤，不是看不到 schema。
- 下次：把編輯器的來源改成 `olist.customers_raw`，按執行後貼出欄名與列數；成功前不進下一題。

### 2026-08-31 — Goal 實作 CH1 三工具整合樣板與獨立工作區
- 今天做了：建立六單元、27 個實質活動（18 SQL／6 pandas／3 Power BI），接入完整多行解說、來源對帳、帳號紀錄、家教及新版 Dashboard；移除學習包時數暗示，修正大片空白與耦合捲動，只發布 Preview。
- 商業情境：從新人盤點、交付名單、需求篩選、品質調查、分類到更新重跑；工具依任務交接，不為了湊三工具重做同一份計算。
- 我現在會：本次是產品 QA，不改學生能力。99 項測試、真實 SQL／pandas／AI、追問和匯出通過；實際桌面教材捲動不帶動課程或對話，家教輸入可見；測試帳號與其資料已刪除。
- 還不懂：CH2–CH5 新版逐題教材未完成，100h 份量需試學；Power BI 只驗自報契約，沒有實際操作 Desktop。驗收發現 pandas 首次匯入及 AI 長講解提早逾時，已分離 Python 初始化計時、調整 Preview 家教期限並通過重測；外部 AI 仍可能逾時，須保留問題並明示失敗。
- 下次：本人使用最新 Preview 試學 CH1，以真實作答、修正、無提示新題與交付審查判斷能力，保留原有 Unit 1 白紙債，再依回饋延伸教材。

### 2026-08-31 — 討論整合課程的完成標準（建議，尚待確認）
- 今天做了：核對既有課綱及 PostgreSQL、pandas、Microsoft PL-300／Power BI Desktop 官方文件，提出以技能與交付證據驗收 100 小時整合學習的建議；未修改網站或部署。
- 商業情境：分析師從需求確認、資料探索／品質、多表關聯、指標分析到報表交付與更新；三種工具依需要搭配，不強迫重複做相同計算。
- 我現在會：本次為課程設計討論，未增加學生能力、完成題數或學習時數；建議不等於學生已核准。
- 還不懂：尚需逐題設計與試學才可驗證份量；Power BI 真實操作環境與評核方式仍需確認，不能以網站圖表、勾選或 AI 代寫取代外部成果驗證。
- 下次：先確認可驗收標準，再建立技能／任務覆蓋並試學首批單元；補需求澄清、基本統計判讀、陌生資料及更新重跑，延後機器學習、進階工程與高階 BI 管理。

### 2026-08-31 — 100 小時整合學習目標與產品缺口核對
- 今天做了：學生澄清優先建構 SQL＋pandas＋Power BI 的 100 小時整合學習，不必先完成 50 小時 SQL；家教唯讀核對現有教材生成與版面程式，僅更新本進度檔。
- 商業情境：用入職主動探索、主管交辦與數字異常串起分析流程，依任務需要選工具，不強迫每題三種工具全部使用。
- 我現在會：本次是產品需求討論，沒有新增學生練習完成、能力評級或實際學習時數。
- 還不懂：現有下載包與時數標籤不足以證明學習量；尚缺完整整合路線驗收與充分 Power BI 練習。桌面主區 margin:auto 垂直置中、側欄無獨立捲動造成截圖問題，尚未修正。
- 下次：依修正後的需求確認教材覆蓋與練習深度，再實作整合課程與版面；Preview First，既有學生進度與白紙債不變。

### 2026-08-30 — 編輯器旁的 AI 家教與上下文管理
- 今天做了：四個網頁編輯器加入共用 Chat、提示／逐行解說／除錯／完整示範，實作帳號持久對話、近期訊息＋摘要、輸入預算、逾時、去重與提問上限；部署獨立 Preview。
- 商業情境：新人不會寫或遇到錯誤時，家教依當前任務、草稿、真實／教材來源與最後執行證據教下一小步，而不是只回報分數。
- 我現在會：本次只有產品驗收，不新增學生掌握；86 項測試、本機與 Preview 真實 AI、瀏覽器 KeyError→修正→4 列，以及跨頁追問記憶皆通過。
- 還不懂：AI 摘要與答案仍可能出錯，需要自己驗證；新對話不刪歷史，停止等待不保證停止遠端計費。成功用家教記引導，不扣 SQL 正確性分數；QA 帳號與紀錄已清除。
- 下次：本人登入最新 Preview，選工作任務包的動手做頁，從 SQL／pandas 旁家教開始問一個卡點；仍保留 Chapter 1 白紙債，不以產品測試抵扣學習。

### 2026-08-30 — SQL＋pandas 入職工作任務包
- 今天做了：依學生 Goal 要求實作 15 個工作情境、50h＋50h 路徑、20 份 SQL、45 本 Notebook、網頁 pandas、帳號紀錄與交付進度；只部署 Preview。
- 商業情境：第一天到獨立交付，每章涵蓋無任務主動探索、主管交辦與數字異常調查，交接資料地圖、清單、對帳、KPI、主管摘要與維護紀錄。
- 我現在會：本次是產品實作驗證，沒有新的學生掌握證據；72 項測試與真實資料／瀏覽器驗收只記作系統品質。
- 還不懂：學生仍需自己實作、解釋與獨立變形。錯誤提示是內建修正引導，不假裝新任務已接 AI；既有 Learn AI 不變。下載與交付不等於通關。
- 下次：登入最新版 Preview 從第一天資料地圖開始；保留原有 Unit 1 白紙債，依真實作答更新能力，而非按閱讀時數升級。

每次上課結束，由家教在本節最上方新增一筆（模板如下）：

```text
### 日期：YYYY-MM-DD

今天做了：

商業情境：

我現在會：

還不懂：

下次：
```

（新條目請貼在這一行下方、歷史區塊上方。）

### 2026-08-30 — 修正 Preview 登入設定

- 今天做了：重現 Invalid API key，確認舊 Preview 的 public key 是遮蔽值；從已授權本機設定僅修正 deploy-preview 的 Supabase／家教代理憑證，發布新版 Preview；加入阻擋遮蔽與私密 key、真實 Auth readiness、部署後只讀檢查與 AGENTS.md 防重犯規則。
- 商業情境：Preview 驗收不能只看到環境變數存在就視為登入可用；必須以實際 runtime public key 向 Supabase Auth 驗證。
- 我現在會：本次是家教修復部署設定，不是學生錯誤或 SQL 作答；66 個自動測試、建置與新版 Preview 的真實 Auth 檢查通過，概念等級和課程進度不變。
- 還不懂：本人成功登入與 Playground／Log 的真實帳號端到端驗收尚未完成；瀏覽器只用不存在的測試帳號確認預期拒絕，不建立帳號、不讀取密碼、不寫入學習紀錄。家教代理只檢查驗證關卡，不產生付費 AI 回覆。
- 下次：使用原帳號登入 https://6a94cdeaab35992837bb669d--supply-sql-lab-a8594755.netlify.app/；舊 6a948b709a9104c4dbc3845e 預覽仍有錯誤，不再使用；正式站保持原版本。

### 2026-08-30 — Playground 與新人專案 Preview

- 今天做了：加入獨立的唯讀 Playground、不計分的帳號執行紀錄與筆記、結果 CSV、12 步 Olist 配送分析 Demo、SQL／用途標籤搜尋及含實際執行證據的專案下載；補齊同站 deploy-preview 必要環境設定，正式環境值保持不變。
- 商業情境：新人接到陌生資料，先盤點、抽樣與檢查 grain／缺值，再安全串接、定義配送 KPI、對帳並說明交付工具與分析限制。
- 我現在會：本次是家教建置與系統 QA，不是學生的 SQL 作答；概念等級、白紙債與課程進度不變。
- 還不懂：60 個測試與隔離 UI 操作已通過；管理用 service_role 無 olist 讀取權限，未修改權限；真實登入帳號的新功能端到端驗收仍未完成。
- 下次：登入 Preview https://6a948b709a9104c4dbc3845e--supply-sql-lab-a8594755.netlify.app/，使用 Playground 或按 Demo 步驟執行並確認 Query Log／筆記；驗收完成且本人明確授權後才正式發布。

### 2026-08-30

- 今天做了：修正完整答案的單行顯示；新增錯誤 Run 的固定診斷、AI 原因解釋、完整多行修正版、帶入編輯器與錯誤情境追問；將有效 OpenAI Key 保留在 Supabase Secrets，透過受保護 Edge Function 供 Netlify 與本機後端使用；修正模型逾時、fallback 與通過後重跑錯誤不應降級的進度邏輯。
- 商業情境：讓初學者的錯誤嘗試成為可修正的學習證據，而不是只看到 0 分；同時確保 AI 金鑰不進入瀏覽器，歷史最佳成果不被後續練習抹掉。
- 我現在會：本次由系統 QA 在正式帳號執行故意錯誤的 SQL、驗證 AI 說明與兩種追問並把修正版留在編輯器；不視為學生本人已掌握 SQL。
- 還不懂：學生本人仍需逐行說明 `COUNT(*)`、`COUNT(DISTINCT order_id)` 與差額的用途，並親自重跑修正版。
- 下次：本人直接按 Run 執行已放入編輯器的修正版，觀察 0 → 100 的檢查差異，再用自己的話完成 Analyst Note。

### 2026-08-28

- 今天做了：研究官方 Data Analyst／Power BI 能力框架與 2026 初階、供應鏈職缺，將課程擴成精確 50 小時；重寫 1.2，加入七個跨工具里程碑、Dashboard 能力地圖、CSV 交接與可匯出的 Tool Lab 證據。
- 商業情境：讓課程不只練 SQL 語法，而是從陌生資料、QA、跨表資料集、KPI、Power BI／DAX、Pandas 驗證走到主管 Dashboard 與作品集交付。
- 我現在會：本次只有系統 QA 代跑新版 1.2 並取得 100 分；這不視為學生本人已掌握，SQL 概念表不升級。
- 還不懂：學生仍要自己解釋 99,224 筆評論列、98,673 個不同訂單與 551 差額代表的粒度含義，並說明為何不能直接宣稱全是髒資料。
- 下次：從已通過的 1.2 結果開始口頭解釋、追問 AI、完成分析師說明，再進入 1.3。

### 2026-08-28

- 今天做了：依學生實際截圖重新檢查 SQL 編輯器，移除會混入 Query 的兩行預設註解，並重做焦點列、游標、選取色與執行按鈕的配色。
- 商業情境：降低初學者看到空白編輯器時的疑惑，讓畫面只保留「在哪裡輸入」與「如何執行」兩個必要訊號。
- 我現在會：這次是產品介面改善，沒有新增或假設任何個人 SQL 能力證據。
- 還不懂：仍需由學生本人開始輸入第一段 SQL，確認新的空白起點是否比較自然。
- 下次：直接在空白編輯器輸入 Chapter 1 第 1 題 SQL；placeholder 會在開始輸入後自動消失。

### 2026-08-27

- 今天做了：把 Supply SQL Lab 重構為 Olist 初級分析師入職模擬，定義五章公司工作旅程，並完整補上 Chapter 1 第一週六個任務的商業目的、SQL 選擇、驗證、交付與 SQL／Pandas／Power BI／Database View 分工。
- 商業情境：不再把 SQL 當孤立語法題，而是模擬分析師接手陌生資料庫、回覆跨部門需求、建立 KPI、調查問題到獨立交付 Dashboard 的真實路徑。
- 我現在會：這次是產品課程與部署改善，沒有新增或假設任何個人 SQL 能力證據。
- 還不懂：新流程已通過 31 項測試、正式建置與瀏覽器驗證，但仍需由學生本人做題，確認工作節奏與工具說明是否真正好懂。
- 下次：從 Chapter 1 Day 1 上午開始，先完成賣家資料量 Query，再用畫面上的三個檢查驗證結果並閱讀 AI 的分析師說明。

### 2026-08-27

- 今天做了：重新設計 Supply SQL Lab Learn 頁，將課程內容改成單一路徑、漸進展開與大字版排版，並加入 320px → 72px 的可收合課程側欄。
- 商業情境：降低初學者同時處理過多資訊的負擔，讓每個畫面先回答「現在要做什麼、為什麼、完成標準是什麼」。
- 我現在會：這次是產品介面改善，尚未新增或假設任何個人 SQL 能力證據。
- 還不懂：新版已通過系統與瀏覽器檢查，但仍需由學生本人實際做完一題，確認內容節奏與提示位置是否符合真實學習感受。
- 下次：使用新版介面完成 Chapter 1 第 1 題；只記錄本人真正執行、修正與說明的證據。

### 2026-08-27

- 今天做了：為 Supply SQL Lab 加入 AI Analyst Coach；驗證 OpenAI Key、同步 Supabase／Netlify Secret、建立帳號綁定的 AI 對話表、匯出紀錄並部署正式站。
- 商業情境：讓學習者在 SQL 驗證通過後，能立刻理解結果回答的商業問題、公司可採取的動作、必要驗證與分析限制，並針對不懂之處追問。
- 我現在會：這次是產品功能與部署驗證，沒有新增或假設任何個人 SQL 能力證據。
- 還不懂：尚未由學生本人使用真實帳號完成 Chapter 1 第 1 題，因此還不能判定 AI 講解的難度與節奏是否最適合本人。
- 下次：學生登入正式站，自行執行 Chapter 1 第 1 題；SQL 通過後測試 AI 草稿、追問與儲存，再依實際感受調整教學。

### 2026-08-27

- 今天做了：補強 Supply SQL Lab 的 Chapter 1 教學流程，加入白話觀念、供應鏈／Excel 類比、逐行範例、四階提示、完整解答與精熟狀態。
- 商業情境：讓零基礎學習者遇到不會的題目時，可以先理解、再嘗試、逐步求助，而不是只能猜答案。
- 我現在會：這次是產品功能補強，尚未新增或假設任何個人 SQL 能力證據。
- 還不懂：尚未由學生本人走過 Chapter 1 第 1 題，無法確認教學文字、提示節奏與操作是否真的好懂。
- 下次：學生在正式站實測 Chapter 1 第 1 題；家教只 review 這一題的 SQL、結果與卡住位置，再決定是否調整。

### 2026-08-25

- 今天做了：把 SQL 主線重整為五個求職導向 Chapter，設定 Windows VS Code、PostgreSQL 擴充與逐題教學規則。
- 商業情境：建立從陌生資料庫、SQL 分析、商業解讀到 Entry-Level 面試與作品集的單一路徑。
- 我現在會：本次是課程系統設定，沒有新增或假設任何 SQL 能力證據。
- 還不懂：尚未在新環境確認 Supabase 連線，也尚未完成 Unit 1 的第一題暖身。
- 下次：先跑 connection check，再由家教一次只出一題，從 Unit 1 暖身第 1 題開始。

### ⬇ 歷史區塊：2026-05~07 英文原始紀錄（大整理 2026-07-07 前），唯讀原文保存 — 請勿修改

＞ 以下第一筆（2026-05-13）為空白範本殘留，原樣保存。

### Date: 2026-05-13

Today I learned:

Business use case:

One thing I can do now:

One thing I still don't understand:

Next practice:

### Date: 2026-05-21

Today I learned: Reviewed Day 1 Inventory Cost Calculator. Rebuilt it from a blank
template (day1_inventory_cost/2_practice.py) for a new product (Mouse).

Business use case: Calculate the total inventory value of one product
(unit_cost * inventory_quantity) for stock-taking and procurement.

One thing I can do now: Create variables, multiply with *, and print labelled
results from a near-blank file without copying the original.

One thing I still don't understand: (to fill in)

Next practice: Day 2 Sales Revenue Calculator variation, then Day 3 Profit Calculator.

### Date: 2026-06-05

Today I learned: Started the pandas / Jupyter Notebook workflow for data analysis.
Learned that pandas handles table-like data, a notebook runs code cell by cell,
and a kernel is the Python environment used by the notebook.

Business use case: Read a real CSV dataset (`superstore.csv`) so it can be
explored like a business analyst would explore sales, profit, region, category,
and discount data.

One thing I can do now: Open a notebook, select a Python kernel, run a code cell
with `Shift + Enter`, check whether a CSV file path exists with
`data_file.exists()`, read a CSV with `pd.read_csv(data_file)`, and inspect the
data with `df.head()`, `df.shape`, and `df.columns.tolist()`.

One thing I still don't understand: How to comfortably create a valid blank
notebook from scratch in VS Code without depending on a prebuilt example.

Next practice: Create a fresh notebook manually, run `import pandas as pd`, read
`superstore.csv`, inspect the first rows, then write the first simple analysis:
group by `Category` and sum `Sales` and `Profit`.

Learning direction update: The learning method should now prioritize a real
analyst workflow in VS Code Notebook. The learner wants to create and operate
notebooks manually, with guidance on what to click/type and why. Reference files
can exist, but practice notebooks should not be auto-filled unless the learner
explicitly asks.

### Date: 2026-06-06

Today I learned: Checked the learning log dates and clarified that the
`2026-06-05` entry records the previous pandas / notebook setup session.

Business use case: Keep the learning tracker accurate so future practice starts
from the right place without mixing up dates or lesson state.

One thing I can do now: Identify that the current pandas learning track is in
`week_05_pandas/practice/`, while worked examples are in
`week_05_pandas/reference/`.

One thing I still don't understand: How to create a valid blank Jupyter Notebook
comfortably in VS Code without relying on a prebuilt file.

Next practice: Continue from the current analyst workflow: create/open the
practice notebook, select a kernel, import pandas, read `superstore.csv`, inspect
the data, then group by `Category` to sum `Sales` and `Profit`.

### Date: 2026-06-13

Today I learned: Set up an Olist PostgreSQL SQL practice workspace for VS Code.
The workspace now has raw table creation SQL, import validation SQL, first
SELECT practice, data quality checks, and starter business analysis queries.

Business use case: Practice ecommerce analyst SQL on orders, customers,
products, sellers, payments, reviews, and delivery performance.

One thing I can do now: Open saved `.sql` files in VS Code and use them as a
repeatable analyst workflow after connecting to the `olist_practice` database.

One thing I still don't understand: How to complete the full PostgreSQL
connection and CSV import workflow independently.

Next practice: Put the Olist CSV files in `03_data/raw/olist/`, import each CSV
into the matching `olist.*_raw` table with SQL CLI, then run
`02_after_import_validation.sql`.

### Date: 2026-06-13

Today I learned: Connected the local SQL CLI to the Supabase `Code practice`
project using the Supabase session pooler and SSL. Created the `olist` schema
and 9 raw Olist tables in Supabase.

Business use case: Use Supabase as the cloud PostgreSQL database for Olist
analyst SQL practice, while keeping query files saved in VS Code.

One thing I can do now: Connect to Supabase PostgreSQL with `psql`, run saved
SQL files with `\i`, and verify that cloud tables exist.

One thing I still don't understand: How to write the first analysis query
independently without copying the example.

Next practice: Run `03_first_select_practice.sql`, read the output, then write
one query that shows 20 canceled orders, newest first.

### Date: 2026-06-21

Today I learned: Updated the first Olist SQL practice so it explains the
analyst workflow behind each query: preview rows, identify useful columns,
filter by business status, sort by time, and then write one small query.

Business use case: Before answering business questions, an analyst first checks
what one row means, which columns matter, and whether status/date values look
usable.

One thing I can do now: Understand why the first SQL queries use `SELECT`,
`FROM`, `LIMIT`, `WHERE`, and `ORDER BY` instead of jumping directly into a
large analysis.

One thing I still don't understand: How to write the canceled-orders query
independently without copying the example.

Next practice: Run the four example queries in
`03_first_select_practice.sql`, then write the final practice query for 20
canceled orders, newest first.

### Date: 2026-06-21

Today I learned: Improved the first Olist SQL practice with a Step 0 data
inventory workflow. The lesson now explains how analysts discover schemas,
tables, row counts, and columns before choosing a starting table.

Business use case: When an analyst receives a new database, they first inspect
what data exists instead of guessing table names or jumping directly into
analysis.

One thing I can do now: Understand why the first table is `olist.orders_raw`:
it is the central order table and can connect to customers, order items,
payments, reviews, products, and sellers.

One thing I still don't understand: How to decide the starting table for a more
complex business question.

Next practice: Run Step 0A through Step 0D, then explain what `olist.orders_raw`
represents before running the later SELECT examples.

### Date: 2026-06-22

Today I learned: Expanded the first Olist SQL practice into a detailed analyst
workflow. Each step now explains the analyst question, why the step matters, the
SQL code to run, what to look for in the result, and what to write down.

Business use case: A new analyst should inventory the database before analysis:
confirm the connection, find schemas, list tables, count rows, inspect columns,
choose the starting table, preview rows, check statuses, filter records, and
sort by time.

One thing I can do now: Follow a structured first-look workflow instead of
guessing table names or running isolated SQL snippets.

One thing I still don't understand: How to connect this first-look process to a
full business analysis question.

Next practice: Run `03_first_select_practice.sql` one step at a time and fill in
the "Write down" prompts in personal notes before writing the final canceled
orders query.

### Date: 2026-07-01

Today I learned: The Olist setup SQL should not only create tables; it should
also explain what each setup step means. The setup file was updated with
beginner-friendly explanations and a SELECT-only practice area.

Business use case: Before analysts query business results, they need to
understand the database structure: schema, raw tables, important ID columns,
data types, and indexes.

One thing I can do now: Use the setup file as a readable map of what each Olist
table represents instead of treating it as a black-box script.

One thing I still don't understand: How to write the practice checks in the
Student Practice Area independently.

Next practice: In `01_create_schema_and_raw_tables.sql`, run the after-run
checks one at a time, then write the practice queries for `customers_raw`,
`order_items_raw`, `orders_raw`, and `order_items_raw` row counts.

## 錯誤日誌（append-only，繁中模板；錯誤訊息保留英文原文）

有真實錯誤才寫。每筆由家教在本節最上方新增（模板如下）：

```text
### 日期：YYYY-MM-DD

課程：

錯誤訊息（英文原文）：

我想做什麼：

為什麼發生：

怎麼修好：

學到的規則（一條中文規則，會進暖身題庫）：
```

（新條目請貼在這一行下方、歷史區塊上方。）

### 2026-09-02 — 未使用完整表名

- 課程：Supply SQL Lab SQL 探索。
- 錯誤訊息（英文原文）：`READ_ONLY_POLICY`。
- 我想做什麼：先查看 `customers_raw` 的前 50 筆資料與欄位。
- 為什麼發生：草稿仍寫 `FROM customers_raw`；本網站的唯讀政策要求明確指定允許的 schema，所以不接受未限定來源的表名。
- 怎麼修好：把來源改為 `FROM olist.customers_raw` 後重新執行。家教程式區的「已複製」只表示複製到剪貼簿，仍須本人貼入或手動修改編輯器。
- 學到的規則：在這個練習環境查 Olist 表時，一律使用 `olist.表名`；家教建議不等於編輯器已修改或修正版已執行。

### 2026-08-30 — 系統部署錯誤（不是學生 SQL 錯誤）

- 課程：Supply SQL Lab Preview 登入。
- 錯誤訊息（英文原文）：`Invalid API key`。
- 我想做什麼：本人要登入新 Playground／Project Demo 預覽。
- 為什麼發生：家教將 Netlify 非 dev context 的 secret 遮蔽回傳值誤存為 Preview 設定；舊 health 只查有沒有變數，未驗證 Supabase 是否接受。
- 怎麼修好：使用可信本機有效值，僅修正 Preview 並重新部署；實測 Auth settings 成功，登入表單用不存在的測試帳號回覆預期的 `Invalid login credentials`；正式站與本人密碼未變。
- 學到的規則：遮蔽值不是金鑰；設定存在不等於服務可用，部署後必須驗證實際執行環境。本條是部署規則，不列入學生 SQL 暖身題或能力評量。

### ⬇ 歷史區塊：4 筆英文原始紀錄（大整理 2026-07-07 前），唯讀原文保存 — 請勿修改

### Date: 2026-05-13

Lesson: Sales Revenue Calculator

Error Message: NameError: name 'units_price' is not defined. Did you mean: 'unit_price'?

What I was trying to do: print the unit price in the sales revenue calculator.

Why it happened: The variable was created as `unit_price`, but later typed as `units_price`.

How I fixed it: Change `units_price` to `unit_price`.

Rule I learned: variable names must be exactly the same every time.

### Date: 2026-06-05

Lesson: Pandas Notebook Setup + Read CSV

Error Message: FileNotFoundError: No such file or directory:
`python_supply_chain_learning/03_data/superstore.csv`

What I was trying to do: Read `superstore.csv` from a VS Code notebook using
`pd.read_csv()`.

Why it happened: The notebook was running from a different working directory
than expected, so the relative path did not point to the CSV file.

How I fixed it: Used `Path` with the full CSV location first, then checked the
file with `data_file.exists()` before reading it.

Rule I learned: Before reading a CSV, confirm the file path. If
`data_file.exists()` returns `False`, pandas will not be able to read it.

### Date: 2026-06-20

Lesson: Supabase Olist PostgreSQL Connection

Error Message: Connection error: connection failed: connection to server at
`44.252.246.120`, port `5432` failed: FATAL: `(ENOTFOUND) tenant/user
postgres.ylmuvsdegmpoiygbtipi not found`

What I was trying to do: Connect VS Code PostgreSQL extension to the Supabase
Olist practice database.

Why it happened: The Supabase pooler did not accept the connection profile as
entered manually in the VS Code connection form. The connection requires the
exact session pooler host, project-scoped username, database name, and SSL mode.

How I fixed it: Added a VS Code `pgsql.connections` profile named
`Supabase Olist Practice` with the correct host, port, database, username, and
SSL mode. The password was not saved in project files or VS Code settings.

Rule I learned: For Supabase session pooler connections, use the exact pooler
URL values and keep the database password out of saved files.

### Date: 2026-06-28

Lesson: Supabase Olist PostgreSQL Connection

Error Message: `pgsql: Failed to connect: Connection error: connection failed:
connection to server at "44.225.139.66", port 5432 failed: fe_sendauth: no
password supplied`

What I was trying to do: Run the first SQL query from VS Code using the
Microsoft PostgreSQL extension.

Why it happened: The Supabase database requires a password, but the VS Code
connection attempt did not send one. The same Supabase connection works from
`psql` when a password is entered at the prompt.

How I fixed it: Verified with `psql` that the Supabase pooler connection works
and that the selected query returns `database_name = postgres`. The VS Code
connection profile still needs the password entered through the extension UI.

Rule I learned: If PostgreSQL says `no password supplied`, the server was
reachable, but the client did not send a password.

## 歷史附錄：原 progress_tracker.csv（2026-05-13～06-13），唯讀

原 CSV（表頭＋6 列資料）轉為 markdown 表格保存，內容一字未改；原檔在 `90_archive/trackers/progress_tracker.csv`。

| Date | Lesson | Business Problem | Python Concept | Practice Done? | Quiz Score | Confidence | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2026-05-13 | Inventory Cost Calculator | Calculate total inventory value | variable, math, print | No | | | |
| 2026-05-13 | Sales Revenue Calculator | Calculate total sales revenue | variable, multiplication, print | In Progress | | | Hit NameError from typing units_price instead of unit_price |
| 2026-05-21 | Inventory Cost Calculator (Review + Re-practice) | Calculate total inventory value for Mouse | variable, string, integer, multiplication, print | Yes | | Medium | Re-built from blank template (day1_inventory_cost/2_practice.py), got 720 correct. Minor spacing style note only. |
| 2026-06-05 | Pandas Notebook Setup + Read CSV | Load and inspect Superstore sales data | VS Code Notebook, kernel, pandas, Path, read_csv, DataFrame, head, shape, columns | In Progress | | Medium | Completed guided read-CSV workflow cells 1-6. Next: create a fresh notebook manually and run first Category groupby analysis. |
| 2026-06-13 | Olist PostgreSQL Practice Setup | Set up VS Code SQL practice files for Olist PostgreSQL | PostgreSQL connection, schema, raw tables, SELECT, validation queries | Setup Done | | Medium | Created olist_postgresql SQL folder, installed Microsoft PostgreSQL VS Code extension, connected to local olist_practice, and created 9 local olist raw tables. |
| 2026-06-13 | Supabase SQL CLI Setup | Connect SQL CLI to Supabase Code practice project | Supabase CLI, psql, SSL, session pooler, schema, raw tables, CSV import | Setup Done | | Medium | Linked Supabase project ylmuvsdegmpoiygbtipi, connected with psql through session pooler, created 9 olist raw tables in Supabase, imported all Olist CSV files, and validated row counts. Next: run 03_first_select_practice.sql. |
