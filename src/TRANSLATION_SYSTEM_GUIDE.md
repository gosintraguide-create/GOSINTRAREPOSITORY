# Translation System Guide

## Overview

Your Hop On Sintra website now uses a **centralized translation system**. All text content is stored in translation files, making it easy to translate the entire website by editing a single file for each language.

## How It Works

### 1. Translation Files

All translations are located in `/lib/translations/`:

- **Main translations**: `/lib/translations/en.ts`, `pt.ts`, `es.ts`, `fr.ts`, `de.ts`, `nl.ts`, `it.ts`
  - Contains page content like homepage, attractions, blog, booking flow, etc.
  
- **Component translations**: `/lib/translations/components.ts`
  - Contains translations for reusable components like ProductCard, BookingCard, ManualBookingPage

### 2. Supported Languages

- 🇬🇧 English (en)
- 🇵🇹 Portuguese (pt)
- 🇪🇸 Spanish (es)
- 🇫🇷 French (fr)
- 🇩🇪 German (de)
- 🇳🇱 Dutch (nl)
- 🇮🇹 Italian (it)

## How to Translate Your Website

### Option 1: Translate Component Text (ProductCard, BookingCard, etc.)

**File**: `/lib/translations/components.ts`

This file contains translations for:
- **ProductCard**: The three homepage cards (Full Day Pass, Insight Tour, Monument Tickets)
- **BookingCard**: The booking widget
- **ManualBookingPage**: The internal operations booking tool

**Example**: To translate ProductCard to Portuguese, find the `pt` section and edit:

```typescript
pt: {
  productCard: {
    daypass: {
      title: \"Passe de Dia Inteiro\",  // ← Edit this
      description: \"Viagens ilimitadas por todas as atrações de Sintra\",  // ← Edit this
      features: [
        \"Viagens ilimitadas hop-on hop-off\",  // ← Edit these
        \"Lugares garantidos - sem espera\",
        // ...
      ],
      bookNow: \"Reserve o Seu Passe\",  // ← Edit this
    },
  },
}
```

### Option 2: Translate Page Content

**Files**: `/lib/translations/en.ts` (and pt.ts, es.ts, etc.)

These files contain translations for:
- Homepage content
- Attraction descriptions
- Blog articles
- Booking flow
- Footer links
- SEO meta descriptions
- And more...

**Example**: To translate homepage content to Spanish:

1. Open `/lib/translations/es.ts`
2. Find the `homepage` section
3. Edit the text:

```typescript
homepage: {
  hero: {
    title: \"Descubre Sintra a Tu Manera\",  // ← Edit this
    subtitle: \"Pase hop-on/hop-off con asientos garantizados...\",  // ← Edit this
    ctaButton: \"Reserva Tu Pase\",  // ← Edit this
  },
  // ...
}
```

## Components Using Centralized Translations

### ✅ Already Migrated (centralized)

- **ProductCard** - Homepage product cards
- **BookingCard** - Booking widget
- **ManualBookingPage** - Internal operations tool
- **HomePage** - Uses `/lib/translations/[lang].ts`
- **BuyTicketPage** - Uses `/lib/translations/[lang].ts`
- **AttractionsPage** - Uses `/lib/translations/[lang].ts`
- **BlogPage** - Uses `/lib/translations/[lang].ts`
- **Footer** - Uses `/lib/translations/[lang].ts`
- **Header** - Uses `/lib/translations/[lang].ts`

## Quick Translation Workflow

### To translate the **entire website** to a new language:

1. **Edit component translations**:
   - Open `/lib/translations/components.ts`
   - Find your language code (e.g., `pt` for Portuguese)
   - Translate all text in that section

2. **Edit page content translations**:
   - Open `/lib/translations/pt.ts` (replace `pt` with your language)
   - Translate all sections:
     - `homepage`
     - `attractions`
     - `blog`
     - `buyTicket`
     - `footer`
     - etc.

3. **Test your changes**:
   - Open your website
   - Click the language selector in the top right
   - Select your language
   - Navigate through all pages to verify translations

## Translation Structure

### Component Translations (`/lib/translations/components.ts`)

```
componentTranslations
├── en (English)
├── pt (Portuguese)
├── es (Spanish)
├── fr (French)
├── de (German)
├── nl (Dutch)
└── it (Italian)
    ├── perPass: "per pass"
    ├── quantity: "Quantity"
    ├── productCard
    │   ├── daypass
    │   ├── insightTour
    │   └── monuments
    ├── bookingCard
    └── manualBooking
```

### Page Translations (`/lib/translations/[lang].ts`)

```
translation
├── company (contact info)
├── homepage
│   ├── hero
│   ├── routes
│   └── features
├── attractions (attraction details)
├── blog (travel guide)
├── buyTicket (booking flow)
├── footer
├── header
└── seo (meta descriptions)
```

## Benefits of This System

1. **Single Source of Truth**: All translations in one place per language
2. **No Duplicate Content**: Components reference the same translation object
3. **Easy Maintenance**: Update once, change everywhere
4. **Type Safety**: TypeScript ensures all languages have the same structure
5. **Consistent Translations**: Same terms used across the entire site

## Troubleshooting

### Problem: Text is not translating

**Solution**: Check these things:
1. Is the component using `getComponentTranslation(language)`?
2. Is the language prop being passed from App.tsx?
3. Did you save your changes to the translation file?
4. Try hard refresh (Ctrl+F5 or Cmd+Shift+R)

### Problem: Translation file is too large to edit

**Solution**: 
1. Use a code editor like VS Code instead of a text editor
2. Search for the specific text you want to translate (Ctrl+F)
3. Edit only that section

## Next Steps

To fully complete the translation system migration, you may want to:

1. Audit remaining components for hardcoded text
2. Add any missing translations to `/lib/translations/components.ts`
3. Consider adding more languages if needed
4. Set up a translation management workflow

---

**Note**: The translation system is now active! When you change the language using the language selector, all components will automatically display content in the selected language.
