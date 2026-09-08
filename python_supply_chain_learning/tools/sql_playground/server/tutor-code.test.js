import test from "node:test";
import assert from "node:assert/strict";
import { applicableTutorCode, lineChanges } from "../src/tutor-code.js";

test("only complete read-only SQL suggestions can be offered to the SQL editor", () => {
  assert.equal(applicableTutorCode("sql", "sql", "FROM customers_raw") , null);
  assert.equal(applicableTutorCode("sql", "sql", "UPDATE olist.orders_raw SET x = 1"), null);
  assert.equal(applicableTutorCode("powerbi", "dax", "Rows = COUNTROWS(Data)"), null);
  assert.equal(applicableTutorCode("python", "sql", "SELECT 1;"), null);
  assert.deepEqual(applicableTutorCode("sql", "css", "SELECT *\nFROM olist.customers_raw\nLIMIT 50;"), {
    language: "sql", code: "SELECT *\nFROM olist.customers_raw\nLIMIT 50;",
  });
  assert.deepEqual(applicableTutorCode("python", "pandas", "df.head()"), {
    language: "python", code: "df.head()",
  });
});

test("line comparison identifies separate changes with original and new line numbers", () => {
  assert.deepEqual(lineChanges("SELECT *\nFROM customers_raw\nLIMIT 50;", "SELECT *\nFROM olist.customers_raw\nWHERE customer_state = 'VA'\nLIMIT 50;"), [
    { beforeLine: 2, afterLine: 2, removed: ["FROM customers_raw"], added: ["FROM olist.customers_raw", "WHERE customer_state = 'VA'"] },
  ]);
  assert.deepEqual(lineChanges("SELECT 1;", "SELECT 1;"), []);
});
