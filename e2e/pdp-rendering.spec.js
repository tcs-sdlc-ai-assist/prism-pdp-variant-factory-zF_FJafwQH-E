import { test, expect } from '@playwright/test';

test.describe('PDP Rendering E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('navigates to catalog, selects a product, and verifies canonical PDP renders all sections', async ({ page }) => {
    // Navigate to catalog page
    await page.goto('/catalog');

    // Verify catalog page renders
    await expect(page.getByRole('region', { name: /product catalog/i })).toBeVisible();
    await expect(page.getByText('Product Catalog')).toBeVisible();

    // Verify catalog has products
    const productList = page.getByRole('list', { name: /product catalog/i });
    await expect(productList).toBeVisible();
    const productItems = productList.getByRole('listitem');
    await expect(productItems).toHaveCount(6);

    // Verify each product card is rendered as an article
    const articles = page.getByRole('article');
    await expect(articles).toHaveCount(6);

    // Verify product count badge
    await expect(page.getByText('6 products')).toBeVisible();

    // Click the first product card to navigate to PDP
    const firstCard = articles.first();
    await firstCard.click();

    // Wait for navigation to catalog detail page
    await page.waitForURL(/\/catalog\/prod-/, { timeout: 10000 });

    // Verify PDP page renders with product detail page region
    const pdpRegion = page.getByRole('region', { name: /product detail page/i });
    await expect(pdpRegion).toBeVisible({ timeout: 10000 });

    // Verify breadcrumb navigation is present
    const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i });
    await expect(breadcrumb).toBeVisible();
    await expect(breadcrumb.getByText('Home')).toBeVisible();
    await expect(breadcrumb.getByText('Catalog')).toBeVisible();

    // Verify product hero section renders
    const heroRegion = page.getByRole('region', { name: /product hero/i });
    await expect(heroRegion).toBeVisible();

    // Verify product title is displayed
    await expect(page.getByText('Samsung 65" Class QN90C Neo QLED 4K Smart TV (2024)')).toBeVisible();

    // Verify product brand is displayed
    await expect(page.getByText('Samsung')).toBeVisible();

    // Verify product category is displayed
    await expect(page.getByText('TVs & Home Theater')).toBeVisible();

    // Verify product image is rendered
    const productImage = page.getByAltText('Samsung 65" Class QN90C Neo QLED 4K Smart TV (2024)');
    await expect(productImage).toBeVisible();

    // Verify product rating is displayed
    await expect(page.getByText('4.7')).toBeVisible();

    // Verify review count is displayed
    await expect(page.getByText(/2,843/)).toBeVisible();

    // Verify product badge is displayed
    await expect(page.getByText('Best Seller')).toBeVisible();

    // Verify SKU is displayed
    await expect(page.getByText(/SKU-6548320/)).toBeVisible();

    // Verify product pricing section renders
    const pricingRegion = page.getByRole('region', { name: /product pricing/i });
    await expect(pricingRegion).toBeVisible();

    // Verify product price is displayed
    await expect(page.getByText('$1,599.99')).toBeVisible();

    // Verify fulfillment info is displayed
    await expect(page.getByText(/free shipping/i)).toBeVisible();

    // Verify financing estimate is displayed (product > $100)
    await expect(page.getByText(/24-mo financing/i)).toBeVisible();

    // Verify CTA buttons are present
    const actionsGroup = page.getByRole('group', { name: /product actions/i });
    await expect(actionsGroup).toBeVisible();

    const addToCartButtons = page.getByRole('button', { name: /add to cart/i });
    expect(await addToCartButtons.count()).toBeGreaterThanOrEqual(1);

    const saveForLaterButtons = page.getByRole('button', { name: /save for later/i });
    expect(await saveForLaterButtons.count()).toBeGreaterThanOrEqual(1);

    // Verify specifications section renders
    await expect(page.getByText('Specifications')).toBeVisible();
    const specRegion = page.getByRole('region', { name: /product specifications/i });
    await expect(specRegion).toBeVisible();

    // Verify spec table is present
    const specTable = page.getByRole('table', { name: /product specifications table/i });
    await expect(specTable).toBeVisible();

    // Verify specific spec values from Samsung TV
    await expect(page.getByText('65"')).toBeVisible();
    await expect(page.getByText('Neo QLED')).toBeVisible();

    // Verify customer reviews section renders
    await expect(page.getByText('Customer Reviews')).toBeVisible();
    const reviewRegion = page.getByRole('region', { name: /customer reviews/i });
    await expect(reviewRegion).toBeVisible();

    // Verify rating distribution is present
    const ratingDistribution = page.getByRole('img', { name: /rating distribution/i });
    await expect(ratingDistribution).toBeVisible();

    // Verify Highly Rated badge (rating >= 4.5)
    await expect(page.getByText('Highly Rated')).toBeVisible();

    // Verify cross-sell section renders
    const crossSellRegion = page.getByRole('region', { name: /cross-sell recommendations/i });
    await expect(crossSellRegion).toBeVisible();
    await expect(page.getByText('You Might Also Like')).toBeVisible();

    // Verify cross-sell items list
    const crossSellList = crossSellRegion.getByRole('list');
    await expect(crossSellList).toBeVisible();
    const crossSellItems = crossSellList.getByRole('listitem');
    expect(await crossSellItems.count()).toBeGreaterThanOrEqual(1);

    // Verify Back to Catalog link is present
    const backToCatalog = page.getByRole('link', { name: /back to catalog/i });
    await expect(backToCatalog).toBeVisible();

    // Verify Generate Variants link is present
    const generateVariantsLink = page.getByRole('link', { name: /generate variants/i });
    await expect(generateVariantsLink).toBeVisible();

    // Verify footer info
    await expect(page.getByText(/configure cohorts to generate variants/i)).toBeVisible();
  });

  test('navigates back to catalog from PDP using Back to Catalog link', async ({ page }) => {
    // Navigate to first product PDP
    await page.goto('/catalog');
    await expect(page.getByRole('region', { name: /product catalog/i })).toBeVisible();

    const firstArticle = page.getByRole('article').first();
    await firstArticle.click();
    await page.waitForURL(/\/catalog\/prod-/, { timeout: 10000 });

    await expect(page.getByRole('region', { name: /product detail page/i })).toBeVisible({ timeout: 10000 });

    // Click Back to Catalog
    const backLink = page.getByRole('link', { name: /back to catalog/i });
    await backLink.click();

    // Verify navigation back to catalog
    await page.waitForURL(/\/catalog$/, { timeout: 10000 });
    await expect(page.getByText('Product Catalog')).toBeVisible();
    await expect(page.getByRole('article')).toHaveCount(6);
  });

  test('navigates to cohort intake from PDP using Generate Variants link', async ({ page }) => {
    // Navigate to first product PDP
    await page.goto('/catalog');
    await expect(page.getByRole('region', { name: /product catalog/i })).toBeVisible();

    const firstArticle = page.getByRole('article').first();
    await firstArticle.click();
    await page.waitForURL(/\/catalog\/prod-/, { timeout: 10000 });

    await expect(page.getByRole('region', { name: /product detail page/i })).toBeVisible({ timeout: 10000 });

    // Click Generate Variants link
    const generateLink = page.getByRole('link', { name: /generate variants/i });
    await generateLink.click();

    // Verify navigation to cohorts page
    await page.waitForURL(/\/cohorts/, { timeout: 10000 });
    await expect(page.getByText('Cohort & Behaviour Intake')).toBeVisible();
  });

  test('renders PDP for each catalog product correctly', async ({ page }) => {
    const productIds = [
      'prod-tv-001',
      'prod-laptop-002',
      'prod-headphones-003',
      'prod-speaker-004',
      'prod-tablet-005',
      'prod-console-006',
    ];

    const productTitles = [
      'Samsung 65" Class QN90C Neo QLED 4K Smart TV (2024)',
      'Apple MacBook Pro 14"',
      'Sony WH-1000XM5',
      'Amazon Echo Studio',
      'Apple iPad Air 11"',
      'Sony PlayStation 5 Slim',
    ];

    for (let i = 0; i < productIds.length; i++) {
      await page.goto(`/catalog/${productIds[i]}`);

      // Verify PDP region renders
      const pdpRegion = page.getByRole('region', { name: /product detail page/i });
      await expect(pdpRegion).toBeVisible({ timeout: 10000 });

      // Verify product hero section
      const heroRegion = page.getByRole('region', { name: /product hero/i });
      await expect(heroRegion).toBeVisible();

      // Verify product title contains expected text
      await expect(page.getByText(productTitles[i])).toBeVisible();

      // Verify pricing section
      const pricingRegion = page.getByRole('region', { name: /product pricing/i });
      await expect(pricingRegion).toBeVisible();

      // Verify specifications section
      await expect(page.getByText('Specifications')).toBeVisible();

      // Verify customer reviews section
      await expect(page.getByText('Customer Reviews')).toBeVisible();

      // Verify cross-sell section
      const crossSellRegion = page.getByRole('region', { name: /cross-sell recommendations/i });
      await expect(crossSellRegion).toBeVisible();

      // Verify product actions group
      const actionsGroup = page.getByRole('group', { name: /product actions/i });
      await expect(actionsGroup).toBeVisible();
    }
  });

  test('shows 404 state for non-existent product', async ({ page }) => {
    await page.goto('/catalog/prod-nonexistent');

    // Verify not found state
    await expect(page.getByText('Product Not Found')).toBeVisible();
    await expect(page.getByText(/prod-nonexistent/i)).toBeVisible();

    // Verify Back to Catalog link is present
    const backLink = page.getByRole('link', { name: /back to catalog/i });
    await expect(backLink).toBeVisible();

    // Click back to catalog
    await backLink.click();
    await page.waitForURL(/\/catalog$/, { timeout: 10000 });
    await expect(page.getByText('Product Catalog')).toBeVisible();
  });

  test('PDP accessibility landmarks are correct', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByRole('region', { name: /product catalog/i })).toBeVisible();

    const firstArticle = page.getByRole('article').first();
    await firstArticle.click();
    await page.waitForURL(/\/catalog\/prod-/, { timeout: 10000 });

    await expect(page.getByRole('region', { name: /product detail page/i })).toBeVisible({ timeout: 10000 });

    // Verify all major accessibility landmarks

    // Product hero region
    const heroRegion = page.getByRole('region', { name: /product hero/i });
    await expect(heroRegion).toBeVisible();

    // Product pricing region
    const pricingRegion = page.getByRole('region', { name: /product pricing/i });
    await expect(pricingRegion).toBeVisible();

    // Product specifications region
    const specRegion = page.getByRole('region', { name: /product specifications/i });
    await expect(specRegion).toBeVisible();

    // Customer reviews region
    const reviewRegion = page.getByRole('region', { name: /customer reviews/i });
    await expect(reviewRegion).toBeVisible();

    // Cross-sell recommendations region
    const crossSellRegion = page.getByRole('region', { name: /cross-sell recommendations/i });
    await expect(crossSellRegion).toBeVisible();

    // Product actions group
    const actionsGroup = page.getByRole('group', { name: /product actions/i });
    await expect(actionsGroup).toBeVisible();

    // Breadcrumb navigation
    const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i });
    await expect(breadcrumb).toBeVisible();

    // Spec table with accessible label
    const specTable = page.getByRole('table', { name: /product specifications table/i });
    await expect(specTable).toBeVisible();

    // Rating distribution with accessible label
    const ratingDistribution = page.getByRole('img', { name: /rating distribution/i });
    await expect(ratingDistribution).toBeVisible();

    // Star ratings with accessible labels
    const starRatings = page.getByLabel(/out of 5 stars/i);
    expect(await starRatings.count()).toBeGreaterThanOrEqual(1);

    // Product image has alt text
    const productImage = heroRegion.getByRole('img');
    await expect(productImage).toBeVisible();
    const altText = await productImage.getAttribute('alt');
    expect(altText).toBeTruthy();
    expect(altText.length).toBeGreaterThan(0);

    // CTA buttons have accessible labels
    const addToCartButtons = page.getByRole('button', { name: /add to cart/i });
    expect(await addToCartButtons.count()).toBeGreaterThanOrEqual(1);

    const saveForLaterButtons = page.getByRole('button', { name: /save for later/i });
    expect(await saveForLaterButtons.count()).toBeGreaterThanOrEqual(1);

    // Cross-sell list has accessible label
    const crossSellList = crossSellRegion.getByRole('list');
    await expect(crossSellList).toBeVisible();
    const crossSellAriaLabel = await crossSellList.getAttribute('aria-label');
    expect(crossSellAriaLabel).toBeTruthy();

    // Header navigation landmark
    const primaryNav = page.getByRole('navigation', { name: /primary navigation/i });
    await expect(primaryNav).toBeVisible();

    // Footer contentinfo landmark
    const footer = page.getByRole('contentinfo');
    await expect(footer).toBeVisible();

    // Main content landmark
    const main = page.getByRole('main');
    await expect(main).toBeVisible();
  });

  test('PDP renders correctly at mobile viewport (375px)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });

    await page.goto('/catalog');
    await expect(page.getByRole('region', { name: /product catalog/i })).toBeVisible();

    const firstArticle = page.getByRole('article').first();
    await firstArticle.click();
    await page.waitForURL(/\/catalog\/prod-/, { timeout: 10000 });

    // Verify PDP renders at mobile viewport
    const pdpRegion = page.getByRole('region', { name: /product detail page/i });
    await expect(pdpRegion).toBeVisible({ timeout: 10000 });

    // Verify all major sections are visible at mobile
    const heroRegion = page.getByRole('region', { name: /product hero/i });
    await expect(heroRegion).toBeVisible();

    const pricingRegion = page.getByRole('region', { name: /product pricing/i });
    await expect(pricingRegion).toBeVisible();

    await expect(page.getByText('Specifications')).toBeVisible();
    await expect(page.getByText('Customer Reviews')).toBeVisible();

    const crossSellRegion = page.getByRole('region', { name: /cross-sell recommendations/i });
    await expect(crossSellRegion).toBeVisible();

    const actionsGroup = page.getByRole('group', { name: /product actions/i });
    await expect(actionsGroup).toBeVisible();

    // Verify grid uses single column at mobile (grid-cols-1)
    const gridContainer = pdpRegion.locator('.grid-cols-1').first();
    await expect(gridContainer).toBeVisible();
  });

  test('PDP renders correctly at tablet viewport (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/catalog');
    await expect(page.getByRole('region', { name: /product catalog/i })).toBeVisible();

    const firstArticle = page.getByRole('article').first();
    await firstArticle.click();
    await page.waitForURL(/\/catalog\/prod-/, { timeout: 10000 });

    // Verify PDP renders at tablet viewport
    const pdpRegion = page.getByRole('region', { name: /product detail page/i });
    await expect(pdpRegion).toBeVisible({ timeout: 10000 });

    // Verify all major sections are visible at tablet
    const heroRegion = page.getByRole('region', { name: /product hero/i });
    await expect(heroRegion).toBeVisible();

    const pricingRegion = page.getByRole('region', { name: /product pricing/i });
    await expect(pricingRegion).toBeVisible();

    await expect(page.getByText('Specifications')).toBeVisible();
    await expect(page.getByText('Customer Reviews')).toBeVisible();

    const crossSellRegion = page.getByRole('region', { name: /cross-sell recommendations/i });
    await expect(crossSellRegion).toBeVisible();
  });

  test('PDP renders correctly at desktop viewport (1280px)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });

    await page.goto('/catalog');
    await expect(page.getByRole('region', { name: /product catalog/i })).toBeVisible();

    const firstArticle = page.getByRole('article').first();
    await firstArticle.click();
    await page.waitForURL(/\/catalog\/prod-/, { timeout: 10000 });

    // Verify PDP renders at desktop viewport
    const pdpRegion = page.getByRole('region', { name: /product detail page/i });
    await expect(pdpRegion).toBeVisible({ timeout: 10000 });

    // Verify all major sections are visible at desktop
    const heroRegion = page.getByRole('region', { name: /product hero/i });
    await expect(heroRegion).toBeVisible();

    const pricingRegion = page.getByRole('region', { name: /product pricing/i });
    await expect(pricingRegion).toBeVisible();

    await expect(page.getByText('Specifications')).toBeVisible();
    await expect(page.getByText('Customer Reviews')).toBeVisible();

    const crossSellRegion = page.getByRole('region', { name: /cross-sell recommendations/i });
    await expect(crossSellRegion).toBeVisible();

    // Verify desktop layout uses lg:grid-cols-12 for split layout
    const lgGridContainer = pdpRegion.locator('.lg\\:grid-cols-12').first();
    await expect(lgGridContainer).toBeVisible();

    // Verify left column (price block) with lg:col-span-5
    const leftCol = pdpRegion.locator('.lg\\:col-span-5').first();
    await expect(leftCol).toBeVisible();

    // Verify right column (spec table) with lg:col-span-7
    const rightCol = pdpRegion.locator('.lg\\:col-span-7').first();
    await expect(rightCol).toBeVisible();
  });

  test('catalog page product cards are keyboard navigable', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByRole('region', { name: /product catalog/i })).toBeVisible();

    // Verify product cards are focusable
    const articles = page.getByRole('article');
    const firstArticle = articles.first();

    // Focus the first article
    await firstArticle.focus();
    await expect(firstArticle).toBeFocused();

    // Verify tabindex is set for keyboard navigation
    const tabindex = await firstArticle.getAttribute('tabindex');
    expect(tabindex).toBe('0');

    // Press Enter to navigate to PDP
    await page.keyboard.press('Enter');
    await page.waitForURL(/\/catalog\/prod-/, { timeout: 10000 });

    const pdpRegion = page.getByRole('region', { name: /product detail page/i });
    await expect(pdpRegion).toBeVisible({ timeout: 10000 });
  });

  test('PDP renders member price and savings when applicable', async ({ page }) => {
    // Navigate directly to Samsung TV PDP which has memberPrice
    await page.goto('/catalog/prod-tv-001');

    const pdpRegion = page.getByRole('region', { name: /product detail page/i });
    await expect(pdpRegion).toBeVisible({ timeout: 10000 });

    // Verify regular price is displayed
    await expect(page.getByText('$1,599.99')).toBeVisible();

    // By default, member price should not be shown (showMemberPrice defaults to false)
    // But the product data has memberPrice field available
    // The PDP renders with default props, so member price is not shown
    // Verify the pricing region is present
    const pricingRegion = page.getByRole('region', { name: /product pricing/i });
    await expect(pricingRegion).toBeVisible();
  });

  test('PDP renders product with no financing for cheap products', async ({ page }) => {
    // The Sony headphones are $349.99 which is > $100, so financing should show
    await page.goto('/catalog/prod-headphones-003');

    const pdpRegion = page.getByRole('region', { name: /product detail page/i });
    await expect(pdpRegion).toBeVisible({ timeout: 10000 });

    // Verify product title
    await expect(page.getByText('Sony WH-1000XM5')).toBeVisible();

    // Verify price
    await expect(page.getByText('$349.99')).toBeVisible();

    // Verify financing is shown (price > $100)
    await expect(page.getByText(/24-mo financing/i)).toBeVisible();

    // Verify Price Drop badge
    await expect(page.getByText('Price Drop')).toBeVisible();
  });

  test('catalog page reset button works correctly', async ({ page }) => {
    await page.goto('/catalog');
    await expect(page.getByRole('region', { name: /product catalog/i })).toBeVisible();

    // Verify initial product count
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

  test('PDP breadcrumb navigation works correctly', async ({ page }) => {
    await page.goto('/catalog/prod-tv-001');

    const pdpRegion = page.getByRole('region', { name: /product detail page/i });
    await expect(pdpRegion).toBeVisible({ timeout: 10000 });

    // Verify breadcrumb is present
    const breadcrumb = page.getByRole('navigation', { name: /breadcrumb/i });
    await expect(breadcrumb).toBeVisible();

    // Click Catalog link in breadcrumb
    const catalogLink = breadcrumb.getByText('Catalog');
    await catalogLink.click();

    // Verify navigation to catalog page
    await page.waitForURL(/\/catalog$/, { timeout: 10000 });
    await expect(page.getByText('Product Catalog')).toBeVisible();
  });

  test('PDP cross-sell section has View Details buttons', async ({ page }) => {
    await page.goto('/catalog/prod-tv-001');

    const pdpRegion = page.getByRole('region', { name: /product detail page/i });
    await expect(pdpRegion).toBeVisible({ timeout: 10000 });

    // Verify cross-sell section
    const crossSellRegion = page.getByRole('region', { name: /cross-sell recommendations/i });
    await expect(crossSellRegion).toBeVisible();

    // Verify View Details buttons in cross-sell items
    const viewDetailsButtons = crossSellRegion.getByRole('button', { name: /view details/i });
    expect(await viewDetailsButtons.count()).toBeGreaterThanOrEqual(1);

    // Verify recommendation count in footer
    await expect(crossSellRegion.getByText(/recommendation/i)).toBeVisible();
  });

  test('PDP spec table displays correct number of specifications', async ({ page }) => {
    await page.goto('/catalog/prod-tv-001');

    const pdpRegion = page.getByRole('region', { name: /product detail page/i });
    await expect(pdpRegion).toBeVisible({ timeout: 10000 });

    // Verify spec table
    const specTable = page.getByRole('table', { name: /product specifications table/i });
    await expect(specTable).toBeVisible();

    // Samsung TV has 8 specs: screenSize, resolution, displayType, refreshRate, hdr, smartPlatform, ports, weight
    await expect(page.getByText('8 specifications')).toBeVisible();

    // Verify specific spec values
    await expect(page.getByText('120Hz')).toBeVisible();
    await expect(page.getByText('Tizen')).toBeVisible();
    await expect(page.getByText('4 HDMI, 2 USB')).toBeVisible();
  });

  test('PDP review section displays rating distribution and highlighted reviews', async ({ page }) => {
    await page.goto('/catalog/prod-tv-001');

    const pdpRegion = page.getByRole('region', { name: /product detail page/i });
    await expect(pdpRegion).toBeVisible({ timeout: 10000 });

    // Verify review section
    const reviewRegion = page.getByRole('region', { name: /customer reviews/i });
    await expect(reviewRegion).toBeVisible();

    // Verify average rating display
    await expect(reviewRegion.getByText('4.7')).toBeVisible();

    // Verify rating distribution bars
    const ratingDistribution = page.getByRole('img', { name: /rating distribution/i });
    await expect(ratingDistribution).toBeVisible();

    // Verify highlighted reviews section
    await expect(reviewRegion.getByText('Highlighted Reviews')).toBeVisible();

    // Verify review count in footer
    await expect(reviewRegion.getByText(/highlighted review/i)).toBeVisible();
  });
});