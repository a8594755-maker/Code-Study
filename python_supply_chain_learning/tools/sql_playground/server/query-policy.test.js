import assert from "node:assert/strict";
import test from "node:test";
import { QueryPolicyError, validateReadOnlySql } from "./query-policy.js";

test("allows one SELECT statement", () => {
  assert.equal(
    validateReadOnlySql("SELECT order_id FROM olist.orders_raw LIMIT 5;"),
    "SELECT order_id FROM olist.orders_raw LIMIT 5",
  );
});

test("execution normalization removes real comments, preserves literals and still rejects stacked SQL", () => {
  assert.equal(validateReadOnlySql("SELECT 1; -- 我的新備註"), "SELECT 1");
  assert.equal(validateReadOnlySql("-- 準備盤點\nSELECT 1; /* update is only a note */"), "SELECT 1");
  assert.equal(validateReadOnlySql("SELECT '-- not a comment /* either */' AS note; -- 真註解"), "SELECT '-- not a comment /* either */' AS note");
  assert.match(validateReadOnlySql("SELECT/* note */1;"), /^SELECT\s+1$/);
  assert.throws(() => validateReadOnlySql("SELECT 1; -- 註解\nSELECT 2;"), /一次只能/);
  assert.throws(() => validateReadOnlySql("SELECT 1; /* no-op */ DELETE FROM olist.orders_raw;"), /一次只能/);
});

test("allows a WITH query that ends in SELECT", () => {
  const sql = "WITH recent AS (SELECT * FROM olist.orders_raw LIMIT 5) SELECT * FROM recent;";
  assert.equal(validateReadOnlySql(sql), sql.slice(0, -1));
});

test("allows information_schema and CTE references", () => {
  assert.doesNotThrow(() =>
    validateReadOnlySql("SELECT table_name FROM information_schema.tables;"),
  );
  assert.doesNotThrow(() =>
    validateReadOnlySql(
      "WITH recent AS (SELECT * FROM olist.orders_raw LIMIT 5) SELECT * FROM recent;",
    ),
  );
});

test("blocks UPDATE", () => {
  assert.throws(
    () => validateReadOnlySql("UPDATE olist.orders_raw SET order_status = 'x';"),
    QueryPolicyError,
  );
});

test("blocks a mutating CTE even when it ends in SELECT", () => {
  assert.throws(
    () =>
      validateReadOnlySql(
        "WITH changed AS (UPDATE olist.orders_raw SET order_status = 'x' RETURNING *) SELECT * FROM changed;",
      ),
    QueryPolicyError,
  );
});

test("blocks multiple statements", () => {
  assert.throws(
    () => validateReadOnlySql("SELECT 1; SELECT 2;"),
    /一次只能執行一個/,
  );
});

test("blocks unqualified and non-course schemas", () => {
  assert.throws(
    () => validateReadOnlySql("SELECT * FROM orders_raw LIMIT 5;"),
    /完整表名/,
  );
  assert.throws(
    () => validateReadOnlySql("SELECT * FROM auth.users LIMIT 5;"),
    /不允許讀取 auth.users/,
  );
});

test("blocks PostgreSQL functions with server side effects", () => {
  assert.throws(
    () => validateReadOnlySql("SELECT pg_sleep(10);"),
    /不允許使用 pg_sleep/,
  );
  assert.throws(
    () => validateReadOnlySql("SELECT pg_catalog.pg_terminate_backend(123);"),
    /不允許使用 pg_terminate_backend/,
  );
});

test("blocks blank input", () => {
  assert.throws(() => validateReadOnlySql("   "), /請先寫一段 SQL/);
});

test("turns parser internals into a short beginner-friendly syntax message", () => {
  assert.throws(
    () => validateReadOnlySql("SELECT COUNT( FROM olist.order_reviews_raw;"),
    (error) => {
      assert.match(error.message, /第 1 行/);
      assert.match(error.message, /函數括號/);
      assert.doesNotMatch(error.message, /expecting to see one of the following/);
      return true;
    },
  );
});
