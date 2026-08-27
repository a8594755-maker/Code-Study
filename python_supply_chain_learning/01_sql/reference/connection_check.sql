-- 連線健檢 — 隨時可重跑，全部唯讀、無副作用。
-- 目的：確認 VS Code（或 psql）連到的是正確的資料庫，而且 olist schema 存在。
-- 執行方式：一次一句 — 選到分號為止，Windows 按 Ctrl+Shift+E；macOS 按 Cmd+Shift+E。

-- 檢查 1：我連到哪個資料庫、用哪個帳號？
SELECT
    current_database() AS database_name,
    current_user AS user_name,
    inet_server_addr() AS server_address,
    inet_server_port() AS server_port;
-- ↑ 預期輸出：database_name = postgres，user_name = postgres。
--   （登入帳號雖然是 postgres.ylmuvsdegmpoiygbtipi，但 pooler 會去掉「.專案代號」尾碼，
--    所以 current_user 顯示 postgres — 正常，你 2026-06 第一次跑的結果就是這樣。）
--   注意：透過 Supabase pooler（連線池）時 inet_server_addr() 可能為空白 — 正常，
--   因為中間隔了一層連線池，伺服器位址對客戶端不可見。看前兩欄對就好。

-- 檢查 2：目前的 search_path（預設搜尋的 schema 順序）是什麼？
SHOW search_path;
-- ↑ 預期輸出：通常是 "$user", public — 裡面沒有 olist，
--   所以這門課的查詢一律寫完整表名 olist.orders_raw，不能只寫 orders_raw。

-- 檢查 3：olist schema（我們的資料所在的「資料夾」）存在嗎？
SELECT schema_name
FROM information_schema.schemata
WHERE schema_name = 'olist';
-- ↑ 預期輸出：恰好 1 列，schema_name = olist。
--   若回傳 0 列 = 連錯資料庫或 schema 不存在 — 先停下，回頭檢查連線設定
--   （對照 01_sql/README.md 的連線設定值）。
