# HANDOFF.md — Python and SQL Tutor State

## Purpose
This file gives Codex the current learning state before each tutoring session. `AGENTS.md` contains stable rules. This file contains state that should change over time.

## Student Snapshot
- Name: Weijin Hsu.
- Learning target: practical Python and SQL for Business Information Technology, Supply Chain, and Data Analyst work.
- Current level: zero foundation / beginner for both Python and SQL.
- Stronger background: Excel, business processes, supply chain operations, SAP/Oracle-style workflows, inventory and procurement logic.
- Preferred teaching language: Traditional Chinese for explanations; include English technical terms with Chinese meanings.
- Important teaching preference: show a complete practical example first, explain it, then ask the student to solve a variation.

## Current Tooling Plan
- Early quick practice: Google Colab.
- Main coding environment: VS Code.
- Data analysis practice: Jupyter Notebook / JupyterLab when pandas starts.
- Version control / portfolio evidence: GitHub.
- Progress tracking: the `02_trackers/` files (`progress_tracker.csv`, `learning_log.md`, `error_log.md`, `cheat_sheet.md`, `concept_tracker.md`) and this file.
- Resume reference: `04_reference/Weijin_Hsu_Resume.docx` is stored for career-context reference only. Do not copy personal resume details into logs unless the user explicitly asks.

## Repository Structure
The repo uses numbered top-level folders (reorganized 2026-05-21):

```text
python_supply_chain_learning/
├── 00_START_HERE.md           # human entry map (read this first)
├── AGENTS.md                  # tutor rules (kept at root to auto-load)
├── HANDOFF.md                 # live learning state (this file, kept at root)
├── 01_lessons/                # all coursework
│   ├── week_01_basics/
│   ├── week_02_decision_logic/
│   ├── week_03_loops_functions/
│   ├── week_04_csv_files/
│   ├── week_05_pandas/
│   ├── week_06_supply_chain_kpi/
│   ├── sql_practice/
│   └── final_project/
├── 02_trackers/               # progress_tracker.csv, learning_log.md,
│                              # error_log.md, cheat_sheet.md, concept_tracker.md
├── 03_data/                   # practice datasets
├── 04_reference/              # resume + source_packs/
└── 90_system/                 # README.md, lesson_index.md, requirements.txt
```

## Current Learning Status
- Learning system has been created.
- First available exercise: `01_lessons/week_01_basics/day1_inventory_cost/1_example.py`.
- The student should first run the existing file, then create a variation using a new product.
- SQL has been added as a second core goal. Treat SQL as zero-foundation learning and introduce it after initial Python basics unless the user asks to switch earlier.
- Resume file has been added as a private project reference: `04_reference/Weijin_Hsu_Resume.docx`.
- Interview readiness target: by 2026-08-31, the student should be able to discuss Python + SQL beginner/intermediate analyst projects in interviews.
- Week 1 has been replanned as zero-foundation Python basics. Detailed plan: `01_lessons/week_01_basics/week_01_plan.md`.
- Olist PostgreSQL practice workspace has been created at `01_lessons/sql_practice/olist_postgresql/` for VS Code SQL practice and Supabase SQL CLI import.

## Immediate Next Action
For the current SQL setup request, continue with Olist PostgreSQL setup.

Immediate Olist action:

1. Connect to Supabase with `psql`:
   `/Library/PostgreSQL/18/bin/psql "postgresql://postgres.ylmuvsdegmpoiygbtipi@aws-1-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require"`
2. Read `01_lessons/sql_practice/olist_postgresql/COURSE_OUTLINE.md`.
3. If reviewing setup, read `01_lessons/sql_practice/olist_postgresql/01_create_schema_and_raw_tables.sql` and use its Student Practice Area with SELECT-only checks.
4. Read examples in `01_lessons/sql_practice/olist_postgresql/03_first_select_practice.sql`.
5. For the first SQL practice only, use `01_lessons/sql_practice/olist_postgresql/03_student_first_select_workbench_zh_first_time.sql`.
6. Then write from memory in `01_lessons/sql_practice/olist_postgresql/03_student_first_select_workbench.sql`.
7. Practice task: write one query that shows 20 canceled orders, newest first.

General Python learning can still resume from Lesson 1 when requested.

Lesson name: Inventory Cost Calculator

Business problem: calculate total inventory value for a product.  
Python concepts: `print()`, `variable（變數）`, basic math, string/integer values.  
Suggested file: `01_lessons/week_01_basics/day1_inventory_cost/1_example.py`.

Recommended first practice:

```text
Product: Mouse
Unit Cost: 12
Inventory Quantity: 60
Expected Total Inventory Value: 720
```

Codex should ask the student to modify or create a file and run it. Do not immediately solve the practice unless the student asks or gets stuck after attempting.

## Learning Path Queue
1. Lesson 1 — Inventory Cost Calculator.
2. Lesson 2 — Sales Revenue Calculator.
3. Lesson 3 — Profit Calculator.
4. Lesson 4 — Unit Cost Calculator.
5. Lesson 5 — Week 1 Review from Blank Page.
6. Lesson 6 — Two-Product Inventory Mini Project.
7. Lesson 7 — Reorder Decision with `if / else`.
8. Lesson 8 — Multiple Products with `dictionary` and `for loop`.
9. Lesson 9 — Reusable Reorder Function.
10. Lesson 10 — Read Inventory CSV.
11. Lesson 11 — pandas Low-Stock Filter.
12. Lesson 12 — Supplier Spend Summary with `groupby`.
13. Lesson 13 — Forecast Error Analysis.
11. SQL Lesson 1 — `SELECT` inventory records from a simple table.
12. SQL Lesson 2 — filter and sort low-stock items with `WHERE` and `ORDER BY`.
13. SQL Lesson 3 — supplier spend summary with `GROUP BY`.
14. SQL Lesson 4 — purchase order and supplier analysis with `JOIN`.
15. Python + SQL Lesson — query SQLite from Python and analyze results with pandas.

## What Codex Must Record
After each meaningful study session, update:

### `02_trackers/progress_tracker.csv`
Record:
- Date
- Lesson
- Business Problem
- Python Concept
- Practice Done?
- Quiz Score
- Confidence
- Notes

### `02_trackers/learning_log.md`
Append:
- Today I learned
- Business use case
- One thing I can do now
- One thing I still do not understand
- Next practice

### `02_trackers/error_log.md`
Only append when the student hits an error or misconception. Include:
- Error message
- What the student tried to do
- Why it happened
- How it was fixed
- Rule learned

### `02_trackers/cheat_sheet.md`
Add only concepts the student has actually practiced.

### `HANDOFF.md`
Update:
- Current learning status
- Completed lesson
- Next recommended action
- Blockers or repeated mistakes
- Latest session update

## Current Blockers / Watch Items
- The student may rely too much on AI if full answers are given too early.
- Watch variable naming, indentation, and whether the student can explain code in plain language.
- Keep code beginner-friendly; avoid advanced syntax until needed.

## Latest Session Update
Date: 2026-05-13
- Created/organized a Python learning repo structure.
- Added Codex tutor rules through `AGENTS.md`.
- Added this `HANDOFF.md` so Codex can track learning state separately from stable rules.
- Next session should begin with Lesson 1 and update all trackers after the exercise.

Date: 2026-05-13
- User clarified the learning goal: start from zero foundation and learn both Python and SQL.
- Added resume file as a private reference document in `reference_documents/`.
- Added SQL practice folders and updated the learning path to include SQLite, SQL analytics, and Python + SQL integration.

Date: 2026-05-13
- User asked to replan Week 1 with an interview-readiness target by the end of August 2026.
- Added `week_01_basics/week_01_plan.md`.
- Week 1 should focus on running files, variables, print, simple math, business calculators, and blank-page review before moving forward.

Date: 2026-05-13
- Organized the project without moving core tutor/tracker files.
- Added `.gitignore`, folder README files, and Week 1 starter practice files.
- Week 1 practice files are now ready in `week_01_basics/`.

Date: 2026-05-13
- Student started `sales_revenue_calculator.py` and successfully ran Python from Terminal.
- Student hit `NameError` by typing `units_price` instead of `unit_price`.
- Error was recorded in `error_log.md`; reinforce exact variable naming before moving to the next lesson.

Date: 2026-05-13
- User pointed out that Codex should proactively record real practice errors.
- Updated `AGENTS.md` with an Active Error Recording Rule: when a traceback, wrong output, or misconception appears, Codex must update logs directly instead of asking the student to do it.

Date: 2026-05-13
- User requested that basic Python concepts be taught explicitly even inside simple exercises.
- Added `concept_tracker.md` and updated `AGENTS.md` with a Concept Teaching Rule.
- Current concepts introduced/practiced include `print()`, variables, strings, integers, assignment, multiplication, `NameError`, Terminal, `cd`, and `pwd`.

Date: 2026-05-21
- Reviewed Day 1 (Inventory Cost Calculator). Student rebuilt it from a blank template (now `01_lessons/week_01_basics/day1_inventory_cost/2_practice.py`) for product Mouse and got 720 correct. Recorded in trackers. Day 1 understanding gate (explain in own words) still pending; blank-page (`3_blank.py`, product Monitor -> 1200) not yet attempted.
- Added a "Per-Lesson Session Flow (Required)" section to `AGENTS.md`: review -> worked example (`1_example.py`) -> fill-in (`2_practice.py`) -> blank page (`3_blank.py`) -> run/verify -> feedback -> record -> understanding gate -> offer next step.
- Reorganized the repo into numbered top-level folders for human navigability: `00_START_HERE.md`, `01_lessons/`, `02_trackers/`, `03_data/`, `04_reference/`, `90_system/`. `AGENTS.md` and `HANDOFF.md` kept at root so they auto-load.
- One topic = one folder: each Week 1 lesson now lives in `01_lessons/week_01_basics/dayN_<topic>/` with numbered stage files. Day 1 has all three stages; Days 2-6 have `1_example.py` only (to be completed when taught).
- Added a Language Policy to `AGENTS.md`: file contents in English, chat explanations in Traditional Chinese. Converted the Day 1 practice/blank files and `00_START_HERE.md` from Chinese to English.
- IMPORTANT current run path, e.g.: `python3 01_lessons/week_01_basics/day1_inventory_cost/1_example.py`. Trackers live in `02_trackers/`.

Date: 2026-06-13
- Created Olist PostgreSQL practice workspace at `01_lessons/sql_practice/olist_postgresql/`.
- Added VS Code extension recommendation for `ms-ossdata.vscode-pgsql` and installed the extension in local VS Code.
- Added Olist raw, processed, and output data folders under `03_data/`.
- Added SQL files for connection check, raw table creation, post-import validation, first SELECT practice, data quality checks, and starter business analysis.
- Connected to local PostgreSQL 18 database `olist_practice` with user `postgres`.
- Ran `01_create_schema_and_raw_tables.sql` successfully and created 9 tables under schema `olist`.
- Confirmed `orders_raw`, `customers_raw`, and `order_items_raw` initially had 0 rows. This local workflow was superseded by the Supabase import below.

Date: 2026-06-13
- User switched from DBeaver/local PostgreSQL to Supabase for Olist practice.
- Logged into Supabase CLI with the new account and linked project `ylmuvsdegmpoiygbtipi` (`Code practice`, West US Oregon).
- Connected with `psql` through the Supabase session pooler:
  `postgresql://postgres.ylmuvsdegmpoiygbtipi@aws-1-us-west-2.pooler.supabase.com:5432/postgres?sslmode=require`.
- Ran `01_create_schema_and_raw_tables.sql` successfully in Supabase and created 9 tables under schema `olist`.
- Added `06_import_with_psql_template.sql` so CSV import can be done through SQL CLI instead of DBeaver.
- Copied Olist CSV files from `~/Downloads/archive/` into `03_data/raw/olist/`.
- Imported all 9 Olist CSV files into Supabase with `psql` and validated row counts:
  customers 99,441; geolocation 1,000,163; order_items 112,650; order_payments 103,886; order_reviews 99,224; orders 99,441; category translation 71; products 32,951; sellers 3,095.
- Next step is SQL practice with `03_first_select_practice.sql`.
- Do not store database passwords in files. The user should reset the Supabase database password because it was shared in chat.

Date: 2026-06-20
- User hit VS Code PostgreSQL extension connection error: Supabase pooler reported tenant/user `postgres.ylmuvsdegmpoiygbtipi` not found.
- Added a VS Code User settings connection profile named `Supabase Olist Practice` under `pgsql.connections` with the correct Supabase session pooler host, port, database, username, and SSL mode.
- No database password was written to VS Code settings or repository files.

Date: 2026-07-01
- Created `01_lessons/sql_practice/olist_postgresql/COURSE_OUTLINE.md`, an Olist SQL for Data Analytics course outline adapted from the referenced beginner-to-project SQL course structure.
- The Olist SQL path now follows: setup and connection, first database look, filtering and sorting, aggregation, joins, data quality, date and delivery analysis, revenue/product analysis, CTEs, and a mini portfolio project.
- Updated the Olist PostgreSQL README so `COURSE_OUTLINE.md` appears in the folder map and setup workflow.
- Next action: read the course outline, then continue Chapter 1 in `03_first_select_practice.sql`.

Date: 2026-07-01
- Reworked `01_lessons/sql_practice/olist_postgresql/01_create_schema_and_raw_tables.sql` from a plain setup script into a beginner-friendly setup lesson.
- Added explanations for schema creation, raw tables, common SQL data types, the business meaning of each Olist table, indexes, after-run checks, and a SELECT-only Student Practice Area.
- Next action if the student is in this file: do not run the whole setup unless rebuilding; instead run the after-run checks one at a time and try the Student Practice Area.

Date: 2026-07-01
- Student noticed that reading the example SQL was not enough practice and asked how to learn code effectively.
- Added `01_lessons/sql_practice/olist_postgresql/03_student_first_select_workbench.sql`, a blank student workbench for writing the first Olist SELECT queries from memory.
- Updated the Olist README and immediate next action: use `03_first_select_practice.sql` as the teacher example, then use `03_student_first_select_workbench.sql` as the actual writing practice file.

Date: 2026-07-01
- Refined `03_student_first_select_workbench.sql`: confirmed the saved file was not duplicated, added the Day 1/Day 2/Day 3 suggested practice pace, and added `AS`, `AND`, `NOT LIKE`, and `<>` to the allowed SQL keyword list.
- Next practice remains: student should complete Practice 1 to Practice 3 from memory, run each query, and report the result for review.

Date: 2026-07-01
- User requested a Chinese version for the first SQL practice because they are starting from zero foundation.
- Added `01_lessons/sql_practice/olist_postgresql/03_student_first_select_workbench_zh_first_time.sql`, a Chinese first-time guide for Practice 1 to Practice 3 with answers, line-by-line explanations, basic SQL concepts, and result prompts.
- This is a first-time learning aid. After Practice 1 to Practice 3, return to the English workbench for repeated practice and portfolio-ready files.
- User should reload VS Code, select `Supabase Olist Practice`, enter the reset Supabase database password only in the password prompt, then run `03_first_select_practice.sql`.

Date: 2026-06-21
- User asked why the first Olist SQL practice starts with these queries and what an analyst does first after receiving data.
- Rewrote `03_first_select_practice.sql` as an analyst first-look workflow with business reasons for previewing rows, choosing columns, filtering statuses, sorting dates, and limiting output.
- Updated SQL concepts in `concept_tracker.md` from Not Started to Introduced for table, row, column, SELECT, FROM, LIMIT, WHERE, and ORDER BY.
- Next action: user should run the four example queries, then write the final practice query for 20 canceled orders, newest first.

Date: 2026-06-21
- User asked how they are supposed to know what data exists and why the lesson starts from `olist.orders_raw`.
- Added Step 0 to `03_first_select_practice.sql`: inspect schemas, list tables in `olist`, check row counts, inspect columns in `orders_raw`, then explain why `orders_raw` is the central starting table.
- Added SQL concepts for schema, `information_schema`, and row count to `concept_tracker.md`.
- Next action: user should run Step 0A-0D first, then explain in their own words why `orders_raw` is the first table.

Date: 2026-06-22
- User wanted the first SQL practice to explicitly show the analyst's first step, next step, what data to inspect, and what SQL code to run.
- Rewrote `03_first_select_practice.sql` into an 11-step analyst first-look workflow. Each step includes: Analyst question, Why, Code, What to look for, and Write down prompt.
- Final practice still requires the user to write the canceled-orders query independently.
- Next action: user should run each step in order and fill in the "Write down" prompts before attempting Step 11.
