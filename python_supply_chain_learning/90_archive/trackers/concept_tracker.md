# Concept Tracker

Use this file to track Python and SQL concepts one by one.

Status scale:

```text
Not Started -> Introduced -> Practiced -> Can Explain -> Independent
```

- `Introduced`: you have seen the concept and heard the explanation.
- `Practiced`: you used it in code or SQL.
- `Can Explain`: you can explain it in your own words.
- `Independent`: you can use it from a blank page without hints.

## Python Concepts

| Concept | Meaning | Status | First Lesson | Practice Example | Next Check |
| --- | --- | --- | --- | --- | --- |
| `print()` | output function（輸出函數） | Practiced | Inventory Cost Calculator | `print("Product:", product_name)` | Explain what appears on screen and why |
| `variable` | 變數 | Practiced | Inventory Cost Calculator | `unit_price = 45` | Explain name vs value |
| `string` | 文字 | Introduced | Inventory Cost Calculator | `"Keyboard"` | Explain why quotation marks are needed |
| `integer` | 整數 | Introduced | Inventory Cost Calculator | `45`, `30` | Explain why numbers do not need quotation marks |
| `=` | assignment operator（指定/賦值運算子） | Introduced | Inventory Cost Calculator | `unit_price = 45` | Explain right side goes into left name |
| `*` | multiplication operator（乘法運算子） | Practiced | Inventory Cost Calculator | `unit_price * units_sold` | Use it in another calculator |
| `NameError` | name lookup error（名稱錯誤） | Practiced | Sales Revenue Calculator | `units_price` vs `unit_price` | Fix one variable-name error |
| Terminal | 終端機 | Practiced | Sales Revenue Calculator | `python3 01_lessons/week_01_basics/day2_sales_revenue/1_example.py` | Run a file without help |
| `cd` | change directory（切換資料夾） | Practiced | Sales Revenue Calculator | `cd python_supply_chain_learning` | Explain current folder |
| `pwd` | print working directory（顯示目前資料夾） | Practiced | Sales Revenue Calculator | `pwd` | Use it before running Python |

## Pandas / Notebook Concepts

| Concept | Meaning | Status | First Lesson | Practice Example | Next Check |
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

## SQL Concepts

| Concept | Meaning | Status | First Lesson | Practice Example | Next Check |
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
