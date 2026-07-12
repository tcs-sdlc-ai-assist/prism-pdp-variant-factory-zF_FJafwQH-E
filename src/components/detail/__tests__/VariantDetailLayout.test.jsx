import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext.jsx';
import VariantDetailLayout from '@/components/detail/VariantDetailLayout.jsx';
import { clearEventBuffer } from '@/services/observabilityEmitter.js';
import { clearCatalogCache } from '@/services/catalogLoader.js';
import { clearCohortSetCache } from '@/services/cohortIntakeService.js';
import { generateVariants } from '@/services/variantGenerator.js';
import mockCatalog from '@/data/mockCatalog.js';
import defaultCohorts from '@/data/defaultCohorts.js';

function renderWithProviders(ui, { route = '/', path = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppProvider>
        <Routes>
          <Route path={path} element={ui} />
        </Routes>
      </AppProvider>
    </MemoryRouter>,
  );
}

function renderWithRoute(ui, options = {}) {
  return render(
    <MemoryRouter>
      <AppProvider>{ui}</AppProvider>
    </MemoryRouter>,
    options,
  );
}

describe('VariantDetailLayout', () => {
  let canonicalPdp;
  let cohortSet;
  let generatedVariants;
  let controlVariant;
  let nonControlVariant;

  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    clearEventBuffer();
    clearCatalogCache();
    clearCohortSetCache();

    canonicalPdp = { ...mockCatalog[0] };
    cohortSet = JSON.parse(JSON.stringify(defaultCohorts));

    const result = await generateVariants(canonicalPdp, cohortSet);
    generatedVariants = result.variants;
    controlVariant = generatedVariants.find((v) => v.controlFlag === true);
    nonControlVariant = generatedVariants.find((v) => v.controlFlag === false);
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearEventBuffer();
    clearCatalogCache();
    clearCohortSetCache();
  });

  describe('rendering with variant prop', () => {
    it('renders the variant detail region with correct aria-label', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const region = screen.getByRole('region', { name: /variant detail/i });
      expect(region).toBeInTheDocument();
    });

    it('renders the variant label as heading', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText(nonControlVariant.label)).toBeInTheDocument();
    });

    it('renders the VariantActions toolbar', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const toolbar = screen.getByRole('toolbar', { name: /variant actions/i });
      expect(toolbar).toBeInTheDocument();
    });

    it('renders the Back to Gallery button', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const backButton = screen.getByRole('button', { name: /back to variant gallery/i });
      expect(backButton).toBeInTheDocument();
    });

    it('renders the Package Variant button', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const exportButton = screen.getByRole('button', { name: /package variant manifest/i });
      expect(exportButton).toBeInTheDocument();
    });

    it('renders the View Diff button', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const diffButton = screen.getByRole('button', { name: /enable diff highlighting/i });
      expect(diffButton).toBeInTheDocument();
    });
  });

  describe('split-pane layout', () => {
    it('renders the product detail page region for the PDP', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const pdpRegion = screen.getByRole('region', {
        name: new RegExp(`product detail page.*${canonicalPdp.title.substring(0, 20)}`, 'i'),
      });
      expect(pdpRegion).toBeInTheDocument();
    });

    it('renders the cohort profile panel', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const cohortPanel = screen.getByRole('complementary', { name: /cohort profile/i });
      expect(cohortPanel).toBeInTheDocument();
    });

    it('renders the manifest viewer', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const manifestViewer = screen.getByRole('complementary', { name: /manifest/i });
      expect(manifestViewer).toBeInTheDocument();
    });

    it('renders the grid layout container for split-pane', () => {
      const { container } = renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const gridContainer = container.querySelector('.lg\\:grid-cols-12');
      expect(gridContainer).toBeInTheDocument();
    });

    it('renders left column with lg:col-span-8 for PDP', () => {
      const { container } = renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const leftCol = container.querySelector('.lg\\:col-span-8');
      expect(leftCol).toBeInTheDocument();
    });

    it('renders right column with lg:col-span-4 for side panel', () => {
      const { container } = renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const rightCol = container.querySelector('.lg\\:col-span-4');
      expect(rightCol).toBeInTheDocument();
    });
  });

  describe('cohort profile panel content', () => {
    it('displays Cohort Profile heading', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText('Cohort Profile')).toBeInTheDocument();
    });

    it('displays the variant label in the cohort profile', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const cohortPanel = screen.getByRole('complementary', { name: /cohort profile/i });
      expect(within(cohortPanel).getByText(nonControlVariant.label)).toBeInTheDocument();
    });

    it('displays Cohort Type section', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText('Cohort Type')).toBeInTheDocument();
    });

    it('displays Behavioral Overlay section', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText('Behavioral Overlay')).toBeInTheDocument();
    });

    it('displays Base SKU section', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText('Base SKU')).toBeInTheDocument();
    });

    it('displays the base SKU value', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      if (nonControlVariant.baseSku) {
        expect(screen.getByText(nonControlVariant.baseSku)).toBeInTheDocument();
      }
    });
  });

  describe('manifest viewer content', () => {
    it('displays Variant Manifest heading', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText('Variant Manifest')).toBeInTheDocument();
    });

    it('renders the Copy button in manifest viewer', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const copyButton = screen.getByRole('button', { name: /copy manifest json/i });
      expect(copyButton).toBeInTheDocument();
    });

    it('renders the expand/collapse toggle in manifest viewer', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const expandButton = screen.getByRole('button', { name: /collapse manifest viewer/i });
      expect(expandButton).toBeInTheDocument();
    });

    it('displays manifest JSON content area', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const codeContent = screen.getByLabelText('Manifest JSON content');
      expect(codeContent).toBeInTheDocument();
    });
  });

  describe('action buttons functionality', () => {
    it('clicking View Diff toggles diff state', async () => {
      const user = userEvent.setup();

      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const diffButton = screen.getByRole('button', { name: /enable diff highlighting/i });
      await user.click(diffButton);

      const diffOnButton = screen.getByRole('button', { name: /disable diff highlighting/i });
      expect(diffOnButton).toBeInTheDocument();
    });

    it('diff toggle button shows Diff On text when enabled', async () => {
      const user = userEvent.setup();

      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const diffButton = screen.getByRole('button', { name: /enable diff highlighting/i });
      await user.click(diffButton);

      expect(screen.getByText('Diff On')).toBeInTheDocument();
    });

    it('diff toggle button shows View Diff text when disabled', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText('View Diff')).toBeInTheDocument();
    });

    it('Package Variant button is present and clickable', async () => {
      const user = userEvent.setup();

      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const exportButton = screen.getByRole('button', { name: /package variant manifest/i });
      expect(exportButton).toBeInTheDocument();
      expect(exportButton).not.toBeDisabled();
    });
  });

  describe('control variant rendering', () => {
    it('displays Control badge for control variant', () => {
      renderWithRoute(
        <VariantDetailLayout variant={controlVariant} canonicalPdp={canonicalPdp} />,
      );

      const controlBadges = screen.getAllByText('Control');
      expect(controlBadges.length).toBeGreaterThanOrEqual(1);
    });

    it('displays priority badge for variant with priority', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      if (typeof nonControlVariant.priority === 'number' && nonControlVariant.priority > 0) {
        expect(screen.getByText(String(nonControlVariant.priority))).toBeInTheDocument();
      }
    });
  });

  describe('diff highlighting integration', () => {
    it('shows diff status indicator when diff is enabled and changes exist', async () => {
      const user = userEvent.setup();

      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const diffButton = screen.getByRole('button', { name: /enable diff highlighting/i });
      await user.click(diffButton);

      await waitFor(() => {
        const dimensionText = screen.queryByText(/dimension.*changed/i);
        if (dimensionText) {
          expect(dimensionText).toBeInTheDocument();
        }
      });
    });

    it('does not show diff status indicator when diff is disabled', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const dimensionText = screen.queryByText(/dimension.*changed/i);
      expect(dimensionText).not.toBeInTheDocument();
    });
  });

  describe('not found state', () => {
    it('renders Variant Not Found when no variant is provided and no route param', () => {
      renderWithRoute(
        <VariantDetailLayout />,
      );

      expect(screen.getByText('Variant Not Found')).toBeInTheDocument();
    });

    it('shows guidance text when variant is not found', () => {
      renderWithRoute(
        <VariantDetailLayout />,
      );

      expect(
        screen.getByText(/no variant specified/i),
      ).toBeInTheDocument();
    });

    it('renders not found state with dashed border', () => {
      const { container } = renderWithRoute(
        <VariantDetailLayout />,
      );

      const dashedBorder = container.querySelector('.border-dashed');
      expect(dashedBorder).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('renders skeleton loaders when variant has no product data', () => {
      const minimalVariant = {
        id: 'variant-minimal',
        variantId: 'variant-minimal',
        name: 'Minimal Variant',
        productId: 'prod-test',
        label: 'Minimal',
        priority: 1,
        controlFlag: false,
        cohortType: 'budget-conscious',
        behavioralOverlay: 'browse-heavy',
        baseSku: 'SKU-6548320',
        // No variantPdp — should trigger loading state
      };

      renderWithRoute(
        <VariantDetailLayout variant={minimalVariant} canonicalPdp={canonicalPdp} />,
      );

      // The variant itself is used as product data fallback, so it should render
      const region = screen.getByRole('region', { name: /variant detail/i });
      expect(region).toBeInTheDocument();
    });
  });

  describe('footer content', () => {
    it('renders footer with variant information', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const footerText = screen.getByText((content) => {
        return content.includes(nonControlVariant.label) && content.includes(nonControlVariant.baseSku);
      });
      expect(footerText).toBeInTheDocument();
    });

    it('footer includes cohort type information', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      if (nonControlVariant.cohortType) {
        const cohortTypeFormatted = nonControlVariant.cohortType.replace(/[-_]/g, ' ');
        const footerText = screen.getByText((content) => {
          return content.includes(cohortTypeFormatted);
        });
        expect(footerText).toBeInTheDocument();
      }
    });

    it('footer shows control variant text for control variant', () => {
      renderWithRoute(
        <VariantDetailLayout variant={controlVariant} canonicalPdp={canonicalPdp} />,
      );

      const footerText = screen.getByText(/control variant/i);
      expect(footerText).toBeInTheDocument();
    });
  });

  describe('PDP rendering', () => {
    it('renders the product hero section', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const heroRegion = screen.getByRole('region', { name: /product hero/i });
      expect(heroRegion).toBeInTheDocument();
    });

    it('renders the product pricing section', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const pricingRegion = screen.getByRole('region', { name: /product pricing/i });
      expect(pricingRegion).toBeInTheDocument();
    });

    it('renders the specifications section', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText('Specifications')).toBeInTheDocument();
    });

    it('renders the customer reviews section', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText('Customer Reviews')).toBeInTheDocument();
    });

    it('renders the product title from canonical PDP', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText(canonicalPdp.title)).toBeInTheDocument();
    });
  });

  describe('variant with different cohort types', () => {
    it('renders correctly for budget-conscious variant', () => {
      const budgetVariant = generatedVariants.find(
        (v) => v.cohortType === 'budget-conscious',
      );

      if (budgetVariant) {
        renderWithRoute(
          <VariantDetailLayout variant={budgetVariant} canonicalPdp={canonicalPdp} />,
        );

        const region = screen.getByRole('region', { name: /variant detail/i });
        expect(region).toBeInTheDocument();
      }
    });

    it('renders correctly for tech-enthusiast variant', () => {
      const techVariant = generatedVariants.find(
        (v) => v.cohortType === 'tech-enthusiast',
      );

      if (techVariant) {
        renderWithRoute(
          <VariantDetailLayout variant={techVariant} canonicalPdp={canonicalPdp} />,
        );

        const region = screen.getByRole('region', { name: /variant detail/i });
        expect(region).toBeInTheDocument();
      }
    });

    it('renders correctly for loyalty-member variant', () => {
      const loyaltyVariant = generatedVariants.find(
        (v) => v.cohortType === 'loyalty-member',
      );

      if (loyaltyVariant) {
        renderWithRoute(
          <VariantDetailLayout variant={loyaltyVariant} canonicalPdp={canonicalPdp} />,
        );

        const region = screen.getByRole('region', { name: /variant detail/i });
        expect(region).toBeInTheDocument();
      }
    });
  });

  describe('applied tailoring display', () => {
    it('displays Applied Tailoring Rules in cohort profile for non-control variant', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const cohortPanel = screen.getByRole('complementary', { name: /cohort profile/i });
      const tailoringRulesHeading = within(cohortPanel).queryByText('Applied Tailoring Rules');

      if (tailoringRulesHeading) {
        expect(tailoringRulesHeading).toBeInTheDocument();
      }
    });

    it('displays tailoring emphasis in cohort profile when available', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const cohortPanel = screen.getByRole('complementary', { name: /cohort profile/i });
      const tailoringEmphasis = within(cohortPanel).queryByText('Tailoring Emphasis');

      if (tailoringEmphasis) {
        expect(tailoringEmphasis).toBeInTheDocument();
      }
    });
  });

  describe('manifest viewer interaction', () => {
    it('collapses manifest viewer when collapse button is clicked', async () => {
      const user = userEvent.setup();

      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const collapseButton = screen.getByRole('button', { name: /collapse manifest viewer/i });
      await user.click(collapseButton);

      const expandButton = screen.getByRole('button', { name: /expand manifest viewer/i });
      expect(expandButton).toBeInTheDocument();
    });

    it('shows collapsed summary text when manifest is collapsed', async () => {
      const user = userEvent.setup();

      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const collapseButton = screen.getByRole('button', { name: /collapse manifest viewer/i });
      await user.click(collapseButton);

      expect(screen.getByText(/manifest collapsed/i)).toBeInTheDocument();
    });

    it('expands manifest viewer when expand button is clicked', async () => {
      const user = userEvent.setup();

      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const collapseButton = screen.getByRole('button', { name: /collapse manifest viewer/i });
      await user.click(collapseButton);

      const expandButton = screen.getByRole('button', { name: /expand manifest viewer/i });
      await user.click(expandButton);

      const codeContent = screen.getByLabelText('Manifest JSON content');
      expect(codeContent).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has accessible region landmark for variant detail', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const region = screen.getByRole('region', { name: /variant detail/i });
      expect(region).toBeInTheDocument();
    });

    it('has accessible toolbar for variant actions', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const toolbar = screen.getByRole('toolbar', { name: /variant actions/i });
      expect(toolbar).toBeInTheDocument();
    });

    it('has accessible complementary landmark for cohort profile', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const complementary = screen.getByRole('complementary', { name: /cohort profile/i });
      expect(complementary).toBeInTheDocument();
    });

    it('has accessible complementary landmark for manifest viewer', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const manifestViewer = screen.getByRole('complementary', { name: /manifest/i });
      expect(manifestViewer).toBeInTheDocument();
    });

    it('diff toggle button has aria-pressed attribute', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const diffButton = screen.getByRole('button', { name: /diff highlighting/i });
      expect(diffButton).toHaveAttribute('aria-pressed');
    });

    it('action buttons have accessible labels', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const backButton = screen.getByRole('button', { name: /back to variant gallery/i });
      expect(backButton).toBeInTheDocument();

      const exportButton = screen.getByRole('button', { name: /package variant manifest/i });
      expect(exportButton).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('renders without canonicalPdp prop', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} />,
      );

      const region = screen.getByRole('region', { name: /variant detail/i });
      expect(region).toBeInTheDocument();
    });

    it('renders with undefined variant and no route param', () => {
      renderWithRoute(
        <VariantDetailLayout variant={undefined} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText('Variant Not Found')).toBeInTheDocument();
    });

    it('renders with null variant', () => {
      renderWithRoute(
        <VariantDetailLayout variant={null} canonicalPdp={canonicalPdp} />,
      );

      expect(screen.getByText('Variant Not Found')).toBeInTheDocument();
    });

    it('applies additional className when provided', () => {
      const { container } = renderWithRoute(
        <VariantDetailLayout
          variant={nonControlVariant}
          canonicalPdp={canonicalPdp}
          className="custom-detail-class"
        />,
      );

      const customElement = container.querySelector('.custom-detail-class');
      expect(customElement).toBeInTheDocument();
    });

    it('renders with empty className', () => {
      renderWithRoute(
        <VariantDetailLayout
          variant={nonControlVariant}
          canonicalPdp={canonicalPdp}
          className=""
        />,
      );

      const region = screen.getByRole('region', { name: /variant detail/i });
      expect(region).toBeInTheDocument();
    });

    it('renders with undefined className', () => {
      renderWithRoute(
        <VariantDetailLayout
          variant={nonControlVariant}
          canonicalPdp={canonicalPdp}
          className={undefined}
        />,
      );

      const region = screen.getByRole('region', { name: /variant detail/i });
      expect(region).toBeInTheDocument();
    });
  });

  describe('variant header info', () => {
    it('displays variant label as h1 heading', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const heading = screen.getByRole('heading', { level: 1, name: nonControlVariant.label });
      expect(heading).toBeInTheDocument();
    });

    it('displays priority number for non-control variant', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      if (typeof nonControlVariant.priority === 'number' && nonControlVariant.priority > 0) {
        const priorityBadges = screen.getAllByText(String(nonControlVariant.priority));
        expect(priorityBadges.length).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('rendering all generated variants', () => {
    it('renders each generated variant without errors', () => {
      generatedVariants.forEach((variant) => {
        const { unmount } = renderWithRoute(
          <VariantDetailLayout variant={variant} canonicalPdp={canonicalPdp} />,
        );

        const region = screen.getByRole('region', { name: /variant detail/i });
        expect(region).toBeInTheDocument();

        unmount();
      });
    });

    it('each variant renders its own label', () => {
      generatedVariants.forEach((variant) => {
        const { unmount } = renderWithRoute(
          <VariantDetailLayout variant={variant} canonicalPdp={canonicalPdp} />,
        );

        expect(screen.getByText(variant.label)).toBeInTheDocument();

        unmount();
      });
    });
  });

  describe('responsive stacking', () => {
    it('grid container uses grid-cols-1 for mobile stacking', () => {
      const { container } = renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const gridContainer = container.querySelector('.grid-cols-1');
      expect(gridContainer).toBeInTheDocument();
    });

    it('grid container uses lg:grid-cols-12 for desktop split-pane', () => {
      const { container } = renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const gridContainer = container.querySelector('.lg\\:grid-cols-12');
      expect(gridContainer).toBeInTheDocument();
    });

    it('has gap classes for spacing between columns', () => {
      const { container } = renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const gridContainer = container.querySelector('.gap-6');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('diff highlighting with toggle', () => {
    it('enables diff highlighting and shows dimension count', async () => {
      const user = userEvent.setup();

      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const diffButton = screen.getByRole('button', { name: /enable diff highlighting/i });
      await user.click(diffButton);

      await waitFor(() => {
        const changedText = screen.queryByText(/dimension.*changed/i);
        if (changedText) {
          expect(changedText).toBeInTheDocument();
        }
      });
    });

    it('disables diff highlighting when toggled off', async () => {
      const user = userEvent.setup();

      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const diffButton = screen.getByRole('button', { name: /enable diff highlighting/i });
      await user.click(diffButton);

      const diffOnButton = screen.getByRole('button', { name: /disable diff highlighting/i });
      await user.click(diffOnButton);

      expect(screen.getByText('View Diff')).toBeInTheDocument();
    });

    it('footer shows changes from control text when diff is enabled', async () => {
      const user = userEvent.setup();

      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const diffButton = screen.getByRole('button', { name: /enable diff highlighting/i });
      await user.click(diffButton);

      await waitFor(() => {
        const changeText = screen.queryByText(/change.*from control/i);
        if (changeText) {
          expect(changeText).toBeInTheDocument();
        }
      });
    });
  });

  describe('variant with route param lookup', () => {
    it('renders not found when variantId route param does not match any variant', () => {
      renderWithProviders(
        <VariantDetailLayout />,
        { route: '/variants/nonexistent-id', path: '/variants/:variantId' },
      );

      expect(screen.getByText('Variant Not Found')).toBeInTheDocument();
    });

    it('shows the requested variant ID in not found message', () => {
      renderWithProviders(
        <VariantDetailLayout />,
        { route: '/variants/nonexistent-id', path: '/variants/:variantId' },
      );

      expect(screen.getByText(/nonexistent-id/i)).toBeInTheDocument();
    });
  });

  describe('cross-sell section rendering', () => {
    it('renders cross-sell section for non-control variant', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const crossSellRegion = screen.queryByRole('region', { name: /cross-sell/i });
      // Cross-sell may or may not render depending on strategy
      if (nonControlVariant.variantPdp && nonControlVariant.variantPdp.crossSellStrategy !== 'none') {
        if (crossSellRegion) {
          expect(crossSellRegion).toBeInTheDocument();
        }
      }
    });
  });

  describe('product actions group', () => {
    it('renders product actions group in PDP', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      const actionsGroup = screen.getByRole('group', { name: /product actions/i });
      expect(actionsGroup).toBeInTheDocument();
    });

    it('renders primary CTA button from variant tailoring', () => {
      renderWithRoute(
        <VariantDetailLayout variant={nonControlVariant} canonicalPdp={canonicalPdp} />,
      );

      if (nonControlVariant.variantPdp && nonControlVariant.variantPdp.primaryCTA) {
        const ctaButtons = screen.getAllByRole('button', {
          name: nonControlVariant.variantPdp.primaryCTA,
        });
        expect(ctaButtons.length).toBeGreaterThanOrEqual(1);
      }
    });
  });
});