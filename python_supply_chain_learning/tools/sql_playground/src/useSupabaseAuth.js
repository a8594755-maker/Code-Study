import { useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export function useSupabaseAuth() {
  const [client, setClient] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let active = true;
    let subscription;

    async function initialize() {
      try {
        const response = await fetch("/api/config");
        const config = await response.json();

        if (!response.ok || !config.authEnabled) {
          throw new Error(config.error || "網站管理者尚未設定 Supabase Auth Secrets。");
        }

        const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
        if (!active) return;
        setClient(supabase);

        const { data } = await supabase.auth.getSession();
        if (!active) return;
        setSession(data.session ?? null);

        const listener = supabase.auth.onAuthStateChange((_event, nextSession) => {
          setSession(nextSession ?? null);
        });
        subscription = listener.data.subscription;
      } catch (error) {
        if (active) setMessage({ type: "error", text: error.message });
      } finally {
        if (active) setLoading(false);
      }
    }

    initialize();
    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (email, password) => {
      if (!client) return;
      setActionLoading(true);
      setMessage(null);
      const { error } = await client.auth.signInWithPassword({ email, password });
      setActionLoading(false);
      if (error) setMessage({ type: "error", text: error.message });
    },
    [client],
  );

  const signUp = useCallback(
    async (email, password) => {
      if (!client) return;
      setActionLoading(true);
      setMessage(null);
      const { data, error } = await client.auth.signUp({ email, password });
      setActionLoading(false);

      if (error) {
        setMessage({ type: "error", text: error.message });
      } else if (!data.session) {
        setMessage({ type: "success", text: "帳號已建立。請到信箱完成驗證後再登入。" });
      }
    },
    [client],
  );

  const signOut = useCallback(async () => {
    if (client) await client.auth.signOut();
  }, [client]);

  return {
    ready: Boolean(client),
    session,
    loading,
    actionLoading,
    message,
    signIn,
    signUp,
    signOut,
  };
}
