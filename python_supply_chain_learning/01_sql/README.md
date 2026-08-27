# 01_sql — 五章 Entry-Level SQL Analyst 實戰課

這是 SQL 主線的**唯一詳細課程計畫**。學習狀態只記在 [PROGRESS.md](../PROGRESS.md)，家教規則只記在 [AGENTS.md](../AGENTS.md)。

這五章的目標不是「看完 SQL 語法」，而是建立一條可以提出求職證據的工作流：拿到陌生 database（資料庫）→ 看懂 schema（資料表分組）→ 自己寫 SQL → 驗證結果 → 找出 business insight（商業洞察）→ 向主管解釋。

完成五章後，目標是具備申請 Entry-Level Data Analyst、Business Analyst、Supply Chain Analyst 等 SQL 職缺的基礎。課程不能保證錄取；真正的完成證據是你能獨立寫、執行、debug（除錯）並解釋自己的查詢。

---

## ① 現在從哪裡開始

目前只開放 Chapter 1 的 Unit 1，這是刻意的：**目前 Unit 過關後，才建立下一個 Unit；Chapter 1 過關後，才建立 Chapter 2。**

1. 先讀 [PROGRESS.md](../PROGRESS.md) 的「現在位置」。
2. 在 VS Code 執行 [connection_check.sql](reference/connection_check.sql)。
3. 目前教材依序是：
   - [unit01_0_first_session_zh.sql](ch01_fundamentals/unit01_0_first_session_zh.sql)：第一次課程的歷史保存。
   - [unit01_1_lesson.sql](ch01_fundamentals/unit01_1_lesson.sql)：家教示範。
   - [unit01_2_practice.sql](ch01_fundamentals/unit01_2_practice.sql)：你的逐題練習區，家教永不代填。
   - [unit01_3_challenge.sql](ch01_fundamentals/unit01_3_challenge.sql)：白紙挑戰，過關才開 Unit 2。

---

## ② VS Code 固定操作方式

主要工具是 VS Code 的 **PostgreSQL by Microsoft** extension（擴充套件），ID 為 `ms-ossdata.vscode-pgsql`。

連線設定：

```text
Host / Server: aws-1-us-west-2.pooler.supabase.com
Port:          5432
Database:      postgres
Username:      postgres.ylmuvsdegmpoiygbtipi
SSL mode:      require
Connection name: Supabase Olist Practice
```

密碼只在 VS Code 的連線提示內輸入，永不寫入 repo、設定檔、SQL、聊天或截圖。

每一題都使用同一個操作循環：

1. 家教只給目前這 1 題的商業情境與任務。
2. 你在 `unitNN_2_practice.sql` 或 `unitNN_3_challenge.sql` 的對應作答區自己寫 SQL。
3. 用滑鼠從查詢開頭選取到分號 `;`。
4. Windows 按 `Ctrl+Shift+E`；macOS 按 `Cmd+Shift+E`。
5. 先看 Results（結果）或原始英文錯誤訊息。
6. 把 SQL 與結果／錯誤貼給家教。
7. 家教 review（檢查）完這題，確認你理解後，才出下一題。

如果快捷鍵沒有反應，可開啟 Command Palette（命令選單），搜尋 PostgreSQL 的 execute query（執行查詢）命令。不要一次執行整份練習檔。

備用方法是 `psql`。只有電腦已安裝 PostgreSQL client（客戶端）時才使用：

```powershell
psql "postgresql://postgres.ylmuvsdegmpoiygbtipi@aws-1-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require"
```

出現提示時才輸入密碼。

---

## ③ 一題一題怎麼學

每個小概念預設 3 題，必要時增加到 5 題，而且永遠一次只出一題：

| 題次 | 用途 | 家教會提供什麼 |
|---|---|---|
| 第 1 題 | 模仿並建立基本格式 | 人的思考方式＋一個已講過的相近例子 |
| 第 2 題 | 換欄位、資料表或條件 | 商業需求＋少量提示 |
| 第 3 題 | 確認能否獨立 | 只給商業需求，不給語法骨架 |
| 第 4–5 題 | 只在需要時針對補強 | 針對重複發生的真錯誤換參數再練 |

每題的回饋順序固定：

1. 先指出你做對的思考或習慣。
2. 分清楚「真錯誤」與「可選的風格建議」。
3. 真錯誤先用 hint ladder（提示階梯）處理，不直接貼完整答案。
4. 你自己修正、重新執行並解釋結果。
5. 這題穩定後才進下一題。

「看過三題」不算會；第三題在白紙狀態完成、結果正確，而且能逐行說明，才是有效證據。

---

## ④ 五章能力地圖

| Chapter | 主旨 | 完成後應有的能力 |
|---|---|---|
| **1 — SQL Fundamentals for Analysts** | 拿到正確資料 | 看懂資料庫結構；獨立使用 SELECT、WHERE、CASE、常用 function（函數）；能排除基礎錯誤 |
| **2 — JOIN & Relational Database** | 正確連接公司資料 | 看懂 ERD（資料關係圖）、key（串接鍵）與資料粒度；完成多表 JOIN 並診斷重複或漏資料 |
| **3 — Advanced Analytical SQL** | 寫分析師等級查詢 | 使用 aggregation（彙總）、Subquery、CTE、Window Functions 完成排名、趨勢與成長分析 |
| **4 — SQL Business Analysis** | 解決商業問題 | 自己選表、定義 KPI、拆解問題、驗證結果，提出可向主管說明的 insight |
| **5 — Entry-Level SQL Analyst Simulation** | 產出求職證據 | 完成作品集、工作模擬與 SQL 面試；逐行解釋自己的所有查詢 |

能力成長順序：

```text
Chapter 1 拿資料
    ↓
Chapter 2 連資料
    ↓
Chapter 3 分析資料
    ↓
Chapter 4 解決 Business Problem
    ↓
Chapter 5 像 Entry-Level Analyst 一樣工作
```

---

## ⑤ Chapter 1 — SQL Fundamentals for Analysts

### 章節主旨

從「照著範例打語法」變成「主管給一個單表需求時，能自己拆條件並抓出正確資料」。本章使用 Supabase PostgreSQL 上的 Olist 真實電商資料。

### Unit 順序

| Unit | 核心內容 | 實戰問題 | Unit 關卡 |
|---|---|---|---|
| **1. Database first look**（目前開放） | database、schema、table（資料表）、row（資料列）、column（欄位）、information_schema、SELECT、FROM、COUNT、LIMIT、基本 ORDER BY | 新到職第一天：有哪些表？每張表多大？一筆訂單代表什麼？ | 白紙列出 Olist 表並安全預覽一張；用 Excel 類比解釋結構 |
| **2. SELECT accurately** | 指定欄位、alias（別名）、精確欄名、semicolon（分號）、基礎資料型別 | 主管指定欄位時，正確產出清單，不因拼字、空格或引號出錯 | 三次變形都能從白紙寫出 SELECT + FROM |
| **3. Filter rows** | WHERE、`=`、`<>`、AND、OR、NOT、IN、BETWEEN、LIKE | 找出指定狀態、日期、州別、金額範圍的訂單 | 把一句英文需求拆成多個條件並解釋 AND／OR |
| **4. NULL, DISTINCT, sort** | NULL、IS NULL、DISTINCT、ORDER BY 多欄、ASC／DESC、LIMIT | 找缺漏資料、唯一值、最新或最高的紀錄 | 正確處理 NULL；換兩次條件仍能排序與限制列數 |
| **5. CASE and functions** | CASE WHEN；date、string、numeric functions；型別與格式 | 把訂單分級、整理日期與文字、計算可用欄位 | 說明 CASE WHEN 與 Excel IF 的關係，並完成一個分類查詢 |
| **6. Query logic and debugging** | Primary Key（主鍵）、Foreign Key（外鍵）、SQL logical order（邏輯執行順序）、讀錯誤訊息、逐段驗證 | 面對陌生單表要求，自己找欄、寫查詢、修錯並驗證 | Chapter 1 綜合需求白紙完成，且能逐行解釋 |

### Chapter 1 最終能力題型

主管說：「列出指定期間內、某個州、金額高於門檻、排除特定狀態的訂單，依金額或日期排序。」你要能自己完成以下過程，而不是等家教提示關鍵字：

```text
找表與欄位 → 拆篩選條件 → 寫 SQL → 在 VS Code 執行 → 驗證 → 解釋
```

---

## ⑥ Chapter 2 — JOIN & Relational Database

### 章節主旨

學會公司真正的 relational database（關聯式資料庫）。資料分散在 `customers_raw`、`orders_raw`、`order_items_raw`、`products_raw`、`sellers_raw`、`order_payments_raw` 等表，必須先弄清楚一列代表什麼、用哪個 key 串接，才能相信結果。

### Unit 順序

| Unit | 核心內容 | Olist 實戰 |
|---|---|---|
| **1. Relationships and ERD** | Primary／Foreign Key、one-to-one、one-to-many、many-to-many、grain（資料粒度） | 畫出 orders → order_items → products → sellers |
| **2. INNER and LEFT JOIN** | INNER JOIN、LEFT JOIN、table alias（表別名）、ON | 訂單接客戶；訂單接付款；解釋 INNER 少了誰 |
| **3. Multiple joins** | 三至五表串接、選擇起始表 | 從客戶州別一路接到商品與賣家 |
| **4. JOIN variants** | RIGHT JOIN、FULL JOIN、Self Join 的使用情境與面試理解 | 用小型案例比較保留哪一邊；只有合適時才使用 |
| **5. JOIN debugging** | 重複列、missing records（漏接紀錄）、row count 前後對帳、anti-join | 找出 JOIN 後金額被放大的原因，確認孤兒紀錄 |
| **6. Chapter challenge** | 多表綜合分析 | 找出為特定地區客戶帶來最高營收的賣家／商品品類 |

### Chapter 2 過關證據

- 能口述 `orders_raw` ↔ `order_items_raw` ↔ `products_raw` ↔ `sellers_raw` 的 key。
- 能解釋為什麼一張訂單 JOIN 明細後會變成多列。
- 能先數 JOIN 前後列數，再判斷營收是否被重複計算。
- 能說明某題為何用 LEFT JOIN，不用 INNER JOIN。

---

## ⑦ Chapter 3 — Advanced Analytical SQL

### 章節主旨

從資料清單進入真正的分析師 SQL：彙總、分段組裝查詢、排名、時間比較與趨勢計算。

### Unit 順序

| Unit | 核心內容 | 分析題型 |
|---|---|---|
| **1. Aggregation** | COUNT、SUM、AVG、MIN、MAX、GROUP BY、HAVING | 各狀態訂單數、各付款方式金額、品類營收 |
| **2. Subquery** | scalar／table subquery、外層篩選 | 高於平均值的訂單或商品 |
| **3. CTE** | WITH、逐段命名、可讀性與驗證 | 先算月營收，再做下一步分析 |
| **4. Window ranking** | OVER、PARTITION BY、ROW_NUMBER、RANK、DENSE_RANK | 每個品類 Top 3 商品、客戶排名 |
| **5. Window comparison** | SUM OVER、AVG OVER、LAG、LEAD | running total（累計）、moving average（移動平均）、MoM growth（月增率） |
| **6. Chapter challenge** | 彙總＋CTE＋Window Functions 綜合 | 月營收、前期營收、成長率、類別內排名 |

### Chapter 3 過關證據

- 白紙寫出 GROUP BY 彙總並說明 WHERE 與 HAVING 的差別。
- 把複雜問題拆成可逐段執行的 CTE。
- 寫出每組 Top N，不把 GROUP BY 與 Window Function 混為一談。
- 能解釋 LAG 為什麼讓目前月份取得上個月份的值。

---

## ⑧ Chapter 4 — SQL Business Analysis

### 章節主旨

家教不再預告「今天要用 JOIN」；只提供 business problem（商業問題），由你決定表、key、metric（指標）與 SQL 結構。

固定分析流程：

```text
Business Question
    ↓
Understand Tables and Grain
    ↓
Define Metric and Assumptions
    ↓
Write SQL in Small Steps
    ↓
Validate and Reconcile
    ↓
Explain Insight and Limitation
```

### Case 順序

| Case | 分析領域 | 代表問題 |
|---|---|---|
| **1. Sales** | Revenue、growth、freight ratio、product performance；profit／margin 只在真的有成本資料時分析 | 營收變化由哪些品類或地區造成？Olist 沒有成本欄時，為何不能假裝算 profit？ |
| **2. Customer** | segmentation、repeat customer、average order value、retention | 哪些客群重複購買？客單價有何不同？ |
| **3. Supply chain** | lead time、late shipment、fulfillment、supplier／seller performance | Q2 遲交是否增加？問題集中在哪些州或賣家？ |
| **4. Data quality** | duplicates、missing values、incorrect dates、reconciliation（對帳） | 報表交付前，資料能不能信？ |
| **5. Executive explanation** | insight、assumption、limitation、recommendation | 用非技術主管聽得懂的語言說明發現與限制 |

### Chapter 4 過關證據

拿到「上季銷售下降」或「Q2 遲交增加」這類開放題時，你能自行提出澄清問題、定義 KPI、建立驗證查詢，最後給出有數字依據且不過度推論的結論。

---

## ⑨ Chapter 5 — Entry-Level SQL Analyst Simulation

### 章節主旨

不再學新 command（指令），而是模擬剛進公司的 Analyst 工作：接需求、讀 schema、寫查詢、驗證、說明、接受 review，再把成果整理成作品集與面試故事。

### 階段順序

| 階段 | 產出／證據 |
|---|---|
| **1. Requirement intake** | 把模糊需求改寫成分析問題、KPI、範圍與假設 |
| **2. Olist supply-chain project** | `project.sql`：3–5 個可重跑唯讀查詢，至少包含交期、營收與資料品質 |
| **3. Validation** | row count、NULL、重複、JOIN 前後對帳與已知限制 |
| **4. Portfolio write-up** | `PROJECT.md`：繁中主文＋英文摘要；圖表與結果放 `03_data/output/` |
| **5. Interview training** | `interview_qa.md`、live SQL、逐行解釋、LEFT vs INNER 等追問題 |
| **6. Job simulation** | 限時接一個新需求，從找表到主管摘要完整做一次 |

### 必練面試題型

- 每組 Top N。
- second highest（第二高）。
- duplicate transactions（重複交易）。
- consecutive months（連續月份購買）。
- month-over-month growth（月增率）。
- first／last order（首次／最後一次訂單）。
- 為何用 LEFT JOIN，不用 INNER JOIN。
- 查詢結果不合理時，如何逐步 debug。

### 五章完成定義

以下全部成立，才標記為 Job / Interview Ready（求職／面試準備完成）：

- Chapter 1–4 的章末 challenge 都在提示不超過第 ① 階時通過。
- 有一份可從頭重跑的 Chapter 5 專案，學生能逐行解釋。
- 專案含至少一段資料品質與限制說明。
- 完成至少兩次模擬面試，其中一次含 live SQL。
- 面對一個相近但沒看過的新題目，可以自己拆解並完成。

---

## ⑩ 教材檔案與開放規則

每個 Unit 固定使用三段鷹架：

| 檔案 | 用途 | 規則 |
|---|---|---|
| `unitNN_1_lesson.sql` | 家教示範 | 商業問題 → 人的思考 → SQL → 看什麼結果；一次只跑一句 |
| `unitNN_2_practice.sql` | 學生練習 | 每個概念 3 題起；由學生自己寫，家教永不代填 |
| `unitNN_3_challenge.sql` | 白紙挑戰 | 新參數、低提示、附口頭理解關卡；通過才開下一 Unit |

章末另使用最後一個 Unit 的 challenge 做綜合關卡，不為關卡另開 tracker（追蹤檔）。只有當前 Unit 真的過關，家教才建立下一個 Unit；只有本章真的過關，才建立下一章資料夾。

目前資料夾：

```text
01_sql/
└── ch01_fundamentals/
    ├── unit01_0_first_session_zh.sql
    ├── unit01_1_lesson.sql
    ├── unit01_2_practice.sql
    └── unit01_3_challenge.sql
```

看不到 Chapter 2–5 的資料夾是正常的；詳細計畫在本 README，空資料夾不代表進度。

---

## ⑪ SQL 安全與驗證

日常課程只允許唯讀查詢：

```sql
SELECT
WITH ... SELECT
SHOW
EXPLAIN
```

禁止 `INSERT`、`UPDATE`、`DELETE`、`DROP`、`TRUNCATE`、`ALTER`、`CREATE`、`GRANT`。唯一例外是 [setup_one_time](setup_one_time/README.md)，而且只有你明確要求重建資料庫、理解後果後才能使用。

探索 `geolocation_raw`（約 100 萬列）與 `order_items_raw`（約 11.2 萬列）必須加 LIMIT 或使用彙總。JOIN 或彙總後的結果至少用一種方法驗證：row count、抽樣、總額對帳、NULL 檢查或替代寫法交叉比對。

常見陷阱會主動反覆練：

- `'canceled'` 只有一個 `l`。
- `= NULL` 抓不到空值，要使用 `IS NULL`。
- 一次選取一條完整 SQL，必須包含分號。
- JOIN 前先確認兩邊的 grain 與 key。
- `\copy` 是 psql 指令，不能在 VS Code query editor 執行。

九張 Olist 表、欄位與 JOIN 路線請查 [data_dictionary.md](reference/data_dictionary.md)。

---

## ⑫ 節奏與進度原則

不再用過期日曆假裝進度。每次 30–60 分鐘，一次完成一個可驗證的小步；每週建議 3 次 SQL 主線，pandas 只作為同概念的副線鏡射。

每個 session（上課）固定：3 題逐題暖身 → 清白紙債 → 目前 Unit 的一題 → 執行與 review → 更新 PROGRESS.md → 由學生 commit（提交存檔點）。進度以關卡證據決定，不以坐了多久或看了幾頁決定。
