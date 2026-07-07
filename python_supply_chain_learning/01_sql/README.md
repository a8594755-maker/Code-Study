# 01_sql — SQL 分析課（Olist × Supabase PostgreSQL）

這是 SQL 主線的**唯一課程計畫文件**。你的進度不記在這裡 — 進度只住在根目錄的 [PROGRESS.md](../PROGRESS.md)。這份文件回答三個問題：怎麼連線執行、課程長什麼樣、八週怎麼走。

**這門課教的不是背語法，而是分析師的工作流**：先有商業問題 → 找對表 → 小步查詢 → 讀懂結果 → 用商業語言講出來。你的供應鏈經驗（交期、對帳、KPI）就是這門課的主場優勢。

---

## ① 連線與執行方法

### 方法一：VS Code（日常主要用法）

使用 VS Code 擴充 **PostgreSQL by Microsoft**（擴充 ID：`ms-ossdata.vscode-pgsql`，本 repo 的 `.vscode/extensions.json` 已推薦安裝）。

連線設定值：

```text
Host / Server: aws-1-us-west-2.pooler.supabase.com
Port:          5432
Database:      postgres
Username:      postgres.ylmuvsdegmpoiygbtipi
SSL mode:      require
Connection name: Supabase Olist Practice
```

執行方式（**一次一句，是這門課的鐵律**）：

1. 打開 `.sql` 檔。
2. 用滑鼠**從查詢開頭選取到分號 `;` 為止** — 沒選到分號，執行的可能是半句。
3. 按 **Cmd+Shift+E**。
4. 結果出現在 Results 面板 — 每次執行後先讀結果，再往下一句。

### 方法二：psql（備用／跑整個檔案時）

從 repo 根目錄啟動 terminal（終端機），執行：

```bash
/Library/PostgreSQL/18/bin/psql "postgresql://postgres.ylmuvsdegmpoiygbtipi@aws-1-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require"
```

出現提示時才輸入密碼。**密碼只在提示時輸入 — 永不寫進任何檔案、設定或對話紀錄。**

連上後可以用 `\i` 執行整個 SQL 檔，例如：

```text
\i 01_sql/reference/connection_check.sql
```

隨時想確認連線是否正常，跑 [reference/connection_check.sql](reference/connection_check.sql) 即可（可重複執行，無副作用）。

### Read-only（唯讀）鐵則

課程與練習中，**只允許**這些讀取型指令：

```sql
SELECT
WITH ... SELECT
SHOW
EXPLAIN
-- 以及查 information_schema（資料庫的目錄表）
```

**禁止**執行任何會寫入或改動資料庫的指令：

```sql
INSERT
UPDATE
DELETE
DROP
TRUNCATE
ALTER
CREATE
GRANT
```

唯一例外是 `setup_one_time/` 裡的一次性腳本，而且只有在明確決定「重建資料庫」時才碰（見 [setup_one_time/README.md](setup_one_time/README.md)）。

另外兩條紀律：

- **LIMIT 紀律**：對大表（`geolocation_raw` 100 萬列、`order_items_raw` 11.2 萬列）做探索查詢時，必帶 `LIMIT`（限制列數）或改用彙總 — 就像你不會在 Excel 打開整份百萬列的檔案慢慢捲。
- 已知陷阱先講：`'canceled'` 只有一個 L；`= NULL` 抓不到空值（要用 `IS NULL`）。

---

## ② 8 章課綱

> **章節資料夾過關當天才建立 — 看不到 ch03 資料夾是正常的，計畫在這裡。**
> 目前磁碟上只有 `ch01_first_look/`。每過一章的理解關卡，家教當天才建立下一章的資料夾。空資料夾會說謊，文字計畫不會。

| 章 | SQL 概念 | 驅動的 Olist 商業問題 | 理解關卡（過關才建下一章） |
|---|---|---|---|
| **ch01 first_look** 初次看資料（已完成大半） | SELECT、FROM、LIMIT、COUNT(*)（只用來數整張表的筆數；分組彙總在 ch03）、information_schema、基本 ORDER BY；schema（資料庫資料夾）/table（表）/row（列）/column（欄） | 「你是剛到職的分析師，第一天拿到巴西電商資料庫。有幾張表？一筆訂單長什麼樣？為什麼先 LIMIT 不全撈？」 | 不看檔案列出 olist 的表並預覽其一；用 Excel 活頁簿類比口頭解釋 schema／table／row／column |
| **ch02 filter_sort** 篩選與排序 | WHERE（=、<>、IN、BETWEEN、LIKE、AND/OR、IS NULL）、ORDER BY 多欄、DISTINCT | 「營運經理要取消訂單清單：哪些被取消？最新的 20 筆排前面」（沿用既有 canceled 練習；明教 canceled 一個 L 的拼字陷阱與 `= NULL` 抓不到空值） | 換兩次條件都能現場寫出 WHERE + ORDER BY DESC + LIMIT；說明 AND/OR 差別 |
| **ch03 aggregate** 分組彙總 | COUNT、SUM、AVG、MIN/MAX、GROUP BY、HAVING、AS | 「每種訂單狀態各幾筆？各付款方式總金額？」— 明講：**GROUP BY（分組彙總）就是你天天用的樞紐分析表（pivot table）**（order_payments_raw 首度登場） | 解釋 WHERE vs HAVING（篩列 vs 篩組）；白紙寫出 count+group+排序 |
| **ch04 joins** 表格串接（全課最大觀念，排 2–3 個 session） | INNER JOIN、LEFT JOIN、join key（串接鍵）、表別名、anti-join 初步 | 「orders_raw 沒有金額！錢在 order_items_raw — 老闆要『已送達訂單的總營收』，兩張表怎麼接？」（SAP 類比：用單號把採購單抬頭和明細接起來；配 [data_dictionary](reference/data_dictionary.md) 的 join 地圖） | 畫出或口述 orders↔order_items↔products 的鍵關係；解釋 INNER 和 LEFT 少了誰；白紙寫雙表 join＋彙總 |
| **ch05 dates_delivery** 日期與交期 | ::date、DATE_TRUNC、EXTRACT、日期相減、CASE WHEN 初步 | 「出貨平均幾天？哪些訂單遲到？各州準時交貨率？」— **OTD（準時交貨率）是你履歷上的語言，SQL 只是新工具**（排在 ch06 之前：品質檢查的遲交項需要日期邏輯，且主場題放中段補血） | 用自己的話解釋 DATE_TRUNC('month',…)；算出一筆訂單 lead time（前置時間）並講解每一步；CASE WHEN 像 Excel 的 IF |
| **ch06 data_quality** 資料品質 | IS NULL 統計、重複偵測（GROUP BY+HAVING）、孤兒紀錄（LEFT JOIN…IS NULL）、遲交筆數 | 「報表給老闆前，先問：資料能信嗎？」= 供應鏈對帳（reconciliation）的資料庫版。**教材 = 逐句拆解 [showcase/data_quality_checks.sql](reference/showcase/data_quality_checks.sql) 的 6 個查詢**（全部概念此時已教過 — 便宜的一章） | 說出「拿到新資料先檢查哪三件事」；對任一張表獨立寫出一個 NULL 檢查＋一個重複檢查 |
| **ch07 business_analysis** 商業分析 | 多表 join＋彙總綜合、COALESCE、子查詢 → CTE（WITH，具名的中繼查詢） | 「月營收（GMV）趨勢？前 20 大品類（要接翻譯表）？各州物流表現？」**教材 = 逐句拆解 [showcase/business_analysis_showcase.sql](reference/showcase/business_analysis_showcase.sql) 的 3 條查詢**，每條拆成 3–4 個遞進步驟重建 | 拿其中一條查詢逐行講給「聽不懂 SQL 的主管」聽；解釋 COALESCE 救了什麼；把一段巢狀改寫成 CTE 並說明為何較好讀 |
| **ch08 mini_project** 作品集小專案（資料夾屆時才建） | 綜合前七章，無新語法；結果輸出到 `03_data/output/` | 「Olist 供應鏈交付績效報告」：自選 3–5 題（建議含 1 個 OTD/交期題發揮主場優勢＋1 條資料品質附註），產出 `project.sql` ＋雙語 `PROJECT.md` ＋ `interview_qa.md` 模擬問答 | 對家教做 10 分鐘專案簡報：中文完整講一次，關鍵句英文講一次；README 連到專案 |

九張表是誰、欄位是什麼意思、表和表怎麼接 — 隨時查 [reference/data_dictionary.md](reference/data_dictionary.md)。

---

## ③ 三檔模式（每章固定結構）

每個章節資料夾都是同樣三個檔，三段鷹架，順序固定：

| 檔案 | 角色 | 規則 |
|---|---|---|
| `1_lesson.sql` | 老師示範（讀＋跑） | 每步 = 分析師的問題（繁中）→ 為什麼（寫在程式碼之前）→ SQL → 執行後看什麼 → 寫下觀察。風格完全複製 `ch01_first_look/0_first_session_zh.sql`（全 repo 教學品質最高的檔案）。≤120 行。 |
| `2_practice.sql` | 學生寫作區 | 前 2–3 題附答案「憑記憶重打」，中段給查詢骨架挖空關鍵字，後段只給商業需求。數字/條件與 lesson 不同，無法照抄。家教**永不代填**。 |
| `3_challenge.sql` | 白紙挑戰 | 1–2 題全新商業問題＋全新參數，只有需求與空白；答案藏檔案最底標「做完前不要偷看」；檔尾附本章理解關卡問題。通過 = 該章概念升 Independent 的**唯一**證據。 |

理解關卡不另開檔案：關卡問題列在 `3_challenge.sql` 結尾，你用自己的話（中文即可）回答，家教記入 PROGRESS.md 概念表。

白紙挑戰不是「第一次寫」— 你在 lesson 看過一次、在 practice 寫過一次，challenge 是**第三次**寫同型查詢，只是換了數字。

---

## ④ 雙軌節奏（每週 3 次 SQL ＋ 1 次 pandas 鏡射）

pandas 那次刻意鏡射當週 SQL 概念 — 同一個心智模型換語法再提取一次。Python 基礎順路教（list 在選欄位時、dict 在 `agg({...})` 時），不再有獨立 Python 週。pandas 側在 [../02_pandas/](../02_pandas/) 的 my_work notebook 續寫，家教永不代填。

| SQL 當週 | pandas 鏡射 |
|---|---|
| ch02 WHERE | `df[df["Category"]==...]` 布林篩選＋sort_values |
| ch03 GROUP BY | `groupby().agg()` 第一次分組（對照 Excel 樞紐） |
| ch04 JOIN | `merge()` 概念對照（輕量） |
| ch05 dates | 日期欄轉換＋月趨勢 |
| ch06 quality | 缺值報告與清理（walkthrough 對應節） |
| ch07 CASE | `pd.cut` 折扣分級＋第一張圖 |

---

## ⑤ 行事曆（2026-07-07 → 2026-08-31；每週 3–5 次、每次 30–60 分）

| 週 | 日期 | SQL 主線 | pandas 副線 |
|---|---|---|---|
| W1 | 07/07–07/12 | 新家導覽（30 分：跑一條已會的查詢驗證一切正常）；ch01 2_practice 完成；3_challenge＋關卡 | 修 notebook 路徑（= 複習你 6/05 親手修過的錯）＋第一次 groupby |
| W2 | 07/13–07/19 | ch02 三檔＋關卡 | 布林篩選＋排序 |
| W3 | 07/20–07/26 | ch03 三檔＋關卡 | groupby 彙總 |
| W4 | 07/27–08/02 | ch04（3 個 SQL session）＋關卡。**★ 檢查點 A（08/02）** | merge() 輕量 |
| W5 | 08/03–08/09 | ch05 交期主場＋關卡；**模擬面試 #1**（15 分：現場寫 SELECT/WHERE/GROUP BY 三題） | 缺值報告 |
| W6 | 08/10–08/16 | ch06（拆解現成 showcase，便宜）＋ ch07 開始。**★ 檢查點 B（08/16）＝最低可面試關卡**：ch01–04 全 Independent＋能 live 寫三題 | 月趨勢＋日期處理 |
| W7 | 08/17–08/23 | ch07 完成＋關卡；ch08 開工（建資料夾、選題、前 1–2 條查詢） | 暫停或併入專案（一張圖） |
| W8 | 08/24–08/31 | ch08 完成：project.sql＋雙語 write-up＋**模擬面試 #2、#3**（含英文關鍵句）＋概念表總複習掃一輪（ch01–07 各抽一題白紙） | 併入專案 |

---

## ⑥ 削減規則（事先寫死，屆時不用掙扎）

- 檢查點 A（08/02）：落後一章 → 先砍當週 pandas 場次（永不砍 challenge/關卡）；落後兩章 → ch07 只拆解 1 條 showcase 查詢、CTE 降為選讀。
- 檢查點 B（08/16）：未達最低可面試關卡 → ch08 縮為 2 題＋write-up；ch07 剩餘部分改為「口頭拆解並解釋 showcase 查詢」。
- **底線（W6 就達得到）**：面試就緒的最低可行定義 = ch01–05 過關＋能逐行解釋自己作品裡的每一句 — 「能解釋」是底線，不是「能默寫全部」。
- 每週第一個 session，家教對照行事曆調速；砍的決定由檢查點觸發，不由感覺觸發。
