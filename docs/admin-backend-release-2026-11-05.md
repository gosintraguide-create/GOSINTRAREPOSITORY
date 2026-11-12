# Admin backend release candidate

Deployed on 5 November 2026 after explicit owner approval. Workspace changes remain uncommitted; frontend redesign remains local.

## Contents

Isolated candidate: `.tmp-admin-release/operations-20261105`. Baseline: the previous `.tmp-city-card-release` function source. This is a comparison against a local release baseline, not a newly downloaded production snapshot.

Four function files differ: the new admin operations handlers/audit middleware, their registration in the entry point, exposure of the existing reservation reconciler, and acceptance of paid completed City Cards for boarding within their normal validity rules.

Apply only migration `20261105014000_admin_operations.sql`, then deploy the staged function. The migration adds admin activity and email/settlement fields, financial reporting, cancellation/refund functions, and blocks generic City Card status changes from bypassing cancellation/refund controls. Do not apply unrelated pending migrations. Verify production migration history and current function source before deployment.

Older-order search now joins seller and delivery records by matching order IDs rather than the latest 200 global sales. Direct API coverage verifies overview joins and visible failure on unavailable data sources.

## Validation

- 112 automated checks passed, zero failed or skipped.
- Isolated backend entry point and local imports compiled with esbuild. This is syntax/bundle validation, not Deno runtime verification.
- Latest frontend production build passed in the preceding layout work.
- Production overview currently returns 404; no live release was performed in this preparation.

## Release verification

After deployment, verify unauthenticated access remains denied and a real admin can load overview, search an older order, inspect refunds, email status, activity and redemptions. Do not trigger payments, refunds, cancellations, or customer emails merely to smoke-test production. The local frontend can use the new backend without publishing the frontend.

## Scope limits

This candidate does not complete City Card dispatch/vehicle eligibility, full pagination, financial breakdowns by payment channel, or every item in the admin audit. A successful local test run is not confirmation of production readiness without the live-source and migration checks above.

## Completed release verification

- Downloaded current production function into `live-before`; it exactly matched the previous `.tmp-city-card-release` baseline. Preserved the existing `verify_jwt=false` gateway setting and server-side authorization guards.
- Confirmed prerequisite migration `20261105013000` and absence of the admin schema. Applied only `20261105014000` and recorded its SQL in migration history in the same transaction.
- Deployed the isolated function successfully with the Supabase API bundler.
- Health and pricing returned 200; unauthenticated admin operations and bookings returned 401. Confirmed admin activity table and financial RPC exist.
- Signed-in browser preview loaded overview totals, real order records, and the empty refund queue without errors. Overview showed zero paid City Card sales and outstanding actions. No customer payments, cancellations, refunds, or ticket emails were triggered during verification.
- Screenshot: `.tmp-admin-release/operations-20261105/overview-live.png`.

## Follow-up validation

The admin frontend has been staged locally in `.tmp-city-card-release` with the nine-section navigation, City Card operations, staff profiles, prices and capacity controls. City Card entries in the legacy booking list now direct administrators to the card console and suppress the legacy email control.

85 targeted database/API/auth/checkout/staff-sales checks passed. A fixture-backed Chrome smoke test passed overview, orders, refunds, ticket emails, pricing, capacity, activity and browser back navigation without page errors. No production customer writes were performed. Frontend publishing remains outstanding; the backend deployment above is unchanged. Dispatch/vehicle integration and full pagination remain outside this update.
