# Admin portal audit and proposed organisation

**Date:** 5 November 2026 · **Scope:** current admin frontend, supporting API/database code and selected read-only production checks.

## Assessment

The portal contains useful operational tools, but it has not caught up with the City Card product. Its main weaknesses are inconsistent business controls and missing support workflows, followed by navigation. A visual redesign alone would make the existing inconsistencies easier to encounter without fixing them.

**Recommendation:** retain the working modules, correct the high-priority business logic, expose the missing operational queues, then reorganise and redesign. This is an evolution of the portal, not a wholesale rebuild.

This audit changed no application behaviour, permissions, bookings, payments or deployed configuration. It created this report only. It is not a penetration test or a full visual/accessibility review. Findings marked “code-confirmed” were traced through the current implementation, not exercised against customer transactions. The local AdminPage matches the staged release copy; production checks below verified specific endpoints and table existence, not every authenticated screen.

## Current map → proposed home

The current entry point defaults to **Pickups**. Its six primary tabs are Pickups, Bookings, Messages, Tours, Analytics and Dev. Other functions are largely behind **More**. Driver account management is embedded in Pickups; merchant staff permissions are embedded in business/offer management.

| Current feature/location | Proposed home | Treatment |
|---|---|---|
| No consolidated operational landing page | **Overview** | Add today's activity and an actionable attention queue. |
| Analytics tab | **Overview → Reports** | Keep charts; correct financial definitions before relying on them. |
| Bookings and existing ticket resend/download controls | **Bookings & Sales → Orders / City Cards** | Extend to named cards, partial cancellation, payment channel and seller. |
| Tours tab, requests and calendar | **Bookings & Sales → Tour Bookings** | Keep tour transactions distinct from City Cards. |
| Availability drawer under Bookings | **Pricing & Availability → Calendar** | Promote to a directly accessible page; retain slot and daily limits. |
| Pricing/settings, sales toggle | **Pricing & Availability → Prices / Sales Controls** | Separate City Card rules from legacy website products. |
| Pickups and destination/assignment tools | **Operations → Dispatch** | Keep; complete City Card and vehicle-eligibility integration. |
| Driver accounts under Pickups | **Staff & Access → Drivers** | Move account editing here; retain driver availability/assignment in Operations. |
| Merchants & Deals | **Partners & Perks → Businesses / Offers** | Keep business and offer management; add redemption history. |
| Merchant staff profiles inside Merchants & Deals | **Staff & Access → Merchant Staff** | Move profile and permission editing; link back to the business. |
| Messages tab | **Messages** | Keep a dedicated inbox and unread indicator. This should not disappear in the reorganisation. |
| Content editor, blog, images, planner images, Cinema no Mato | **Website & Content** | Keep under clearly labelled subsections. |
| Private-tour product manager | **Website & Content → Tour Products** | Separate products/content from tour bookings. |
| SEO and tags | **Website & Content → Publishing Tools** | Keep out of daily operations. |
| Card Tiers | **Legacy / retirement decision** | Do not present it as the live City Card configuration. |
| Booking Logs | **System & Activity** | Repair or replace; distinguish transaction history from administrator audit history. |
| Dev, diagnostics, database cleanup | **System & Activity → Restricted Maintenance** | Remove from primary navigation. A cleanup panel exists without an obvious current menu entry. |

This produces **nine clear destinations**: Overview; Bookings & Sales; Operations; Partners & Perks; Staff & Access; Pricing & Availability; Messages; Website & Content; System & Activity.

## Findings, ordered by priority

### P1 — correct before treating the portal as the City Card control centre

**1. “Cancel booking” is not the City Card refund workflow — code-confirmed.**

The booking list calls the generic status endpoint. That endpoint invokes `set_day_pass_status`, which changes the booking status and capacity but does not create a City Card refund job. The customer cancellation path is separate and creates refund records. An administrator could therefore cancel a paid card booking without initiating its refund. This is a control-path finding, not evidence that a customer has already been affected.

**Action:** replace generic cancellation for City Cards with an explicit cancellation/refund review: affected cards and children, refund amount, original payment channel, capacity release, reason and outcome. Add a distinct service-failure override rather than silently applying customer cutoff rules to an administrator. See S1–S3.

**2. “Mark as Completed” can invalidate unlimited rides — code-confirmed.**

The admin list offers this status change, while City Card boarding accepts only `status='confirmed'`. Perk redemption accepts confirmed or completed records, so the same action can also produce inconsistent ride/perk eligibility.

**Action:** distinguish ride completion from card validity. A completed ride must not terminate a valid all-day card. Card expiry should follow the visit date and operating hours. See S1 and S4.

**3. No central refund work queue — implementation gap.**

Refund jobs exist, including manual-review records for cash/terminal payments. I found no admin-wide queue to inspect them, record offline settlement, track provider failures or clearly identify unresolved amounts. A record existing in the database is not equivalent to a usable support workflow.

**Action:** add Refunds with pending/processing/succeeded/failed/manual-review states, channel, amount, booking/card links, recorded settlement reference and accountable staff member. Preserve idempotency and distinguish “cancelled” from “money returned”. See S3 and S5.

**4. Current pricing controls contradict City Card rules — code-confirmed.**

Settings expose an independently editable child price and describe “Child (7–12)”. City Card pricing instead derives half price from the base price; the agreed brackets are under 7 free, 7–11 half, 12+ full. Changing the legacy child-price field does not change the City Card calculation.

**Action:** provide an authoritative City Card price page: editable full price, derived half price, fixed free bracket and clear visit-day age guidance. Keep any necessary legacy website pricing explicitly labelled until that website offer is migrated. Do not silently overwrite legacy prices. See S4 and S6.

**5. Analytics are booking totals, not reliable net revenue — code-confirmed.**

The current calculations exclude fully cancelled bookings and sum `totalPrice` for the others. Partial cancellations retain the original booking total; refund records are not reconciled into these totals. Fully cancelled but not-yet-refunded payments also disappear from the active-booking sum.

**Action:** distinguish gross sales, cancellations, refunds paid, refunds outstanding and net receipts. Add cash/terminal/Stripe and seller/channel breakdowns. Label existing figures accurately until this is done. See S6.

### P2 — complete the operator workflows and remove misleading screens

**6. Card Tiers is disconnected and currently fails — verified live.**

`GET /card-products` returned **HTTP 500**. A read-only database check confirmed `public.card_products` is absent. The component also uses old default hours, 08:30–19:00. Current City Card pricing and availability use different sources.

**Action:** remove this screen from normal navigation or clearly mark it retired. Do not create its missing table simply to make an obsolete editor appear functional. See S7.

**7. Booking Logs calls a missing route — verified live.**

The component requests `/booking-logs`; production returned **HTTP 404**, and the current server entry point has no matching route.

**Action:** rebuild the history view from current transaction records, or remove the broken entry. Booking history and an administrator change log are different requirements. See S8.

**8. Email delivery status has split sources — code-confirmed.**

The booking list reads `booking.delivery` and legacy email fields. Staff-issued City Card delivery is recorded in `staff_card_sales.email_sent_at/email_error`. The seller portal can retry its own recent sales, but the admin list is not wired to that status, so it can show delivery as unrecorded despite successful staff delivery.

**Action:** create one admin delivery queue and booking-level status adapter, with a safe resend action and a link to the original sale. Say “accepted by provider” rather than claiming inbox delivery. See S1 and S5.

**9. Reservations and staff sales lack a global admin view — implementation gap.**

Staff sales are exposed through seller-owned endpoints, limited to 30 recent records. The legacy pending-payment recovery endpoint scans old payment-intent prefixes; it does not enumerate `city_card_orders`. It should not be mistaken for a complete City Card reservation/recovery screen.

**Action:** add searchable orders and reservations across all sellers, with held seats, deadline, paid/expired state, channel and safe recovery actions. Never release a Stripe reservation merely because its timer elapsed without checking payment status. See S2 and S5.

**10. The booking list remains booking-centric — code-confirmed.**

Passenger totals count all passenger records, including individually cancelled cards. There is no dedicated per-card display of active/cancelled state, age bracket, perks and companion consequences in the inspected booking list.

**Action:** use an order detail page containing individual card rows. Retain stable QR/card identifiers and show active-card count separately from originally purchased quantity. See S1.

**11. City Card dispatch is unfinished — code-confirmed integration gap.**

The existing customer pickup ownership check expects legacy booking IDs of the form `AA-1234`, while City Card IDs use `CC-…`. The inspected pickup transition path does not enforce age-derived vehicle eligibility. Existing dispatch tools therefore should not be treated as completion of the agreed City Card group ride flow.

**Action:** integrate authenticated card selection, validate each selected card, derive under-7 restrictions server-side and block incompatible vehicle assignment. Show the restriction to both dispatch and driver. See S9.

**12. No consolidated administrator action trail — implementation gap.**

There are operational records, but no consolidated audit view covering permission changes, price/capacity edits, card cancellation and manual refund settlement. The merchant access update path, for example, overwrites the profile without appending a change event.

**Action:** record actor, timestamp, affected entity, before/after values where appropriate, and reason for consequential overrides. Do not put passwords or tokens in the audit log. See S10.

### P3 — organisation and maintainability

- **Day boundaries:** several “today” and date filters use UTC `toISOString()` instead of the Lisbon calendar date. This can misclassify late-night records during summer time. Standardise operational dates to Lisbon.
- **Navigation:** active sections are local tab state inside a roughly 4,000-line AdminPage. Give sections stable URLs, preserve filters, support back/forward navigation and split the page into smaller modules.
- **Maintenance tools:** Dev is a primary tab, including a real booking-pipeline test. Move technical/test actions behind a clearly separate maintenance area with explicit effects and confirmations appropriate to each action.
- **Role organisation:** merchant profiles and driver creation already exist, but are in different business areas. Bring them together under Staff & Access. Additional administrator provisioning is not implemented by the recent merchant-profile work and should be designed separately if needed.
- **Partner oversight:** redemption events are recorded, but no merchant-wide admin redemption history/report was found. Add it under Partners & Perks rather than treating booking logs as a substitute.

## What is worth keeping

- Verified admin/driver authentication and backend permission checks.
- Independent merchant scanning/sales permissions and shared `/staff` entry page.
- Daily and time-slot capacity controls, operating hours and the sales toggle.
- Transactional reservations and idempotent card issuance/redemption.
- Existing booking search, messages, tour calendar and content-management modules.
- Individual card cancellation/refund data and staff email-delivery records—the missing work is largely safe administration of these records.

## Recommended implementation sequence

1. **Correct dangerous or misleading actions:** City Card cancellation/completion behaviour, pricing labels and financial definitions; disable the broken legacy entries.
2. **Create an operational attention queue:** unresolved refunds, failed ticket delivery and reservations needing review. Each item must lead to a safe action, not just a warning badge.
3. **Introduce the navigation structure:** stable routes and section modules; move existing tools without changing their behaviour unnecessarily.
4. **Complete entity detail screens:** order/cards/refunds, seller sales and staff profiles; unify status sources and add audit events.
5. **Finish City Card dispatch integration**, including incompatible-vehicle blocking.
6. **Apply the visual redesign and responsive/accessibility pass**, then acceptance-test real workflows across the four staff access profiles.

**Acceptance standard:** an administrator can find a customer by email, identify each card and its validity, see how payment was collected, perform the correct cancellation/refund process, verify ticket delivery, trace the responsible seller, and understand any outstanding action without opening the database.

## Evidence references

- **S1:** [CompactBookingsList](/C:/Users/vasco/Desktop/GOSINTRAREPOSITORY/apps/web/src/app/components/CompactBookingsList.tsx:101): status changes, passenger counts, delivery display and resend UI.
- **S2:** [Server routes](/C:/Users/vasco/Desktop/GOSINTRAREPOSITORY/supabase/functions/make-server-3bd0ade8/index.ts:1126): generic status endpoint; legacy recovery starts near line 2660.
- **S3:** [Cancellation migration](/C:/Users/vasco/Desktop/GOSINTRAREPOSITORY/supabase/migrations/20261104010000_city_card_cancellations.sql:91): generic status versus cancellation/refund transaction.
- **S4:** [City Card product rules](/C:/Users/vasco/Desktop/GOSINTRAREPOSITORY/supabase/functions/make-server-3bd0ade8/city-card-product.ts:1): derived pricing and boarding status.
- **S5:** [Staff sales service](/C:/Users/vasco/Desktop/GOSINTRAREPOSITORY/supabase/functions/make-server-3bd0ade8/staff-card-sales.ts:20): seller ownership, delivery and recent-sale listing.
- **S6:** [AdminPage](/C:/Users/vasco/Desktop/GOSINTRAREPOSITORY/apps/web/src/app/components/AdminPage.tsx:1809): analytics; navigation near 2222; pricing near 3649.
- **S7:** [CardTiersManagement](/C:/Users/vasco/Desktop/GOSINTRAREPOSITORY/apps/web/src/app/components/CardTiersManagement.tsx:32): legacy product editor.
- **S8:** [BookingLogs](/C:/Users/vasco/Desktop/GOSINTRAREPOSITORY/apps/web/src/app/components/BookingLogs.tsx:69): missing endpoint request.
- **S9:** [Customer pickups](/C:/Users/vasco/Desktop/GOSINTRAREPOSITORY/supabase/functions/make-server-3bd0ade8/customer-pickups.ts:6) and [pickup transitions](/C:/Users/vasco/Desktop/GOSINTRAREPOSITORY/supabase/functions/make-server-3bd0ade8/pickup-transitions.ts:1).
- **S10:** [Merchant access service](/C:/Users/vasco/Desktop/GOSINTRAREPOSITORY/supabase/functions/make-server-3bd0ade8/merchant-perks.ts:23).

Production read-only checks: `/card-products` → 500; `/booking-logs` → 404; `card_products` table absent; `city_card_orders`, `staff_card_sales` and `city_card_refunds` present. No customer record contents were included in this report.
