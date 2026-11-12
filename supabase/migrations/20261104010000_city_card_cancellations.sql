-- Per-card cancellation preserves passenger indexes used by printed QR codes.
create function public.active_card_count(p_passengers jsonb) returns integer
language sql immutable set search_path=public,pg_temp as $$
 select count(*)::integer from jsonb_array_elements(p_passengers) p where p->>'cancelledAt' is null;
$$;
create table public.city_card_cancellations (
 id uuid primary key, email text not null, fingerprint text not null,
 created_at timestamptz not null default now()
);
create table public.city_card_refunds (
 id uuid primary key, cancellation_id uuid not null references city_card_cancellations(id),
 booking_id text not null, email text not null, amount_cents integer not null check(amount_cents>=0),
 payment_intent text, state text not null default 'pending' check(state in ('pending','submitted','succeeded','failed','review')),
 stripe_refund_id text unique, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(cancellation_id,booking_id)
);
alter table city_card_cancellations enable row level security;
alter table city_card_refunds enable row level security;
revoke all on city_card_cancellations,city_card_refunds from public,anon,authenticated;
grant select on city_card_cancellations,city_card_refunds to service_role;
grant update(state,stripe_refund_id,updated_at) on city_card_refunds to service_role;
create or replace function public.day_pass_inventory(p_date date)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare d day_pass_days; booked integer; held integer; slots jsonb; slot_details jsonb:='{}'; slot text; slot_booked integer; slot_held integer; slot_remaining integer; slot_available integer:=0;
begin
  select * into d from day_pass_days where visit_date=p_date;
  -- Owner-approved default: preserve 50 per slot, with a 400-card daily ceiling.
  if d.visit_date is null then d.capacity:=400; d.opens:='09:00'; d.closes:='19:30'; end if;
  select coalesce(sum(active_card_count(value->'passengers')),0) into booked
    from kv_store_3bd0ade8 where value->>'id'=key and value->>'selectedDate'=p_date::text
      and jsonb_typeof(value->'passengers')='array' and value->>'status' is distinct from 'cancelled';
  select coalesce(sum(quantity),0) into held from checkout_holds
    where kind='ticket' and state='active' and purchase->>'selectedDate'=p_date::text;
  select value into slots from kv_store_3bd0ade8 where key='availability_'||p_date;
  foreach slot in array array['9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00'] loop
    select coalesce(sum(active_card_count(value->'passengers')),0) into slot_booked from kv_store_3bd0ade8
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
create or replace function public.reserve_city_cards(p_id uuid,p_owner uuid,p_email text,p_purchase jsonb)
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
        and k.value->>'paymentStatus'='paid' and p->>'cancelledAt' is null and (p->>'ageBand'='full' or (p->>'ageBand' is null and p->>'type'='Adult')))
    into companion;
  if not companion then raise exception 'Children need a full-price cardholder on this date'; end if;
  perform check_checkout_capacity('ticket',p_purchase);
  insert into city_card_orders(id,owner_id,email,purchase) values(p_id,p_owner,lower(p_email),p_purchase) returning * into existing;
  insert into checkout_holds(payment_id,kind,resource,quantity,purchase,expires_at)
    values('city_'||p_id,'ticket','ticket:'||(p_purchase->>'selectedDate')||':'||(p_purchase->>'timeSlot'),jsonb_array_length(p_purchase->'passengers'),p_purchase,existing.expires_at);
  return to_jsonb(existing);
end; $$;
create or replace function public.set_day_pass_status(p_id text,p_status text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare b jsonb;
begin
  perform pg_advisory_xact_lock(18260918);
  if p_status not in ('confirmed','completed','cancelled') then raise exception 'Invalid status'; end if;
  select value into b from kv_store_3bd0ade8 where key=p_id for update;
  if b is null then raise exception 'Booking not found'; end if;
  if p_status<>'cancelled' and exists(select 1 from jsonb_array_elements(b->'passengers') p where p->>'cancelledAt' is not null) then raise exception 'Cancelled cards cannot be restored; issue a new booking'; end if;
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
      and p->>'cancelledAt' is null and p->>'ageBand' in ('half','free')) and not exists(
    select 1 from kv_store_3bd0ade8 k, lateral jsonb_array_elements(case when jsonb_typeof(k.value->'passengers')='array' then k.value->'passengers' else '[]'::jsonb end) p
    where k.value->>'id'=k.key and k.key<>p_id and k.value->>'status' is distinct from 'cancelled'
      and k.value->>'paymentStatus'='paid' and k.value->>'selectedDate'=b->>'selectedDate'
      and lower(k.value#>>'{contactInfo,email}')=lower(b#>>'{contactInfo,email}')
      and p->>'cancelledAt' is null and (p->>'ageBand'='full' or (p->>'ageBand' is null and p->>'type'='Adult'))) then
    raise exception 'Cancel the dependent child cards before cancelling the last full-price companion';
  end if;
  if coalesce(b->>'status'='cancelled',false) is distinct from (p_status='cancelled') then
    update kv_store_3bd0ade8 set value=jsonb_set(value,array[b->>'timeSlot'],to_jsonb((value->>(b->>'timeSlot'))::integer
      +case when p_status='cancelled' then 1 else -1 end*active_card_count(b->'passengers')))
      where key='availability_'||(b->>'selectedDate') and value ? (b->>'timeSlot');
  end if;
  b:=b||jsonb_build_object('status',p_status,'statusUpdatedAt',now());
  update kv_store_3bd0ade8 set value=b where key=p_id;
  return b;
end; $$;

create function public.city_card_cancel_quote(p_email text,p_booking text,p_index integer)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare target jsonb; item record; cards jsonb:='[]'; selected boolean; no_companion boolean; result jsonb;
begin
 select value into target from kv_store_3bd0ade8 where key=p_booking and value->>'id'=key
  and lower(value#>>'{contactInfo,email}')=lower(p_email) and value->>'product'='city-card-v1'
  and value->>'paymentStatus'='paid' and value->>'status'='confirmed';
 if target is null or p_index is null or p_index<0 or p_index>=jsonb_array_length(target->'passengers')
  or target#>>array['passengers',p_index::text,'cancelledAt'] is not null then raise exception 'Card unavailable for cancellation'; end if;
 if (target->>'selectedDate')::date <= (now() at time zone 'Europe/Lisbon')::date then raise exception 'Free cancellation closed at 23:59 Lisbon time on the day before your visit'; end if;
 if exists(select 1 from checkout_holds where state='active' and kind='ticket' and purchase->>'selectedDate'=target->>'selectedDate' and lower(purchase#>>'{contactInfo,email}')=lower(p_email)) then raise exception 'Finish or cancel your unpaid checkout first'; end if;
 select not exists(select 1 from kv_store_3bd0ade8 k cross join lateral jsonb_array_elements(case when jsonb_typeof(k.value->'passengers')='array' then k.value->'passengers' else '[]'::jsonb end) with ordinality p(value,n)
  where k.value->>'id'=k.key and k.value->>'status' is distinct from 'cancelled' and k.value->>'paymentStatus'='paid'
  and k.value->>'selectedDate'=target->>'selectedDate' and lower(k.value#>>'{contactInfo,email}')=lower(p_email)
  and p.value->>'cancelledAt' is null and (p.value->>'ageBand'='full' or (p.value->>'ageBand' is null and p.value->>'type'='Adult'))
  and not(k.key=p_booking and p.n=p_index+1)) into no_companion;
 for item in select k.key,k.value as booking,p.value as passenger,(p.n-1)::integer as idx
  from kv_store_3bd0ade8 k cross join lateral jsonb_array_elements(case when jsonb_typeof(k.value->'passengers')='array' then k.value->'passengers' else '[]'::jsonb end) with ordinality p(value,n)
  where k.value->>'id'=k.key and k.value->>'status' is distinct from 'cancelled' and k.value->>'paymentStatus'='paid'
  and k.value->>'selectedDate'=target->>'selectedDate' and lower(k.value#>>'{contactInfo,email}')=lower(p_email)
  and p.value->>'cancelledAt' is null order by k.key,p.n loop
  selected:=(item.key=p_booking and item.idx=p_index) or (no_companion and (item.passenger->>'ageBand' in ('half','free') or item.passenger->>'type'='Child'));
  if selected then
   if not exists(select 1 from city_card_orders o where o.booking_id=item.key and o.state='paid'
    and o.purchase#>array['passengers',item.idx::text]=item.passenger and lower(o.email)=lower(p_email)) then
    raise exception 'This cancellation includes a card requiring support; please contact us'; end if;
   cards:=cards||jsonb_build_array(jsonb_build_object('bookingId',item.key,'index',item.idx,'name',item.passenger->>'name','amountCents',(item.passenger->>'priceCents')::integer));
  end if;
 end loop;
 result:=jsonb_build_object('date',target->>'selectedDate','cards',cards,'totalCents',(select sum((v->>'amountCents')::integer) from jsonb_array_elements(cards) v));
 return result||jsonb_build_object('fingerprint',md5(result::text),'includesChildren',jsonb_array_length(cards)>1);
end; $$;

create function public.cancel_city_cards(p_id uuid,p_email text,p_booking text,p_index integer,p_fingerprint text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare prior city_card_cancellations; plan jsonb; entry record; b jsonb; card jsonb; qty integer; amount integer;
begin
 perform pg_advisory_xact_lock(18260918);
 select * into prior from city_card_cancellations where id=p_id;
 if prior.id is not null then
  if prior.email<>lower(p_email) or prior.fingerprint<>p_fingerprint then raise exception 'Cancellation unavailable'; end if;
  return jsonb_build_object('id',p_id,'alreadyCancelled',true);
 end if;
 plan:=city_card_cancel_quote(p_email,p_booking,p_index);
 if plan->>'fingerprint' is distinct from p_fingerprint then raise exception 'Cards changed. Review the cancellation again'; end if;
 insert into city_card_cancellations(id,email,fingerprint) values(p_id,lower(p_email),p_fingerprint);
 for entry in select distinct v->>'bookingId' as id from jsonb_array_elements(plan->'cards') v loop
  select value into b from kv_store_3bd0ade8 where key=entry.id for update;
  qty:=0;amount:=0;
  for card in select v from jsonb_array_elements(plan->'cards') v where v->>'bookingId'=entry.id loop
   b:=jsonb_set(b,array['passengers',card->>'index'],(b#>array['passengers',card->>'index'])||jsonb_build_object('cancelledAt',now(),'cancellationId',p_id));
   qty:=qty+1;amount:=amount+(card->>'amountCents')::integer;
  end loop;
  if active_card_count(b->'passengers')=0 then b:=b||jsonb_build_object('status','cancelled'); end if;
  update kv_store_3bd0ade8 set value=b where key=entry.id;
  update kv_store_3bd0ade8 set value=jsonb_set(value,array[b->>'timeSlot'],to_jsonb((value->>(b->>'timeSlot'))::integer+qty)) where key='availability_'||(b->>'selectedDate');
  insert into city_card_refunds(id,cancellation_id,booking_id,email,amount_cents,payment_intent,state)
   values(gen_random_uuid(),p_id,entry.id,lower(p_email),amount,b->>'paymentIntentId',case when amount=0 then 'succeeded' when b->>'paymentIntentId' is null then 'review' else 'pending' end);
 end loop;
 return jsonb_build_object('id',p_id,'alreadyCancelled',false);
end; $$;
revoke all on function public.active_card_count(jsonb),public.city_card_cancel_quote(text,text,integer),public.cancel_city_cards(uuid,text,text,integer,text) from public,anon,authenticated;
grant execute on function public.active_card_count(jsonb),public.city_card_cancel_quote(text,text,integer),public.cancel_city_cards(uuid,text,text,integer,text) to service_role;
