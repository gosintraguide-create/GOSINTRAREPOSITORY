-- Expiry alone NEVER releases places: Stripe must confirm cancellation first.
create table public.checkout_holds (
  payment_id text primary key,
  kind text not null check(kind in ('ticket','tour','addon')),
  resource text not null,
  quantity integer not null check(quantity>0),
  purchase jsonb not null,
  state text not null default 'active' check(state in ('active','consumed','released')),
  last_checked_at timestamptz,
  expires_at timestamptz not null default now()+interval '15 minutes'
);
alter table public.checkout_holds enable row level security;
revoke all on public.checkout_holds from public,anon,authenticated;
grant select on public.checkout_holds to service_role;
grant update(last_checked_at) on public.checkout_holds to service_role;
create index checkout_holds_resource on public.checkout_holds(resource) where state='active';

create function public.checkout_resource(p_kind text,p_purchase jsonb)
returns text language sql immutable as $$
  select case p_kind
    when 'ticket' then 'ticket:' || (p_purchase->>'selectedDate') || ':' || (p_purchase->>'timeSlot')
    when 'tour' then 'tour:' || (p_purchase->>'tourId') || ':' || left(p_purchase->>'tourDate',10)
    when 'addon' then 'addon:' || (p_purchase->>'sunsetDate') end;
$$;

create function public.check_checkout_capacity(p_kind text,p_purchase jsonb,p_payment text default null)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare remaining integer; held integer; qty integer; entries jsonb; tour jsonb; slots jsonb; v_resource text;
begin
  perform pg_advisory_xact_lock(18260918);
  v_resource := checkout_resource(p_kind,p_purchase);
  if v_resource is null then raise exception 'Missing purchase details'; end if;
  if p_kind='ticket' then
    qty := jsonb_array_length(p_purchase->'passengers');
    if (p_purchase->>'timeSlot') not in ('9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00') then raise exception 'Invalid departure time'; end if;
    select value into slots from kv_store_3bd0ade8 where key='availability_' || (p_purchase->>'selectedDate');
    remaining := case when slots is null then 50 else (slots->>(p_purchase->>'timeSlot'))::integer end;
  elsif p_kind='tour' then
    qty := (p_purchase#>>'{customerInfo,numberOfPeople}')::integer;
    select t into tour from kv_store_3bd0ade8 k, lateral jsonb_array_elements(k.value) t where k.key='private_tours' and t->>'id'=p_purchase->>'tourId';
    select value into entries from kv_store_3bd0ade8 where key='tour_bookings';
    select coalesce((tour->>'maxGroupSize')::integer,10)-coalesce(sum(coalesce((b#>>'{customerInfo,numberOfPeople}')::integer,1)),0) into remaining
      from jsonb_array_elements(coalesce(entries,'[]')) b where b->>'tourId'=p_purchase->>'tourId' and left(b->>'tourDate',10)=left(p_purchase->>'tourDate',10) and b->>'status' is distinct from 'cancelled';
    if tour is null then raise exception 'Tour unavailable'; end if;
  elsif p_kind='addon' then
    qty := (p_purchase->>'quantity')::integer;
    select (value#>>'{homepage,sunsetSpecial,maxSeats}')::integer into remaining from kv_store_3bd0ade8 where key='comprehensive_content';
    select value into entries from kv_store_3bd0ade8 where key='sunset_bookings_' || (p_purchase->>'sunsetDate');
    select remaining-coalesce(sum(coalesce((b->>'quantity')::integer,1)),0) into remaining from jsonb_array_elements(coalesce(entries,'[]')) b;
  else raise exception 'Invalid purchase kind'; end if;
  select coalesce(sum(quantity),0) into held from checkout_holds h where h.resource=v_resource and state='active' and (p_payment is null or payment_id<>p_payment);
  if remaining is null or qty is null or qty<1 or qty>50 then raise exception 'Capacity configuration needs review'; end if;
  if remaining-held<qty then raise exception 'Not enough places available. Please choose another date or time.'; end if;
end; $$;

create function public.reserve_checkout(p_payment text,p_kind text,p_purchase jsonb)
returns timestamptz language plpgsql security definer set search_path=public,pg_temp as $$
declare deadline timestamptz; qty integer; prefix text;
begin
  perform check_checkout_capacity(p_kind,p_purchase,p_payment);
  if p_kind='addon' then
    if exists(select 1 from checkout_holds where kind='addon' and state='active' and purchase->>'bookingId'=p_purchase->>'bookingId')
      or exists(select 1 from kv_store_3bd0ade8 where key=p_purchase->>'bookingId' and value->'sunsetSpecial' is not null) then
      raise exception 'A sunset purchase already exists for this booking. Please finish it or wait for it to expire.';
    end if;
  end if;
  qty := case p_kind when 'ticket' then jsonb_array_length(p_purchase->'passengers') when 'tour' then (p_purchase#>>'{customerInfo,numberOfPeople}')::integer else (p_purchase->>'quantity')::integer end;
  insert into checkout_holds(payment_id,kind,resource,quantity,purchase) values(p_payment,p_kind,checkout_resource(p_kind,p_purchase),qty,p_purchase) returning expires_at into deadline;
  prefix := case p_kind when 'ticket' then 'pending_pi_' when 'tour' then 'pending_tour_pi_' else 'pending_addon_pi_' end;
  insert into kv_store_3bd0ade8 values(prefix || p_payment,p_purchase || jsonb_build_object('pendingAt',now(),'holdExpiresAt',deadline));
  return deadline;
end; $$;

create function public.release_checkout(p_payment text)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  perform pg_advisory_xact_lock(18260918);
  update checkout_holds set state='released' where payment_id=p_payment and state='active';
end; $$;

alter function public.commit_day_pass(jsonb,text) rename to commit_day_pass_without_hold;
create function public.commit_day_pass(p_booking jsonb,p_payment_id text default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare result jsonb;
begin
  perform pg_advisory_xact_lock(18260918);
  if not exists(select 1 from kv_store_3bd0ade8 where key='pi_claimed_' || p_payment_id) then perform check_checkout_capacity('ticket',p_booking,p_payment_id); end if;
  result := commit_day_pass_without_hold(p_booking,p_payment_id);
  update checkout_holds set state='consumed' where payment_id=p_payment_id and state='active';
  return result;
end; $$;

alter function public.commit_tour_booking(jsonb) rename to commit_tour_booking_without_hold;
create function public.commit_tour_booking(p_booking jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare result jsonb; entries jsonb;
begin
  perform pg_advisory_xact_lock(18260918);
  select value into entries from kv_store_3bd0ade8 where key='tour_bookings';
  if not exists(select 1 from jsonb_array_elements(coalesce(entries,'[]')) b where b->>'paymentIntentId'=p_booking->>'paymentIntentId') then perform check_checkout_capacity('tour',p_booking,p_booking->>'paymentIntentId'); end if;
  result := commit_tour_booking_without_hold(p_booking);
  update checkout_holds set state='consumed' where payment_id=p_booking->>'paymentIntentId' and state='active';
  return result;
end; $$;

alter function public.commit_sunset_booking(text,jsonb) rename to commit_sunset_booking_without_hold;
create function public.commit_sunset_booking(p_booking_id text,p_addon jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare result jsonb; entries jsonb;
begin
  perform pg_advisory_xact_lock(18260918);
  select value into entries from kv_store_3bd0ade8 where key='sunset_bookings_' || (p_addon->>'sunsetDate');
  if not exists(select 1 from jsonb_array_elements(coalesce(entries,'[]')) b where b->>'paymentIntentId'=p_addon->>'paymentIntentId') then perform check_checkout_capacity('addon',p_addon,p_addon->>'paymentIntentId'); end if;
  result := commit_sunset_booking_without_hold(p_booking_id,p_addon);
  update checkout_holds set state='consumed' where payment_id=p_addon->>'paymentIntentId' and state='active';
  return result;
end; $$;

revoke all on function public.checkout_resource(text,jsonb), public.check_checkout_capacity(text,jsonb,text), public.reserve_checkout(text,text,jsonb), public.release_checkout(text), public.commit_day_pass(jsonb,text), public.commit_tour_booking(jsonb), public.commit_sunset_booking(text,jsonb) from public,anon,authenticated;
grant execute on function public.reserve_checkout(text,text,jsonb), public.release_checkout(text), public.commit_day_pass(jsonb,text), public.commit_tour_booking(jsonb), public.commit_sunset_booking(text,jsonb) to service_role;
