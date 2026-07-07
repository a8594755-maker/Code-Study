# Learning Memory

This file records stable learning preferences and direction changes.

## Current Learning Direction

Date first recorded: 2026-06-05
Date confirmed: 2026-06-06

The learning direction has changed from bottom-up Python basics only to a
top-down data analyst workflow.

## Preferred Learning Style

- Learn pandas through real data analysis, not isolated syntax drills.
- Start from the analyst workflow: create notebook, choose kernel, read CSV,
  inspect data, ask a business question, then write pandas code.
- Use VS Code Notebook / Jupyter Notebook for exploration.
- Use `.py` scripts as reference or finished examples, not the first learning
  surface.
- Keep `reference/` files as answer examples.
- Keep `practice/` files as the learner's own workspace.
- Do not fill the learner's notebook automatically unless explicitly asked.
- When teaching, explain the human reasoning first, then the code.
- Prefer one small step at a time: run a cell, observe output, explain what
  happened, then continue.

## Current pandas Status

The learner has practiced:

- selecting a Python kernel
- running a notebook cell with `Shift + Enter`
- importing pandas with `import pandas as pd`
- using `Path` to point to a CSV file
- checking a file path with `data_file.exists()`
- reading a CSV with `pd.read_csv(data_file)`
- inspecting data with `df.head()`, `df.shape`, and `df.columns.tolist()`

Next step:

Create a fresh notebook manually and run the first simple analysis:

```python
df.groupby("Category")[["Sales", "Profit"]].sum()
```
