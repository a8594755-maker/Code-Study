-- Supply SQL Lab: course progress, analyst events, richer attempt logs, and
-- authenticated read-only SQL execution through Supabase REST.
-- Run as a project-admin migration, never as a student query.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.sql_playground_query_logs
    ADD COLUMN IF NOT EXISTS chapter_id text,
    ADD COLUMN IF NOT EXISTS unit_id text,
    ADD COLUMN IF NOT EXISTS question_id text,
    ADD COLUMN IF NOT EXISTS question_title text,
    ADD COLUMN IF NOT EXISTS question_version integer NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS attempt_number integer,
    ADD COLUMN IF NOT EXISTS hint_level integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS score numeric(5, 2),
    ADD COLUMN IF NOT EXISTS validation jsonb NOT NULL DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS result_preview jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS sql_playground_logs_question_idx
    ON public.sql_playground_query_logs (user_id, question_id, created_at DESC);

DROP POLICY IF EXISTS "Users can insert their own SQL logs"
    ON public.sql_playground_query_logs;
CREATE POLICY "Users can insert their own SQL logs"
    ON public.sql_playground_query_logs
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own SQL logs"
    ON public.sql_playground_query_logs;
CREATE POLICY "Users can update their own SQL logs"
    ON public.sql_playground_query_logs
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

GRANT INSERT, UPDATE, SELECT ON TABLE public.sql_playground_query_logs TO authenticated;

CREATE TABLE IF NOT EXISTS public.sql_playground_lesson_progress (
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id text NOT NULL,
    chapter_id text NOT NULL,
    unit_id text NOT NULL,
    status text NOT NULL DEFAULT 'in_progress'
        CHECK (status IN ('in_progress', 'query_passed', 'completed')),
    attempts integer NOT NULL DEFAULT 0,
    best_score numeric(5, 2) NOT NULL DEFAULT 0,
    highest_hint_level integer NOT NULL DEFAULT 0,
    last_sql text,
    last_validation jsonb NOT NULL DEFAULT '{}'::jsonb,
    reflection text,
    started_at timestamptz NOT NULL DEFAULT now(),
    query_passed_at timestamptz,
    completed_at timestamptz,
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, question_id)
);

ALTER TABLE public.sql_playground_lesson_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.sql_playground_lesson_progress FROM anon;
GRANT SELECT, INSERT, UPDATE ON TABLE public.sql_playground_lesson_progress TO authenticated;

DROP POLICY IF EXISTS "Users can read their own lesson progress"
    ON public.sql_playground_lesson_progress;
CREATE POLICY "Users can read their own lesson progress"
    ON public.sql_playground_lesson_progress
    FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own lesson progress"
    ON public.sql_playground_lesson_progress;
CREATE POLICY "Users can insert their own lesson progress"
    ON public.sql_playground_lesson_progress
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own lesson progress"
    ON public.sql_playground_lesson_progress;
CREATE POLICY "Users can update their own lesson progress"
    ON public.sql_playground_lesson_progress
    FOR UPDATE TO authenticated
    USING ((SELECT auth.uid()) = user_id)
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE TABLE IF NOT EXISTS public.sql_playground_learning_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id text,
    chapter_id text,
    event_type text NOT NULL CHECK (
        event_type IN (
            'lesson_opened', 'hint_revealed', 'query_run', 'query_passed',
            'reflection_saved', 'lesson_completed', 'export_downloaded'
        )
    ),
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sql_playground_events_user_created_idx
    ON public.sql_playground_learning_events (user_id, created_at DESC);

ALTER TABLE public.sql_playground_learning_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.sql_playground_learning_events FROM anon;
GRANT SELECT, INSERT ON TABLE public.sql_playground_learning_events TO authenticated;

DROP POLICY IF EXISTS "Users can read their own learning events"
    ON public.sql_playground_learning_events;
CREATE POLICY "Users can read their own learning events"
    ON public.sql_playground_learning_events
    FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own learning events"
    ON public.sql_playground_learning_events;
CREATE POLICY "Users can insert their own learning events"
    ON public.sql_playground_learning_events
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- The public Olist dataset is readable only after authentication. This role has
-- no INSERT, UPDATE, DELETE, DDL, or role-management privileges.
GRANT USAGE ON SCHEMA olist TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA olist TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA olist GRANT SELECT ON TABLES TO authenticated;

CREATE OR REPLACE FUNCTION public.sql_playground_execute(query_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET statement_timeout = '8s'
SET search_path = pg_catalog, public, olist
AS $$
DECLARE
    cleaned text := btrim(query_text);
    rows_json jsonb;
    returned_rows integer;
    was_truncated boolean;
BEGIN
    IF cleaned IS NULL OR cleaned = '' THEN
        RAISE EXCEPTION 'SQL is empty' USING ERRCODE = '22023';
    END IF;
    IF char_length(cleaned) > 50000 THEN
        RAISE EXCEPTION 'SQL is too long' USING ERRCODE = '22023';
    END IF;
    IF position(';' IN cleaned) > 0 THEN
        RAISE EXCEPTION 'Only one SQL statement is allowed' USING ERRCODE = '42501';
    END IF;
    IF cleaned !~* '^\s*(select|with)\M' THEN
        RAISE EXCEPTION 'Only SELECT or WITH ... SELECT is allowed' USING ERRCODE = '42501';
    END IF;
    IF cleaned ~* '\m(insert|update|delete|merge|truncate|create|alter|drop|grant|revoke|copy|call|do|vacuum|analyze|refresh|reindex|cluster|comment|security|set|reset)\M' THEN
        RAISE EXCEPTION 'Mutating or administrative SQL is not allowed' USING ERRCODE = '42501';
    END IF;
    IF cleaned ~* '\m(pg_sleep|pg_read_file|pg_read_binary_file|pg_ls_dir|pg_stat_file|pg_terminate_backend|pg_cancel_backend|set_config|lo_import|lo_export|dblink_exec)\s*\(' THEN
        RAISE EXCEPTION 'This function is not allowed' USING ERRCODE = '42501';
    END IF;

    EXECUTE format(
        'SELECT COALESCE(jsonb_agg(to_jsonb(result_row)), ''[]''::jsonb) '
        'FROM (SELECT * FROM (%s) AS student_query LIMIT 501) AS result_row',
        cleaned
    ) INTO rows_json;

    returned_rows := jsonb_array_length(rows_json);
    was_truncated := returned_rows > 500;
    IF was_truncated THEN
        SELECT jsonb_agg(item.value ORDER BY item.ordinality)
        INTO rows_json
        FROM jsonb_array_elements(rows_json) WITH ORDINALITY AS item(value, ordinality)
        WHERE item.ordinality <= 500;
    END IF;

    RETURN jsonb_build_object(
        'rows', rows_json,
        'row_count', LEAST(returned_rows, 500),
        'truncated', was_truncated,
        'max_result_rows', 500
    );
END;
$$;

REVOKE ALL ON FUNCTION public.sql_playground_execute(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sql_playground_execute(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.sql_playground_schema()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = pg_catalog, public, olist
AS $$
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'table_name', table_name,
                'column_name', column_name,
                'data_type', data_type,
                'ordinal_position', ordinal_position
            ) ORDER BY table_name, ordinal_position
        ),
        '[]'::jsonb
    )
    FROM information_schema.columns
    WHERE table_schema = 'olist';
$$;

REVOKE ALL ON FUNCTION public.sql_playground_schema() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sql_playground_schema() TO authenticated;

NOTIFY pgrst, 'reload schema';
