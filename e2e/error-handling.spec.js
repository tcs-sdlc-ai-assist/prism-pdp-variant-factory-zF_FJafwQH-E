import { test, expect } from '@playwright/test';

test.describe('Error Handling E2E', () => {
  test.describe('404 Page Rendering', () => {
    test('renders 404 page for invalid route', async ({ page }) => {
      await page.goto('/some-nonexistent-route');

      // Verify 404 page renders
      await expect(page.getByText('Page Not Found')).toBeVisible();
      await expect(page.getByText('404')).toBeVisible();

      // Verify description text
      await expect(
        page.getByText(/the page you're looking for doesn't exist/i),
      ).toBeVisible();
    });

    test('renders 404 page for deeply nested invalid route', async ({ page }) => {
      await page.goto('/foo/bar/baz/qux');

      await expect(page.getByText('Page Not Found')).toBeVisible();
      await expect(page.getByText('404')).toBeVisible();
    });

    test('404 page has Back to Cohort Intake CTA', async ({ page }) => {
      await page.goto('/invalid-page');

      await expect(page.getByText('Page Not Found')).toBeVisible();

      // Verify Go to Cohort Intake button is present
      const cohortIntakeLink = page.getByRole('link', { name: /go to cohort intake/i });
      await expect(cohortIntakeLink).toBeVisible();
    });

    test('clicking Back to Cohort Intake CTA navigates to /cohorts', async ({ page }) => {
      await page.goto('/invalid-page');

      await expect(page.getByText('Page Not Found')).toBeVisible();

      const cohortIntakeLink = page.getByRole('link', { name: /go to cohort intake/i });
      await cohortIntakeLink.click();

      await page.waitForURL(/\/cohorts/, { timeout: 10000 });
      await expect(page.getByText('Cohort & Behaviour Intake')).toBeVisible();
    });

    test('404 page has View Catalog CTA that navigates to /catalog', async ({ page }) => {
      await page.goto('/nonexistent');

      await expect(page.getByText('Page Not Found')).toBeVisible();

      const catalogLink = page.getByRole('link', { name: /view catalog/i });
      await expect(catalogLink).toBeVisible();

      await catalogLink.click();

      await page.waitForURL(/\/catalog/, { timeout: 10000 });
      await expect(page.getByText('Product Catalog')).toBeVisible();
    });

    test('404 page has View Gallery CTA that navigates to /variants', async ({ page }) => {
      await page.goto('/nonexistent');

      await expect(page.getByText('Page Not Found')).toBeVisible();

      const galleryLink = page.getByRole('link', { name: /view gallery/i });
      await expect(galleryLink).toBeVisible();

      await galleryLink.click();

      await page.waitForURL(/\/variants/, { timeout: 10000 });
      await expect(page.getByText('Variant Gallery')).toBeVisible();
    });

    test('404 page has Back to Home link', async ({ page }) => {
      await page.goto('/nonexistent');

      await expect(page.getByText('Page Not Found')).toBeVisible();

      const homeLink = page.getByRole('link', { name: /back to home/i });
      await expect(homeLink).toBeVisible();

      await homeLink.click();

      // Home redirects to /cohorts
      await page.waitForURL(/\/cohorts/, { timeout: 10000 });
      await expect(page.getByText('Cohort & Behaviour Intake')).toBeVisible();
    });

    test('404 page has accessible region landmark', async ({ page }) => {
      await page.goto('/nonexistent');

      const region = page.getByRole('region', { name: /page not found/i });
      await expect(region).toBeVisible();
    });

    test('404 page has footer with guidance text', async ({ page }) => {
      await page.goto('/nonexistent');

      await expect(page.getByText('Page Not Found')).toBeVisible();
      await expect(
        page.getByText(/the requested page could not be found/i),
      ).toBeVisible();
    });
  });

  test.describe('Variant Not Found', () => {
    test('shows variant not found for non-existent variant ID', async ({ page }) => {
      await page.goto('/variants/nonexistent-variant-id');

      await expect(page.getByText('Variant Not Found')).toBeVisible();
      await expect(page.getByText(/nonexistent-variant-id/i)).toBeVisible();

      // Verify navigation links
      const backToGalleryLink = page.getByRole('link', { name: /back to gallery/i });
      await expect(backToGalleryLink).toBeVisible();

      const cohortIntakeLink = page.getByRole('link', { name: /go to cohort intake/i });
      await expect(cohortIntakeLink).toBeVisible();
    });

    test('variant not found Back to Gallery link navigates correctly', async ({ page }) => {
      await page.goto('/variants/does-not-exist');

      await expect(page.getByText('Variant Not Found')).toBeVisible();

      const backToGalleryLink = page.getByRole('link', { name: /back to gallery/i });
      await backToGalleryLink.click();

      await page.waitForURL(/\/variants$/, { timeout: 10000 });
      await expect(page.getByText('Variant Gallery')).toBeVisible();
    });

    test('variant not found Go to Cohort Intake link navigates correctly', async ({ page }) => {
      await page.goto('/variants/does-not-exist');

      await expect(page.getByText('Variant Not Found')).toBeVisible();

      const cohortIntakeLink = page.getByRole('link', { name: /go to cohort intake/i });
      await cohortIntakeLink.click();

      await page.waitForURL(/\/cohorts/, { timeout: 10000 });
      await expect(page.getByText('Cohort & Behaviour Intake')).toBeVisible();
    });
  });

  test.describe('Product Not Found', () => {
    test('shows product not found for non-existent product ID', async ({ page }) => {
      await page.goto('/catalog/prod-nonexistent');

      await expect(page.getByText('Product Not Found')).toBeVisible();
      await expect(page.getByText(/prod-nonexistent/i)).toBeVisible();

      const backLink = page.getByRole('link', { name: /back to catalog/i });
      await expect(backLink).toBeVisible();
    });

    test('product not found Back to Catalog link navigates correctly', async ({ page }) => {
      await page.goto('/catalog/prod-does-not-exist');

      await expect(page.getByText('Product Not Found')).toBeVisible();

      const backLink = page.getByRole('link', { name: /back to catalog/i });
      await backLink.click();

      await page.waitForURL(/\/catalog$/, { timeout: 10000 });
      await expect(page.getByText('Product Catalog')).toBeVisible();
    });
  });

  test.describe('Reset to Default Functionality', () => {
    test('catalog reset button restores default products', async ({ page }) => {
      await page.goto('/catalog');

      await expect(page.getByRole('region', { name: /product catalog/i })).toBeVisible();
      await expect(page.getByText('6 products')).toBeVisible();

      // Click reset catalog button
      const resetButton = page.getByRole('button', { name: /reset catalog/i });
      await expect(resetButton).toBeVisible();
      await resetButton.click();

      // Verify catalog still has 6 products after reset
      await expect(page.getByText('6 products')).toBeVisible();
      const articles = page.getByRole('article');
      await expect(articles).toHaveCount(6);
    });

    test('cohort intake load defaults restores default cohort targets', async ({ page }) => {
      await page.goto('/cohorts');

      await expect(page.getByText('Cohort & Behaviour Intake')).toBeVisible();

      // Clear all targets first
      const clearButton = page.getByRole('button', { name: /clear all/i });
      await clearButton.click();

      const targetList = page.getByRole('list', { name: /cohort targets/i });
      const targetItems = targetList.getByRole('listitem');
      await expect(targetItems).toHaveCount(1);

      // Load defaults
      const loadDefaultsButton = page.getByRole('button', { name: /load defaults/i });
      await loadDefaultsButton.click();

      // Verify targets are restored
      await expect(targetItems).toHaveCount(10);

      // Verify batch count input reflects 10 targets
      const batchInput = page.getByRole('spinbutton', { name: /number of cohort targets/i });
      await expect(batchInput).toHaveValue('10');
    });

    test('cohort intake clear all and load defaults cycle works correctly', async ({ page }) => {
      await page.goto('/cohorts');

      await expect(page.getByText('Cohort & Behaviour Intake')).toBeVisible();

      // Load defaults
      await page.getByRole('button', { name: /load defaults/i }).click();

      const targetList = page.getByRole('list', { name: /cohort targets/i });
      const targetItems = targetList.getByRole('listitem');
      await expect(targetItems).toHaveCount(10);

      // Clear all
      await page.getByRole('button', { name: /clear all/i }).click();
      await expect(targetItems).toHaveCount(1);

      // Load defaults again
      await page.getByRole('button', { name: /load defaults/i }).click();
      await expect(targetItems).toHaveCount(10);

      // Clear all again
      await page.getByRole('button', { name: /clear all/i }).click();
      await expect(targetItems).toHaveCount(1);
    });

    test('generate button is disabled after clearing all targets with empty fields', async ({ page }) => {
      await page.goto('/cohorts');

      await expect(page.getByText('Cohort & Behaviour Intake')).toBeVisible();

      // Clear all targets
      await page.getByRole('button', { name: /clear all/i }).click();

      const targetList = page.getByRole('list', { name: /cohort targets/i });
      const targetItems = targetList.getByRole('listitem');
      await expect(targetItems).toHaveCount(1);

      // Try to generate with empty target
      const generateButton = page.getByRole('button', { name: /generate.*variant/i });
      await generateButton.click();

      // After clicking generate with invalid data, button should be disabled
      await expect(generateButton).toBeDisabled();

      // Verify validation errors appear
      await expect(page.getByText(/with errors/i)).toBeVisible();
    });
  });

  test.describe('Storage Fallback Warning Banner', () => {
    test('storage banner is not visible when localStorage is available', async ({ page }) => {
      await page.goto('/cohorts');

      await expect(page.getByText('Cohort & Behaviour Intake')).toBeVisible();

      // The storage banner should NOT be visible when localStorage works normally
      const storageBanner = page.getByText(/localStorage is unavailable/i);
      await expect(storageBanner).not.toBeVisible();
    });

    test('application loads correctly without storage banner in normal mode', async ({ page }) => {
      await page.goto('/');

      // Should redirect to /cohorts
      await expect(page).toHaveURL(/\/cohorts/);
      await expect(page.getByText('Cohort & Behaviour Intake')).toBeVisible();

      // Verify no storage warning is shown
      const storageBanner = page.getByText(/will not persist/i);
      await expect(storageBanner).not.toBeVisible();
    });
  });

  test.describe('Navigation Error Recovery', () => {
    test('navigating from 404 to valid routes works correctly', async ({ page }) => {
      // Start at invalid route
      await page.goto('/invalid-route');
      await expect(page.getByText('Page Not Found')).toBeVisible();

      // Navigate to catalog via header nav
      const catalogNav = page.getByRole('link', { name: 'Catalog' });
      await catalogNav.click();
      await page.waitForURL(/\/catalog/, { timeout: 10000 });
      await expect(page.getByText('Product Catalog')).toBeVisible();

      // Navigate to cohorts via header nav
      const cohortsNav = page.getByRole('link', { name: 'Cohorts' });
      await cohortsNav.click();
      await page.waitForURL(/\/cohorts/, { timeout: 10000 });
      await expect(page.getByText('Cohort & Behaviour Intake')).toBeVisible();

      // Navigate to gallery via header nav
      const galleryNav = page.getByRole('link', { name: 'Gallery' });
      await galleryNav.click();
      await page.waitForURL(/\/variants/, { timeout: 10000 });
      await expect(page.getByText('Variant Gallery')).toBeVisible();
    });

    test('header navigation is present on 404 page', async ({ page }) => {
      await page.goto('/nonexistent-page');

      await expect(page.getByText('Page Not Found')).toBeVisible();

      // Verify primary navigation is present
      const primaryNav = page.getByRole('navigation', { name: /primary navigation/i });
      await expect(primaryNav).toBeVisible();

      // Verify nav links are present
      await expect(primaryNav.getByText('Catalog')).toBeVisible();
      await expect(primaryNav.getByText('Cohorts')).toBeVisible();
      await expect(primaryNav.getByText('Gallery')).toBeVisible();
    });

    test('footer is present on 404 page', async ({ page }) => {
      await page.goto('/nonexistent-page');

      await expect(page.getByText('Page Not Found')).toBeVisible();

      const footer = page.getByRole('contentinfo');
      await expect(footer).toBeVisible();

      await expect(footer.getByText('Prism PDP Variant Factory')).toBeVisible();
    });

    test('main content landmark is present on 404 page', async ({ page }) => {
      await page.goto('/nonexistent-page');

      const main = page.getByRole('main');
      await expect(main).toBeVisible();
    });
  });

  test.describe('Empty State Handling', () => {
    test('gallery shows empty state with CTA when no variants exist', async ({ page }) => {
      await page.goto('/variants');

      await expect(page.getByText('No Variants Generated')).toBeVisible();
      await expect(
        page.getByText(/configure cohort targets and generate/i),
      ).toBeVisible();

      // Verify CTA to go to cohort intake
      const cohortIntakeButton = page.getByRole('button', { name: /go to cohort intake/i });
      await expect(cohortIntakeButton).toBeVisible();
    });

    test('gallery empty state Go to Cohort Intake navigates correctly', async ({ page }) => {
      await page.goto('/variants');

      await expect(page.getByText('No Variants Generated')).toBeVisible();

      const cohortIntakeButton = page.getByRole('button', { name: /go to cohort intake/i });
      await cohortIntakeButton.click();

      await page.waitForURL(/\/cohorts/, { timeout: 10000 });
      await expect(page.getByText('Cohort & Behaviour Intake')).toBeVisible();
    });

    test('gallery empty state has View Catalog button', async ({ page }) => {
      await page.goto('/variants');

      await expect(page.getByText('No Variants Generated')).toBeVisible();

      const viewCatalogButton = page.getByRole('button', { name: /view catalog/i });
      await expect(viewCatalogButton).toBeVisible();

      await viewCatalogButton.click();

      await page.waitForURL(/\/catalog/, { timeout: 10000 });
      await expect(page.getByText('Product Catalog')).toBeVisible();
    });
  });
});