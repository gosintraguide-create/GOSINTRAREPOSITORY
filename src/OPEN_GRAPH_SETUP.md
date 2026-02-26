# Open Graph (Social Preview) Setup Guide

## What is Open Graph?
Open Graph meta tags control how your website appears when shared on social media platforms like WhatsApp, Facebook, Twitter, LinkedIn, etc. They define the title, description, and preview image that appears in the link preview.

## Changes Made

### 1. Added OG Image Configuration to Content System
- Added `defaultOgImage` field to the SEO section in `/lib/comprehensiveContent.ts`
- Added optional `ogImage` field to each page's SEO settings (home, about, attractions, etc.)
- Default OG image is set to: `https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&h=630&fit=crop&q=80`

### 2. Enhanced Meta Tags
Updated the following components to include complete OG metadata:
- `/index.html` - Base meta tags for all pages
- `/components/SEOHead.tsx` - Dynamic page-specific meta tags
- `/components/RootLayout.tsx` - Global layout meta tags
- `/components/HopOnServiceDetailPage.tsx` - Service page specific OG image

Added the following important tags:
- `og:image:secure_url` - Required for HTTPS sites (important for WhatsApp)
- `og:image:alt` - Accessibility description of the image
- `twitter:image:alt` - Twitter-specific alt text

### 3. ContentEditor Integration
Added OG image editor in the **Common** tab under "SEO Meta Tags":
- **Default Open Graph Image** - Global image used site-wide (1200x630px recommended)
- **Page-Specific OG Images** - Optional per-page images (falls back to default if not set)
- Live preview of the selected image
- Support for both default and page-specific images

## How to Set Your OG Image

### Option 1: Upload to Supabase Storage (Recommended)
1. Go to Admin Portal → Content Editor → Common tab
2. Scroll to "SEO Meta Tags" section
3. Upload your image to Supabase Storage via the ImageManager
4. Copy the image URL and paste it into the "Default Open Graph Image" field
5. Click "Save All Changes"

### Option 2: Use External Image URL
1. Ensure your image is:
   - Hosted on HTTPS
   - 1200x630 pixels (recommended)
   - Less than 8MB
   - In JPG or PNG format
2. Go to Admin Portal → Content Editor → Common tab
3. Paste the image URL into "Default Open Graph Image"
4. Click "Save All Changes"

### Page-Specific Images
To set a unique OG image for a specific page:
1. Open the accordion for that page (e.g., "Home Page")
2. Enter the image URL in "Page-Specific Open Graph Image"
3. Leave blank to use the default OG image
4. Click "Save All Changes"

## Image Requirements

### Technical Specs
- **Recommended Size**: 1200x630 pixels (1.91:1 aspect ratio)
- **Minimum Size**: 600x314 pixels
- **Maximum Size**: 8MB
- **Format**: JPG, PNG, or WebP
- **Protocol**: HTTPS only

### Best Practices
- Use high-quality, eye-catching images
- Avoid text-heavy images (will be hard to read in small previews)
- Ensure important content is in the center (edges may be cropped)
- Test on mobile devices (WhatsApp is primarily mobile)
- Use images that represent your brand (logos, landmarks, services)

## Testing Your OG Image

### Method 1: Facebook Sharing Debugger (Best)
1. Visit: https://developers.facebook.com/tools/debug/
2. Enter your URL: `https://www.hoponsintra.com`
3. Click "Debug"
4. Click "Scrape Again" to clear cache and fetch latest metadata
5. Check the preview image

### Method 2: WhatsApp Test
**Note**: WhatsApp caches aggressively and may take 24-48 hours to update!
1. Send your link to yourself in a WhatsApp chat
2. Check if the preview appears correctly
3. To force refresh: Add a query parameter like `?v=2` to your URL

### Method 3: LinkedIn Post Inspector
1. Visit: https://www.linkedin.com/post-inspector/
2. Enter your URL
3. Click "Inspect"

### Method 4: Twitter Card Validator
1. Visit: https://cards-dev.twitter.com/validator
2. Enter your URL
3. Click "Preview card"

## Clearing Cached Previews

Social platforms cache OG images for performance. To force an update:

### Facebook/WhatsApp
- Use the Facebook Sharing Debugger (Method 1 above)
- Click "Scrape Again" multiple times
- May take several hours to propagate

### Twitter
- Use the Twitter Card Validator
- Updates are usually instant

### LinkedIn
- Use the Post Inspector
- Updates are usually instant

### WhatsApp Specific
- WhatsApp uses Facebook's cache
- Can take 24-48 hours to update
- Add a unique query parameter to force new URL: `?preview=2`
- Share the new URL to see changes immediately

## Troubleshooting

### Preview Not Showing
1. Verify image URL is HTTPS and publicly accessible
2. Check image is under 8MB
3. Ensure image dimensions are at least 600x314
4. Clear cache using debugging tools above
5. Check browser console for errors

### Wrong Image Showing
1. Clear cache using Facebook Sharing Debugger
2. Wait 10-15 minutes and check again
3. Verify correct URL in ContentEditor
4. Check if a page-specific OG image is overriding the default

### Image Shows Blurry
- Upload higher resolution image (1200x630 recommended)
- Use JPG with quality 80-90
- Avoid scaling up smaller images

### Changes Not Reflecting
1. Clear browser cache (Ctrl+Shift+Delete)
2. Use incognito/private browsing mode
3. Clear social media platform cache
4. Verify changes saved in ContentEditor (check browser console logs)

## Current Setup

- **Default OG Image**: Pena Palace scenic view from Unsplash
- **Format**: 1200x630, optimized for social sharing
- **All pages inherit**: Default image unless page-specific image is set
- **Supported Platforms**: WhatsApp, Facebook, Twitter, LinkedIn, Telegram, Discord, Slack

## Additional Resources

- [Open Graph Protocol Documentation](https://ogp.me/)
- [Facebook Sharing Best Practices](https://developers.facebook.com/docs/sharing/webmasters/)
- [Twitter Card Documentation](https://developer.twitter.com/en/docs/twitter-for-websites/cards/overview/abouts-cards)
- [WhatsApp OG Tags Info](https://faq.whatsapp.com/general/how-to-format-your-messages)

## Support

If you continue to have issues with OG previews:
1. Check the browser console for error messages
2. Test the image URL directly in a browser
3. Verify the image is publicly accessible (not behind authentication)
4. Use the Facebook Sharing Debugger to see what data is being read
5. Wait 24-48 hours for aggressive caches (WhatsApp) to expire
