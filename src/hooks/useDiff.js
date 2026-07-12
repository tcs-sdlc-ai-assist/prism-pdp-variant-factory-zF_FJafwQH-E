import { useMemo } from 'react';
import { useAppContext } from '@/context/AppContext.jsx';
import { computeDiff } from '@/services/diffEngine.js';

/**
 * @typedef {import('@/services/diffEngine.js').DiffResult} DiffResult
 */

/**
 * Custom hook that computes and memoizes a diff result between a canonical PDP
 * and a variant using the diffEngine service. Also exposes the diff toggle state
 * from AppContext.
 *
 * @param {object|null} canonicalPdp - The base/control product data
 * @param {object|null} variant - The variant object (may contain variantPdp, manifest, tailoring)
 * @returns {{ diffResult: DiffResult, isDiffEnabled: boolean }}
 */
export function useDiff(canonicalPdp, variant) {
  const { diffToggle } = useAppContext();

  const diffResult = useMemo(() => {
    if (!canonicalPdp || typeof canonicalPdp !== 'object') {
      return {
        dimensions: [],
        changes: [],
        dimensionSummaries: [],
        totalChanges: 0,
        dimensionsChanged: 0,
        hasChanges: false,
        changesByDimension: {},
      };
    }

    if (!variant || typeof variant !== 'object') {
      return {
        dimensions: [],
        changes: [],
        dimensionSummaries: [],
        totalChanges: 0,
        dimensionsChanged: 0,
        hasChanges: false,
        changesByDimension: {},
      };
    }

    return computeDiff(canonicalPdp, variant);
  }, [canonicalPdp, variant]);

  return {
    diffResult,
    isDiffEnabled: diffToggle,
  };
}

export default useDiff;