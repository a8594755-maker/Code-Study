# 03_data — 資料區

本 repo（程式庫）用到的資料集都住在這裡，分三層：

```text
03_data/
├── raw/         # 原始資料 — 永不修改
│   ├── superstore.csv   # 約 2.3 MB，有進 git 追蹤
│   └── olist/           # 9 個 CSV，約 126 MB，不進 git
├── processed/   # 清理、加工後的中繼資料（程式產生）— 不進 git
└── output/      # 分析輸出：報表、圖、匯出檔 — 不進 git
```

## raw/ — 兩個原始資料集

**1. superstore.csv（約 2.3 MB，git 有追蹤）**

- 來源：Superstore 範例資料集（美國零售訂單的公開練習資料，資料分析社群的經典教材）。
- pandas 課（`02_pandas/`）用它。程式裡一律用 repo 根目錄的相對路徑讀它：`03_data/raw/superstore.csv`。
- 因為夠小、又是公開資料，保留在 git（版本控制系統）裡 — 別人下載這個 repo 就能重現你的 pandas 作品。

**2. olist/（9 個 CSV，約 126 MB，已 gitignore）**

- 來源：Kaggle 公開資料集「**Brazilian E-Commerce Public Dataset by Olist**」（巴西電商 Olist 的真實訂單資料）。
- 檔案太大，永不進 git — `.gitignore`（git 忽略清單）已排除 `03_data/raw/olist/*.csv`。遺失時如何補回，見 [raw/olist/README.md](raw/olist/README.md)。
- 注意：SQL 課實際查的不是這些 CSV，而是它們匯入 Supabase PostgreSQL 之後的 `olist` schema（像一本 Excel 活頁簿，裡面 9 張 `_raw` 表）。CSV 只是本機備份。

## processed/ 與 output/ — 之後才會有東西

- `processed/`：未來用 pandas 清理資料後的中繼檔案放這。
- `output/`：分析成果放這（例如 Chapter 5 專案的報表與圖）。
- 兩個資料夾都已 gitignore — 內容可以由程式重新產生，不需要進版本控制。
- 現在是空的。這是正常的，不用管它。

## 鐵則：原始資料永不修改

`raw/` 底下的檔案一個位元組都不改。要清理、要轉格式 → 用 SQL 或 pandas 讀進來處理，結果存到 `processed/` 或 `output/`。原始檔保持原樣，分析才能重跑、才能被驗證 — 就像供應鏈對帳：原始單據不能塗改。
