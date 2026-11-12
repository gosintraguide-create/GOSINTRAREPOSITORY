create or replace function public.commit_tour_booking(p_booking jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  bookings jsonb; tour jsonb; existing jsonb; capacity integer; used integer;
  qty integer := (p_booking#>>'{customerInfo,numberOfPeople}')::integer;
  visit text := left(p_booking->>'tourDate',10);
begin
  if qty is null or qty < 1 or qty > 20 or visit is null or visit !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Invalid tour details'; end if;
  insert into kv_store_3bd0ade8 values ('tour_bookings','[]') on conflict (key) do nothing;
  select value into bookings from kv_store_3bd0ade8 where key='tour_bookings' for update;
  if p_booking->>'paymentIntentId' is not null then
    select b into existing from jsonb_array_elements(bookings) b where b->>'paymentIntentId'=p_booking->>'paymentIntentId' limit 1;
    if existing is not null then return jsonb_build_object('alreadyExisted',true,'booking',existing); end if;
  end if;
  select t into tour from kv_store_3bd0ade8 k, lateral jsonb_array_elements(k.value) t where k.key='private_tours' and t->>'id'=p_booking->>'tourId';
  if tour is null then raise exception 'Tour not found'; end if;
  capacity := coalesce((tour->>'maxGroupSize')::integer,10);
  select coalesce(sum(coalesce((b#>>'{customerInfo,numberOfPeople}')::integer,1)),0) into used from jsonb_array_elements(bookings) b
    where b->>'tourId'=p_booking->>'tourId' and left(b->>'tourDate',10)=visit and b->>'status' is distinct from 'cancelled';
  if used+qty>capacity then raise exception 'Not enough tour places available'; end if;
  update kv_store_3bd0ade8 set value=bookings || jsonb_build_array(p_booking) where key='tour_bookings';
  return jsonb_build_object('alreadyExisted',false,'booking',p_booking);
end; $$;
revoke all on function public.commit_tour_booking(jsonb) from public, anon, authenticated;
grant execute on function public.commit_tour_booking(jsonb) to service_role;

create or replace function public.commit_sunset_booking(p_booking_id text,p_addon jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  booking jsonb; entries jsonb; capacity integer; used integer;
  visit text := p_addon->>'sunsetDate'; qty integer := (p_addon->>'quantity')::integer;
begin
  if qty is null or qty<1 or visit is null or visit !~ '^\d{4}-\d{2}-\d{2}$' then raise exception 'Invalid sunset purchase'; end if;
  insert into kv_store_3bd0ade8 values ('sunset_bookings_' || visit,'[]') on conflict (key) do nothing;
  select value into entries from kv_store_3bd0ade8 where key='sunset_bookings_' || visit for update;
  select value into booking from kv_store_3bd0ade8 where key=p_booking_id for update;
  if booking is null or booking->>'paymentStatus' is distinct from 'paid' or booking->>'status'='cancelled' then raise exception 'Paid booking required'; end if;
  if exists(select 1 from jsonb_array_elements(entries) b where b->>'paymentIntentId'=p_addon->>'paymentIntentId') then return jsonb_build_object('alreadyExisted',true,'booking',booking); end if;
  if booking->'sunsetSpecial' is not null then raise exception 'Sunset special already attached; contact support'; end if;
  select (value#>>'{homepage,sunsetSpecial,maxSeats}')::integer into capacity from kv_store_3bd0ade8 where key='comprehensive_content';
  if capacity is null or capacity<1 then raise exception 'Sunset capacity needs configuration'; end if;
  select coalesce(sum(coalesce((b->>'quantity')::integer,1)),0) into used from jsonb_array_elements(entries) b;
  if used+qty>capacity then raise exception 'Not enough sunset seats available'; end if;
  booking := jsonb_set(booking,'{sunsetSpecial}',jsonb_build_object('date',visit,'quantity',qty,'amount',p_addon->'amount','paymentIntentId',p_addon->>'paymentIntentId','addedAt',now()));
  update kv_store_3bd0ade8 set value=booking where key=p_booking_id;
  update kv_store_3bd0ade8 set value=entries || jsonb_build_array(jsonb_build_object('bookingId',p_booking_id,'quantity',qty,'paymentIntentId',p_addon->>'paymentIntentId','addedAt',now())) where key='sunset_bookings_' || visit;
  return jsonb_build_object('alreadyExisted',false,'booking',booking);
end; $$;
revoke all on function public.commit_sunset_booking(text,jsonb) from public, anon, authenticated;
grant execute on function public.commit_sunset_booking(text,jsonb) to service_role;

create or replace function public.cancel_tour_booking(p_id text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare bookings jsonb; updated jsonb; target jsonb;
begin
  select value into bookings from kv_store_3bd0ade8 where key='tour_bookings' for update;
  select b into target from jsonb_array_elements(bookings) b where coalesce(b->>'id',b->>'bookingId')=p_id limit 1;
  if target is null then raise exception 'Booking not found'; end if;
  target := target || jsonb_build_object('status','cancelled','cancelledAt',now());
  select jsonb_agg(case when coalesce(b->>'id',b->>'bookingId')=p_id then target else b end) into updated from jsonb_array_elements(bookings) b;
  update kv_store_3bd0ade8 set value=updated where key='tour_bookings';
  return target;
end; $$;
revoke all on function public.cancel_tour_booking(text) from public, anon, authenticated;
grant execute on function public.cancel_tour_booking(text) to service_role;
