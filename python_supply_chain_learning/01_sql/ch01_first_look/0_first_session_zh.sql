-- 第一次 SQL 練習：Olist SELECT 基礎中文版
--
-- 這份是第一次用的中文版輔助練習檔。
-- 目的不是做作品集，而是讓你先真的看懂 SQL 在做什麼。
--
-- 等你熟悉後，再回到英文版：
-- 03_student_first_select_workbench.sql
--
-- 今天只做三題：
-- Practice 1：確認我連到哪個 database
-- Practice 2：找出有哪些 schema
-- Practice 3：找出 olist 裡有哪些 tables
--
-- 重要使用方式：
-- 1. 不要一次跑整份檔案。
-- 2. 一次只選取一段 SQL。
-- 3. 選取到 semicolon ; 為止。
-- 4. 按 Cmd + Shift + E 執行。
-- 5. 看結果後，再看解釋。
--
-- 先懂幾個最基本觀念：
--
-- database = 資料庫
-- 你可以把它想成一個大型 Excel 工作簿。
--
-- schema = 資料表分組 / 資料夾
-- PostgreSQL 裡會用 schema 把 tables 分組。
-- 例如 olist.orders_raw 的意思是：
-- olist 這個 schema 裡面的 orders_raw table。
--
-- table = 資料表
-- 像 Excel 裡的一張 sheet。
--
-- row = 資料列
-- 一筆資料。例如一筆訂單。
--
-- column = 欄位
-- 一種資料。例如 order_id、customer_id、order_status。
--
-- query = 查詢
-- 你寫給資料庫的一段問題或指令。
--
-- semicolon ; = SQL 指令結束符號
-- 一段 SQL 通常用 ; 結尾。

-- ============================================================================
-- Practice 1：確認連線
-- ============================================================================
--
-- Business question：
-- 我現在連到哪個 database？我是用哪個 user 連線？
--
-- 為什麼要先做這個？
-- 分析師在查資料前，要先確認自己沒有連錯資料庫。
-- 不然你可能 SQL 寫對了，但查到錯的地方。
--
-- 答案：

SELECT
    current_database() AS database_name,
    current_user AS user_name;

-- 逐行解釋：
--
-- SELECT
-- 告訴資料庫：「我要顯示什麼結果。」
--
-- current_database()
-- 這是一個 PostgreSQL 內建 function（函數）。
-- 它會回傳你目前連到的 database 名稱。
--
-- AS database_name
-- AS 是 alias（別名）。
-- 它把結果欄位命名成 database_name，比較好讀。
--
-- current_user
-- 這會回傳你目前使用的 database user。
--
-- AS user_name
-- 把結果欄位命名成 user_name。
--
-- ;
-- 代表這段 SQL 結束。
--
-- 你應該看到：
-- database_name = postgres
-- user_name = postgres
--
-- 你的任務：
-- 1. 選取上面的 SELECT 到 ;。
-- 2. 按 Cmd + Shift + E。
-- 3. 確認結果是不是 postgres / postgres。
-- 4. 在下面空白處，不看答案，自己再打一遍。



-- 我的執行結果：
-- database_name I see: __________
-- user_name I see: __________

-- ============================================================================
-- Practice 2：找出有哪些 schema
-- ============================================================================
--
-- Business question：
-- 這個 database 裡有哪些非系統用的 schema？
--
-- 為什麼要做這個？
-- PostgreSQL 裡會有很多系統 schema。
-- 分析師要先找出哪個 schema 是我們的 business data。
-- 這個專案的 business schema 是 olist。
--
-- 答案：

SELECT schema_name
FROM information_schema.schemata
WHERE schema_name NOT LIKE 'pg_%'
  AND schema_name <> 'information_schema'
ORDER BY schema_name;

-- 逐行解釋：
--
-- SELECT schema_name
-- 我要顯示 schema_name 這個欄位。
--
-- FROM information_schema.schemata
-- 我要從 information_schema.schemata 讀資料。
-- information_schema 是 PostgreSQL 內建的資料庫目錄。
-- 它不是你的業務資料，而是「資料庫裡有什麼」的說明資料。
--
-- WHERE schema_name NOT LIKE 'pg_%'
-- WHERE 是篩選條件。
-- 這一行的意思是：不要顯示名稱開頭是 pg_ 的 schema。
-- pg_ 開頭通常是 PostgreSQL 系統用的。
--
-- AND schema_name <> 'information_schema'
-- AND 代表兩個條件都要成立。
-- <> 代表不等於。
-- 這一行的意思是：也不要顯示 information_schema。
--
-- ORDER BY schema_name
-- 按 schema_name 排序，讓結果比較好讀。
--
-- ;
-- SQL 結束。
--
-- 你應該看到：
-- 結果中應該包含 olist。
--
-- 你的任務：
-- 1. 選取上面的 SELECT 到 ;。
-- 2. 執行。
-- 3. 找結果裡有沒有 olist。
-- 4. 在下面空白處，不看答案，自己再打一遍。



-- 我的執行結果：
-- The business schema for this practice is: __________

-- ============================================================================
-- Practice 3：列出 olist 裡有哪些 tables
-- ============================================================================
--
-- Business question：
-- olist 這個 schema 裡有哪些 tables？
--
-- 為什麼要做這個？
-- 分析師不應該猜 table 名稱。
-- 第一步是先查資料庫裡到底有哪些 tables。
--
-- 答案：

SELECT
    table_schema,
    table_name
FROM information_schema.tables
WHERE table_schema = 'olist'
ORDER BY table_name;

-- 逐行解釋：
--
-- SELECT
-- 我要選擇要顯示的欄位。
--
-- table_schema,
-- 顯示 table 屬於哪個 schema。
--
-- table_name
-- 顯示 table 的名稱。
--
-- FROM information_schema.tables
-- 從 PostgreSQL 的 table 目錄讀資料。
-- 這個地方記錄了 database 裡有哪些 tables。
--
-- WHERE table_schema = 'olist'
-- 只保留 table_schema 等於 olist 的資料。
-- 'olist' 是文字，所以要用單引號。
--
-- ORDER BY table_name
-- 按 table_name 排序。
--
-- ;
-- SQL 結束。
--
-- 你應該看到這些 tables：
-- customers_raw
-- geolocation_raw
-- order_items_raw
-- order_payments_raw
-- order_reviews_raw
-- orders_raw
-- product_category_translation_raw
-- products_raw
-- sellers_raw
--
-- 分析師解讀：
-- orders_raw 看起來像主訂單表。
-- customers_raw 看起來像客戶表。
-- order_items_raw 看起來像訂單商品明細表。
--
-- 你的任務：
-- 1. 選取上面的 SELECT 到 ;。
-- 2. 執行。
-- 3. 看結果裡有哪些 table。
-- 4. 在下面空白處，不看答案，自己再打一遍。



-- 我的執行結果：
-- The main order table seems to be: __________

-- ============================================================================
-- 今天的理解檢查
-- ============================================================================
--
-- 請用你自己的話回答：
--
-- 1. SELECT 是做什麼？
-- 2. FROM 是做什麼？
-- 3. WHERE 是做什麼？
-- 4. schema 是什麼？
-- 5. table 是什麼？
-- 6. 為什麼我們要先查 information_schema？

