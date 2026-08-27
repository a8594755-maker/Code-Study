import assert from "node:assert/strict";
import test from "node:test";
import { evaluateResult } from "./evaluator.js";

test("accepts the same result when row order is not required", () => {
  const result = evaluateResult(
    { ordered: false },
    { rows: [{ state: "RJ", count: 2 }, { state: "SP", count: 5 }] },
    { rows: [{ state: "SP", count: 5 }, { state: "RJ", count: 2 }] },
  );
  assert.equal(result.passed, true);
  assert.equal(result.score, 100);
});

test("rejects an incorrect order when order matters", () => {
  const result = evaluateResult(
    { ordered: true },
    { rows: [{ value: 1 }, { value: 2 }] },
    { rows: [{ value: 2 }, { value: 1 }] },
  );
  assert.equal(result.passed, false);
  assert.equal(result.checks.at(-1).passed, false);
});

test("reports column differences", () => {
  const result = evaluateResult(
    { ordered: false },
    { rows: [{ wrong_alias: 5 }] },
    { rows: [{ seller_count: 5 }] },
  );
  assert.equal(result.passed, false);
  assert.equal(result.checks[0].passed, false);
});

test("validates aliases even when the correct result contains zero rows", () => {
  const question = {
    ordered: true,
    referenceSql:
      "SELECT order_id, payment_sequential, COUNT(*) AS duplicate_count FROM olist.order_payments_raw GROUP BY order_id, payment_sequential HAVING COUNT(*) > 1",
  };
  const correct = evaluateResult(
    question,
    { rows: [] },
    { rows: [] },
    "SELECT order_id, payment_sequential, COUNT(*) AS duplicate_count FROM olist.order_payments_raw GROUP BY order_id, payment_sequential HAVING COUNT(*) > 1",
  );
  const wrong = evaluateResult(
    question,
    { rows: [] },
    { rows: [] },
    "SELECT order_id AS wrong_name, payment_sequential, COUNT(*) AS duplicate_count FROM olist.order_payments_raw GROUP BY order_id, payment_sequential HAVING COUNT(*) > 1",
  );
  assert.equal(correct.passed, true);
  assert.equal(wrong.checks[0].passed, false);
});
