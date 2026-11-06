-- All day-pass writers must use this transaction. No anon/authenticated RPC access.
create or replace function public.commit_day_pass(p_booking jsonb, p_payment_id text default null)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare
  booking_id text := p_booking->>'id';
  visit_date text := p_booking->>'selectedDate';
  slot text := p_booking->>'timeSlot';
  qty integer := jsonb_array_length(p_booking->'passengers');
  slots jsonb;
  remaining integer;
  claimed jsonb;
  existing jsonb;
begin
  if booking_id is null or visit_date is null or visit_date !~ '^\d{4}-\d{2}-\d{2}$'
    or slot is null or slot not in ('9:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00')
    or qty is null or qty < 1 or qty > 50 then
    raise exception 'Invalid booking date, time or passenger count';
  end if;
  if p_payment_id is not null then
    perform pg_advisory_xact_lock(hashtextextended('payment:' || p_payment_id, 0));
    select value into claimed from kv_store_3bd0ade8 where key = 'pi_claimed_' || p_payment_id;
    if claimed is not null then
      select value into existing from kv_store_3bd0ade8 where key = claimed->>'bookingId';
      if existing is null then raise exception 'Claimed booking missing'; end if;
      return jsonb_build_object('alreadyExisted', true, 'booking', existing);
    end if;
  end if;
  insert into kv_store_3bd0ade8(key, value) values ('availability_' || visit_date,
    '{"9:00":50,"10:00":50,"11:00":50,"12:00":50,"13:00":50,"14:00":50,"15:00":50,"16:00":50}')
    on conflict (key) do nothing;
  select value into slots from kv_store_3bd0ade8 where key = 'availability_' || visit_date for update;
  -- Do not silently reset a legacy/malformed record to a larger capacity.
  if not (slots ? slot) or jsonb_typeof(slots->slot) <> 'number' then
    raise exception 'Capacity configuration needs review';
  end if;
  remaining := (slots->>slot)::integer;
  if remaining < qty then raise exception 'Not enough seats available'; end if;
  insert into kv_store_3bd0ade8(key, value) values (booking_id, p_booking);
  update kv_store_3bd0ade8 set value = jsonb_set(slots, array[slot], to_jsonb(remaining - qty))
    where key = 'availability_' || visit_date;
  if p_payment_id is not null then
    insert into kv_store_3bd0ade8(key,value) values ('pi_claimed_' || p_payment_id,
      jsonb_build_object('bookingId',booking_id,'claimedAt',now()));
    delete from kv_store_3bd0ade8 where key = 'pending_pi_' || p_payment_id;
  end if;
  return jsonb_build_object('alreadyExisted', false, 'booking', p_booking);
end;
$$;
revoke all on function public.commit_day_pass(jsonb,text) from public, anon, authenticated;
grant execute on function public.commit_day_pass(jsonb,text) to service_role;
