# Website translations and regional Portuguese

This review branch contains public website translations and the client integration needed to display them. It was prepared from `main`, independently of the other local security, portal, payment and styling work. No deployment or production database/configuration changes are part of this review.

## Behaviour

- Corrected English, European Portuguese, Spanish, French, German, Dutch and Italian copy across public pages, forms, errors, accessibility labels, metadata, dates and calendars.
- Added reviewed public editions of four published tours and four articles. All seven catalogues have matching keys and placeholders. Dutch and Italian legal-page translations fill previous English fallbacks; the existing terms mechanism is retained.
- Regional language tags are normalized before selection and catalogue loading. A fresh device whose preferred language is `pt-BR` receives the `pt` catalogue, whose content is European Portuguese. `pt-PT`, `PT_br` and other Portuguese regional variants resolve to the same catalogue. A saved visitor choice takes precedence over device preferences; disabled site languages remain disabled.
- CMS defaults no longer overwrite the selected language. Locale loading notifies subscribers, can retry after a failed load, and avoids out-of-order language switches. The public content fallback stays local instead of saving default content during a read.
- Public tour/article editions require an unchanged source fingerprint. Later CMS source edits stop using the old reviewed edition, and an explicit CMS article translation takes precedence. The blog editor still reads and saves the original CMS content through the existing functions.

## Scope boundaries

The original navbar-only change remains separate. This branch does not carry the other local navbar colours/spacing, new account/portal routes, authentication transport, cookie-storage changes, backend workflows, pricing calculations, payment fulfilment or database migrations. Payment components change only displayed messages and language selection.

New or edited free-form CMS content still requires a translation review. Unknown strings deliberately fall back to the source. Language-specific indexable URLs are not introduced here; legal translation coverage is not a legal-policy review.

## Validation

From `apps/web`:

```sh
npm run build:vite
node --test scripts/website-translations.test.mjs
node scripts/website-translations-browser.mjs
```

The catalogue suite checks all seven languages, placeholders, source freshness, booking-data preservation, CMS overrides and regional Portuguese selection. The browser suite visits 33 existing public routes in seven languages, checks real language switching and explicitly simulates a fresh `pt-BR` device without saved preferences. All external requests are intercepted; this does not perform real payments, send emails or write service data. Set `CHROME_EXECUTABLE` if Chrome is installed elsewhere than the Windows default path. Build output retains the existing chunk-size warning.

`review-fixtures.json` contains only published public tour/article records used for isolated testing. Loading that snapshot in the app requires all three conditions: development mode, `VITE_TRANSLATION_REVIEW=true`, and a localhost hostname. Production builds cannot activate it. Screenshots and captured page text are generated under `output/translation-review` and are not part of the submitted source.
