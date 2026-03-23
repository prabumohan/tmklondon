# Publication thumbnails

Put **cover / first-page preview** images here so they appear on [/publications](/publications).

## 40th year souvenir (Blurb)

- **Site filename:** `tmk-40th-souvenir-cover.png` — served at `/static/content/publications/tmk-40th-souvenir-cover.png` (the publications page fallback uses this when R2 has no list).
- **To update:** Replace this file in place, or use **Admin → Publications** to upload a cover to R2 for production.
- **Tips:** Export from PDF or use a screenshot; aim for **~600–900px** on the long edge so the card loads quickly. If you change the filename, update `resolveThumbnailSrc('…')` in `src/pages/publications.astro`.

The page checks at **build time** whether the file exists; if it’s missing, a placeholder is shown until you add the image.
