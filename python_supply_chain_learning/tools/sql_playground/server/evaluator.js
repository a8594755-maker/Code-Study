import { parse } from "pgsql-ast-parser";

function normalizeScalar(value) {
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return String(value);
    return Number(value.toFixed(8));
  }
  return value;
}

function canonicalRow(row) {
  return JSON.stringify(
    Object.fromEntries(
      Object.keys(row || {})
        .sort()
        .map((key) => [key, normalizeScalar(row[key])]),
    ),
  );
}

function columnsOf(rows) {
  const columns = new Set();
  for (const row of rows) {
    for (const key of Object.keys(row || {})) columns.add(key);
  }
  return [...columns].sort();
}

function columnsFromSql(sql) {
  try {
    const statement = parse(sql)[0];
    const select = statement?.type === "with" ? statement.in : statement;
    if (!Array.isArray(select?.columns)) return [];
    return select.columns
      .map((column) => column.alias?.name || (column.expr?.type === "ref" ? column.expr.name : null))
      .filter(Boolean)
      .sort();
  } catch {
    return [];
  }
}

function equalArrays(left, right) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

export function evaluateResult(question, studentResult, referenceResult, studentSql = "") {
  const studentRows = Array.isArray(studentResult?.rows) ? studentResult.rows : [];
  const referenceRows = Array.isArray(referenceResult?.rows) ? referenceResult.rows : [];
  const studentColumns = studentRows.length
    ? columnsOf(studentRows)
    : columnsFromSql(studentSql);
  const referenceColumns = referenceRows.length
    ? columnsOf(referenceRows)
    : columnsFromSql(question.referenceSql);

  const columnCheck = equalArrays(studentColumns, referenceColumns);
  const rowCountCheck = studentRows.length === referenceRows.length;

  let studentCanonical = studentRows.map(canonicalRow);
  let referenceCanonical = referenceRows.map(canonicalRow);
  if (!question.ordered) {
    studentCanonical = studentCanonical.sort();
    referenceCanonical = referenceCanonical.sort();
  }
  const valueCheck = equalArrays(studentCanonical, referenceCanonical);

  const checks = [
    {
      id: "columns",
      label: "輸出欄位",
      passed: columnCheck,
      detail: columnCheck
        ? "欄位符合題目要求。"
        : `目前：${studentColumns.join(", ") || "無欄位"}；預期：${referenceColumns.join(", ") || "無欄位"}`,
    },
    {
      id: "row_count",
      label: "結果列數",
      passed: rowCountCheck,
      detail: rowCountCheck
        ? `列數正確（${studentRows.length}）。`
        : `目前 ${studentRows.length} 列，預期 ${referenceRows.length} 列。`,
    },
    {
      id: question.ordered ? "values_and_order" : "values",
      label: question.ordered ? "數值與排序" : "結果數值",
      passed: valueCheck,
      detail: valueCheck
        ? question.ordered
          ? "數值與排列順序正確。"
          : "結果數值正確。"
        : question.ordered
          ? "部分數值或排序仍與需求不同。"
          : "部分結果數值仍與需求不同。",
    },
  ];

  const passedCount = checks.filter((check) => check.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    passed: checks.every((check) => check.passed),
    score,
    checks,
    expectedRowCount: referenceRows.length,
  };
}
