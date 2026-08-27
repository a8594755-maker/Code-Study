-- Supply SQL Lab account query history.
-- Run only as an app-admin migration, never as part of a student practice query.

CREATE TABLE IF NOT EXISTS public.sql_playground_query_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    sql_text text NOT NULL CHECK (char_length(sql_text) <= 50000),
    lesson_id text,
    lesson_title text,
    status text NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
    row_count integer,
    duration_ms numeric(12, 1),
    error_code text,
    error_message text,
    created_at timestamptz NOT NULL DEFAULT now(),
    completed_at timestamptz
);

CREATE INDEX IF NOT EXISTS sql_playground_query_logs_user_created_idx
    ON public.sql_playground_query_logs (user_id, created_at DESC);

ALTER TABLE public.sql_playground_query_logs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.sql_playground_query_logs FROM anon;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.sql_playground_query_logs FROM authenticated;
GRANT SELECT ON TABLE public.sql_playground_query_logs TO authenticated;
GRANT ALL ON TABLE public.sql_playground_query_logs TO service_role;

DROP POLICY IF EXISTS "Users can read their own SQL logs"
    ON public.sql_playground_query_logs;

CREATE POLICY "Users can read their own SQL logs"
    ON public.sql_playground_query_logs
    FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);
