-- Student Workbench: First Olist SELECT Practice
--
-- Purpose:
-- This is your first SQL writing practice file.
--
-- Practice 1 to Practice 3 are guided because this is your first SQL practice.
-- They include the answer, line-by-line explanation, and the basic SQL concepts.
--
-- Practice 4 to Practice 10 are your next writing practices. They stay blank
-- until you are ready to write more from memory.
--
-- Rule:
-- For Practice 1 to Practice 3:
-- 1. Read the answer.
-- 2. Read the explanation.
-- 3. Run the query.
-- 4. Cover the answer and type it again from memory.
--
-- For later practices:
-- Try from memory first. If you are stuck, look at only the smallest part you
-- need, then return here.
--
-- Daily practice loop:
-- 1. Read the business question.
-- 2. Predict the table you need.
-- 3. Write the SQL from memory.
-- 4. Run only your query.
-- 5. Read the result.
-- 6. Fix the query if there is an error.
-- 7. Write one sentence in your notes explaining what the result means.
--
-- Suggested pace:
-- Day 1: Practice 1 to Practice 3.
-- Day 2: Practice 4 to Practice 6.
-- Day 3: Practice 7 to Practice 10.
--
-- Allowed SQL keywords for this file:
-- SELECT
-- FROM
-- WHERE
-- ORDER BY
-- LIMIT
-- COUNT
-- GROUP BY
-- AS
-- AND
-- NOT LIKE
-- <>
--
-- Do not use:
-- UPDATE
-- DELETE
-- DROP
-- TRUNCATE

-- Basic SQL concepts for zero foundation:
--
-- SQL statement:
-- A SQL statement is one complete instruction sent to the database.
--
-- Semicolon:
-- A semicolon ends a SQL statement. It tells the database, "this command is
-- complete."
--
-- SELECT:
-- SELECT chooses what you want to display in the result.
--
-- FROM:
-- FROM chooses the table or system view you want to read from.
--
-- WHERE:
-- WHERE filters rows. It keeps only rows that match your condition.
--
-- ORDER BY:
-- ORDER BY sorts the result.
--
-- AS:
-- AS gives a result column a readable name.
--
-- String value:
-- Text values in SQL use single quotes, such as 'olist'.

-- ============================================================================
-- Practice 1: Connection check
-- ============================================================================
--
-- Business question:
-- Which database and user am I connected as?
--
-- Why:
-- Analysts first confirm they are connected to the expected database before
-- querying business tables.
--
-- Required result columns:
-- - database_name
-- - user_name
--
-- Answer:

SELECT
    current_database() AS database_name,
    current_user AS user_name;

-- Line-by-line explanation:
--
-- SELECT
-- This starts the query and tells PostgreSQL what to show in the result.
--
-- current_database()
-- This is a PostgreSQL function. A function is a built-in command that returns
-- a value. This one returns the database you are connected to.
--
-- AS database_name
-- AS renames the output column so the result is easier to read.
--
-- current_user
-- This returns the database user you are connected as.
--
-- AS user_name
-- This renames the output column to user_name.
--
-- ;
-- The semicolon ends the SQL statement.
--
-- Expected result for this Supabase setup:
-- database_name should be postgres.
-- user_name should be postgres.
--
-- Your turn:
-- Below this comment, type the same query again from memory.



-- After running:
-- database_name I see: postgres
-- user_name I see: postgres

-- ============================================================================
-- Practice 2: Find business schemas
-- ============================================================================
--
-- Business question:
-- What non-system schemas exist in this database?
--
-- Why:
-- Analysts inspect schemas before choosing a table. In this project, the
-- business schema should be olist.
--
-- Required source:
-- - information_schema.schemata
--
-- Hint:
-- Filter out schemas that start with pg_ and filter out information_schema.
--
-- Answer:

SELECT schema_name
FROM information_schema.schemata
WHERE schema_name NOT LIKE 'pg_%'
  AND schema_name <> 'information_schema'
ORDER BY schema_name;

-- Line-by-line explanation:
--
-- SELECT schema_name
-- Show only the schema_name column in the result.
--
-- FROM information_schema.schemata
-- Read from PostgreSQL's metadata view that stores schema names.
-- Metadata means "data about the database."
--
-- WHERE schema_name NOT LIKE 'pg_%'
-- Keep schemas whose names do not start with pg_.
-- pg_ schemas are PostgreSQL system schemas.
--
-- AND schema_name <> 'information_schema'
-- Also remove information_schema from the result.
-- <> means "not equal to."
--
-- ORDER BY schema_name
-- Sort the schema names alphabetically.
--
-- ;
-- End the SQL statement.
--
-- Concepts in this query:
-- - FROM is needed because this query reads from a source.
-- - WHERE filters rows.
-- - AND combines two filter conditions.
-- - NOT LIKE checks that text does not match a pattern.
-- - 'pg_%' means text that starts with pg_.
-- - <> means not equal to.
--
-- Expected result:
-- The result may include several schemas, but you should see olist.
--
-- Your turn:
-- Below this comment, type the same query again from memory.



-- After running:
-- The business schema for this practice is: olist

-- ============================================================================
-- Practice 3: List Olist tables
-- ============================================================================
--
-- Business question:
-- What tables are available in the olist schema?
--
-- Why:
-- Analysts do not guess table names. They inspect the database catalog first.
--
-- Required result columns:
-- - table_schema
-- - table_name
--
-- Required source:
-- - information_schema.tables
--
-- Answer:

SELECT
    table_schema,
    table_name
FROM information_schema.tables
WHERE table_schema = 'olist'
ORDER BY table_name;

-- Line-by-line explanation:
--
-- SELECT
-- Start choosing which columns to display.
--
-- table_schema,
-- Display the schema/folder that each table belongs to.
--
-- table_name
-- Display the table name.
--
-- FROM information_schema.tables
-- Read from PostgreSQL's metadata view that stores table information.
--
-- WHERE table_schema = 'olist'
-- Keep only tables inside the olist schema.
-- The text value 'olist' uses single quotes.
--
-- ORDER BY table_name
-- Sort the result by table name so it is easier to scan.
--
-- ;
-- End the SQL statement.
--
-- Expected tables:
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
-- Analyst interpretation:
-- orders_raw sounds like the main order table.
-- order_items_raw sounds like the item-level table.
-- customers_raw sounds like the customer table.
--
-- Your turn:
-- Below this comment, type the same query again from memory.



-- After running:
-- The main order table seems to be: orders_raw

-- ============================================================================
-- Practice 4: Inspect orders_raw columns
-- ============================================================================
--
-- Business question:
-- What columns exist in olist.orders_raw?
--
-- Why:
-- Before selecting or filtering data, analysts inspect column names and data
-- types.
--
-- Required result columns:
-- - ordinal_position
-- - column_name
-- - data_type
--
-- Required source:
-- - information_schema.columns
--
-- Write your query below:



-- After running:
-- Order ID column: __________
-- Customer ID column: __________
-- Status column: __________
-- Purchase timestamp column: __________

-- ============================================================================
-- Practice 5: Preview orders
-- ============================================================================
--
-- Business question:
-- What does one order row look like?
--
-- Why:
-- A small preview helps analysts understand real values before writing a
-- business query.
--
-- Required table:
-- - olist.orders_raw
--
-- Required row limit:
-- - 10 rows
--
-- Write your query below:



-- After running:
-- One row in orders_raw represents: __________

-- ============================================================================
-- Practice 6: Select only useful order columns
-- ============================================================================
--
-- Business question:
-- Can I show a readable order list with only the most important columns?
--
-- Why:
-- SELECT * is useful for a first preview, but analysts usually choose specific
-- columns for repeated work.
--
-- Required columns:
-- - order_id
-- - customer_id
-- - order_status
-- - order_purchase_timestamp
--
-- Required table:
-- - olist.orders_raw
--
-- Required row limit:
-- - 20 rows
--
-- Write your query below:



-- After running:
-- These columns are useful because: __________

-- ============================================================================
-- Practice 7: Count orders by status
-- ============================================================================
--
-- Business question:
-- What order statuses exist, and how common is each status?
--
-- Why:
-- Before filtering by status, analysts check the actual values in the data.
--
-- Required columns:
-- - order_status
-- - order_count
--
-- Required table:
-- - olist.orders_raw
--
-- Required logic:
-- - count rows
-- - group by order_status
-- - sort largest count first
--
-- Write your query below:



-- After running:
-- The largest status is: __________
-- The cancellation status is spelled: __________

-- ============================================================================
-- Practice 8: Filter delivered orders
-- ============================================================================
--
-- Business question:
-- Can I show only delivered orders?
--
-- Why:
-- WHERE is how analysts keep only rows that match a business condition.
--
-- Required columns:
-- - order_id
-- - customer_id
-- - order_status
-- - order_purchase_timestamp
--
-- Required table:
-- - olist.orders_raw
--
-- Required condition:
-- - order_status is delivered
--
-- Required row limit:
-- - 20 rows
--
-- Write your query below:



-- After running:
-- Every returned row has order_status = __________

-- ============================================================================
-- Practice 9: Sort newest orders first
-- ============================================================================
--
-- Business question:
-- What are the newest orders in the dataset?
--
-- Why:
-- Analysts sort by date to understand the time range of the dataset.
--
-- Required columns:
-- - order_id
-- - customer_id
-- - order_status
-- - order_purchase_timestamp
--
-- Required table:
-- - olist.orders_raw
--
-- Required sorting:
-- - newest order_purchase_timestamp first
--
-- Required row limit:
-- - 20 rows
--
-- Write your query below:



-- After running:
-- The newest order date I see is: __________

-- ============================================================================
-- Practice 10: Final first SELECT challenge
-- ============================================================================
--
-- Business request:
-- Show 20 canceled orders, newest first.
--
-- Required columns:
-- - order_id
-- - customer_id
-- - order_status
-- - order_purchase_timestamp
--
-- Required table:
-- - olist.orders_raw
--
-- Required conditions:
-- - only canceled orders
-- - newest first
-- - 20 rows only
--
-- Write your query below:



-- After running:
-- Did every row show canceled? __________
-- Did the newest date appear first? __________
-- Did the result show 20 rows? __________

-- ============================================================================
-- Explain Check
-- ============================================================================
--
-- Before moving to the next SQL lesson, explain these in your own words:
--
-- 1. What does SELECT do?
-- 2. What does FROM do?
-- 3. Why do analysts use LIMIT when previewing data?
-- 4. What does WHERE do?
-- 5. What does ORDER BY do?
-- 6. Why did we start with olist.orders_raw?
