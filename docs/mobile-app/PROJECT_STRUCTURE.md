# Repo Structure & Where Things Get Submitted

One repo, two apps, one backend. This doc exists specifically to make clear what ends up on the App Store / Google Play versus what stays a website.

```
GOSINTRAREPOSITORY/
├── apps/
│   ├── web/              ← the existing hoponsintra.com website
│   └── mobile/            ← the new Expo app — THIS is what goes to the app stores
│       ├── app.json        ← app name, bundle ID, icon, version — store listing config
│       ├── eas.json        ← build profiles for iOS/Android
│       └── src/
├── packages/
│   └── shared/              ← types & API helpers used by both apps (never deployed on its own)
├── supabase/                 ← the shared backend (deployed to Supabase, not a store)
└── docs/
```

## What goes where

| Folder | What it is | Where it ends up |
|---|---|---|
| `apps/web/` | The website | Deployed to Vercel (as it already is today) — nothing to do with app stores |
| `apps/mobile/` | The native app | Built via EAS Build into an `.ipa` (iOS) and `.aab` (Android) file, then submitted to App Store Connect and Google Play Console |
| `packages/shared/` | Shared code | Not deployed by itself — it's compiled into `apps/mobile` (and optionally `apps/web`) at build time |
| `supabase/` | Database + backend functions | Deployed to your Supabase project — powers both apps, isn't submitted anywhere |

## Concretely, for app store submission

You will never manually zip or drag files to the stores. The flow is:

1. `apps/mobile/app.json` holds the app's identity — name, bundle identifier (e.g. `com.hoponsintra.app`), version number, icon, splash screen. This is what the stores read as "your app's" metadata.
2. Run an EAS Build (`eas build --platform ios` / `--platform android`) from inside `apps/mobile/` — this produces the actual binary: an `.ipa` for iOS, an `.aab` for Android.
3. Submit that binary — either via `eas submit` (automated) or by uploading it manually to App Store Connect / Google Play Console.

Nothing from `apps/web/`, `packages/shared/`, or `supabase/` is ever part of that binary directly — `apps/mobile` only pulls in what it imports from `packages/shared` at build time; the rest of the repo is irrelevant to the store submission.

## Why this matters now

Setting up `apps/mobile/app.json` correctly (bundle identifier especially) early avoids a headache later — the bundle identifier can't be changed after your first store submission without effectively creating a new app listing. Worth deciding on it (e.g. `com.hoponsintra.app` or similar) when the Expo app is first scaffolded, not after screens are built.
