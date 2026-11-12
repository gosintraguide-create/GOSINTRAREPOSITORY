-- Admin-only operational actions and an append-only audit history.
create table public.admin_activity (
 id uuid primary key default gen_random_uuid(),actor uuid not null,action text not null,target text not null,
 detail jsonb not null default '{}'::jsonb,created_at timestamptz not null default now()
);
alter table admin_activity enable row level security;
revoke all on admin_activity from public,anon,authenticated;
grant select,insert on admin_activity to service_role;
alter table city_card_refunds add column settlement_reference text;
alter table city_card_refunds add column settled_by uuid;
create function public.admin_city_card_quote(p_email text,p_booking text,p_index integer,p_override boolean)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare target jsonb; item record; cards jsonb:='[]'; selected boolean; no_companion boolean; result jsonb;
begin
 select value into target from kv_store_3bd0ade8 where key=p_booking and value->>'id'=key
  and lower(value#>>'{contactInfo,email}')=lower(p_email) and value->>'product'='city-card-v1'
  and value->>'paymentStatus'='paid' and value->>'status' in ('confirmed','completed');
 if target is null or p_index is null or p_index< -1 or p_index>=jsonb_array_length(target->'passengers')
  or (p_index>=0 and target#>>array['passengers',p_index::text,'cancelledAt'] is not null) then raise exception 'Card unavailable for cancellation'; end if;
 if not coalesce(p_override,false) and (target->>'selectedDate')::date <= (now() at time zone 'Europe/Lisbon')::date then raise exception 'Free cancellation closed at 23:59 Lisbon time on the day before your visit'; end if;
 if exists(select 1 from checkout_holds where state='active' and kind='ticket' and purchase->>'selectedDate'=target->>'selectedDate' and lower(purchase#>>'{contactInfo,email}')=lower(p_email)) then raise exception 'Finish or cancel your unpaid checkout first'; end if;
 select not exists(select 1 from kv_store_3bd0ade8 k cross join lateral jsonb_array_elements(case when jsonb_typeof(k.value->'passengers')='array' then k.value->'passengers' else '[]'::jsonb end) with ordinality p(value,n)
  where k.value->>'id'=k.key and k.value->>'status' is distinct from 'cancelled' and k.value->>'paymentStatus'='paid'
  and k.value->>'selectedDate'=target->>'selectedDate' and lower(k.value#>>'{contactInfo,email}')=lower(p_email)
  and p.value->>'cancelledAt' is null and (p.value->>'ageBand'='full' or (p.value->>'ageBand' is null and p.value->>'type'='Adult'))
  and not(k.key=p_booking and (p_index=-1 or p.n=p_index+1))) into no_companion;
 for item in select k.key,k.value as booking,p.value as passenger,(p.n-1)::integer as idx
  from kv_store_3bd0ade8 k cross join lateral jsonb_array_elements(case when jsonb_typeof(k.value->'passengers')='array' then k.value->'passengers' else '[]'::jsonb end) with ordinality p(value,n)
  where k.value->>'id'=k.key and k.value->>'status' is distinct from 'cancelled' and k.value->>'paymentStatus'='paid'
  and k.value->>'selectedDate'=target->>'selectedDate' and lower(k.value#>>'{contactInfo,email}')=lower(p_email)
  and p.value->>'cancelledAt' is null order by k.key,p.n loop
  selected:=(item.key=p_booking and (p_index=-1 or item.idx=p_index)) or (no_companion and (item.passenger->>'ageBand' in ('half','free') or item.passenger->>'type'='Child'));
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


create function public.admin_cancel_city_cards(p_id uuid,p_email text,p_booking text,p_index integer,p_fingerprint text,p_actor uuid,p_reason text,p_override boolean)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare prior city_card_cancellations; plan jsonb; entry record; b jsonb; card jsonb; qty integer; amount integer;
begin
 perform pg_advisory_xact_lock(18260918);
 select * into prior from city_card_cancellations where id=p_id;
 if prior.id is not null then
  if prior.email<>lower(p_email) or prior.fingerprint<>p_fingerprint then raise exception 'Cancellation unavailable'; end if;
  return jsonb_build_object('id',p_id,'alreadyCancelled',true);
 end if;
 if p_actor is null or length(trim(coalesce(p_reason,'')))<5 then raise exception 'Enter a cancellation reason'; end if;
 plan:=admin_city_card_quote(p_email,p_booking,p_index,p_override);
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
 insert into admin_activity(actor,action,target,detail) values(p_actor,'cancel_cards',p_booking,jsonb_build_object('reason',p_reason,'serviceFailure',p_override,'plan',plan,'requestId',p_id));
 return jsonb_build_object('id',p_id,'alreadyCancelled',false);
end; $$;

create function public.settle_offline_refund(p_id uuid,p_actor uuid,p_reference text) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare job city_card_refunds;
begin
 select * into job from city_card_refunds where id=p_id for update;
 if job.id is null or job.payment_intent is not null or job.amount_cents=0 then raise exception 'Only offline refunds can be manually settled'; end if;
 if job.state='succeeded' then return; end if;
 if job.state<>'review' or p_actor is null or length(trim(coalesce(p_reference,'')))<3 then raise exception 'Enter a settlement reference'; end if;
 update city_card_refunds set state='succeeded',settlement_reference=p_reference,settled_by=p_actor,updated_at=now() where id=p_id;
 insert into admin_activity(actor,action,target,detail) values(p_actor,'settle_offline_refund',job.booking_id,jsonb_build_object('refundId',p_id,'amountCents',job.amount_cents,'reference',p_reference));
end; $$;
revoke all on function public.admin_city_card_quote(text,text,integer,boolean),public.admin_cancel_city_cards(uuid,text,text,integer,text,uuid,text,boolean),public.settle_offline_refund(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.admin_city_card_quote(text,text,integer,boolean),public.admin_cancel_city_cards(uuid,text,text,integer,text,uuid,text,boolean),public.settle_offline_refund(uuid,uuid,text) to service_role;
-- Status buttons must never bypass the card cancellation/refund transaction.
alter function public.set_day_pass_status(text,text) rename to legacy_set_day_pass_status;
create function public.set_day_pass_status(p_id text,p_status text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if exists(select 1 from kv_store_3bd0ade8 where key=p_id and value->>'product'='city-card-v1') then raise exception 'Use City Card cancellation and refund controls; card validity is date-based'; end if;
 return legacy_set_day_pass_status(p_id,p_status);
end; $$;
revoke all on function public.set_day_pass_status(text,text) from public,anon,authenticated;
grant execute on function public.set_day_pass_status(text,text) to service_role;
create function public.admin_city_card_finances() returns jsonb language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object(
 'grossCents',(select coalesce(sum((purchase#>>'{paymentQuote,amountCents}')::bigint),0) from city_card_orders where state='paid'),
 'refundedCents',(select coalesce(sum(amount_cents),0) from city_card_refunds where state='succeeded'),
 'outstandingCents',(select coalesce(sum(amount_cents),0) from city_card_refunds where state<>'succeeded'),
 'refundsOutstanding',(select count(*) from city_card_refunds where state<>'succeeded'),
 'emailsPending',(select count(*) from staff_card_sales where confirmed_at is not null and email_sent_at is null),
 'reservations',(select count(*) from city_card_orders where state='reserved'));
$$;
revoke all on function public.admin_city_card_finances() from public,anon,authenticated;
grant execute on function public.admin_city_card_finances() to service_role;
alter table city_card_orders add column ticket_email_sent_at timestamptz;
alter table city_card_orders add column ticket_email_error text;
