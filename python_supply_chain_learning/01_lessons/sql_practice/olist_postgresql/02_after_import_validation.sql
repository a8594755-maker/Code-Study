-- Run this after importing all Olist CSV files.
-- Goal: confirm that rows loaded into every raw table.

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

-- Quick preview checks.

SELECT *
FROM olist.orders_raw
LIMIT 10;

SELECT *
FROM olist.order_items_raw
LIMIT 10;

SELECT *
FROM olist.products_raw
LIMIT 10;
