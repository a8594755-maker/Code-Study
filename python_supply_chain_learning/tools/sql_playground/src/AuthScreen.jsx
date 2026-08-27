import { useState } from "react";

export default function AuthScreen({
  loading,
  ready,
  actionLoading,
  message,
  onSignIn,
  onSignUp,
}) {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localMessage, setLocalMessage] = useState(null);

  function submit() {
    if (!ready) return;
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) {
      setLocalMessage("請輸入 email 與 password。");
      return;
    }
    if (mode === "signup" && password.length < 8) {
      setLocalMessage("建立帳號時，password 至少需要 8 個字元。");
      return;
    }

    setLocalMessage(null);
    if (mode === "signin") onSignIn(normalizedEmail, password);
    else onSignUp(normalizedEmail, password);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter") submit();
  }

  return (
    <div className="auth-shell">
      <div className="auth-grid" aria-hidden="true" />
      <section className="auth-intro">
        <div className="auth-brand-mark">SQL</div>
        <span className="auth-kicker">SUPPLY SQL LAB</span>
        <h1>把每一次查詢，<br />變成你的能力證據。</h1>
        <p>
          在唯讀的 Olist PostgreSQL 環境練習。成功、錯誤、執行時間與結果列數，都會安全記錄到你的帳號。
        </p>
        <div className="auth-proof-list">
          <div><span>01</span><strong>真實 Supabase PostgreSQL</strong></div>
          <div><span>02</span><strong>逐題提示與自我核對</strong></div>
          <div><span>03</span><strong>個人 Query Log 歷史</strong></div>
        </div>
      </section>

      <section className="auth-card" aria-busy={loading || actionLoading}>
        <div className="auth-card-head">
          <span className="micro-label">ACCOUNT ACCESS</span>
          <h2>{mode === "signin" ? "登入練習場" : "建立學習帳號"}</h2>
          <p>{mode === "signin" ? "繼續你的 SQL 練習紀錄。" : "每次執行都會綁定到這個帳號。"}</p>
        </div>

        <div className="auth-mode-switch" role="tablist" aria-label="登入方式">
          <button
            role="tab"
            aria-selected={mode === "signin"}
            className={mode === "signin" ? "active" : ""}
            onClick={() => setMode("signin")}
          >
            登入
          </button>
          <button
            role="tab"
            aria-selected={mode === "signup"}
            className={mode === "signup" ? "active" : ""}
            onClick={() => setMode("signup")}
          >
            建立帳號
          </button>
        </div>

        <label className="auth-field">
          <span>Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="name@example.com"
            disabled={loading || actionLoading || !ready}
          />
        </label>

        <label className="auth-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="至少 8 個字元"
            disabled={loading || actionLoading || !ready}
          />
        </label>

        {(localMessage || message) && (
          <div className={`auth-message ${message?.type === "success" ? "success" : "error"}`} role="status">
            {localMessage || message?.text}
          </div>
        )}

        <button
          className="auth-submit"
          onClick={submit}
          disabled={loading || actionLoading || !ready}
        >
          {loading ? "載入登入服務…" : !ready ? "等待管理者完成設定" : actionLoading ? "處理中…" : mode === "signin" ? "登入並繼續" : "建立帳號"}
        </button>

        <p className="auth-privacy">
          Password 由 Supabase Auth 處理，不會出現在任何 Query Log。
        </p>
      </section>
    </div>
  );
}
