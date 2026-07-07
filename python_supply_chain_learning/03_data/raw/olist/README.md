# Olist 原始資料（raw CSV）

這裡放 Olist 巴西電商資料集的 9 個原始 CSV（逗號分隔的資料檔），整組約 126 MB。

應該要有的 9 個檔案：

```text
olist_customers_dataset.csv
olist_geolocation_dataset.csv
olist_order_items_dataset.csv
olist_order_payments_dataset.csv
olist_order_reviews_dataset.csv
olist_orders_dataset.csv
olist_products_dataset.csv
olist_sellers_dataset.csv
product_category_name_translation.csv
```

## 資料來源（Kaggle）

Kaggle 公開資料集：**Brazilian E-Commerce Public Dataset by Olist**
https://www.kaggle.com/datasets/olistbr/brazilian-ecommerce

## 這些 CSV 永不進 git

它們太大，`.gitignore`（git 忽略清單）已排除 `03_data/raw/olist/*.csv`，所以永遠不會被 commit（提交）、也不會出現在 GitHub。這是刻意的設計，不是漏掉。

## 檔案遺失時怎麼補回

1. 打開上面的 Kaggle 頁面（需要免費帳號），按 Download 下載 zip。
2. 解壓縮後，把 9 個 CSV 原封不動放回本資料夾（**檔名不要改**）。
3. 補回 CSV 只是恢復本機備份；SQL 課查的資料在 Supabase PostgreSQL 的 `olist` schema 上，不受影響。只有在需要重建整個資料庫時，才會用到 `01_sql/setup_one_time/` 重新匯入。

## 鐵則

原始 CSV 永不直接修改。練習一律查資料庫裡的表；處理結果存到 `03_data/processed/` 或 `03_data/output/`。
