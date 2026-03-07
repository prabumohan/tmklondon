# Static Content – Images

All site images live here so they are easy to manage and deploy.

## Background (London + Tamil)

The site uses a **London skyline** image with a **teal/saffron overlay** (Tamil community feel). By default it loads a free London image from Unsplash. To use your own London or Tamil-themed photo:

1. Save your image here as **`background.jpg`** (e.g. London skyline, Thames, Tamil event in London).
2. In `src/layouts/BaseLayout.astro`, change the background image URL from the Unsplash URL to:  
   `url('/static/content/background.jpg')`.
3. Optionally do the same in `src/components/Header.astro` for the header strip.

## Hero & header

- **hero-banner.jpg** – Used in the header strip and hero carousel. Replace with your own banner (e.g. school, events).
- **Header Tamil heritage:** The header uses a subtle Tamil palm-leaf manuscript texture (Wikimedia Commons). To use your own Tamil language/culture image, save it as `header-tamil-heritage.jpg` here and update `src/components/Header.astro` (class `.header-tamil-heritage`).
- Add more carousel images in `carousel/` and reference them in `src/components/HeroSection.astro`.

## Logo

- **logo.png** – Site logo (header, favicon, SEO). Prefer PNG with transparent background.

## Gallery

Place gallery images in:

- `gallery/teachers/` – Teacher photos
- `gallery/school/` – School activities
- `gallery/events/` – Events
- `gallery/community/` – Community gatherings

The gallery page and admin uploads can use these paths. See `public/images/README.md` for original gallery folder notes; you can move those images here over time.

## Other

- **banner-tam-2.jpg** – If still used, copy from `public/images/` to here and update any references to `/static/content/banner-tam-2.jpg`.
