// Only public lesson data and code enter this worker, never auth tokens/secrets.
// This is a learner-side runtime, not trusted server-side grading evidence.
const ROOT = "https://cdn.jsdelivr.net/pyodide/v314.0.6/full/";
self.onmessage = async ({ data }) => {
  let output = "";
  const started = performance.now();
  try {
    if (JSON.stringify(data).length > 2000000) throw new Error("資料超過 2 MB，請先用 SQL 彙總或縮小範圍。");
    self.postMessage({ type: "loading", message: "首次載入 Python、pandas 與 numpy，需要下載執行環境…" });
    const { loadPyodide } = await import(`${ROOT}pyodide.mjs`);
    const runtime = await loadPyodide({ indexURL: ROOT });
    await runtime.loadPackage(["pandas", "numpy"]);
    // Package download and first Python imports are environment startup, not
    // learner execution. Keep them under the 120s load budget, before the UI
    // starts its 20s code timeout (cold pandas/numpy imports can be expensive).
    self.postMessage({ type: "loading", message: "正在初始化 pandas 與 numpy；尚未執行你的程式…" });
    await runtime.runPythonAsync("import json, pandas as pd, numpy as np, traceback");
    runtime.setStdout({ batched: (line) => { output = (output + line + "\n").slice(0, 10000); } });
    runtime.setStderr({ batched: (line) => { output = (output + line + "\n").slice(0, 10000); } });
    runtime.globals.set("workflow_payload", JSON.stringify(data));
    self.postMessage({ type: "running", message: "正在執行 pandas；每次使用全新環境。" });
    const serialized = await runtime.runPythonAsync(`
payload = json.loads(workflow_payload)
tables = {name: pd.DataFrame(value['rows'], columns=value['columns']) for name, value in payload['datasets'].items()}
namespace = {'pd': pd, 'np': np, 'tables': tables, 'df': tables['main'].copy()}
try:
    exec(payload['code'], namespace)
    if 'result' not in namespace:
        raise ValueError('請把要顯示的 DataFrame 指定給 result，例如 result = df.head(10)')
    result = namespace['result']
    if isinstance(result, pd.Series):
        result = result.to_frame()
    if not isinstance(result, pd.DataFrame):
        raise TypeError('result 必須是 DataFrame 或 Series；純文字請使用 print()')
    if len(result.columns) > 60:
        raise ValueError('成果最多 60 欄，請只保留交付需要的欄位')
    result = result.copy()
    result.columns = result.columns.map(str)
    if result.columns.duplicated().any():
        raise ValueError('結果欄名重複，請先重新命名再交付')
    rows = json.loads(result.head(100).to_json(orient='records', date_format='iso'))
    reply = {'status': 'succeeded', 'rows': rows, 'columns': list(result.columns), 'rowCount': len(result), 'truncated': len(result) > 100}
except Exception:
    reply = {'status': 'failed', 'error': traceback.format_exc(limit=5), 'rows': [], 'columns': [], 'rowCount': 0}
json.dumps(reply)
`);
    const result = JSON.parse(serialized);
    if (serialized.length > 180000) throw new Error("輸出文字過大，請縮小 result 的列數或欄位。");
    self.postMessage({ type: "result", ...result, stdout: output, durationMs: Math.round(performance.now() - started) });
  } catch (error) {
    self.postMessage({ type: "result", status: "failed", error: String(error.message || error), rows: [], columns: [], rowCount: 0, stdout: output, durationMs: Math.round(performance.now() - started) });
  }
};
