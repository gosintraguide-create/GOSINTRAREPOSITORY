# Business reports

Reports navigation contains Financial overview, Sales by driver, Sales by merchant and Perk usage. Custom inclusive date ranges use Lisbon time; presets cover today, 7/30 days, this month and all dates. Sales may be filtered by order-created date or visit date, payment method, seller, and email/booking text. Perks use confirmed redemption time and can be filtered by partner, offer, booking and staff email.

Totals aggregate all matching rows before pagination. Transaction history pages contain 25 rows with page-specific CSV export. Seller and partner names open filtered detail. Daily totals, payment-channel breakdowns, age-category counts and per-offer usage are included.

## Definitions

- Sales cover paid City Card orders, excluding unpaid/expired reservations, legacy passes and tours. Merchant sales group by business across staff accounts; driver sales group by driver ID.
- Gross is original collected order value. Refunds paid and outstanding are attributed to those orders even when processed later. Net collected is gross minus refunds paid, before fees; this is not profit or a cash-flow report.
- Order-created date is intentionally labelled: the current online order schema does not store an immutable payment-completion timestamp. Visit date is independently selectable.
- Cards issued include free cards and subsequently cancelled cards; cancellation counts are shown separately.
- Perk uses count successful confirmed redemptions only. Failed/unconfirmed scans are not recorded. Unlimited offers may have several uses by one card; unique cards are counted separately. Archived partners retain historical usage.
- CSV monetary amounts are integer euro cents; export covers the displayed page only.

## Validation and release

Five report integration tests pass, covering complete totals across pagination, multiple refunds without multiplied revenue, Lisbon midnight boundaries, later refunds, seller identity grouping, repeated perks, archived partners, role restrictions and HTTP-to-SQL integration. Existing 112 tests pass. Production build passes with existing size/import warnings.

Migration 20261106010000 was applied and recorded atomically. The report route was deployed on a freshly downloaded live function, changing only admin-operations.ts. Public report requests returned 401; privileged SELECT verification returned zero paid orders and zero confirmed redemptions. No business transactions or permissions were changed.

Browser verification was interrupted when local browser use was disabled in Work settings. UI layout/interaction verification remains incomplete. Frontend production release status is recorded after deployment.
