-- ============================================================================
-- 匯入後驗證 — 全部 CSV 匯入完成後執行，預期筆數如下。
-- （本檔只有 SELECT，唯讀無副作用，隨時可重跑核對。）
--
-- 第一條查詢應回報 9 列，筆數對照（2026-06-13 匯入快照）：
--   customers_raw                       99,441
--   geolocation_raw                  1,000,163
--   order_items_raw                    112,650
--   order_payments_raw                 103,886
--   order_reviews_raw                   99,224
--   orders_raw                          99,441
--   product_category_translation_raw        71
--   products_raw                        32,951
--   sellers_raw                          3,095
-- 數字全對 = 匯入成功；任何一張表為 0 或差很多 = 回頭重看第 2 步匯入。
-- ============================================================================

WITH table_counts AS (
    SELECT 'customers_raw' AS table_name, COUNT(*) AS row_count FROM olist.customers_raw
    UNION ALL
    SELECT 'geolocation_raw', COUNT(*) FROM olist.geolocation_raw
    UNION ALL
    SELECT 'order_items_raw', COUNT(*) FROM olist.order_items_raw
    UNION ALL
    SELECT 'order_payments_raw', COUNT(*) FROM olist.order_payments_raw
    UNION ALL
    SELECT 'order_reviews_raw', COUNT(*) FROM olist.order_reviews_raw
    UNION ALL
    SELECT 'orders_raw', COUNT(*) FROM olist.orders_raw
    UNION ALL
    SELECT 'products_raw', COUNT(*) FROM olist.products_raw
    UNION ALL
    SELECT 'sellers_raw', COUNT(*) FROM olist.sellers_raw
    UNION ALL
    SELECT 'product_category_translation_raw', COUNT(*) FROM olist.product_category_translation_raw
)
SELECT table_name, row_count
FROM table_counts
ORDER BY table_name;
-- ↑ 預期：9 列，row_count 對照上方快照
--   （customers 99,441 / geolocation 1,000,163 / order_items 112,650 /
--    order_payments 103,886 / order_reviews 99,224 / orders 99,441 /
--    category_translation 71 / products 32,951 / sellers 3,095）

-- 快速抽樣預覽：確認資料長得像資料（不是全 NULL、欄位沒錯位）。

SELECT *
FROM olist.orders_raw
LIMIT 10;
-- ↑ 預期：10 列訂單，order_status 應出現 delivered 等狀態、時間欄有日期

SELECT *
FROM olist.order_items_raw
LIMIT 10;
-- ↑ 預期：10 列品項，price 與 freight_value 應為合理金額（非 NULL、非 0 整排）

SELECT *
FROM olist.products_raw
LIMIT 10;
-- ↑ 預期：10 列商品，product_category_name 為葡萄牙文品類名
