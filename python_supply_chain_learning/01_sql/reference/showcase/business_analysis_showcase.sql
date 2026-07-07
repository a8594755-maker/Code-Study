-- Olist business analysis starter queries.
-- Goal: practice analyst SQL with ecommerce business questions.

-- 1. Monthly gross merchandise value from order items.
SELECT
    DATE_TRUNC('month', orders.order_purchase_timestamp)::date AS order_month,
    SUM(item.price) AS gross_merchandise_value,
    SUM(item.freight_value) AS freight_value,
    COUNT(DISTINCT orders.order_id) AS order_count
FROM olist.orders_raw AS orders
JOIN olist.order_items_raw AS item
    ON orders.order_id = item.order_id
WHERE orders.order_status = 'delivered'
GROUP BY order_month
ORDER BY order_month;

-- 2. Top product categories by sales.
SELECT
    COALESCE(category.product_category_name_english, product.product_category_name) AS product_category,
    SUM(item.price) AS sales,
    COUNT(DISTINCT item.order_id) AS order_count,
    COUNT(*) AS item_count
FROM olist.order_items_raw AS item
JOIN olist.products_raw AS product
    ON item.product_id = product.product_id
LEFT JOIN olist.product_category_translation_raw AS category
    ON product.product_category_name = category.product_category_name
GROUP BY product_category
ORDER BY sales DESC
LIMIT 20;

-- 3. Delivery performance by customer state.
SELECT
    customer.customer_state,
    COUNT(*) AS delivered_orders,
    AVG(
        EXTRACT(EPOCH FROM orders.order_delivered_customer_date - orders.order_purchase_timestamp) / 86400.0
    ) AS avg_delivery_days,
    AVG(
        CASE
            WHEN orders.order_delivered_customer_date > orders.order_estimated_delivery_date THEN 1
            ELSE 0
        END
    ) AS late_delivery_rate
FROM olist.orders_raw AS orders
JOIN olist.customers_raw AS customer
    ON orders.customer_id = customer.customer_id
WHERE orders.order_status = 'delivered'
  AND orders.order_delivered_customer_date IS NOT NULL
GROUP BY customer.customer_state
ORDER BY late_delivery_rate DESC;

-- Practice:
-- Change query 2 to show the top 10 product categories by item_count instead of sales.
