-- Sintra Day Card system: card products, issued cards, merchants, deals, redemptions.
-- See docs/mobile-app/SPEC.md for the product spec this implements.

create extension if not exists pgcrypto;

-- ===== card_products =====
-- The sellable card tiers. One row today ("Basic Day Card", €15); built to hold more.

create table card_products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price_cents integer not null,
  valid_from_time time not null default '08:30',
  valid_until_time time not null default '19:00',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table card_products enable row level security;

create policy "card_products are publicly readable when active"
  on card_products for select
  to anon, authenticated
  using (is_active = true);

-- ===== merchants =====

create table merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  location text,
  lat numeric,
  lng numeric,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table merchants enable row level security;

create policy "merchants are publicly readable when active"
  on merchants for select
  to anon, authenticated
  using (is_active = true);

-- ===== merchant_staff =====
-- One login per establishment. Mirrors the driver-login UX pattern, but with
-- hashed passwords (unlike the KV-store driver table, which stores plaintext).
-- No public RLS policies at all: contains password hashes, service-role only.

create table merchant_staff (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  username text not null unique,
  password_hash text not null,
  status text not null default 'active',
  last_login_at timestamptz,
  created_at timestamptz not null default now()
);

create index merchant_staff_merchant_id_idx on merchant_staff(merchant_id);

alter table merchant_staff enable row level security;

-- ===== deals =====

create table deals (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references merchants(id) on delete cascade,
  title text not null,
  terms text,
  is_single_use boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index deals_merchant_id_idx on deals(merchant_id);

alter table deals enable row level security;

create policy "deals are publicly readable when active"
  on deals for select
  to anon, authenticated
  using (is_active = true);

-- ===== card_instances =====
-- A purchased/issued card. user_id is null for driver-in-person cash/card
-- sales with no app account; buyer_email is always captured regardless.

create table card_instances (
  id uuid primary key default gen_random_uuid(),
  card_product_id uuid not null references card_products(id),
  user_id uuid references auth.users(id) on delete set null,
  buyer_email text not null,
  valid_date date not null,
  valid_from timestamptz not null,
  valid_until timestamptz not null,
  unique_code text not null unique,
  qr_secret text not null,
  status text not null default 'active'
    check (status in ('active', 'used', 'expired', 'refunded', 'cancelled')),
  sale_channel text not null check (sale_channel in ('app', 'driver_in_person')),
  sold_by text, -- driver's KV-store id string; not an FK, drivers aren't a Postgres table
  payment_method text check (payment_method in ('card', 'cash')),
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

create index card_instances_user_id_idx on card_instances(user_id);

alter table card_instances enable row level security;

create policy "users can read their own cards"
  on card_instances for select
  to authenticated
  using (auth.uid() = user_id);

-- ===== redemptions =====
-- Every ride/deal check-in. The partial unique index below enforces
-- single-use deals at the database level, not just in application code.

create table redemptions (
  id uuid primary key default gen_random_uuid(),
  card_instance_id uuid not null references card_instances(id) on delete cascade,
  type text not null check (type in ('ride', 'deal')),
  deal_id uuid references deals(id),
  staff_id uuid references merchant_staff(id),
  driver_id text, -- KV-store driver id
  redeemed_at timestamptz not null default now()
);

create index redemptions_card_instance_id_idx on redemptions(card_instance_id);

create unique index redemptions_one_per_deal_per_card
  on redemptions(card_instance_id, deal_id)
  where type = 'deal';

alter table redemptions enable row level security;

create policy "users can read redemptions on their own cards"
  on redemptions for select
  to authenticated
  using (
    exists (
      select 1 from card_instances
      where card_instances.id = redemptions.card_instance_id
        and card_instances.user_id = auth.uid()
    )
  );
