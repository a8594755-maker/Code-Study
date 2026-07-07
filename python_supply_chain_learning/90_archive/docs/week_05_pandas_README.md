# Week 05: pandas

Use this folder for learning pandas with real CSV data.

## Folder Map

- `practice/`: your own notebooks. Start here when practicing.
- `reference/`: worked examples and answer-style files. Read these when stuck.

## Learning Method

The current learning style is top-down:

1. Work like an analyst in a notebook.
2. Run one cell at a time.
3. Look at the output before learning more syntax.
4. Explain the human reasoning first, then the pandas code.
5. Keep practice notebooks as the learner's own work. Do not auto-fill them
   unless explicitly requested.

## Data

The CSV file for this week is stored outside the lesson folder:

```text
python_supply_chain_learning/03_data/superstore.csv
```

## Current Next Step

Open:

```text
practice/pandas_practice.ipynb
```

Then practice:

1. Select a Python kernel.
2. Run `import pandas as pd`.
3. Read `superstore.csv`.
4. Inspect with `df.head()`, `df.shape`, and `df.columns.tolist()`.
5. Group by `Category` and sum `Sales` and `Profit`.
