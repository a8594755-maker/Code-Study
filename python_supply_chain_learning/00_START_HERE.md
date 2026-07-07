# 00 — Start Here

> This is the map of the whole project. Read it first each session, then go to your current task.

This is a zero-foundation **Python + SQL self-study system** for business / supply chain analytics.
Goal: by **2026-08-31**, be able to discuss beginner-to-intermediate data analyst projects in interviews.

> Note: file contents are written in **English** (professional, interview-ready). Your tutor explains in **Traditional Chinese** in chat.

---

## Folder Map

| Folder / File | What is inside | What you do here |
| --- | --- | --- |
| `00_START_HERE.md` | This entry map | Read it before each session |
| `AGENTS.md` | The AI tutor's teaching rules | When you want to know how the tutor works |
| `HANDOFF.md` | **Where you are now + the next step** | When you ask "what should I do now?" |
| `01_lessons/` | All coursework (week_01…06, SQL, final project) | **Write code and do practice** |
| `02_trackers/` | Progress + notes (tracker, logs, cheat sheet) | Record what you learned and what went wrong |
| `03_data/` | Practice datasets | Used later in the pandas stage |
| `04_reference/` | Resume + original setup packs | Reference only; you rarely touch this |
| `90_system/` | README, full lesson index, requirements | Full project docs and lesson checklist |

---

## How each lesson is organized

Each topic is one folder, and the files are numbered in the order you do them:

```text
01_lessons/week_01_basics/day1_inventory_cost/
├── 1_example.py    <- read first (complete worked example)
├── 2_practice.py   <- then fill in the blanks
└── 3_blank.py      <- finally write it from scratch, no hints
```

---

## Daily Flow

1. **Check your progress** -> open [HANDOFF.md](HANDOFF.md), find "Immediate Next Action".
2. **Go to the current lesson** -> e.g. week 1 day 1 is [01_lessons/week_01_basics/day1_inventory_cost/](01_lessons/week_01_basics/day1_inventory_cost/).
3. **Run a file** (run all commands from the repo root `python_supply_chain_learning/`):
   ```bash
   python3 01_lessons/week_01_basics/day1_inventory_cost/1_example.py
   ```
4. **Practice**: fill in `2_practice.py`, then write `3_blank.py` from scratch.
5. **Record**: write what you learned in [02_trackers/learning_log.md](02_trackers/learning_log.md); update progress in [02_trackers/progress_tracker.csv](02_trackers/progress_tracker.csv).
6. **On errors**: the error message goes into [02_trackers/error_log.md](02_trackers/error_log.md) (the tutor records it for you).

---

## Quick Find

- **"What should I learn now?"** -> [HANDOFF.md](HANDOFF.md)
- **"Where is the full lesson list?"** -> [90_system/lesson_index.md](90_system/lesson_index.md)
- **"This week's detailed plan?"** -> [01_lessons/week_01_basics/week_01_plan.md](01_lessons/week_01_basics/week_01_plan.md)
- **"Which concepts have I practiced?"** -> [02_trackers/concept_tracker.md](02_trackers/concept_tracker.md)
- **"Quick syntax cheat sheet?"** -> [02_trackers/cheat_sheet.md](02_trackers/cheat_sheet.md)
- **"Full project overview?"** -> [90_system/README.md](90_system/README.md)

---

## Key Rules

- Run commands from the **repo root**, using the full path that starts with `01_lessons/`.
- Learning logs and progress files live in `02_trackers/` — do not move them.
- Keep `AGENTS.md` and `HANDOFF.md` at the root so the AI tutor auto-loads them.
- All file contents are in English; chat explanations are in Traditional Chinese.
