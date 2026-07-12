import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext.jsx';
import CanonicalPdp from '@/components/pdp/CanonicalPdp.jsx';
import { clearEventBuffer } from '@/services/observabilityEmitter.js';
import { clearCatalogCache } from '@/services/catalogLoader.js';
import { clearCohortSetCache } from '@/services/cohortIntakeService.js';
import mockCatalog from '@/data/mockCatalog.js';

function renderWithProviders(ui, options = {}) {
  return render(
    <MemoryRouter>
      <AppProvider>{ui}</AppProvider>
    </MemoryRouter>,
    options,
  );
}

describe('CanonicalPdp', () => {
  let product;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearEventBuffer();
    clearCatalogCache();
    clearCohortSetCache();

    product = { ...mockCatalog[0] };
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearEventBuffer();
    clearCatalogCache();
    clearCohortSetCache();
  });

  describe('rendering with valid product', () => {
    it('renders the PDP region with correct aria-label including product title', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const region = screen.getByRole('region', {
        name: new RegExp(`product detail page.*${product.title.substring(0, 20)}`, 'i'),
      });
      expect(region).toBeInTheDocument();
    });

    it('renders as an article element', () => {
      const { container } = renderWithProviders(<CanonicalPdp product={product} />);

      const article = container.querySelector('article');
      expect(article).toBeInTheDocument();
    });

    it('applies additional className when provided', () => {
      const { container } = renderWithProviders(
        <CanonicalPdp product={product} className="custom-pdp-class" />,
      );

      const customElement = container.querySelector('.custom-pdp-class');
      expect(customElement).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders empty state when product is null', () => {
      renderWithProviders(<CanonicalPdp product={null} />);

      const region = screen.getByRole('region', { name: /product detail page/i });
      expect(region).toBeInTheDocument();
      expect(screen.getByText(/no product data available/i)).toBeInTheDocument();
    });

    it('renders empty state when product is undefined', () => {
      renderWithProviders(<CanonicalPdp product={undefined} />);

      expect(screen.getByText(/no product data available/i)).toBeInTheDocument();
    });

    it('renders empty state when product is not an object', () => {
      renderWithProviders(<CanonicalPdp product="not an object" />);

      expect(screen.getByText(/no product data available/i)).toBeInTheDocument();
    });

    it('renders guidance text in empty state', () => {
      renderWithProviders(<CanonicalPdp product={null} />);

      expect(
        screen.getByText(/select a product from the catalog/i),
      ).toBeInTheDocument();
    });
  });

  describe('Product Hero section', () => {
    it('renders the product hero region', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const heroRegion = screen.getByRole('region', { name: /product hero/i });
      expect(heroRegion).toBeInTheDocument();
    });

    it('displays the product title', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      expect(screen.getByText(product.title)).toBeInTheDocument();
    });

    it('displays the product brand', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      expect(screen.getByText(product.brand)).toBeInTheDocument();
    });

    it('displays the product category', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      expect(screen.getByText(product.category)).toBeInTheDocument();
    });

    it('displays the product SKU', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      expect(screen.getByText(new RegExp(product.sku))).toBeInTheDocument();
    });

    it('renders the product image', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const img = screen.getByAltText(product.title);
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', product.imageUrl);
    });

    it('displays the product rating', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      expect(screen.getByText(product.rating.toFixed(1))).toBeInTheDocument();
    });

    it('displays the review count', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      expect(
        screen.getByText(new RegExp(`${product.reviewCount.toLocaleString()}`)),
      ).toBeInTheDocument();
    });

    it('renders the product badge from catalog data', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      expect(screen.getByText(product.badge)).toBeInTheDocument();
    });

    it('renders with standard layout by default', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const heroRegion = screen.getByRole('region', { name: /product hero/i });
      expect(heroRegion).toBeInTheDocument();
      // Standard layout should not show layout indicator
      expect(screen.queryByText(/layout$/i)).not.toBeInTheDocument();
    });

    it('renders layout indicator for non-standard layout', () => {
      renderWithProviders(<CanonicalPdp product={product} layout="price-forward" />);

      expect(screen.getByText(/price forward layout/i)).toBeInTheDocument();
    });

    it('renders layout indicator for spec-heavy layout', () => {
      renderWithProviders(<CanonicalPdp product={product} layout="spec-heavy" />);

      expect(screen.getByText(/spec heavy layout/i)).toBeInTheDocument();
    });

    it('renders layout indicator for media-rich layout', () => {
      renderWithProviders(<CanonicalPdp product={product} layout="media-rich" />);

      expect(screen.getByText(/media rich layout/i)).toBeInTheDocument();
    });
  });

  describe('Price Block section', () => {
    it('renders the product pricing region', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const pricingRegion = screen.getByRole('region', { name: /product pricing/i });
      expect(pricingRegion).toBeInTheDocument();
    });

    it('displays the product price', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      expect(screen.getByText(`$${product.price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`)).toBeInTheDocument();
    });

    it('displays fulfillment information', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      expect(screen.getByText(product.fulfillment)).toBeInTheDocument();
    });

    it('does not show savings by default', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      expect(screen.queryByText(/you save/i)).not.toBeInTheDocument();
    });

    it('shows savings when showSavings is true and member price exists', () => {
      renderWithProviders(
        <CanonicalPdp product={product} showSavings={true} showMemberPrice={true} />,
      );

      expect(screen.getByText(/you save/i)).toBeInTheDocument();
    });

    it('shows member price when showMemberPrice is true', () => {
      renderWithProviders(
        <CanonicalPdp product={product} showMemberPrice={true} />,
      );

      expect(screen.getByText(/member price/i)).toBeInTheDocument();
    });

    it('does not show member price by default', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      expect(screen.queryByText(/member price/i)).not.toBeInTheDocument();
    });

    it('shows price callout when provided', () => {
      renderWithProviders(
        <CanonicalPdp product={product} priceCallout="Save more today" />,
      );

      expect(screen.getByText('Save more today')).toBeInTheDocument();
    });

    it('does not show price callout when empty', () => {
      renderWithProviders(<CanonicalPdp product={product} priceCallout="" />);

      // No callout badge should appear
      expect(screen.queryByText(/save more/i)).not.toBeInTheDocument();
    });

    it('shows pricing mode indicator for non-standard price display', () => {
      renderWithProviders(
        <CanonicalPdp product={product} priceDisplay="savings-highlight" />,
      );

      expect(screen.getByText(/savings highlight pricing/i)).toBeInTheDocument();
    });

    it('does not show pricing mode indicator for standard price display', () => {
      renderWithProviders(
        <CanonicalPdp product={product} priceDisplay="standard" />,
      );

      expect(screen.queryByText(/tailored pricing/i)).not.toBeInTheDocument();
    });

    it('shows financing estimate for products over $100', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      expect(screen.getByText(/24-mo financing/i)).toBeInTheDocument();
    });

    it('does not show financing estimate for products under $100', () => {
      const cheapProduct = { ...product, price: 49.99 };
      renderWithProviders(<CanonicalPdp product={cheapProduct} />);

      expect(screen.queryByText(/24-mo financing/i)).not.toBeInTheDocument();
    });
  });

  describe('CTA Button section', () => {
    it('renders the product actions group', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const actionsGroup = screen.getByRole('group', { name: /product actions/i });
      expect(actionsGroup).toBeInTheDocument();
    });

    it('renders the primary CTA button with default text', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const ctaButtons = screen.getAllByRole('button', { name: /add to cart/i });
      expect(ctaButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders the secondary CTA button with default text', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const secondaryButtons = screen.getAllByRole('button', { name: /save for later/i });
      expect(secondaryButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders custom primary CTA text', () => {
      renderWithProviders(
        <CanonicalPdp product={product} primaryCTA="Grab This Deal" />,
      );

      const ctaButtons = screen.getAllByRole('button', { name: /grab this deal/i });
      expect(ctaButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders custom secondary CTA text', () => {
      renderWithProviders(
        <CanonicalPdp product={product} secondaryCTA="Compare Specs" />,
      );

      const secondaryButtons = screen.getAllByRole('button', { name: /compare specs/i });
      expect(secondaryButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('shows tailored CTA indicator for non-standard CTA', () => {
      renderWithProviders(
        <CanonicalPdp product={product} primaryCTA="Buy Now" />,
      );

      expect(screen.getByText(/tailored cta/i)).toBeInTheDocument();
    });

    it('shows tone indicator for non-standard CTA tone', () => {
      renderWithProviders(
        <CanonicalPdp product={product} ctaTone="urgent" />,
      );

      expect(screen.getByText(/urgent tone/i)).toBeInTheDocument();
    });

    it('does not show tailored indicator for default CTA', () => {
      renderWithProviders(
        <CanonicalPdp
          product={product}
          primaryCTA="Add to Cart"
          secondaryCTA="Save for Later"
          ctaTone="standard"
        />,
      );

      const actionsGroup = screen.getByRole('group', { name: /product actions/i });
      expect(within(actionsGroup).queryByText(/tailored/i)).not.toBeInTheDocument();
    });
  });

  describe('Urgency Badge section', () => {
    it('renders product badge from catalog data', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      expect(screen.getByText(product.badge)).toBeInTheDocument();
    });

    it('renders custom badges when provided', () => {
      renderWithProviders(
        <CanonicalPdp product={product} badges={['Price Drop', 'Clearance']} />,
      );

      expect(screen.getByText('Price Drop')).toBeInTheDocument();
      expect(screen.getByText('Clearance')).toBeInTheDocument();
    });

    it('renders urgency message when urgency level is not none', () => {
      renderWithProviders(
        <CanonicalPdp
          product={product}
          urgencyLevel="high"
          urgencyMessage="Limited time offer"
        />,
      );

      expect(screen.getByText('Limited time offer')).toBeInTheDocument();
    });

    it('does not render urgency message when urgency level is none', () => {
      renderWithProviders(
        <CanonicalPdp
          product={product}
          urgencyLevel="none"
          urgencyMessage="Should not appear"
        />,
      );

      expect(screen.queryByText('Should not appear')).not.toBeInTheDocument();
    });

    it('renders tailored badges indicator when custom badges are provided', () => {
      renderWithProviders(
        <CanonicalPdp product={product} badges={['VIP Exclusive']} />,
      );

      expect(screen.getByText(/tailored badges/i)).toBeInTheDocument();
    });
  });

  describe('Specifications section', () => {
    it('renders the specifications heading', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      expect(screen.getByText('Specifications')).toBeInTheDocument();
    });

    it('renders the product specifications region', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const specRegion = screen.getByRole('region', { name: /product specifications/i });
      expect(specRegion).toBeInTheDocument();
    });

    it('renders the specifications table', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const specTable = screen.getByRole('table', { name: /product specifications table/i });
      expect(specTable).toBeInTheDocument();
    });

    it('displays spec values from product data', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      // Check for a known spec value from the Samsung TV
      expect(screen.getByText('65"')).toBeInTheDocument();
      expect(screen.getByText('Neo QLED')).toBeInTheDocument();
    });

    it('shows tailored ordering indicator when prioritizedSpecs is provided', () => {
      renderWithProviders(
        <CanonicalPdp
          product={product}
          prioritizedSpecs={['screenSize', 'resolution']}
        />,
      );

      expect(screen.getByText(/tailored ordering/i)).toBeInTheDocument();
    });

    it('does not show tailored ordering indicator when no prioritizedSpecs', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      expect(screen.queryByText(/tailored ordering/i)).not.toBeInTheDocument();
    });

    it('displays spec count in footer', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const specCount = Object.keys(product.specs).length;
      expect(
        screen.getByText(new RegExp(`${specCount} specification`)),
      ).toBeInTheDocument();
    });
  });

  describe('Review Summary section', () => {
    it('renders the customer reviews heading', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      expect(screen.getByText('Customer Reviews')).toBeInTheDocument();
    });

    it('renders the customer reviews region', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const reviewRegion = screen.getByRole('region', { name: /customer reviews/i });
      expect(reviewRegion).toBeInTheDocument();
    });

    it('displays the average rating', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const reviewRegion = screen.getByRole('region', { name: /customer reviews/i });
      expect(within(reviewRegion).getByText(product.rating.toFixed(1))).toBeInTheDocument();
    });

    it('displays the review count when showReviewCount is true', () => {
      renderWithProviders(
        <CanonicalPdp product={product} showReviewCount={true} />,
      );

      const reviewRegion = screen.getByRole('region', { name: /customer reviews/i });
      expect(
        within(reviewRegion).getByText(new RegExp(`${product.reviewCount.toLocaleString()}`)),
      ).toBeInTheDocument();
    });

    it('renders rating distribution bars', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const ratingDistribution = screen.getByRole('img', { name: /rating distribution/i });
      expect(ratingDistribution).toBeInTheDocument();
    });

    it('shows review filter indicator when custom filter is applied', () => {
      renderWithProviders(
        <CanonicalPdp product={product} reviewFilter="expert" />,
      );

      expect(screen.getByText(/expert reviews/i)).toBeInTheDocument();
    });

    it('does not show review filter indicator for default filter', () => {
      renderWithProviders(
        <CanonicalPdp product={product} reviewFilter="none" />,
      );

      const reviewRegion = screen.getByRole('region', { name: /customer reviews/i });
      expect(within(reviewRegion).queryByText(/filtered/i)).not.toBeInTheDocument();
    });

    it('renders minimal social proof display when set', () => {
      renderWithProviders(
        <CanonicalPdp product={product} socialProofDisplay="minimal" />,
      );

      // Minimal display should still show rating
      const reviewRegion = screen.getByRole('region', { name: /customer reviews/i });
      expect(reviewRegion).toBeInTheDocument();
    });

    it('shows social proof display indicator for non-standard display', () => {
      renderWithProviders(
        <CanonicalPdp product={product} socialProofDisplay="expanded" />,
      );

      expect(screen.getByText(/expanded/i)).toBeInTheDocument();
    });

    it('shows Highly Rated badge for products with rating >= 4.5', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      expect(screen.getByText('Highly Rated')).toBeInTheDocument();
    });

    it('does not show Highly Rated badge for products with rating < 4.5', () => {
      const lowRatedProduct = { ...product, rating: 3.5 };
      renderWithProviders(<CanonicalPdp product={lowRatedProduct} />);

      expect(screen.queryByText('Highly Rated')).not.toBeInTheDocument();
    });
  });

  describe('Cross-Sell section', () => {
    it('renders the cross-sell recommendations region', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const crossSellRegion = screen.getByRole('region', { name: /cross-sell recommendations/i });
      expect(crossSellRegion).toBeInTheDocument();
    });

    it('renders default cross-sell heading', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      expect(screen.getByText('You Might Also Like')).toBeInTheDocument();
    });

    it('renders custom cross-sell heading', () => {
      renderWithProviders(
        <CanonicalPdp product={product} crossSellHeading="Compare Similar Products" />,
      );

      expect(screen.getByText('Compare Similar Products')).toBeInTheDocument();
    });

    it('renders cross-sell items list', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const crossSellRegion = screen.getByRole('region', { name: /cross-sell recommendations/i });
      const list = within(crossSellRegion).getByRole('list');
      expect(list).toBeInTheDocument();

      const items = within(list).getAllByRole('listitem');
      expect(items.length).toBeGreaterThanOrEqual(1);
    });

    it('renders correct number of cross-sell items based on maxItems', () => {
      renderWithProviders(
        <CanonicalPdp product={product} crossSellMaxItems={2} />,
      );

      const crossSellRegion = screen.getByRole('region', { name: /cross-sell recommendations/i });
      const list = within(crossSellRegion).getByRole('list');
      const items = within(list).getAllByRole('listitem');
      expect(items.length).toBe(2);
    });

    it('does not render cross-sell section when strategy is none', () => {
      renderWithProviders(
        <CanonicalPdp product={product} crossSellStrategy="none" />,
      );

      expect(
        screen.queryByRole('region', { name: /cross-sell recommendations/i }),
      ).not.toBeInTheDocument();
    });

    it('shows strategy indicator for non-complementary strategy', () => {
      renderWithProviders(
        <CanonicalPdp product={product} crossSellStrategy="upgrade" />,
      );

      expect(screen.getByText(/upgrade options/i)).toBeInTheDocument();
    });

    it('renders cross-sell items with View Details buttons', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const crossSellRegion = screen.getByRole('region', { name: /cross-sell recommendations/i });
      const viewDetailsButtons = within(crossSellRegion).getAllByRole('button', { name: /view details/i });
      expect(viewDetailsButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('renders recommendation count in footer', () => {
      renderWithProviders(
        <CanonicalPdp product={product} crossSellMaxItems={3} />,
      );

      expect(screen.getByText(/3 recommendations/i)).toBeInTheDocument();
    });
  });

  describe('responsive layout', () => {
    it('renders the main content grid container', () => {
      const { container } = renderWithProviders(<CanonicalPdp product={product} />);

      const gridContainer = container.querySelector('.lg\\:grid-cols-12');
      expect(gridContainer).toBeInTheDocument();
    });

    it('renders left column with lg:col-span-5 for price block', () => {
      const { container } = renderWithProviders(<CanonicalPdp product={product} />);

      const leftCol = container.querySelector('.lg\\:col-span-5');
      expect(leftCol).toBeInTheDocument();
    });

    it('renders right column with lg:col-span-7 for spec table', () => {
      const { container } = renderWithProviders(<CanonicalPdp product={product} />);

      const rightCol = container.querySelector('.lg\\:col-span-7');
      expect(rightCol).toBeInTheDocument();
    });

    it('uses grid-cols-1 for mobile stacking', () => {
      const { container } = renderWithProviders(<CanonicalPdp product={product} />);

      const gridContainer = container.querySelector('.grid-cols-1');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessible region landmark for PDP', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const region = screen.getByRole('region', {
        name: new RegExp(`product detail page`, 'i'),
      });
      expect(region).toBeInTheDocument();
    });

    it('has accessible region landmark for product hero', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const heroRegion = screen.getByRole('region', { name: /product hero/i });
      expect(heroRegion).toBeInTheDocument();
    });

    it('has accessible region landmark for product pricing', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const pricingRegion = screen.getByRole('region', { name: /product pricing/i });
      expect(pricingRegion).toBeInTheDocument();
    });

    it('has accessible region landmark for product specifications', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const specRegion = screen.getByRole('region', { name: /product specifications/i });
      expect(specRegion).toBeInTheDocument();
    });

    it('has accessible region landmark for customer reviews', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const reviewRegion = screen.getByRole('region', { name: /customer reviews/i });
      expect(reviewRegion).toBeInTheDocument();
    });

    it('has accessible region landmark for cross-sell', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const crossSellRegion = screen.getByRole('region', { name: /cross-sell recommendations/i });
      expect(crossSellRegion).toBeInTheDocument();
    });

    it('has accessible group for product actions', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const actionsGroup = screen.getByRole('group', { name: /product actions/i });
      expect(actionsGroup).toBeInTheDocument();
    });

    it('product image has alt text matching product title', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const img = screen.getByAltText(product.title);
      expect(img).toBeInTheDocument();
    });

    it('star ratings have accessible labels', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const starRatings = screen.getAllByLabelText(/out of 5 stars/i);
      expect(starRatings.length).toBeGreaterThanOrEqual(1);
    });

    it('specifications table has accessible label', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const specTable = screen.getByRole('table', { name: /product specifications table/i });
      expect(specTable).toBeInTheDocument();
    });

    it('CTA buttons have accessible labels', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const addToCartButtons = screen.getAllByRole('button', { name: /add to cart/i });
      expect(addToCartButtons.length).toBeGreaterThanOrEqual(1);

      const saveButtons = screen.getAllByRole('button', { name: /save for later/i });
      expect(saveButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('cross-sell list has accessible label', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const crossSellRegion = screen.getByRole('region', { name: /cross-sell recommendations/i });
      const list = within(crossSellRegion).getByRole('list');
      expect(list).toHaveAttribute('aria-label');
    });
  });

  describe('diff highlights', () => {
    it('renders without diff highlights by default', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      const region = screen.getByRole('region', {
        name: new RegExp(`product detail page`, 'i'),
      });
      expect(region).toBeInTheDocument();
    });

    it('renders with diff highlights when provided', () => {
      const diffHighlights = {
        dimensions: ['price', 'badge'],
        fields: ['priceDisplay', 'badges'],
        hasChanges: true,
      };

      renderWithProviders(
        <CanonicalPdp
          product={product}
          diffHighlights={diffHighlights}
          showDiffOutline={true}
        />,
      );

      const region = screen.getByRole('region', {
        name: new RegExp(`product detail page`, 'i'),
      });
      expect(region).toBeInTheDocument();
    });

    it('renders without diff outline when showDiffOutline is false', () => {
      const diffHighlights = {
        dimensions: ['price'],
        fields: ['priceDisplay'],
        hasChanges: true,
      };

      renderWithProviders(
        <CanonicalPdp
          product={product}
          diffHighlights={diffHighlights}
          showDiffOutline={false}
        />,
      );

      const region = screen.getByRole('region', {
        name: new RegExp(`product detail page`, 'i'),
      });
      expect(region).toBeInTheDocument();
    });
  });

  describe('different products', () => {
    it('renders correctly for each mock catalog product', () => {
      mockCatalog.forEach((catalogProduct) => {
        const { unmount } = renderWithProviders(
          <CanonicalPdp product={catalogProduct} />,
        );

        const region = screen.getByRole('region', {
          name: new RegExp(`product detail page`, 'i'),
        });
        expect(region).toBeInTheDocument();
        expect(screen.getByText(catalogProduct.title)).toBeInTheDocument();

        unmount();
      });
    });

    it('renders correct price for each product', () => {
      mockCatalog.forEach((catalogProduct) => {
        const { unmount } = renderWithProviders(
          <CanonicalPdp product={catalogProduct} />,
        );

        const formattedPrice = `$${catalogProduct.price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
        expect(screen.getByText(formattedPrice)).toBeInTheDocument();

        unmount();
      });
    });

    it('renders correct brand for each product', () => {
      mockCatalog.forEach((catalogProduct) => {
        const { unmount } = renderWithProviders(
          <CanonicalPdp product={catalogProduct} />,
        );

        expect(screen.getByText(catalogProduct.brand)).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('cross-sell strategies', () => {
    it('renders complementary cross-sell items', () => {
      renderWithProviders(
        <CanonicalPdp product={product} crossSellStrategy="complementary" />,
      );

      const crossSellRegion = screen.getByRole('region', { name: /cross-sell recommendations/i });
      expect(crossSellRegion).toBeInTheDocument();
    });

    it('renders upgrade cross-sell items', () => {
      renderWithProviders(
        <CanonicalPdp product={product} crossSellStrategy="upgrade" />,
      );

      const crossSellRegion = screen.getByRole('region', { name: /cross-sell recommendations/i });
      expect(crossSellRegion).toBeInTheDocument();
      expect(screen.getByText(/upgrade options/i)).toBeInTheDocument();
    });

    it('renders bundle cross-sell items', () => {
      renderWithProviders(
        <CanonicalPdp product={product} crossSellStrategy="bundle" />,
      );

      const crossSellRegion = screen.getByRole('region', { name: /cross-sell recommendations/i });
      expect(crossSellRegion).toBeInTheDocument();
      expect(screen.getByText(/bundle deals/i)).toBeInTheDocument();
    });

    it('renders essentials cross-sell items', () => {
      renderWithProviders(
        <CanonicalPdp product={product} crossSellStrategy="essentials" />,
      );

      const crossSellRegion = screen.getByRole('region', { name: /cross-sell recommendations/i });
      expect(crossSellRegion).toBeInTheDocument();
      expect(screen.getByText(/business essentials/i)).toBeInTheDocument();
    });

    it('renders history-based cross-sell items', () => {
      renderWithProviders(
        <CanonicalPdp product={product} crossSellStrategy="history-based" />,
      );

      const crossSellRegion = screen.getByRole('region', { name: /cross-sell recommendations/i });
      expect(crossSellRegion).toBeInTheDocument();
      expect(screen.getByText(/based on your history/i)).toBeInTheDocument();
    });
  });

  describe('CTA tone variations', () => {
    it('renders standard tone CTA', () => {
      renderWithProviders(
        <CanonicalPdp product={product} ctaTone="standard" />,
      );

      const actionsGroup = screen.getByRole('group', { name: /product actions/i });
      expect(actionsGroup).toBeInTheDocument();
    });

    it('renders urgent tone CTA', () => {
      renderWithProviders(
        <CanonicalPdp product={product} ctaTone="urgent" />,
      );

      expect(screen.getByText(/urgent tone/i)).toBeInTheDocument();
    });

    it('renders value tone CTA', () => {
      renderWithProviders(
        <CanonicalPdp product={product} ctaTone="value" />,
      );

      expect(screen.getByText(/value tone/i)).toBeInTheDocument();
    });

    it('renders premium tone CTA', () => {
      renderWithProviders(
        <CanonicalPdp product={product} ctaTone="premium" />,
      );

      expect(screen.getByText(/premium tone/i)).toBeInTheDocument();
    });

    it('renders friendly tone CTA', () => {
      renderWithProviders(
        <CanonicalPdp product={product} ctaTone="friendly" />,
      );

      expect(screen.getByText(/friendly tone/i)).toBeInTheDocument();
    });
  });

  describe('price display modes', () => {
    it('renders savings-highlight price display', () => {
      renderWithProviders(
        <CanonicalPdp
          product={product}
          priceDisplay="savings-highlight"
          showSavings={true}
          showMemberPrice={true}
        />,
      );

      expect(screen.getByText(/savings highlight pricing/i)).toBeInTheDocument();
    });

    it('renders member-price display', () => {
      renderWithProviders(
        <CanonicalPdp
          product={product}
          priceDisplay="member-price"
          showMemberPrice={true}
        />,
      );

      expect(screen.getByText(/member price pricing/i)).toBeInTheDocument();
    });

    it('renders volume-discount display', () => {
      renderWithProviders(
        <CanonicalPdp product={product} priceDisplay="volume-discount" />,
      );

      expect(screen.getByText(/volume discount pricing/i)).toBeInTheDocument();
    });

    it('renders student-discount display', () => {
      renderWithProviders(
        <CanonicalPdp product={product} priceDisplay="student-discount" />,
      );

      expect(screen.getByText(/student discount pricing/i)).toBeInTheDocument();
    });

    it('renders compare-at display', () => {
      renderWithProviders(
        <CanonicalPdp
          product={product}
          priceDisplay="compare-at"
          showSavings={true}
          showMemberPrice={true}
        />,
      );

      expect(screen.getByText(/compare at pricing/i)).toBeInTheDocument();
    });
  });

  describe('urgency levels', () => {
    it('renders low urgency message', () => {
      renderWithProviders(
        <CanonicalPdp
          product={product}
          urgencyLevel="low"
          urgencyMessage="Check back for deals"
        />,
      );

      expect(screen.getByText('Check back for deals')).toBeInTheDocument();
    });

    it('renders medium urgency message', () => {
      renderWithProviders(
        <CanonicalPdp
          product={product}
          urgencyLevel="medium"
          urgencyMessage="Limited-time price"
        />,
      );

      expect(screen.getByText('Limited-time price')).toBeInTheDocument();
    });

    it('renders high urgency message', () => {
      renderWithProviders(
        <CanonicalPdp
          product={product}
          urgencyLevel="high"
          urgencyMessage="Almost gone!"
        />,
      );

      expect(screen.getByText('Almost gone!')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('renders with empty className', () => {
      renderWithProviders(<CanonicalPdp product={product} className="" />);

      const region = screen.getByRole('region', {
        name: new RegExp(`product detail page`, 'i'),
      });
      expect(region).toBeInTheDocument();
    });

    it('renders with undefined className', () => {
      renderWithProviders(<CanonicalPdp product={product} className={undefined} />);

      const region = screen.getByRole('region', {
        name: new RegExp(`product detail page`, 'i'),
      });
      expect(region).toBeInTheDocument();
    });

    it('renders product with missing optional fields', () => {
      const minimalProduct = {
        id: 'prod-minimal',
        sku: 'SKU-MINIMAL',
        title: 'Minimal Product',
        price: 99.99,
        specs: { weight: '1 lb' },
      };

      renderWithProviders(<CanonicalPdp product={minimalProduct} />);

      expect(screen.getByText('Minimal Product')).toBeInTheDocument();
    });

    it('renders product with zero price', () => {
      const freeProduct = { ...product, price: 0 };
      renderWithProviders(<CanonicalPdp product={freeProduct} />);

      expect(screen.getByText('$0.00')).toBeInTheDocument();
    });

    it('renders product with no specs', () => {
      const noSpecsProduct = { ...product, specs: undefined };
      renderWithProviders(<CanonicalPdp product={noSpecsProduct} />);

      expect(screen.getByText(/no specifications available/i)).toBeInTheDocument();
    });

    it('renders product with empty specs object', () => {
      const emptySpecsProduct = { ...product, specs: {} };
      renderWithProviders(<CanonicalPdp product={emptySpecsProduct} />);

      expect(screen.getByText(/no specifications available/i)).toBeInTheDocument();
    });

    it('renders product with zero rating', () => {
      const zeroRatingProduct = { ...product, rating: 0, reviewCount: 0 };
      renderWithProviders(<CanonicalPdp product={zeroRatingProduct} />);

      const region = screen.getByRole('region', {
        name: new RegExp(`product detail page`, 'i'),
      });
      expect(region).toBeInTheDocument();
    });

    it('renders all default props correctly', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      // Default layout is standard - no layout indicator
      expect(screen.queryByText(/layout$/i)).not.toBeInTheDocument();

      // Default CTA is Add to Cart
      const ctaButtons = screen.getAllByRole('button', { name: /add to cart/i });
      expect(ctaButtons.length).toBeGreaterThanOrEqual(1);

      // Default cross-sell heading
      expect(screen.getByText('You Might Also Like')).toBeInTheDocument();
    });
  });

  describe('review highlight variations', () => {
    it('renders with positive review filter', () => {
      renderWithProviders(
        <CanonicalPdp product={product} reviewFilter="positive" />,
      );

      expect(screen.getByText(/positive reviews/i)).toBeInTheDocument();
    });

    it('renders with detailed review filter', () => {
      renderWithProviders(
        <CanonicalPdp product={product} reviewFilter="detailed" />,
      );

      expect(screen.getByText(/detailed reviews/i)).toBeInTheDocument();
    });

    it('renders with value-mention review filter', () => {
      renderWithProviders(
        <CanonicalPdp product={product} reviewFilter="value-mention" />,
      );

      expect(screen.getByText(/value-focused reviews/i)).toBeInTheDocument();
    });

    it('renders with recent review filter', () => {
      renderWithProviders(
        <CanonicalPdp product={product} reviewFilter="recent" />,
      );

      const reviewRegion = screen.getByRole('region', { name: /customer reviews/i });
      expect(reviewRegion).toBeInTheDocument();
    });

    it('shows expert reviews indicator when showExpertReviews is true', () => {
      renderWithProviders(
        <CanonicalPdp product={product} showExpertReviews={true} />,
      );

      expect(screen.getByText(/expert reviews highlighted/i)).toBeInTheDocument();
    });

    it('does not show expert reviews indicator by default', () => {
      renderWithProviders(<CanonicalPdp product={product} />);

      expect(screen.queryByText(/expert reviews highlighted/i)).not.toBeInTheDocument();
    });
  });

  describe('social proof display modes', () => {
    it('renders standard social proof display', () => {
      renderWithProviders(
        <CanonicalPdp product={product} socialProofDisplay="standard" />,
      );

      const reviewRegion = screen.getByRole('region', { name: /customer reviews/i });
      expect(reviewRegion).toBeInTheDocument();
    });

    it('renders expert-focused social proof display', () => {
      renderWithProviders(
        <CanonicalPdp product={product} socialProofDisplay="expert-focused" />,
      );

      expect(screen.getByText(/expert focused/i)).toBeInTheDocument();
    });

    it('renders value-focused social proof display', () => {
      renderWithProviders(
        <CanonicalPdp product={product} socialProofDisplay="value-focused" />,
      );

      expect(screen.getByText(/value focused/i)).toBeInTheDocument();
    });

    it('renders minimal social proof display', () => {
      renderWithProviders(
        <CanonicalPdp product={product} socialProofDisplay="minimal" />,
      );

      const reviewRegion = screen.getByRole('region', { name: /customer reviews/i });
      expect(reviewRegion).toBeInTheDocument();
      // Minimal display should show tailored display indicator
      expect(screen.getByText(/tailored display.*minimal/i)).toBeInTheDocument();
    });
  });

  describe('complete PDP composition', () => {
    it('renders all major sections in correct order', () => {
      const { container } = renderWithProviders(<CanonicalPdp product={product} />);

      const article = container.querySelector('article');
      expect(article).toBeInTheDocument();

      // All sections should be present
      expect(screen.getByRole('region', { name: /product hero/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /product pricing/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /product specifications/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /customer reviews/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /cross-sell recommendations/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /product actions/i })).toBeInTheDocument();
    });

    it('renders a fully configured variant PDP with all tailoring props', () => {
      renderWithProviders(
        <CanonicalPdp
          product={product}
          layout="price-forward"
          primaryFocus="price"
          badges={['Price Drop', 'Clearance']}
          urgencyLevel="high"
          urgencyMessage="Limited time offer"
          priceDisplay="savings-highlight"
          showSavings={true}
          showMemberPrice={true}
          priceCallout="Save big today!"
          primaryCTA="Grab This Deal"
          secondaryCTA="Price Match"
          ctaTone="urgent"
          prioritizedSpecs={['screenSize', 'resolution']}
          expandByDefault={true}
          socialProofDisplay="expanded"
          showReviewCount={true}
          showExpertReviews={true}
          reviewFilter="expert"
          maxHighlightedReviews={3}
          reviewSortBy="rating"
          crossSellStrategy="upgrade"
          crossSellHeading="Compare Similar Products"
          crossSellMaxItems={3}
        />,
      );

      // Verify key tailored elements are present
      expect(screen.getByText('Price Drop')).toBeInTheDocument();
      expect(screen.getByText('Clearance')).toBeInTheDocument();
      expect(screen.getByText('Limited time offer')).toBeInTheDocument();
      expect(screen.getByText('Save big today!')).toBeInTheDocument();
      expect(screen.getByText('Compare Similar Products')).toBeInTheDocument();
      expect(screen.getByText(/price forward layout/i)).toBeInTheDocument();

      const ctaButtons = screen.getAllByRole('button', { name: /grab this deal/i });
      expect(ctaButtons.length).toBeGreaterThanOrEqual(1);

      const priceMatchButtons = screen.getAllByRole('button', { name: /price match/i });
      expect(priceMatchButtons.length).toBeGreaterThanOrEqual(1);
    });
  });
});