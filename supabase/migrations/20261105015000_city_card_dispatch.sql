begin;
-- Use the cancellation lock too: cancellation cannot race validation/assignment.
create function public.city_ride_group(p_email text,p_cards jsonb,p_ready integer default 0) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare r jsonb; b jsonb; passenger jsonb; riders jsonb:='[]'; has_full boolean:=false; no_tuk boolean:=false;
 today text:=to_char(now() at time zone 'Europe/Lisbon','YYYY-MM-DD'); clock text:=to_char((now()+make_interval(mins=>p_ready)) at time zone 'Europe/Lisbon','HH24:MI');
begin
 if jsonb_typeof(p_cards) is distinct from 'array' or jsonb_array_length(p_cards) not between 1 and 50 or p_ready not in (0,15) then raise exception 'Choose 1–50 cardholders'; end if;
 if (select count(distinct (x->>'bookingId',x->>'index')) from jsonb_array_elements(p_cards) x)<>jsonb_array_length(p_cards) then raise exception 'Choose each card only once'; end if;
 for r in select * from jsonb_array_elements(p_cards) loop
  select value into b from kv_store_3bd0ade8 where key=r->>'bookingId';
  if b is null or b->>'product' is distinct from 'city-card-v1' or lower(b->'contactInfo'->>'email') is distinct from lower(p_email) or coalesce(b->>'status','') not in ('confirmed','completed') or b->>'paymentStatus' is distinct from 'paid' or b->>'selectedDate' is distinct from today then raise exception 'A selected card is not active today'; end if;
  if not exists(select 1 from city_card_orders o where o.booking_id=b->>'id' and o.state='paid' and o.email=lower(p_email)) then raise exception 'Card payment is not confirmed'; end if;
  if to_char((now()+make_interval(mins=>p_ready)) at time zone 'Europe/Lisbon','YYYY-MM-DD')<>today or b->'transportHours'->>'opens' is null or b->'transportHours'->>'closes' is null or to_char(now() at time zone 'Europe/Lisbon','HH24:MI') < b->'transportHours'->>'opens' or clock >= b->'transportHours'->>'closes' then raise exception 'Ride requests are outside operating hours'; end if;
  if (r->>'index')::integer<0 then raise exception 'Invalid card'; end if;
  passenger:=b->'passengers'->((r->>'index')::integer);
  if passenger is null or passenger->>'cancelledAt' is not null or coalesce(passenger->>'ageBand','') not in ('full','half','free') then raise exception 'A selected card is cancelled or invalid'; end if;
  has_full:=has_full or passenger->>'ageBand'='full'; no_tuk:=no_tuk or passenger->>'ageBand'='free';
  riders:=riders||jsonb_build_array(jsonb_build_object('bookingId',b->>'id','index',(r->>'index')::integer,'name',passenger->>'name','ageBand',passenger->>'ageBand'));
 end loop;
 if not has_full then raise exception 'Select a full-price companion travelling with the children'; end if;
 return jsonb_build_object('riders',riders,'groupSize',jsonb_array_length(riders),'nonTukTuk',no_tuk,'serviceDate',today);
end;$$;
create function public.create_city_pickup(p_email text,p_cards jsonb,p_input jsonb) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare plan jsonb; prior jsonb; request jsonb;
begin
 perform pg_advisory_xact_lock(18260918);
 select value into prior from kv_store_3bd0ade8 where key like 'PICKUP\_%' escape '\' and value->>'customerEmail'=lower(p_email) and value->>'requestKey'=p_input->>'requestKey';
 if prior is not null then return jsonb_build_object('created',false,'request',prior); end if;
 plan:=city_ride_group(p_email,p_cards,(p_input->>'readyInMinutes')::integer);
 if exists(select 1 from kv_store_3bd0ade8 k cross join lateral jsonb_array_elements(k.value->'riders') x where k.key like 'PICKUP\_%' escape '\' and k.value->>'status' in ('pending','accepted') and k.value->>'serviceDate'=plan->>'serviceDate' and exists(select 1 from jsonb_array_elements(p_cards) y where y->>'bookingId'=x->>'bookingId' and y->>'index'=x->>'index')) then raise exception 'One of these cardholders already has an active ride request'; end if;
 request:=p_input||plan||jsonb_build_object('id','PICKUP_'||gen_random_uuid(),'product','city-card-v1','customerEmail',lower(p_email),'customerName',plan->'riders'->0->>'name','bookingId',plan->'riders'->0->>'bookingId','status','pending','requestTime',now(),'createdAt',now(),'readyAt',now()+make_interval(mins=>(p_input->>'readyInMinutes')::integer));
 insert into kv_store_3bd0ade8(key,value) values(request->>'id',request);
 return jsonb_build_object('created',true,'request',request);
end;$$;
create function public.customer_city_pickups(p_email text) returns jsonb language sql security definer set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(value order by value->>'requestTime' desc),'[]') from (select value from kv_store_3bd0ade8 where key like 'PICKUP\_%' escape '\' and value->>'customerEmail'=lower(p_email) order by value->>'requestTime' desc limit 50) q;
$$;
create function public.cancel_city_pickup(p_email text,p_id text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r jsonb; begin
 perform pg_advisory_xact_lock(18260918);
 select value into r from kv_store_3bd0ade8 where key=p_id for update;
 if r is null or r->>'customerEmail' is distinct from lower(p_email) then raise exception 'Request unavailable'; end if;
 if r->>'status'='cancelled' then return r; end if;
 if r->>'status' not in ('pending','accepted') or r->>'pickedUpAt' is not null then raise exception 'Ride cannot be cancelled now'; end if;
 r:=r||jsonb_build_object('status','cancelled','cancelledAt',now(),'cancelledBy','customer');
 update kv_store_3bd0ade8 set value=r where key=p_id; return r;
end;$$;
alter function public.transition_pickup(text,text,text,text,text) rename to legacy_transition_pickup;
create function public.transition_pickup(p_id text,p_action text,p_actor_role text,p_actor_id text,p_driver_id text default null) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r jsonb; d jsonb; plan jsonb;
begin
 perform pg_advisory_xact_lock(18260918);
 select value into r from kv_store_3bd0ade8 where key=p_id for update;
 if r->>'product'='city-card-v1' then
  if coalesce(p_actor_role,'') not in ('admin','driver') then raise exception 'Access denied'; end if;
  if p_action in ('assign','pickup') then
   plan:=city_ride_group(r->>'customerEmail',r->'riders',0);
   select x into d from kv_store_3bd0ade8 k cross join lateral jsonb_array_elements(k.value) x where k.key='drivers_list' and x->>'id'=case when p_action='assign' then p_driver_id else r->>'acceptedBy' end;
   if d->>'status' in ('inactive','disabled') or coalesce(d->>'vehicleCategory','') not in ('tuk_tuk','other') or coalesce((d->>'passengerCapacity')::integer,0)<(r->>'groupSize')::integer or (plan->>'nonTukTuk')::boolean and d->>'vehicleCategory'='tuk_tuk' then raise exception 'Vehicle category or seat capacity is incompatible'; end if;
   if r->>'pickedUpAt' is not null and p_action='assign' then raise exception 'Ride already picked up'; end if;
  end if;
  if p_action='pickup' then
   if r->>'status' is distinct from 'accepted' or (p_actor_role='driver' and r->>'acceptedBy' is distinct from p_actor_id) then raise exception 'Access denied'; end if;
   r:=r||jsonb_build_object('pickedUpAt',coalesce(r->>'pickedUpAt',now()::text));
   update kv_store_3bd0ade8 set value=r where key=p_id; return r;
  end if;
  if p_action='complete' and r->>'pickedUpAt' is null then raise exception 'Record pickup before completing the ride'; end if;
 end if;
 return legacy_transition_pickup(p_id,p_action,p_actor_role,p_actor_id,p_driver_id);
end;$$;
revoke all on function public.city_ride_group(text,jsonb,integer),public.create_city_pickup(text,jsonb,jsonb),public.customer_city_pickups(text),public.cancel_city_pickup(text,text),public.transition_pickup(text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.city_ride_group(text,jsonb,integer),public.create_city_pickup(text,jsonb,jsonb),public.customer_city_pickups(text),public.cancel_city_pickup(text,text),public.transition_pickup(text,text,text,text,text) to service_role;
commit;


