-- Scanning-only merchant access. Existing admin endpoints own offer management.
create table public.merchants (
 id uuid primary key default gen_random_uuid(),name text not null,category text,location text,lat numeric,lng numeric,
 is_active boolean not null default true,created_at timestamptz not null default now()
);
create table public.deals (
 id uuid primary key default gen_random_uuid(),merchant_id uuid not null references merchants(id),title text not null,terms text,
 is_single_use boolean not null default true,is_active boolean not null default true,created_at timestamptz not null default now()
);
create table public.merchant_access (
 email text primary key check(email=lower(email)),merchant_id uuid not null references merchants(id),is_active boolean not null default true,created_at timestamptz not null default now()
);
create table public.city_perk_redemptions (
 id uuid primary key,merchant_id uuid not null references merchants(id),deal_id uuid not null references deals(id),
 booking_id text not null,passenger_index integer not null check(passenger_index>=0),staff_email text not null,
 title text not null,is_single_use boolean not null,redeemed_at timestamptz not null default now()
);
create index city_perk_usage on city_perk_redemptions(booking_id,passenger_index,deal_id);
alter table merchants enable row level security;
alter table deals enable row level security;
alter table merchant_access enable row level security;
alter table city_perk_redemptions enable row level security;
revoke all on merchants,deals,merchant_access,city_perk_redemptions from public,anon,authenticated;
grant select,insert,update,delete on merchants,deals,merchant_access to service_role;
grant select on city_perk_redemptions to service_role;

create function public.use_city_perk(p_email text,p_deal uuid,p_booking text,p_index integer,p_request uuid,p_commit boolean)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare merchant uuid; deal deals; b jsonb; passenger jsonb; prior city_perk_redemptions; receipt jsonb;
begin
 perform pg_advisory_xact_lock(18260918);
 select m.id into merchant from merchant_access a join merchants m on m.id=a.merchant_id
  where a.email=lower(p_email) and a.is_active and m.is_active for share of a,m;
 if merchant is null then raise exception 'Approved merchant access required'; end if;
 select * into prior from city_perk_redemptions where id=p_request;
 if prior.id is not null then
  if prior.merchant_id<>merchant or prior.staff_email<>lower(p_email) or prior.deal_id<>p_deal or prior.booking_id<>p_booking or prior.passenger_index<>p_index then raise exception 'Redemption reference unavailable'; end if;
  return jsonb_build_object('redeemed',true,'alreadyRecorded',true,'id',prior.id,'title',prior.title);
 end if;
 select * into deal from deals where id=p_deal and merchant_id=merchant and is_active for share;
 if deal.id is null then raise exception 'Offer unavailable for this merchant'; end if;
 select value into b from kv_store_3bd0ade8 where key=p_booking and value->>'id'=key;
 if b is null or b->>'product' is distinct from 'city-card-v1' or b->>'paymentStatus' is distinct from 'paid'
  or coalesce(b->>'status','') not in ('confirmed','completed') then raise exception 'This City Card is not active'; end if;
 if b->>'selectedDate' is distinct from (now() at time zone 'Europe/Lisbon')::date::text then raise exception 'Perks are available only on the card visit date'; end if;
 if p_index is null or p_index<0 or p_index>=jsonb_array_length(b->'passengers') then raise exception 'Invalid card'; end if;
 passenger:=b->'passengers'->p_index;
 if passenger->>'cancelledAt' is not null or passenger->>'ageBand' is distinct from 'full' then raise exception 'Only active full-price cards include perks'; end if;
 if deal.is_single_use and exists(select 1 from city_perk_redemptions where booking_id=p_booking and passenger_index=p_index and deal_id=p_deal) then raise exception 'This offer has already been used by this card'; end if;
 receipt:=jsonb_build_object('redeemed',p_commit,'alreadyRecorded',false,'id',p_request,'name',passenger->>'name','date',b->>'selectedDate','title',deal.title,'terms',deal.terms,'singleUse',deal.is_single_use);
 if p_commit then
  insert into city_perk_redemptions(id,merchant_id,deal_id,booking_id,passenger_index,staff_email,title,is_single_use)
   values(p_request,merchant,p_deal,p_booking,p_index,lower(p_email),deal.title,deal.is_single_use);
 end if;
 return receipt;
end; $$;
revoke all on function public.use_city_perk(text,uuid,text,integer,uuid,boolean) from public,anon,authenticated;
grant execute on function public.use_city_perk(text,uuid,text,integer,uuid,boolean) to service_role;
create function public.customer_perk_history(p_email text) returns setof jsonb
language sql stable security definer set search_path=public,pg_temp as $$
 select jsonb_build_object('cardId',r.booking_id||':'||r.passenger_index,'dealId',r.deal_id,'uses',count(*))
 from city_perk_redemptions r join kv_store_3bd0ade8 b on b.key=r.booking_id and b.value->>'id'=b.key
 where lower(b.value#>>'{contactInfo,email}')=lower(p_email)
 group by r.booking_id,r.passenger_index,r.deal_id;
$$;
revoke all on function public.customer_perk_history(text) from public,anon,authenticated;
grant execute on function public.customer_perk_history(text) to service_role;
