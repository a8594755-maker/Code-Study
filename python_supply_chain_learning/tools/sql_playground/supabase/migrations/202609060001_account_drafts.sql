-- Application-only drafts. Does not change Olist data or execution permissions.
create table if not exists public.sql_playground_drafts (
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_key text not null check (length(workspace_key) between 1 and 200),
  body jsonb not null check (jsonb_typeof(body) = 'object' and octet_length(body::text) <= 80000),
  revision integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (user_id, workspace_key)
);
alter table public.sql_playground_drafts enable row level security;
create policy drafts_owner on public.sql_playground_drafts for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.sql_playground_drafts from anon, authenticated;
grant select, insert, update on public.sql_playground_drafts to authenticated;

create or replace function public.sql_playground_save_draft(p_key text, p_body jsonb, p_revision integer)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare current_draft public.sql_playground_drafts;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_key !~ '^(studio|playground|chat):[A-Za-z0-9_:.-]+$' or length(p_key) > 200
     or p_revision < 0 or p_revision is null or p_body is null
     or jsonb_typeof(p_body) <> 'object' or octet_length(p_body::text) > 80000 then
    raise exception 'Invalid draft';
  end if;
  -- Also serializes the first insert, when no row exists to lock yet.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text || ':' || p_key, 0));
  select * into current_draft from public.sql_playground_drafts
    where user_id = auth.uid() and workspace_key = p_key for update;
  if found then
    -- Safe retry after an uncertain network response, even with the old revision.
    if current_draft.body = p_body then
      return jsonb_build_object('saved', true, 'draft', to_jsonb(current_draft) - 'user_id');
    end if;
    if current_draft.revision <> p_revision then
      return jsonb_build_object('conflict', true, 'draft', to_jsonb(current_draft) - 'user_id');
    end if;
    update public.sql_playground_drafts set body = p_body, revision = revision + 1, updated_at = now()
      where user_id = auth.uid() and workspace_key = p_key returning * into current_draft;
  else
    if p_revision <> 0 then return jsonb_build_object('conflict', true, 'draft', null); end if;
    insert into public.sql_playground_drafts(user_id, workspace_key, body)
      values(auth.uid(), p_key, p_body) returning * into current_draft;
  end if;
  return jsonb_build_object('saved', true, 'draft', to_jsonb(current_draft) - 'user_id');
end $$;
revoke all on function public.sql_playground_save_draft(text, jsonb, integer) from public, anon;
grant execute on function public.sql_playground_save_draft(text, jsonb, integer) to authenticated;
