// Read-only smoke check of the deployed runtime, not CLI-masked env values.
// No passwords, account creation, tokens, SQL or AI generation are involved.
import { hasPublicSupabaseConfig } from "../server/auth-readiness.js";

async function main() {
  const target = process.argv[2];
  if (!target) throw new Error("Usage: npm run check:auth -- <preview-url>");
  const origin = new URL(target).origin;
  const options = { signal: AbortSignal.timeout(10_000) };
  const configResponse = await fetch(`${origin}/api/config`, options);
  if (!configResponse.ok) throw new Error(`Deployed login configuration is not ready (HTTP ${configResponse.status}).`);
  const config = await configResponse.json();
  if (!config.authEnabled || !hasPublicSupabaseConfig(config.supabaseUrl, config.supabaseAnonKey)) {
    throw new Error("Deployed configuration does not contain a valid public-key format; no values printed.");
  }
  const auth = await fetch(`${config.supabaseUrl.replace(/\/$/, "")}/auth/v1/settings`, {
    headers: { apikey: config.supabaseAnonKey },
    signal: AbortSignal.timeout(10_000),
  });
  if (!auth.ok) throw new Error(`Supabase rejected the deployed login configuration (HTTP ${auth.status}).`);
  if (!(await auth.json()).external?.email) throw new Error("Email login is not enabled.");
  const health = await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(10_000) });
  if (!health.ok || !(await health.json()).authReady) throw new Error("Deployed Auth readiness check did not pass.");
  console.log("PASS: deployed public configuration, Supabase Auth key acceptance, Email login and Auth readiness.");
  console.log("No credentials printed; no account/database writes. This is not a user sign-in or SQL end-to-end test.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
