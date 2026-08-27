-- ============================================================================
-- ⚠️ 一次性匯入腳本 — 2026-06-13 已執行完成，勿重跑（重跑會把資料灌成兩倍）。
--
-- ⚠️ \copy 是 psql 專用指令 — 用 VS Code 擴充執行會失敗（Windows Ctrl+Shift+E／macOS Cmd+Shift+E）。
-- ⚠️ 必須從 repo 根目錄啟動 psql，因為下方的 CSV 路徑是相對路徑
--    03_data/raw/olist/...（從別的目錄啟動會找不到檔案）。
--
-- 執行方式（僅重建資料庫時；完整流程見本資料夾 README.md）：
--   1. 在 repo 根目錄啟動 psql 連上 Supabase（密碼只在提示時輸入）。
--   2. 執行 \i 01_sql/setup_one_time/2_import_csv_psql_only.sql
--
-- 原理：\copy 在你的 Mac 端讀 CSV，再把列送進 Supabase 的表。
-- 每條 \copy 必須寫在同一行 — psql 的元指令（meta-command）以「行」為單位。
-- ============================================================================

\copy olist.customers_raw (customer_id, customer_unique_id, customer_zip_code_prefix, customer_city, customer_state) FROM '03_data/raw/olist/olist_customers_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '', QUOTE '"', ESCAPE '"');

\copy olist.geolocation_raw (geolocation_zip_code_prefix, geolocation_lat, geolocation_lng, geolocation_city, geolocation_state) FROM '03_data/raw/olist/olist_geolocation_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '', QUOTE '"', ESCAPE '"');

\copy olist.order_items_raw (order_id, order_item_id, product_id, seller_id, shipping_limit_date, price, freight_value) FROM '03_data/raw/olist/olist_order_items_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '', QUOTE '"', ESCAPE '"');

\copy olist.order_payments_raw (order_id, payment_sequential, payment_type, payment_installments, payment_value) FROM '03_data/raw/olist/olist_order_payments_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '', QUOTE '"', ESCAPE '"');

\copy olist.order_reviews_raw (review_id, order_id, review_score, review_comment_title, review_comment_message, review_creation_date, review_answer_timestamp) FROM '03_data/raw/olist/olist_order_reviews_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '', QUOTE '"', ESCAPE '"');

\copy olist.orders_raw (order_id, customer_id, order_status, order_purchase_timestamp, order_approved_at, order_delivered_carrier_date, order_delivered_customer_date, order_estimated_delivery_date) FROM '03_data/raw/olist/olist_orders_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '', QUOTE '"', ESCAPE '"');

\copy olist.products_raw (product_id, product_category_name, product_name_lenght, product_description_lenght, product_photos_qty, product_weight_g, product_length_cm, product_height_cm, product_width_cm) FROM '03_data/raw/olist/olist_products_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '', QUOTE '"', ESCAPE '"');

\copy olist.sellers_raw (seller_id, seller_zip_code_prefix, seller_city, seller_state) FROM '03_data/raw/olist/olist_sellers_dataset.csv' WITH (FORMAT csv, HEADER true, NULL '', QUOTE '"', ESCAPE '"');

\copy olist.product_category_translation_raw (product_category_name, product_category_name_english) FROM '03_data/raw/olist/product_category_name_translation.csv' WITH (FORMAT csv, HEADER true, NULL '', QUOTE '"', ESCAPE '"');
