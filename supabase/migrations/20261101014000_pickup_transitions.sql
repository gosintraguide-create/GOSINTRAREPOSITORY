begin;
create function public.transition_pickup(p_id text, p_action text, p_actor_role text, p_actor_id text, p_driver_id text default null) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare request jsonb; driver jsonb;
begin
  if p_actor_role not in ('admin','driver') or p_actor_role is null then raise exception 'Access denied'; end if;
  if p_id not like 'PICKUP\_%' escape '\' then raise exception 'Invalid request'; end if;
  select value into request from kv_store_3bd0ade8 where key=p_id for update;
  if request is null then raise exception 'Request not found'; end if;
  if p_action='assign' then
    if request->>'status' is distinct from 'pending' and not (p_actor_role='admin' and coalesce(request->>'status','')='accepted') then raise exception 'Request no longer available'; end if;
    if p_actor_role='driver' and p_actor_id is distinct from p_driver_id then raise exception 'Access denied'; end if;
    select d into driver from kv_store_3bd0ade8 k cross join lateral jsonb_array_elements(k.value) d
      where k.key='drivers_list' and d->>'id'=p_driver_id;
    if driver is null or driver->>'status' in ('inactive','disabled') then raise exception 'Driver unavailable'; end if;
    request=request || jsonb_build_object('status','accepted','acceptedBy',p_driver_id,'acceptedByName',driver->>'name','acceptedAt',now());
  elsif p_action='complete' then
    if request->>'status' is distinct from 'accepted' then raise exception 'Request must be accepted first'; end if;
    if p_actor_role='driver' and request->>'acceptedBy' is distinct from p_actor_id then raise exception 'Access denied'; end if;
    request=request || jsonb_build_object('status','completed','completedTime',now());
  elsif p_action='cancel' then
    if p_actor_role<>'admin' then raise exception 'Access denied'; end if;
    if coalesce(request->>'status','') not in ('pending','accepted') then raise exception 'Request already closed'; end if;
    request=request || jsonb_build_object('status','cancelled','cancelledAt',now());
  else raise exception 'Invalid action'; end if;
  update kv_store_3bd0ade8 set value=request where key=p_id;
  return request;
end; $$;
revoke all on function public.transition_pickup(text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.transition_pickup(text,text,text,text,text) to service_role;
commit;
