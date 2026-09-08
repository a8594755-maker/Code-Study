-- AI analyst tutor conversations belong to the signed-in learner and are
-- exported together with SQL attempts. No provider secret is stored here.

ALTER TABLE public.sql_playground_lesson_progress
    ADD COLUMN IF NOT EXISTS reflection_source text;

CREATE TABLE IF NOT EXISTS public.sql_playground_tutor_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id text NOT NULL,
    chapter_id text NOT NULL,
    role text NOT NULL CHECK (role IN ('user', 'assistant')),
    mode text NOT NULL CHECK (mode IN ('draft', 'follow_up')),
    content text NOT NULL CHECK (char_length(content) <= 12000),
    model text,
    input_tokens integer NOT NULL DEFAULT 0,
    output_tokens integer NOT NULL DEFAULT 0,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sql_playground_tutor_user_question_idx
    ON public.sql_playground_tutor_messages (user_id, question_id, created_at);

ALTER TABLE public.sql_playground_tutor_messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.sql_playground_tutor_messages FROM anon;
GRANT SELECT, INSERT ON TABLE public.sql_playground_tutor_messages TO authenticated;

DROP POLICY IF EXISTS "Users can read their own tutor messages"
    ON public.sql_playground_tutor_messages;
CREATE POLICY "Users can read their own tutor messages"
    ON public.sql_playground_tutor_messages
    FOR SELECT TO authenticated
    USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert their own tutor messages"
    ON public.sql_playground_tutor_messages;
CREATE POLICY "Users can insert their own tutor messages"
    ON public.sql_playground_tutor_messages
    FOR INSERT TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

NOTIFY pgrst, 'reload schema';
