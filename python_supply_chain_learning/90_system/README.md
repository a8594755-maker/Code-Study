# Python and SQL Supply Chain Learning

This repo is a zero-foundation Python and SQL learning system focused on business and supply chain analytics.

## Tool Stack

| Stage | Tool | Purpose |
| --- | --- | --- |
| Week 1-2 | Google Colab | Fast Python basics practice |
| Week 2+ | VS Code | Write Python files like real projects |
| Week 4+ | GitHub | Save code and learning evidence |
| Week 5+ | JupyterLab / Notebook | pandas and data analysis |
| Week 7+ | SQLite / SQL files | SQL queries for analyst work |
| All weeks | Google Sheets / Notion | Track learning progress |

## Daily Workflow

| Time | Task |
| ---: | --- |
| 10 min | Review yesterday's code |
| 20 min | Study one practical example |
| 20 min | Type the example yourself |
| 20 min | Complete a variation problem |
| 10 min | Update Learning Log and Error Log |
| 5 min | Make a Git commit |

## Project Structure

```text
python_supply_chain_learning/
├── 00_START_HERE.md           # human entry map — read this first
├── AGENTS.md                  # tutor rules (kept at root to auto-load)
├── HANDOFF.md                 # current learning state (kept at root)
├── 01_lessons/                # all coursework
│   ├── week_01_basics/        # first Python exercises
│   ├── week_02_decision_logic/
│   ├── week_03_loops_functions/
│   ├── week_04_csv_files/
│   ├── week_05_pandas/
│   ├── week_06_supply_chain_kpi/
│   ├── sql_practice/          # SQL lessons
│   └── final_project/
├── 02_trackers/               # progress + notes
│   ├── progress_tracker.csv   # Google Sheets style progress tracker
│   ├── learning_log.md        # daily learning notes
│   ├── error_log.md           # mistakes and fixes
│   ├── cheat_sheet.md         # concepts actually practiced
│   └── concept_tracker.md     # concept-by-concept mastery tracker
├── 03_data/                   # raw, processed, and output data
├── 04_reference/              # private career docs + source_packs/
└── 90_system/                 # README.md, lesson_index.md, requirements.txt
```

## Weekly KPI

| KPI | Target |
| --- | ---: |
| Practice days per week | 5 days |
| Small exercises per week | 8-12 |
| GitHub commits per week | 3-5 |
| Error Log entries per week | At least 5 |
| Blank-page exercises per week | At least 2 |
| Mini project every 2 weeks | 1 |

## Learning Method

Business problem -> Python concept -> Full example -> Practice -> Variation -> Mini quiz -> Log -> Commit

Every new concept should also be tracked:

```text
Concept -> meaning -> tiny example -> business example -> mistake to avoid -> mastery status
```

For SQL lessons:

Business problem -> table structure -> SQL concept -> full query -> practice query -> variation query -> log -> commit

## First Lesson

```text
Lesson 1: Inventory Cost Calculator
Business Problem: Calculate total inventory value
Python Concepts: variable, math, print
Software: Google Colab or VS Code
Estimated Time: 45 minutes
Practice File Name: 01_lessons/week_01_basics/day1_inventory_cost/1_example.py
Tracker Entry: Week 1 / Lesson 1 / Variables
GitHub Commit Message: Add inventory cost calculator practice
```

## SQL Track

SQL starts after the first Python basics unless you choose to switch earlier.

```text
SQL Lesson 1: Select Inventory Records
Business Problem: View inventory data from a table
SQL Concepts: table, row, column, SELECT, FROM
Software: VS Code with SQLite
Practice File Name: 01_lessons/sql_practice/week_01_sql_basics/select_inventory.sql
GitHub Commit Message: Add first SQL inventory query practice
```
