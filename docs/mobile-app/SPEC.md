# Sintra Day Card — Product & Technical Spec (v0.5, build-ready, single-tier scope)

Scope cut from v0.4: launching with **one card only**. Premium (guided tours + sunset ride) is deferred to phase 2 — noted where relevant but not part of the initial build.

## 1. Overview

A day card for Sintra tourists, sold and managed through a new native mobile app (iOS/Android), built on top of the existing HopOn Sintra system (hoponsintra.com — Vite/React + Supabase + Stripe). Phase 1 card gives access to:

- **Transport** — unlimited tuk tuk rides, 8:30–19:00 on the card's date.
- **Deals** — single-use discounts at listed stores/restaurants.
- **Map** — attraction information.

*Deferred to phase 2:* guided tours, the Cabo da Roca sunset ride, and the Premium tier that bundles them. The data model below is shaped so adding a second tier later is a small change, not a rework.

## 2. Card

| | |
|---|---|
| Price | €15 |
| Includes | Unlimited tuk tuk rides (8:30–19:00), all deals (single-use each) |
| Validity | Business hours (8:30–19:00) of the purchased date |

## 3. Reuse vs. New

**Reused as-is**, called from the new app via the existing Supabase Edge Function:
- Stripe payment intent + webhook
- Transactional email sending
- Weather/traffic info-bar (after the hardcoded-key fix — still outstanding, see below)
- Driver portal: login, dashboard, metrics, activity, in-person sales (`paymentMethod` card/cash logged, driver uses their own separate card machine)
- Admin panel and its content-management system — the app pulls attraction/content data from here

**New, on proper Postgres tables** (not the KV store):
- `card_products` (seeded with one row for now, but built to hold more), `card_instances`, `merchants`, `deals`, `redemptions`
- Merchant-staff login: mirrors the driver-login pattern (login → scoped view) but its own table/UI, since merchants only need deal validation
- Two new admin panel tabs: **Deals/Merchants** and **Card Tiers** (the latter only needs one row today, but exists so adding Premium later is just adding a row + screen, not new plumbing)

**Rebuilt cleanly:** the ticket purchase flow, against the new tables, reusing existing Stripe/email logic.

**Not built yet:** tour/experience booking, sunset-ride booking screens. The underlying endpoints already exist on the website side (`tour-availability`, `sunset-special/availability`) for when phase 2 starts — no new backend work needed there, just new screens.

## 4. Security fix (do this regardless of build order)

`info-bar`'s weather/traffic code has real API keys hardcoded as fallback literals in source. Rotate both keys and remove the hardcoded fallback.

## 5. Roles & Apps

| Role | Where | Notes |
|---|---|---|
| Tourist | New consumer mobile app | Buys card, rides, redeems deals, views map |
| Tuk tuk driver | Existing web driver portal | Unchanged |
| Merchant staff | New, small web view, one login per establishment | Scan/enter code → validate → confirm deal redemption |
| Admin (you) | Existing admin panel | Extended with Deals/Merchants and Card Tiers tabs |

## 6. Consumer App — Screens (phase 1)

- **Map** — attractions, sourced from the existing content system.
- **My Cards** — buy the card (single product, no tier picker needed yet), Stripe purchase, active card view (QR + fallback code).
- **Deals** — index of included deals, each showing redemption status.
- **Profile** — account, purchase history, language (EN/PT), support.

## 7. Redemption Flow

QR payload = unique code + signature (prevents screenshot reuse/guessing). Fallback: human-readable code, typed in if scanning fails. Validation + logging is one atomic backend call, avoiding double-spend on single-use deals. All check-ins land in one `redemptions` table — rides (unlimited, just logged) and deals (single-use, enforced by checking for a prior row).

## 8. Data Model (phase 1 tables)

- `card_products` — id, name, price, duration (one row: "Basic Day Card", €15)
- `card_instances` — user, card_product, valid_from/until, unique_code, qr_secret, status, sale_channel, sold_by (driver, nullable), buyer_email
- `merchants` — name, category, location, one linked staff login
- `deals` — merchant, terms, single-use
- `redemptions` — card_instance, type (ride/deal), reference, staff/driver id, timestamp

## 9. Build Order

1. Restructure the repo into a monorepo: move the current website into `apps/web/`, add empty `apps/mobile/` and `packages/shared/` scaffolds. Confirm the website still builds and deploys correctly from its new location before touching anything else. See `docs/mobile-app/PROJECT_STRUCTURE.md`.
2. Fix the hardcoded API key issue (quick, independent).
3. New Postgres schema: `card_products`, `card_instances`, `merchants`, `deals`, `redemptions`, merchant-staff accounts + RLS.
4. Extend the existing admin panel: Deals/Merchants tab (Card Tiers tab can be a single-row form for now).
5. New ticket purchase flow (Stripe) against the new tables.
6. Merchant-staff web view: login + scan/manual-code deal validation.
7. Scaffold the Expo app in `apps/mobile/` (set the bundle identifier now — see PROJECT_STRUCTURE.md), then build: auth + Profile, then My Cards (purchase + card view), then Deals, then Map.
8. i18n pass (EN/PT), design pass against your paper sketches, real-world test with a driver and a merchant.

## 10. Still needed from you before screens can be built for real

- Digitized versions of your paper designs (photos are fine to start).
- Actual attraction/deal content, or confirmation the app should pull attractions from the existing site's content system as-is.
