-- Read-only reports aggregate the full filtered set before pagination.
create function public.admin_sales_report(p_filters jsonb) returns jsonb
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare d1 date:=nullif(p_filters->>'from','')::date; d2 date:=nullif(p_filters->>'to','')::date;
 page integer:=coalesce((p_filters->>'page')::integer,0); basis text:=coalesce(p_filters->>'basis','ordered'); result jsonb;
begin
 if page<0 or page>100000 or (d1 is not null and d2 is not null and d1>d2) or basis not in ('ordered','visit') then raise exception 'Invalid report filters'; end if;
 with refunds as (
  select booking_id,sum(amount_cents) filter(where state='succeeded') paid,
   sum(amount_cents) filter(where state<>'succeeded') outstanding from city_card_refunds group by booking_id
 ), source as (
  select o.id,o.booking_id,o.email,o.created_at,
   case when basis='visit' then (o.purchase->>'selectedDate')::date else (o.created_at at time zone 'Europe/Lisbon')::date end report_date,
   o.purchase->>'selectedDate' visit_date,coalesce(s.seller->>'role','online') role,
   case when s.seller->>'role'='merchant' then 'merchant:'||coalesce(s.seller->>'merchantId',s.seller_id::text)
    when s.seller->>'role'='driver' then 'driver:'||coalesce(s.seller->>'driverId',s.seller_id::text)
    when s.id is not null then 'staff:'||s.seller_id::text else 'online' end seller_key,
   coalesce(s.seller->>'name',case when s.id is null then 'Online checkout' else 'Staff '||s.seller_id::text end) seller_name,
   case when s.id is null then 'stripe' else coalesce(s.payment_method,'unknown') end channel,
   coalesce((o.purchase#>>'{paymentQuote,amountCents}')::bigint,0) gross,
   coalesce(r.paid,0)::bigint refunded,coalesce(r.outstanding,0)::bigint outstanding,
   jsonb_array_length(o.purchase->'passengers') cards,
   (select count(*) from jsonb_array_elements(o.purchase->'passengers') p where p->>'ageBand'='full') full_cards,
   (select count(*) from jsonb_array_elements(o.purchase->'passengers') p where p->>'ageBand'='half') half_cards,
   (select count(*) from jsonb_array_elements(o.purchase->'passengers') p where p->>'ageBand'='free') free_cards,
   (select count(*) from jsonb_array_elements(coalesce(k.value->'passengers','[]'::jsonb)) p where p->>'cancelledAt' is not null) cancelled_cards
  from city_card_orders o left join staff_card_sales s on s.id=o.id
  left join refunds r on r.booking_id=o.booking_id left join kv_store_3bd0ade8 k on k.key=o.booking_id
  where o.state='paid'
 ), filtered as (
  select * from source where (d1 is null or report_date>=d1) and (d2 is null or report_date<=d2)
   and (coalesce(p_filters->>'role','')='' or role=p_filters->>'role')
   and (coalesce(p_filters->>'seller','')='' or seller_key=p_filters->>'seller')
   and (coalesce(p_filters->>'channel','')='' or channel=p_filters->>'channel')
   and (coalesce(p_filters->>'q','')='' or position(lower(p_filters->>'q') in lower(email||' '||coalesce(booking_id,'')||' '||id::text||' '||seller_name))>0)
 ), grouped as (
  select seller_key key,max(seller_name) name,role,count(*) orders,sum(cards) cards,sum(gross) gross,
   sum(refunded) refunded,sum(outstanding) outstanding,sum(gross-refunded) net
   from filtered group by seller_key,role
 ), channels as (
  select channel,count(*) orders,sum(cards) cards,sum(gross) gross,sum(refunded) refunded,sum(outstanding) outstanding,sum(gross-refunded) net from filtered group by channel
 ), daily as (
  select report_date date,count(*) orders,sum(cards) cards,sum(gross) gross,sum(refunded) refunded,sum(outstanding) outstanding,sum(gross-refunded) net from filtered group by report_date
 ), paged as (select *,gross-refunded net from filtered order by report_date desc,created_at desc,id limit 25 offset page*25)
 select jsonb_build_object(
  'total',(select count(*) from filtered),'page',page,'pageSize',25,
  'summary',(select jsonb_build_object('orders',count(*),'cards',coalesce(sum(cards),0),'full',coalesce(sum(full_cards),0),'half',coalesce(sum(half_cards),0),'free',coalesce(sum(free_cards),0),'cancelled',coalesce(sum(cancelled_cards),0),'gross',coalesce(sum(gross),0),'refunded',coalesce(sum(refunded),0),'outstanding',coalesce(sum(outstanding),0),'net',coalesce(sum(gross-refunded),0)) from filtered),
  'sellers',coalesce((select jsonb_agg(to_jsonb(g) order by gross desc,key) from grouped g),'[]'),
  'channels',coalesce((select jsonb_agg(to_jsonb(c) order by channel) from channels c),'[]'),
  'daily',coalesce((select jsonb_agg(to_jsonb(d) order by date desc) from daily d),'[]'),
  'rows',coalesce((select jsonb_agg(to_jsonb(p) order by report_date desc,created_at desc,id) from paged p),'[]')
 ) into result;return result;
end; $$;

create function public.admin_perks_report(p_filters jsonb) returns jsonb
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare d1 date:=nullif(p_filters->>'from','')::date; d2 date:=nullif(p_filters->>'to','')::date; page integer:=coalesce((p_filters->>'page')::integer,0); result jsonb;
begin
 if page<0 or page>100000 or (d1 is not null and d2 is not null and d1>d2) then raise exception 'Invalid report filters'; end if;
 with filtered as (
  select r.*,m.name partner,(r.redeemed_at at time zone 'Europe/Lisbon')::date date from city_perk_redemptions r join merchants m on m.id=r.merchant_id
  where (d1 is null or r.redeemed_at>=d1::timestamp at time zone 'Europe/Lisbon')
   and (d2 is null or r.redeemed_at<(d2+1)::timestamp at time zone 'Europe/Lisbon')
   and (coalesce(p_filters->>'partner','')='' or r.merchant_id::text=p_filters->>'partner')
   and (coalesce(p_filters->>'q','')='' or position(lower(p_filters->>'q') in lower(m.name||' '||r.title||' '||r.booking_id||' '||r.staff_email))>0)
 ), partners as (
  select merchant_id key,max(partner) name,count(*) uses,count(distinct (booking_id,passenger_index)) unique_cards,count(distinct deal_id) offers,max(redeemed_at) last_use from filtered group by merchant_id
 ), offers as (
  select merchant_id,deal_id,max(partner) partner,max(title) title,count(*) uses,count(distinct (booking_id,passenger_index)) unique_cards from filtered group by merchant_id,deal_id
 ), daily as (select date,count(*) uses,count(distinct (booking_id,passenger_index)) unique_cards from filtered group by date),
 paged as (select * from filtered order by redeemed_at desc,id limit 25 offset page*25)
 select jsonb_build_object('total',(select count(*) from filtered),'page',page,'pageSize',25,
  'summary',(select jsonb_build_object('uses',count(*),'unique_cards',count(distinct (booking_id,passenger_index)),'partners',count(distinct merchant_id)) from filtered),
  'partners',coalesce((select jsonb_agg(to_jsonb(p) order by uses desc,key) from partners p),'[]'),
  'offers',coalesce((select jsonb_agg(to_jsonb(o) order by uses desc,deal_id) from offers o),'[]'),
  'daily',coalesce((select jsonb_agg(to_jsonb(d) order by date desc) from daily d),'[]'),
  'rows',coalesce((select jsonb_agg(to_jsonb(p) order by redeemed_at desc,id) from paged p),'[]')) into result;
 return result;
end; $$;
revoke all on function public.admin_sales_report(jsonb),public.admin_perks_report(jsonb) from public,anon,authenticated;
grant execute on function public.admin_sales_report(jsonb),public.admin_perks_report(jsonb) to service_role;
create index if not exists city_perk_report_date on public.city_perk_redemptions(redeemed_at desc,id);
create index if not exists city_order_report_date on public.city_card_orders(created_at desc,id) where state='paid';
