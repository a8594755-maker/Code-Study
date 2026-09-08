// Public configuration may only contain a Supabase anon/publishable key.
// Checking that a variable exists is not evidence that Supabase accepts it.
export function hasPublicSupabaseConfig(url, key) {
  if (!url || !key || /\*{3}|replace_with|redacted|hidden/i.test(key)) return false;
  try {
    if (!["https:", "http:"].includes(new URL(url).protocol)) return false;
    if (key.startsWith("sb_publishable_")) return key.length > 20;
    const parts = key.split(".");
    if (parts.length !== 3) return false;
    const claims = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8"));
    return claims.role === "anon";
  } catch {
    return false;
  }
}

export function createAuthReadiness({ url, key, fetchImpl = fetch, now = Date.now }) {
  const configured = hasPublicSupabaseConfig(url, key);
  let cached;
  let expiresAt = 0;
  let pending;

  async function probe() {
    try {
      const response = await fetchImpl(`${url.replace(/\/$/, "")}/auth/v1/settings`, {
        headers: { apikey: key },
        signal: AbortSignal.timeout(4_000),
      });
      if (response.status === 401 || response.status === 403) {
        return { ready: false, code: "SUPABASE_KEY_REJECTED", error: "網站的 Supabase 登入設定有誤，請管理者修正；這不是你的帳號或密碼錯誤。" };
      }
      if (!response.ok) throw new Error("Auth unavailable");
      const settings = await response.json();
      if (!settings.external || typeof settings.external !== "object") throw new Error("Invalid auth settings");
      if (!settings.external.email) {
        return { ready: false, code: "EMAIL_AUTH_DISABLED", error: "網站尚未開啟 Email 登入，請管理者檢查 Supabase Auth 設定。" };
      }
      return { ready: true, code: "AUTH_READY" };
    } catch {
      return { ready: false, code: "AUTH_UNAVAILABLE", error: "登入服務暫時無法連線，請稍後重新整理；不需要更改密碼。" };
    }
  }

  return async function checkAuthReadiness() {
    if (!configured) return { ready: false, code: "SUPABASE_NOT_CONFIGURED", error: "網站的 Supabase 登入設定缺漏或無效，請管理者修正；這不是你的帳號或密碼錯誤。" };
    if (cached && now() < expiresAt) return cached;
    if (!pending) {
      pending = probe().then((result) => {
        cached = result;
        expiresAt = now() + (result.ready ? 30_000 : 5_000);
        return result;
      }).finally(() => { pending = null; });
    }
    return pending;
  };
}
