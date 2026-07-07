-- ============================================================================
-- ⚠️ 一次性建表腳本 — 2026-06-13 已執行完成，勿重跑。
-- 只有在明確決定「重建資料庫」時才需要（流程見本資料夾 README.md）。
--
-- 這個檔案做什麼：
-- 建立 schema（資料庫資料夾）olist、9 張空的 _raw 表、以及常用 join 欄位的
-- 索引。執行順序 = 檔名編號：1 建表 → 2 匯入 → 3 驗證。
--
-- 每張表的商業意義（是誰、為什麼重要、重要欄位）已抽出成隨查文件：
--   → 01_sql/reference/data_dictionary.md
-- 下方保留的英文逐表註解是 DDL（建表語句）的原始說明，供對照參考。
--
-- 安全性：全檔使用 IF NOT EXISTS — 物件已存在就跳過，不會刪除既有資料。
-- 但仍屬 setup 腳本，不在日常課程的 read-only（唯讀）規則之內，勿隨手執行。
-- ============================================================================

-- ============================================================================
-- Section 1: Create the schema
-- ============================================================================
--
-- Concept:
-- A schema is like a folder inside a PostgreSQL database. It groups related
-- tables together.
--
-- Why:
-- Supabase/PostgreSQL may have many system schemas such as auth, public, and
-- storage. We create an olist schema so all Olist practice tables live in one
-- clear place.
--
-- Business meaning:
-- Any table named olist.table_name belongs to the Olist ecommerce practice
-- dataset.

CREATE SCHEMA IF NOT EXISTS olist;

-- After this runs, the database can store tables like:
--
-- olist.orders_raw
-- olist.customers_raw
-- olist.order_items_raw

-- ============================================================================
-- Section 2: Create raw tables
-- ============================================================================
--
-- Concept:
-- A raw table stores source data with minimal cleaning. In analyst work, raw
-- tables preserve the original CSV structure as much as possible.
--
-- Why constraints are light:
-- We are learning exploration first. Later, after understanding the data, we
-- can create cleaned tables with stronger rules if needed.
--
-- Common data types in this file:
--
-- TEXT              = text values, IDs, names, cities, statuses.
-- INTEGER           = whole numbers.
-- NUMERIC(12, 2)    = money-like numbers with 2 decimal places.
-- TIMESTAMP         = date and time.
-- DOUBLE PRECISION  = decimal measurement values such as latitude/longitude.

-- ----------------------------------------------------------------------------
-- customers_raw
-- ----------------------------------------------------------------------------
--
-- Business meaning:
-- One row describes a customer record and where that customer is located.
--
-- Why it matters:
-- This table lets analysts connect orders to customer city and state later.
--
-- Important columns:
-- - customer_id: connects to olist.orders_raw.
-- - customer_unique_id: identifies the real customer across orders.
-- - customer_state: useful for state-level analysis.

CREATE TABLE IF NOT EXISTS olist.customers_raw (
    customer_id TEXT,
    customer_unique_id TEXT,
    customer_zip_code_prefix INTEGER,
    customer_city TEXT,
    customer_state TEXT
);

-- ----------------------------------------------------------------------------
-- geolocation_raw
-- ----------------------------------------------------------------------------
--
-- Business meaning:
-- One row describes a zip-code-level location point.
--
-- Why it matters:
-- This table can support location analysis, but it is not the first table to
-- study because it is large and less directly tied to order performance.

CREATE TABLE IF NOT EXISTS olist.geolocation_raw (
    geolocation_zip_code_prefix INTEGER,
    geolocation_lat DOUBLE PRECISION,
    geolocation_lng DOUBLE PRECISION,
    geolocation_city TEXT,
    geolocation_state TEXT
);

-- ----------------------------------------------------------------------------
-- order_items_raw
-- ----------------------------------------------------------------------------
--
-- Business meaning:
-- One row describes one item inside an order.
--
-- Why it matters:
-- One order can contain multiple items, so this table usually has more rows
-- than orders_raw. It is needed for product, seller, price, and freight
-- analysis.
--
-- Important columns:
-- - order_id: connects each item to an order.
-- - product_id: connects each item to product details.
-- - seller_id: connects each item to seller details.
-- - price: product sales value.
-- - freight_value: shipping/freight charge.

CREATE TABLE IF NOT EXISTS olist.order_items_raw (
    order_id TEXT,
    order_item_id INTEGER,
    product_id TEXT,
    seller_id TEXT,
    shipping_limit_date TIMESTAMP,
    price NUMERIC(12, 2),
    freight_value NUMERIC(12, 2)
);

-- ----------------------------------------------------------------------------
-- order_payments_raw
-- ----------------------------------------------------------------------------
--
-- Business meaning:
-- One row describes a payment record for an order.
--
-- Why it matters:
-- Analysts use this table to study payment methods, installments, and payment
-- value.

CREATE TABLE IF NOT EXISTS olist.order_payments_raw (
    order_id TEXT,
    payment_sequential INTEGER,
    payment_type TEXT,
    payment_installments INTEGER,
    payment_value NUMERIC(12, 2)
);

-- ----------------------------------------------------------------------------
-- order_reviews_raw
-- ----------------------------------------------------------------------------
--
-- Business meaning:
-- One row describes a customer review for an order.
--
-- Why it matters:
-- Analysts use this table to connect operational performance with customer
-- satisfaction.

CREATE TABLE IF NOT EXISTS olist.order_reviews_raw (
    review_id TEXT,
    order_id TEXT,
    review_score INTEGER,
    review_comment_title TEXT,
    review_comment_message TEXT,
    review_creation_date TIMESTAMP,
    review_answer_timestamp TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- orders_raw
-- ----------------------------------------------------------------------------
--
-- Business meaning:
-- One row describes one order and its lifecycle timestamps.
--
-- Why it is the first analyst table:
-- Most ecommerce questions start with orders. This table connects customer,
-- order status, purchase date, delivery dates, and estimated delivery date.
--
-- Important columns:
-- - order_id: connects to items, payments, and reviews.
-- - customer_id: connects to customer location.
-- - order_status: delivered, canceled, shipped, and other business statuses.
-- - order_purchase_timestamp: when the order was placed.
-- - order_delivered_customer_date: when the customer received the order.
-- - order_estimated_delivery_date: expected delivery date.

CREATE TABLE IF NOT EXISTS olist.orders_raw (
    order_id TEXT,
    customer_id TEXT,
    order_status TEXT,
    order_purchase_timestamp TIMESTAMP,
    order_approved_at TIMESTAMP,
    order_delivered_carrier_date TIMESTAMP,
    order_delivered_customer_date TIMESTAMP,
    order_estimated_delivery_date TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- products_raw
-- ----------------------------------------------------------------------------
--
-- Business meaning:
-- One row describes one product and its attributes.
--
-- Why it matters:
-- Analysts join this table to order_items_raw when they need product category
-- and product size/weight attributes.
--
-- Note:
-- The original Olist CSV spells "length" as "lenght" in some column names.
-- This file keeps the original spelling so the CSV import matches correctly.

CREATE TABLE IF NOT EXISTS olist.products_raw (
    product_id TEXT,
    product_category_name TEXT,
    product_name_lenght INTEGER,
    product_description_lenght INTEGER,
    product_photos_qty INTEGER,
    product_weight_g INTEGER,
    product_length_cm INTEGER,
    product_height_cm INTEGER,
    product_width_cm INTEGER
);

-- ----------------------------------------------------------------------------
-- sellers_raw
-- ----------------------------------------------------------------------------
--
-- Business meaning:
-- One row describes one seller and where that seller is located.
--
-- Why it matters:
-- Analysts join this table to order_items_raw when they need seller-level
-- performance or seller location analysis.

CREATE TABLE IF NOT EXISTS olist.sellers_raw (
    seller_id TEXT,
    seller_zip_code_prefix INTEGER,
    seller_city TEXT,
    seller_state TEXT
);

-- ----------------------------------------------------------------------------
-- product_category_translation_raw
-- ----------------------------------------------------------------------------
--
-- Business meaning:
-- One row maps a Portuguese product category name to an English category name.
--
-- Why it matters:
-- The original product category names are in Portuguese. This lookup table
-- makes category analysis easier to read in English.

CREATE TABLE IF NOT EXISTS olist.product_category_translation_raw (
    product_category_name TEXT,
    product_category_name_english TEXT
);

-- ============================================================================
-- Section 3: Create helpful indexes
-- ============================================================================
--
-- Concept:
-- An index is a database helper structure that can make lookups and joins
-- faster.
--
-- Beginner analogy:
-- A book index helps you find a topic quickly without reading every page.
-- A database index helps PostgreSQL find matching rows faster.
--
-- Why these columns:
-- These are common join columns. Later, analyst queries will often connect:
--
-- - orders to customers by customer_id
-- - orders to items by order_id
-- - items to products by product_id
-- - items to sellers by seller_id
--
-- Note:
-- Indexes do not change the data. They help performance.

CREATE INDEX IF NOT EXISTS idx_customers_raw_customer_id
ON olist.customers_raw (customer_id);

CREATE INDEX IF NOT EXISTS idx_orders_raw_order_id
ON olist.orders_raw (order_id);

CREATE INDEX IF NOT EXISTS idx_orders_raw_customer_id
ON olist.orders_raw (customer_id);

CREATE INDEX IF NOT EXISTS idx_order_items_raw_order_id
ON olist.order_items_raw (order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_raw_product_id
ON olist.order_items_raw (product_id);

CREATE INDEX IF NOT EXISTS idx_order_items_raw_seller_id
ON olist.order_items_raw (seller_id);

CREATE INDEX IF NOT EXISTS idx_products_raw_product_id
ON olist.products_raw (product_id);

CREATE INDEX IF NOT EXISTS idx_sellers_raw_seller_id
ON olist.sellers_raw (seller_id);

-- ============================================================================
-- Section 4: After-run checks
-- ============================================================================
--
-- Purpose:
-- These checks do not create or change data. They help you verify what exists.
--
-- How to use:
-- Highlight one query at a time and run it.

-- Check 1: List all Olist raw tables.
SELECT
    table_schema,
    table_name
FROM information_schema.tables
WHERE table_schema = 'olist'
ORDER BY table_name;

-- Check 2: Count how many Olist raw tables exist.
SELECT
    COUNT(*) AS olist_table_count
FROM information_schema.tables
WHERE table_schema = 'olist';

-- Check 3: Inspect the columns in the main orders table.
SELECT
    ordinal_position,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'olist'
  AND table_name = 'orders_raw'
ORDER BY ordinal_position;

-- Check 4: List indexes created on Olist tables.
SELECT
    schemaname,
    tablename,
    indexname
FROM pg_indexes
WHERE schemaname = 'olist'
ORDER BY tablename, indexname;

