# setup_one_time — 一次性建置腳本（已完成，勿重跑）

> **已於 2026-06-13 全部執行完成，勿重跑；只有重建資料庫時才需要。**

這個資料夾不是課程。它是把 Olist 資料裝進 Supabase PostgreSQL 的一次性工程腳本 — 就像倉庫的初始上架作業：做完一次，之後每天的日常作業（你的 SQL 課）都建立在它之上。

日常上課請回到 [../README.md](../README.md)。想確認連線是否正常，跑 [../reference/connection_check.sql](../reference/connection_check.sql) 就好，不需要碰這裡。

---

## 真實執行順序（編號 = 順序）

| 順序 | 檔案 | 做什麼 | 在哪裡跑 |
|---|---|---|---|
| 1 | `1_create_schema_and_tables.sql` | 建 schema（資料庫資料夾）`olist` ＋ 9 張空的 `_raw` 表 ＋ 索引 | VS Code 或 psql 皆可 |
| 2 | `2_import_csv_psql_only.sql` | 用 `\copy` 把 9 個 CSV 灌進表裡 | **只能 psql**，且必須從 repo 根目錄啟動（VS Code 擴充跑會失敗，`\copy` 是 psql 專用指令） |
| 3 | `3_validate_import.sql` | 數每張表的列數，核對是否全部匯入 | VS Code 或 psql 皆可 |

## 9 表預期筆數（2026-06-13 匯入快照）

匯入成功時，`3_validate_import.sql` 應該回報這些數字：

| 表 | 筆數 |
|---|---:|
| `olist.customers_raw` | 99,441 |
| `olist.geolocation_raw` | 1,000,163 |
| `olist.order_items_raw` | 112,650 |
| `olist.order_payments_raw` | 103,886 |
| `olist.order_reviews_raw` | 99,224 |
| `olist.orders_raw` | 99,441 |
| `olist.product_category_translation_raw` | 71 |
| `olist.products_raw` | 32,951 |
| `olist.sellers_raw` | 3,095 |

## 如果真的要重建資料庫（唯一需要碰這個資料夾的情境）

1. 先確認 9 個 Olist CSV 都在 `03_data/raw/olist/`（遺失時的補回方法見該資料夾的 README）。
2. 重新連結 Supabase 專案（只在 CLI 快取遺失時需要）：

   ```bash
   supabase link --project-ref ylmuvsdegmpoiygbtipi
   ```

3. 依序跑 **1 → 2 → 3**。注意第 2 步：必須**從 repo 根目錄**啟動 psql 再執行，因為檔內的 `\copy` 用的是相對路徑 `03_data/raw/olist/...`：

   ```powershell
   psql "postgresql://postgres.ylmuvsdegmpoiygbtipi@aws-1-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require"
   ```

   Windows 與 macOS 都可使用上面的命令，前提是 `psql` 已安裝並在 PATH（系統命令搜尋路徑）內；日常上課不需要安裝它，使用 VS Code PostgreSQL 擴充即可。

   密碼只在提示時輸入，永不寫進檔案。連上後：

   ```text
   \i 01_sql/setup_one_time/2_import_csv_psql_only.sql
   ```

4. 跑完第 3 步，逐一核對上面的 9 個筆數。全對 = 重建完成。
