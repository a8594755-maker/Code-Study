# PROGRESS.md — 唯一進度紀錄

這是全 repo 唯一的進度檔：狀態只住這裡。歷史區塊為唯讀原文保存，永不改寫。

## 現在位置（≤10 行，每次上課後整段覆寫；git diff 就是它的歷史）

- 目前課程：五章 Entry-Level SQL Analyst 主線；現在在 Chapter 1 / Unit 1 — Database first look。
- 最近設定：2026-08-25 — 本機 VS Code／Jupyter 環境與五章課綱已完成；本次沒有新增 SQL 能力證據。
- 下一步：
  1. 在 VS Code 跑 `01_sql/reference/connection_check.sql`（選到分號 → Windows `Ctrl+Shift+E`）。
  2. 打開 `01_sql/ch01_fundamentals/unit01_2_practice.sql`；家教先出暖身第 1 題，完成 review 後才出第 2 題。
- 白紙債：Chapter 1 / Unit 1 `unit01_3_challenge.sql` 未做；未清前不開 Unit 2。
- 卡住的：尚未證明能不看範例獨立寫查詢；目前所有 SQL 概念狀態維持原樣。

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
