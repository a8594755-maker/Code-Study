// Manual browser QA helper, never used by the app. Create output is sensitive:
// consume in memory, don't print credentials in user-facing logs. Always delete.
import { execFileSync } from "node:child_process";
import { randomUUID, randomBytes } from "node:crypto";
const root = "https://ylmuvsdegmpoiygbtipi.supabase.co";
const keys = JSON.parse(execFileSync("/opt/homebrew/bin/supabase", ["projects", "api-keys", "--project-ref", "ylmuvsdegmpoiygbtipi", "--output", "json"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }));
const key = keys.find((k) => k.name === "service_role")?.api_key;
if (!key) throw new Error("Authorized Supabase CLI required");
const headers = { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
const purpose = "temporary_workflow_browser_qa";
if (["create", "create-ui"].includes(process.argv[2])) {
  const ui = process.argv[2] === "create-ui";
  const email = `workflow-browser-qa-${randomUUID()}@example.invalid`, password = ui ? process.env.WORKFLOW_QA_PASSWORD : randomBytes(24).toString("base64url");
  if (!password || password.length < 24) throw new Error("Temporary UI password must be supplied with at least 24 characters");
  const res = await fetch(`${root}/auth/v1/admin/users`, { method: "POST", headers, body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { purpose } }), signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`QA create failed: ${res.status}`);
  const user = await res.json();
  process.stdout.write(JSON.stringify({ id: user.id, email, ...(!ui ? { password } : {}) }));
} else if (process.argv[2] === "delete" && /^[a-f\d-]{36}$/i.test(process.argv[3] || "")) {
  const endpoint = `${root}/auth/v1/admin/users/${process.argv[3]}`;
  const found = await fetch(endpoint, { headers }); const user = await found.json();
  if (!found.ok || user.user_metadata?.purpose !== purpose || !user.email?.startsWith("workflow-browser-qa-") || !user.email.endsWith("@example.invalid")) throw new Error("Refusing cleanup: not this tool's QA account");
  const res = await fetch(endpoint, { method: "DELETE", headers });
  if (!res.ok) throw new Error(`QA cleanup failed: ${res.status}`);
  console.log("Deleted exact temporary browser QA account and its test records.");
} else throw new Error("Use create, create-ui (WORKFLOW_QA_PASSWORD required), or delete <exact-QA-uuid>");
