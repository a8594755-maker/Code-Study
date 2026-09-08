import { parseWithComments } from "pgsql-ast-parser";

const mutationTypes = new Set([
  "insert",
  "update",
  "delete",
  "truncate",
  "create table",
  "create schema",
  "create extension",
  "create index",
  "alter table",
  "drop table",
  "drop schema",
  "drop index",
  "grant",
  "revoke",
]);

const blockedFunctions = new Set([
  "dblink_exec",
  "lo_export",
  "lo_import",
  "pg_cancel_backend",
  "pg_log_backend_memory_contexts",
  "pg_ls_dir",
  "pg_notify",
  "pg_read_binary_file",
  "pg_read_file",
  "pg_reload_conf",
  "pg_rotate_logfile",
  "pg_sleep",
  "pg_sleep_for",
  "pg_sleep_until",
  "pg_stat_file",
  "pg_terminate_backend",
  "set_config",
]);

function findMutationNode(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) {
    return null;
  }

  seen.add(value);

  if (typeof value.type === "string" && mutationTypes.has(value.type)) {
    return value.type;
  }

  for (const child of Object.values(value)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const match = findMutationNode(item, seen);
        if (match) return match;
      }
    } else {
      const match = findMutationNode(child, seen);
      if (match) return match;
    }
  }

  return null;
}

function collectCteNames(value, names = new Set(), seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return names;
  seen.add(value);

  if (value.type === "with" && Array.isArray(value.bind)) {
    for (const binding of value.bind) {
      if (binding.alias?.name) names.add(binding.alias.name.toLowerCase());
    }
  }

  for (const child of Object.values(value)) {
    if (Array.isArray(child)) {
      for (const item of child) collectCteNames(item, names, seen);
    } else {
      collectCteNames(child, names, seen);
    }
  }

  return names;
}

function findDisallowedTable(value, allowedSchemas, cteNames, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return null;
  seen.add(value);

  if (value.type === "table" && value.name?.name) {
    const tableName = value.name.name;
    const tableSchema = value.name.schema?.toLowerCase();

    if (tableSchema && !allowedSchemas.has(tableSchema)) {
      return `${value.name.schema}.${tableName}`;
    }

    if (!tableSchema && !cteNames.has(tableName.toLowerCase())) {
      return tableName;
    }
  }

  for (const child of Object.values(value)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const match = findDisallowedTable(item, allowedSchemas, cteNames, seen);
        if (match) return match;
      }
    } else {
      const match = findDisallowedTable(child, allowedSchemas, cteNames, seen);
      if (match) return match;
    }
  }

  return null;
}

function findBlockedFunction(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return null;
  seen.add(value);

  if (value.type === "call" && value.function?.name) {
    const functionName = value.function.name.toLowerCase();
    if (
      blockedFunctions.has(functionName) ||
      functionName.startsWith("pg_advisory_") ||
      functionName.startsWith("pg_try_advisory_")
    ) {
      return functionName;
    }
  }

  for (const child of Object.values(value)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const match = findBlockedFunction(item, seen);
        if (match) return match;
      }
    } else {
      const match = findBlockedFunction(child, seen);
      if (match) return match;
    }
  }

  return null;
}

export class QueryPolicyError extends Error {
  constructor(message) {
    super(message);
    this.name = "QueryPolicyError";
  }
}

export function validateReadOnlySql(
  input,
  { allowedSchemas = ["olist", "information_schema"] } = {},
) {
  const sql = typeof input === "string" ? input.trim() : "";

  if (!sql) {
    throw new QueryPolicyError("請先寫一段 SQL，再按 Run Query。");
  }

  let statements, comments;
  try {
    ({ ast: statements, comments } = parseWithComments(sql));
  } catch (error) {
    const location = String(error.message || "").match(/line\s+(\d+)\s+col\s+(\d+)/i);
    const unexpected = String(error.message || "").match(/Unexpected\s+[^\s]+\s+token:\s+"([^"]+)"/i);
    const locationText = location
      ? `（第 ${location[1]} 行、第 ${location[2]} 個字元附近）`
      : "";
    const tokenText = unexpected ? `，在「${unexpected[1]}」前後無法接續` : "";
    throw new QueryPolicyError(
      `SQL 語法無法解析${locationText}${tokenText}。請檢查函數括號中是否有 *、欄位或 DISTINCT 欄位，以及逗號與右括號是否完整。`,
    );
  }

  if (statements.length !== 1) {
    throw new QueryPolicyError("一次只能執行一個完整的 SQL statement（指令）。");
  }

  const statement = statements[0];
  const mutation = findMutationNode(statement);

  const isReadOnlyStatement =
    statement.type === "select" ||
    (statement.type === "with" && statement.in?.type === "select");

  if (mutation || !isReadOnlyStatement) {
    throw new QueryPolicyError(
      "這個練習場只允許 SELECT 或 WITH ... SELECT；資料修改指令已被阻擋。",
    );
  }

  if (statement.into) {
    throw new QueryPolicyError("SELECT INTO 會建立資料表，因此不允許執行。");
  }

  const blockedFunction = findBlockedFunction(statement);
  if (blockedFunction) {
    throw new QueryPolicyError(
      `不允許使用 ${blockedFunction}()；這個 function 不屬於分析練習的唯讀範圍。`,
    );
  }

  const normalizedAllowedSchemas = new Set(
    allowedSchemas.map((name) => name.toLowerCase()),
  );
  const cteNames = collectCteNames(statement);
  const disallowedTable = findDisallowedTable(
    statement,
    normalizedAllowedSchemas,
    cteNames,
  );

  if (disallowedTable) {
    throw new QueryPolicyError(
      `不允許讀取 ${disallowedTable}。請使用完整表名，且只查詢 olist 或 information_schema。`,
    );
  }

  // Preserve the learner's raw SQL in logs, but do not send comments to the
  // legacy RPC's text-based guard. Use lexer locations, never a comment regex
  // that could corrupt quoted strings or conceal a second statement.
  let executable = sql;
  for (const { _location: { start, end } } of [...comments].sort((a, b) => b._location.start - a._location.start)) {
    executable = executable.slice(0, start) + executable.slice(start, end).replace(/[^\r\n]/g, " ") + executable.slice(end);
  }
  return executable.trim().replace(/;\s*$/, "");
}
