create table if not exists public.booking_login_limits (
  booking_id text primary key,
  window_start timestamptz not null,
  attempts integer not null
);
alter table public.booking_login_limits enable row level security;
revoke all on public.booking_login_limits from public,anon,authenticated;
create or replace function public.allow_booking_login(p_id text)
returns boolean language plpgsql security definer set search_path=public,pg_temp as $$
declare count integer;
begin
  insert into booking_login_limits values(p_id,now(),1)
  on conflict(booking_id) do update set
    attempts=case when booking_login_limits.window_start < now()-interval '15 minutes' then 1 else booking_login_limits.attempts+1 end,
    window_start=case when booking_login_limits.window_start < now()-interval '15 minutes' then now() else booking_login_limits.window_start end
  returning attempts into count;
  return count<=10;
end; $$;
revoke all on function public.allow_booking_login(text) from public,anon,authenticated;
grant execute on function public.allow_booking_login(text) to service_role;
