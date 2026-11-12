-- Preserve first-departure slots; apply an additional daily ceiling across channels.
create table public.day_pass_days (
  visit_date date primary key,
  capacity integer not null check(capacity between 0 and 100000),
  opens time not null default '09:00',
  closes time not null default '19:30',
  updated_at timestamptz not null default now(),
  check(opens < closes)
);
create table public.city_card_orders (
  id uuid primary key,
  owner_id uuid not null,
  email text not null,
  purchase jsonb not null,
  session_id text unique,
  checkout_url text,
  state text not null default 'reserved' check(state in ('reserved','paid','expired')),
  created_at timestamptz not null default now(),
  last_checked_at timestamptz,
  expires_at timestamptz not null default now()+interval '31 minutes',
  booking_id text
);
alter table public.day_pass_days enable row level security;
alter table public.city_card_orders enable row level security;
revoke all on public.day_pass_days, public.city_card_orders from public, anon, authenticated;
grant select on public.day_pass_days, public.city_card_orders to service_role;
grant update(session_id,checkout_url,last_checked_at) on public.city_card_orders to service_role;
create index city_card_order_owner on public.city_card_orders(owner_id,created_at desc);
create index city_card_pending on public.city_card_orders(expires_at) where state='reserved';

create function public.day_pass_inventory(p_date date)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare d day_pass_days; booked integer; held integer; slots jsonb; slot_details jsonb:='{}'; slot text; slot_booked integer; slot_held integer; slot_remaining integer; slot_available integer:=0;
begin
  select * into d from day_pass_days where visit_date=p_date;
  -- Owner-approved default: preserve 50 per slot, with a 400-card daily ceiling.
  if d.visit_date is null then d.capacity:=400; d.opens:='09:00'; d.closes:='19:30'; end if;
  select coalesce(sum(jsonb_array_length(value->'passengers')),0) into booked
    from kv_store_3bd0ade8 where value->>'id'=key and value->>'selectedDate'=p_date::text
      and jsonb_typeof(value->'passengers')='array' and value->>'status' is distinct from 'cancelled';
  select coalesce(sum(quantity),0) into held from checkout_holds
    where kind='ticket' and state='active' and purchase->>'selectedDate'=p_date::text;
  select value into slots from kv_store_3bd0ade8 where key='availability_'||p_date;
  foreach slot in array array['9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'] loop
    select coalesce(sum(jsonb_array_length(value->'passengers')),0) into slot_booked from kv_store_3bd0ade8
      where value->>'id'=key and value->>'selectedDate'=p_date::text and value->>'timeSlot'=slot
      and jsonb_typeof(value->'passengers')='array' and value->>'status' is distinct from 'cancelled';
    select coalesce(sum(quantity),0) into slot_held from checkout_holds where kind='ticket' and state='active'
      and purchase->>'selectedDate'=p_date::text and purchase->>'timeSlot'=slot;
    slot_remaining:=case when slots is null then greatest(0,50-slot_booked) when jsonb_typeof(slots->slot)='number' then greatest(0,(slots->>slot)::integer) else 0 end;
    slot_available:=slot_available+greatest(0,slot_remaining-slot_held);
    slot_details:=slot_details||jsonb_build_object(slot,jsonb_build_object('capacity',slot_remaining+slot_booked,
      'booked',slot_booked,'reserved',slot_held,'remaining',greatest(0,least(slot_remaining-slot_held,coalesce(d.capacity,0)-booked-held))));
  end loop;
  return jsonb_build_object('date',p_date,'configured',true,'customized',d.visit_date is not null,
    'capacity',coalesce(d.capacity,0),'booked',booked,'reserved',held,
    'remaining',greatest(0,least(slot_available,coalesce(d.capacity,0)-booked-held)),
    'opens',to_char(d.opens,'HH24:MI'),'closes',to_char(d.closes,'HH24:MI'),'timezone','Europe/Lisbon','slots',slot_details);
end; $$;

-- Existing explicitly configured slot stock is retained. Its sum is the initial
-- daily ceiling; operators may lower/raise that ceiling separately afterward.
insert into day_pass_days(visit_date,capacity)
select substring(k.key from 14)::date,
  (select coalesce(sum((s.value)::integer),0) from jsonb_each_text(k.value) s
    where s.key in ('9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00') and s.value~'^\d+$')
  + (select coalesce(sum(jsonb_array_length(b.value->'passengers')),0) from kv_store_3bd0ade8 b
      where b.value->>'id'=b.key and b.value->>'selectedDate'=substring(k.key from 14)
        and jsonb_typeof(b.value->'passengers')='array' and b.value->>'status' is distinct from 'cancelled')
from kv_store_3bd0ade8 k where k.key~'^availability_\d{4}-\d{2}-\d{2}$'
  and jsonb_typeof(k.value)='object' and exists(select 1 from jsonb_each_text(k.value) s
    where s.key in ('9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00') and s.value~'^\d+$');

create function public.set_day_pass_day(p_date date,p_capacity integer,p_opens time,p_closes time,p_slots jsonb default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare stock jsonb; previous day_pass_days; slot text; remaining jsonb:='{}'; total integer;
begin
  perform pg_advisory_xact_lock(18260918);
  stock:=day_pass_inventory(p_date);
  if p_capacity < (stock->>'booked')::integer+(stock->>'reserved')::integer then
    raise exception 'Capacity cannot be lower than booked and reserved places';
  end if;
  select * into previous from day_pass_days where visit_date=p_date;
  -- Existing tickets promise these hours. Do not silently shorten their validity.
  if (stock->>'booked')::integer+(stock->>'reserved')::integer>0
    and (p_opens>(stock->>'opens')::time or p_closes<(stock->>'closes')::time) then
    raise exception 'Cannot shorten hours while cards or reservations exist';
  end if;
  insert into day_pass_days values(p_date,p_capacity,p_opens,p_closes,now())
    on conflict(visit_date) do update set capacity=excluded.capacity,opens=excluded.opens,closes=excluded.closes,updated_at=now();
  if p_slots is not null then
    foreach slot in array array['9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'] loop
      if jsonb_typeof(p_slots->slot) is distinct from 'number' or (p_slots->>slot)!~'^\d+$' then raise exception 'Set a whole-number capacity for every time slot'; end if;
      total:=(p_slots->>slot)::integer;
      if total>100000 or total<(stock#>>array['slots',slot,'booked'])::integer+(stock#>>array['slots',slot,'reserved'])::integer then raise exception 'Slot capacity cannot be lower than booked and reserved places'; end if;
      remaining:=remaining||jsonb_build_object(slot,total-(stock#>>array['slots',slot,'booked'])::integer);
    end loop;
    insert into kv_store_3bd0ade8 values('availability_'||p_date,remaining||jsonb_build_object('date',p_date))
      on conflict(key) do update set value=excluded.value;
  end if;
  return day_pass_inventory(p_date);
end; $$;

alter function public.check_checkout_capacity(text,jsonb,text) rename to check_checkout_capacity_legacy;
create function public.check_checkout_capacity(p_kind text,p_purchase jsonb,p_payment text default null)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
declare stock jsonb; own_qty integer:=0; own_slot integer:=0; qty integer; slot text; detail jsonb;
begin
  if p_kind<>'ticket' then perform check_checkout_capacity_legacy(p_kind,p_purchase,p_payment); return; end if;
  perform pg_advisory_xact_lock(18260918);
  stock:=day_pass_inventory((p_purchase->>'selectedDate')::date);
  qty:=jsonb_array_length(p_purchase->'passengers');
  slot:=p_purchase->>'timeSlot';detail:=stock#>array['slots',slot];
  if detail is null then raise exception 'Choose a valid first-departure time slot'; end if;
  if not (stock->>'configured')::boolean then raise exception 'This visit date is not open for booking'; end if;
  if qty is null or qty<1 or qty>50 then raise exception 'Choose between 1 and 50 cards'; end if;
  select coalesce(sum(quantity),0) into own_qty from checkout_holds where payment_id=p_payment
    and kind='ticket' and state='active' and purchase->>'selectedDate'=p_purchase->>'selectedDate';
  select coalesce(sum(quantity),0) into own_slot from checkout_holds where payment_id=p_payment
    and kind='ticket' and state='active' and purchase->>'selectedDate'=p_purchase->>'selectedDate' and purchase->>'timeSlot'=slot;
  if (detail->>'capacity')::integer-(detail->>'booked')::integer-(detail->>'reserved')::integer+own_slot<qty then
    raise exception 'Not enough cards available in this time slot';
  end if;
  -- Use the un-clamped count: capacity reductions cannot create phantom stock.
  if (stock->>'capacity')::integer-(stock->>'booked')::integer-(stock->>'reserved')::integer+own_qty<qty then
    raise exception 'Not enough cards available for this date';
  end if;
end; $$;

create or replace function public.commit_day_pass_without_hold(p_booking jsonb,p_payment_id text default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare claimed jsonb; existing jsonb; booking_id text:=p_booking->>'id'; slot text:=p_booking->>'timeSlot'; qty integer:=jsonb_array_length(p_booking->'passengers');
begin
  if p_payment_id is not null then
    select value into claimed from kv_store_3bd0ade8 where key='pi_claimed_'||p_payment_id;
    if claimed is not null then
      select value into existing from kv_store_3bd0ade8 where key=claimed->>'bookingId';
      if existing is null then raise exception 'Claimed booking missing'; end if;
      return jsonb_build_object('alreadyExisted',true,'booking',existing);
    end if;
  end if;
  if booking_id is null then raise exception 'Missing booking ID'; end if;
  insert into kv_store_3bd0ade8 values('availability_'||(p_booking->>'selectedDate'),
    '{"9:00":50,"10:00":50,"11:00":50,"12:00":50,"13:00":50,"14:00":50,"15:00":50,"16:00":50}') on conflict(key) do nothing;
  insert into kv_store_3bd0ade8 values(booking_id,p_booking);
  update kv_store_3bd0ade8 set value=jsonb_set(value,array[slot],to_jsonb((value->>slot)::integer-qty))
    where key='availability_'||(p_booking->>'selectedDate');
  if p_payment_id is not null then
    insert into kv_store_3bd0ade8 values('pi_claimed_'||p_payment_id,jsonb_build_object('bookingId',booking_id,'claimedAt',now()));
    delete from kv_store_3bd0ade8 where key='pending_pi_'||p_payment_id;
  end if;
  return jsonb_build_object('alreadyExisted',false,'booking',p_booking);
end; $$;

create function public.reserve_city_cards(p_id uuid,p_owner uuid,p_email text,p_purchase jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare existing city_card_orders; deadline timestamptz; stock jsonb; companion boolean;
begin
  perform pg_advisory_xact_lock(18260918);
  select * into existing from city_card_orders where id=p_id;
  if existing.id is not null then
    if existing.owner_id<>p_owner then raise exception 'Reservation unavailable'; end if;
    return to_jsonb(existing);
  end if;
  if exists(select 1 from city_card_orders where owner_id=p_owner and state='reserved') then
    raise exception 'Finish or cancel your current checkout before starting another';
  end if;
  if exists(select 1 from kv_store_3bd0ade8 where key='ticket_purchases_enabled' and value='false'::jsonb) then
    raise exception 'Card sales are currently paused';
  end if;
  stock:=day_pass_inventory((p_purchase->>'selectedDate')::date);
  if p_purchase#>>'{transportHours,opens}' is distinct from stock->>'opens'
    or p_purchase#>>'{transportHours,closes}' is distinct from stock->>'closes' then
    raise exception 'Operating hours changed. Refresh your visit date before checkout';
  end if;
  if (p_purchase->>'selectedDate')::date<(now() at time zone 'Europe/Lisbon')::date
    or ((p_purchase->>'selectedDate')::date=(now() at time zone 'Europe/Lisbon')::date
      and ((now() at time zone 'Europe/Lisbon')::time >= (stock->>'closes')::time
        or (now() at time zone 'Europe/Lisbon')::time < (stock->>'opens')::time)) then
    raise exception 'Same-day purchases are available during operating hours only';
  end if;
  select exists(select 1 from jsonb_array_elements(p_purchase->'passengers') p where p->>'ageBand'='full')
    or exists(select 1 from kv_store_3bd0ade8 k, lateral jsonb_array_elements(case when jsonb_typeof(k.value->'passengers')='array' then k.value->'passengers' else '[]'::jsonb end) p
      where k.value->>'id'=k.key and k.value->>'selectedDate'=p_purchase->>'selectedDate'
        and lower(k.value#>>'{contactInfo,email}')=lower(p_email) and k.value->>'status' is distinct from 'cancelled'
        and k.value->>'paymentStatus'='paid' and (p->>'ageBand'='full' or (p->>'ageBand' is null and p->>'type'='Adult')))
    into companion;
  if not companion then raise exception 'Children need a full-price cardholder on this date'; end if;
  perform check_checkout_capacity('ticket',p_purchase);
  insert into city_card_orders(id,owner_id,email,purchase) values(p_id,p_owner,lower(p_email),p_purchase) returning * into existing;
  insert into checkout_holds(payment_id,kind,resource,quantity,purchase,expires_at)
    values('city_'||p_id,'ticket','ticket:'||(p_purchase->>'selectedDate')||':'||(p_purchase->>'timeSlot'),jsonb_array_length(p_purchase->'passengers'),p_purchase,existing.expires_at);
  return to_jsonb(existing);
end; $$;

create function public.finish_city_cards(p_id uuid,p_booking jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare o city_card_orders; result jsonb;
begin
  perform pg_advisory_xact_lock(18260918);
  select * into o from city_card_orders where id=p_id for update;
  if o.id is null or o.state='expired' then raise exception 'Reservation unavailable'; end if;
  if p_booking->>'selectedDate' is distinct from o.purchase->>'selectedDate'
    or p_booking->'passengers' is distinct from o.purchase->'passengers'
    or p_booking#>>'{contactInfo,email}' is distinct from o.purchase#>>'{contactInfo,email}' then
    raise exception 'Booking does not match reservation';
  end if;
  result:=commit_day_pass(p_booking,'city_'||p_id);
  update city_card_orders set state='paid',booking_id=result#>>'{booking,id}' where id=p_id;
  return result;
end; $$;

create function public.expire_city_cards(p_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  perform pg_advisory_xact_lock(18260918);
  update city_card_orders set state='expired' where id=p_id and state='reserved';
  if found then perform release_checkout('city_'||p_id); end if;
end; $$;

create function public.customer_day_passes(p_email text)
returns setof jsonb language sql stable security definer set search_path=public,pg_temp as $$
  select value from kv_store_3bd0ade8 where value->>'id'=key and jsonb_typeof(value->'passengers')='array'
    and lower(value#>>'{contactInfo,email}')=lower(p_email) and value->>'paymentStatus'='paid'
  order by value->>'selectedDate' desc;
$$;

create function public.set_day_pass_status(p_id text,p_status text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare b jsonb;
begin
  perform pg_advisory_xact_lock(18260918);
  if p_status not in ('confirmed','completed','cancelled') then raise exception 'Invalid status'; end if;
  select value into b from kv_store_3bd0ade8 where key=p_id for update;
  if b is null then raise exception 'Booking not found'; end if;
  if b->>'status'='cancelled' and p_status<>'cancelled' then perform check_checkout_capacity('ticket',b); end if;
  -- A child's separately purchased card may rely on this full-price companion.
  if p_status='cancelled' and b->>'status' is distinct from 'cancelled' and exists(
    select 1 from checkout_holds where state='active' and kind='ticket'
      and purchase->>'selectedDate'=b->>'selectedDate'
      and lower(purchase#>>'{contactInfo,email}')=lower(b#>>'{contactInfo,email}')) then
    raise exception 'Resolve this customer''s active checkout before cancelling their booking';
  end if;
  if p_status='cancelled' and exists(
    select 1 from kv_store_3bd0ade8 k, lateral jsonb_array_elements(case when jsonb_typeof(k.value->'passengers')='array' then k.value->'passengers' else '[]'::jsonb end) p
    where k.value->>'id'=k.key and k.key<>p_id and k.value->>'status' is distinct from 'cancelled'
      and k.value->>'selectedDate'=b->>'selectedDate' and lower(k.value#>>'{contactInfo,email}')=lower(b#>>'{contactInfo,email}')
      and p->>'ageBand' in ('half','free')) and not exists(
    select 1 from kv_store_3bd0ade8 k, lateral jsonb_array_elements(case when jsonb_typeof(k.value->'passengers')='array' then k.value->'passengers' else '[]'::jsonb end) p
    where k.value->>'id'=k.key and k.key<>p_id and k.value->>'status' is distinct from 'cancelled'
      and k.value->>'paymentStatus'='paid' and k.value->>'selectedDate'=b->>'selectedDate'
      and lower(k.value#>>'{contactInfo,email}')=lower(b#>>'{contactInfo,email}')
      and (p->>'ageBand'='full' or (p->>'ageBand' is null and p->>'type'='Adult'))) then
    raise exception 'Cancel the dependent child cards before cancelling the last full-price companion';
  end if;
  if coalesce(b->>'status'='cancelled',false) is distinct from (p_status='cancelled') then
    update kv_store_3bd0ade8 set value=jsonb_set(value,array[b->>'timeSlot'],to_jsonb((value->>(b->>'timeSlot'))::integer
      +case when p_status='cancelled' then 1 else -1 end*jsonb_array_length(b->'passengers')))
      where key='availability_'||(b->>'selectedDate') and value ? (b->>'timeSlot');
  end if;
  b:=b||jsonb_build_object('status',p_status,'statusUpdatedAt',now());
  update kv_store_3bd0ade8 set value=b where key=p_id;
  return b;
end; $$;
revoke all on function public.set_day_pass_status(text,text) from public,anon,authenticated;
grant execute on function public.set_day_pass_status(text,text) to service_role;

revoke all on function public.day_pass_inventory(date), public.set_day_pass_day(date,integer,time,time,jsonb),
 public.check_checkout_capacity(text,jsonb,text),public.reserve_city_cards(uuid,uuid,text,jsonb),
 public.finish_city_cards(uuid,jsonb),public.expire_city_cards(uuid),public.customer_day_passes(text) from public,anon,authenticated;
grant execute on function public.day_pass_inventory(date), public.set_day_pass_day(date,integer,time,time,jsonb),
 public.reserve_city_cards(uuid,uuid,text,jsonb),public.finish_city_cards(uuid,jsonb),
 public.expire_city_cards(uuid),public.customer_day_passes(text) to service_role;
