# Cloudflare Pages Deployment Guide

## Quick Start (Recommended Method)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Connect to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Click **Pages** in the sidebar
3. Click **Create a project**
4. Click **Connect to Git**
5. Select your Git provider (GitHub/GitLab/Bitbucket)
6. Authorize Cloudflare to access your repositories
7. Select the `tmklondon` repository

### Step 3: Configure Build Settings

In the build configuration screen, enter:

- **Project name**: `tmklondon` (or your preferred name)
- **Production branch**: `main`
- **Framework preset**: `Astro` (or leave as "None")
- **Build command**: `pnpm build`
- **Build output directory**: `dist`
- **Root directory**: `/` (leave empty)
- **Environment variables**: None required for basic setup

### Step 4: Deploy

1. Click **Save and Deploy**
2. Wait for the build to complete (usually 2-5 minutes)
3. Your site will be live at `https://tmklondon.pages.dev` (or similar)

### Step 5: Add Custom Domain

1. After deployment, go to your project settings
2. Click **Custom domains**
3. Click **Set up a custom domain**
4. Enter `tmklondon.com`
5. Follow the DNS instructions provided by Cloudflare
6. Update your domain's DNS records as shown

## Manual Deployment (Using Wrangler CLI)

If you prefer to deploy manually:

### Install Wrangler
```bash
pnpm add -D wrangler
```

### Login
```bash
npx wrangler login
```

### Build and Deploy
```bash
# Build the site
pnpm build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist --project-name=tmklondon
```

## Environment Variables

If you need to set environment variables:

1. Go to your Cloudflare Pages project
2. Navigate to **Settings** → **Environment variables**
3. Add variables for:
   - Production
   - Preview
   - Branch previews (optional)

## Build Settings Reference

- **Build command**: `pnpm build`
- **Output directory**: `dist`
- **Node.js version**: `18` or higher
- **Package manager**: `pnpm`

## Troubleshooting

### Build Fails

1. Check the build logs in Cloudflare Pages dashboard
2. Verify Node.js version is 18+
3. Ensure `pnpm` is available (Cloudflare Pages supports pnpm by default)
4. Check that all dependencies are in `package.json`

### Site Not Updating

1. Clear Cloudflare cache: **Caching** → **Configuration** → **Purge Everything**
2. Check that your latest commit is on the `main` branch
3. Verify the build completed successfully

### Custom Domain Not Working

1. Verify DNS records are correctly set
2. Wait for DNS propagation (can take up to 24 hours)
3. Check SSL/TLS settings in Cloudflare dashboard
4. Ensure the domain is properly added in Pages settings

## Security / Lighthouse notes (CORS, Rocket Loader, Web Analytics)

### 1. `cloudflareinsights.com` / beacon + `signature-agent` CORS

If an audit reports **CORS blocked** on `static.cloudflareinsights.com/...beacon...` with a header like **`signature-agent`**, that header is usually **not from your site** — it is injected by a **browser extension** (e.g. Cursor, dev tools, or similar). Cloudflare’s beacon cannot allow arbitrary extension headers in `Access-Control-Allow-Headers`, so the warning is often **false noise** for real visitors.

**Options:**

- Re-run the audit in a **clean profile** with extensions disabled.
- Or turn off **Cloudflare Web Analytics** (or the RUM beacon) for the zone if you do not need it: **Analytics & logs** → Web Analytics.

### 2. Rocket Loader vs `/_astro/*.js` preload (“credentials mode does not match”)

**Rocket Loader** can inject script preloads that do not match how Astro’s **`type="module"`** scripts load. This repo adds **`crossorigin`** on module scripts in the built HTML (`astro:build:done` hook) so preloads and scripts align.

**Still recommended:** In Cloudflare, open **Speed** → **Optimization** and **disable Rocket Loader** for `tmklondon.com`. Astro already ships small, static JS chunks; Rocket Loader often adds little value and can conflict with modern module scripts.

## Continuous Deployment

Once connected to Git, Cloudflare Pages will automatically:
- Build and deploy on every push to `main`
- Create preview deployments for pull requests
- Keep deployment history for rollbacks

## Support

For more help:
- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Astro Deployment Guide](https://docs.astro.build/en/guides/deploy/cloudflare/)
