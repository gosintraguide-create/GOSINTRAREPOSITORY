alter table public.merchant_access add column can_sell boolean not null default false;
create table public.staff_card_sales (
 id uuid primary key references city_card_orders(id), seller_id uuid not null, seller jsonb not null,
 payment_method text check(payment_method in ('cash','terminal')), payment_reference text,
 confirmed_at timestamptz, email_sent_at timestamptz, email_error text,
 created_at timestamptz not null default now()
);
alter table staff_card_sales enable row level security;
revoke all on staff_card_sales from public,anon,authenticated;
grant select,update on staff_card_sales to service_role;

create function public.reserve_staff_cards(p_id uuid,p_seller_id uuid,p_seller jsonb,p_purchase jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare sale staff_card_sales; o jsonb;
begin
 perform pg_advisory_xact_lock(18260918);
 select * into sale from staff_card_sales where id=p_id;
 if sale.id is not null then
  if sale.seller_id<>p_seller_id then raise exception 'Sale unavailable'; end if;
  select to_jsonb(c) into o from city_card_orders c where id=p_id;
  return o;
 end if;
 if exists(select 1 from city_card_orders where id=p_id) then raise exception 'Sale reference unavailable'; end if;
 o:=reserve_city_cards(p_id,p_seller_id,p_purchase#>>'{contactInfo,email}',p_purchase||jsonb_build_object('salesChannel','staff'));
 insert into staff_card_sales(id,seller_id,seller) values(p_id,p_seller_id,p_seller);
 return o;
end; $$;
create function public.confirm_staff_cards(p_id uuid,p_seller_id uuid,p_method text,p_reference text,p_booking jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare sale staff_card_sales; o city_card_orders; result jsonb;
begin
 perform pg_advisory_xact_lock(18260918);
 select * into sale from staff_card_sales where id=p_id for update;
 if sale.id is null or sale.seller_id<>p_seller_id then raise exception 'Sale unavailable'; end if;
 select * into o from city_card_orders where id=p_id for update;
 if o.state='paid' then
  return jsonb_build_object('alreadyExisted',true,'booking',(select value from kv_store_3bd0ade8 where key=o.booking_id));
 end if;
 if o.state<>'reserved' or o.expires_at<=now() then raise exception 'Reservation expired. Do not collect payment; reserve again'; end if;
 if p_method is null or p_method not in ('cash','terminal') then raise exception 'Choose cash or card terminal'; end if;
 if p_method='terminal' and length(trim(coalesce(p_reference,'')))<1 then raise exception 'Enter the terminal receipt reference'; end if;
 if length(coalesce(p_reference,''))>100 then raise exception 'Receipt reference is too long'; end if;
 result:=finish_city_cards(p_id,p_booking||jsonb_build_object('source','city-card-staff','seller',sale.seller,
  'paymentMethod',p_method,'paymentReference',p_reference,'paymentIntentId',null));
 update staff_card_sales set payment_method=p_method,payment_reference=p_reference,confirmed_at=now() where id=p_id;
 if sale.seller->>'role'='driver' then
  insert into kv_store_3bd0ade8(key,value) values('driver_sales_'||(sale.seller->>'driverId'),jsonb_build_array(jsonb_build_object(
   'id',result#>>'{booking,id}','driverId',sale.seller->>'driverId','numberOfPeople',jsonb_array_length(o.purchase->'passengers'),
   'firstName',o.purchase#>>'{contactInfo,name}','lastName','','customerEmail',o.email,'amount',(o.purchase#>>'{paymentQuote,amountCents}')::numeric/100,
   'paymentMethod',case when p_method='terminal' then 'card' else 'cash' end,'selectedDate',o.purchase->>'selectedDate','date',o.purchase->>'selectedDate',
   'timeSlot',o.purchase->>'timeSlot','createdAt',now(),'type','driver_sale')))
  on conflict(key) do update set value=kv_store_3bd0ade8.value||excluded.value;
  insert into kv_store_3bd0ade8(key,value) values('driver_activity_'||(sale.seller->>'driverId'),jsonb_build_array(jsonb_build_object(
   'type','sale','timestamp',now(),'quantity',jsonb_array_length(o.purchase->'passengers'),'amount',(o.purchase#>>'{paymentQuote,amountCents}')::numeric/100,
   'bookingId',result#>>'{booking,id}','customerName',o.purchase#>>'{contactInfo,name}')))
  on conflict(key) do update set value=kv_store_3bd0ade8.value||excluded.value;
 end if;
 return result;
end; $$;
revoke all on function public.reserve_staff_cards(uuid,uuid,jsonb,jsonb),public.confirm_staff_cards(uuid,uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.reserve_staff_cards(uuid,uuid,jsonb,jsonb),public.confirm_staff_cards(uuid,uuid,text,text,jsonb) to service_role;
