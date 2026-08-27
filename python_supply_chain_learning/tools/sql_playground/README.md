# Supply SQL Lab — Entry-Level Analyst Evidence System

Supply SQL Lab 把 `01_sql/README.md` 的五章課綱做成帳號化學習產品。它不是平行課綱：課程仍使用
Supabase PostgreSQL 的公開 Olist 資料，能力定義仍以 repo 的五章計畫為正典。

## 產品能力

- 五個 Chapter、每章六個循序任務，共 30 個真實 Olist 分析問題。
- Example → 相似題 → 變形題 → 資料驗證 → 章末獨立挑戰。
- 題目逐題解鎖；查詢通過且完成自己的 Analyst Note 後才開下一題。
- SQL reference answer 只存在伺服器；瀏覽器只取得題目、提示與驗收條件。
- 自動比較欄位、列數、數值與排序，允許不同但結果正確的 SQL 寫法。
- 每次 attempt 先寫入帳號 Query Log，再執行 SQL；Log 失敗時查詢不執行。
- Dashboard 顯示五章進度、技能精熟度、首答正確率、錯誤模式與近 14 天活動。
- Chapter 5 包含需求拆解、KPI、驗證、作品集資料集與 Entry-Level 工作模擬。
- 可下載今天或全部學習證據：CSV、JSON，或包含每次 `.sql` 的 ZIP。

## 執行

```bash
cd tools/sql_playground
npm install
npm run dev
```

開發版前端使用 <http://127.0.0.1:5173>，API 使用 <http://127.0.0.1:3001>。

正式驗證：

```bash
npm test
npm run build
npm start
```

正式版使用 <http://127.0.0.1:3001>。

## Supabase 架構

前端使用 Supabase Email／Password Auth。後端收到 access token 後向 Supabase Auth 驗證使用者，再以同一個
token 呼叫受 RLS（Row Level Security，資料列安全規則）保護的 REST API。

需要依序套用：

1. `supabase/migrations/202608270001_query_logs.sql`
2. `supabase/migrations/202608270002_learning_platform.sql`

第二個 migration 建立：

- 擴充版 `sql_playground_query_logs`
- `sql_playground_lesson_progress`
- `sql_playground_learning_events`
- `sql_playground_execute()` authenticated read-only RPC
- `sql_playground_schema()` schema explorer RPC
- 每個使用者只能讀寫自己資料的 RLS policies

Runtime 只需要：

```text
SUPABASE_URL
SUPABASE_ANON_KEY
DATABASE_SCHEMA=olist
PORT=3001
```

不需要 `postgres` password 或 `service_role` key。Olist 的 authenticated role 只有 schema `USAGE`、資料表
`SELECT` 與指定 RPC `EXECUTE`；沒有 INSERT、UPDATE、DELETE 或 DDL 權限。

## SQL 安全

執行路徑有多層保護：

1. PostgreSQL AST parser 只接受一個 `SELECT` 或 `WITH ... SELECT`。
2. table allowlist 只允許 `olist`、`information_schema` 與查詢內的 CTE。
3. 高風險 PostgreSQL functions 會被擋下。
4. Database RPC 再次檢查語句類型、mutating keywords 與危險 functions。
5. authenticated database role 對 Olist 只有 `SELECT`。
6. PostgreSQL statement timeout 為 8 秒，結果最多回傳 500 列。
7. API 每個來源每分鐘最多執行 30 次。

## Log 與下載

每次執行會保存：UTC timestamp、Chapter、Unit、題目、attempt number、hint level、完整 SQL、成功／失敗、
自動判題分數、檢查細節、row count、duration、PostgreSQL error 與最多 20 列結果 preview。

完整 ZIP 內容：

```text
attempts.csv
progress.csv
learning_events.csv
learning_report.json
queries/*.sql
```

密碼、access token 與 API key 永遠不寫入 Query Log 或下載檔。

## Netlify 部署

正式站：https://supply-sql-lab-a8594755.netlify.app

repo 根目錄的 `netlify.toml` 會建置 Vite 前端，並透過 Netlify Function 提供既有 Express API。
`/api/*` 會 rewrite 到 Function，其餘路徑回到 SPA 的 `index.html`。

Supabase 設定使用 Netlify 的站點環境變數；不放在 `netlify.toml` 或 Git。變數更新後必須重新部署，
Function 才會取得新值。
