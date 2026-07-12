# Deployment Guide

> Deployment documentation for the Prism PDP Variant Factory. Covers Vercel deployment, CI/CD pipeline, artifact packaging, Backstage registration, and static hosting alternatives.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Build Configuration](#build-configuration)
- [Vercel Deployment](#vercel-deployment)
- [SPA Rewrite Configuration](#spa-rewrite-configuration)
- [Environment Variables](#environment-variables)
- [GitHub Actions CI/CD Pipeline](#github-actions-cicd-pipeline)
- [Artifact Packaging](#artifact-packaging)
- [Backstage.io Catalog Registration](#backstageio-catalog-registration)
- [Static Hosting Alternatives](#static-hosting-alternatives)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Prism PDP Variant Factory is a fully client-side React single-page application (SPA) built with Vite. It requires no backend server, no database, and no external API calls. All product data is seeded from `src/data/mockCatalog.js` and persisted to the browser's `localStorage` (with automatic `sessionStorage` fallback).

The application is configured for deployment to **Vercel** with SPA rewrite rules, but can be deployed to any static hosting provider that supports client-side routing rewrites.

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 20+ |
| npm | 9+ |
| Git | 2.x+ |
| Vercel CLI (optional) | Latest |

---

## Build Configuration

### Build Command

```bash
npm run build
```

This runs `vite build` under the hood, producing an optimized production bundle.

### Output Directory

```
dist/
```

All static assets (HTML, JS, CSS, images) are written to the `dist/` directory. This is the directory you point your hosting provider to.

### Vite Configuration

The build is configured in `vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
```

Key build features:

- **Path alias**: `@` resolves to `src/` for clean imports
- **Manual chunks**: React, ReactDOM, and React Router are split into a separate `vendor` chunk for optimal caching
- **Output directory**: `dist/`

### Preview Production Build Locally

```bash
npm run preview
```

This serves the `dist/` directory locally at `http://localhost:4173` using Vite's built-in preview server.

---

## Vercel Deployment

### Option 1: Connect GitHub Repository (Recommended)

1. Log in to [Vercel](https://vercel.com)
2. Click **Add New Project**
3. Import the `prism-pdp-variant-factory` GitHub repository
4. Vercel auto-detects the Vite framework and configures:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm ci`
5. Click **Deploy**

Vercel will automatically deploy on every push to the `main` branch and create preview deployments for pull requests.

### Option 2: Vercel CLI

Install the Vercel CLI globally:

```bash
npm install -g vercel
```

Deploy from the project root:

```bash
# First-time setup (links to Vercel project)
vercel

# Production deployment
vercel --prod
```

### Option 3: Manual Deploy

Build locally and deploy the `dist/` directory:

```bash
npm ci
npm run build
vercel deploy dist/ --prod
```

---

## SPA Rewrite Configuration

The application uses React Router v6 with `createBrowserRouter` for client-side routing. All routes must be rewritten to `index.html` so the React router can handle them.

### vercel.json

The `vercel.json` file in the project root configures SPA rewrites for Vercel:

```json
{
  "rewrites": [
    {
      "source": "/((?!assets/).*)",
      "destination": "/index.html"
    }
  ]
}
```

This rule rewrites all requests to `/index.html` **except** requests to the `/assets/` directory (which contains Vite-generated static assets like JS, CSS, and font files).

### Route Table

| Path | Component | Description |
|---|---|---|
| `/` | Redirect | Redirects to `/cohorts` |
| `/catalog` | CatalogPage | Product catalog grid |
| `/catalog/:productId` | PdpPage | Canonical product detail page |
| `/pdp/:sku` | PdpPage | Canonical PDP (SKU-based route) |
| `/cohorts` | CohortsPage | Cohort intake and variant generation |
| `/cohorts/:cohortId` | CohortsPage | Cohort detail (same component) |
| `/variants` | GalleryPage | Variant gallery grid |
| `/variants/:variantId` | VariantDetailPage | Variant detail with split-pane layout |
| `*` | NotFoundPage | 404 page with navigation links |

All page components are lazy-loaded with `React.lazy()` and wrapped in `<Suspense>` with `SkeletonLoader` fallbacks for optimal initial bundle size.

---

## Environment Variables

**No environment variables are required.**

The application runs entirely client-side with mock data. There are no API keys, backend URLs, or secrets to configure.

| Variable | Required | Description |
|---|---|---|
| — | — | No environment variables needed |

Notes:

- All product data is seeded from `src/data/mockCatalog.js` on first load
- Cohort configurations are seeded from `src/data/defaultCohorts.js`
- Data is persisted to `localStorage` (or `sessionStorage` fallback)
- The observability emitter logs to `console` and an in-memory buffer only — no external telemetry endpoints
- If you need to access Vite environment variables in the future, use `import.meta.env.VITE_*` (never `process.env`)

---

## GitHub Actions CI/CD Pipeline

The CI/CD pipeline is defined in `.github/workflows/ci.yml` and runs on every push and pull request to the `main` branch.

### Pipeline Jobs

```
┌──────────┐
│ Install  │
└────┬─────┘
     │
     ├──────────────┐
     │              │
┌────▼─────┐  ┌─────▼────┐
│   Lint   │  │   Test   │
└────┬─────┘  └─────┬────┘
     │              │
     └──────┬───────┘
            │
      ┌─────▼─────┐
      │   Build   │
      └─────┬─────┘
            │
      ┌─────▼─────┐
      │    E2E    │
      └───────────┘
```

### Job Details

| Job | Description | Dependencies |
|---|---|---|
| **Install** | Runs `npm ci` and caches `node_modules` | None |
| **Lint** | Runs ESLint across all `.js` and `.jsx` files | Install |
| **Test** | Runs Vitest unit tests with jsdom environment | Install |
| **Build** | Runs `vite build` and uploads `dist/` artifact | Lint, Test |
| **E2E** | Runs Playwright tests against dev server (Chromium) | Build |

### Job 1: Install

```yaml
- name: Install dependencies
  run: npm ci

- name: Cache node_modules
  uses: actions/cache@v4
  with:
    path: node_modules
    key: node-modules-${{ hashFiles('package-lock.json') }}
```

### Job 2: Lint

```bash
npm run lint
```

Runs ESLint with the following plugins:

- `eslint-plugin-react` — React-specific linting rules
- `eslint-plugin-react-hooks` — Hooks rules of hooks and exhaustive deps
- `eslint-plugin-jsx-a11y` — Accessibility linting for JSX

### Job 3: Unit Tests

```bash
npm run test
```

Runs all Vitest unit tests with jsdom environment. Test coverage includes:

- Schema validation functions (`validateCatalogItem`, `validateCohortTarget`, `validateCohortSet`, `validateVariant`, `validateManifest`)
- Services (`catalogLoader`, `diffEngine`, `manifestBuilder`, `manifestExporter`, `persistenceManager`, `variantGenerator`)
- React components (`CanonicalPdp`, `CohortIntakePanel`, `VariantDetailLayout`, `VariantGalleryGrid`)

### Job 4: Build

```bash
npm run build
```

Produces the `dist/` directory and uploads it as a GitHub Actions artifact:

```yaml
- name: Upload dist artifact
  uses: actions/upload-artifact@v4
  with:
    name: dist
    path: dist/
    retention-days: 14
```

Also packages build manifests:

```yaml
- name: Package manifests
  run: |
    mkdir -p manifests
    if [ -d "src/data" ]; then
      cp -r src/data/*.json manifests/ 2>/dev/null || true
    fi
    echo '{"buildTime":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'","commit":"'${{ github.sha }}'","ref":"'${{ github.ref }}'"}' > manifests/build-info.json

- name: Upload manifests artifact
  uses: actions/upload-artifact@v4
  with:
    name: manifests
    path: manifests/
    retention-days: 14
```

### Job 5: E2E Tests

```bash
npx playwright install --with-deps chromium
npx playwright test --project=chromium
```

Runs Playwright E2E tests against the Vite dev server. E2E specs cover:

- Full cohort intake → variant generation → gallery → detail → export flow
- PDP rendering across all 6 products with accessibility landmark verification
- Error handling (404 pages, variant not found, product not found, reset functionality, navigation recovery, empty states)

E2E test reports and results are uploaded as artifacts:

```yaml
- name: Upload Playwright report
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
    retention-days: 14

- name: Upload test results
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: test-results
    path: test-results/
    retention-days: 14
```

### Pipeline Configuration

- **Node.js version**: 20
- **npm caching**: Enabled via `actions/setup-node@v4` with `cache: npm`
- **Parallelism**: Lint and Test jobs run in parallel after Install
- **E2E retries**: 2 retries in CI (`retries: process.env.CI ? 2 : 0`)
- **E2E workers**: Single worker in CI (`workers: process.env.CI ? 1 : undefined`)
- **E2E browser**: Chromium only in CI

---

## Artifact Packaging

The CI pipeline produces the following artifacts on each successful build:

### dist Artifact

Contains the complete production build output:

```
dist/
├── assets/
│   ├── index-[hash].js        # Application bundle
│   ├── vendor-[hash].js       # React + React Router vendor chunk
│   └── index-[hash].css       # Compiled Tailwind CSS
├── index.html                  # Entry HTML file
└── vite.svg                    # Favicon
```

### manifests Artifact

Contains build metadata and data snapshots:

```
manifests/
├── build-info.json             # Build timestamp, commit SHA, git ref
└── *.json                      # Data files from src/data/ (if any)
```

The `build-info.json` file contains:

```json
{
  "buildTime": "2024-06-10T12:00:00Z",
  "commit": "abc123def456...",
  "ref": "refs/heads/main"
}
```

### Artifact Retention

All artifacts are retained for **14 days** by default. Adjust the `retention-days` value in `.github/workflows/ci.yml` to change this.

---

## Backstage.io Catalog Registration

The project includes a `catalog-info.yaml` file for registration with [Backstage.io](https://backstage.io/) service catalogs.

### catalog-info.yaml

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: prism-pdp-variant-factory
  description: Prism PDP Variant Factory - Product Detail Page variant configuration and management tool
  annotations:
    github.com/project-slug: prism-pdp-variant-factory
    backstage.io/techdocs-ref: dir:.
  tags:
    - react
    - vite
    - javascript
    - tailwindcss
  links:
    - url: https://github.com/prism-pdp-variant-factory
      title: GitHub Repository
      icon: github
spec:
  type: website
  lifecycle: production
  owner: frontend-team
  system: prism-pdp
```

### Registration Steps

1. Navigate to your Backstage instance
2. Go to **Catalog** → **Register Existing Component**
3. Enter the URL to the `catalog-info.yaml` file in your repository:
   ```
   https://github.com/<org>/prism-pdp-variant-factory/blob/main/catalog-info.yaml
   ```
4. Click **Analyze** and then **Import**

The component will appear in the Backstage catalog under:

- **Type**: Website
- **Lifecycle**: Production
- **Owner**: frontend-team
- **System**: prism-pdp

---

## Static Hosting Alternatives

Since the application is a fully static SPA, it can be deployed to any static hosting provider. Below are configuration notes for common alternatives.

### Netlify

Create a `netlify.toml` in the project root:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
  conditions = {Role = ["admin"]}

[[redirects]]
  from = "/assets/*"
  to = "/assets/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Or create a `_redirects` file in the `public/` directory:

```
/assets/*  /assets/:splat  200
/*         /index.html     200
```

### AWS S3 + CloudFront

1. Build the project: `npm run build`
2. Upload the `dist/` directory to an S3 bucket configured for static website hosting
3. Configure CloudFront with a custom error response:
   - **HTTP Error Code**: 403 and 404
   - **Response Page Path**: `/index.html`
   - **HTTP Response Code**: 200
4. Set the S3 bucket policy to allow CloudFront access

### GitHub Pages

Add a `404.html` file to the `public/` directory that redirects to `index.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <script>
      // Redirect all 404s to index.html for SPA routing
      var path = window.location.pathname;
      window.location.replace('/' + '?p=' + path);
    </script>
  </head>
  <body></body>
</html>
```

Then configure the Vite build for GitHub Pages in `vite.config.js`:

```js
export default defineConfig({
  base: '/prism-pdp-variant-factory/',
  // ... rest of config
});
```

### Docker (Nginx)

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create an `nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

Build and run:

```bash
docker build -t prism-pdp-variant-factory .
docker run -p 8080:80 prism-pdp-variant-factory
```

### Firebase Hosting

Create a `firebase.json`:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

Deploy:

```bash
npm run build
firebase deploy --only hosting
```

---

## Troubleshooting

### Common Issues

#### Blank page after deployment

**Cause**: SPA rewrite rules are not configured. The hosting provider returns a 404 for client-side routes like `/cohorts` or `/variants`.

**Fix**: Ensure your hosting provider rewrites all non-asset requests to `/index.html`. See the [SPA Rewrite Configuration](#spa-rewrite-configuration) section.

#### Assets not loading (404 on JS/CSS files)

**Cause**: The rewrite rule is too aggressive and rewrites asset requests to `index.html`.

**Fix**: Ensure the rewrite rule excludes the `/assets/` directory. The `vercel.json` configuration uses a negative lookahead `((?!assets/).*)` to exclude asset paths.

#### localStorage unavailable (private browsing)

**Cause**: Some browsers disable `localStorage` in private/incognito mode.

**Behavior**: The application automatically falls back to `sessionStorage` and displays a dismissible warning banner. Data will not persist across browser sessions in this mode.

#### Build fails with out-of-memory error

**Cause**: Large dependency tree or constrained CI environment.

**Fix**: Increase Node.js memory limit:

```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

#### E2E tests fail in CI

**Cause**: Playwright browsers not installed or dev server not ready.

**Fix**: Ensure Playwright browsers are installed before running tests:

```bash
npx playwright install --with-deps chromium
```

The Playwright config includes a `webServer` block that starts the Vite dev server automatically:

```js
webServer: {
  command: 'npm run dev',
  url: 'http://localhost:5173',
  reuseExistingServer: !process.env.CI,
  timeout: 120000,
},
```

#### Fonts not loading

**Cause**: Google Fonts CDN is blocked or the `<link>` tags are missing from `index.html`.

**Behavior**: The application uses Inter for body text and JetBrains Mono for code/monospace elements. Both are loaded from Google Fonts via `<link>` tags in `index.html`. If the CDN is unavailable, the application falls back to system fonts defined in `tailwind.config.js`.

---

## Quick Reference

| Task | Command |
|---|---|
| Install dependencies | `npm ci` |
| Start dev server | `npm run dev` |
| Build for production | `npm run build` |
| Preview production build | `npm run preview` |
| Run linter | `npm run lint` |
| Run unit tests | `npm run test` |
| Run E2E tests | `npm run test:e2e` |
| Format code | `npm run format` |
| Deploy to Vercel | `vercel --prod` |

---

## License

Private. All rights reserved. Internal prototype for demonstration purposes only.