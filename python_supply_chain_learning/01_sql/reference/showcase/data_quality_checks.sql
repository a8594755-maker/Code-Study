-- 課程終點示範：第 6 章會逐句拆解這 6 個查詢。現在看不懂是正常的 — 這是你 8 週後的樣子。
-- Olist data quality checks.
-- Goal: inspect the raw dataset before doing business analysis.

-- 1. Order status distribution.
SELECT
    order_status,
    COUNT(*) AS order_count
FROM olist.orders_raw
GROUP BY order_status
ORDER BY order_count DESC;

-- 2. Orders without purchase timestamp.
SELECT COUNT(*) AS orders_missing_purchase_timestamp
FROM olist.orders_raw
WHERE order_purchase_timestamp IS NULL;

-- 3. Duplicate customer IDs in the customer table.
SELECT
    customer_id,
    COUNT(*) AS duplicate_count
FROM olist.customers_raw
GROUP BY customer_id
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC
LIMIT 20;

-- 4. Order items that cannot find a matching order.
SELECT COUNT(*) AS order_items_without_order
FROM olist.order_items_raw AS item
LEFT JOIN olist.orders_raw AS orders
    ON item.order_id = orders.order_id
WHERE orders.order_id IS NULL;

-- 5. Order items that cannot find a matching product.
SELECT COUNT(*) AS order_items_without_product
FROM olist.order_items_raw AS item
LEFT JOIN olist.products_raw AS product
    ON item.product_id = product.product_id
WHERE product.product_id IS NULL;

-- 6. Delivered orders that arrived after the estimated delivery date.
SELECT COUNT(*) AS late_delivered_orders
FROM olist.orders_raw
WHERE order_status = 'delivered'
  AND order_delivered_customer_date > order_estimated_delivery_date;
