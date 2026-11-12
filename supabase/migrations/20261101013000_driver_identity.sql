begin;
create table public.driver_login_limits(username text primary key, window_start timestamptz not null, attempts integer not null);
alter table public.driver_login_limits enable row level security;
revoke all on public.driver_login_limits from public, anon, authenticated;

create function public.allow_driver_login(p_username text) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare count integer;
begin
  -- Bound storage to existing accounts rather than arbitrary supplied usernames.
  if not exists(select 1 from kv_store_3bd0ade8 k cross join lateral jsonb_array_elements(k.value) d
    where k.key='drivers_list' and lower(trim(d->>'username'))=p_username) then return false; end if;
  insert into driver_login_limits values(p_username,now(),1)
  on conflict(username) do update set
   attempts=case when driver_login_limits.window_start<now()-interval '15 minutes' then 1 else driver_login_limits.attempts+1 end,
   window_start=case when driver_login_limits.window_start<now()-interval '15 minutes' then now() else driver_login_limits.window_start end
  returning attempts into count;
  return count<=20;
end; $$;

create function public.driver_session_active(p_user_id uuid,p_session_id uuid) returns boolean
language sql security definer set search_path=public,pg_temp as $$
  select exists(select 1 from auth.sessions where id=p_session_id and user_id=p_user_id
    and (not_after is null or not_after>now()));
$$;

-- Preserve the existing profile IDs/history; serialize changes to the shared list.
create function public.save_driver_profile(p_driver jsonb,p_delete boolean default false) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare profiles jsonb; result jsonb; existing jsonb;
begin
  insert into kv_store_3bd0ade8 values('drivers_list','[]') on conflict(key) do nothing;
  select value into profiles from kv_store_3bd0ade8 where key='drivers_list' for update;
  select d into existing from jsonb_array_elements(profiles) d where d->>'id'=p_driver->>'id';
  if coalesce(p_driver->>'id','')='' then raise exception 'Driver ID required'; end if;
  if p_driver ? 'password' or p_driver ? 'passwordHash' then raise exception 'Credentials must be stored in Auth'; end if;
  if existing->>'status' in ('inactive','disabled') and p_driver->>'status' in ('online','offline') then
    raise exception 'Reactivate driver explicitly before changing presence';
  end if;
  if not p_delete and existing is null and (
    coalesce(p_driver->>'authUserId','')='' or coalesce(p_driver->>'authVersion','')='' or
    coalesce(trim(p_driver->>'name'),'')='' or coalesce(trim(p_driver->>'username'),'')=''
  ) then raise exception 'Complete authenticated driver profile required'; end if;
  if not p_delete and exists(select 1 from jsonb_array_elements(profiles) d where d->>'id'<>p_driver->>'id'
    and lower(trim(d->>'username'))=lower(trim(p_driver->>'username'))) then raise exception 'Username already taken'; end if;
  select coalesce(jsonb_agg(d),'[]') into result from jsonb_array_elements(profiles) d where d->>'id'<>p_driver->>'id';
  if not p_delete then
    p_driver=(coalesce(existing,'{}') - 'password' - 'passwordHash') || p_driver;
    result=result || jsonb_build_array(p_driver);
  end if;
  update kv_store_3bd0ade8 set value=result where key='drivers_list';
  return p_driver;
end; $$;
revoke all on function public.allow_driver_login(text), public.driver_session_active(uuid,uuid), public.save_driver_profile(jsonb,boolean) from public,anon,authenticated;
grant execute on function public.allow_driver_login(text), public.driver_session_active(uuid,uuid), public.save_driver_profile(jsonb,boolean) to service_role;
commit;
