export const chapterOneTeaching = {
  "ch01-q01": {
    lesson: {
      concept: "先確認一張資料表有多少資料",
      plainLanguage:
        "table（資料表）就像 Excel 工作表，row（資料列）就像工作表中的一筆紀錄。COUNT(*) 會把表內所有資料列數出來，適合在接手陌生資料庫時先確認規模。",
      analogy:
        "主管問『賣家主檔目前有幾筆？』，就像請你看 Excel 狀態列確認這張工作表共有幾列，不需要先逐筆閱讀內容。",
      terms: [
        { term: "SELECT", meaning: "指定結果要顯示什麼。", here: "這題要顯示計算後的列數。" },
        { term: "COUNT(*)", meaning: "計算資料表中的全部資料列。", here: "回傳一個總數。" },
        { term: "AS", meaning: "替結果欄位取一個清楚的 alias（別名）。", here: "把結果命名為 seller_row_count。" },
        { term: "FROM", meaning: "指定資料來自哪張表。", here: "資料來源是 olist.sellers_raw。" },
      ],
      thoughtProcess: [
        "先把主管的問題改寫成輸出：我要一個賣家資料列總數。",
        "確認來源：olist 是 schema（資料表分組），sellers_raw 是資料表。",
        "用 COUNT(*) 計算全部資料列，再用 AS 命名結果欄位。",
      ],
      workedExample: {
        title: "相近示範：計算訂單資料量",
        context: "先用另一張表練習同一種思考，不直接替你完成賣家題。",
        sql: "SELECT COUNT(*) AS order_row_count\nFROM olist.orders_raw;",
        lineByLine: [
          { code: "SELECT COUNT(*)", explanation: "把所有訂單資料列數出來。" },
          { code: "AS order_row_count", explanation: "讓結果欄名直接說明它是訂單列數。" },
          { code: "FROM olist.orders_raw;", explanation: "指定訂單表，分號表示這一句 SQL 結束。" },
        ],
        resultShape: "結果只會有 1 列、1 欄；欄名是 order_row_count，值是訂單表的總列數。",
      },
      commonMistakes: [
        "只寫 COUNT(*)，忘記前面的 SELECT。",
        "把欄位別名寫成引號內的資料值。",
        "漏掉 schema 名稱 olist.，導致找不到表。",
      ],
    },
    solution: {
      lineByLine: [
        { code: "SELECT COUNT(*)", explanation: "計算 sellers_raw 的全部資料列。" },
        { code: "AS seller_row_count", explanation: "依題目要求，把計算結果命名為 seller_row_count。" },
        { code: "FROM olist.sellers_raw;", explanation: "從 olist schema 裡的賣家表取得資料。" },
      ],
      whyItWorks: [
        "沒有 WHERE，所以每一列都會被計入。",
        "COUNT(*) 是彙總計算，因此整張表最後變成一個總數。",
        "AS 只改結果欄名，不會改動資料庫。",
      ],
      verify: [
        "結果應為 1 列、1 欄。",
        "欄名必須是 seller_row_count。",
        "數值應大於 0，而且查詢不會修改任何資料。",
      ],
      transfer:
        "下一題會把 sellers_raw 換成 order_reviews_raw。不要複製答案；如果能自己更換表名與別名，就證明你開始把格式轉移到新任務。",
    },
  },

  "ch01-q02": {
    lesson: {
      concept: "把已學格式轉移到另一張資料表",
      plainLanguage:
        "分析師不會為每張表重新發明 SQL。你要辨認哪些部分是固定結構，哪些部分必須依商業問題更換。這就是 transfer（能力轉移）。",
      analogy:
        "就像同一份 Excel 樞紐分析表模板，昨天連賣家主檔，今天改連評論明細；計算方法相同，但資料來源與輸出名稱必須跟著換。",
      terms: [
        { term: "query pattern", meaning: "可以重複使用的查詢形狀。", here: "SELECT COUNT(*) AS ... FROM ..." },
        { term: "table name", meaning: "真正決定你在數哪一份資料。", here: "這題是 order_reviews_raw。" },
        { term: "alias", meaning: "讓輸出欄名符合交付需求。", here: "這題要使用 review_row_count。" },
      ],
      thoughtProcess: [
        "圈出和上一題相同的動作：仍然要計算全部資料列。",
        "圈出不同參數：資料表改成評論表，欄位別名改成評論列數。",
        "完成後先看欄名，再看數值；不要只看到一個數字就當作正確。",
      ],
      workedExample: {
        title: "相近示範：計算付款紀錄量",
        context: "沿用 COUNT 格式，但換成付款表與新的交付欄名。",
        sql: "SELECT COUNT(*) AS payment_row_count\nFROM olist.order_payments_raw;",
        lineByLine: [
          { code: "COUNT(*)", explanation: "計算付款表全部資料列，方法沒有改變。" },
          { code: "AS payment_row_count", explanation: "別名改成付款紀錄的意思。" },
          { code: "FROM olist.order_payments_raw;", explanation: "資料來源改成付款表。" },
        ],
        resultShape: "1 列、1 欄；欄名清楚指出這是付款紀錄列數。",
      },
      commonMistakes: [
        "只換表名，忘記換輸出別名。",
        "複製上一題後仍然數 sellers_raw。",
        "把 reviews 拼成 review，造成找不到資料表。",
      ],
    },
    solution: {
      lineByLine: [
        { code: "SELECT COUNT(*)", explanation: "計算評論表中的全部資料列。" },
        { code: "AS review_row_count", explanation: "依交付規格命名結果。" },
        { code: "FROM olist.order_reviews_raw;", explanation: "指定 Olist 的評論原始表。" },
      ],
      whyItWorks: [
        "查詢形狀與上一題相同，但資料來源已正確替換。",
        "輸出名稱 review_row_count 讓主管不需打開 SQL 也知道數字代表什麼。",
      ],
      verify: ["結果應為 1 列、1 欄。", "欄名是 review_row_count。", "數值應大於 0。"],
      transfer:
        "關閉答案後，請用自己的話說明：這一題和上一題哪兩個地方改變、哪一個計算方法沒有改變。",
    },
  },

  "ch01-q03": {
    lesson: {
      concept: "選欄、篩選、排序，再控制抽樣列數",
      plainLanguage:
        "SELECT 決定報表欄位，WHERE 像 Excel 篩選器，ORDER BY 像排序，LIMIT 像只取最上面的幾列。四個步驟各自回答不同問題。",
      analogy:
        "營運主管不是要整份訂單表，而是要『已送達、最新、只看 10 筆』的抽查清單。你要把一句需求拆成欄位、條件、排序與列數。",
      terms: [
        { term: "WHERE", meaning: "只保留條件成立的資料列。", here: "只保留 delivered。" },
        { term: "ORDER BY", meaning: "決定結果顯示順序。", here: "依購買時間排序。" },
        { term: "DESC", meaning: "由大到小；日期上就是由新到舊。", here: "最新訂單排前面。" },
        { term: "LIMIT", meaning: "限制回傳列數。", here: "只取 10 列做安全抽樣。" },
      ],
      thoughtProcess: [
        "先列出主管要看的三個欄位，不要先寫 SELECT *。",
        "把『只保留 delivered』翻成 WHERE 條件。文字值要放在單引號內。",
        "把『最新在前』翻成 ORDER BY 日期 DESC。",
        "最後加 LIMIT 10，避免一次拉出整張大表。",
      ],
      workedExample: {
        title: "相近示範：抽查最新取消訂單",
        context: "使用相同四段結構，但狀態、欄位與列數都不同。",
        sql: "SELECT order_id, order_status\nFROM olist.orders_raw\nWHERE order_status = 'canceled'\nORDER BY order_purchase_timestamp DESC\nLIMIT 5;",
        lineByLine: [
          { code: "SELECT order_id, order_status", explanation: "只輸出抽查需要的欄位。" },
          { code: "WHERE order_status = 'canceled'", explanation: "只留下取消訂單；文字值使用單引號。" },
          { code: "ORDER BY order_purchase_timestamp DESC", explanation: "最新下單時間排最前面。" },
          { code: "LIMIT 5;", explanation: "只查看前 5 筆，適合先驗證。" },
        ],
        resultShape: "最多 5 列；order_status 全部是 canceled，最新日期對應的訂單會排在前面。",
      },
      commonMistakes: [
        "把 canceled 拼成 cancelled；Olist 使用一個 l。",
        "把 ORDER BY 寫在 WHERE 前面。",
        "忘記 DESC，結果變成最舊的訂單在前。",
      ],
    },
    solution: {
      lineByLine: [
        { code: "SELECT order_id, order_status, order_purchase_timestamp", explanation: "交付主管要求的三個欄位。" },
        { code: "FROM olist.orders_raw", explanation: "這些訂單欄位都來自 orders_raw。" },
        { code: "WHERE order_status = 'delivered'", explanation: "只保留已送達訂單。" },
        { code: "ORDER BY order_purchase_timestamp DESC", explanation: "最新下單時間排前。" },
        { code: "LIMIT 10;", explanation: "只取前 10 列作抽查。" },
      ],
      whyItWorks: [
        "WHERE 先縮小資料範圍，ORDER BY 再決定保留下來資料的順序。",
        "LIMIT 放最後，代表排序後只取最前面的 10 筆。",
      ],
      verify: [
        "欄位必須正好是題目要求的三個。",
        "每列 order_status 都是 delivered。",
        "相鄰兩列的 order_purchase_timestamp 應由新到舊。",
      ],
      transfer:
        "請把需求中的狀態、排序方向或列數換一個參數重新口述；能先說出四段結構，再寫 SQL，才是真正掌握。",
    },
  },

  "ch01-q04": {
    lesson: {
      concept: "正確處理缺少或未知的值",
      plainLanguage:
        "NULL（空值）不是文字，也不是 0；它代表資料庫目前不知道或沒有這個值。因此不能使用 = NULL，要使用 IS NULL。",
      analogy:
        "Excel 空白儲存格不等於字串『空白』。客服要找尚未填入送達日的訂單，是在檢查欄位是否缺值，不是在找某個日期。",
      terms: [
        { term: "NULL", meaning: "缺少、未知或尚未記錄的資料值。", here: "尚未記錄實際送達日。" },
        { term: "IS NULL", meaning: "檢查欄位目前是否為 NULL。", here: "找出送達日缺漏的訂單。" },
        { term: "data quality", meaning: "確認資料是否完整、合理、可用。", here: "抽查送達日期缺漏。" },
      ],
      thoughtProcess: [
        "先確認要檢查的是欄位缺值，而不是某個文字或日期。",
        "使用 IS NULL 建立缺漏條件。",
        "仍可使用未顯示在 SELECT 裡的購買時間進行排序。",
        "先取少量最新資料，觀察缺值是否符合商業情境。",
      ],
      workedExample: {
        title: "相近示範：找沒有評論文字的紀錄",
        context: "使用評論表的另一個可為 NULL 的欄位練習。",
        sql: "SELECT review_id, review_score, review_comment_message\nFROM olist.order_reviews_raw\nWHERE review_comment_message IS NULL\nLIMIT 8;",
        lineByLine: [
          { code: "SELECT ... review_comment_message", explanation: "把要檢查的缺值欄位放進結果。" },
          { code: "WHERE review_comment_message IS NULL", explanation: "只保留沒有評論文字的資料。" },
          { code: "LIMIT 8;", explanation: "先看 8 筆，確認條件是否合理。" },
        ],
        resultShape: "最多 8 列；review_comment_message 欄位都顯示 NULL。",
      },
      commonMistakes: [
        "寫成 = NULL，結果抓不到預期資料。",
        "把 'NULL' 放進引號；這會變成普通文字。",
        "把欄位拼成 delivered_date，與真實 schema 不符。",
      ],
    },
    solution: {
      lineByLine: [
        { code: "SELECT order_id, order_status, order_delivered_customer_date", explanation: "輸出訂單識別、狀態與要檢查的送達日期。" },
        { code: "FROM olist.orders_raw", explanation: "三個欄位都位於訂單表。" },
        { code: "WHERE order_delivered_customer_date IS NULL", explanation: "只保留尚未記錄實際送達日的訂單。" },
        { code: "ORDER BY order_purchase_timestamp DESC", explanation: "依購買時間讓最新訂單排前。" },
        { code: "LIMIT 15;", explanation: "只抽查最新 15 筆。" },
      ],
      whyItWorks: [
        "IS NULL 是資料庫檢查缺值的專用寫法。",
        "排序欄不一定要出現在 SELECT 結果中。",
      ],
      verify: [
        "order_delivered_customer_date 每列都應顯示 NULL。",
        "結果不超過 15 列。",
        "看到 NULL 後仍要結合 order_status 判斷它是否真的是異常。",
      ],
      transfer:
        "請用一句話回答：為什麼 = NULL 不適用？如果能說明 NULL 不是一般資料值，就達到 Can Explain 的第一步。",
    },
  },

  "ch01-q05": {
    lesson: {
      concept: "把數值轉成主管看得懂的商業分類",
      plainLanguage:
        "CASE WHEN（條件分類）像 Excel IF：從上往下檢查條件，第一個成立的條件決定輸出。END 表示分類規則結束，AS 替新分類欄命名。",
      analogy:
        "客服主管不想逐筆解讀 1–5 分，所以你建立『負面／中立／正面』欄位。原始分數保留，新欄位只是報表上的分類，不會修改資料庫。",
      terms: [
        { term: "CASE WHEN", meaning: "依條件產生新的結果值。", here: "把 review_score 轉成服務等級。" },
        { term: "THEN", meaning: "條件成立時回傳什麼。", here: "回傳 negative 或 neutral。" },
        { term: "ELSE", meaning: "前面條件都不成立時的預設結果。", here: "4–5 分回傳 positive。" },
        { term: "END AS", meaning: "結束 CASE 並命名新欄位。", here: "建立 review_group。" },
      ],
      thoughtProcess: [
        "先把商業規則依順序寫成人話：1–2、3、其餘。",
        "從最明確的條件開始；CASE 只會採用第一個成立的分支。",
        "保留原始 review_score，方便核對分類結果。",
        "排序並抽樣，確認每一種分數都落在正確分類。",
      ],
      workedExample: {
        title: "相近示範：把運費分成高低兩級",
        context: "使用不同資料表與門檻，練習 CASE 的基本形狀。",
        sql: "SELECT order_id, freight_value,\n  CASE\n    WHEN freight_value >= 50 THEN 'high'\n    ELSE 'standard'\n  END AS freight_group\nFROM olist.order_items_raw\nORDER BY freight_value DESC\nLIMIT 10;",
        lineByLine: [
          { code: "CASE WHEN freight_value >= 50", explanation: "先檢查運費是否達到高運費門檻。" },
          { code: "THEN 'high' ELSE 'standard'", explanation: "成立回傳 high，否則回傳 standard。" },
          { code: "END AS freight_group", explanation: "結束規則並命名新分類欄。" },
          { code: "ORDER BY ... LIMIT 10", explanation: "先查看運費最高的 10 筆來核對。" },
        ],
        resultShape: "原始 freight_value 與新 freight_group 同時顯示，可以逐列對帳。",
      },
      commonMistakes: [
        "CASE 寫完忘記 END。",
        "條件順序重疊，前面的規則先吃掉後面的資料。",
        "文字分類沒有使用單引號。",
      ],
    },
    solution: {
      lineByLine: [
        { code: "SELECT review_id, review_score,", explanation: "保留評論識別與原始分數，方便驗證。" },
        { code: "WHEN review_score <= 2 THEN 'negative'", explanation: "1–2 分先分類為負面。" },
        { code: "WHEN review_score = 3 THEN 'neutral'", explanation: "3 分單獨分類為中立。" },
        { code: "ELSE 'positive'", explanation: "剩下的 4–5 分分類為正面。" },
        { code: "END AS review_group", explanation: "結束規則並建立 review_group。" },
        { code: "ORDER BY review_score, review_id LIMIT 20;", explanation: "依分數與識別排序後抽查 20 筆。" },
      ],
      whyItWorks: [
        "規則由上往下且互不矛盾，每個分數只會取得一個分類。",
        "ELSE 涵蓋 4–5 分，但若資料可能超出 1–5，正式工作還要額外驗證異常值。",
      ],
      verify: [
        "1–2 分只能是 negative。",
        "3 分只能是 neutral。",
        "4–5 分只能是 positive。",
      ],
      transfer:
        "不要背整段 CASE。先把任何新規則寫成『如果／否則如果／否則』三行中文，再翻成 WHEN／THEN／ELSE。",
    },
  },

  "ch01-q06": {
    lesson: {
      concept: "從白紙拆解一個完整的單表需求",
      plainLanguage:
        "章末挑戰不再告訴你要使用哪些關鍵字。分析師先把需求拆成 output（輸出）、source（來源）、filter（篩選）、sort（排序）與 row limit（列數限制），再依順序組成 SQL。",
      analogy:
        "稽核交辦『看最高金額的高價明細』，就像你先在 Excel 決定要顯示哪些欄、套什麼篩選、怎麼排序、抽查幾筆，而不是從公式開始猜。",
      terms: [
        { term: "output", meaning: "主管最後要看到的欄位。", here: "order_id、product_id、seller_id、price、freight_value。" },
        { term: "filter", meaning: "哪些資料列符合範圍。", here: "price 至少 1000。" },
        { term: "sort", meaning: "結果的優先順序。", here: "price 最高的排前。" },
        { term: "validation", meaning: "用結果證明查詢符合需求。", here: "核對欄數、價格門檻、排序與列數。" },
      ],
      thoughtProcess: [
        "先在編輯器註解區寫五個輸出欄位。",
        "確認這些欄位都在 order_items_raw，不需要 JOIN。",
        "把『至少 1,000』翻成 price >= 1000。",
        "把『最高金額優先』翻成 price DESC。",
        "最後只取 12 列，並逐項驗證。",
      ],
      workedExample: {
        title: "相近示範：抽查高運費訂單明細",
        context: "示範完整拆解流程，但使用不同欄位、門檻與列數。",
        sql: "SELECT order_id, product_id, freight_value\nFROM olist.order_items_raw\nWHERE freight_value >= 100\nORDER BY freight_value DESC\nLIMIT 6;",
        lineByLine: [
          { code: "SELECT order_id, product_id, freight_value", explanation: "先交付稽核需要的三個欄位。" },
          { code: "FROM olist.order_items_raw", explanation: "欄位都在明細表，不需要串接其他表。" },
          { code: "WHERE freight_value >= 100", explanation: "只保留達到高運費門檻的資料。" },
          { code: "ORDER BY freight_value DESC", explanation: "最高運費排前。" },
          { code: "LIMIT 6;", explanation: "只取前 6 筆做稽核抽查。" },
        ],
        resultShape: "3 欄、最多 6 列；freight_value 全部至少 100 且由高到低。",
      },
      commonMistakes: [
        "一看到 order_id 就誤以為需要 JOIN；先確認欄位是否已在同一張表。",
        "把 >= 寫成 >，漏掉剛好等於門檻的資料。",
        "先 LIMIT 再想排序，抽到的可能不是最高金額。",
      ],
    },
    solution: {
      lineByLine: [
        { code: "SELECT order_id, product_id, seller_id, price, freight_value", explanation: "輸出題目指定的五個訂單明細欄位。" },
        { code: "FROM olist.order_items_raw", explanation: "所有欄位都在同一張訂單明細表。" },
        { code: "WHERE price >= 1000", explanation: "包含價格剛好等於 1000 的資料。" },
        { code: "ORDER BY price DESC, order_id", explanation: "價格由高到低；同價時用 order_id 提供穩定順序。" },
        { code: "LIMIT 12;", explanation: "只取最高金額的 12 筆。" },
      ],
      whyItWorks: [
        "查詢只使用一張表，避免不必要的 JOIN 複雜度。",
        "WHERE、ORDER BY、LIMIT 分別控制範圍、優先順序與交付列數。",
      ],
      verify: [
        "結果必須是 5 欄且不超過 12 列。",
        "每一列 price 都要大於或等於 1000。",
        "price 應由高到低；同價時 order_id 順序穩定。",
      ],
      transfer:
        "這是章末能力證據。看過答案後只能算引導完成；Chapter 1 要達到獨立掌握，仍需在不看答案、提示不超過第 1 階的情況下完成新的變形題。",
    },
  },
};
