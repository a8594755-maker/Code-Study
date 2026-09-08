import { createHash } from "node:crypto";
import { createSupabaseRest } from "./supabase-rest.js";
import { hasPublicSupabaseConfig } from "./auth-readiness.js";

export function editorRuntime(env = process.env) {
  const url = env.SUPABASE_URL?.trim(), anonKey = env.SUPABASE_ANON_KEY?.trim();
  const apiKey = env.OPENAI_API_KEY?.trim();
  const proxySecret = env.EDITOR_TUTOR_PROXY_SECRET?.trim()
    || (apiKey ? createHash("sha256").update(`editor-tutor:${apiKey}`).digest("hex") : "");
  return {
    supabase: hasPublicSupabaseConfig(url, anonKey) ? createSupabaseRest({ url, anonKey }) : null,
    provider: { apiKey, proxySecret, model: env.OPENAI_TUTOR_MODEL?.trim() || "gpt-5.6-luna",
      endpoint: proxySecret && url ? `${url.replace(/\/$/, "")}/functions/v1/editor-tutor-v2` : "https://api.openai.com/v1/responses" },
  };
}
