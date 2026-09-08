const countNames = [
  ['固定語法', 'COUNT(*) / AS', 'COUNT(*) 把範圍內所有資料列數成一個數字，包含有空值的列；AS 只替輸出欄位命名，不修改資料庫。像 Excel 確認資料筆數，不把標題算進去。'],
  ['从目錄取得', '分組名.表名', '先從表目錄確認來源，再用完整名稱放在 FROM 後面。表名換了，計數語法不變。'],
  ['本次交付名称', 'seller_rows / order_rows / product_rows', '這些是主管要求的輸出欄名，可用 AS 命名；不是資料庫必須原本就存在的欄位。'],
];
export const unitOneLessons = {
  'studio-u1-count': {
    title: '五列樣本看完了，整張表有多大？',
    purpose: '主管要知道賣家主檔規模，作為日後更新的對帳基準。這次交付一個總列數，不是名單，也還不是活躍賣家數。',
    before: '先完成欄位與五列觀察。把「看看資料」與「確認總量」分開：前者要明細，後者要一個數字。',
    template: 'SELECT COUNT(*) AS 結果欄名\nFROM 從目錄確認的分組.表名;', names: countNames,
    observe: '假設工作表有三列 A、A、空值，COUNT(*) 是 3，不是 1。SELECT * 的星號表示所有欄位；COUNT(*) 的星號表示計數所有列。結果只有一列一欄，格子裡才是總數。',
    record: '記錄完整表名、查詢時間、計數結果與是否有篩選。寫「資料列」而不是未驗證的「有效賣家」；總數不能證明識別碼唯一或名單完整。',
    next: '接下來修正同事的訂單盤點：他把五列明細誤當總數。COUNT(*) 後加 LIMIT 5 合法，只限制結果列，並非只數五筆；但本題不需要加。',
  },
  'studio-u1-s2': {
    title: '修錯先比較需求與輸出，不是乱改關鍵字',
    purpose: '同事交了五個訂單編號，主管卻要一個總列數。SQL 能執行，不代表回答了問題。',
    before: '已學過 COUNT(*) 才進這題。先把需求說成「全部訂單資料列 → 一個數字」，再看草稿其實在逐筆取編號。',
    template: 'SELECT COUNT(*) AS 主管指定的結果欄名\nFROM 已確認的完整表名;', names: countNames,
    observe: '先確認一列一欄，再確認來源 orders_raw 且沒有不必要的篩選。只刪 LIMIT 仍是很多編號，不會變成總數。',
    record: '保留錯誤與修正版，寫清楚「明細不是計數」。COUNT(*) 加 LIMIT 5 本身合法，不能記成「計數不准加 LIMIT」。',
    next: '換成商品主檔自己做。若忘記來源就查目錄，忘記語法可問家教；協助不扣正確性，但另記為有協助。',
  },
  'studio-u1-s3': {
    title: '把同一個觀念帶到另一份資料',
    purpose: '採購同事要商品資料的盤點基準；沒有要你分析銷量，也沒有要商品清單。',
    before: '已練過賣家計數與訂單修錯。這次先自己想輸出幾列幾欄、來源在哪裡、結果叫什麼；不是計時測驗。',
    template: '來源：從目錄確認\n輸出：一個總列數，使用指定欄名\n範圍：全部資料列，不另加條件',
    names: [['可沿用', '計數與輸出命名', '換來源不改變計數意思，需要時可回看上一題。'], ['重新確認', '完整表名', '從目錄確認商品來源，不照抄訂單表。'], ['不能先下結論', '有效商品／唯一商品', '總列數不是唯一性或業務有效性的證明。']],
    observe: '核對一個總數、欄名符合要求、程式沒有仍指向賣家或訂單。試著向家教解釋你為什麼沒有取五列明細。',
    record: '保存 SQL 與結果，註明尚未確認 ID 唯一性與更新規則。系統只核對結果，解釋能力需要你真的說出來。',
    next: '下一題才把另外取出的 20 列快照交给 pandas 檢查，不把全表計數或表名目錄當成業務明細。',
  },
  'studio-u1-p': {
    title: '工具交接：pandas 收到了什麼？',
    purpose: '同事需要在 Python 整理一份抽查名單。先核對交接後的列數與欄數，避免拿錯檔；若只問全表總數，SQL 已足夠，不必硬換工具。',
    before: '按「準備本題資料」取得已列出的 SQL 快照：seller_id、seller_city、seller_state 三欄，排序後最多 20 列，放到 df。這不是原本 SELECT * 的五列樣本。',
    template: 'result = pd.DataFrame({\n    "輸出欄名一": [想放的數字],\n    "輸出欄名二": [另一個數字]\n})',
    names: [['本站提供', 'pd / df / result', 'pd 是 pandas 簡稱；df 是載入的表格；result 是網站要顯示的結果變數。不是每家公司都用這三個名稱。'], ['固定寫法', 'len(...) / df.columns / { } / [ ]', 'len(df) 數列，len(df.columns) 數欄；大括號對應欄名與內容，中括號是值的清單。等號把右邊結果存進左邊變數。'], ['交付名稱', 'row_count / column_count', '題目指定的輸出名稱，用引號表示文字；不是來源原本的欄名。']],
    observe: '若微型工作表四列三欄，答案是 row_count=4、column_count=3；真實快照則和「查看來源」核對。教材樣本不算 Supabase 取數證據。',
    record: '記下來源 SQL、快照時間與列欄是否一致。下載 Notebook 是可重跑副本，不會自動重新抓資料庫。',
    next: '本單元交付資料地圖與盤點基準。下一單元依需求挑選欄位；需要固定報表時才把核對過的 CSV 交給 Power BI，不是每次查詢都做圖。',
  },
};
export const unitOneExtraActivities = [
  { id: 'studio-u1-count', title: '從五列樣本到全表計數', kind: 'guided', task: '計算 olist.sellers_raw 的全部資料列，輸出一列一欄，欄名 seller_rows。', reference: 'SELECT COUNT(*) AS seller_rows\nFROM olist.sellers_raw;', explanation: ['COUNT(*) 計算全部列，包含空值與重複。', 'AS 命名輸出，FROM 指定已確認的來源。'], tags: ['COUNT', 'AS', 'grain'] },
  { id: 'studio-u1-review-catalog', title: '複習：找出客戶表的欄位', kind: 'independent', task: '盤點 olist.customers_raw 的 column_name、data_type，按 ordinal_position 排序。不是輸出客戶明細。', reference: "SELECT column_name, data_type\nFROM information_schema.columns\nWHERE table_schema = 'olist'\n  AND table_name = 'customers_raw'\nORDER BY ordinal_position;", explanation: ['查欄位目錄，不是客戶表本體。', '換表重新確認型態，不假定和賣家相同。'], tags: ['schema', 'WHERE', 'ORDER BY'], reviewConcept: 'catalog' },
  { id: 'studio-u1-review-sample', title: '複習：給客服一份三列抽查', kind: 'independent', task: '從 olist.customers_raw 取全部欄位，按 customer_id 排序，最多三列。思考為什麼不能拿三列當公司客戶總量。', reference: 'SELECT *\nFROM olist.customers_raw\nORDER BY customer_id\nLIMIT 3;', explanation: ['完整表名與欄名可先查目錄。', '這三列只供觀察，不代表全公司。'], tags: ['SELECT', 'LIMIT', 'ORDER BY'], reviewConcept: 'sample' },
  { id: 'studio-u1-review-count', title: '複習：財務要付款資料的盤點', kind: 'independent', task: '計算 olist.order_payments_raw 的全部列數，欄名 payment_rows；不篩選、不取明細。不要把付款列數直接叫訂單數。', reference: 'SELECT COUNT(*) AS payment_rows\nFROM olist.order_payments_raw;', explanation: ['COUNT(*) 數列，一筆訂單可能分多筆付款。', '換來源與輸出名稱，計數邏輯不變。'], tags: ['COUNT', 'grain'], reviewConcept: 'count' },
].map((a) => ({ ...a, chapterId: 'ch01', unitId: 'u1', tool: 'sql', mode: a.kind === 'independent' ? 'independent' : 'practice', ordered: true }));
