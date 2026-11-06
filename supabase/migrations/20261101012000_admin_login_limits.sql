begin;
create table public.admin_login_limits (
  id text primary key,
  window_start timestamptz not null,
  attempts integer not null
);
alter table public.admin_login_limits enable row level security;
revoke all on public.admin_login_limits from public, anon, authenticated;
create function public.allow_admin_login()
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare count integer;
begin
  insert into admin_login_limits values('admin',now(),1)
  on conflict(id) do update set
    attempts=case when admin_login_limits.window_start < now()-interval '15 minutes' then 1 else admin_login_limits.attempts+1 end,
    window_start=case when admin_login_limits.window_start < now()-interval '15 minutes' then now() else admin_login_limits.window_start end
  returning attempts into count;
  return count<=20;
end; $$;
revoke all on function public.allow_admin_login() from public, anon, authenticated;
grant execute on function public.allow_admin_login() to service_role;
commit;
