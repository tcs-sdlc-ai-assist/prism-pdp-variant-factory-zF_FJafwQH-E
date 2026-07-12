import { test, expect } from '@playwright/test';

test.describe('Gallery Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('full cohort intake → variant generation → gallery → detail → export flow', async ({ page }) => {
    // Should redirect to /cohorts from home
    await expect(page).toHaveURL(/\/cohorts/);

    // Verify cohort intake page renders
    await expect(page.getByRole('region', { name: /cohort intake/i })).toBeVisible();
    await expect(page.getByText('Cohort & Behaviour Intake')).toBeVisible();

    // Load default cohort targets
    const loadDefaultsButton = page.getByRole('button', { name: /load defaults/i });
    await expect(loadDefaultsButton).toBeVisible();
    await loadDefaultsButton.click();

    // Verify targets are loaded (should have multiple targets)
    const targetList = page.getByRole('list', { name: /cohort targets/i });
    await expect(targetList).toBeVisible();
    const targetItems = targetList.getByRole('listitem');
    await expect(targetItems).toHaveCount(10);

    // Verify the batch count input reflects 10 targets
    const batchInput = page.getByRole('spinbutton', { name: /number of cohort targets/i });
    await expect(batchInput).toHaveValue('10');

    // Click Generate button to generate variants
    const generateButton = page.getByRole('button', { name: /generate.*variant/i });
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toBeEnabled();
    await generateButton.click();

    // Wait for navigation to gallery page after generation completes
    await page.waitForURL(/\/variants/, { timeout: 15000 });
    await expect(page).toHaveURL(/\/variants/);

    // Verify gallery page renders with Variant Gallery heading
    await expect(page.getByText('Variant Gallery')).toBeVisible();

    // Verify gallery grid renders with 10 variant cards
    const galleryGrid = page.getByRole('grid', { name: /variant gallery grid/i });
    await expect(galleryGrid).toBeVisible({ timeout: 10000 });

    const gridCells = galleryGrid.getByRole('gridcell');
    await expect(gridCells).toHaveCount(10);

    // Verify each card is rendered as an article with accessible label
    const articles = page.getByRole('article');
    await expect(articles).toHaveCount(10);

    // Verify at least one card shows "Control" badge
    await expect(page.getByText('Control').first()).toBeVisible();

    // Verify "View Details" text appears on cards
    const viewDetailsLinks = page.getByText('View Details');
    await expect(viewDetailsLinks).toHaveCount(10);

    // Verify variant count badge
    await expect(page.getByText('10/10 variants')).toBeVisible();

    // Verify diff toggle is present and initially off
    const diffToggle = page.getByRole('switch');
    await expect(diffToggle).toBeVisible();
    await expect(diffToggle).toHaveAttribute('aria-checked', 'false');

    // Toggle diff highlighting on
    await diffToggle.click();
    await expect(diffToggle).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByText('On')).toBeVisible();
    await expect(page.getByText(/diff highlighting enabled/i)).toBeVisible();

    // Toggle diff highlighting off
    await diffToggle.click();
    await expect(diffToggle).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByText('Off')).toBeVisible();

    // Click the second variant card (non-control) to navigate to detail view
    const secondCard = articles.nth(1);
    await secondCard.click();

    // Wait for navigation to variant detail page
    await page.waitForURL(/\/variants\/variant-/, { timeout: 10000 });

    // Verify variant detail page renders
    const detailRegion = page.getByRole('region', { name: /variant detail/i });
    await expect(detailRegion).toBeVisible({ timeout: 10000 });

    // Verify variant actions toolbar is present
    const toolbar = page.getByRole('toolbar', { name: /variant actions/i });
    await expect(toolbar).toBeVisible();

    // Verify Back to Gallery button is present
    const backButton = page.getByRole('button', { name: /back to variant gallery/i });
    await expect(backButton).toBeVisible();

    // Verify View Diff button is present
    const viewDiffButton = page.getByRole('button', { name: /enable diff highlighting/i });
    await expect(viewDiffButton).toBeVisible();

    // Verify Package Variant button is present
    const packageButton = page.getByRole('button', { name: /package variant manifest/i });
    await expect(packageButton).toBeVisible();

    // Verify cohort profile panel renders
    const cohortPanel = page.getByRole('complementary', { name: /cohort profile/i });
    await expect(cohortPanel).toBeVisible();
    await expect(page.getByText('Cohort Profile')).toBeVisible();

    // Verify cohort profile sections
    await expect(page.getByText('Cohort Type')).toBeVisible();
    await expect(page.getByText('Behavioral Overlay')).toBeVisible();
    await expect(page.getByText('Base SKU')).toBeVisible();

    // Verify manifest viewer renders
    const manifestViewer = page.getByRole('complementary', { name: /manifest/i });
    await expect(manifestViewer).toBeVisible();
    await expect(page.getByText('Variant Manifest')).toBeVisible();

    // Verify manifest JSON content is visible
    const manifestContent = page.getByLabel('Manifest JSON content');
    await expect(manifestContent).toBeVisible();

    // Verify Copy button in manifest viewer
    const copyButton = page.getByRole('button', { name: /copy manifest json/i });
    await expect(copyButton).toBeVisible();

    // Verify product hero section renders in the PDP
    const heroRegion = page.getByRole('region', { name: /product hero/i });
    await expect(heroRegion).toBeVisible();

    // Verify product pricing section renders
    const pricingRegion = page.getByRole('region', { name: /product pricing/i });
    await expect(pricingRegion).toBeVisible();

    // Verify specifications section renders
    await expect(page.getByText('Specifications')).toBeVisible();

    // Verify customer reviews section renders
    await expect(page.getByText('Customer Reviews')).toBeVisible();

    // Toggle diff highlighting on from detail view
    await viewDiffButton.click();
    const diffOnButton = page.getByRole('button', { name: /disable diff highlighting/i });
    await expect(diffOnButton).toBeVisible();
    await expect(page.getByText('Diff On')).toBeVisible();

    // Toggle diff highlighting off
    await diffOnButton.click();
    await expect(page.getByText('View Diff')).toBeVisible();

    // Click Package Variant to export manifest
    await packageButton.click();

    // Verify export feedback (button should show success state)
    await expect(page.getByRole('button', { name: /manifest exported/i })).toBeVisible({ timeout: 5000 });

    // Navigate back to gallery
    await backButton.click();
    await page.waitForURL(/\/variants$/, { timeout: 10000 });

    // Verify gallery is still showing 10 cards
    await expect(page.getByRole('grid', { name: /variant gallery grid/i })).toBeVisible();
    const gridCellsAfterReturn = page.getByRole('grid', { name: /variant gallery grid/i }).getByRole('gridcell');
    await expect(gridCellsAfterReturn).toHaveCount(10);
  });

  test('navigates to gallery with no variants and shows empty state', async ({ page }) => {
    // Navigate directly to gallery without generating variants
    await page.goto('/variants');

    // Verify empty state is shown
    await expect(page.getByText('No Variants Generated')).toBeVisible();
    await expect(page.getByText(/configure cohort targets and generate/i)).toBeVisible();

    // Verify CTA to go to cohort intake is present
    const cohortIntakeButton = page.getByRole('link', { name: /go to cohort intake/i });
    await expect(cohortIntakeButton).toBeVisible();

    // Click to navigate to cohort intake
    await cohortIntakeButton.click();
    await page.waitForURL(/\/cohorts/, { timeout: 10000 });
    await expect(page.getByText('Cohort & Behaviour Intake')).toBeVisible();
  });

  test('gallery bulk export button works with generated variants', async ({ page }) => {
    // Navigate to cohorts and generate variants
    await page.goto('/cohorts');
    await expect(page.getByText('Cohort & Behaviour Intake')).toBeVisible();

    // Load defaults and generate
    await page.getByRole('button', { name: /load defaults/i }).click();
    await page.getByRole('button', { name: /generate.*variant/i }).click();

    // Wait for gallery
    await page.waitForURL(/\/variants/, { timeout: 15000 });
    await expect(page.getByRole('grid', { name: /variant gallery grid/i })).toBeVisible({ timeout: 10000 });

    // Find and click the bulk export button
    const exportButton = page.getByRole('button', { name: /export all/i });
    await expect(exportButton).toBeVisible();
    await exportButton.click();

    // Verify export success feedback
    await expect(page.getByRole('button', { name: /exported.*manifest/i })).toBeVisible({ timeout: 5000 });
  });

  test('variant detail page shows 404 for non-existent variant', async ({ page }) => {
    await page.goto('/variants/nonexistent-variant-id');

    // Verify not found state
    await expect(page.getByText('Variant Not Found')).toBeVisible();
    await expect(page.getByText(/nonexistent-variant-id/i)).toBeVisible();

    // Verify navigation links are present
    const backToGalleryLink = page.getByRole('link', { name: /back to gallery/i });
    await expect(backToGalleryLink).toBeVisible();

    const cohortIntakeLink = page.getByRole('link', { name: /go to cohort intake/i });
    await expect(cohortIntakeLink).toBeVisible();
  });

  test('cohort intake clear all and add targets works correctly', async ({ page }) => {
    await page.goto('/cohorts');
    await expect(page.getByText('Cohort & Behaviour Intake')).toBeVisible();

    // Load defaults first
    await page.getByRole('button', { name: /load defaults/i }).click();

    // Clear all targets
    const clearButton = page.getByRole('button', { name: /clear all/i });
    await clearButton.click();

    // Should have exactly 1 target after clearing
    const targetList = page.getByRole('list', { name: /cohort targets/i });
    const targetItems = targetList.getByRole('listitem');
    await expect(targetItems).toHaveCount(1);

    // Add more targets
    const addButton = page.getByRole('button', { name: /add cohort target/i });
    await addButton.click();
    await addButton.click();

    // Should now have 3 targets
    await expect(targetItems).toHaveCount(3);

    // Verify batch count input reflects 3
    const batchInput = page.getByRole('spinbutton', { name: /number of cohort targets/i });
    await expect(batchInput).toHaveValue('3');
  });

  test('diff toggle in gallery updates card display', async ({ page }) => {
    // Navigate to cohorts and generate variants
    await page.goto('/cohorts');
    await page.getByRole('button', { name: /load defaults/i }).click();
    await page.getByRole('button', { name: /generate.*variant/i }).click();

    // Wait for gallery
    await page.waitForURL(/\/variants/, { timeout: 15000 });
    await expect(page.getByRole('grid', { name: /variant gallery grid/i })).toBeVisible({ timeout: 10000 });

    // Verify diff toggle label
    await expect(page.getByText('Diff Highlighting')).toBeVisible();
    await expect(page.getByText('Diff overlay is off')).toBeVisible();

    // Enable diff toggle
    const diffToggle = page.getByRole('switch');
    await diffToggle.click();

    // Verify diff is enabled
    await expect(diffToggle).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByText('Showing changes from control variant')).toBeVisible();
    await expect(page.getByText(/diff highlighting enabled/i)).toBeVisible();
    await expect(page.getByText(/diff from control enabled/i)).toBeVisible();
  });
});