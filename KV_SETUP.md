# Cloudflare KV setup for TMK London

This guide walks you through creating a KV namespace, binding it to your Pages project, and securing the admin API.

---

## 1. Create a KV namespace

### Option A: Cloudflare Dashboard

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left sidebar, go to **Workers & Pages** → **KV**.
3. Click **Create a namespace**.
4. Name it (e.g. `tmklondon-kv`) and click **Add**.
5. On the namespace list, open your new namespace and copy its **Namespace ID** (e.g. `abc123def456...`). You’ll need this in step 2.

### Option B: Wrangler CLI

From your project root:

```bash
npx wrangler kv namespace create "tmklondon-kv"
```

The output will show the new **Namespace ID**. Copy it.

---

## 2. Bind KV to your Pages project

### Option A: Dashboard (no Wrangler file)

1. Go to **Workers & Pages** → select your **Pages** project (e.g. `tmklondon`).
2. Open **Settings** → **Functions**.
3. Under **KV namespace bindings**, click **Add binding**.
4. **Variable name:** `TMK_KV` (must match the name used in code).
5. **KV namespace:** choose the namespace you created (e.g. `tmklondon-kv`).
6. Save. Redeploy the project so the binding is active.

### Option B: Wrangler config (recommended)

1. Open **wrangler.jsonc** in this repo.
2. Replace `<YOUR_KV_NAMESPACE_ID>` with the **Namespace ID** from step 1 (e.g. `abc123def456789...`). If you leave the placeholder, the build may fail or KV will be unavailable.
3. Commit and push. On the next deploy, Pages will use this config and attach the KV binding to your Functions.

**Important:** If you use a Wrangler file, ensure your project uses the **V2 build system** (Pages project → Settings → Builds & deployments). The file must include `pages_build_output_dir` (already set to `./dist`).

---

## 3. Add the admin API secret (server-side only)

Only the admin should be able to write to KV. The secret **TMK_ADMIN_API_KEY** lives only in Cloudflare; the browser never stores it.

1. In the dashboard, go to **Workers & Pages** → your **Pages** project.
2. Open **Settings** → **Environment variables**.
3. Under **Production** (and **Preview** if you use it), click **Add variable** → **Encrypt** (so it’s a secret).
4. **Variable name:** `TMK_ADMIN_API_KEY` (must match exactly).
5. **Value:** a long random string — this is your **admin password**. You’ll use it only to log in at `/admin/login`; the server then sets an HTTP-only cookie so saving the ticker works without the key ever being stored in the browser.
6. Save.

### Creating a strong value

Use a long random string. Examples:

- **PowerShell:** `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])`
- **Node:** `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`
- Or generate one in a password manager and paste it.

### Updating the key

1. In **Cloudflare Dashboard** → your Pages project → **Settings** → **Environment variables**.
2. Find **TMK_ADMIN_API_KEY** under Production (and Preview if you use it). Click **Edit**.
3. Enter the new value and save. Redeploy the project so the new secret is active.
4. Log in again at **/admin/login** with the new password. Old sessions (cookie) will stop working.

---

## 4. (Optional) Seed default ticker in KV

After the first deploy with KV bound, you can seed the key so the live site has content even before the first admin save:

1. **Dashboard:** Workers & Pages → KV → your namespace → **Add entry**.
   - **Key:** `newsTickerItems`
   - **Value:** (paste JSON, e.g.):
   ```json
   [{"text":"Welcome to London Tamil Sangam - Celebrating Tamil Culture and Heritage","priority":"high"},{"text":"Follow us on social media for the latest updates and events","priority":"medium"},{"text":"Tamil School registration is now open for the new academic year","priority":"high"},{"text":"Join us for our upcoming cultural events and celebrations","priority":"medium"}]
   ```
2. **Wrangler:**
   ```bash
   npx wrangler kv key put --namespace-id=<YOUR_KV_NAMESPACE_ID> "newsTickerItems" '[{"text":"Welcome to London Tamil Sangam...","priority":"high"}]'
   ```

---

## 5. Log in to the admin (no key in the browser)

1. Deploy the site (with the new Functions and admin UI changes).
2. Go to **/admin/login** and enter your **admin password** — the same value you set as `TMK_ADMIN_API_KEY` in step 3.
3. The server sets an **HTTP-only cookie** (the key never leaves the server). In the **News Ticker** admin page you’ll see a field for **Cloudflare API key** (or similar).
4. Paste the **same value** you set as `TMK_ADMIN_API_KEY` in step 3 and save it (stored only in your browser).
5. When you click **Save** on ticker items, the app sends the cookie (no key in the browser) and the server updates KV so all visitors see the new content. The optional "API key" field on the News page is only a fallback; prefer logging in at **/admin/login** so the key stays server-side only.

---

## 6. R2 bucket for Forms and Gallery (optional)

One bucket **tmklondon-store** is used for forms and (later) gallery images. Object keys use folders: **forms/** for donation PDF and admission DOCX; you can add **gallery/** or other folders for images. Each time a file is served from R2 it counts as one read; the free tier includes **10 million reads/month** and **10 GB storage**.

1. **Create an R2 bucket:** Cloudflare Dashboard → **R2** → **Create bucket** → name **tmklondon-store** (or CLI: `npx wrangler r2 bucket create tmklondon-store`).
2. **Bind it to Pages:** Pages project → **Settings** → **Functions** → **R2 bucket bindings** → **Add** → Variable name **TMK_STORE**, select the bucket **tmklondon-store**.
3. Deploy. Use **/admin/forms** to upload the PDF and DOCX; they are stored as `forms/donation.pdf` and `forms/admission.docx`. The site serves them from `/api/forms/donation` and `/api/forms/admission`; if R2 is empty, those URLs redirect to the static files in `public/forms/`. For gallery, you can store images under keys like `gallery/teachers/...`, `gallery/events/...`, etc.

---

## Summary

| Step | What you did |
|------|----------------|
| 1 | Created a KV namespace and noted its **Namespace ID**. |
| 2 | Bound that namespace to the Pages project as **TMK_KV** (dashboard or wrangler.jsonc). |
| 3 | Set the secret **TMK_ADMIN_API_KEY** in the Pages project (server-side only). |
| 4 | (Optional) Seeded `newsTickerItems` in KV. |
| 5 | Log in at **/admin/login** with that value; cookie auth is used for saving the ticker. |
| 6 | (Optional) Create R2 bucket **tmklondon-store**, bind as **TMK_STORE**; use **/admin/forms** to upload forms (stored under `forms/`). Same bucket can hold gallery images in other folders. |

After this, the ticker reads from KV and admin can update it after logging in. Forms are stored in R2 under `forms/`; each download = 1 R2 read (free tier: 10M reads/month). Use **TMK_STORE** for gallery images later (e.g. `gallery/` prefix).
