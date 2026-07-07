-- First Olist SQL Practice: Analyst First Look at a New Dataset
--
-- Situation:
-- You are a junior data analyst. A manager tells you:
--
-- "The Olist ecommerce data is now in PostgreSQL. Please start exploring it."
--
-- Your first job is not to build a dashboard. Your first job is to understand
-- what data exists, where the important tables are, and what one row means.
--
-- How to use this file:
-- 1. Run one step at a time.
-- 2. Read the result before moving to the next step.
-- 3. After each step, answer the "Write down" prompt in your own notes.
-- 4. Do not start the final practice query until you understand why
--    orders_raw is the starting table.
--
-- Concepts practiced:
-- schema             = a group/folder for tables inside a database.
-- table              = a structured dataset.
-- row                = one record in a table.
-- column             = one field/attribute in a table.
-- information_schema = PostgreSQL's built-in metadata catalog.
-- SELECT             = choose columns to display.
-- FROM               = choose which table to read from.
-- COUNT(*)           = count rows.
-- LIMIT              = show only a small number of rows.
-- WHERE              = keep only rows that match a condition.
-- ORDER BY           = sort rows.
-- DESC               = descending order, useful for newest first.

-- Step 0: Confirm you are connected to the database.
--
-- Analyst question:
-- Which database and user am I connected as?
--
-- Why:
-- Before exploring data, analysts confirm they are connected to the expected
-- database. This prevents a common mistake: running correct SQL against the
-- wrong database.
--
-- Code:

SELECT
    current_database() AS database_name,
    current_user AS user_name;

-- What to look for:
-- - database_name should be postgres.
-- - user_name should be postgres.
--
-- Write down:
-- I am connected to database: __________

-- Step 1: Find the schemas.
--
-- Analyst question:
-- What groups of tables exist in this database?
--
-- Why:
-- PostgreSQL organizes tables into schemas. A schema is like a folder. Before
-- selecting a table, analysts first find the schema that contains the business
-- data. In this project, the business schema is named olist.
--
-- Code:

SELECT schema_name
FROM information_schema.schemata
WHERE schema_name NOT LIKE 'pg_%'
  AND schema_name <> 'information_schema'
ORDER BY schema_name;

-- What to look for:
-- - You may see system/application schemas such as auth, public, storage.
-- - You should also see olist.
--
-- Write down:
-- The business schema for this practice is: __________

-- Step 2: List the tables inside the olist schema.
--
-- Analyst question:
-- What raw data tables are available in the Olist dataset?
--
-- Why:
-- Analysts do not guess table names. They inspect the database catalog first.
-- This gives a map of the available data sources before writing business
-- analysis queries.
--
-- Code:

SELECT
    table_schema,
    table_name
FROM information_schema.tables
WHERE table_schema = 'olist'
ORDER BY table_name;

-- What to look for:
-- You should see these raw tables:
-- - customers_raw
-- - geolocation_raw
-- - order_items_raw
-- - order_payments_raw
-- - order_reviews_raw
-- - orders_raw
-- - product_category_translation_raw
-- - products_raw
-- - sellers_raw
--
-- Write down:
-- The table that sounds like the main order table is: __________

-- Step 3: Count rows in each table.
--
-- Analyst question:
-- Which tables are large transaction tables, and which tables are small lookup
-- or reference tables?
--
-- Why:
-- Row counts help analysts understand the role of each table. A table with
-- 99,000 rows is probably transaction-level data. A table with 71 rows is
-- probably a lookup table.
--
-- Code:

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
SELECT
    table_name,
    row_count
FROM table_counts
ORDER BY row_count DESC;

-- What to look for:
-- - geolocation_raw is the largest table.
-- - orders_raw and customers_raw have the same row count.
-- - product_category_translation_raw is small.
--
-- Analyst interpretation:
-- - orders_raw is likely one row per order.
-- - customers_raw is likely one row per order-customer record.
-- - order_items_raw is larger than orders_raw because one order can have
--   multiple items.
--
-- Write down:
-- orders_raw row count: __________
-- order_items_raw row count: __________
-- Why is order_items_raw larger than orders_raw?
-- __________________________________________________

-- Step 4: Inspect columns in the likely starting table.
--
-- Analyst question:
-- What columns exist in orders_raw, and what data types do they have?
--
-- Why:
-- Before writing queries, analysts check the column list. This tells you which
-- columns are IDs, status fields, and date/timestamp fields.
--
-- Code:

SELECT
    ordinal_position,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'olist'
  AND table_name = 'orders_raw'
ORDER BY ordinal_position;

-- What to look for:
-- - order_id identifies the order.
-- - customer_id connects the order to customer information.
-- - order_status describes the business state.
-- - order_purchase_timestamp tells when the order was placed.
-- - delivery date columns can be used later for delivery performance analysis.
--
-- Write down:
-- The order ID column is: __________
-- The customer ID column is: __________
-- The order status column is: __________
-- The purchase date/time column is: __________

-- Step 5: Explain why orders_raw is the first table.
--
-- Analyst question:
-- Why do we start with olist.orders_raw instead of products_raw or customers_raw?
--
-- Why:
-- Most ecommerce analysis starts with the order. Orders connect customers,
-- products, payments, reviews, and delivery events. If you understand the order
-- table first, you have a central base for later joins.
--
-- Business map:
-- - orders_raw: what orders exist, their status, and their timeline.
-- - customers_raw: where the customer is.
-- - order_items_raw: what products were bought and at what price.
-- - order_payments_raw: how the order was paid.
-- - order_reviews_raw: customer feedback.
-- - products_raw: product attributes.
-- - sellers_raw: seller information.
--
-- Write down:
-- In my own words, we start with orders_raw because:
-- __________________________________________________

-- Step 6: Preview rows from orders_raw.
--
-- Analyst question:
-- What does one order row look like?
--
-- Why:
-- A row preview helps you confirm that the table contains the kind of business
-- data you expected. It also shows actual values, not just column names.
--
-- Code:

SELECT *
FROM olist.orders_raw
LIMIT 10;

-- What to look for:
-- - Each row has one order_id.
-- - order_status contains values such as delivered or canceled.
-- - Some delivery date fields may be blank for orders that were not delivered.
--
-- Write down:
-- One row in orders_raw represents: __________

-- Step 7: Select only the columns needed for a first order-status check.
--
-- Analyst question:
-- Which columns do I need for a first simple order review?
--
-- Why:
-- SELECT * is useful for a first preview, but analysts usually choose specific
-- columns for repeated work. This makes the result easier to scan and explain.
--
-- Code:

SELECT
    order_id,
    customer_id,
    order_status,
    order_purchase_timestamp
FROM olist.orders_raw
LIMIT 20;

-- What to look for:
-- - The result is easier to read than SELECT *.
-- - These four columns are enough to identify the order, customer, status, and
--   purchase time.
--
-- Write down:
-- The four columns I selected are useful because:
-- __________________________________________________

-- Step 8: Check the available order statuses.
--
-- Analyst question:
-- What status values exist, and how common is each one?
--
-- Why:
-- Before filtering to a status, analysts check the actual values. This avoids
-- mistakes like filtering for 'cancelled' when the data actually uses
-- 'canceled'.
--
-- Code:

SELECT
    order_status,
    COUNT(*) AS order_count
FROM olist.orders_raw
GROUP BY order_status
ORDER BY order_count DESC;

-- What to look for:
-- - delivered should be the largest status.
-- - canceled exists and uses one L: canceled.
--
-- Write down:
-- The largest status is: __________
-- The cancellation status is spelled: __________

-- Step 9: Filter to one business status.
--
-- Analyst question:
-- Can I isolate only delivered orders?
--
-- Why:
-- Real analysis usually does not use every row. For example, delivery analysis
-- should focus on delivered orders, while cancellation analysis should focus on
-- canceled orders. WHERE is how analysts create that business filter.
--
-- Code:

SELECT
    order_id,
    customer_id,
    order_status,
    order_purchase_timestamp
FROM olist.orders_raw
WHERE order_status = 'delivered'
LIMIT 20;

-- What to look for:
-- Every row returned should have order_status = 'delivered'.
--
-- Write down:
-- WHERE keeps rows where: __________________________

-- Step 10: Sort newest orders first.
--
-- Analyst question:
-- What are the most recent orders in the dataset?
--
-- Why:
-- Analysts sort by date to understand the data time range. This helps prevent
-- mistakes like assuming the table contains current transactions when it may
-- only contain historical data.
--
-- Code:

SELECT
    order_id,
    customer_id,
    order_status,
    order_purchase_timestamp
FROM olist.orders_raw
ORDER BY order_purchase_timestamp DESC
LIMIT 20;

-- What to look for:
-- - The first row should have the newest order_purchase_timestamp.
-- - DESC means descending order. For timestamps, DESC means newest first.
--
-- Write down:
-- The newest order date I see is: __________

-- Step 11: Your practice query.
--
-- Business request:
-- Show 20 canceled orders, newest first.
--
-- Why this is the first real practice:
-- This is a small analyst task that combines the same building blocks:
-- - choose columns with SELECT
-- - choose the table with FROM
-- - filter to a business status with WHERE
-- - sort by purchase time with ORDER BY
-- - keep the result readable with LIMIT
--
-- Required result:
-- - Only canceled orders.
-- - Newest orders first.
-- - Only 20 rows.
-- - Show these columns:
--   order_id, customer_id, order_status, order_purchase_timestamp.
--
-- Hint:
-- Use the delivered-orders query and the newest-orders query as patterns.
-- Do not paste a full answer from chat. Write it yourself below.
--
-- Write your query below:

