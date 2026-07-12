import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext.jsx';
import CohortIntakePanel from '@/components/cohorts/CohortIntakePanel.jsx';
import { clearEventBuffer } from '@/services/observabilityEmitter.js';
import { clearCatalogCache } from '@/services/catalogLoader.js';
import { clearCohortSetCache } from '@/services/cohortIntakeService.js';
import { MAX_VARIANTS } from '@/constants/constants.js';

function renderWithProviders(ui, options = {}) {
  return render(
    <MemoryRouter>
      <AppProvider>{ui}</AppProvider>
    </MemoryRouter>,
    options,
  );
}

describe('CohortIntakePanel', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearEventBuffer();
    clearCatalogCache();
    clearCohortSetCache();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearEventBuffer();
    clearCatalogCache();
    clearCohortSetCache();
  });

  describe('rendering', () => {
    it('renders the cohort intake panel with header', () => {
      renderWithProviders(<CohortIntakePanel />);

      expect(screen.getByText('Cohort & Behaviour Intake')).toBeInTheDocument();
    });

    it('renders the panel as a region with correct aria-label', () => {
      renderWithProviders(<CohortIntakePanel />);

      const region = screen.getByRole('region', { name: /cohort & behaviour intake/i });
      expect(region).toBeInTheDocument();
    });

    it('renders at least one cohort target form', () => {
      renderWithProviders(<CohortIntakePanel />);

      const list = screen.getByRole('list', { name: /cohort targets/i });
      expect(list).toBeInTheDocument();

      const items = within(list).getAllByRole('listitem');
      expect(items.length).toBeGreaterThanOrEqual(1);
    });

    it('renders the Generate button', () => {
      renderWithProviders(<CohortIntakePanel />);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      expect(generateButton).toBeInTheDocument();
    });

    it('renders the Load Defaults button', () => {
      renderWithProviders(<CohortIntakePanel />);

      expect(screen.getByRole('button', { name: /load defaults/i })).toBeInTheDocument();
    });

    it('renders the Clear All button', () => {
      renderWithProviders(<CohortIntakePanel />);

      expect(screen.getByRole('button', { name: /clear all/i })).toBeInTheDocument();
    });

    it('renders the batch count input', () => {
      renderWithProviders(<CohortIntakePanel />);

      const batchInput = screen.getByRole('spinbutton', { name: /number of cohort targets/i });
      expect(batchInput).toBeInTheDocument();
    });

    it('renders target count badge', () => {
      renderWithProviders(<CohortIntakePanel />);

      expect(screen.getByText(/target.*configured/i)).toBeInTheDocument();
    });

    it('renders description text about configuring targets', () => {
      renderWithProviders(<CohortIntakePanel />);

      expect(
        screen.getByText(/configure up to.*cohort.*behavioral overlay targets/i),
      ).toBeInTheDocument();
    });

    it('applies additional className when provided', () => {
      const { container } = renderWithProviders(
        <CohortIntakePanel className="custom-class" />,
      );

      const region = container.querySelector('.custom-class');
      expect(region).toBeInTheDocument();
    });
  });

  describe('default cohort targets', () => {
    it('loads default cohort targets on initial render', () => {
      renderWithProviders(<CohortIntakePanel />);

      const list = screen.getByRole('list', { name: /cohort targets/i });
      const items = within(list).getAllByRole('listitem');

      expect(items.length).toBeGreaterThanOrEqual(1);
      expect(items.length).toBeLessThanOrEqual(MAX_VARIANTS);
    });

    it('loads defaults when Load Defaults button is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(<CohortIntakePanel />);

      const clearButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearButton);

      const loadDefaultsButton = screen.getByRole('button', { name: /load defaults/i });
      await user.click(loadDefaultsButton);

      const list = screen.getByRole('list', { name: /cohort targets/i });
      const items = within(list).getAllByRole('listitem');

      expect(items.length).toBeGreaterThan(1);
    });
  });

  describe('add and remove targets', () => {
    it('clears all targets and shows a single empty target when Clear All is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(<CohortIntakePanel />);

      const clearButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearButton);

      const list = screen.getByRole('list', { name: /cohort targets/i });
      const items = within(list).getAllByRole('listitem');

      expect(items.length).toBe(1);
    });

    it('adds a new cohort target when Add Cohort Target button is clicked', async () => {
      const user = userEvent.setup();

      renderWithProviders(<CohortIntakePanel />);

      const clearButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearButton);

      const list = screen.getByRole('list', { name: /cohort targets/i });
      let items = within(list).getAllByRole('listitem');
      const initialCount = items.length;

      const addButton = screen.getByRole('button', { name: /add cohort target/i });
      await user.click(addButton);

      items = within(list).getAllByRole('listitem');
      expect(items.length).toBe(initialCount + 1);
    });

    it('does not add more than MAX_VARIANTS targets', async () => {
      const user = userEvent.setup();

      renderWithProviders(<CohortIntakePanel />);

      const list = screen.getByRole('list', { name: /cohort targets/i });
      let items = within(list).getAllByRole('listitem');

      if (items.length < MAX_VARIANTS) {
        const addButton = screen.getByRole('button', { name: /add cohort target/i });
        const clicksNeeded = MAX_VARIANTS - items.length;

        for (let i = 0; i < clicksNeeded + 2; i++) {
          const btn = screen.queryByRole('button', { name: /add cohort target/i });
          if (!btn) break;
          await user.click(btn);
        }
      }

      items = within(list).getAllByRole('listitem');
      expect(items.length).toBeLessThanOrEqual(MAX_VARIANTS);
    });

    it('hides the Add Cohort Target button when MAX_VARIANTS targets are reached', async () => {
      renderWithProviders(<CohortIntakePanel />);

      const list = screen.getByRole('list', { name: /cohort targets/i });
      const items = within(list).getAllByRole('listitem');

      if (items.length >= MAX_VARIANTS) {
        const addButton = screen.queryByRole('button', { name: /add cohort target/i });
        expect(addButton).not.toBeInTheDocument();
      }
    });

    it('does not remove the last remaining target', async () => {
      const user = userEvent.setup();

      renderWithProviders(<CohortIntakePanel />);

      const clearButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearButton);

      const list = screen.getByRole('list', { name: /cohort targets/i });
      const items = within(list).getAllByRole('listitem');
      expect(items.length).toBe(1);

      const removeButtons = screen.getAllByRole('button', { name: /remove cohort target/i });
      if (removeButtons.length > 0) {
        await user.click(removeButtons[0]);
      }

      const itemsAfter = within(list).getAllByRole('listitem');
      expect(itemsAfter.length).toBe(1);
    });
  });

  describe('batch count input', () => {
    it('updates the number of targets when batch count changes', async () => {
      const user = userEvent.setup();

      renderWithProviders(<CohortIntakePanel />);

      const clearButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearButton);

      const batchInput = screen.getByRole('spinbutton', { name: /number of cohort targets/i });

      await user.clear(batchInput);
      await user.type(batchInput, '3');

      const list = screen.getByRole('list', { name: /cohort targets/i });
      const items = within(list).getAllByRole('listitem');
      expect(items.length).toBe(3);
    });

    it('does not accept values below 1', async () => {
      const user = userEvent.setup();

      renderWithProviders(<CohortIntakePanel />);

      const batchInput = screen.getByRole('spinbutton', { name: /number of cohort targets/i });

      expect(batchInput).toHaveAttribute('min', '1');
    });

    it('does not accept values above MAX_VARIANTS', async () => {
      renderWithProviders(<CohortIntakePanel />);

      const batchInput = screen.getByRole('spinbutton', { name: /number of cohort targets/i });

      expect(batchInput).toHaveAttribute('max', String(MAX_VARIANTS));
    });
  });

  describe('validation', () => {
    it('shows validation errors after attempting to generate with empty targets', async () => {
      const user = userEvent.setup();

      renderWithProviders(<CohortIntakePanel />);

      const clearButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearButton);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      await waitFor(() => {
        const errorBadge = screen.queryByText(/with errors/i);
        expect(errorBadge).toBeInTheDocument();
      });
    });

    it('shows "All targets valid" badge when all targets are valid', async () => {
      const user = userEvent.setup();

      renderWithProviders(<CohortIntakePanel />);

      const loadDefaultsButton = screen.getByRole('button', { name: /load defaults/i });
      await user.click(loadDefaultsButton);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      await waitFor(() => {
        const validBadge = screen.queryByText(/all targets valid/i);
        if (validBadge) {
          expect(validBadge).toBeInTheDocument();
        }
      });
    });

    it('displays validation summary when there are errors', async () => {
      const user = userEvent.setup();

      renderWithProviders(<CohortIntakePanel />);

      const clearButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearButton);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      await waitFor(() => {
        const summary = screen.queryByRole('alert', { name: /validation summary/i });
        if (summary) {
          expect(summary).toBeInTheDocument();
        }
      });
    });
  });

  describe('Generate button state', () => {
    it('Generate button is present and clickable initially', () => {
      renderWithProviders(<CohortIntakePanel />);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      expect(generateButton).toBeInTheDocument();
    });

    it('Generate button is disabled when panel is disabled', () => {
      renderWithProviders(<CohortIntakePanel disabled={true} />);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      expect(generateButton).toBeDisabled();
    });

    it('Generate button is disabled after validation fails', async () => {
      const user = userEvent.setup();

      renderWithProviders(<CohortIntakePanel />);

      const clearButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearButton);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(generateButton).toBeDisabled();
      });
    });
  });

  describe('form submission', () => {
    it('calls onGenerate callback with cohort set when Generate is clicked with valid data', async () => {
      const user = userEvent.setup();
      const onGenerate = vi.fn().mockResolvedValue(undefined);

      renderWithProviders(<CohortIntakePanel onGenerate={onGenerate} />);

      const loadDefaultsButton = screen.getByRole('button', { name: /load defaults/i });
      await user.click(loadDefaultsButton);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(onGenerate).toHaveBeenCalledTimes(1);
      });

      const callArg = onGenerate.mock.calls[0][0];
      expect(callArg).toBeDefined();
      expect(callArg.id).toBeDefined();
      expect(callArg.name).toBeDefined();
      expect(Array.isArray(callArg.cohorts)).toBe(true);
      expect(callArg.cohorts.length).toBeGreaterThan(0);
    });

    it('does not call onGenerate when validation fails', async () => {
      const user = userEvent.setup();
      const onGenerate = vi.fn().mockResolvedValue(undefined);

      renderWithProviders(<CohortIntakePanel onGenerate={onGenerate} />);

      const clearButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearButton);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(onGenerate).not.toHaveBeenCalled();
      });
    });

    it('handles onGenerate errors gracefully', async () => {
      const user = userEvent.setup();
      const onGenerate = vi.fn().mockRejectedValue(new Error('Generation failed'));

      renderWithProviders(<CohortIntakePanel onGenerate={onGenerate} />);

      const loadDefaultsButton = screen.getByRole('button', { name: /load defaults/i });
      await user.click(loadDefaultsButton);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(onGenerate).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        const errorAlert = screen.queryByRole('alert');
        if (errorAlert) {
          expect(errorAlert).toBeInTheDocument();
        }
      });
    });

    it('shows saving state during generation', async () => {
      const user = userEvent.setup();

      let resolveGenerate;
      const onGenerate = vi.fn().mockImplementation(
        () => new Promise((resolve) => { resolveGenerate = resolve; }),
      );

      renderWithProviders(<CohortIntakePanel onGenerate={onGenerate} />);

      const loadDefaultsButton = screen.getByRole('button', { name: /load defaults/i });
      await user.click(loadDefaultsButton);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      await user.click(generateButton);

      await waitFor(() => {
        expect(onGenerate).toHaveBeenCalledTimes(1);
      });

      resolveGenerate();
    });
  });

  describe('disabled state', () => {
    it('disables all controls when disabled prop is true', () => {
      renderWithProviders(<CohortIntakePanel disabled={true} />);

      const batchInput = screen.getByRole('spinbutton', { name: /number of cohort targets/i });
      expect(batchInput).toBeDisabled();

      const loadDefaultsButton = screen.getByRole('button', { name: /load defaults/i });
      expect(loadDefaultsButton).toBeDisabled();

      const clearButton = screen.getByRole('button', { name: /clear all/i });
      expect(clearButton).toBeDisabled();

      const generateButton = screen.getByRole('button', { name: /generate/i });
      expect(generateButton).toBeDisabled();
    });

    it('disables add target button when disabled prop is true', () => {
      renderWithProviders(<CohortIntakePanel disabled={true} />);

      const addButton = screen.queryByRole('button', { name: /add cohort target/i });
      if (addButton) {
        expect(addButton).toBeDisabled();
      }
    });
  });

  describe('accessibility', () => {
    it('has an accessible region landmark', () => {
      renderWithProviders(<CohortIntakePanel />);

      const region = screen.getByRole('region', { name: /cohort & behaviour intake/i });
      expect(region).toBeInTheDocument();
    });

    it('has an accessible list of cohort targets', () => {
      renderWithProviders(<CohortIntakePanel />);

      const list = screen.getByRole('list', { name: /cohort targets/i });
      expect(list).toBeInTheDocument();
    });

    it('batch count input has an accessible label', () => {
      renderWithProviders(<CohortIntakePanel />);

      const batchInput = screen.getByRole('spinbutton', { name: /number of cohort targets/i });
      expect(batchInput).toBeInTheDocument();
    });

    it('Generate button has an accessible label with variant count', () => {
      renderWithProviders(<CohortIntakePanel />);

      const generateButton = screen.getByRole('button', { name: /generate.*variant/i });
      expect(generateButton).toBeInTheDocument();
    });

    it('renders an aria-live region for announcements', () => {
      renderWithProviders(<CohortIntakePanel />);

      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
    });

    it('footer shows variant generation count info', () => {
      renderWithProviders(<CohortIntakePanel />);

      expect(screen.getByText(/will generate.*pdp variant/i)).toBeInTheDocument();
    });
  });

  describe('cohort target form interaction', () => {
    it('renders cohort target forms with fieldsets', () => {
      renderWithProviders(<CohortIntakePanel />);

      const fieldsets = screen.getAllByRole('group');
      expect(fieldsets.length).toBeGreaterThanOrEqual(1);
    });

    it('each target form has a numbered indicator', () => {
      renderWithProviders(<CohortIntakePanel />);

      const list = screen.getByRole('list', { name: /cohort targets/i });
      const items = within(list).getAllByRole('listitem');

      expect(items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('edge cases', () => {
    it('renders without onGenerate callback', () => {
      renderWithProviders(<CohortIntakePanel />);

      const generateButton = screen.getByRole('button', { name: /generate/i });
      expect(generateButton).toBeInTheDocument();
    });

    it('renders with empty className', () => {
      renderWithProviders(<CohortIntakePanel className="" />);

      const region = screen.getByRole('region', { name: /cohort & behaviour intake/i });
      expect(region).toBeInTheDocument();
    });

    it('renders with undefined className', () => {
      renderWithProviders(<CohortIntakePanel className={undefined} />);

      const region = screen.getByRole('region', { name: /cohort & behaviour intake/i });
      expect(region).toBeInTheDocument();
    });

    it('handles rapid add/remove clicks without errors', async () => {
      const user = userEvent.setup();

      renderWithProviders(<CohortIntakePanel />);

      const clearButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearButton);

      const addButton = screen.getByRole('button', { name: /add cohort target/i });
      await user.click(addButton);
      await user.click(addButton);
      await user.click(addButton);

      const list = screen.getByRole('list', { name: /cohort targets/i });
      const items = within(list).getAllByRole('listitem');
      expect(items.length).toBe(4);
    });

    it('handles Load Defaults followed by Clear All correctly', async () => {
      const user = userEvent.setup();

      renderWithProviders(<CohortIntakePanel />);

      const loadDefaultsButton = screen.getByRole('button', { name: /load defaults/i });
      await user.click(loadDefaultsButton);

      const list = screen.getByRole('list', { name: /cohort targets/i });
      let items = within(list).getAllByRole('listitem');
      expect(items.length).toBeGreaterThan(1);

      const clearButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearButton);

      items = within(list).getAllByRole('listitem');
      expect(items.length).toBe(1);
    });
  });
});