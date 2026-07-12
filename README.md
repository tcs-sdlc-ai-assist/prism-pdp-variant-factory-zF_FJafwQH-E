# Prism PDP Variant Factory

> Internal prototype for cohort-driven PDP variant generation, comparison, and export. Built for demonstration purposes only — not for production use.

## Overview

Prism PDP Variant Factory is a React-based tool that generates tailored Product Detail Page (PDP) variants based on cohort × behavioral overlay configurations. It enables teams to visualize how different customer segments experience a product page, compare variants side-by-side with diff highlighting, and export variant manifests as JSON.

The application ships with a seeded mock catalog of 6 Best Buy-style consumer electronics products and 10 pre-configured cohort targets spanning budget-conscious shoppers, tech enthusiasts, loyalty members, gift shoppers, students, business buyers, and more.

## Features

- **Product Catalog** — Browse 6 mock SKUs with realistic pricing, ratings, specs, and imagery
- **Canonical PDP Rendering** — Full Best Buy-style product detail page with hero, pricing, specs, reviews, cross-sell, and CTA sections
- **Cohort & Behaviour Intake** — Configure up to 10 cohort × behavioral overlay targets with tailoring emphasis controls
- **Deterministic Variant Generation** — Generate up to 10 tailored PDP variants in parallel with staggered fan-out progress animation
- **Variant Gallery** — Responsive grid of variant cards with diff toggle, bulk export, and keyboard navigation
- **Variant Detail View** — Split-pane layout with full PDP render, cohort profile panel, and syntax-highlighted manifest viewer
- **Diff Highlighting** — Toggle accent-colored outlines and "changed for [cohort]" tags on modified PDP sections
- **Manifest Export** — Package single or bulk variant manifests as downloadable JSON files
- **Accessibility** — WCAG 2.1 AA compliant with skip-to-content, ARIA landmarks, focus management, keyboard navigation, and screen reader announcements
- **Observability** — Simulated Dynatrace/Splunk-style event emitter with in-memory buffer for PDP loads, cohort configs, variant generation, exports, and errors
- **Persistence** — localStorage with automatic sessionStorage fallback and dismissible warning banner
- **Responsive Design** — Mobile-first layout from 375px to 1536px+ with Tailwind CSS utility classes

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18+ |
| Build Tool | Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router v6 (createBrowserRouter) |
| State | React Context API |
| Unit Tests | Vitest + React Testing Library |
| E2E Tests | Playwright |
| Linting | ESLint 8 + eslint-plugin-react + eslint-plugin-jsx-a11y |
| Formatting | Prettier |
| Language | JavaScript (JSX) |

## Folder Structure

```
prism-pdp-variant-factory/
├── e2e/                          # Playwright E2E test specs
│   ├── error-handling.spec.js
│   ├── gallery-flow.spec.js
│   └── pdp-rendering.spec.js
├── src/
│   ├── components/
│   │   ├── cohorts/              # Cohort intake panel, target form, generation progress
│   │   ├── common/               # AriaLiveRegion, ErrorBoundary, SkeletonLoader, SkipToContent, StorageBanner
│   │   ├── detail/               # CohortProfilePanel, ManifestViewer, VariantActions, VariantDetailLayout
│   │   ├── gallery/              # BulkExportButton, DiffHighlight, DiffToggle, VariantCard, VariantGalleryGrid
│   │   ├── layout/               # Header, Footer, Layout
│   │   └── pdp/                  # CanonicalPdp, ProductHero, PriceBlock, UrgencyBadge, SpecTable, ReviewSummary, CrossSell, CtaButton
│   ├── constants/
│   │   └── constants.js          # Storage keys, brand colors, breakpoints, tailoring dimensions, route paths
│   ├── context/
│   │   └── AppContext.jsx        # Global application state provider
│   ├── data/
│   │   ├── defaultCohorts.js     # 10 pre-configured cohort targets
│   │   ├── mockCatalog.js        # 6 mock product SKUs
│   │   └── tailoringRules.js     # Cohort × behavioral overlay tailoring rule engine
│   ├── hooks/
│   │   ├── useAccessibility.js   # Focus management, screen reader announcements, keyboard navigation
│   │   ├── useDiff.js            # Memoized diff computation between canonical and variant
│   │   └── useVariants.js        # Variant generation state, progress tracking, retry logic
│   ├── pages/
│   │   ├── CatalogPage.jsx       # /catalog — product catalog grid
│   │   ├── CohortsPage.jsx       # /cohorts — cohort intake and generation
│   │   ├── GalleryPage.jsx       # /variants — variant gallery
│   │   ├── NotFoundPage.jsx      # 404 page
│   │   ├── PdpPage.jsx           # /catalog/:productId — canonical PDP
│   │   └── VariantDetailPage.jsx # /variants/:variantId — variant detail view
│   ├── schemas/
│   │   └── schemas.js            # Validation functions for catalog items, cohort targets, variants, manifests
│   ├── services/
│   │   ├── catalogLoader.js      # Catalog loading, seeding, validation, persistence
│   │   ├── cohortIntakeService.js# Cohort set CRUD, validation, persistence
│   │   ├── diffEngine.js         # Structured diff computation between canonical and variant PDPs
│   │   ├── manifestBuilder.js    # Manifest construction and schema validation
│   │   ├── manifestExporter.js   # JSON file download via Blob + anchor click
│   │   ├── observabilityEmitter.js # Simulated telemetry event emitter
│   │   ├── persistenceManager.js # localStorage/sessionStorage abstraction with fallback
│   │   └── variantGenerator.js   # Deterministic parallel variant generation engine
│   ├── test/
│   │   └── setup.js              # Vitest setup with storage mocks and matchMedia stub
│   ├── App.jsx                   # Root component with ErrorBoundary, AppProvider, RouterProvider
│   ├── index.css                 # Tailwind directives, custom animations, skeleton utilities
│   ├── main.jsx                  # ReactDOM entry point
│   └── router.jsx                # React Router v6 route definitions with lazy loading
├── .eslintrc.cjs
├── .prettierrc
├── catalog-info.yaml             # Backstage component descriptor
├── index.html
├── package.json
├── playwright.config.js
├── postcss.config.js
├── tailwind.config.js
├── vercel.json                   # SPA rewrite rules
├── vite.config.js
└── vitest.config.js
```

## Getting Started

### Prerequisites

- **Node.js** 20+
- **npm** 9+

### Install Dependencies

```bash
npm ci
```

### Development Server

```bash
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173). The app redirects `/` to `/cohorts` by default.

### Build for Production

```bash
npm run build
```

Output is written to the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

### Format

```bash
npm run format
```

### Unit Tests

```bash
npm run test
```

Runs all Vitest unit tests with jsdom environment. Tests cover schemas, services (catalogLoader, diffEngine, manifestBuilder, manifestExporter, persistenceManager, variantGenerator), and React components (CanonicalPdp, CohortIntakePanel, VariantDetailLayout, VariantGalleryGrid).

### E2E Tests

```bash
npm run test:e2e
```

Runs Playwright tests against the dev server. Requires Playwright browsers to be installed:

```bash
npx playwright install --with-deps chromium
```

E2E specs cover the full cohort intake → variant generation → gallery → detail → export flow, PDP rendering across all 6 products, error handling (404 pages, variant not found, product not found), and reset/clear functionality.

## Environment Notes

- No environment variables are required. The application runs entirely client-side with mock data.
- All product data is seeded from `src/data/mockCatalog.js` on first load and persisted to localStorage.
- Cohort configurations are seeded from `src/data/defaultCohorts.js` and persisted to localStorage.
- If localStorage is unavailable (e.g., private browsing), the app falls back to sessionStorage and displays a warning banner.
- No external API calls are made. The observability emitter logs to console and an in-memory buffer only.

## Deployment

The project is configured for deployment to **Vercel** with SPA rewrite rules in `vercel.json`:

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

Deploy via the Vercel CLI or connect the repository to Vercel for automatic deployments on push to `main`.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Catalog   │  │ Cohorts  │  │ Gallery  │  │  Variant   │  │
│  │ Page      │  │ Page     │  │ Page     │  │  Detail    │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬──────┘  │
│       │              │             │              │          │
│  ┌────▼──────────────▼─────────────▼──────────────▼──────┐  │
│  │                   AppContext                          │  │
│  │  catalog · cohortSet · variants · manifests · diff    │  │
│  └────┬──────────────┬─────────────┬──────────────┬──────┘  │
│       │              │             │              │          │
│  ┌────▼─────┐  ┌─────▼────┐  ┌────▼─────┐  ┌────▼──────┐  │
│  │ Catalog  │  │ Cohort   │  │ Variant  │  │ Manifest  │  │
│  │ Loader   │  │ Intake   │  │Generator │  │ Builder   │  │
│  │          │  │ Service  │  │          │  │ & Exporter │  │
│  └────┬─────┘  └──────────┘  └──────────┘  └───────────┘  │
│       │                                                     │
│  ┌────▼─────────────────────────────────────────────────┐  │
│  │              Persistence Manager                      │  │
│  │         localStorage ↔ sessionStorage                 │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           Observability Emitter (console)             │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

- **Deterministic Generation** — Same cohort set + product input always produces identical variant IDs and tailoring, enabling reproducible demos
- **Pure Tailoring Rules** — All cohort × behavioral overlay rules are pure functions returning transformation descriptors, with no side effects
- **Structured Diff Engine** — Field-level diff computation maps each change to a tailoring dimension with rationale and weight metadata
- **Schema Validation** — All data objects (catalog items, cohort targets, variants, manifests) are validated against schemas at persistence boundaries
- **Lazy Route Loading** — All page components are lazy-loaded with Suspense fallbacks for optimal initial bundle size
- **Accessibility First** — Every interactive element has ARIA labels, every region has landmarks, keyboard navigation is fully supported

## Routes

| Path | Component | Description |
|---|---|---|
| `/` | Redirect | Redirects to `/cohorts` |
| `/catalog` | CatalogPage | Product catalog grid |
| `/catalog/:productId` | PdpPage | Canonical product detail page |
| `/cohorts` | CohortsPage | Cohort intake and variant generation |
| `/variants` | GalleryPage | Variant gallery grid |
| `/variants/:variantId` | VariantDetailPage | Variant detail with split-pane layout |
| `*` | NotFoundPage | 404 page with navigation links |

## CI/CD

The GitHub Actions CI pipeline (`.github/workflows/ci.yml`) runs on push and pull request to `main`:

1. **Install** — `npm ci` with node_modules caching
2. **Lint** — ESLint across all `.js` and `.jsx` files
3. **Test** — Vitest unit tests
4. **Build** — Vite production build with artifact upload
5. **E2E** — Playwright tests against the dev server (Chromium only in CI)

## License

Private. All rights reserved. Internal prototype for demonstration purposes only.