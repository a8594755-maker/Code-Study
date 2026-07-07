# 這裡是歷史，不是待辦

本資料夾封存 2026-07 大整理之前的所有舊課程、舊追蹤檔與舊文件。**唯讀**：永不改寫、永不刪除、也永遠不需要「補完」。要引用內容，複製出去用。（唯一例外：家教季末可把 PROGRESS.md 的過舊日誌**新增**到 `trackers/` 的延續檔 — 只增不改。）

## 封存索引

| 檔案／資料夾 | 原路徑 | 封存原因 | 內含哪些真實學習紀錄 |
|---|---|---|---|
| `python_week01/`（整包） | `01_lessons/week_01_basics/` | 獨立 Python 週課已廢止，Python 基礎改融入 02_pandas 分析線 | ★ `day1_inventory_cost/2_practice.py`、`day2_sales_revenue/1_example.py` 是你親手寫的程式；`day1_inventory_cost/3_blank.py` 從未作答（之後會當複習題重新出） |
| `pandas_dupes/start_here_read_csv_reference.ipynb` | `01_lessons/week_05_pandas/reference/` | 是兩本存活 notebook 的子集，且 read_csv 階段你已完成 | 無（家教教材） |
| `pandas_dupes/complete_pandas_analysis.py` | `01_lessons/week_05_pandas/reference/` | 抽象度跳級、欄名與路徑跟課程不相容；專案週可復活當進階風格參考 | 無（家教教材） |
| `sql_v1/olist_postgresql_README.md` | `01_lessons/sql_practice/olist_postgresql/README.md` | 一檔混三種讀者；內容已拆入 `01_sql/README.md` 與 `01_sql/setup_one_time/README.md` | 無 |
| `sql_v1/COURSE_OUTLINE.md` | `01_lessons/sql_practice/olist_postgresql/COURSE_OUTLINE.md` | 10 章課綱已壓成 8 章併入 `01_sql/README.md` 課程計畫 | 無 |
| `sql_v1/03_first_select_practice.sql` | `01_lessons/sql_practice/olist_postgresql/` | 教學內容已改寫為 `ch01/1_lesson.sql`；原檔過長且與 workbench 大量重複 | 無（無學生作答） |
| `sql_v1/03_student_first_select_workbench.sql` | `01_lessons/sql_practice/olist_postgresql/` | 已驗證所有空白皆未填；「答案→漸淡→空白」設計改寫為 ch01 的 `2_practice` 與 `3_challenge` | 無（這是英文空白版；你填過答案的中文版沒被封存，見下方） |
| `trackers/concept_tracker.md` | `02_trackers/concept_tracker.md` | 40 列已**原樣**併入 `PROGRESS.md` 概念表 | ★ 你 2026-05~07 的概念精熟紀錄（40 列） |
| `trackers/learning_log.md` | `02_trackers/learning_log.md` | 9 筆條目已**原文**併入 `PROGRESS.md` 學習日誌歷史區 | ★ 9 筆真實學習日誌（含 2026-06-05 學習轉向前後） |
| `trackers/error_log.md` | `02_trackers/error_log.md` | 4 筆條目已**原文**併入 `PROGRESS.md` 錯誤日誌歷史區 | ★ 4 筆真實除錯紀錄（每筆含你學到的規則） |
| `trackers/progress_tracker.csv` | `02_trackers/progress_tracker.csv` | 6 列已轉為表格併入 `PROGRESS.md` 歷史附錄 | ★ 6 列 session（上課）紀錄（2026-05-13~06-13） |
| `trackers/learning_memory.md` | `02_trackers/learning_memory.md` | 9 條教學偏好與轉向紀錄已移入 `AGENTS.md` §1；其餘快照過期 | 含 2026-06-05 學習轉向的原始紀錄 |
| `trackers/cheat_sheet.md` | `02_trackers/cheat_sheet.md` | 2026-05-14 即停更；職能由 PROGRESS.md 概念表承接 | 幾乎無（僅最初兩天） |
| `trackers/HANDOFF.md` | 根目錄 `HANDOFF.md` | 一檔混了設定＋狀態＋歷史；「目前狀態」職能改住 `PROGRESS.md` 頂部 | ★ 2026-05-13~07-01 全部按日期的 session 紀錄（268 行） |
| `trackers/lesson_index.md` | `90_system/lesson_index.md` | 勾選框全空＝對進度撒謊的快照；勾選框式追蹤全面廢止 | 無 |
| `docs/00_START_HERE.md` | 根目錄 `00_START_HERE.md` | 「單一入口」的好結構已濃縮進新 `README.md`；內容過期（不提 Olist／Supabase） | 無 |
| `docs/AGENTS_v1.md` | 根目錄 `AGENTS.md` | 舊時代版本（SQLite 假設已不成立）；教學法規則已全數保留進新 `AGENTS.md` | 無 |
| `docs/90_system_README.md` | `90_system/README.md` | 第二份總覽文件是「亂」的主因之一；工具表過期（Colab／SQLite／Notion） | 無 |
| `docs/sql_practice_README.md` | `01_lessons/sql_practice/README.md` | SQLite 宣稱與現實矛盾、指向空資料夾、兩半內容互相矛盾 | 無 |
| `docs/final_project_README.md` | `01_lessons/final_project/README.md` | 規格引用 repo 沒有的資料，無法照做；作品集專案重新定義為 ch08（用 Olist 資料） | 無 |
| `docs/week_05_pandas_README.md` | `01_lessons/week_05_pandas/README.md` | 指示過期（Next Step 早已完成）；由 `02_pandas/README.md` 取代 | 無 |

## 你親手寫的東西在哪（★ 標記的列＋以下）

- **在本資料夾**：`python_week01/day1_inventory_cost/2_practice.py`、`python_week01/day2_sales_revenue/1_example.py`（你親手寫的 Python），以及 `trackers/` 裡的學習日誌、錯誤日誌、概念表、HANDOFF 的逐日 session 紀錄。
- **不在本資料夾**：你上過的第一堂中文 SQL 課原檔**沒有**被封存 — 它一字不改地活在 [`01_sql/ch01_first_look/0_first_session_zh.sql`](../01_sql/ch01_first_look/0_first_session_zh.sql)，既是歷史，也是整套新課的風格範本（當時你在課堂上跑過 Practice 1–3，檔內的作答空白保持原樣未填）。
- 你的 pandas notebook 也不在這 — 它在 [`02_pandas/my_work/`](../02_pandas/my_work/)。

補充：完全空的 `week_02`~`week_04`、`week_06`、sql_practice 三個週資料夾、`supabase/.temp/` 快取與 `.DS_Store` 已直接刪除 — 它們從無任何內容，git 也從未追蹤，故不在此索引。
