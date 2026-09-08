import test from "node:test";
import assert from "node:assert/strict";
import { createAuthReadiness, hasPublicSupabaseConfig } from "./auth-readiness.js";

const url = "https://auth-test.invalid";
const jwt = (role) => `test.${Buffer.from(JSON.stringify({ role })).toString("base64url")}.test`;
const key = jwt("anon");

test("only public keys are eligible for browser configuration", () => {
  for (const value of ["", "********************", "replace_with_supabase_anon_key", "[REDACTED]", "sb_secret_private", jwt("service_role"), "not-a-key", "bad.invalid.json"]) {
    assert.equal(hasPublicSupabaseConfig(url, value), false);
  }
  assert.equal(hasPublicSupabaseConfig(url, key), true);
  assert.equal(hasPublicSupabaseConfig(url, "sb_publishable_test_public_value"), true);
  assert.equal(hasPublicSupabaseConfig("javascript:alert(1)", key), false);
});

test("masked configuration fails closed without contacting Auth or disclosing a key", async () => {
  const check = createAuthReadiness({ url, key: "********************", fetchImpl: () => { throw new Error("must not fetch"); } });
  const result = await check();
  assert.equal(result.ready, false);
  assert.equal(result.code, "SUPABASE_NOT_CONFIGURED");
  assert.match(result.error, /不是你的帳號或密碼錯誤/);
});

test("valid-looking but rejected keys cannot report healthy", async () => {
  const check = createAuthReadiness({ url, key, fetchImpl: async () => Response.json({ message: "Invalid API key" }, { status: 401 }) });
  const result = await check();
  assert.equal(result.ready, false);
  assert.equal(result.code, "SUPABASE_KEY_REJECTED");
  assert.equal(JSON.stringify(result).includes(key), false);
});

test("successful Auth probe is bounded, coalesced and cached for 30 seconds", async () => {
  let calls = 0;
  let time = 1_000;
  const check = createAuthReadiness({ url, key, now: () => time, fetchImpl: async (target, options) => {
    calls += 1;
    assert.equal(target, `${url}/auth/v1/settings`);
    assert.equal(options.headers.apikey, key);
    assert.ok(options.signal instanceof AbortSignal);
    return Response.json({ external: { email: true } });
  } });
  const results = await Promise.all([check(), check(), check()]);
  assert.ok(results.every((result) => result.ready));
  assert.equal(calls, 1);
  time += 30_001;
  await check();
  assert.equal(calls, 2);
});

test("failed Auth probes are retried after five seconds without exposing upstream details", async () => {
  let time = 0;
  let fail = true;
  const check = createAuthReadiness({ url, key, now: () => time, fetchImpl: async () => {
    if (fail) throw new Error(`network details must not leak: ${key}`);
    return Response.json({ external: { email: true } });
  } });
  const failed = await check();
  assert.equal(failed.code, "AUTH_UNAVAILABLE");
  assert.equal(JSON.stringify(failed).includes(key), false);
  fail = false;
  assert.equal((await check()).ready, false);
  time += 5_001;
  assert.equal((await check()).ready, true);
});

test("disabled email login and malformed service replies are not ready", async () => {
  const disabled = createAuthReadiness({ url, key, fetchImpl: async () => Response.json({ external: { email: false } }) });
  assert.equal((await disabled()).code, "EMAIL_AUTH_DISABLED");
  const malformed = createAuthReadiness({ url, key, fetchImpl: async () => Response.json({}) });
  assert.equal((await malformed()).code, "AUTH_UNAVAILABLE");
  const unavailable = createAuthReadiness({ url, key, fetchImpl: async () => new Response("Unavailable", { status: 503 }) });
  assert.equal((await unavailable()).code, "AUTH_UNAVAILABLE");
});
