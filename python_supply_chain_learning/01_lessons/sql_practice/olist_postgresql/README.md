# Olist PostgreSQL Practice

This folder is your analyst-style SQL practice space for the Olist ecommerce dataset.

Use the tools this way:

| Tool | Use |
| --- | --- |
| Supabase Dashboard | Inspect tables and import small CSV files |
| SQL CLI / `psql` | Connect to Supabase and run saved SQL files |
| VS Code | Write, save, and rerun SQL practice files |

## VS Code Extension

Recommended extension:

```text
PostgreSQL by Microsoft
Extension ID: ms-ossdata.vscode-pgsql
```

Open the Extensions view in VS Code and search:

```text
PostgreSQL
```

After installing it, open the PostgreSQL panel and add a connection.

## Connection Settings

Current cloud database:

```text
Provider: Supabase
Project name: Code practice
Project ref: ylmuvsdegmpoiygbtipi
Connection method: Session pooler
```

Use these values in VS Code PostgreSQL or `psql`:

```text
Host / Server: aws-1-us-west-2.pooler.supabase.com
Port: 5432
Database: postgres
Username: postgres.ylmuvsdegmpoiygbtipi
SSL mode: require
Connection name: Supabase Olist Practice
```

Do not save your password inside this repository.

## Folder Map

```text
01_lessons/sql_practice/olist_postgresql/
|-- README.md
|-- COURSE_OUTLINE.md
|-- 00_connection_check.sql
|-- 01_create_schema_and_raw_tables.sql
|-- 02_after_import_validation.sql
|-- 03_first_select_practice.sql
|-- 03_student_first_select_workbench.sql
|-- 03_student_first_select_workbench_zh_first_time.sql
|-- 04_data_quality_checks.sql
|-- 05_business_analysis_starter.sql
`-- 06_import_with_psql_template.sql
```

Data files should live here:

```text
03_data/raw/olist/
```

## Setup Workflow

1. Connect to Supabase with SQL CLI / `psql`.
2. Run `00_connection_check.sql`.
3. Run `01_create_schema_and_raw_tables.sql`.
4. Put the Olist CSV files in `03_data/raw/olist/`.
5. Run `06_import_with_psql_template.sql` from the repo root.
6. Run `02_after_import_validation.sql`.
7. Read `COURSE_OUTLINE.md`.
8. Read and run examples in `03_first_select_practice.sql`.
9. For the first time only, use `03_student_first_select_workbench_zh_first_time.sql`.
10. Then write your own queries in `03_student_first_select_workbench.sql`.

Current status:

```text
Connected to Supabase project: Code practice
Created schema: olist
Created raw tables: 9
Imported rows: complete
```

Imported row counts:

| Table | Rows |
| --- | ---: |
| `olist.customers_raw` | 99,441 |
| `olist.geolocation_raw` | 1,000,163 |
| `olist.order_items_raw` | 112,650 |
| `olist.order_payments_raw` | 103,886 |
| `olist.order_reviews_raw` | 99,224 |
| `olist.orders_raw` | 99,441 |
| `olist.product_category_translation_raw` | 71 |
| `olist.products_raw` | 32,951 |
| `olist.sellers_raw` | 3,095 |

When importing with Supabase Dashboard or SQL CLI:

- Use the first CSV row as column headers.
- Map each CSV to the matching table listed below.
- Treat empty strings as `NULL`, especially for timestamp columns.
- Do not create new table names during import; import into the existing `olist.*_raw` tables.

## CSV to Table Map

| CSV file | PostgreSQL table |
| --- | --- |
| `olist_customers_dataset.csv` | `olist.customers_raw` |
| `olist_geolocation_dataset.csv` | `olist.geolocation_raw` |
| `olist_order_items_dataset.csv` | `olist.order_items_raw` |
| `olist_order_payments_dataset.csv` | `olist.order_payments_raw` |
| `olist_order_reviews_dataset.csv` | `olist.order_reviews_raw` |
| `olist_orders_dataset.csv` | `olist.orders_raw` |
| `olist_products_dataset.csv` | `olist.products_raw` |
| `olist_sellers_dataset.csv` | `olist.sellers_raw` |
| `product_category_name_translation.csv` | `olist.product_category_translation_raw` |

## How to Run SQL in VS Code

Open a `.sql` file, select the query you want to run, then press:

```text
Cmd + Shift + E
```

Results should appear in the Results panel.

## How to Connect with psql

Run this from the repo root:

```bash
/Library/PostgreSQL/18/bin/psql "postgresql://postgres.ylmuvsdegmpoiygbtipi@aws-1-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require"
```

When prompted, type the Supabase database password.

After connecting, run a saved SQL file like this:

```text
\i 01_lessons/sql_practice/olist_postgresql/02_after_import_validation.sql
```

## First Goal

The data is imported. First read the example:

```sql
SELECT *
FROM olist.orders_raw
LIMIT 10;
```

If you see 10 rows, your Supabase Olist practice setup is ready.

Then use `03_student_first_select_workbench.sql` to write the same kind of
queries from memory.
