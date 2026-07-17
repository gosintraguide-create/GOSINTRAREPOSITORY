# Vercel Deployment Guide for Go Sintra

## Important: Figma Make to Vercel Deployment

This application was built in Figma Make and needs to be exported before deploying to Vercel.

### Step 1: Export from Figma Make

1. In Figma Make, click the **Export** button
2. Download the complete application bundle
3. Extract the zip file to your local machine

### Step 2: Prepare for Vercel

The exported bundle should contain:
- All React components
- Assets and images
- Configuration files
- A build setup (Vite or similar)

### Step 3: Deploy to Vercel

#### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to your project directory
cd go-sintra

# Deploy
vercel
```

#### Option B: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your Git repository (or drag and drop the folder)
4. Vercel will auto-detect the framework (Vite)
5. Click **"Deploy"**

### Step 4: Environment Variables

Add these environment variables in Vercel Dashboard → Settings → Environment Variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Step 5: Deploy Supabase Edge Functions

The backend server needs to be deployed separately to Supabase:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy the edge function
supabase functions deploy make-server-3bd0ade8 --no-verify-jwt

# Set environment variables for the function
supabase secrets set SUPABASE_URL=your_url
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_key
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret
supabase secrets set RESEND_API_KEY=your_resend_key
```

### Step 6: Upload SEO Files

1. Download `sitemap.xml` and `robots.txt` from the admin panel (SEO Tools tab)
2. Place them in the `/public` folder of your project
3. Commit and push to trigger a new deployment

### Troubleshooting

#### "No Output Directory named 'dist' found"

This error occurs when:
- The build command hasn't been configured
- The framework detection failed

**Solution:**
1. Make sure your `package.json` has a build script:
   ```json
   {
     "scripts": {
       "build": "vite build",
       "dev": "vite",
       "preview": "vite preview"
     }
   }
   ```

2. In Vercel Dashboard → Settings → General:
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

#### PWA Not Working

Make sure:
1. `manifest.json` is in `/public` folder
2. `sw.js` is in `/public` folder
3. Headers in `vercel.json` are properly configured

#### Edge Functions Not Working

If backend API calls fail:
1. Verify Supabase edge function is deployed
2. Check environment variables are set
3. Verify the function URL in API calls matches deployed endpoint

### Custom Domain

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain: `gosintra.pt`
3. Update DNS records as instructed
4. Wait for SSL certificate provisioning (automatic)

### Post-Deployment Checklist

- [ ] Test all pages load correctly
- [ ] Verify booking flow works end-to-end
- [ ] Check PWA installation on mobile
- [ ] Test live chat integration
- [ ] Verify email notifications are sent
- [ ] Check Stripe payments work
- [ ] Test admin panel access
- [ ] Verify sitemap.xml is accessible at `/sitemap.xml`
- [ ] Check robots.txt is accessible at `/robots.txt`
- [ ] Submit sitemap to Google Search Console

## SEO Optimization Post-Deployment

1. **Google Search Console:**
   - Add and verify your property
   - Submit sitemap: `https://gosintra.pt/sitemap.xml`
   - Monitor indexing status

2. **Google Analytics:**
   - Set up GA4 property
   - Add tracking code to the app
   - Configure conversion events

3. **Schema Validation:**
   - Test structured data: https://search.google.com/test/rich-results
   - Verify all blog articles have proper Article schema

4. **Performance:**
   - Run Lighthouse audit
   - Optimize images if needed
   - Enable Vercel Analytics for monitoring

## Support

For issues or questions:
- Vercel Documentation: https://vercel.com/docs
- Supabase Documentation: https://supabase.com/docs
- Figma Make Support: Check your Figma Make dashboard
