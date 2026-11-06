begin;

-- This mixed-purpose table contains customer records and driver credentials.
-- Browser reads are limited to public seat counts and verified admin operations.
alter table public.kv_store_3bd0ade8 enable row level security;
drop policy if exists "Allow service role full access" on public.kv_store_3bd0ade8;
drop policy if exists "Allow public read access" on public.kv_store_3bd0ade8;
revoke all on public.kv_store_3bd0ade8 from public, anon, authenticated;
grant select on public.kv_store_3bd0ade8 to anon, authenticated;
grant all on public.kv_store_3bd0ade8 to service_role;

-- Restrictive policy also bounds any unexpected pre-existing permissive policy.
drop policy if exists kv_browser_read_boundary on public.kv_store_3bd0ade8;
create policy kv_browser_read_boundary on public.kv_store_3bd0ade8
as restrictive for select to anon, authenticated
using (
  key ~ '^availability_[0-9]{4}-[0-9]{2}-[0-9]{2}$'
  or (
    (select auth.jwt()) -> 'app_metadata' ->> 'role' = 'admin'
    and (
      key like 'PICKUP\_%' escape '\'
      or key like 'live\_chat\_%' escape '\'
      or key like 'destination\_%' escape '\'
      or key ~ '^[A-Z]{2}-[0-9]+$'
    )
  )
);
drop policy if exists kv_browser_read on public.kv_store_3bd0ade8;
create policy kv_browser_read on public.kv_store_3bd0ade8
for select to anon, authenticated using (true);

commit;
