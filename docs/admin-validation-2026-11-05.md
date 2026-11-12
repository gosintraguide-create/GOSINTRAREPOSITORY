# Admin pre-commit validation — 5 November 2026

110 automated tests passed: 101 existing integration/regression checks and nine new admin API checks. No failures or skipped tests. The Vite production build passed.

Coverage includes isolated PostgreSQL migrations, cancellation/refund obligations, settlement idempotency, service-failure overrides, financial totals, database permissions, authentication, merchant permissions, staff sales, City Card checkout and refunds. New API checks exercise unauthorized access to every admin operations route, verified actor/customer attribution, explicit settlement/release confirmation, and ticket-email eligibility and delivery updates.

Run from `apps/web`:

```powershell
npm run test:admin-operations
npm run build:vite
```

Database checks use in-memory PGlite and API fixtures; no production payments, emails, or customer records were modified. Tests depend on the existing local `.tmp-capacity-tests` PGlite installation.

Build warnings concern mixed static/dynamic imports and a JavaScript chunk above 600 kB. They did not fail the build.

This run did not include browser interaction/visual acceptance, production migration application, live provider integration, or deployment. Passing these checks does not establish that the full audit checklist is implemented. Changes remain uncommitted.
