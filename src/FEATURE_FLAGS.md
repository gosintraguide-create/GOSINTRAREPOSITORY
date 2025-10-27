# Feature Flags Guide

## Overview
Feature flags allow you to enable or disable features without changing code throughout the application.

## How to Use Feature Flags

### Enabling/Disabling Private Tours

The Private Tours page can be toggled between a "Coming Soon" page and the full content.

**To enable the full Private Tours page:**

1. Open the file `/lib/featureFlags.ts`
2. Find the line: `privateToursEnabled: false,`
3. Change it to: `privateToursEnabled: true,`
4. Save the file
5. The page will automatically update

**To show the "Coming Soon" page:**

1. Open the file `/lib/featureFlags.ts`
2. Find the line: `privateToursEnabled: true,`
3. Change it to: `privateToursEnabled: false,`
4. Save the file
5. The page will show the coming soon message

## Current Features with Flags

### Private Tours (`privateToursEnabled`)
- **Location:** `/private-tours` in the navigation menu
- **When disabled:** Shows a beautiful "Coming Soon" page with:
  - Professional announcement of upcoming service
  - Key features preview
  - Call-to-action to get notified
  - Suggestions to try the day pass instead
- **When enabled:** Shows the full private tours sales page with:
  - Tour packages and pricing
  - Benefits section
  - Sample itineraries
  - Testimonials and FAQ
  - Full booking flow

## Adding New Feature Flags

To add a new feature flag:

1. Open `/lib/featureFlags.ts`
2. Add your new flag to the `featureFlags` object:
   ```typescript
   export const featureFlags = {
     privateToursEnabled: false,
     yourNewFeature: false, // Add your flag here
   };
   ```
3. Import and use it in your component:
   ```typescript
   import { featureFlags } from "../lib/featureFlags";
   
   if (featureFlags.yourNewFeature) {
     // Show enabled content
   } else {
     // Show disabled content
   }
   ```

## Best Practices

- Always provide a good experience when a feature is disabled
- For major features, consider showing a "Coming Soon" page instead of hiding completely
- Document what each flag controls
- Use descriptive flag names
- Keep the flags file organized and commented
