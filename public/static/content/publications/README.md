# Publication thumbnails

Put **cover / first-page preview** images here so they appear on [/publications](/publications).

## 40th year souvenir (Blurb)

- **Expected filename:** `tmk-40th-souvenir-cover.jpg` (or `.webp` — then update `thumbnailFile` in `src/pages/publications.astro`)
- **Tips:** Export a **JPEG or WebP** from your PDF or scan the printed first page; aim for **~600–900px** on the long edge so the card loads quickly.

The page checks at **build time** whether the file exists; if it’s missing, a placeholder is shown until you add the image.
