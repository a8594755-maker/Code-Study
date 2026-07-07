# Week 1 Plan: Python Zero Foundation

Timeline: 2026-05-13 to 2026-05-19

Interview target: by 2026-08-31, build enough Python + SQL skill to explain beginner-to-intermediate data analyst projects in interviews.

Week 1 goal: become comfortable opening VS Code, running Python files, reading simple code, changing values, and explaining what each line does.

## Week 1 Success Standard

By the end of Week 1, you should be able to:

- Run a Python file from VS Code or Terminal.
- Create and change `variable`.
- Use `print()` to show results.
- Use basic math: `+`, `-`, `*`, `/`.
- Explain the difference between text and numbers.
- Build 4 small business calculators.
- Complete at least 2 calculators from a blank file without copying.
- Record at least 3 learning log entries.
- Record every real error in `error_log.md`.

## Daily Plan

Each lesson lives in its own folder under `week_01_basics/`, with files numbered in the order you do them: `1_example.py` (read) -> `2_practice.py` (fill in) -> `3_blank.py` (write from scratch).

| Day | Lesson | Business Problem | Python Concepts | Lesson Folder | Output |
| --- | --- | --- | --- | --- | --- |
| Day 1 | Inventory Cost Calculator | Calculate total inventory value | `print()`, variable, string, integer, multiplication | `day1_inventory_cost/` | example + practice + blank |
| Day 2 | Sales Revenue Calculator | Calculate sales revenue | variable, multiplication, readable output | `day2_sales_revenue/` | 1 working file + 1 variation |
| Day 3 | Profit Calculator | Calculate gross profit | subtraction, revenue, cost, profit | `day3_profit/` | 1 working file + mini quiz |
| Day 4 | Unit Cost Calculator | Calculate cost per unit | division, naming variables | `day4_unit_cost/` | 1 working file + 1 blank-page attempt |
| Day 5 | Review Day | Rebuild two calculators without looking | review variables and math | `day5_review/` | 2 blank-page solutions |
| Day 6 | Mini Project | Compare inventory value for two products | variables, math, print formatting | `day6_two_product/` | small business mini project |
| Day 7 | Weekly Review | Explain and clean files | review, logs, commit | no new code required | tracker updated |

## Day 1 Detailed Task

File:

```text
01_lessons/week_01_basics/day1_inventory_cost/1_example.py
```

Business problem:

```text
A company wants to calculate the total inventory value of one product.
```

Formula:

```text
total inventory value = unit cost * inventory quantity
```

Required variables:

```text
product_name
unit_cost
inventory_quantity
total_inventory_value
```

Practice variation:

```text
Product: Mouse
Unit Cost: 12
Inventory Quantity: 60
Expected Total Inventory Value: 720
```

Do not move to Day 2 until you can explain:

- What each variable stores.
- Why `"Mouse"` needs quotation marks.
- Why `12` and `60` do not need quotation marks.
- What `*` means in Python.
- What `print()` does.

## Week 1 Mini Quiz

Answer these without using AI to write the answer:

1. What is a `variable`?
2. Why does `"Laptop"` use quotation marks?
3. What does `unit_cost * inventory_quantity` do?
4. What happens if you type `unitcost` but your variable is named `unit_cost`?
5. Why is it useful to use clear variable names in business code?

## Suggested Git Commit Messages

```text
Add inventory cost calculator practice
Add sales revenue calculator practice
Add profit calculator practice
Add week 1 review calculators
Complete week 1 Python basics mini project
```
