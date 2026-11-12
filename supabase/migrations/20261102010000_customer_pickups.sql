begin;
create or replace function public.create_customer_pickup(p_booking_id text,p_request jsonb,p_identity jsonb) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare booking jsonb; existing jsonb; created jsonb; today text:=to_char(now() at time zone 'Europe/Lisbon','YYYY-MM-DD');
begin
  -- Serialize every request for the same booking, including retries on separate devices.
  perform pg_advisory_xact_lock(hashtextextended('customer-pickup:'||p_booking_id,0));
  select value into booking from kv_store_3bd0ade8 where key=p_booking_id for update;
  if booking is null then select value into booking from kv_store_3bd0ade8 where key='booking_'||p_booking_id for update; end if;
  if booking is null or booking->>'status' is distinct from 'confirmed' or booking->>'selectedDate' is distinct from today
    or booking->'passengers' is distinct from p_identity->'passengers' or booking->'contactInfo' is distinct from p_identity->'contactInfo'
    or booking->'paymentIntentId' is distinct from p_identity->'paymentIntentId' or booking->'paymentStatus' is distinct from p_identity->'paymentStatus'
    then raise exception 'Booking changed or is no longer eligible'; end if;
  if (p_request->>'groupSize')::integer not between 1 and jsonb_array_length(booking->'passengers') then raise exception 'Invalid group size'; end if;
  select value into existing from kv_store_3bd0ade8 where key like 'PICKUP\_%' escape '\'
    and value->>'bookingId'=p_booking_id and value->>'requestKey'=p_request->>'requestKey' limit 1;
  if existing is not null then return jsonb_build_object('created',false,'request',existing); end if;
  select value into existing from kv_store_3bd0ade8 where key like 'PICKUP\_%' escape '\'
    and value->>'bookingId'=p_booking_id and value->>'status' in ('pending','accepted')
    and value->>'serviceDate'=today limit 1;
  if existing is not null then return jsonb_build_object('created',false,'request',existing); end if;
  created=p_request || jsonb_build_object('id','PICKUP_'||gen_random_uuid()::text,'bookingId',p_booking_id,
    'serviceDate',today,'status','pending','requestTime',now(),'createdAt',now(),
    'readyAt',now()+make_interval(mins=>(p_request->>'readyInMinutes')::integer),
    'customerName',booking->'contactInfo'->>'name','vehiclesNeeded',ceil((p_request->>'groupSize')::numeric/6));
  insert into kv_store_3bd0ade8(key,value) values(created->>'id',created);
  return jsonb_build_object('created',true,'request',created);
end; $$;
revoke all on function public.create_customer_pickup(text,jsonb,jsonb) from public,anon,authenticated;
grant execute on function public.create_customer_pickup(text,jsonb,jsonb) to service_role;
commit;
