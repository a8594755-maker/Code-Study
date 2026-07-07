# Olist SQL for Data Analytics Course Outline

This outline adapts the learning structure of a beginner-to-project SQL course
to the Olist ecommerce dataset in Supabase PostgreSQL.

The goal is not to memorize SQL syntax. The goal is to learn the analyst
workflow:

1. Understand the business problem.
2. Inspect the database.
3. Identify the right table.
4. Preview rows and columns.
5. Write a small query.
6. Read the result.
7. Improve the query.
8. Save the analysis as portfolio evidence.

## Course Rule

For this Olist practice, start with read-only SQL.

Use:

```sql
SELECT
FROM
WHERE
GROUP BY
HAVING
ORDER BY
LIMIT
JOIN
WITH
```

Do not use these yet in the Supabase practice database:

```sql
UPDATE
DELETE
DROP
TRUNCATE
```

## Dataset Context

Business context:

Olist is an ecommerce marketplace dataset. The data can answer questions about
orders, customers, products, sellers, payments, reviews, and delivery
performance.

Main raw tables:

| Table | Analyst Role |
| --- | --- |
| `olist.orders_raw` | Main order timeline and order status table |
| `olist.customers_raw` | Customer location and customer identifier table |
| `olist.order_items_raw` | Product, seller, price, and freight line-item table |
| `olist.order_payments_raw` | Payment method and payment value table |
| `olist.order_reviews_raw` | Customer review score and review timing table |
| `olist.products_raw` | Product attributes and product category table |
| `olist.product_category_translation_raw` | Product category translation lookup table |
| `olist.sellers_raw` | Seller location table |
| `olist.geolocation_raw` | Zip-code-level location reference table |

Recommended starting table:

```text
olist.orders_raw
```

Why:

Most ecommerce analysis starts with the order. Orders connect customers,
products, sellers, payments, reviews, and delivery events.

## Chapter 0: Setup and Connection

Purpose:

Confirm that VS Code, SQL CLI, Supabase, and the Olist tables are ready.

Files:

- `00_connection_check.sql`
- `01_create_schema_and_raw_tables.sql`
- `02_after_import_validation.sql`
- `06_import_with_psql_template.sql`

Concepts:

- PostgreSQL
- Supabase
- database connection
- schema
- raw table
- row count

Analyst questions:

- Am I connected to the correct database?
- Do the expected Olist tables exist?
- Did the CSV import finish correctly?
- Do the row counts match the expected row counts?

Practice outcome:

The student can confirm that the database is ready before writing analysis SQL.

Understanding gate:

Explain why a connection check and row-count validation come before analysis.

## Chapter 1: First Look at a New Database

Purpose:

Learn what an analyst does before answering a business question.

Main file:

- `03_first_select_practice.sql`

Concepts:

- `information_schema`
- schema discovery
- table discovery
- column discovery
- `SELECT`
- `FROM`
- `LIMIT`
- `COUNT(*)`

Analyst questions:

- What schemas exist?
- What Olist tables exist?
- How many rows does each table have?
- What columns does `orders_raw` contain?
- What does one order row represent?

Core queries:

```sql
SELECT
    table_schema,
    table_name
FROM information_schema.tables
WHERE table_schema = 'olist'
ORDER BY table_name;
```

```sql
SELECT *
FROM olist.orders_raw
LIMIT 10;
```

Practice task:

Show 20 canceled orders, newest first.

Understanding gate:

Explain why `orders_raw` is the first table instead of `products_raw`.

## Chapter 2: Filtering and Sorting Orders

Purpose:

Practice turning a broad table into a focused result.

New concepts:

- `WHERE`
- comparison operators
- text filters
- date filters
- `ORDER BY`
- `ASC`
- `DESC`
- `LIMIT`

Business questions:

- Which orders were delivered?
- Which orders were canceled?
- What are the newest orders?
- What are the oldest orders?
- What orders were purchased in a specific month?

Practice tasks:

1. Show delivered orders only.
2. Show canceled orders only.
3. Show the 20 newest orders.
4. Show orders purchased in January 2018.
5. Show delivered orders purchased in January 2018, newest first.

Understanding gate:

Explain the difference between filtering rows with `WHERE` and sorting rows
with `ORDER BY`.

## Chapter 3: Aggregation for Business Summaries

Purpose:

Move from looking at rows to answering summary questions.

New concepts:

- `COUNT(*)`
- `COUNT(DISTINCT ...)`
- `SUM()`
- `AVG()`
- `MIN()`
- `MAX()`
- `GROUP BY`
- `HAVING`
- column aliases

Business questions:

- How many orders exist by status?
- How many orders happen each month?
- Which states have the most customers?
- What is the average review score?
- Which payment methods are most common?

Practice tasks:

1. Count orders by `order_status`.
2. Count orders by purchase month.
3. Count customers by state.
4. Calculate average review score.
5. Show payment methods with more than 1,000 payment records.

Understanding gate:

Explain why `GROUP BY` is needed when one result row represents one category.

## Chapter 4: Joining Ecommerce Tables

Purpose:

Learn how one business question often needs more than one table.

New concepts:

- primary key
- foreign key
- `JOIN`
- `LEFT JOIN`
- table alias
- one-to-one relationship
- one-to-many relationship
- many-to-one lookup table

Business questions:

- Which customer state does each order belong to?
- What products were included in each order?
- Which sellers sold the most items?
- Which product categories generated the most sales?
- Which orders have reviews?

Core join map:

| From | Join To | Join Key |
| --- | --- | --- |
| `orders_raw` | `customers_raw` | `customer_id` |
| `orders_raw` | `order_items_raw` | `order_id` |
| `order_items_raw` | `products_raw` | `product_id` |
| `products_raw` | `product_category_translation_raw` | `product_category_name` |
| `order_items_raw` | `sellers_raw` | `seller_id` |
| `orders_raw` | `order_payments_raw` | `order_id` |
| `orders_raw` | `order_reviews_raw` | `order_id` |

Practice tasks:

1. Join orders to customers and show customer state.
2. Join orders to order items and show item price.
3. Join order items to products and show product category.
4. Join product categories to the translation table.
5. Compare `JOIN` and `LEFT JOIN` result counts.

Understanding gate:

Explain why `order_items_raw` has more rows than `orders_raw`.

## Chapter 5: Data Quality Checks

Purpose:

Learn how analysts check whether data is trustworthy before making conclusions.

Main file:

- `04_data_quality_checks.sql`

New concepts:

- missing values
- duplicate checks
- unmatched joins
- business rule checks
- late delivery flag

Business questions:

- Are any purchase timestamps missing?
- Are there duplicate customer IDs?
- Do all order items match an order?
- Do all order items match a product?
- How many delivered orders arrived late?

Practice tasks:

1. Count missing purchase timestamps.
2. Check duplicate customer IDs.
3. Check order items without a matching order.
4. Check order items without a matching product.
5. Count late delivered orders.

Understanding gate:

Explain why data quality checks should happen before dashboard or KPI work.

## Chapter 6: Date and Delivery Analysis

Purpose:

Analyze ecommerce operations with time-based SQL.

New concepts:

- timestamp
- `DATE_TRUNC`
- date difference
- `EXTRACT(EPOCH FROM ...)`
- `CASE WHEN`
- delivery lead time
- late delivery rate

Business questions:

- How many orders happen each month?
- How many days does delivery take?
- Which states have the slowest deliveries?
- Which states have the highest late-delivery rate?
- Did order volume change over time?

Practice tasks:

1. Count delivered orders by month.
2. Calculate delivery days for each delivered order.
3. Calculate average delivery days by customer state.
4. Create a late-delivery flag with `CASE WHEN`.
5. Calculate late-delivery rate by state.

Understanding gate:

Explain why delivery analysis should filter to `order_status = 'delivered'`.

## Chapter 7: Revenue and Product Analysis

Purpose:

Use SQL to answer ecommerce sales questions.

Main file:

- `05_business_analysis_starter.sql`

New concepts:

- gross merchandise value
- freight value
- distinct order count
- item count
- category sales
- ranking with `ORDER BY`

Business questions:

- What is monthly gross merchandise value?
- Which product categories generate the most sales?
- Which product categories have the most items sold?
- Which sellers generate the most revenue?
- Which states generate the most order volume?

Practice tasks:

1. Calculate monthly gross merchandise value.
2. Show top 20 categories by sales.
3. Show top 10 categories by item count.
4. Show top 20 sellers by revenue.
5. Show sales by customer state.

Understanding gate:

Explain the difference between order count, item count, and sales value.

## Chapter 8: Subqueries and CTEs

Purpose:

Learn how to break complex analysis into readable steps.

New concepts:

- subquery
- `WITH` common table expression
- temporary result set
- query readability
- step-by-step debugging

Business questions:

- What are the top categories among delivered orders only?
- Which sellers have both high sales and high item count?
- Which states have high order volume and high late-delivery rate?
- Which product categories have above-average review scores?

Practice tasks:

1. Create a CTE for delivered orders.
2. Create a CTE for category sales.
3. Filter category sales to the top 20 categories.
4. Combine delivery and revenue metrics by state.
5. Rewrite one long query into two CTEs.

Understanding gate:

Explain why a CTE can make a complex query easier to understand.

## Chapter 9: Analyst Mini Project

Purpose:

Build a small portfolio-style SQL project from the Olist dataset.

Project title:

```text
Olist Ecommerce Delivery and Sales Analysis
```

Recommended business questions:

1. What is the overall order status distribution?
2. How did monthly order volume and sales change over time?
3. Which product categories generated the most sales?
4. Which customer states had the highest late-delivery rate?
5. Which sellers generated the most revenue?
6. What business recommendation can be made from the results?

Project files:

```text
01_project_context.sql
02_order_status_analysis.sql
03_monthly_sales_analysis.sql
04_category_sales_analysis.sql
05_delivery_performance_analysis.sql
06_seller_revenue_analysis.sql
README.md
```

Portfolio deliverables:

- saved SQL files
- short README
- business question for each query
- result summary for each query
- one final recommendation

Understanding gate:

Explain the business story from the SQL results without reading the SQL line by
line.

## Recommended Learning Order

Do not rush to joins before the first SELECT workflow feels comfortable.

1. Finish Chapter 1 in `03_first_select_practice.sql`.
2. Write the canceled-orders practice query independently.
3. Practice filtering and sorting with 5 small order queries.
4. Practice aggregation with order status, month, state, and payment method.
5. Learn joins with orders, customers, items, products, and sellers.
6. Run and understand `04_data_quality_checks.sql`.
7. Run and understand `05_business_analysis_starter.sql`.
8. Build the mini project.

## Study Method

For every lesson:

1. Read the business question.
2. Predict which table is needed.
3. Run a small preview query.
4. Choose only the needed columns.
5. Add one SQL concept at a time.
6. Read the result.
7. Write down what the result means in business words.
8. Save the final query.

Do not copy a finished answer before trying the query. The target skill is
independent SQL thinking, not recognizing a completed query.

