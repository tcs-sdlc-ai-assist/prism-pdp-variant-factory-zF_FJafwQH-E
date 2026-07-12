import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext.jsx';
import VariantGalleryGrid from '@/components/gallery/VariantGalleryGrid.jsx';
import { clearEventBuffer } from '@/services/observabilityEmitter.js';
import { clearCatalogCache } from '@/services/catalogLoader.js';
import { clearCohortSetCache } from '@/services/cohortIntakeService.js';
import { generateVariants } from '@/services/variantGenerator.js';
import { MAX_VARIANTS } from '@/constants/constants.js';
import mockCatalog from '@/data/mockCatalog.js';
import defaultCohorts from '@/data/defaultCohorts.js';

function renderWithProviders(ui, options = {}) {
  return render(
    <MemoryRouter>
      <AppProvider>{ui}</AppProvider>
    </MemoryRouter>,
    options,
  );
}

describe('VariantGalleryGrid', () => {
  let generatedVariants;
  let canonicalPdp;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    clearEventBuffer();
    clearCatalogCache();
    clearCohortSetCache();

    canonicalPdp = { ...mockCatalog[0] };
    const cohortSet = JSON.parse(JSON.stringify(defaultCohorts));
    const result = await generateVariants(canonicalPdp, cohortSet);
    generatedVariants = result.variants;
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearEventBuffer();
    clearCatalogCache();
    clearCohortSetCache();
  });

  describe('rendering', () => {
    it('renders the gallery region with correct aria-label', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      const region = screen.getByRole('region', { name: /variant gallery/i });
      expect(region).toBeInTheDocument();
    });

    it('renders the Variant Gallery heading', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText('Variant Gallery')).toBeInTheDocument();
    });

    it('renders 10 variant cards from generated variants', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      const grid = screen.getByRole('grid');
      const gridcells = within(grid).getAllByRole('gridcell');
      expect(gridcells.length).toBe(10);
    });

    it('renders variant count badge', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText(`${generatedVariants.length}/${MAX_VARIANTS} variants`)).toBeInTheDocument();
    });

    it('renders variant count in description text', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText(/10 variants generated/i)).toBeInTheDocument();
    });

    it('renders the grid with correct role', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      const grid = screen.getByRole('grid');
      expect(grid).toBeInTheDocument();
    });

    it('renders grid with accessible label including variant count', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      const grid = screen.getByRole('grid', { name: /variant gallery grid.*10 variant/i });
      expect(grid).toBeInTheDocument();
    });

    it('renders footer with variant count info', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText(/10 variants displayed/i)).toBeInTheDocument();
    });

    it('renders footer with keyboard navigation hint', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText(/use arrow keys to navigate/i)).toBeInTheDocument();
    });

    it('renders an aria-live region for announcements', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
    });

    it('applies additional className when provided', () => {
      const { container } = renderWithProviders(
        <VariantGalleryGrid
          variants={generatedVariants}
          canonicalPdp={canonicalPdp}
          className="custom-gallery-class"
        />,
      );

      const region = container.querySelector('.custom-gallery-class');
      expect(region).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('renders empty state when no variants are provided', () => {
      renderWithProviders(<VariantGalleryGrid variants={[]} />);

      expect(screen.getByText('No Variants Generated')).toBeInTheDocument();
    });

    it('renders empty state when variants prop is undefined', () => {
      renderWithProviders(<VariantGalleryGrid />);

      const region = screen.getByRole('region', { name: /variant gallery/i });
      expect(region).toBeInTheDocument();
    });

    it('empty state shows guidance text about navigating to Cohorts page', () => {
      renderWithProviders(<VariantGalleryGrid variants={[]} />);

      expect(
        screen.getByText(/configure cohort targets and generate variants/i),
      ).toBeInTheDocument();
    });

    it('empty state does not render a grid', () => {
      renderWithProviders(<VariantGalleryGrid variants={[]} />);

      const grid = screen.queryByRole('grid');
      expect(grid).not.toBeInTheDocument();
    });

    it('empty state does not render diff toggle', () => {
      renderWithProviders(<VariantGalleryGrid variants={[]} />);

      const diffToggle = screen.queryByRole('switch');
      expect(diffToggle).not.toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('renders skeleton loaders when loading is true', () => {
      renderWithProviders(<VariantGalleryGrid loading={true} />);

      const skeletons = screen.getAllByRole('status');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('does not render grid when loading', () => {
      renderWithProviders(<VariantGalleryGrid loading={true} />);

      const grid = screen.queryByRole('grid');
      expect(grid).not.toBeInTheDocument();
    });

    it('renders region with variant gallery label when loading', () => {
      renderWithProviders(<VariantGalleryGrid loading={true} />);

      const region = screen.getByRole('region', { name: /variant gallery/i });
      expect(region).toBeInTheDocument();
    });
  });

  describe('diff toggle', () => {
    it('renders the diff toggle when showDiffToggle is true', () => {
      renderWithProviders(
        <VariantGalleryGrid
          variants={generatedVariants}
          canonicalPdp={canonicalPdp}
          showDiffToggle={true}
        />,
      );

      const diffToggle = screen.getByRole('switch');
      expect(diffToggle).toBeInTheDocument();
    });

    it('does not render the diff toggle when showDiffToggle is false', () => {
      renderWithProviders(
        <VariantGalleryGrid
          variants={generatedVariants}
          canonicalPdp={canonicalPdp}
          showDiffToggle={false}
        />,
      );

      const diffToggle = screen.queryByRole('switch');
      expect(diffToggle).not.toBeInTheDocument();
    });

    it('renders diff toggle with Diff Highlighting label', () => {
      renderWithProviders(
        <VariantGalleryGrid
          variants={generatedVariants}
          canonicalPdp={canonicalPdp}
          showDiffToggle={true}
        />,
      );

      expect(screen.getByText('Diff Highlighting')).toBeInTheDocument();
    });

    it('diff toggle is initially off', () => {
      renderWithProviders(
        <VariantGalleryGrid
          variants={generatedVariants}
          canonicalPdp={canonicalPdp}
          showDiffToggle={true}
        />,
      );

      const diffToggle = screen.getByRole('switch');
      expect(diffToggle).toHaveAttribute('aria-checked', 'false');
    });

    it('clicking diff toggle changes its state', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <VariantGalleryGrid
          variants={generatedVariants}
          canonicalPdp={canonicalPdp}
          showDiffToggle={true}
        />,
      );

      const diffToggle = screen.getByRole('switch');
      expect(diffToggle).toHaveAttribute('aria-checked', 'false');

      await user.click(diffToggle);

      expect(diffToggle).toHaveAttribute('aria-checked', 'true');
    });

    it('diff toggle shows Off status badge when disabled', () => {
      renderWithProviders(
        <VariantGalleryGrid
          variants={generatedVariants}
          canonicalPdp={canonicalPdp}
          showDiffToggle={true}
        />,
      );

      expect(screen.getByText('Off')).toBeInTheDocument();
    });

    it('diff toggle shows On status badge when enabled', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <VariantGalleryGrid
          variants={generatedVariants}
          canonicalPdp={canonicalPdp}
          showDiffToggle={true}
        />,
      );

      const diffToggle = screen.getByRole('switch');
      await user.click(diffToggle);

      expect(screen.getByText('On')).toBeInTheDocument();
    });

    it('diff toggle is disabled when there are no variants', () => {
      renderWithProviders(
        <VariantGalleryGrid
          variants={[]}
          showDiffToggle={true}
        />,
      );

      // Empty state does not render the toggle at all
      const diffToggle = screen.queryByRole('switch');
      expect(diffToggle).not.toBeInTheDocument();
    });
  });

  describe('variant cards', () => {
    it('each variant card is rendered as an article', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      const articles = screen.getAllByRole('article');
      expect(articles.length).toBe(10);
    });

    it('each variant card has an accessible label', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      const articles = screen.getAllByRole('article');
      articles.forEach((article) => {
        expect(article).toHaveAttribute('aria-label');
        expect(article.getAttribute('aria-label')).toContain('Variant card');
      });
    });

    it('each variant card is focusable with tabindex 0', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      const articles = screen.getAllByRole('article');
      articles.forEach((article) => {
        expect(article).toHaveAttribute('tabindex', '0');
      });
    });

    it('variant cards display View Details link text', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      const viewDetailsLinks = screen.getAllByText('View Details');
      expect(viewDetailsLinks.length).toBe(10);
    });

    it('control variant card shows Control badge', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      const controlBadges = screen.getAllByText('Control');
      expect(controlBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('renders variant labels from generated data', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      const firstLabel = generatedVariants[0].label;
      expect(screen.getByText(firstLabel)).toBeInTheDocument();
    });
  });

  describe('with fewer variants', () => {
    it('renders correct number of cards for 3 variants', () => {
      const threeVariants = generatedVariants.slice(0, 3);

      renderWithProviders(
        <VariantGalleryGrid variants={threeVariants} canonicalPdp={canonicalPdp} />,
      );

      const grid = screen.getByRole('grid');
      const gridcells = within(grid).getAllByRole('gridcell');
      expect(gridcells.length).toBe(3);
    });

    it('renders correct count badge for 1 variant', () => {
      const oneVariant = generatedVariants.slice(0, 1);

      renderWithProviders(
        <VariantGalleryGrid variants={oneVariant} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText(`1/${MAX_VARIANTS} variant`)).toBeInTheDocument();
    });

    it('renders correct description for 1 variant', () => {
      const oneVariant = generatedVariants.slice(0, 1);

      renderWithProviders(
        <VariantGalleryGrid variants={oneVariant} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText(/1 variant generated/i)).toBeInTheDocument();
    });
  });

  describe('keyboard navigation', () => {
    it('grid responds to keyboard events without errors', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      const grid = screen.getByRole('grid');
      const firstArticle = screen.getAllByRole('article')[0];

      firstArticle.focus();

      // Should not throw
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowLeft}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowUp}');
      await user.keyboard('{Home}');
      await user.keyboard('{End}');

      expect(grid).toBeInTheDocument();
    });

    it('variant cards can receive focus', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      const articles = screen.getAllByRole('article');
      articles[0].focus();
      expect(articles[0]).toHaveFocus();
    });
  });

  describe('responsive grid layout', () => {
    it('grid container has responsive grid classes', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      const grid = screen.getByRole('grid');
      expect(grid.className).toContain('grid');
      expect(grid.className).toContain('grid-cols-1');
      expect(grid.className).toContain('sm:grid-cols-2');
      expect(grid.className).toContain('lg:grid-cols-3');
      expect(grid.className).toContain('xl:grid-cols-4');
    });

    it('grid has gap classes for spacing', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      const grid = screen.getByRole('grid');
      expect(grid.className).toContain('gap-');
    });
  });

  describe('accessibility', () => {
    it('has an accessible region landmark', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      const region = screen.getByRole('region', { name: /variant gallery/i });
      expect(region).toBeInTheDocument();
    });

    it('grid has role="grid" attribute', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      const grid = screen.getByRole('grid');
      expect(grid).toBeInTheDocument();
    });

    it('each grid cell has role="gridcell"', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      const gridcells = screen.getAllByRole('gridcell');
      expect(gridcells.length).toBe(10);
    });

    it('diff toggle has aria-checked attribute', () => {
      renderWithProviders(
        <VariantGalleryGrid
          variants={generatedVariants}
          canonicalPdp={canonicalPdp}
          showDiffToggle={true}
        />,
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-checked');
    });

    it('diff toggle has aria-labelledby attribute', () => {
      renderWithProviders(
        <VariantGalleryGrid
          variants={generatedVariants}
          canonicalPdp={canonicalPdp}
          showDiffToggle={true}
        />,
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-labelledby');
    });

    it('diff toggle has aria-describedby attribute', () => {
      renderWithProviders(
        <VariantGalleryGrid
          variants={generatedVariants}
          canonicalPdp={canonicalPdp}
          showDiffToggle={true}
        />,
      );

      const toggle = screen.getByRole('switch');
      expect(toggle).toHaveAttribute('aria-describedby');
    });

    it('renders status region for screen reader announcements', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toBeInTheDocument();
    });

    it('control variant info is mentioned in footer', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText(/control variant included/i)).toBeInTheDocument();
    });
  });

  describe('control variant detection', () => {
    it('detects control variant from variants array', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText(/control variant included/i)).toBeInTheDocument();
    });

    it('does not show control variant text when no control variant exists', () => {
      const noControlVariants = generatedVariants.map((v) => ({
        ...v,
        controlFlag: false,
      }));

      renderWithProviders(
        <VariantGalleryGrid variants={noControlVariants} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.queryByText(/control variant included/i)).not.toBeInTheDocument();
    });
  });

  describe('max variants enforcement', () => {
    it('renders at most MAX_VARIANTS cards even if more are provided', () => {
      const extraVariants = [
        ...generatedVariants,
        ...generatedVariants.slice(0, 3).map((v, i) => ({
          ...v,
          variantId: `extra-variant-${i}`,
          id: `extra-variant-${i}`,
        })),
      ];

      expect(extraVariants.length).toBeGreaterThan(MAX_VARIANTS);

      renderWithProviders(
        <VariantGalleryGrid variants={extraVariants} canonicalPdp={canonicalPdp} />,
      );

      const grid = screen.getByRole('grid');
      const gridcells = within(grid).getAllByRole('gridcell');
      expect(gridcells.length).toBeLessThanOrEqual(MAX_VARIANTS);
    });
  });

  describe('edge cases', () => {
    it('renders without canonicalPdp prop', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} />,
      );

      const grid = screen.getByRole('grid');
      expect(grid).toBeInTheDocument();
    });

    it('renders with empty className', () => {
      renderWithProviders(
        <VariantGalleryGrid
          variants={generatedVariants}
          canonicalPdp={canonicalPdp}
          className=""
        />,
      );

      const region = screen.getByRole('region', { name: /variant gallery/i });
      expect(region).toBeInTheDocument();
    });

    it('renders with undefined className', () => {
      renderWithProviders(
        <VariantGalleryGrid
          variants={generatedVariants}
          canonicalPdp={canonicalPdp}
          className={undefined}
        />,
      );

      const region = screen.getByRole('region', { name: /variant gallery/i });
      expect(region).toBeInTheDocument();
    });

    it('handles null variants gracefully', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={null} />,
      );

      const region = screen.getByRole('region', { name: /variant gallery/i });
      expect(region).toBeInTheDocument();
    });

    it('handles undefined variants gracefully', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={undefined} />,
      );

      const region = screen.getByRole('region', { name: /variant gallery/i });
      expect(region).toBeInTheDocument();
    });

    it('renders correctly with loading false and variants present', () => {
      renderWithProviders(
        <VariantGalleryGrid
          variants={generatedVariants}
          canonicalPdp={canonicalPdp}
          loading={false}
        />,
      );

      const grid = screen.getByRole('grid');
      const gridcells = within(grid).getAllByRole('gridcell');
      expect(gridcells.length).toBe(10);
    });

    it('renders correctly with showDiffToggle defaulting to true', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      const diffToggle = screen.getByRole('switch');
      expect(diffToggle).toBeInTheDocument();
    });
  });

  describe('diff highlighting integration', () => {
    it('shows diff highlighting enabled text after toggling diff on', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <VariantGalleryGrid
          variants={generatedVariants}
          canonicalPdp={canonicalPdp}
          showDiffToggle={true}
        />,
      );

      const diffToggle = screen.getByRole('switch');
      await user.click(diffToggle);

      expect(screen.getByText(/diff highlighting enabled/i)).toBeInTheDocument();
    });

    it('footer shows diff from control text when diff is enabled', async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <VariantGalleryGrid
          variants={generatedVariants}
          canonicalPdp={canonicalPdp}
          showDiffToggle={true}
        />,
      );

      const diffToggle = screen.getByRole('switch');
      await user.click(diffToggle);

      expect(screen.getByText(/diff from control enabled/i)).toBeInTheDocument();
    });
  });

  describe('gallery header', () => {
    it('renders gallery icon', () => {
      renderWithProviders(
        <VariantGalleryGrid variants={generatedVariants} canonicalPdp={canonicalPdp} />,
      );

      const region = screen.getByRole('region', { name: /variant gallery/i });
      const svgs = region.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('renders variant count badge with correct format', () => {
      const fiveVariants = generatedVariants.slice(0, 5);

      renderWithProviders(
        <VariantGalleryGrid variants={fiveVariants} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText(`5/${MAX_VARIANTS} variants`)).toBeInTheDocument();
    });
  });
});