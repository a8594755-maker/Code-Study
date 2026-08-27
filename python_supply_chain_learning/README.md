# Python + SQL Supply-Chain Analytics — Learning Repo

Self-built learning repository: a supply-chain professional (Excel / SAP background)
learning data analytics with real tools and real datasets — not toy tutorials.

- **Stack:** PostgreSQL (Supabase) · SQL · Python (pandas, Jupyter) · VS Code
- **Work:** SQL analysis of the Olist Brazilian e-commerce dataset (9 tables, ~126 MB) · pandas analysis of the Superstore retail dataset
- **Status (2026-08):** five-chapter SQL job-readiness track · Chapter 1 / Unit 1 active · pandas read_csv → inspection workflow done
- **Start here:** [`01_sql/`](01_sql/README.md) for the SQL track, [`02_pandas/`](02_pandas/README.md) for the pandas track

以下為繁體中文，寫給學習者本人。

---

## 10 秒定位

不知道自己在哪、下一步做什麼？**打開 [PROGRESS.md](PROGRESS.md)，只讀第一段「現在位置」。** 進度只記在那裡，別的地方都沒有。

## Windows 本機啟動（第一次）

請在 VS Code 直接開啟本資料夾 `python_supply_chain_learning`，再從 terminal（終端機）依序執行：

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

開啟 `.ipynb` 後，在右上角 **Select Kernel（選擇執行環境）** 選擇 `.venv`。若想使用瀏覽器版 Jupyter Lab，執行：

```powershell
.\.venv\Scripts\python.exe -m jupyter lab
```

VS Code 需要三個 extension（擴充套件）：Python、Jupyter、PostgreSQL；本 repo 的 `.vscode/extensions.json` 會自動推薦。SQL 查詢在 Windows 選取到分號後按 `Ctrl+Shift+E`，macOS 則按 `Cmd+Shift+E`。

## 資料夾地圖

| 位置 | 這是什麼 |
|---|---|
| [PROGRESS.md](PROGRESS.md) | 唯一進度紀錄：現在位置、概念表、學習日誌、錯誤日誌 |
| [AGENTS.md](AGENTS.md) | AI 家教的規則書：教法、語言政策、永不代寫你的練習 |
| [01_sql/](01_sql/README.md) | ★ 主線：五章 Entry-Level SQL Analyst 實戰課（Olist × Supabase PostgreSQL）；完整 Unit 計畫只在裡面的 README |
| [02_pandas/](02_pandas/README.md) | 副線：pandas（Python 資料分析套件）；`my_work/` 是你的作品，AI 永不動它 |
| [03_data/](03_data/README.md) | 資料區：`raw/` 原始資料（永不修改）、`processed/` 加工檔、`output/` 分析輸出 |
| [tools/sql_playground/](tools/sql_playground/README.md) | 本機 SQL 練習場：瀏覽 Olist schema、逐題寫唯讀查詢並檢視結果 |
| 04_reference/ | 私人文件（履歷等）；整夾已列入 .gitignore，絕不會出現在 GitHub |
| [90_archive/](90_archive/README.md) | 歷史封存：舊課程、舊追蹤檔、舊筆記全在這 |

## 每天的固定流程（3 步）

1. 打開 PROGRESS.md 第一段，看「下一步」指向哪個檔案。
2. 到目前 Unit 上課：`unitNN_1_lesson.sql`（讀＋跑）→ `unitNN_2_practice.sql`（自己逐題寫）→ `unitNN_3_challenge.sql`（白紙挑戰）。家教一次只出一題。
3. 收尾：家教更新 PROGRESS.md，你下一個 commit（提交存檔點）。沒做這步，這次 session（上課）不算結束。

## 關於封存區

歷史都在 `90_archive/`，那裡是歷史，不是待辦。想回顧以前寫過什麼隨時可以去翻，但永遠不需要「補完」裡面的任何東西。
