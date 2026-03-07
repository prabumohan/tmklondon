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

## 3. Add the admin API secret

Only the admin should be able to write to KV. The `POST /api/ticker` endpoint checks a secret you set in Cloudflare.

1. In the dashboard, go to **Workers & Pages** → your **Pages** project.
2. Open **Settings** → **Environment variables**.
3. Under **Production** (and **Preview** if you use it), click **Add variable** → **Encrypt** (so it’s a secret).
4. **Variable name:** `TMK_ADMIN_API_KEY` (must match exactly).
5. **Value:** a long random string (e.g. `openssl rand -hex 24` or a password manager). Copy this value — you’ll paste it into the admin UI once.
6. Save.

You’ll use this **same value** in the admin UI (step 5) so the browser can send it when saving ticker items.

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

## 5. Set the API key in the admin UI

1. Deploy the site (with the new Functions and admin UI changes).
2. Log in to the admin area (e.g. `/admin/news`).
3. In the **News Ticker** admin page you’ll see a field for **Cloudflare API key** (or similar).
4. Paste the **same value** you set as `TMK_ADMIN_API_KEY` in step 3 and save it (stored only in your browser).
5. When you click **Save** on ticker items, the app will send that key to `POST /api/ticker` and update KV so all visitors see the new content.

---

## Summary

| Step | What you did |
|------|----------------|
| 1 | Created a KV namespace and noted its **Namespace ID**. |
| 2 | Bound that namespace to the Pages project as **TMK_KV** (dashboard or wrangler.jsonc). |
| 3 | Set the secret **TMK_ADMIN_API_KEY** in the Pages project. |
| 4 | (Optional) Seeded `newsTickerItems` in KV. |
| 5 | Entered the same API key in the admin UI so saves go to KV. |

After this, the ticker on the live site reads from KV (via `/api/ticker`), and admin saves from the News Ticker page update KV for everyone.
