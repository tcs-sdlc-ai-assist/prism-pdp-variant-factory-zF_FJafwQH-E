/**
 * Tailoring rule engine for the Prism PDP Variant Factory.
 * Defines how each cohort × behavioral overlay combination transforms PDP sections.
 * All functions are pure and return transformation descriptors for deterministic variant generation.
 *
 * @module tailoringRules
 */

import { TAILORING_DIMENSIONS } from '@/constants/constants.js';

/**
 * @typedef {Object} TransformationDescriptor
 * @property {string} dimension - The tailoring dimension being transformed
 * @property {string} action - The transformation action (e.g., 'emphasize', 'reorder', 'replace', 'augment', 'suppress')
 * @property {string} value - The new or modified value/content
 * @property {string} rationale - Human-readable explanation of why this transformation is applied
 * @property {number} weight - Priority weight for this transformation (0-100)
 */

/**
 * @typedef {Object} HeroLayoutDescriptor
 * @property {string} layout - Layout variant ('standard', 'price-forward', 'media-rich', 'spec-heavy', 'social-proof', 'urgency')
 * @property {string} primaryFocus - The primary content area to emphasize
 * @property {string} rationale - Explanation for layout choice
 */

/**
 * @typedef {Object} PriceEmphasisDescriptor
 * @property {string} display - Display mode ('standard', 'savings-highlight', 'member-price', 'volume-discount', 'student-discount', 'compare-at')
 * @property {boolean} showSavings - Whether to show savings amount
 * @property {boolean} showMemberPrice - Whether to show member-exclusive pricing
 * @property {string} callout - Price-related callout text
 * @property {string} rationale - Explanation for price emphasis choice
 */

/**
 * @typedef {Object} BadgeUrgencyDescriptor
 * @property {string[]} badges - Array of badge labels to display
 * @property {string} urgencyLevel - Urgency level ('none', 'low', 'medium', 'high')
 * @property {string} urgencyMessage - Urgency message text
 * @property {string} rationale - Explanation for badge/urgency choice
 */

/**
 * @typedef {Object} SocialProofDescriptor
 * @property {string} display - Display mode ('standard', 'expanded', 'expert-focused', 'value-focused', 'minimal')
 * @property {boolean} showReviewCount - Whether to show total review count
 * @property {boolean} showExpertReviews - Whether to highlight expert reviews
 * @property {string} highlightCriteria - Criteria for highlighting specific reviews
 * @property {string} rationale - Explanation for social proof choice
 */

/**
 * @typedef {Object} CrossSellDescriptor
 * @property {string} strategy - Cross-sell strategy ('complementary', 'upgrade', 'bundle', 'history-based', 'essentials', 'none')
 * @property {string} heading - Section heading text
 * @property {number} maxItems - Maximum number of cross-sell items
 * @property {string} rationale - Explanation for cross-sell choice
 */

/**
 * @typedef {Object} SpecOrderingDescriptor
 * @property {string[]} prioritizedSpecs - Ordered list of spec keys to show first
 * @property {boolean} expandByDefault - Whether specs section should be expanded
 * @property {string} rationale - Explanation for spec ordering choice
 */

/**
 * @typedef {Object} CTACopyDescriptor
 * @property {string} primaryCTA - Primary call-to-action button text
 * @property {string} secondaryCTA - Secondary call-to-action button text
 * @property {string} tone - CTA tone ('standard', 'urgent', 'value', 'premium', 'friendly')
 * @property {string} rationale - Explanation for CTA copy choice
 */

/**
 * @typedef {Object} MediaSelectionDescriptor
 * @property {string} strategy - Media strategy ('standard', 'lifestyle', 'technical', 'unboxing', 'comparison', 'minimal')
 * @property {number[]} prioritizedIndices - Ordered indices of media items to prioritize
 * @property {boolean} showVideo - Whether to prioritize video content
 * @property {string} rationale - Explanation for media selection choice
 */

/**
 * @typedef {Object} ReviewHighlightDescriptor
 * @property {string} filter - Review filter strategy ('none', 'positive', 'detailed', 'expert', 'value-mention', 'recent')
 * @property {number} maxHighlighted - Maximum number of highlighted reviews
 * @property {string} sortBy - Sort criteria ('relevance', 'rating', 'recency', 'helpfulness')
 * @property {string} rationale - Explanation for review highlight choice
 */

/**
 * @typedef {Object} FullTailoringResult
 * @property {HeroLayoutDescriptor} heroLayout
 * @property {PriceEmphasisDescriptor} priceEmphasis
 * @property {BadgeUrgencyDescriptor} badgeUrgency
 * @property {SocialProofDescriptor} socialProof
 * @property {CrossSellDescriptor} crossSell
 * @property {SpecOrderingDescriptor} specOrdering
 * @property {CTACopyDescriptor} ctaCopy
 * @property {MediaSelectionDescriptor} mediaSelection
 * @property {ReviewHighlightDescriptor} reviewHighlight
 * @property {TransformationDescriptor[]} transformations
 */

/**
 * Cohort-type-specific base rules. Each key maps to a function returning
 * partial tailoring descriptors for that cohort type.
 * @type {Object.<string, function(): Object>}
 */
const COHORT_BASE_RULES = {
  'budget-conscious': () => ({
    heroLayout: {
      layout: 'price-forward',
      primaryFocus: 'price',
      rationale: 'Budget-conscious shoppers respond best to price-forward layouts',
    },
    priceEmphasis: {
      display: 'savings-highlight',
      showSavings: true,
      showMemberPrice: true,
      callout: 'Save more today',
      rationale: 'Emphasize savings to appeal to budget-conscious shoppers',
    },
    badgeUrgency: {
      badges: ['Price Drop', 'Clearance'],
      urgencyLevel: 'medium',
      urgencyMessage: 'Limited-time price',
      rationale: 'Price-related badges drive urgency for budget shoppers',
    },
    ctaCopy: {
      primaryCTA: 'Get This Deal',
      secondaryCTA: 'Save for Later',
      tone: 'value',
      rationale: 'Value-oriented CTA language resonates with budget shoppers',
    },
  }),

  'tech-enthusiast': () => ({
    heroLayout: {
      layout: 'spec-heavy',
      primaryFocus: 'description',
      rationale: 'Tech enthusiasts want detailed specs front and center',
    },
    priceEmphasis: {
      display: 'standard',
      showSavings: false,
      showMemberPrice: false,
      callout: '',
      rationale: 'Tech enthusiasts are less price-sensitive; standard display suffices',
    },
    badgeUrgency: {
      badges: ['Top Rated', 'Expert Pick'],
      urgencyLevel: 'low',
      urgencyMessage: '',
      rationale: 'Tech enthusiasts value expert validation over urgency',
    },
    ctaCopy: {
      primaryCTA: 'Add to Cart',
      secondaryCTA: 'Compare Specs',
      tone: 'standard',
      rationale: 'Standard CTA with comparison option for research-oriented buyers',
    },
  }),

  'first-time-buyer': () => ({
    heroLayout: {
      layout: 'standard',
      primaryFocus: 'media',
      rationale: 'First-time buyers benefit from clear, visual product presentation',
    },
    priceEmphasis: {
      display: 'savings-highlight',
      showSavings: true,
      showMemberPrice: false,
      callout: 'Welcome offer available',
      rationale: 'Introductory offers encourage first purchase conversion',
    },
    badgeUrgency: {
      badges: ['New Customer Deal', 'Starter Bundle'],
      urgencyLevel: 'low',
      urgencyMessage: '',
      rationale: 'Welcoming badges reduce purchase anxiety for new buyers',
    },
    ctaCopy: {
      primaryCTA: 'Buy Now',
      secondaryCTA: 'Learn More',
      tone: 'friendly',
      rationale: 'Friendly, approachable CTA language for first-time buyers',
    },
  }),

  'loyalty-member': () => ({
    heroLayout: {
      layout: 'price-forward',
      primaryFocus: 'price',
      rationale: 'Loyalty members expect to see their exclusive pricing prominently',
    },
    priceEmphasis: {
      display: 'member-price',
      showSavings: true,
      showMemberPrice: true,
      callout: 'Exclusive member price',
      rationale: 'Member pricing reinforces loyalty program value',
    },
    badgeUrgency: {
      badges: ['Member Exclusive', 'Loyalty Reward'],
      urgencyLevel: 'medium',
      urgencyMessage: 'Member-only pricing ends soon',
      rationale: 'Exclusive badges reinforce membership value and drive urgency',
    },
    ctaCopy: {
      primaryCTA: 'Claim Member Price',
      secondaryCTA: 'View Rewards',
      tone: 'premium',
      rationale: 'Premium CTA language reinforces loyalty membership benefits',
    },
  }),

  'gift-shopper': () => ({
    heroLayout: {
      layout: 'media-rich',
      primaryFocus: 'media',
      rationale: 'Gift shoppers respond to lifestyle imagery and gift presentation',
    },
    priceEmphasis: {
      display: 'standard',
      showSavings: false,
      showMemberPrice: false,
      callout: 'Gift-ready packaging available',
      rationale: 'Gift shoppers care more about presentation than savings',
    },
    badgeUrgency: {
      badges: ['Top Gift', 'Gift Ready'],
      urgencyLevel: 'high',
      urgencyMessage: 'Order soon for on-time delivery',
      rationale: 'Delivery urgency is critical for gift purchases',
    },
    ctaCopy: {
      primaryCTA: 'Buy as Gift',
      secondaryCTA: 'Add Gift Wrap',
      tone: 'friendly',
      rationale: 'Gift-oriented CTA language with wrapping option',
    },
  }),

  'business-buyer': () => ({
    heroLayout: {
      layout: 'spec-heavy',
      primaryFocus: 'description',
      rationale: 'Business buyers need enterprise features and specs upfront',
    },
    priceEmphasis: {
      display: 'volume-discount',
      showSavings: true,
      showMemberPrice: false,
      callout: 'Volume pricing available',
      rationale: 'Business buyers look for volume and account discounts',
    },
    badgeUrgency: {
      badges: ['Business Choice', 'Enterprise Ready'],
      urgencyLevel: 'low',
      urgencyMessage: '',
      rationale: 'Business purchases are deliberate; low urgency is appropriate',
    },
    ctaCopy: {
      primaryCTA: 'Request Quote',
      secondaryCTA: 'Contact Sales',
      tone: 'standard',
      rationale: 'Professional CTA language for business procurement flow',
    },
  }),

  'student': () => ({
    heroLayout: {
      layout: 'price-forward',
      primaryFocus: 'price',
      rationale: 'Students are highly price-sensitive and respond to education pricing',
    },
    priceEmphasis: {
      display: 'student-discount',
      showSavings: true,
      showMemberPrice: false,
      callout: 'Student discount applied',
      rationale: 'Education pricing is the primary driver for student purchases',
    },
    badgeUrgency: {
      badges: ['Student Deal', 'Back to School'],
      urgencyLevel: 'medium',
      urgencyMessage: 'Student pricing for a limited time',
      rationale: 'Seasonal urgency aligns with academic calendar',
    },
    ctaCopy: {
      primaryCTA: 'Get Student Price',
      secondaryCTA: 'Verify Student Status',
      tone: 'friendly',
      rationale: 'Approachable CTA with student verification path',
    },
  }),

  'high-value': () => ({
    heroLayout: {
      layout: 'media-rich',
      primaryFocus: 'media',
      rationale: 'High-value customers respond to premium lifestyle imagery',
    },
    priceEmphasis: {
      display: 'member-price',
      showSavings: false,
      showMemberPrice: true,
      callout: 'VIP pricing',
      rationale: 'High-value customers expect exclusive pricing without savings emphasis',
    },
    badgeUrgency: {
      badges: ['VIP Exclusive', 'Early Access'],
      urgencyLevel: 'low',
      urgencyMessage: '',
      rationale: 'High-value customers prefer exclusivity over urgency',
    },
    ctaCopy: {
      primaryCTA: 'Add to Cart',
      secondaryCTA: 'Schedule Consultation',
      tone: 'premium',
      rationale: 'Premium tone with concierge-style secondary action',
    },
  }),

  'bargain-seeker': () => ({
    heroLayout: {
      layout: 'price-forward',
      primaryFocus: 'price',
      rationale: 'Bargain seekers need price as the dominant visual element',
    },
    priceEmphasis: {
      display: 'compare-at',
      showSavings: true,
      showMemberPrice: true,
      callout: 'Lowest price guaranteed',
      rationale: 'Price comparison and guarantees drive bargain seeker confidence',
    },
    badgeUrgency: {
      badges: ['Best Value', 'Price Drop'],
      urgencyLevel: 'high',
      urgencyMessage: 'Price may increase soon',
      rationale: 'High urgency drives faster conversion for bargain seekers',
    },
    ctaCopy: {
      primaryCTA: 'Grab This Deal',
      secondaryCTA: 'Price Match',
      tone: 'urgent',
      rationale: 'Urgent, deal-oriented CTA language for bargain seekers',
    },
  }),

  'returning-customer': () => ({
    heroLayout: {
      layout: 'standard',
      primaryFocus: 'fulfillment',
      rationale: 'Returning customers value fast, familiar purchase flow',
    },
    priceEmphasis: {
      display: 'member-price',
      showSavings: false,
      showMemberPrice: true,
      callout: 'Welcome back',
      rationale: 'Personalized greeting with loyalty pricing for returning customers',
    },
    badgeUrgency: {
      badges: ['Welcome Back', 'Reorder'],
      urgencyLevel: 'low',
      urgencyMessage: '',
      rationale: 'Returning customers need recognition, not pressure',
    },
    ctaCopy: {
      primaryCTA: 'Buy Again',
      secondaryCTA: 'View Order History',
      tone: 'friendly',
      rationale: 'Familiar, friendly CTA for returning customers',
    },
  }),
};

/**
 * Behavioral overlay modifier rules. Each key maps to a function returning
 * partial tailoring overrides for that behavioral overlay.
 * @type {Object.<string, function(): Object>}
 */
const BEHAVIORAL_OVERLAY_RULES = {
  'browse-heavy': () => ({
    socialProof: {
      display: 'expanded',
      showReviewCount: true,
      showExpertReviews: false,
      highlightCriteria: 'most-helpful',
      rationale: 'Browse-heavy users benefit from expanded social proof to aid decision-making',
    },
    crossSell: {
      strategy: 'complementary',
      heading: 'Frequently Viewed Together',
      maxItems: 4,
      rationale: 'Complementary items match browse-heavy browsing patterns',
    },
    specOrdering: {
      prioritizedSpecs: ['screenSize', 'resolution', 'processor', 'storage', 'battery'],
      expandByDefault: true,
      rationale: 'Browse-heavy users want specs expanded for quick scanning',
    },
    mediaSelection: {
      strategy: 'standard',
      prioritizedIndices: [0, 1, 2, 3],
      showVideo: false,
      rationale: 'Standard media order for browse-heavy users who scan quickly',
    },
    reviewHighlight: {
      filter: 'detailed',
      maxHighlighted: 3,
      sortBy: 'helpfulness',
      rationale: 'Detailed reviews help browse-heavy users make informed decisions',
    },
  }),

  'comparison-shopper': () => ({
    socialProof: {
      display: 'expert-focused',
      showReviewCount: true,
      showExpertReviews: true,
      highlightCriteria: 'expert-reviews',
      rationale: 'Comparison shoppers trust expert reviews for validation',
    },
    crossSell: {
      strategy: 'upgrade',
      heading: 'Compare Similar Products',
      maxItems: 3,
      rationale: 'Upgrade suggestions facilitate comparison shopping behavior',
    },
    specOrdering: {
      prioritizedSpecs: ['processor', 'memory', 'storage', 'display', 'resolution', 'battery'],
      expandByDefault: true,
      rationale: 'Comparison shoppers need specs expanded and ordered by importance',
    },
    mediaSelection: {
      strategy: 'technical',
      prioritizedIndices: [0, 2, 1, 3],
      showVideo: true,
      rationale: 'Technical media views support comparison evaluation',
    },
    reviewHighlight: {
      filter: 'expert',
      maxHighlighted: 3,
      sortBy: 'rating',
      rationale: 'Expert reviews provide the validation comparison shoppers seek',
    },
  }),

  'deal-seeker': () => ({
    socialProof: {
      display: 'value-focused',
      showReviewCount: true,
      showExpertReviews: false,
      highlightCriteria: 'value-mention',
      rationale: 'Deal seekers want reviews that confirm value for money',
    },
    crossSell: {
      strategy: 'bundle',
      heading: 'Bundle & Save',
      maxItems: 3,
      rationale: 'Bundle deals appeal to deal-seeking behavior',
    },
    specOrdering: {
      prioritizedSpecs: ['storage', 'battery', 'display', 'weight'],
      expandByDefault: false,
      rationale: 'Deal seekers focus on key value specs, not full details',
    },
    mediaSelection: {
      strategy: 'standard',
      prioritizedIndices: [0, 1, 2],
      showVideo: false,
      rationale: 'Standard media is sufficient for deal-focused evaluation',
    },
    reviewHighlight: {
      filter: 'value-mention',
      maxHighlighted: 2,
      sortBy: 'relevance',
      rationale: 'Reviews mentioning value reinforce deal-seeker confidence',
    },
  }),

  'cart-abandoner': () => ({
    socialProof: {
      display: 'expanded',
      showReviewCount: true,
      showExpertReviews: false,
      highlightCriteria: 'positive',
      rationale: 'Positive social proof helps overcome cart abandonment hesitation',
    },
    crossSell: {
      strategy: 'none',
      heading: '',
      maxItems: 0,
      rationale: 'Minimize distractions for cart abandoners to focus on primary product',
    },
    specOrdering: {
      prioritizedSpecs: ['storage', 'display', 'battery'],
      expandByDefault: false,
      rationale: 'Cart abandoners already researched; minimal spec display needed',
    },
    mediaSelection: {
      strategy: 'lifestyle',
      prioritizedIndices: [0, 3, 1],
      showVideo: false,
      rationale: 'Lifestyle imagery reinforces emotional connection for cart recovery',
    },
    reviewHighlight: {
      filter: 'positive',
      maxHighlighted: 2,
      sortBy: 'recency',
      rationale: 'Recent positive reviews reduce purchase anxiety for abandoners',
    },
  }),

  'seasonal-browser': () => ({
    socialProof: {
      display: 'standard',
      showReviewCount: true,
      showExpertReviews: false,
      highlightCriteria: 'gift-mention',
      rationale: 'Gift-related reviews help seasonal browsers evaluate gift suitability',
    },
    crossSell: {
      strategy: 'complementary',
      heading: 'Complete the Gift',
      maxItems: 4,
      rationale: 'Complementary items help seasonal browsers build gift packages',
    },
    specOrdering: {
      prioritizedSpecs: ['color', 'dimensions', 'weight', 'connectivity'],
      expandByDefault: false,
      rationale: 'Seasonal browsers care about physical attributes for gifting',
    },
    mediaSelection: {
      strategy: 'lifestyle',
      prioritizedIndices: [0, 3, 2, 1],
      showVideo: true,
      rationale: 'Lifestyle and unboxing media appeal to gift shoppers',
    },
    reviewHighlight: {
      filter: 'positive',
      maxHighlighted: 2,
      sortBy: 'recency',
      rationale: 'Recent positive reviews validate gift choice for seasonal browsers',
    },
  }),

  'bulk-researcher': () => ({
    socialProof: {
      display: 'minimal',
      showReviewCount: false,
      showExpertReviews: true,
      highlightCriteria: 'enterprise-use',
      rationale: 'Bulk researchers value enterprise-focused expert opinions',
    },
    crossSell: {
      strategy: 'essentials',
      heading: 'Business Essentials',
      maxItems: 5,
      rationale: 'Business essentials support bulk procurement workflows',
    },
    specOrdering: {
      prioritizedSpecs: ['processor', 'memory', 'storage', 'connectivity', 'weight', 'os'],
      expandByDefault: true,
      rationale: 'Bulk researchers need full spec visibility for procurement decisions',
    },
    mediaSelection: {
      strategy: 'technical',
      prioritizedIndices: [0, 2, 1],
      showVideo: false,
      rationale: 'Technical views support enterprise evaluation criteria',
    },
    reviewHighlight: {
      filter: 'detailed',
      maxHighlighted: 2,
      sortBy: 'helpfulness',
      rationale: 'Detailed reviews support bulk purchase justification',
    },
  }),

  'brand-loyalist': () => ({
    socialProof: {
      display: 'expanded',
      showReviewCount: true,
      showExpertReviews: true,
      highlightCriteria: 'brand-positive',
      rationale: 'Brand loyalists appreciate validation of their brand preference',
    },
    crossSell: {
      strategy: 'complementary',
      heading: 'More from This Brand',
      maxItems: 4,
      rationale: 'Same-brand recommendations align with brand loyalty behavior',
    },
    specOrdering: {
      prioritizedSpecs: ['display', 'processor', 'storage', 'audio'],
      expandByDefault: false,
      rationale: 'Brand loyalists trust the brand; moderate spec detail suffices',
    },
    mediaSelection: {
      strategy: 'lifestyle',
      prioritizedIndices: [0, 1, 3, 2],
      showVideo: true,
      rationale: 'Premium lifestyle imagery reinforces brand affinity',
    },
    reviewHighlight: {
      filter: 'positive',
      maxHighlighted: 3,
      sortBy: 'rating',
      rationale: 'Positive reviews reinforce brand loyalty and purchase confidence',
    },
  }),

  'quick-purchaser': () => ({
    socialProof: {
      display: 'minimal',
      showReviewCount: false,
      showExpertReviews: false,
      highlightCriteria: 'none',
      rationale: 'Quick purchasers do not need social proof; minimize friction',
    },
    crossSell: {
      strategy: 'history-based',
      heading: 'Based on Your History',
      maxItems: 2,
      rationale: 'History-based suggestions are relevant and quick to evaluate',
    },
    specOrdering: {
      prioritizedSpecs: ['storage', 'color'],
      expandByDefault: false,
      rationale: 'Quick purchasers need minimal spec info; they already know the product',
    },
    mediaSelection: {
      strategy: 'minimal',
      prioritizedIndices: [0],
      showVideo: false,
      rationale: 'Single hero image is sufficient for quick purchasers',
    },
    reviewHighlight: {
      filter: 'none',
      maxHighlighted: 0,
      sortBy: 'relevance',
      rationale: 'Quick purchasers skip reviews; no highlighting needed',
    },
  }),
};

/**
 * Default social proof descriptor when no behavioral overlay match is found
 * @returns {SocialProofDescriptor}
 */
function getDefaultSocialProof() {
  return {
    display: 'standard',
    showReviewCount: true,
    showExpertReviews: false,
    highlightCriteria: 'none',
    rationale: 'Standard social proof display for unmatched behavioral overlay',
  };
}

/**
 * Default cross-sell descriptor when no behavioral overlay match is found
 * @returns {CrossSellDescriptor}
 */
function getDefaultCrossSell() {
  return {
    strategy: 'complementary',
    heading: 'You Might Also Like',
    maxItems: 3,
    rationale: 'Default complementary cross-sell for unmatched behavioral overlay',
  };
}

/**
 * Default spec ordering descriptor when no behavioral overlay match is found
 * @returns {SpecOrderingDescriptor}
 */
function getDefaultSpecOrdering() {
  return {
    prioritizedSpecs: [],
    expandByDefault: false,
    rationale: 'Default spec ordering for unmatched behavioral overlay',
  };
}

/**
 * Default media selection descriptor when no behavioral overlay match is found
 * @returns {MediaSelectionDescriptor}
 */
function getDefaultMediaSelection() {
  return {
    strategy: 'standard',
    prioritizedIndices: [0, 1, 2, 3],
    showVideo: false,
    rationale: 'Default media selection for unmatched behavioral overlay',
  };
}

/**
 * Default review highlight descriptor when no behavioral overlay match is found
 * @returns {ReviewHighlightDescriptor}
 */
function getDefaultReviewHighlight() {
  return {
    filter: 'none',
    maxHighlighted: 0,
    sortBy: 'relevance',
    rationale: 'Default review highlighting for unmatched behavioral overlay',
  };
}

/**
 * Default hero layout descriptor when no cohort match is found
 * @returns {HeroLayoutDescriptor}
 */
function getDefaultHeroLayout() {
  return {
    layout: 'standard',
    primaryFocus: 'media',
    rationale: 'Default standard layout for unmatched cohort type',
  };
}

/**
 * Default price emphasis descriptor when no cohort match is found
 * @returns {PriceEmphasisDescriptor}
 */
function getDefaultPriceEmphasis() {
  return {
    display: 'standard',
    showSavings: false,
    showMemberPrice: false,
    callout: '',
    rationale: 'Default standard price display for unmatched cohort type',
  };
}

/**
 * Default badge/urgency descriptor when no cohort match is found
 * @returns {BadgeUrgencyDescriptor}
 */
function getDefaultBadgeUrgency() {
  return {
    badges: [],
    urgencyLevel: 'none',
    urgencyMessage: '',
    rationale: 'Default no badges for unmatched cohort type',
  };
}

/**
 * Default CTA copy descriptor when no cohort match is found
 * @returns {CTACopyDescriptor}
 */
function getDefaultCTACopy() {
  return {
    primaryCTA: 'Add to Cart',
    secondaryCTA: 'Save for Later',
    tone: 'standard',
    rationale: 'Default standard CTA for unmatched cohort type',
  };
}

/**
 * Resolves the cohort base rules for a given cohort type.
 * Returns default descriptors if the cohort type is not recognized.
 *
 * @param {string} cohortType - The cohort type identifier
 * @returns {Object} Partial tailoring descriptors for the cohort
 */
export function getCohortBaseRules(cohortType) {
  if (!cohortType || typeof cohortType !== 'string') {
    return {
      heroLayout: getDefaultHeroLayout(),
      priceEmphasis: getDefaultPriceEmphasis(),
      badgeUrgency: getDefaultBadgeUrgency(),
      ctaCopy: getDefaultCTACopy(),
    };
  }

  const ruleFactory = COHORT_BASE_RULES[cohortType];
  if (typeof ruleFactory === 'function') {
    return ruleFactory();
  }

  return {
    heroLayout: getDefaultHeroLayout(),
    priceEmphasis: getDefaultPriceEmphasis(),
    badgeUrgency: getDefaultBadgeUrgency(),
    ctaCopy: getDefaultCTACopy(),
  };
}

/**
 * Resolves the behavioral overlay rules for a given overlay type.
 * Returns default descriptors if the overlay type is not recognized.
 *
 * @param {string} behavioralOverlay - The behavioral overlay identifier
 * @returns {Object} Partial tailoring descriptors for the behavioral overlay
 */
export function getBehavioralOverlayRules(behavioralOverlay) {
  if (!behavioralOverlay || typeof behavioralOverlay !== 'string') {
    return {
      socialProof: getDefaultSocialProof(),
      crossSell: getDefaultCrossSell(),
      specOrdering: getDefaultSpecOrdering(),
      mediaSelection: getDefaultMediaSelection(),
      reviewHighlight: getDefaultReviewHighlight(),
    };
  }

  const ruleFactory = BEHAVIORAL_OVERLAY_RULES[behavioralOverlay];
  if (typeof ruleFactory === 'function') {
    return ruleFactory();
  }

  return {
    socialProof: getDefaultSocialProof(),
    crossSell: getDefaultCrossSell(),
    specOrdering: getDefaultSpecOrdering(),
    mediaSelection: getDefaultMediaSelection(),
    reviewHighlight: getDefaultReviewHighlight(),
  };
}

/**
 * Merges cohort base rules and behavioral overlay rules into a complete
 * tailoring result for a given cohort × behavior combination.
 *
 * @param {string} cohortType - The cohort type identifier
 * @param {string} behavioralOverlay - The behavioral overlay identifier
 * @returns {FullTailoringResult} Complete tailoring result with all descriptors and transformations
 */
export function getTailoringRules(cohortType, behavioralOverlay) {
  const cohortRules = getCohortBaseRules(cohortType);
  const overlayRules = getBehavioralOverlayRules(behavioralOverlay);

  const merged = {
    heroLayout: cohortRules.heroLayout || getDefaultHeroLayout(),
    priceEmphasis: cohortRules.priceEmphasis || getDefaultPriceEmphasis(),
    badgeUrgency: cohortRules.badgeUrgency || getDefaultBadgeUrgency(),
    ctaCopy: cohortRules.ctaCopy || getDefaultCTACopy(),
    socialProof: overlayRules.socialProof || getDefaultSocialProof(),
    crossSell: overlayRules.crossSell || getDefaultCrossSell(),
    specOrdering: overlayRules.specOrdering || getDefaultSpecOrdering(),
    mediaSelection: overlayRules.mediaSelection || getDefaultMediaSelection(),
    reviewHighlight: overlayRules.reviewHighlight || getDefaultReviewHighlight(),
    transformations: [],
  };

  merged.transformations = buildTransformations(merged, cohortType, behavioralOverlay);

  return merged;
}

/**
 * Builds an array of TransformationDescriptor objects from the merged tailoring result.
 * Maps each tailoring section to the appropriate TAILORING_DIMENSIONS entries.
 *
 * @param {Object} mergedRules - The merged cohort + overlay rules
 * @param {string} cohortType - The cohort type identifier
 * @param {string} behavioralOverlay - The behavioral overlay identifier
 * @returns {TransformationDescriptor[]} Array of transformation descriptors
 */
function buildTransformations(mergedRules, cohortType, behavioralOverlay) {
  const transformations = [];

  if (mergedRules.priceEmphasis && mergedRules.priceEmphasis.display !== 'standard') {
    transformations.push({
      dimension: 'price',
      action: 'emphasize',
      value: mergedRules.priceEmphasis.display,
      rationale: mergedRules.priceEmphasis.rationale,
      weight: getEmphasisWeight(cohortType, 'price'),
    });
  }

  if (mergedRules.badgeUrgency && mergedRules.badgeUrgency.badges.length > 0) {
    transformations.push({
      dimension: 'badge',
      action: 'replace',
      value: mergedRules.badgeUrgency.badges.join(', '),
      rationale: mergedRules.badgeUrgency.rationale,
      weight: getEmphasisWeight(cohortType, 'badge'),
    });
  }

  if (mergedRules.mediaSelection && mergedRules.mediaSelection.strategy !== 'standard') {
    transformations.push({
      dimension: 'media',
      action: 'reorder',
      value: mergedRules.mediaSelection.strategy,
      rationale: mergedRules.mediaSelection.rationale,
      weight: getEmphasisWeight(cohortType, 'media'),
    });
  }

  if (mergedRules.heroLayout && mergedRules.heroLayout.layout !== 'standard') {
    transformations.push({
      dimension: 'description',
      action: 'augment',
      value: `Layout: ${mergedRules.heroLayout.layout}, Focus: ${mergedRules.heroLayout.primaryFocus}`,
      rationale: mergedRules.heroLayout.rationale,
      weight: getEmphasisWeight(cohortType, 'description'),
    });
  }

  if (mergedRules.ctaCopy && mergedRules.ctaCopy.tone !== 'standard') {
    transformations.push({
      dimension: 'title',
      action: 'augment',
      value: `CTA: ${mergedRules.ctaCopy.primaryCTA}`,
      rationale: mergedRules.ctaCopy.rationale,
      weight: getEmphasisWeight(cohortType, 'title'),
    });
  }

  if (mergedRules.socialProof && mergedRules.socialProof.display !== 'standard') {
    transformations.push({
      dimension: 'rating',
      action: 'emphasize',
      value: mergedRules.socialProof.display,
      rationale: mergedRules.socialProof.rationale,
      weight: getEmphasisWeight(cohortType, 'rating'),
    });
  }

  if (mergedRules.crossSell && mergedRules.crossSell.strategy !== 'none') {
    transformations.push({
      dimension: 'accessories',
      action: 'augment',
      value: `${mergedRules.crossSell.strategy}: ${mergedRules.crossSell.heading}`,
      rationale: mergedRules.crossSell.rationale,
      weight: getEmphasisWeight(cohortType, 'accessories'),
    });
  }

  if (mergedRules.badgeUrgency && mergedRules.badgeUrgency.urgencyLevel !== 'none') {
    transformations.push({
      dimension: 'promotion',
      action: 'emphasize',
      value: mergedRules.badgeUrgency.urgencyMessage || `Urgency: ${mergedRules.badgeUrgency.urgencyLevel}`,
      rationale: mergedRules.badgeUrgency.rationale,
      weight: getEmphasisWeight(cohortType, 'promotion'),
    });
  }

  if (mergedRules.specOrdering && mergedRules.specOrdering.expandByDefault) {
    transformations.push({
      dimension: 'fulfillment',
      action: 'augment',
      value: `Specs expanded, prioritized: ${mergedRules.specOrdering.prioritizedSpecs.join(', ')}`,
      rationale: mergedRules.specOrdering.rationale,
      weight: getEmphasisWeight(cohortType, 'fulfillment'),
    });
  }

  return transformations;
}

/**
 * Returns a deterministic emphasis weight for a given cohort type and dimension.
 * Uses a simple hash-based approach for reproducibility.
 *
 * @param {string} cohortType - The cohort type identifier
 * @param {string} dimension - The tailoring dimension
 * @returns {number} Weight value between 0 and 100
 */
function getEmphasisWeight(cohortType, dimension) {
  const cohortStr = cohortType || 'default';
  const dimStr = dimension || 'default';

  let hash = 0;
  const combined = `${cohortStr}:${dimStr}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }

  return Math.abs(hash % 61) + 40;
}

/**
 * Applies tailoring emphasis overrides from a cohort target's tailoringEmphasis
 * configuration to the base tailoring rules. Returns a modified copy of the
 * tailoring result with adjusted weights.
 *
 * @param {FullTailoringResult} baseTailoring - The base tailoring result from getTailoringRules
 * @param {Object.<string, { weight: number, strategy: string }>} emphasisOverrides - Per-dimension emphasis overrides
 * @returns {FullTailoringResult} Modified tailoring result with applied overrides
 */
export function applyEmphasisOverrides(baseTailoring, emphasisOverrides) {
  if (!baseTailoring || typeof baseTailoring !== 'object') {
    return baseTailoring;
  }

  if (!emphasisOverrides || typeof emphasisOverrides !== 'object' || Array.isArray(emphasisOverrides)) {
    return baseTailoring;
  }

  const result = {
    ...baseTailoring,
    transformations: baseTailoring.transformations.map((t) => ({ ...t })),
  };

  const overrideKeys = Object.keys(emphasisOverrides);

  for (const key of overrideKeys) {
    if (!TAILORING_DIMENSIONS.includes(key)) {
      continue;
    }

    const override = emphasisOverrides[key];
    if (!override || typeof override !== 'object') {
      continue;
    }

    const existingIndex = result.transformations.findIndex((t) => t.dimension === key);

    if (existingIndex >= 0) {
      if (typeof override.weight === 'number' && Number.isFinite(override.weight)) {
        result.transformations[existingIndex].weight = Math.max(0, Math.min(100, override.weight));
      }
      if (typeof override.strategy === 'string' && override.strategy.trim().length > 0) {
        result.transformations[existingIndex].rationale = override.strategy;
      }
    } else {
      result.transformations.push({
        dimension: key,
        action: 'emphasize',
        value: typeof override.strategy === 'string' ? override.strategy : key,
        rationale: typeof override.strategy === 'string' ? override.strategy : `Emphasis override for ${key}`,
        weight: typeof override.weight === 'number' && Number.isFinite(override.weight)
          ? Math.max(0, Math.min(100, override.weight))
          : 50,
      });
    }
  }

  result.transformations.sort((a, b) => b.weight - a.weight);

  return result;
}

/**
 * Generates the complete tailoring configuration for a cohort target,
 * including base rules, behavioral overlay rules, and emphasis overrides.
 *
 * @param {Object} cohortTarget - A cohort target object from defaultCohorts
 * @param {string} cohortTarget.cohortType - The cohort type identifier
 * @param {string} cohortTarget.behavioralOverlay - The behavioral overlay identifier
 * @param {Object.<string, { weight: number, strategy: string }>} [cohortTarget.tailoringEmphasis] - Per-dimension emphasis overrides
 * @returns {FullTailoringResult} Complete tailoring result for the cohort target
 */
export function getTailoringForCohortTarget(cohortTarget) {
  if (!cohortTarget || typeof cohortTarget !== 'object') {
    return getTailoringRules('', '');
  }

  const cohortType = cohortTarget.cohortType || '';
  const behavioralOverlay = cohortTarget.behavioralOverlay || '';

  const baseTailoring = getTailoringRules(cohortType, behavioralOverlay);

  if (cohortTarget.tailoringEmphasis && typeof cohortTarget.tailoringEmphasis === 'object') {
    return applyEmphasisOverrides(baseTailoring, cohortTarget.tailoringEmphasis);
  }

  return baseTailoring;
}

/**
 * Returns the list of all supported cohort types
 * @returns {string[]}
 */
export function getSupportedCohortTypes() {
  return Object.keys(COHORT_BASE_RULES);
}

/**
 * Returns the list of all supported behavioral overlays
 * @returns {string[]}
 */
export function getSupportedBehavioralOverlays() {
  return Object.keys(BEHAVIORAL_OVERLAY_RULES);
}

/**
 * Returns the list of all tailoring dimensions from constants
 * @returns {string[]}
 */
export function getTailoringDimensions() {
  return [...TAILORING_DIMENSIONS];
}

const tailoringRules = {
  getTailoringRules,
  getCohortBaseRules,
  getBehavioralOverlayRules,
  applyEmphasisOverrides,
  getTailoringForCohortTarget,
  getSupportedCohortTypes,
  getSupportedBehavioralOverlays,
  getTailoringDimensions,
};

export default tailoringRules;