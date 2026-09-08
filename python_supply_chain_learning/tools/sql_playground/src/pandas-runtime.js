export function executePandas({ code, datasets, onStatus, onResult }) {
  const worker = new Worker("/pandas-worker.mjs", { type: "module" });
  let ended = false;
  const started = performance.now();
  let timer;
  const finish = (result) => {
    if (ended) return;
    ended = true; clearTimeout(timer); worker.terminate(); onResult(result);
  };
  const stop = (error) => finish({ status: "failed", error, rows: [], columns: [], rowCount: 0, durationMs: Math.round(performance.now() - started) });
  timer = setTimeout(() => stop("Python 載入超時。請確認能連到 jsDelivr，或下載 Notebook 在本機執行。"), 120000);
  worker.onmessage = ({ data }) => {
    if (data.type === "result") finish(data);
    else {
      onStatus(data.message);
      if (data.type === "running") {
        clearTimeout(timer); timer = setTimeout(() => stop("執行超過 20 秒，已停止。檢查是否無限迴圈，或先縮小資料範圍。"), 20000);
      }
    }
  };
  worker.onerror = () => stop("Python 背景執行環境載入失敗，可能是網路或瀏覽器限制。可重試或下載 Notebook。 ");
  worker.postMessage({ code, datasets });
  return () => stop("使用者已停止這次執行；不是 SQL／pandas 能力的零分。");
}

export function pythonHelp(error = "") {
  if (/KeyError/.test(error)) return "欄位不存在。先看 df.columns 或資料預覽，再核對引號中的欄名；若用的是另一份資料，請使用 tables['資料集名稱']。";
  if (/SyntaxError|IndentationError/.test(error)) return "這是 Python 語法或縮排問題。看錯誤最後標示的位置，檢查括號、引號、冒號與縮排；先修正這一行再執行。完整示範可以隨時展開。";
  if (/AssertionError|MergeError/.test(error)) return "驗證條件沒有通過，不一定是程式寫錯。先檢查鍵的重複／缺值、資料範圍與列數；不要刪掉 assert 來掩蓋資料問題。";
  if (/TypeError|ValueError/.test(error)) return "先確認資料型態與 result 的形狀。日期用 pd.to_datetime，金額用 pd.to_numeric；無法轉換的值應另外列出調查，不能一律改成零。";
  return "先讀錯誤最後一行，縮小到 df.head() 測試輸入是否正確，再逐段加入程式。可以查看完整示範與『為什麼這樣做』；這次錯誤不計零分。";
}
