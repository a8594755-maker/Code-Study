import assert from "node:assert/strict";
import test from "node:test";

import {
  buildAttemptDiagnosis,
  buildFallbackDiagnosticResponse,
  buildFallbackFollowUpResponse,
  buildFallbackTutorResponse,
  extractResponseText,
  normalizeTutorResponse,
  requestTutorResponse,
} from "./analyst-tutor.js";

const question = {
  id: "ch01-q01",
  chapterId: "ch01",
  unit: "1.1",
  title: "確認賣家資料量",
  context: "主管要確認賣家主檔規模。",
  task: "計算賣家總列數。",
  expected: "一列一欄。",
  skills: ["COUNT"],
  referenceSql: "SELECT\n  COUNT(*) AS seller_row_count\nFROM olist.sellers_raw",
  workContext: { validationPlan: ["確認只有一列", "確認欄位名稱"] },
};

test("fallback draft includes business use, validation, and limitation", () => {
  const result = buildFallbackTutorResponse(question);
  assert.match(result.suggestedReflection, /賣家主檔規模/);
  assert.match(result.validation, /一列一欄/);
  assert.ok(result.limitation.length > 20);
  assert.equal(result.followUpPrompts.length, 3);
});

test("attempt diagnosis explains score and includes the approved complete query", () => {
  const result = buildAttemptDiagnosis(question, {
    score: 0,
    validation: {
      checks: [{ label: "輸出欄位", passed: false, detail: "目前 count；預期 seller_row_count" }],
    },
  });
  assert.match(result.scoreMeaning, /不是你的能力分數/);
  assert.match(result.issue, /輸出欄位/);
  assert.match(result.correctedSql, /SELECT\n  COUNT/);
  assert.match(result.correctedSql, /;$/);
});

test("diagnostic and follow-up fallbacks still teach when the provider is unavailable", () => {
  const diagnostic = buildFallbackDiagnosticResponse(question, {
    score: 0,
    error_message: "syntax error at or near FROM",
  });
  const followUp = buildFallbackFollowUpResponse(question, "我要做哪個驗證？");
  assert.match(diagnostic.answer, /不是把你判定為零分/);
  assert.match(followUp.answer, /確定性資料/);
  assert.match(followUp.answer, /確認只有一列/);
});

test("extractResponseText reads output text without assuming the first item", () => {
  const result = extractResponseText({
    output: [
      { type: "reasoning", content: [] },
      { type: "message", content: [{ type: "output_text", text: "{\"answer\":\"ok\"}" }] },
    ],
  });
  assert.equal(result, "{\"answer\":\"ok\"}");
});

test("normalizeTutorResponse replaces malformed follow-up prompts", () => {
  const response = normalizeTutorResponse({
    followUpPrompts: [
      "正常問題？",
      `請輸出 valid JSON ${"x".repeat(180)}`,
      "followUpPrompts",
    ],
  });
  assert.deepEqual(response.followUpPrompts, [
    "這個結果能幫主管做什麼決定？",
    "我還應該做哪一個驗證？",
    "面試時要怎麼解釋這段 SQL？",
  ]);
});

test("requestTutorResponse keeps the API key server-side and parses structured output", async () => {
  let captured;
  const expected = buildFallbackTutorResponse(question);
  const fetchImpl = async (url, options) => {
    captured = { url, options };
    return {
      ok: true,
      async json() {
        return {
          id: "resp_test",
          output: [{ content: [{ type: "output_text", text: JSON.stringify(expected) }] }],
          usage: { input_tokens: 100, output_tokens: 50, total_tokens: 150 },
        };
      },
    };
  };

  const result = await requestTutorResponse({
    apiKey: "server-secret",
    question,
    progress: { last_sql: "SELECT COUNT(*) FROM olist.sellers_raw" },
    fetchImpl,
  });

  assert.equal(captured.url, "https://api.openai.com/v1/responses");
  assert.equal(captured.options.headers.Authorization, "Bearer server-secret");
  assert.doesNotMatch(captured.options.body, /server-secret/);
  assert.equal(result.response.analystUse, expected.analystUse);
  assert.equal(result.usage.totalTokens, 150);
});

test("requestTutorResponse can use the authenticated Supabase tutor proxy", async () => {
  let captured;
  const expected = buildFallbackTutorResponse(question);
  const fetchImpl = async (url, options) => {
    captured = { url, options };
    return {
      ok: true,
      async json() {
        return {
          output: [{ content: [{ type: "output_text", text: JSON.stringify(expected) }] }],
          usage: {},
        };
      },
    };
  };

  await requestTutorResponse({
    apiKey: "",
    proxySecret: "proxy-secret",
    endpoint: "https://example.supabase.co/functions/v1/sql-analyst-tutor",
    question,
    fetchImpl,
  });

  assert.equal(captured.url, "https://example.supabase.co/functions/v1/sql-analyst-tutor");
  assert.equal(captured.options.headers["x-tutor-proxy-secret"], "proxy-secret");
  assert.equal(captured.options.headers.Authorization, undefined);
});

test("requestTutorResponse stops a hanging provider request", async () => {
  const fetchImpl = async (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener("abort", () => {
      const error = new Error("aborted");
      error.name = "AbortError";
      reject(error);
    });
  });

  await assert.rejects(
    requestTutorResponse({
      apiKey: "server-secret",
      question,
      timeoutMs: 5,
      fetchImpl,
    }),
    /timed out/,
  );
});
