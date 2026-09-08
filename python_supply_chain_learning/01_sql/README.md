# 01_sql — 五章 Entry-Level SQL Analyst 實戰課

這是 SQL 主線的**唯一詳細課程計畫**。學習狀態只記在 [PROGRESS.md](../PROGRESS.md)，家教規則只記在 [AGENTS.md](../AGENTS.md)。

這五章的目標不是「看完 SQL 語法」，而是建立一條可以提出求職證據的工作流：拿到陌生 database（資料庫）→ 看懂 schema（資料表分組）→ 自己寫 SQL → 驗證結果 → 找出 business insight（商業洞察）→ 向主管解釋。

完成五章後，目標是具備申請 Entry-Level Data Analyst、Business Analyst、Supply Chain Analyst 等 SQL 職缺的基礎。課程不能保證錄取；真正的完成證據是你能獨立寫、執行、debug（除錯）並解釋自己的查詢。

---

## ① 現在從哪裡開始

### 2026-09-06 課程符合性重審

**結論：方向符合，但目前內容和能力驗收尚未達到「100 小時整合 SQL＋pandas＋Power BI、能獨立處理入門分析師工作」的要求。** 本輪先補第一單元教學、跨來源複習及帳號草稿，不冒稱補齊後續章節；上線狀態與學習能力分開。

| 要求 | 目前可核對的內容 | 缺口與接受標準 |
| --- | --- | --- |
| 零基礎從入職開始 | 第一單元九個主線活動有目的、骨架／需求契約、名稱來源、完整示範與下一步，接起目錄、欄位、樣本、計數與 pandas 交接 | 其餘五單元尚未全面達到同樣前置拆解；首次出現語法須先教，不能只靠家教臨場補完 |
| 足量練習而非時數標籤 | SQL 共 26 題：10 陪跑、5 修錯、11 獨立／複習；pandas 6 題、BI 3 段。第一單元新增三個跨來源複習題，依錯誤紀錄建議隔日再練 | 不代表每個概念都有完整梯度；pandas 仍缺完整修錯／無提示链。課程份量依實際試學調整，不以題數乘分鐘 |
| SQL 足以分析公司資料 | 單表 SELECT、條件、計數、缺值、分類與排序已有活動 | 新版 JOIN／鍵／粒度對帳、彙總／CTE／Window、KPI、異常調查與綜合交付未完成；原有範例只能補強，不能計為新版進度 |
| pandas 真正工作能力 | 小樣本大小、選欄／更名、篩選、缺值、分類、排序／Notebook 下載 | 缺讀寫與錯誤型態的實作梯度、merge(validate)、groupby、reshape、日期／文字清理與同口徑對帳。下載 Notebook 不是從乾淨環境重跑成功的證據 |
| Power BI 真實報表 | 同一賣家樣本的匯入／文字型態、COUNTROWS、切片器／長條圖、更新一列 | 缺模型／關聯方向、日期表、CALCULATE／比率、Power Query 整理、刷新失敗、發布與基本存取概念；需可用 Windows 環境、實際報表檔與操作審查，不能只看填入數字 |
| 完整分析師流程 | 入職探索／交辦／品質調查的情境與程式紀錄已有雛形 | 要能從模糊需求澄清口徑、決定工具、取數、驗證、解釋限制、交付摘要、更新重跑。需一個 Olist 主專案及一個真正陌生資料的遷移任務；在同套 Olist 換表不等於陌生資料驗收 |

審查依據是實際 `integrated-catalog.js`、`activity-teaching.js`、結果核對與外部提交流程；學習總覽以同一份活動目錄顯示「已具備／仍需補上」。官方範圍對照：[PostgreSQL 入門](https://www.postgresql.org/docs/current/tutorial.html)、[pandas 入門](https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html)、[Microsoft PL-300](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/pl-300)。這是範圍比較，不等於認證或就業保證；不把官方完整認證內容都塞進 100 小時。

補強次序：先讓 CH1 每個核心能力都可從零學、修錯並驗收；再以訂單／付款對帳串起 CH2–3 三工具；接著 CH4 的口徑異常與假設調查；最後 CH5 跨工具專案、陌生資料與口頭說明。工具依需求交錯，不規定先 50 小時 SQL，也不要求每個查詢都硬轉 pandas／Power BI。暫不增加機器學習、重型資料工程或進階 BI 平台管理。

UI 的新版主線固定：學習總覽找活動 → 分析師工作室學／做／問 → 自由查詢試自己的問題 → 學習紀錄回看／帶回／下載。總覽與工作室使用同一份帳號摘要；原有題庫放在明示的補強區，不混入主線完成量。

**2026-08-31：新版「分析師工作室」以約 100 小時的 SQL＋pandas＋Power BI 整合學習為目標。** 三種工具依工作需求交錯使用，不是先 50 小時 SQL、再 50 小時其他工具。目前完成 CH1 試學樣板，**不是已備妥全部 100 小時**。原有 30 題與 15 個工作情境保留為同能力地圖的補強／參考，不重複計完成量。

| 能力章節／工作情境 | SQL | pandas | Power BI／交付 | 新版狀態 |
| --- | --- | --- | --- | --- |
| CH1：第一天，認識公司資料 | 目錄、計數、選欄、條件、NULL、DISTINCT、CASE | DataFrame、型態、篩選、缺值與樣本對帳 | CSV 型態、Table／Card、篩選與更新 | 六單元可試學 |
| CH2：第一週，建立可信關聯 | JOIN、鍵、粒度、未匹配與放大 | merge(validate)、關聯前後對帳 | 事實表／維度表、關係方向 | 教材待擴充 |
| CH3：第一個月，建立 KPI 報表 | GROUP BY、CTE、Window、期間比較 | 日期／分組、交叉核對 | 日期表、DAX、篩選後比率與總計 | 教材待擴充 |
| CH4：接到異常與模糊需求 | 拆解假設、分群與品質查詢 | 分布、例外處理、基本統計判讀 | 互動分析、限制與非因果說明 | 教材待擴充 |
| CH5：獨立交付與更新 | Olist 主專案＋陌生資料取數 | 可重跑 Notebook、更新檢查 | 報表、主管摘要、口頭解釋與交接 | 教材待擴充 |

CH1 新版活動由 `tools/sql_playground/server/integrated-catalog.js` 維護；2026-09-06 共 **26 題 SQL、6 題 pandas、3 段 Power BI 外部實作**。第 1 單元為 9 個主線活動＋3 個複習變形；第 2、4、6 單元有 BI 實作。35 個活動不是 35 個概念都各有三題，也不是已提供 100 小時。第一單元之後的完整教學梯度仍需擴充。

零基礎預設先開「不知道表名，先查目錄」的本題講解。新人不是先背 `olist`，而是先向主管／IT 確認系統、唯讀權限、資料負責人及敏感資料規範（本站已配置連線），再按下面的結果推進：

| 小步驟 | 為什麼查／名稱從哪來 | 下一步的依據 |
| --- | --- | --- |
| 不知道表名，先查目錄 | 學 SELECT／FROM；PostgreSQL 官方目錄 `information_schema.tables` 提供 `table_schema`、`table_name` | 讀取實際可見分組與表名，不先硬寫 olist；可見不等於完整公司資料 |
| 從目錄選出一個分組 | 學 WHERE／文字引號；用剛找到並核對的分組值 | 先只篩 olist，不同公司要重新查名稱 |
| 整理資料表清單（原題） | 再學 AND／BASE TABLE／ORDER BY，區分一般表與檢視表 | 核對要探索的表存在，不猜表名 |
| 查出陌生表的欄位 | `information_schema.columns` 提供欄名、型態及順序 | 結果中的欄名才是業務查詢可選的欄位；不能由型態推定業務定義 |
| 先看五列 | 學 *／完整表名／LIMIT，觀察少量內容 | 記錄樣本範圍與待確認的粒度、品質問題，再學全表 COUNT |
| 全表計數示範 → 訂單修錯 → 商品變形 | COUNT(*)／AS、一列結果與格子內總數的差別；保留既有修錯與獨立題 ID | 能說明明細不是總數；COUNT 加 LIMIT 合法但不會把計數範圍縮小 |
| pandas 接到什麼 | 另行準備三欄、最多 20 列真實 SQL 快照，再用 len(df)／len(df.columns) 對帳 | 記錄來源與快照形狀；小樣本不能稱全公司，不為湊工具而轉 Power BI |
| 需要時再練 | 客戶欄位盤點／三列抽查／付款列數，換表而非重播答案 | 真實未成功紀錄才產生建議；後續變形符合才移出待練，不代表獨立認證 |

每步提供：人的目的 → 明示不能執行的通用骨架 → 固定語法／系統目錄名稱／情境值的出處 → 可展開的完整真實程式 → 預期輸出與記錄 → 下一小步。完整示範不用先答錯才可看；套用前保護現有草稿，執行仍由使用者操作。新活動使用獨立 ID，原有 `studio-u1-s1` 等題意、答案與紀錄不重寫。家教與畫面共用 `server/sql-onboarding.js` 及 `server/unit-one-upgrade.js`；不把教材上下文當學習者已掌握的證據。查完表名先查欄位／樣本，不立刻要求轉 pandas 或 Power BI。

| CH1 單元 | 主要任務與變形 | pandas 對帳 | BI 實作 |
| --- | --- | --- | --- |
| 1 先知道手上有什麼 | 從未知名稱查目錄、選分組、查欄位、看樣本，再做 COUNT／LIMIT 修錯與商品盤點 | 另取 20 列快照，檢查 row／column 數，不是匯入表名清單 | — |
| 2 交付同事能用的名單 | 賣家欄名、逗號／排序修錯、客戶名單 | 選欄與重新命名 | 真實 CSV → 文字型態 → Table／Card |
| 3 把一句需求拆成條件 | 州別清單、日期 AND 修錯、城市條件 | 同一範圍的 isin 與排序 | — |
| 4 缺值與重複 | 配送空值、評論粒度、不同州別 | isna 與缺值數 | 量值、切片器、長條圖與 SP 對帳 |
| 5 規則與分類 | 評論 CASE、未知分類修錯、金額門檻 | to_numeric、np.select | — |
| 6 白紙交付與更新 | 新條件商品、取消訂單、付款盤點 | 指定輸出欄位與重跑排序 | 新增明示虛構列，驗證 Refresh 前後數字 |

使用順序：分析師工作室 → 當前活動「本題講解」→「寫程式」→「執行結果」→ 必要時向旁邊家教追問。窄螢幕有「問家教」頁籤。教學包含用途、完整多行解法與解釋；看答案會記錄協助，不扣正確性。SQL 比對伺服器結果；pandas 在瀏覽器執行，再比對本題完整快照的回報結果，**不是伺服器執行證明**。真實快照與虛構教材分開，20 列樣本不可推論全公司。

Power BI 需實際 Windows Desktop 操作，網站提供 CSV、步驟、DAX 家教及對帳；Mac 環境尚未安排可稍後做。保存的是報表檔名、說明與數字，**沒有上傳或審查 pbix**，所以即使數字符合仍待外部審查。SQL／pandas 成功、錯誤、程式與來源、查看協助、BI 自報證據與 AI 對話都按帳號留存，可匯出。重新取數後舊結果不代表新來源。

100 小時是整體設計預算；先用 CH1 試學觀察閱讀、實作、修錯、無提示變形的負荷，再逐章增加教材，不能用數量乘上設定分鐘湊時數。最終需有 Olist 完整專案、陌生資料遷移、三工具對帳、更新重跑及自己的口頭解釋。暫不塞入機器學習、進階資料工程或高階 BI 管理。題目完成、能解釋、獨立掌握分開，沒有就業保證。

教材依據：[PostgreSQL Tutorial](https://www.postgresql.org/docs/current/tutorial.html)、[pandas 入門](https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html)、[Microsoft PL-300 能力範圍](https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/pl-300)、[Power BI Desktop 環境](https://learn.microsoft.com/en-us/power-bi/fundamentals/desktop-get-the-desktop)。這些是內容對照，不等於本課已涵蓋整份認證或保證 100 小時學會。

原有情境 ZIP 保留 15 份說明、20 份 SQL、45 本示範／練習 Notebook 等參考；檔案數不是獨立題數或學習時数。新版 pandas 可下載「目前資料＋我的程式」Notebook，不必交出資料庫密碼。

學生自己的聊天／VS Code 進度仍在 Chapter 1 Unit 1：**目前 Unit 過關後，才建立下一個學生練習 Unit；不因產品教材已備妥就把學生判定過關。**

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
3. 真錯誤可用 hint ladder（提示階梯）處理；首次教學、前置概念缺口或你要求答案時，直接提供完整多行示範，不必先失敗。
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
