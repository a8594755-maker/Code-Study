// Each activity teaches the operators it actually asks the learner to use.
const concepts = {
  SELECT: "SELECT 決定結果要顯示哪些欄位。多欄位用逗號分隔；FROM 後寫完整資料來源：業務表使用 olist.表名，資料目錄使用 information_schema.表名。",
  schema: "資料目錄是資料的清單。information_schema.tables 的 table_name 是表名，table_schema 是所屬分組，table_type 用來分辨資料表和 view。",
  WHERE: "WHERE 是逐列篩選，像 Excel 篩選器。欄名不加單引號，文字值要用單引號；符合條件的列才會保留。",
  COUNT: "COUNT(*) 把全部資料列變成一個總數，不是顯示明細。沒有 GROUP BY 時得到 1 列；AS 後指定同事看得懂的欄名。",
  LIMIT: "LIMIT 限制最後顯示幾列，不是計算總數。明細抽查要搭配 ORDER BY，才能固定抽查範圍。",
  AS: "AS 是輸出別名，像在 Excel 報表改欄標，不會修改資料庫的原欄名。",
  "ORDER BY": "ORDER BY 控制顯示順序；ASC 升冪是預設，DESC 降冪。多個排序欄位依序用來處理相同值。",
  DESC: "DESC 從大到小排。不同欄位可以各自設定方向，不能只在最後寫 DESC 就認為全部都倒序。",
  IN: "IN ('SP', 'RJ') 表示符合其中任一文字值，等同兩個等號條件用 OR 連接。",
  AND: "AND 要左右條件都成立。混用 OR 時加括號，把主管要的資料範圍先說清楚。",
  date: "有時分秒的日期區間，用起點 >= 與下一段起點 <。這樣會涵蓋最後一天，而不把下一段資料混進來。",
  LIKE: "LIKE 'sao%' 的 % 代表後面任意文字；這是字串規則，不是地理範圍。",
  NULL: "NULL 表示未知，不是 0 或空字串。用 IS NULL／IS NOT NULL；= NULL 不會得到一般等號比較的結果。",
  DISTINCT: "DISTINCT 讓指定的值或欄位組合不重複。COUNT(DISTINCT 欄位) 計算不同且非空的值，不會刪除原資料。",
  grain: "grain 是一列代表的單位。先分清資料列、不同 ID 與業務上的實體，才能解釋計數。",
  CASE: "CASE WHEN 條件 THEN 結果 ELSE 其他結果 END 按順序判斷，像 Excel IF。先接住未知值，再判斷門檻。",
  CAST: "::numeric 把可轉換的文字當數字處理。先確認型態與非法值；轉型不是清除錯誤資料。",
  ROUND: "ROUND(數字, 2) 顯示到小數第二位。這是輸出精度，不會自動定義金額是不是含稅、含運或獲利。",
};
export function activityTeaching(activity) {
  if (activity.tool === "python") return [...(activity.toolLesson || []), ...activity.explanation];
  if (activity.tool === "powerbi") return activity.steps;
  return [...new Set(activity.tags.map((tag) => concepts[tag]).filter(Boolean)), ...activity.explanation];
}
