# TMK London - Modern Website

A modern, SEO-optimized website for Thamizhar Munnetra Kazhagam (TMK) London built with Astro.

## Tech Stack

- **Framework**: [Astro](https://astro.build) - Best-in-class for static + content sites
- **Styling**: [Tailwind CSS](https://tailwindcss.com) - Utility-first CSS framework
- **Build Tool**: [Vite](https://vitejs.dev) + [pnpm](https://pnpm.io)
- **Hosting**: [Cloudflare Pages](https://pages.cloudflare.com) - Fastest edge delivery
- **SEO**: Astro SEO + Schema.org structured data
- **Analytics**: [Plausible](https://plausible.io) - Privacy-friendly analytics
- **Images**: [Cloudinary](https://cloudinary.com) - Image optimization (configure as needed)

## Features

- ✅ Zero JS by default (super fast)
- ✅ Multi-language support (Tamil/English)
- ✅ SEO optimized with Schema.org markup
- ✅ Responsive design
- ✅ Modern UI with Tailwind CSS
- ✅ Fast static site generation
- ✅ Sitemap generation
- ✅ Privacy-friendly analytics

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 8+

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Running on WSL (Windows Subsystem for Linux)

If `npm install` fails in WSL with errors like `Cannot read properties of null (reading 'matches')`, use **pnpm** instead:

```bash
# 1. Go to your project (use your actual Windows path under /mnt/c/...)
cd /mnt/c/Users/prabu/OneDrive/Personal_Cursor_Sites/tmklondon

# 2. Enable pnpm (comes with Node.js 16.13+)
corepack enable
corepack prepare pnpm@latest --activate

# 3. Install dependencies with pnpm
pnpm install

# 4. Start the dev server
pnpm dev
```

Then open **http://localhost:4321** in your browser.

## Project Structure

```
/
├── public/          # Static assets (images, favicon, etc.)
├── src/
│   ├── components/  # Reusable components
│   ├── layouts/    # Page layouts
│   ├── pages/      # Route pages
│   └── utils/      # Utility functions
├── astro.config.mjs
├── tailwind.config.mjs
└── package.json
```

## Deployment

### Cloudflare Pages

#### Option 1: Deploy via Cloudflare Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Cloudflare Pages**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Navigate to **Pages** → **Create a project**
   - Click **Connect to Git**
   - Select your repository (GitHub/GitLab/Bitbucket)
   - Authorize Cloudflare to access your repository

3. **Configure Build Settings**
   - **Framework preset**: Astro (or None)
   - **Build command**: `pnpm build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty if repo root)
   - **Node.js version**: `18` or higher
   - **Package manager**: `pnpm`

4. **Environment Variables** (if needed)
   - Add any environment variables in the Cloudflare Pages dashboard
   - For example: `NODE_ENV=production`

5. **Deploy**
   - Click **Save and Deploy**
   - Cloudflare will build and deploy your site
   - You'll get a preview URL like `https://your-project.pages.dev`

6. **Custom Domain Setup**
   - After deployment, go to **Custom domains**
   - Add your domain: `tmklondon.com`
   - Cloudflare will provide DNS instructions
   - Update your DNS records as instructed

#### Option 2: Deploy via Wrangler CLI (Manual)

1. **Install Wrangler CLI**
   ```bash
   pnpm add -D wrangler
   # or globally
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   npx wrangler login
   ```

3. **Build your site**
   ```bash
   pnpm build
   ```

4. **Deploy to Cloudflare Pages**
   ```bash
   npx wrangler pages deploy dist --project-name=tmklondon
   ```

#### Option 3: GitHub Actions (Automated)

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: tmklondon
          directory: dist
```

**Note**: You'll need to add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as secrets in your GitHub repository settings.

### Build Configuration

- **Build command**: `pnpm build`
- **Output directory**: `dist`
- **Node.js version**: `18` or higher
- **Package manager**: `pnpm`

The site will automatically deploy on every push to the main branch when using Git integration.

## SEO Features

- Semantic HTML structure
- Schema.org structured data (Organization, LocalBusiness)
- Open Graph meta tags
- Twitter Card meta tags
- XML Sitemap generation
- Robots.txt configuration
- Canonical URLs

## Multi-language Support

The site supports Tamil (ta) and English (en). Language can be switched via URL parameter:
- `/?lang=ta` - Tamil
- `/?lang=en` - English

## Analytics

Plausible Analytics is configured for privacy-friendly tracking. Update the domain in `src/layouts/BaseLayout.astro` if needed.

## Images

For image optimization, configure Cloudinary in your components:

```astro
---
import { Image } from '@astrojs/image';
---

<Image src="https://res.cloudinary.com/your-cloud/image.jpg" alt="Description" />
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

© 2025 Thamizhar Munnetra Kazhagam. All Rights Reserved.
