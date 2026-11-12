begin;
-- RLS filters rows, not columns. Preserve owner RLS while withholding secrets.
revoke select on public.card_instances from public, anon, authenticated;
revoke select (qr_secret) on public.card_instances from public, anon, authenticated;
grant select (
  id, card_product_id, user_id, buyer_email, valid_date, valid_from, valid_until,
  unique_code, status, sale_channel, sold_by, payment_method,
  stripe_payment_intent_id, created_at
) on public.card_instances to authenticated;
commit;
