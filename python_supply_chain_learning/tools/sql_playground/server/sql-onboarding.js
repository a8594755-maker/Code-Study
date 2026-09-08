// Authored prerequisite bridge. Stable IDs are separate from existing graded work.
// This same teaching context is used by the lesson view and server-validated tutor.
export const onboardingOrder = ["studio-u1-discover", "studio-u1-schema", "studio-u1-s1", "studio-u1-columns", "studio-u1-sample"];
export const onboardingStart = onboardingOrder[0];
export const onboardingLessons = {
  "studio-u1-discover": {
    title: "不知道表名，就先查資料庫的目錄",
    purpose: "剛入職時，你不需要猜公司把資料叫什麼。第一份交付是可追溯的資料地圖，不是營收分析。今天先找出『有哪些分組、每個分組有哪些表』。",
    before: "真實公司先向主管／IT 確認資料庫種類、可用連線、唯讀權限、資料負責人及敏感資料限制；這些不是靠猜 SQL 得到。本站已設定好 Supabase PostgreSQL 連線，不用你填密碼。Olist 是練習資料名稱，不是 SQL 關鍵字，也不是 OLAP（分析處理方式）。",
    template: "SELECT 想看到的欄位一, 想看到的欄位二\nFROM 這些欄位所在的資料來源;",
    names: [
      ["固定語法", "SELECT / FROM / , / ;", "column（欄位）像 Excel 直向的一欄；row（資料列）像橫向的一筆紀錄。SELECT 說我要看哪些欄；FROM 說去哪裡找。逗號分隔欄位，分號結束一句。"],
      ["系統提供的名稱", "information_schema.tables → table_schema, table_name", "PostgreSQL 提供的資料表目錄，名稱可查官方文件，不是新人自己發明。table_schema 是分組名，table_name 是表名；這兩個欄位屬於目錄，不是每張業務表都有。"],
      ["公司自己的名稱", "從執行結果讀取，現在還不用填", "結果裡的每一列告訴你一個分組與表名；先找名稱，再拿它組成下一個查詢。不能預設每家公司都叫 olist。"],
    ],
    observe: "你應看到 table_schema、table_name 兩欄。這是在看目錄，不是客戶或訂單內容。只代表目前帳號可見的表／檢視表；沒有看到不等於公司沒有。若結果截斷，這還不是完整清單。",
    record: "記下查詢時間、資料庫種類、看到的分組／表名，以及『只涵蓋目前權限』；還不知道的業務用途寫待詢問資料負責人。",
    next: "先閱讀結果中的 table_schema。下一小步才學 WHERE，從目錄中只留下你要探索的分組；現在不用背條件與排序。",
  },
  "studio-u1-schema": {
    title: "拿目錄裡找到的名稱，縮小查詢範圍",
    purpose: "目錄可能混有很多系統或其他團隊的表。現在只留下練習公司的分組，免得把不相關的來源混進資料地圖。",
    before: "上一小步查 table_schema、table_name。本站教材指定 olist 為練習分組；請對照你剛查到的目錄。若沒看到 olist，先確認連線／權限，不要假裝已找到，也不要試猜其他表名。",
    template: "SELECT 要顯示的欄位\nFROM 目錄來源\nWHERE 用來篩選的欄位 = '從目錄確認的分組名稱';",
    names: [
      ["固定語法", "WHERE / = / '文字值'", "WHERE 像 Excel 篩選，保留符合條件的列；= 比較是否相同。單引號包住文字值，不是包住欄名。"],
      ["系統提供的名稱", "information_schema.tables / table_schema / table_name", "仍查同一份目錄。SELECT 的 table_name 決定顯示哪欄；WHERE 的 table_schema 決定篩掉哪些列，可以不同。"],
      ["本次情境值", "'olist'", "由本站設定／目錄結果確認的分組值，不是語法。換公司時先重新查目錄，再用那裡實際存在且獲授權的分組值。"],
    ],
    observe: "現在輸出只有 table_name 一欄，條件只保留 olist 分組。這仍可能同時列出 TABLE 與 VIEW；空結果先檢查文字大小寫及權限，不急著斷言沒資料。",
    record: "記下選用的分組與查詢條件；例如：目錄探索範圍為 olist，業務定義尚待確認。",
    next: "下一小步把表與檢視表分開，並用表名排序，完成可閱讀的目錄；之後才查其中一張表有哪些欄位。",
  },
  "studio-u1-s1": {
    title: "整理剛找到的目錄，不是背一串陌生名稱",
    purpose: "把 olist 的一般資料表清單交給同事：只留 BASE TABLE、依名稱排序，讓下次盤點能比較。不是在數公司有幾筆訂單。",
    before: "如果 SELECT、FROM 或 olist 從哪來還不清楚，先回『不知道表名，先查目錄』。本題沿用前兩小步，再加入類型條件與排序，不要求靠猜寫出目錄名稱。",
    template: "SELECT 要顯示的欄位\nFROM 目錄來源\nWHERE 分組欄位 = '已確認的分組'\n  AND 類型欄位 = '要保留的類型'\nORDER BY 排序欄位;",
    names: [
      ["固定語法", "AND / ORDER BY", "AND 表示兩個條件都成立；ORDER BY 指定結果排序。本題沒有 DESC，預設由小到大。"],
      ["系統提供的名稱與值", "table_type / 'BASE TABLE'", "table_type 是目錄欄位；BASE TABLE 是 PostgreSQL 目錄定義的類型值，代表一般資料表；VIEW 是由查詢定義的檢視表。不是每張業務表都有 table_type，也不能假定所有資料庫的目錄完全一樣。"],
      ["本次情境值", "'olist'", "它是要查的分組，來自本站設定並應以目錄核對。table_name 則是目錄欄位，不能替換成你猜的業務表名。"],
    ],
    observe: "結果應只有 table_name 一欄，內容為目前可見的 olist 一般表名稱且已排序；不是固定要求某個硬編碼列數。",
    record: "保存目錄查詢及表名；對不熟的表先記名稱，業務意義向負責人確認。",
    next: "在清單核對 sellers_raw 是否存在。接下來查它的欄位目錄，而不是立刻匯入 pandas 或 Power BI。",
  },
  "studio-u1-columns": {
    title: "知道表名後，先找它有哪些欄位",
    purpose: "拿到一張不熟的表，先知道有哪些欄位、資料型態及原始順序。這樣才知道下一個 SELECT 可以放哪些名稱。",
    before: "本題以目錄中的 olist.sellers_raw 練習。olist 與 sellers_raw 是待核對的真實名稱，不是 SQL 的固定字；若上一份清單沒有它，先問權限與來源。",
    template: "SELECT 欄位名稱欄, 資料型態欄\nFROM 欄位目錄\nWHERE 分組欄 = '已確認的分組'\n  AND 表名欄 = '剛找到的表'\nORDER BY 欄位順序欄;",
    names: [
      ["沿用的固定語法", "SELECT / FROM / WHERE / AND / ORDER BY", "語法沒變，換的是查詢來源、輸出欄位及情境值。"],
      ["系統提供的名稱", "information_schema.columns / column_name / data_type / ordinal_position", "columns 是欄位目錄；column_name 提供欄名，data_type 提供型態，ordinal_position 提供欄位在表中的順序。由官方目錄定義，不是猜出來的。"],
      ["從前一步帶入的值", "'olist' / 'sellers_raw'", "用 table_schema 和 table_name 同時篩選，避免把另一個分組的同名表混進來。結果才會告訴你 seller_id 等真正業務欄名。"],
    ],
    observe: "預期 column_name、data_type 兩欄；每列描述一個欄位，不是一位賣家。型態只能告訴你怎麼儲存，不能證明 seller_id 唯一或一列一定代表一位有效賣家。",
    record: "把完整表名、欄名、型態記入資料地圖；識別碼用途、一列代表什麼及更新頻率仍向資料負責人確認。",
    next: "確認欄位後，才取少量業務資料。下一步會教 * 與 LIMIT，不需要現在分析營收。",
  },
  "studio-u1-sample": {
    title: "第一次看到業務資料：只看五列",
    purpose: "你已找到表名與欄位。現在觀察少量內容長什麼樣，提出待確認的問題；先了解資料，再選分析問題。",
    before: "從表目錄得到 olist.sellers_raw，從欄位目錄確認 seller_id。未確認名稱前不要靠印象拼字；也先確認敏感資料是否允許查看。",
    template: "SELECT *\nFROM 已確認的分組.已確認的表\nORDER BY 已確認的排序欄位\nLIMIT 要看的列數;",
    names: [
      ["固定語法", "* / LIMIT / .", "* 表示這個來源的所有欄位；LIMIT 5 最多取五列。點號把分組與表名連起來。本站必須使用完整表名。"],
      ["已發現的業務名稱", "olist.sellers_raw / seller_id", "分別來自表目錄與欄位目錄，不是每家公司都使用的名稱。ORDER BY seller_id 讓抽查按識別碼排序；是否唯一仍需驗證。"],
      ["本次選擇", "5", "五列是這次觀察量，可在自由探索時改成十列，不是公司只有五筆。小樣本、依 ID 排序都不能代表全公司分布。"],
    ],
    observe: "這次每列才是業務資料；對照欄位目錄讀 seller_id、城市、州別等值。看見 ID 不等於證明唯一；看見五列不等於總數。SELECT * 適合初看，正式交付通常明列必要欄位。",
    record: "記錄這是按 seller_id 排序的最多五列樣本、看到的欄位與待確認問題；不要把樣本的城市比例當營運結論。",
    next: "下一題才學 COUNT(*)：主管問『整張表有幾列』時，需要計數，不是增加 LIMIT。完成取數與驗證後，若需檔案整理用 pandas；需持續更新報表才交到 Power BI。",
  },
};

export const onboardingActivities = [
  { id: onboardingStart, title: "不知道表名，先查目錄", task: "先不用猜公司表名。查目錄，顯示 table_schema（分組名稱）與 table_name（表名稱），觀察你有權看到哪些來源。", reference: "SELECT table_schema, table_name\nFROM information_schema.tables;", ordered: false, tags: ["SELECT", "FROM", "schema"] },
  { id: "studio-u1-schema", title: "從目錄選出一個分組", task: "核對目錄中的 olist 分組，只顯示其中的 table_name。本次先不區分類型、也不要求排序。", reference: "SELECT table_name\nFROM information_schema.tables\nWHERE table_schema = 'olist';", ordered: false, tags: ["SELECT", "WHERE", "schema"] },
  { id: "studio-u1-columns", title: "查出陌生表的欄位", task: "從欄位目錄查 olist.sellers_raw，顯示 column_name、data_type，依 ordinal_position 排成原始欄位順序。", reference: "SELECT column_name, data_type\nFROM information_schema.columns\nWHERE table_schema = 'olist'\n  AND table_name = 'sellers_raw'\nORDER BY ordinal_position;", ordered: true, tags: ["SELECT", "WHERE", "schema", "ORDER BY"] },
  { id: "studio-u1-sample", title: "先看五列，記下待確認的事", task: "已從目錄找到 olist.sellers_raw 及 seller_id。顯示全部欄位，按 seller_id 排序，最多觀察五列。", reference: "SELECT *\nFROM olist.sellers_raw\nORDER BY seller_id\nLIMIT 5;", ordered: true, tags: ["SELECT", "LIMIT", "ORDER BY", "grain"] },
].map((a) => ({ ...a, chapterId: "ch01", unitId: "u1", tool: "sql", kind: "guided", mode: "practice", explanation: [onboardingLessons[a.id].observe, onboardingLessons[a.id].record] }));

// A narrow, visible pedagogical redirect, never an editor mutation or scope change.
export function needsDiscoveryBridge(message = "") {
  if (/修正|除錯|除错|debug|本題.*(?:答案|解答)|本题.*(?:答案|解答)|不要.*(?:入門|入门|基礎|基础)/i.test(message)) return false;
  return /(?:沒有|没有|沒|没|零).{0,10}SQL.{0,5}(?:基礎|基础)|(?:不會|不会|不知道|不懂).{0,10}(?:第一步|第一個|第一个)|(?:第一步|第一個|第一个).{0,10}(?:不會|不会|不知道|不懂)|(?:不知道|不曉得|不晓得).{0,15}(?:名稱|名称|表名|叫什麼|叫什么)|(?:剛|刚)入[職职].{0,20}(?:怎麼|怎么).{0,8}(?:開始|开始)|^我(?:剛|刚)入[職职][。，！!？?\s]*$/i.test(message);
}

export const beginnerTutorPolicy = `零基礎教學合約（2026-09-06）：先直接回答學生當下問題，再給原因、小例子與一個能驗證的動作。微型虛構表用表格與文字演算；不要把 FROM 這個小例子 等假名稱寫進 sql 區塊。COUNT(*) 加 LIMIT 合法且計數後才限制輸出，不可說成只數 N 筆；COUNT(*)、COUNT(欄)、COUNT(DISTINCT 欄) 要區分全部列、非空列、不同非空值，差額不能全部稱重複或髒資料。學生說「剛入職／不會第一步／不知道名稱從哪來／哪些固定哪些替換／還是不懂」時，先補前置理解，不把當前題目當學生已懂的前提。不要反覆貼同一串 WHERE、AND、BASE TABLE、ORDER BY 然後叫學生填空。
先回答眼前疑問：SELECT 是我要哪些欄，FROM 是去哪個來源；table_name 只是目錄的一個欄名，不是所有查詢都寫它。明確分三類：SQL 語法、系統目錄識別字／類型值、公司情境值或從目錄找到的業務名稱。information_schema.tables/columns 和其欄名源自 PostgreSQL 官方目錄定義；olist 是本站設定的分組，sellers_raw 要從目錄確認。BASE TABLE 是目錄類型值，不是每張業務表都有的語法。別宣稱各種資料庫完全一樣。Olist 是資料集名稱，OLAP 是分析處理概念，不能混稱。
新人工作順序：問主管／IT 確認資料庫種類、連線、唯讀權限和負責人（本站已配置）；先查目錄發現分組與表名，再選分組／類型，查欄位與型態，才取少量明細、確認一列意義、檢查品質與選定商業問題。目錄只代表目前可見範圍；schemaCatalog 是伺服器提供的欄位證據，不是學生已自己探索或理解的證據。
若不知道任何名稱，先用 text 程式區塊示意 SELECT 要看的欄位 / FROM 資料來源（清楚標『通用骨架，不能執行』），再給本環境最小完整示範 SELECT table_schema, table_name FROM information_schema.tables; 分兩行。這一步不先要求知道 olist，也不一次加所有條件。它可能未符合目前進階題的結果要求，要說是補基礎示範、非本題完成答案，不要硬叫學生提交當前驗收。需要时指向課程的「不知道表名，先查目錄」。不能把不存在的示例表當可執行 SQL／edit。
learningSupport 是本站教材，可用它說明名稱出處、逐句意思、預期看到什麼、該記什麼、依結果決定下一小步，但不是學生完成證據。學生追問時換解釋方式，最多給當下可做的一小步，不重新灌整章。完整答案可在第一次嘗試前教，不強逼猜或連錯後才給。不可因單元 handoff 就叫學生立即轉 pandas／Power BI；查表名之後是欄位與樣本，工具轉手需要明確工作需求、輸出契約與驗證。`;
