# Changelog

All notable changes to the Prism PDP Variant Factory will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] — 2024-06-10

### Added

#### Canonical PDP Rendering
- Full Best Buy-style product detail page composition with hero, pricing, specs, reviews, cross-sell, and CTA sections.
- `CanonicalPdp` component assembling `ProductHero`, `PriceBlock`, `UrgencyBadge`, `SpecTable`, `ReviewSummary`, `CrossSell`, and `CtaButton` sub-components.
- Responsive layout with Tailwind CSS grid: single column at mobile (375px), split-pane at desktop (1280px+).
- Product image placeholder rendering with lazy loading and hover scale effect.
- Star rating display with filled, half-filled, and empty star states.
- Financing estimate display for products over $100.
- Fulfillment information rendering with delivery icon.
- Breadcrumb navigation on PDP pages.
- Support for 6 hero layout variants: standard, price-forward, media-rich, spec-heavy, social-proof, and urgency.
- Support for 6 price display modes: standard, savings-highlight, member-price, volume-discount, student-discount, and compare-at.
- Support for 5 CTA tones: standard, urgent, value, premium, and friendly.
- Support for 6 cross-sell strategies: complementary, upgrade, bundle, history-based, essentials, and none.
- Support for 5 social proof display modes: standard, expanded, expert-focused, value-focused, and minimal.
- Support for 6 review filter strategies: none, positive, detailed, expert, value-mention, and recent.
- Deterministic mock cross-sell item generation based on product and strategy.
- Deterministic mock review excerpt generation based on product and filter settings.
- Rating distribution bar chart with per-star breakdown.

#### Product Catalog
- Seeded mock catalog of 6 Best Buy-style consumer electronics products (Samsung TV, MacBook Pro, Sony headphones, Echo Studio, iPad Air, PS5 Slim).
- `CatalogPage` with responsive product card grid (1 col mobile, 2 cols tablet, 3 cols desktop).
- Product cards with image, title, price, member price, rating, review count, badge, fulfillment info, and SKU.
- Catalog reset button to restore default demo data.
- `catalogLoader` service with schema validation, localStorage persistence, and in-memory caching.
- `getSkuById` and `getProductById` lookup functions.
- Automatic seeding from `mockCatalog.js` on first load or corrupted storage recovery.

#### Cohort & Behaviour Intake
- `CohortIntakePanel` component with up to 10 configurable cohort × behavioral overlay targets.
- `CohortTargetForm` component with fields for variant label, cohort type, behavioral overlay, base SKU, priority, and tailoring emphasis.
- 8 cohort type options: New Visitor, Returning Customer, Loyalty Member, High Value Customer, Bargain Seeker, Tech Enthusiast, Business Buyer, Student.
- 8 behavioral overlay options: Browse History, Cart Abandonment, Purchase Frequency, Category Affinity, Price Sensitivity, Brand Loyalty, Session Depth, Device Type.
- 10 tailoring dimension checkboxes with adjustable weight sliders (0–100): price, promotion, badge, media, description, title, rating, fulfillment, warranty, accessories.
- Batch count input (1–10) for adding/removing target rows.
- Load Defaults button to restore 10 pre-configured cohort targets from `defaultCohorts.js`.
- Clear All button to reset to a single empty target.
- Per-field inline validation with error messages.
- Validation summary panel with error count badge.
- Generate button disabled until all targets pass validation.
- `cohortIntakeService` with CRUD operations, schema validation, and localStorage persistence.

#### Deterministic Variant Generation
- `variantGenerator` engine producing up to 10 tailored PDP variants in parallel via `Promise.all`.
- Deterministic variant ID generation using seeded hash (`cohortId:productId:index`).
- Same cohort set + product input always produces identical variant IDs and tailoring.
- `tailoringRules` module with pure functions returning transformation descriptors per cohort × behavioral overlay combination.
- 10 cohort-type-specific base rule sets (budget-conscious, tech-enthusiast, first-time-buyer, loyalty-member, gift-shopper, business-buyer, student, high-value, bargain-seeker, returning-customer).
- 8 behavioral overlay modifier rule sets (browse-heavy, comparison-shopper, deal-seeker, cart-abandoner, seasonal-browser, bulk-researcher, brand-loyalist, quick-purchaser).
- Tailoring emphasis override application with weight adjustment.
- Per-variant diff computation against canonical PDP.
- Per-variant manifest construction with applied tailoring entries.
- Per-variant tailoring map with dimension → transformation descriptor mapping.
- Retry logic (up to 2 retries) for individual variant generation failures.
- `GenerationProgress` component with staggered fan-out animation, progress bar, per-variant status indicators (pending/generating/complete/error), elapsed time counter, and completion summary.
- `useVariants` hook managing generation state, progress tracking, and retry logic.

#### Variant Gallery
- `VariantGalleryGrid` component with responsive grid (1 col mobile, 2 cols tablet, 3–4 cols desktop).
- `VariantCard` component with image preview, variant label, cohort + behavioral overlay badges, price + CTA preview, tailoring dimension pills, diff summary, and View Details link.
- Control variant badge display on the first generated variant.
- Priority number badge on each variant card.
- Staggered fade-in animation with per-card delay.
- Keyboard navigation between cards (Arrow keys, Home, End).
- `DiffToggle` accessible toggle switch for enabling/disabling diff highlighting across the gallery.
- `DiffHighlight` wrapper component applying accent-colored ring outline and "changed for [cohort]" tag on modified PDP sections.
- `BulkExportButton` for exporting all variant manifests as a combined JSON file.
- Empty state with CTA buttons to navigate to Cohort Intake or Catalog.
- Loading state with skeleton loaders.
- Variant count badge and diff status indicators in gallery header and footer.

#### Variant Detail View
- `VariantDetailLayout` split-pane layout with full PDP render (left, 8 cols) and side panel (right, 4 cols).
- `VariantActions` toolbar with Back to Gallery, View Diff toggle, and Package Variant export button.
- `CohortProfilePanel` side panel displaying cohort type, behavioral overlay, base SKU, variant ID, changed dimensions, tailoring emphasis bars, and applied tailoring rules.
- `ManifestViewer` syntax-highlighted JSON code block with JetBrains Mono font, line numbers, copy-to-clipboard button, and collapse/expand toggle.
- Diff highlighting integration with dimension count and field count indicators.
- Variant header with label, control badge, and priority number.
- Responsive stacking: side panel below PDP on mobile.
- Not-found state with navigation links when variant ID is invalid.
- Loading state with skeleton loaders.

#### Manifest Export
- `manifestBuilder` service constructing manifest objects per variant with variantId, cohort, behavioralOverlay, baseSku, appliedTailoring array, diffSummary, created timestamp, and controlFlag.
- `buildBulkManifest` for full-set export with totalVariants, totalTransformations, and per-variant manifests.
- `extractExportManifest` for clean export-ready manifest without internal fields.
- `manifestExporter` service with Blob creation, anchor click download trigger, and URL revocation.
- `exportManifest` for single variant manifest JSON download.
- `exportBulk` for bulk manifest JSON download.
- `exportVariantManifest` convenience wrapper (build + export in one call).
- `exportBulkVariantManifests` convenience wrapper for bulk (build all + export).
- Auto-generated filenames with variant ID and ISO timestamp.
- Schema validation before export with error reporting.
- Export success/error feedback with button state transitions (idle → exporting → success/error).

#### Accessibility (WCAG 2.1 AA)
- Skip-to-content link (`SkipToContent` component) visible on focus for keyboard users.
- ARIA landmarks: `role="region"` with descriptive `aria-label` on all major sections.
- `role="navigation"` with `aria-label="Primary navigation"` and `aria-label="Breadcrumb"`.
- `role="main"` on main content area.
- `role="contentinfo"` on footer.
- `role="complementary"` on side panels (cohort profile, manifest viewer).
- `role="toolbar"` on variant actions bar.
- `role="grid"` and `role="gridcell"` on variant gallery.
- `role="switch"` with `aria-checked` on diff toggle.
- `role="progressbar"` with `aria-valuenow`, `aria-valuemin`, `aria-valuemax` on generation progress.
- `role="table"` with `aria-label` on specifications table.
- `role="list"` and `role="listitem"` on product lists, cohort targets, cross-sell items, and applied tailoring rules.
- `role="article"` with `aria-label` on product cards and variant cards.
- `role="group"` with `aria-label="Product actions"` on CTA button groups.
- `role="img"` with `aria-label="Rating distribution"` on rating bar charts.
- `role="alert"` on error messages and validation summaries.
- `role="status"` on aria-live regions.
- `aria-live="polite"` and `aria-live="assertive"` regions for dynamic announcements.
- `aria-expanded`, `aria-controls`, `aria-pressed`, `aria-current="page"`, `aria-required`, `aria-invalid`, `aria-describedby` attributes throughout.
- `AriaLiveRegion` component for screen reader announcements with auto-clear and re-announce support.
- `useAccessibility` hook providing `trapFocus`, `restoreFocus`, `announceToScreenReader`, `skipToContent`, `handleKeyboardNav`, and `getFocusableElements`.
- Focus management: focus trap in mobile navigation menu, focus restoration on menu close, auto-focus on 404 page heading.
- Keyboard navigation: Tab cycling in focus traps, Enter/Space activation on cards, Escape to close mobile menu, Arrow key navigation in gallery grid.
- All interactive elements have visible focus indicators (`focus-visible:outline-2 focus-visible:outline-offset-2`).
- All images have descriptive `alt` text.
- All form controls have associated `<label>` elements or `aria-label` attributes.
- Color contrast compliant with WCAG 2.1 AA using Tailwind neutral, primary, and accent color scales.

#### Error Handling
- `ErrorBoundary` class component catching rendering errors with fallback UI, stack trace display (development only), reset button, and try-again button.
- 404 `NotFoundPage` with CTA links to Cohort Intake, Catalog, Gallery, and Home.
- Product Not Found state on PDP page with Back to Catalog link.
- Variant Not Found state on detail page with Back to Gallery and Go to Cohort Intake links.
- Empty state on Gallery page with Go to Cohort Intake and View Catalog buttons.
- Empty state on Catalog page with Reset Catalog button.
- `StorageBanner` dismissible warning when localStorage is unavailable and sessionStorage fallback is active.
- Graceful handling of corrupted localStorage data with automatic recovery and re-seeding.
- Schema validation at all persistence boundaries (catalog load, cohort set save, variant generation, manifest build, manifest export).
- Per-field validation errors on cohort target forms with inline error messages.
- Validation summary with error count on cohort intake panel.
- Export error display with retry button on variant detail and bulk export.
- Generation error display with retry button on cohorts page.

#### Persistence
- `persistenceManager` service abstracting localStorage with automatic sessionStorage fallback.
- `save`, `load`, `remove`, `reset` operations with structured return values.
- `saveSync` and `loadSync` convenience methods.
- `isLocalStorageAvailable` and `getIsFallbackMode` detection functions.
- Quota exceeded handling with automatic fallback to sessionStorage.
- Corrupted data detection and removal on load.
- Namespace-scoped key cleanup on reset (`prism_` prefix).
- Storage keys: `prism_catalog`, `prism_cohort_sets`, `prism_variants`, `prism_manifests`.

#### Observability
- `observabilityEmitter` simulated Dynatrace/Splunk-style event emitter.
- 5 event types: `PDP_LOAD`, `COHORT_CONFIG`, `VARIANT_GENERATED`, `EXPORT_ACTION`, `ERROR`.
- In-memory event buffer with 500-event capacity and FIFO eviction.
- Monotonically increasing sequence counter for event ordering.
- Structured console logging (`console.warn` for info events, `console.error` for error events).
- `subscribe` / `unsubscribe` listener registration.
- `getEventBuffer`, `getEventsByType`, `getEventCount` query functions.
- `clearEventBuffer`, `clearListeners`, `resetEmitter` cleanup functions.
- Events emitted on: catalog load/reset, cohort set load/save/reset, variant generation start/complete/per-variant, manifest build/bulk build, manifest export/bulk export, validation failures, rendering errors, navigation to 404.

#### Application State
- `AppContext` React Context provider managing catalog, cohortSet, variants, manifests, diffToggle, isFallbackMode, isLoading, and error state.
- `useAppContext` hook with provider boundary check.
- Automatic initialization from persistence on mount.
- `setCatalog`, `setCohortSet`, `setVariants`, `setManifests` actions with persistence.
- `toggleDiff` action for gallery diff highlighting.
- `resetAll` action clearing all state and re-seeding defaults.

#### Routing
- React Router v6 with `createBrowserRouter` and `RouterProvider`.
- Lazy-loaded page components with `Suspense` fallbacks using `SkeletonLoader`.
- Routes: `/` (redirect to `/cohorts`), `/catalog`, `/catalog/:productId`, `/pdp/:sku`, `/cohorts`, `/cohorts/:cohortId`, `/variants`, `/variants/:variantId`, `*` (404).
- `Layout` component with `SkipToContent`, `Header`, `StorageBanner`, main content `Outlet`, `AriaLiveRegion`, and `Footer`.
- `Header` with responsive navigation (desktop inline links, mobile hamburger menu with focus trap).
- `Footer` with brand info, version badge, demo date, and disclaimer.
- Active route highlighting with `aria-current="page"`.
- Vercel SPA rewrite rules in `vercel.json`.

#### UI Components
- `SkeletonLoader` with rectangle, circle, text, and text-sm shapes, shimmer animation, and configurable dimensions.
- Custom Tailwind animations: `fade-in`, `fade-out`, `slide-up`, `slide-down`, `scale-in`, `skeleton-shimmer`.
- Inter font for body text, JetBrains Mono for code and monospace elements.
- Best Buy-inspired color palette: primary blue (#0046BE), accent yellow (#FFF200), neutral slate scale.

#### CI/CD Pipeline
- GitHub Actions workflow (`.github/workflows/ci.yml`) with 5 jobs: Install, Lint, Test, Build, E2E.
- Node.js 20 with npm caching.
- ESLint with `eslint-plugin-react`, `eslint-plugin-react-hooks`, and `eslint-plugin-jsx-a11y`.
- Vitest unit tests with jsdom environment.
- Vite production build with artifact upload.
- Playwright E2E tests against dev server (Chromium in CI).
- Build manifests artifact with `build-info.json`.

#### Testing
- Unit tests for schemas (`validateCatalogItem`, `validateCohortTarget`, `validateCohortSet`, `validateVariant`, `validateManifest`).
- Unit tests for `catalogLoader` (seeding, caching, storage round-trip, schema validation, error handling).
- Unit tests for `diffEngine` (`computeDiff`, `computeSimpleDiff`, field-to-dimension mapping, rationale/weight extraction, edge cases).
- Unit tests for `manifestBuilder` (`buildManifest`, `buildBulkManifest`, `extractExportManifest`, `extractBulkExportManifests`).
- Unit tests for `manifestExporter` (`validateManifestForExport`, `exportManifest`, `exportBulk`, `exportVariantManifest`, `exportBulkVariantManifests`).
- Unit tests for `persistenceManager` (`save`, `load`, `remove`, `reset`, fallback mode, quota exceeded handling).
- Unit tests for `variantGenerator` (`generateVariants`, `generateVariantsForSku`, `generateVariantsForProduct`, tailoring rules application, determinism, observability events).
- Component tests for `CanonicalPdp` (all sections, all prop variations, accessibility landmarks, diff highlights, edge cases).
- Component tests for `CohortIntakePanel` (rendering, defaults, add/remove targets, batch count, validation, form submission, disabled state, accessibility).
- Component tests for `VariantDetailLayout` (split-pane layout, cohort profile, manifest viewer, action buttons, diff highlighting, not-found state, edge cases).
- Component tests for `VariantGalleryGrid` (rendering, empty state, loading state, diff toggle, variant cards, keyboard navigation, responsive grid, accessibility).
- E2E tests for full cohort intake → variant generation → gallery → detail → export flow.
- E2E tests for PDP rendering across all 6 products with accessibility landmark verification.
- E2E tests for error handling (404 pages, variant not found, product not found, reset functionality, storage fallback, navigation recovery, empty states).

#### Documentation
- `README.md` with project overview, features, tech stack, folder structure, getting started guide, architecture diagram, route table, and CI/CD description.
- `catalog-info.yaml` Backstage component descriptor.
- JSDoc comments on all service modules, hooks, components, and data files.