# SEO Guide – TMK London (London Tamil Sangam)

This document explains what is in place for SEO and what you need to do. The site is optimised to appear when people search for **London Tamil Sangam**, **Tamil Sangam London**, and related terms.

---

## 1. Sitemap (`sitemap.xml`)

**Why you don’t see it yet**

- The sitemap is **not** generated in dev (`pnpm dev`). It is created only when you **build** the site.
- Run:  
  `pnpm build`  
  (or `npm run build`). After a successful build, the sitemap will be at:
  - **Local:** `dist/sitemap.xml` (and `dist/sitemap-index.xml` if many pages)
  - **Live:** `https://tmklondon.com/sitemap.xml` (once you deploy the built site)

**What’s configured**

- Sitemap integration is **enabled** in `astro.config.mjs`.
- Admin routes (`/admin/*`) are **excluded** from the sitemap.
- `site: 'https://tmklondon.com'` is set so all sitemap URLs are absolute.

**What you need to do**

1. Build the site: `pnpm build` (or `npm run build`).
2. Deploy the `dist/` folder to your host (e.g. Cloudflare Pages).
3. Confirm the sitemap is live at: `https://tmklondon.com/sitemap.xml`.

---

## 2. What’s already done for SEO

| Item | Status | Where |
|------|--------|--------|
| **Sitemap** | Enabled (generated on build) | `astro.config.mjs` |
| **robots.txt** | Points to sitemap | `public/robots.txt` |
| **Meta title & description** | Per page | `BaseLayout` + `utils/seo.ts` |
| **Canonical URL** | Set | `getSEOConfig()` in `seo.ts` |
| **Open Graph (Facebook/social)** | Set | `astro-seo` in `SEO.astro` |
| **Twitter Card** | Set | `astro-seo` in `SEO.astro` |
| **Meta keywords** | Set | `seo.ts` |
| **Schema.org – Organization** | On all pages | `getOrganizationSchema()` – name "London Tamil Sangam" |
| **Schema.org – EducationalOrganization** | On home | `getLocalBusinessSchema()` – London Tamil Sangam Tamil School |
| **Schema.org – LocalBusiness** | On home | `getLocalBusinessSchemaForSEO()` – for local search / "London Tamil Sangam" |
| **Canonical URL** | Per page | Each page has its own canonical (path + query for lang) |
| **hreflang (ta, en, x-default)** | On all pages | Tells Google about Tamil and English versions |
| **Geo meta (London)** | Set | `seo.ts` (geo.region GB-LND, geo.placename London, UK) |
| **HTML compression** | On | `compressHTML: true` in `astro.config.mjs` |
| **Semantic HTML** | Used | Layouts and components |

---

## 3. What you should do for best SEO

### A. After every deploy

1. **Check sitemap**  
   Open: `https://tmklondon.com/sitemap.xml`  
   Ensure it lists all important pages (no admin URLs).

2. **Submit sitemap in Google Search Console**  
   - Go to [Google Search Console](https://search.google.com/search-console).  
   - Add the property `https://tmklondon.com` if not already.  
   - **Sitemaps** → Add: `https://tmklondon.com/sitemap.xml` → Submit.

3. **Submit sitemap in Bing Webmaster Tools**  
   - [Bing Webmaster Tools](https://www.bing.com/webmasters).  
   - Add site and submit: `https://tmklondon.com/sitemap.xml`.

### B. Targeting "London Tamil Sangam"

- **Homepage:** The default meta title is **London Tamil Sangam | TMK London - Tamil School & Community Since 1975**. The hero H1 says "Welcome to London Tamil Sangam" (English) so the key phrase appears in visible content.
- **Keywords:** Meta keywords and descriptions include "London Tamil Sangam", "Tamil Sangam London", "London Tamil Sangam UK", and related phrases.
- **Schema:** Organization name is "London Tamil Sangam"; LocalBusiness and EducationalOrganization also use this name and alternateName so Google can associate the site with the search term.

### C. Content and structure

- **Unique title and description per page**  
  Already wired; when you add new pages, set `title` and `description` in the layout/SEO config so each page has its own meta. Key pages (about, contact, tamil-school, gallery) include "London Tamil Sangam" or "Tamil Sangam London" in descriptions.

- **Use headings in order**  
  One `<h1>` per page (e.g. main page title), then `<h2>`, `<h3>` for sections. Avoid skipping levels.

- **Meaningful URLs**  
  Keep clean, readable paths (e.g. `/tamil-school`, `/student-registration`). Already in place.

- **Internal links**  
  Link from the homepage and main menus to important pages (Tamil school, registration, contact, etc.). Already in place.

- **Image `alt` text**  
  For every image that matters for content, set an `alt` that describes it (e.g. “TMK Tamil School students at event”).

### D. Optional but recommended

- **Analytics**  
  Plausible is referenced in the layout; ensure the script is correct and the domain is verified in Plausible.

- **Local SEO**  
  If you use Google Business Profile, keep name, address, phone, and website consistent with `seo.ts` (and Schema.org).

- **Tamil/English and `hreflang`**  
  `hreflang` tags are in place (ta, en, x-default) so Google can index both language versions correctly.

---

## 4. Quick checklist

- [ ] Run `pnpm build` and deploy the `dist/` folder.
- [ ] Confirm `https://tmklondon.com/sitemap.xml` loads and lists public pages.
- [ ] Submit `https://tmklondon.com/sitemap.xml` in Google Search Console.
- [ ] Submit the same sitemap in Bing Webmaster Tools.
- [ ] Verify meta title/description on a few key pages (view source or use an SEO preview tool).
- [ ] Add or review `alt` text on important images.
- [ ] Keep `site` in `astro.config.mjs` as `https://tmklondon.com` so the sitemap and canonicals stay correct.

---

## 5. Summary

- **Sitemap:** Enabled; generated only at **build** time. Build and deploy, then use `https://tmklondon.com/sitemap.xml`.
- **SEO basics:** Meta tags, Open Graph, Twitter Card, Schema.org, robots.txt, and HTML compression are already set up.
- **Your part:** Build, deploy, submit the sitemap in Google and Bing, and keep titles, descriptions, and image alt text in good shape for each important page.
