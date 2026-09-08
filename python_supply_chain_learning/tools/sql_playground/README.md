# Supply SQL Lab — Entry-Level Analyst Evidence System

Supply SQL Lab 把 `01_sql/README.md` 的五章課綱做成帳號化學習產品。它不是平行課綱：課程仍使用
Supabase PostgreSQL 的公開 Olist 資料，能力定義仍以 repo 的五章計畫為正典。

## 產品能力

- 分析師工作室：100 小時 SQL＋pandas＋Power BI 整合設計目標，依工作需要交錯學工具。2026-09-06 CH1 六單元試學：26 題 SQL、6 題 pandas、3 段真實 Power BI 外部實作；第一單元補計數示範、逐步講解與三個複習變形，CH2–CH5 仍待擴充，不宣稱已備妥 100 小時。
- 課程導覽、作答／閱讀、家教分區；桌面獨立捲動，窄螢幕預設收起清單並有「問家教」頁籤。錯誤不評零分，完整多行答案與解釋可按需查看。
- 新版 SQL 用伺服器基準結果核對；pandas 回報結果比對本題完整快照。新舊進度分開，結果吻合、教學協助、外部審查不等於獨立掌握。
- 網頁內真正執行 pandas／numpy（Pyodide 314.0.6 module Web Worker），SQL 結果以 `tables`／`df` 交接。教材 fixture 明示為虛構；首次執行需下載 CDN 執行環境。
- 可展開完整示範與 Python 入門說明，錯誤先給修正方向、不評零分，保留原始 traceback。環境下載及首次 pandas／numpy 匯入另有 120 秒啟動期限；完成後才開始計算使用者程式的 20 秒限制。支援手動停止，每次全新環境避免隱藏狀態。
- 原有情境 ZIP 是參考檔：15 份任務說明、20 份 SQL、45 本 Notebook、15 份 fixture、開始說明與 requirements。檔案數不是獨立題數或時數；新版 pandas 可下載目前資料快照＋自己的程式 Notebook。
- SQL／pandas／交付紀錄按帳號保存，Query Log 可依來源／標籤篩選；CSV／JSON／ZIP 含程式、輸出、錯誤、來源、時間、結果預覽，Python 用 `.py`，不誤存 `.sql`。
- 以下為保留的原有 SQL 補強課程：五個 Chapter、每章六個循序任務，共 30 個真實 Olist 分析問題；不與新版完成量相加。
- Example → 相似題 → 變形題 → 資料驗證 → 章末獨立挑戰。
- Chapter 1 提供白話觀念、Excel／供應鏈類比、術語卡、人的解題順序、逐行範例與常見錯誤。
- Chapter 1 使用五階 Help Ladder：概念 → 表／欄／子句 → SQL 骨架 → 接近完成 → 完整答案與逐行解析。
- 題目逐題解鎖；查詢通過且完成自己的 Analyst Note 後才開下一題。
- 原五階提示的 SQL reference answer 仍由伺服器按規則開放；編輯器家教可在明確要求時提供完整示範，使用後記為引導練習，不假稱獨立掌握。
- 完成狀態區分「引導完成」與「獨立掌握」；使用第 0–1 階提示完成才算 Independent。
- 自動比較欄位、列數、數值與排序，允許不同但結果正確的 SQL 寫法。
- 每次 attempt 先寫入帳號 Query Log，再執行 SQL；Log 失敗時查詢不執行。
- Dashboard 顯示五章進度、技能精熟度、首答正確率、錯誤模式與近 14 天活動。
- Chapter 5 包含需求拆解、KPI、驗證、作品集資料集與 Entry-Level 工作模擬。
- 可下載今天或全部學習證據：CSV、JSON，或包含每次 `.sql` 的 ZIP。
- Playground：獨立於課程的唯讀 SQL 編輯器，查表、顯示結果、CSV 下載與可選觀察筆記；不評分、不解鎖課程。
- Project Demo：新人接手 Olist 配送資料的 12 步完整範例，可按語法／分析用途篩選，將完整 SQL 送到 Playground 修改。
- Demo 下載包含教學、每步最近一次實際 SQL、時間、結果預覽與帳號筆記。未執行不編造結果；修改過的 SQL 不套用範例結論。

## 編輯器旁的 AI 家教

Learn、Playground、工作任務與整合活動共用可收合、可調寬的家教。直接自由提問，不強制選教學模式；Enter 送出、Shift＋Enter 換行，中文輸入法確認不送出。回覆以真正 SSE 串流顯示，能切換這個活動的對話。一般程式區塊只提供複製；另列的結構化「修正提案」才有改動理由、真實逐行差異與確認套用。提案綁定提問時草稿版本，過期不能覆蓋；可復原最近一次套用，但之後手動修改會停用復原。套用不執行、不判分。Power BI 家教不能聲稱看過外部報表。

新版 API：`/api/integrated` 回傳 CH1 教材與個人摘要；`/:id/state` 恢復最近紀錄；`/:id/support` 保存查看協助；`/:id/powerbi` 保存自報數字與說明。Power BI 的 `fileUploaded: false`、`reviewStatus: pending` 為硬界線，數字符合不是實際 pbix 驗收。無資料庫 migration、無新權限。

驗收命令：`node scripts/check-integrated-live.mjs <local-or-preview-url> --ai` 會使用獨立臨時帳號，依現行目錄測全部 31 組唯讀查詢（22 題 SQL＋9 份取數來源）、6 題真實資料本機 pandas／帳號核對、3 個外部自報契約、三工具 AI 與追問、Dashboard、匯出，最後刪除該帳號。會有少量 AI 費用；不在 build 自動執行。這不是實際操作 Power BI Desktop 的測試，也不代表已驗證 100 小時份量。瀏覽器 Python 另須實際 UI 驗收。

零基礎探索另外用 `node scripts/check-onboarding-live.mjs <local-or-preview-url> --ai`：在臨時帳號實跑五個連貫步驟，真實串流重問「完全不知道第一步」「哪些名稱固定」「查完表名後做什麼」，核對最小修正版能執行、不同任務不能誤判通過、帳號對話可匯出。語意品質仍須閱讀真實回覆，不只檢查字串。`server/sql-onboarding.js` 同時提供畫面教材與家教上下文；明確的起點缺口會選最小目錄鷹架，但不換題、不改學生草稿、不放寬權限。相關單元測試包含舊活動 ID／答案相容、預算縮減及純解釋不產生 edit。完整教學順序見 `../../01_sql/README.md`。

`--smoke` 只測一組跨工具流程；`--ai-language=powerbi`（或 `sql`／`python`）可單獨重試指定家教，避免重跑已通過的 AI 呼叫。QA 失敗仍會刪除自己的臨時帳號，不會重試學生提交或自動產生重複 AI 費用。

Harness（家教的受控運作流程）由 `server/editor-tutor.js` 管理，不讓瀏覽器直接呼叫 OpenAI：

- 後端依題目／任務／語言／練習模式／SQL 資料集建立工作區；每個帳號的對話與執行紀錄都用 user filter＋既有 RLS 隔離。課程定義、欄位目錄與已執行結果由伺服器取得，忽略客戶端自報的歷史或系統提示。
- 送出時區分目前草稿、最後執行版本、真實 SQL 與 fixture（教材虛構樣本）；Python 結果明記 `browser_reported`。只傳少量結果，不把樣本／截斷結果當整體公司數據。
- Context window（單次上下文）使用固定教學規則＋當前任務／草稿／證據＋最多近期 8 則＋上一輪滾動摘要。資料 JSON 預算 24,000 UTF-8 bytes，輸出預留 3,000 tokens；這是保守的應用層限制，不是假稱精確的 tokenizer 或模型視窗大小。過長時先減舊對話與參考，必要時縮短程式，UI 顯示縮減狀態。完整對話不刪除。
- 每次同一個結構化回應同時產生講解與可檢視摘要，不另加摘要 API 費用。這是應用層學習摘要，不是 OpenAI opaque compaction，也不儲存／回放模型隱藏推理。摘要可能遺漏，使用者可明確糾正。
- 僅提供 `inspect_context` 讀取本次快照的欄位、指定草稿區段或執行錯誤；不能執行程式或任意查資料。選取區段和完整表名規則優先保留，過長時仍保留資料表目錄、按需補查欄位。SQL 註解、資料值、歷史及摘要均是不可信資料，不能修改系統規則。常見 key／Bearer／JWT 字串會遮蔽，但不能替代避免貼入個資／秘密。
- UUID 配合資料庫 primary key 做持久化去重；未確認請求不自動重複生成。最多兩輪補查、三次模型請求，合計用量記錄在同一則回答；失敗保留原問題與草稿，不能重試成最後一個其他問題。停止等待不保證遠端已取消或停止計費。
- 既有每分鐘 limiter 外，再查持久紀錄做每帳號每分鐘 12 次、每日 100 次檢查；不是跨併發交易的硬金額上限。失敗、模式、草稿、引用 log IDs、上下文大小、模型用量和時間都在帳號紀錄中；等待期限見下方預算。
- 完整歷史留在 `sql_playground_tutor_messages`，可隨 JSON／ZIP 匯出（既有匯出上限 10,000 則，分頁取回，CSV 單獨下載仍是執行紀錄）。新對話不刪除舊紀錄。成功使用家教的 Learn 作答視為引導練習，SQL 正確性分數不變。

Secrets：`editor-tutor-v2` Supabase Edge Function 只接受 `EDITOR_TUTOR_PROXY_SECRET`，沿用已授權的 Supabase `OPENAI_API_KEY`。舊 `editor-tutor`／`sql-analyst-tutor` 保留供既有正式站使用，不能用 Preview 改版覆寫。Netlify `/api/editor-tutor/stream` 必須先導到原生 `editor-chat` 函式；一般 API 仍用 Express，不能把串流放進會緩衝的 serverless-http。無新增資料庫權限／migration，金鑰不進前端。

家教等待預算：單次 proxy 45 秒、全部模型／補查共用 server 46 秒期限、browser 65 秒停止等待。Netlify 原生串流函式仍有 60 秒期限，帳號驗證與保存也占時間，外部服務較慢仍可能被平台中止；不能假稱計時絕不逾時。中斷時先載入紀錄／用同一 requestId 查結果，不自動重複扣用量。Supabase 存取各有 12 秒截止。

串流端到端驗收：`node scripts/check-editor-stream-live.mjs <preview-url>`。用獨立臨時帳號測真實錯誤、SSE、修正提案、修正後 SQL、追問、去重、歷史與匯出，最後清除自己的 QA 帳號。`npm test` 另包含 React DOM 的套用／復原、過期草稿、正確失敗配對、自由提問與 IME；DOM 不是瀏覽器排版／捲動驗收。主動式家教本次不實作。

驗證：`npm test`；`node scripts/check-editor-tutor-live.mjs <local-or-preview-url>` 會用臨時確認帳號做五次真實 OpenAI 回應，涵蓋四個編輯器、SQL／pandas 錯誤、連續追問、去重、紀錄匯出，最後只刪除該 QA 帳號。這個腳本會產生少量 API 費用，不在每次 build 自動執行。

設計依據：[OpenAI Conversation state](https://developers.openai.com/api/docs/guides/conversation-state) 的手動上下文管理方式；完整對話存在自己的帳號資料庫，OpenAI 請求使用 `store: false`。這不代表所有供應商紀錄都零保留。

## Playground 與 Demo 的使用界線

工作任務包路由 `/api/workflow` 與 `/api/workflow/:id/sql` 使用既有 Auth／RLS／唯讀策略，不需 migration。Python 先建立 running 紀錄，Web Worker 執行後回報終態；重新整理／斷線可能留下待同步紀錄，不會當成成功。輸出最多顯示 100 列、帳號預覽 20 列，stdout 10,000 字，輸入最多 2 MB；所有下載都標示範圍。Worker CSP 僅允許 jsDelivr 執行環境網路，不傳入帳號 token，伺服器永不 exec 使用者 Python。使用者的程式會儲存於帳號，不代表程式在伺服器執行。

SQL log ID／result digest 由伺服器核對所屬帳號、任務與資料集。pandas 輸出仍是 `browser_reported`，不是伺服器可信評分或安全認證，不能據此授予 mastery。交付要求真實 SQL、未截斷輸入、成功回報的同模式 pandas 與自我確認；只記「已交付待審查」，不改既有學生課程進度。核心示範、陪跑、獨立挑戰在紀錄中分開。Power BI／Excel 是詳細交接教材，未自動操作外部桌面軟體；新任務的 Python 錯誤提示是內建規則，不冒充 AI 回答，既有 Learn 的 AI 家教保持不變。

測試：`npm test`；`node scripts/check-workflow-python.mjs` 用本機 pandas 跑 15 份 fixture／驗證 Notebook；`node scripts/preview-workflow.mjs` 開啟明示為測試的本機 UI（4175）。只有獲授權的維護驗收才執行 `node scripts/check-workflow-live.mjs <local-or-preview-url>`：沿用已登入 Supabase CLI，建立一個不寄信的 `.invalid` QA 帳號、跑唯讀資料與帳號紀錄，finally 刪除該帳號及其測試紀錄。此腳本不在 `npm test` 中，也不在部署執行；禁止拿 production URL 跑。`--account-only` 可略過全量示範的唯讀重跑。

Playground 一次執行一個 `SELECT` 或 `WITH ... SELECT`，不是 Python／JavaScript 執行器。
沿用既有 Supabase authenticated RPC、500 列上限與帳號 RLS，另加分析函數 allowlist；沒有放寬資料庫權限。
查詢的成功／失敗先寫入 `sql_playground_query_logs`，`score` 為 NULL，`question_id` 為 NULL。
`validation` 保存 mode、demoStepId、SQL tags、觀察筆記、截斷標記與根據實際結果產生的觀察，不需新 migration。
CSV 只匯出本次顯示的結果，不假裝是全量下載；Query Log 的完整匯出仍可使用。
未執行的草稿只保留在目前網頁；重新登入或重載後，可由帳號 Query Log 送回 Playground。

Demo 是家教的示範，不是學生自己的通關證據。案例暫定按日期判定晚到、按下單日選取 2018 上半年；
要求先核對 grain、鍵與缺值，再使用州別 KPI。pandas／Power BI 是有需求時才使用，不是每次分析的必經步驟。

自動測試包括實際 HTTP 路由配合 Supabase test double 的帳號隔離測試；不寫入正式帳號。
`node scripts/preview-explore.mjs` 可啟動隔離的本機 UI 測試頁，明確標示為測試資料，不連線到 Supabase、不納入正式 build。

## 執行

2026-09-03 家教審查套用版：[Netlify Deploy Preview](https://6a99fa8568dee14e2147c0dc--supply-sql-lab-a8594755.netlify.app/)。完整 SQL／pandas 回覆可先看逐行差異，再確認套用到編輯器；不自動執行或判分。101 項測試、正式建置、diff 檢查及部署後 Supabase Auth readiness 通過；未建立測試帳號、未寫入資料庫，正式站未更新。

2026-08-31 驗收版：[CH1 三工具整合工作室 Preview](https://6a9589e2f229444b53ca7635--supply-sql-lab-a8594755.netlify.app/)。僅 Preview，正式站未更新。99 項自動測試、建置及 diff 檢查通過。本次全量驗收涵蓋 27 次唯讀 SQL（18 題＋9 份交接來源）、6 題真實資料本機 pandas／帳號核對、3 份 Power BI 外部自報契約、三工具 AI／追問與匯出；不是 27 題 SQL，也不是 Power BI Desktop 實際操作驗收。

瀏覽器另驗證登入、真實 Web Worker pandas 輸出與錯誤、資料更新不沿用舊核對結果、完整多行答案及 AI 追問。1280×720 桌面目視驗證家教輸入／送出鍵可見，教材捲動不帶動課程側欄或對話；345×837 窄畫面驗證以頁籤切換家教。首次 pandas 匯入不再計入使用者程式的 20 秒期限。Power BI 筆記匯出為 Markdown，不偽裝 `.sql` 或 `.pbix`；三個外部操作仍須本人在 Windows Desktop 完成與審查。CH2–CH5 新版教材尚未完成，不以測試通過或下載數宣稱 100 小時份量或求職能力。

最終 Preview 通過 Auth readiness、隔離帳號跨工具 smoke、Power BI 真實 AI／摘要／重送去重、Dashboard 及 ZIP 解壓；此前的 Power BI 逾時已保留在驗收描述，沒有以失敗結果冒充回覆。SQL／pandas AI 與追問另在本次 Preview 驗收通過。測試帳號及測試紀錄均已清除，學生進度未變。

Netlify handler 明確設定 `binary: ["application/zip", "application/octet-stream"]`。未設定會把 ZIP 轉成 UTF-8，產生下載成功但解壓失敗；`server/netlify-export.test.js` 呼叫實際 handler 驗證 base64 與每個 entry，部署後的 live 檢查再驗證完整 ZIP。

```bash
cd tools/sql_playground
npm install
npm run dev
```

開發版前端使用 <http://127.0.0.1:5173>，API 使用 <http://127.0.0.1:3001>。

正式驗證：

```bash
npm test
npm run build
npm start
```

正式版使用 <http://127.0.0.1:3001>。

## Supabase 架構

前端使用 Supabase Email／Password Auth。後端收到 access token 後向 Supabase Auth 驗證使用者，再以同一個
token 呼叫受 RLS（Row Level Security，資料列安全規則）保護的 REST API。

需要依序套用：

1. `supabase/migrations/202608270001_query_logs.sql`
2. `supabase/migrations/202608270002_learning_platform.sql`

第二個 migration 建立：

- 擴充版 `sql_playground_query_logs`
- `sql_playground_lesson_progress`
- `sql_playground_learning_events`
- `sql_playground_execute()` authenticated read-only RPC
- `sql_playground_schema()` schema explorer RPC
- 每個使用者只能讀寫自己資料的 RLS policies

Runtime 只需要：

```text
SUPABASE_URL
SUPABASE_ANON_KEY
DATABASE_SCHEMA=olist
PORT=3001
```

不需要 `postgres` password 或 `service_role` key。Olist 的 authenticated role 只有 schema `USAGE`、資料表
`SELECT` 與指定 RPC `EXECUTE`；沒有 INSERT、UPDATE、DELETE 或 DDL 權限。

## SQL 安全

執行路徑有多層保護：

1. PostgreSQL AST parser 只接受一個 `SELECT` 或 `WITH ... SELECT`。
2. table allowlist 只允許 `olist`、`information_schema` 與查詢內的 CTE。
3. 高風險 PostgreSQL functions 會被擋下。
4. Database RPC 再次檢查語句類型、mutating keywords 與危險 functions。
5. authenticated database role 對 Olist 只有 `SELECT`。
6. PostgreSQL statement timeout 為 8 秒，結果最多回傳 500 列。
7. API 每個登入帳號每分鐘最多執行 30 次。

## Log 與下載

每次執行會保存：UTC timestamp、Chapter、Unit、題目、attempt number、hint level、完整 SQL、成功／失敗、
自動判題分數、檢查細節、row count、duration、PostgreSQL error 與最多 20 列結果 preview。

完整 ZIP 內容：

```text
attempts.csv
progress.csv
learning_events.csv
learning_report.json
queries/*.sql
```

密碼、access token 與 API key 永遠不寫入 Query Log 或下載檔。

## 四頁共用產品介面（2026-09-05）

`main.jsx` 固定依序載入 `styles.css`、`integrated.css`、`app-ui.css`，不讓配色隨 lazy route 改變。
學習總覽、分析師工作室、自由查詢與學習紀錄共用 shell、導覽、色彩／字級 token 與按鈕狀態。
工作室與自由查詢使用同一個 `WorkspaceToolbar`、課程／資料表抽屜及 EditorTutor；桌面並排、手機頁籤切換。
切換主頁不卸載已開啟的編輯器；自由查詢保留本次草稿、結果與未送出的問題。從紀錄返回時帶回原 SQL 和錯誤／結果預覽，不自動重跑。

總覽的進度與工作室共用 integrated catalog／summary；舊 SQL 題庫進度只能另標來源。
`server/course-audit.js` 依實際目錄計數並明示缺口：目前是 CH1 試學內容，不是完整 100h 課程或就業保證。
完整課程審查見 `../../01_sql/README.md`。`server/product-ui.test.js` 驗證四頁導覽、草稿保留、錯誤回帶及一致進度；仍須做真實桌面／手機 QA。

## Netlify 部署

固定預覽入口：https://learning-preview--supply-sql-lab-a8594755.netlify.app/
使用 `netlify deploy --context deploy-preview --draft --alias learning-preview`，正常每輪只發一個非正式版本；驗收失敗才修正補發，保留最終不可變部署網址供重現。CLI 24.0.0 的 alias 若未明確加 `--draft`，實測 API context 是 branch-deploy 而非 deploy-preview，會使既有 Preview secrets 不生效；部署後必核對實際 context 與登入，不能只看建置成功。

## 帳號草稿與家教驗收（2026-09-06）

`AccountDraftProvider` 保留跨頁儲存佇列；工作室 SQL／pandas／BI、自由查詢／筆記及未送出聊天按工作區隔離。停止輸入約 900ms 後同步，沒有自動查詢或 OpenAI 呼叫。不同分頁寫入用 revision 比對；衝突需明確選擇，未同步可下載 JSON 備份，登出先等待保存。舊執行版本只在尚無帳號草稿時作還原，不覆蓋較新的內容。回帶歷史以獨立 log 工作區保存。保存不是每一鍵都有永久版本，也不是完成證據。

新增應用資料表／RPC 定義在 `supabase/migrations/202609060001_account_drafts.sql`，已透過 Supabase SQL Editor 套用；未改 Olist 資料、執行權限或既有紀錄。RLS 按 auth.uid 隔離，RPC 以同帳號＋工作區交易鎖處理首次建立與併發，重試相同內容不增加版本。不要為這個變更整批重跑其他舊 migration。ZIP／JSON 的 drafts 僅含現在的帳號草稿，標示未執行；CSV 仍是執行紀錄。

`npm test` 包含存稿競爭、離線、帳號切換、延後複習與不可執行程式標籤。另用 `node scripts/check-learning-upgrade.mjs <local-or-preview> --ai` 做有界真實驗收：兩個臨時帳號，RLS、衝突、SQL、匯出及三輪真實家教；結束自動刪除測試帳號。AI 答案必另讀正確性、是否直接回答、修正能否真的執行與是否混淆樣本／觀察證據，不能用正則檢查當教學品質認證。方法參照 [OpenAI 評估指引](https://developers.openai.com/api/docs/guides/evaluation-best-practices)。現有入職追問驗收仍用 `scripts/check-onboarding-live.mjs`。

## 部署設定

正式站：https://supply-sql-lab-a8594755.netlify.app

repo 根目錄的 `netlify.toml` 會建置 Vite 前端，並透過 Netlify Function 提供既有 Express API。
`/api/*` 會 rewrite 到 Function，其餘路徑回到 SPA 的 `index.html`。

Supabase 設定使用 Netlify 的站點環境變數；不放在 `netlify.toml` 或 Git。變數更新後必須重新部署，
Function 才會取得新值。

遵守根目錄 `AGENTS.md` 的 Preview First 規則：從 git repo 根目錄執行
`netlify deploy --context deploy-preview`，不要加 `--prod`，也不要與 `--no-build` 混用。
只有使用者當次明確要求更新正式網站，才允許正式發布；預覽完成後須檢查 `/api/health` 與登入權限。

正式發布使用 `netlify deploy --prod --context production`，不加 alias／draft；`netlify.toml` 的 production context 設定 `VITE_RELEASE_CHANNEL=production`，使標示及入口指向正式站。新版家教沿用已驗證的 `editor-tutor-v2`，production 必須配置有效的 `EDITOR_TUTOR_PROXY_SECRET`，不可複製遮蔽值或覆寫舊代理設定。只有當次正式發布已獲授權時，才可用 `node scripts/check-learning-upgrade.mjs https://supply-sql-lab-a8594755.netlify.app --production --ai` 執行臨時帳號驗收；測畢清除，平常仍只驗收 Preview。

部署後執行 `npm run check:auth -- <preview-url>`，以已部署的 `/api/config` 實際向 Supabase Auth
驗證 public key 與 Email 登入是否啟用；只讀取設定，不建立帳號、不嘗試密碼、不寫入資料。
`/api/config` 與 `/api/health` 會先檢查登入服務，拒絕遮蔽值、非公開 key 或已失效 key；
成功檢查快取 30 秒，失敗快取 5 秒，每次上游請求上限 4 秒。Auth 正常不代表 SQL、Log、AI 已驗收。

**不要把 `netlify env:list --json` 的 secret 回傳值複製到另一個 context。**
[Netlify 的 secret 政策](https://docs.netlify.com/build/environment-variables/secrets-controller/)
會遮蔽非 dev 環境的機密值，即使輸出是 JSON 也不是真正的 key。
需要設定時只能使用既有、已授權的可信來源，在記憶體中讀取並驗證，僅更新指定 preview context，
不得回顯、提交 Git、覆寫其他 context，或為了讀取而取消 secret 保護。環境變數改好後仍需重新部署。
