# Admin walkthrough — 6 November 2026

Read-only walkthrough of the local frontend connected to the deployed backend. No booking, price, permission, refund, or delivery changes were submitted.

Verified orders load and an expired unpaid reservation expands. Corrected its misleading card/perk descriptions: it now says Not issued, No active perks, and email not applicable. No issuance, cancellation, or email actions are offered for that expired reservation.

Verified ticket delivery and refunds load their empty states. Added explicit empty messages for orders, delivery, refunds, activity, and redemptions. The activity/redemption messages were not exercised in this browser pass.

Staff screen loaded the existing scanning-only training merchant and zero driver accounts. Pricing loaded full price 15 euros and half price 7.50 euros; loading no longer briefly presents half price as zero. Capacity screen was checked on 5 November: 400 total places, 50 for each departure from 09:00 through 16:00, and transport hours 09:00–19:30. No values were saved.

Added accessible labels for Diagnostics and QR Scanner when their visible text is hidden on smaller screens. Production frontend build passed; existing import and bundle-size warnings remain.

Limitations: no paid City Card was available for a live cancellation/refund or PDF delivery walkthrough. These paths remain covered by the previously passing automated checks, not a real transaction in this pass. Search was not exercised in the browser. No frontend deployment or commit was performed.

## Controlled acceptance follow-up

24 focused checks passed with no failures or skips. Strengthened the paid cash-sale cancellation test to invoke the actual admin HTTP quote/cancel handlers against the isolated PGlite database. Verified customer denial, cancellation retry idempotency, one refund obligation, and attribution to the verified admin. Settlement also now goes through the HTTP handler and verifies the database's settled-by identity and one-time financial effect.

Email tests verify issuance survives delivery failure, retries do not issue duplicate cards, and admin resend requires issued cards and a delivery reference. Stripe refund tests cover retry safety and ambiguous/network/provider failure cases. Providers are simulated; no live money or email was sent.

The existing PDF generation check also passed, generating three named age-category cards with QR codes in `.tmp-city-card-review/staff-city-cards.pdf`. This run checked generation/page count, not a new visual PDF review or inbox delivery.
