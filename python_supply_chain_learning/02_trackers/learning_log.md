# Learning Log

Use this after each study session. Keep each entry short.

## Template

```text
Date:

Today I learned:

Business use case:

One thing I can do now:

One thing I still don't understand:

Next practice:
```

## Entries

### Date: 2026-05-13

Today I learned:

Business use case:

One thing I can do now:

One thing I still don't understand:

Next practice:

### Date: 2026-05-21

Today I learned: Reviewed Day 1 Inventory Cost Calculator. Rebuilt it from a blank
template (day1_inventory_cost/2_practice.py) for a new product (Mouse).

Business use case: Calculate the total inventory value of one product
(unit_cost * inventory_quantity) for stock-taking and procurement.

One thing I can do now: Create variables, multiply with *, and print labelled
results from a near-blank file without copying the original.

One thing I still don't understand: (to fill in)

Next practice: Day 2 Sales Revenue Calculator variation, then Day 3 Profit Calculator.

### Date: 2026-06-05

Today I learned: Started the pandas / Jupyter Notebook workflow for data analysis.
Learned that pandas handles table-like data, a notebook runs code cell by cell,
and a kernel is the Python environment used by the notebook.

Business use case: Read a real CSV dataset (`superstore.csv`) so it can be
explored like a business analyst would explore sales, profit, region, category,
and discount data.

One thing I can do now: Open a notebook, select a Python kernel, run a code cell
with `Shift + Enter`, check whether a CSV file path exists with
`data_file.exists()`, read a CSV with `pd.read_csv(data_file)`, and inspect the
data with `df.head()`, `df.shape`, and `df.columns.tolist()`.

One thing I still don't understand: How to comfortably create a valid blank
notebook from scratch in VS Code without depending on a prebuilt example.

Next practice: Create a fresh notebook manually, run `import pandas as pd`, read
`superstore.csv`, inspect the first rows, then write the first simple analysis:
group by `Category` and sum `Sales` and `Profit`.

Learning direction update: The learning method should now prioritize a real
analyst workflow in VS Code Notebook. The learner wants to create and operate
notebooks manually, with guidance on what to click/type and why. Reference files
can exist, but practice notebooks should not be auto-filled unless the learner
explicitly asks.

### Date: 2026-06-06

Today I learned: Checked the learning log dates and clarified that the
`2026-06-05` entry records the previous pandas / notebook setup session.

Business use case: Keep the learning tracker accurate so future practice starts
from the right place without mixing up dates or lesson state.

One thing I can do now: Identify that the current pandas learning track is in
`week_05_pandas/practice/`, while worked examples are in
`week_05_pandas/reference/`.

One thing I still don't understand: How to create a valid blank Jupyter Notebook
comfortably in VS Code without relying on a prebuilt file.

Next practice: Continue from the current analyst workflow: create/open the
practice notebook, select a kernel, import pandas, read `superstore.csv`, inspect
the data, then group by `Category` to sum `Sales` and `Profit`.

### Date: 2026-06-13

Today I learned: Set up an Olist PostgreSQL SQL practice workspace for VS Code.
The workspace now has raw table creation SQL, import validation SQL, first
SELECT practice, data quality checks, and starter business analysis queries.

Business use case: Practice ecommerce analyst SQL on orders, customers,
products, sellers, payments, reviews, and delivery performance.

One thing I can do now: Open saved `.sql` files in VS Code and use them as a
repeatable analyst workflow after connecting to the `olist_practice` database.

One thing I still don't understand: How to complete the full PostgreSQL
connection and CSV import workflow independently.

Next practice: Put the Olist CSV files in `03_data/raw/olist/`, import each CSV
into the matching `olist.*_raw` table with SQL CLI, then run
`02_after_import_validation.sql`.

### Date: 2026-06-13

Today I learned: Connected the local SQL CLI to the Supabase `Code practice`
project using the Supabase session pooler and SSL. Created the `olist` schema
and 9 raw Olist tables in Supabase.

Business use case: Use Supabase as the cloud PostgreSQL database for Olist
analyst SQL practice, while keeping query files saved in VS Code.

One thing I can do now: Connect to Supabase PostgreSQL with `psql`, run saved
SQL files with `\i`, and verify that cloud tables exist.

One thing I still don't understand: How to write the first analysis query
independently without copying the example.

Next practice: Run `03_first_select_practice.sql`, read the output, then write
one query that shows 20 canceled orders, newest first.

### Date: 2026-06-21

Today I learned: Updated the first Olist SQL practice so it explains the
analyst workflow behind each query: preview rows, identify useful columns,
filter by business status, sort by time, and then write one small query.

Business use case: Before answering business questions, an analyst first checks
what one row means, which columns matter, and whether status/date values look
usable.

One thing I can do now: Understand why the first SQL queries use `SELECT`,
`FROM`, `LIMIT`, `WHERE`, and `ORDER BY` instead of jumping directly into a
large analysis.

One thing I still don't understand: How to write the canceled-orders query
independently without copying the example.

Next practice: Run the four example queries in
`03_first_select_practice.sql`, then write the final practice query for 20
canceled orders, newest first.

### Date: 2026-06-21

Today I learned: Improved the first Olist SQL practice with a Step 0 data
inventory workflow. The lesson now explains how analysts discover schemas,
tables, row counts, and columns before choosing a starting table.

Business use case: When an analyst receives a new database, they first inspect
what data exists instead of guessing table names or jumping directly into
analysis.

One thing I can do now: Understand why the first table is `olist.orders_raw`:
it is the central order table and can connect to customers, order items,
payments, reviews, products, and sellers.

One thing I still don't understand: How to decide the starting table for a more
complex business question.

Next practice: Run Step 0A through Step 0D, then explain what `olist.orders_raw`
represents before running the later SELECT examples.

### Date: 2026-06-22

Today I learned: Expanded the first Olist SQL practice into a detailed analyst
workflow. Each step now explains the analyst question, why the step matters, the
SQL code to run, what to look for in the result, and what to write down.

Business use case: A new analyst should inventory the database before analysis:
confirm the connection, find schemas, list tables, count rows, inspect columns,
choose the starting table, preview rows, check statuses, filter records, and
sort by time.

One thing I can do now: Follow a structured first-look workflow instead of
guessing table names or running isolated SQL snippets.

One thing I still don't understand: How to connect this first-look process to a
full business analysis question.

Next practice: Run `03_first_select_practice.sql` one step at a time and fill in
the "Write down" prompts in personal notes before writing the final canceled
orders query.

### Date: 2026-07-01

Today I learned: The Olist setup SQL should not only create tables; it should
also explain what each setup step means. The setup file was updated with
beginner-friendly explanations and a SELECT-only practice area.

Business use case: Before analysts query business results, they need to
understand the database structure: schema, raw tables, important ID columns,
data types, and indexes.

One thing I can do now: Use the setup file as a readable map of what each Olist
table represents instead of treating it as a black-box script.

One thing I still don't understand: How to write the practice checks in the
Student Practice Area independently.

Next practice: In `01_create_schema_and_raw_tables.sql`, run the after-run
checks one at a time, then write the practice queries for `customers_raw`,
`order_items_raw`, `orders_raw`, and `order_items_raw` row counts.
